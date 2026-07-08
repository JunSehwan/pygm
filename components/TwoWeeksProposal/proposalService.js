import { signInAnonymously } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { auth, db, storage, sendLms } from "firebaseConfig";
import { TWOWEEKS_ROUND_ID } from "./constants";
import {
  findBestCandidate,
  formatPhone,
  getApplicationTimeValue,
  isApplicationProfileEditable,
  normalizePhone,
} from "./helpers";

async function ensureAuth() {
  if (auth.currentUser) return auth.currentUser;

  try {
    const credential = await signInAnonymously(auth);
    return credential.user;
  } catch (error) {
    console.warn("[TwoWeeksProposal] anonymous auth unavailable:", error?.code || error?.message || error);
    return null;
  }
}

function isPermissionLikeError(error) {
  return (
    error?.code === "auth/admin-restricted-operation" ||
    error?.code === "permission-denied" ||
    error?.code === "firestore/permission-denied" ||
    String(error?.message || "").includes("Missing or insufficient permissions")
  );
}

function toConsumerError(error, fallback = "잠시 후 다시 시도해주세요.") {
  if (isPermissionLikeError(error)) return new Error(fallback);
  return error instanceof Error ? error : new Error(fallback);
}

function mapDoc(snap) {
  return {
    id: snap.id,
    ...snap.data(),
  };
}

function getStoredDashboardToken(application = {}) {
  return (
    application?.dashboardAccess?.token ||
    application?.access?.dashboardToken ||
    application?.dashboardToken ||
    ""
  );
}

function isDashboardAccessRevoked(application = {}) {
  return application?.dashboardAccess?.revoked === true || application?.access?.revoked === true;
}

async function loadRoundAndBestMatch(viewerApplication) {
  if (!viewerApplication?.id) {
    return {
      viewerApplication: null,
      allApplications: [],
      bestMatch: null,
    };
  }

  const roundId = viewerApplication.roundId || TWOWEEKS_ROUND_ID;

  const roundQuery = query(
    collection(db, "twoweeksApplications"),
    where("roundId", "==", roundId)
  );

  const roundSnap = await getDocs(roundQuery);
  const allApplications = roundSnap.docs.map(mapDoc);
  const bestMatch = findBestCandidate(viewerApplication, allApplications);

  return {
    viewerApplication,
    allApplications,
    bestMatch,
  };
}


async function getApplicationsByPhone(phoneNormalized) {
  const phoneFormatted = formatPhone(phoneNormalized);
  const results = new Map();

  const addResults = (snap) => {
    snap.docs.forEach((docSnap) => results.set(docSnap.id, mapDoc(docSnap)));
  };

  const safeQuery = async (fieldPath, value) => {
    if (!value) return;

    try {
      const snap = await getDocs(
        query(collection(db, "twoweeksApplications"), where(fieldPath, "==", value))
      );
      addResults(snap);
    } catch (error) {
      console.warn(`[TwoWeeksProposal] lookup skipped: ${fieldPath}`, error?.code || error?.message || error);
    }
  };

  const values = Array.from(new Set([phoneNormalized, phoneFormatted].filter(Boolean)));
  const fieldPaths = [
    "basic.phoneNormalized",
    "basic.phone",
    "phoneNormalized",
    "phone",
    "phonenumber",
    "tel",
    "identity.phone",
    "phoneIdentityVerification.phone",
  ];

  for (const fieldPath of fieldPaths) {
    for (const value of values) {
      await safeQuery(fieldPath, value);
    }
  }

  if (!results.size) {
    try {
      const roundSnap = await getDocs(
        query(collection(db, "twoweeksApplications"), where("roundId", "==", TWOWEEKS_ROUND_ID))
      );

      roundSnap.docs
        .map(mapDoc)
        .filter((application) => {
          const candidates = [
            application?.basic?.phoneNormalized,
            application?.basic?.phone,
            application?.phoneNormalized,
            application?.phone,
            application?.phonenumber,
            application?.tel,
            application?.identity?.phone,
            application?.phoneIdentityVerification?.phone,
          ];

          return candidates.some((value) => normalizePhone(value) === phoneNormalized);
        })
        .forEach((application) => results.set(application.id, application));
    } catch (error) {
      console.warn("[TwoWeeksProposal] fallback lookup failed:", error?.code || error?.message || error);
      if (isPermissionLikeError(error)) throw toConsumerError(error);
    }
  }

  return Array.from(results.values());
}

function createLookupCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function buildLookupCodeMessage(code) {
  return [
    `[투윅스] 신청현황 인증번호: ${code}`,
    "5분 안에 입력해주세요.",
  ].join(String.fromCharCode(10));
}

export async function sendDashboardLookupCode(phone) {
  const phoneNormalized = normalizePhone(phone);

  if (!phoneNormalized || phoneNormalized.length < 10) {
    return {
      ok: false,
      code: "INVALID_PHONE",
      message: "휴대폰 번호를 확인해주세요.",
    };
  }

  try {
    await ensureAuth();

    const applications = await getApplicationsByPhone(phoneNormalized);

    if (!applications.length) {
      return {
        ok: false,
        code: "APPLICATION_NOT_FOUND",
        message: "신청내역이 없습니다.",
      };
    }

    const lookupCode = createLookupCode();

    await sendLms(
      phoneNormalized,
      buildLookupCodeMessage(lookupCode),
      "투윅스 신청현황 인증번호",
      { forceLms: false }
    );

    return {
      ok: true,
      phoneNormalized,
      code: lookupCode,
      expiresAt: Date.now() + 5 * 60 * 1000,
      sentAtClient: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[TwoWeeksProposal] lookup code failed:", error?.code || error?.message || error);

    if (isPermissionLikeError(error)) {
      return {
        ok: false,
        code: "AUTH_UNAVAILABLE",
        message: "잠시 후 다시 시도해주세요.",
      };
    }

    return {
      ok: false,
      code: "SMS_OR_LOOKUP_FAILED",
      message: error?.message || "잠시 후 다시 시도해주세요.",
    };
  }
}

export async function loadApplicationByAccessToken({ applicationId, token }) {
  await ensureAuth();

  const cleanApplicationId = String(applicationId || "").trim();
  const cleanToken = String(token || "").trim();

  if (!cleanApplicationId || !cleanToken) {
    throw new Error("신청현황 링크 정보가 올바르지 않습니다.");
  }

  const applicationRef = doc(db, "twoweeksApplications", cleanApplicationId);
  const snap = await getDoc(applicationRef);

  if (!snap.exists()) {
    throw new Error("신청 정보를 찾지 못했습니다.");
  }

  const viewerApplication = mapDoc(snap);
  const storedToken = getStoredDashboardToken(viewerApplication);

  if (!storedToken || storedToken !== cleanToken || isDashboardAccessRevoked(viewerApplication)) {
    throw new Error("신청현황 링크가 만료되었거나 올바르지 않습니다. 문자로 받은 최신 링크를 다시 확인해주세요.");
  }

  await updateDoc(applicationRef, {
    "dashboardAccess.lastOpenedAt": serverTimestamp(),
    "dashboardAccess.lastOpenedAtClient": new Date().toISOString(),
    updatedAt: serverTimestamp(),
  }).catch((error) => {
    console.warn("[TwoWeeksProposal] dashboard access touch failed:", error);
  });

  return loadRoundAndBestMatch(viewerApplication);
}

export async function loadApplicationByVerifiedPhone(phone) {
  await ensureAuth();

  const phoneNormalized = normalizePhone(phone);

  if (!phoneNormalized) {
    throw new Error("본인인증된 연락처를 확인할 수 없습니다.");
  }

  let applications = [];

  try {
    applications = await getApplicationsByPhone(phoneNormalized);
  } catch (error) {
    throw toConsumerError(error);
  }

  if (!applications.length) {
    return {
      viewerApplication: null,
      allApplications: [],
      bestMatch: null,
    };
  }

  const viewerApplication = applications
    .sort((a, b) => getApplicationTimeValue(b) - getApplicationTimeValue(a))[0];

  return loadRoundAndBestMatch(viewerApplication);
}

export async function saveProposalResponse({
  viewerApplication,
  candidateApplication,
  response,
}) {
  await ensureAuth();

  if (!viewerApplication?.id || !candidateApplication?.id) {
    throw new Error("응답을 저장할 매칭 후보 정보가 없습니다.");
  }

  if (!["accepted", "declined"].includes(response)) {
    throw new Error("응답값이 올바르지 않습니다.");
  }

  const responseId = `${viewerApplication.id}_${candidateApplication.id}`;
  const responseRef = doc(db, "twoweeksProposalResponses", responseId);

  await setDoc(
    responseRef,
    {
      roundId: viewerApplication.roundId || TWOWEEKS_ROUND_ID,
      viewerApplicationId: viewerApplication.id,
      candidateApplicationId: candidateApplication.id,
      viewerUid: viewerApplication.uid || "",
      candidateUid: candidateApplication.uid || "",
      viewerGender: viewerApplication.basic?.gender || "",
      candidateGender: candidateApplication.basic?.gender || "",
      response,
      status: response,
      respondedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      policySnapshot: {
        contactOpenAfterMutualConnection: true,
        proposalStageContactPrivate: true,
        photoBlurredAtProposalStage: true,
      },
    },
    { merge: true }
  );

  await updateDoc(doc(db, "twoweeksApplications", viewerApplication.id), {
    currentProposal: {
      candidateApplicationId: candidateApplication.id,
      response,
      respondedAt: serverTimestamp(),
    },
    matchingStatus: response === "accepted" ? "accepted" : "declined",
    updatedAt: serverTimestamp(),
  });

  return {
    responseId,
  };
}

function safeFileName(name = "file") {
  return String(name || "file").replace(/[\\/#?%*:|"<>]/g, "_");
}

function buildFileMeta(downloadURL, storagePath, file) {
  if (!file) return null;
  return {
    url: downloadURL,
    path: storagePath,
    name: file.name || "",
    type: file.type || "",
    size: file.size || 0,
    uploadedAtClient: new Date().toISOString(),
  };
}

function uploadPhotoFile({ application, file, index, onProgress }) {
  return new Promise((resolve, reject) => {
    const currentUser = auth.currentUser;
    const ownerUid = application?.uid || currentUser?.uid || "anonymous";
    const storagePath = `twoweeksApplications/${application.id}/${ownerUid}/profileEdits/photos/edit_${Date.now()}_${index + 1}_${safeFileName(file.name)}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type || "application/octet-stream",
    });

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = snapshot.totalBytes ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) : 0;
        onProgress?.(progress);
      },
      reject,
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onProgress?.(100);
          resolve(buildFileMeta(downloadURL, storagePath, file));
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

async function resolveProfilePhotos({ application, photos = [], onUploadProgress }) {
  const compactPhotos = Array.isArray(photos) ? photos.filter(Boolean).slice(0, 4) : [];
  const newFileItems = compactPhotos.filter((item) => item?.source === "file" && item?.file);
  const progressMap = newFileItems.reduce((acc, item, index) => ({ ...acc, [index]: 0 }), {});

  const updateAverageProgress = (fileIndex) => (progress) => {
    if (!newFileItems.length) {
      onUploadProgress?.(100);
      return;
    }

    progressMap[fileIndex] = progress;
    const values = Object.values(progressMap);
    const average = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 100;
    onUploadProgress?.(average);
  };

  const resolved = [];
  let newFileIndex = 0;

  for (let index = 0; index < compactPhotos.length; index += 1) {
    const item = compactPhotos[index];

    if (item?.source === "existing" && item?.meta?.url) {
      resolved.push(item.meta);
      continue;
    }

    if (item?.source === "file" && item?.file) {
      const uploaded = await uploadPhotoFile({
        application,
        file: item.file,
        index,
        onProgress: updateAverageProgress(newFileIndex),
      });
      newFileIndex += 1;
      resolved.push(uploaded);
      continue;
    }

    resolved.push(null);
  }

  const finalPhotos = resolved.filter(Boolean).slice(0, 4);
  onUploadProgress?.(100);

  return {
    representativePhoto: finalPhotos[0] || null,
    additionalPhotos: finalPhotos.slice(1),
  };
}

export async function updateApplicationProfile({
  application,
  form,
  onUploadProgress,
}) {
  await ensureAuth();

  if (!application?.id) {
    throw new Error("수정할 신청 정보를 찾지 못했습니다.");
  }

  if (!isApplicationProfileEditable(application)) {
    throw new Error("매칭이 확정된 이후에는 프로필을 수정할 수 없습니다.");
  }

  const nickname = form.nickname?.trim() || "";
  const introduction = form.introduction?.trim() || "";
  const organizationName = form.organizationName?.trim() || "";
  const height = form.height ? Number(form.height) : null;

  if (!nickname || nickname.length < 2) {
    throw new Error("닉네임은 2자 이상 입력해주세요.");
  }

  if (!introduction) {
    throw new Error("1줄 자기소개를 입력해주세요.");
  }

  if (!Array.isArray(form.activityAreas) || form.activityAreas.length < 1) {
    throw new Error("활동 가능한 지역을 1개 이상 남겨주세요.");
  }

  if (!form.preferredArea) {
    throw new Error("가장 편한 지역을 선택해주세요.");
  }

  if (!Array.isArray(form.availableTimeSlots) || form.availableTimeSlots.length < 1) {
    throw new Error("가능한 시간대를 1개 이상 남겨주세요.");
  }

  if (height && (height < 130 || height > 230)) {
    throw new Error("키는 130~230cm 범위로 입력해주세요.");
  }

  if (!form.jobCategory) {
    throw new Error("직업군을 선택해주세요.");
  }

  if (!organizationName) {
    throw new Error("회사명 또는 학교명을 입력해주세요.");
  }

  const photoResult = await resolveProfilePhotos({
    application,
    photos: form.photos,
    onUploadProgress,
  });

  if (!photoResult.representativePhoto) {
    throw new Error("대표 사진 1장 이상은 유지해주세요.");
  }

  const nextBasic = {
    ...(application.basic || {}),
    nickname,
    activityAreas: Array.isArray(form.activityAreas) ? form.activityAreas : [],
    preferredArea: form.preferredArea || "",
    availableTimeSlots: Array.isArray(form.availableTimeSlots) ? form.availableTimeSlots : [],
    height,
    introduction,
  };

  const nextIdentity = {
    ...(application.identity || {}),
    jobCategory: form.jobCategory,
    organizationName,
    representativePhoto: photoResult.representativePhoto,
    additionalPhotos: photoResult.additionalPhotos,
  };

  const applicationRef = doc(db, "twoweeksApplications", application.id);

  await updateDoc(applicationRef, {
    "basic.nickname": nextBasic.nickname,
    "basic.activityAreas": nextBasic.activityAreas,
    "basic.preferredArea": nextBasic.preferredArea,
    "basic.availableTimeSlots": nextBasic.availableTimeSlots,
    "basic.height": nextBasic.height,
    "basic.introduction": nextBasic.introduction,
    "identity.jobCategory": nextIdentity.jobCategory,
    "identity.organizationName": nextIdentity.organizationName,
    "identity.representativePhoto": nextIdentity.representativePhoto,
    "identity.additionalPhotos": nextIdentity.additionalPhotos,
    "profileEdit.lastEditedAt": serverTimestamp(),
    "profileEdit.lastEditedAtClient": new Date().toISOString(),
    "profileEdit.editCount": increment(1),
    "profileEdit.editableUntil": "matching_confirmed",
    updatedAt: serverTimestamp(),
  });

  return {
    ...application,
    basic: nextBasic,
    identity: nextIdentity,
    profileEdit: {
      ...(application.profileEdit || {}),
      lastEditedAtClient: new Date().toISOString(),
      editableUntil: "matching_confirmed",
    },
  };
}
