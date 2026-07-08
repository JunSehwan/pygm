import { signInAnonymously } from "firebase/auth";
import { collection, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { auth, db, storage, sendLms } from "firebaseConfig";
import {
  DEPOSIT_INFO,
  TWOWEEKS_ADMIN_PHONE,
  TWOWEEKS_DASHBOARD_PATH,
  TWOWEEKS_ROUND_ID,
  TWOWEEKS_ROUND_LABEL,
} from "./constants";
import { getAgeFromBirthYear, normalizePhone } from "./helpers";

async function ensureApplicantAuth() {
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}

function safeFileName(name = "file") {
  return String(name).replace(/[\\/#?%*:|"<>]/g, "_");
}

function buildFileMeta(downloadURL, storagePath, file) {
  if (!file) return null;
  return { url: downloadURL, path: storagePath, name: file.name || "", type: file.type || "", size: file.size || 0 };
}

function uploadFile(file, storagePath, onProgress) {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type || "application/octet-stream" });

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

function createAggregateProgressTracker(fileKeys, onUploadProgress) {
  const progressMap = fileKeys.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});

  return (key) => (progress) => {
    progressMap[key] = progress;
    const values = Object.values(progressMap);
    const average = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
    onUploadProgress?.(average);
  };
}

function compactAreaText(areas = []) {
  return Array.isArray(areas) ? areas.join("/") : "";
}

function randomTokenPart(byteLength = 24) {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint8Array(byteLength);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

function createDashboardAccessToken() {
  return `tw_${Date.now().toString(36)}_${randomTokenPart(24)}`.slice(0, 120);
}

function getSiteOrigin() {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SERVICE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "";

  if (configuredOrigin) return configuredOrigin.replace(/\/$/, "");

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return "https://charmingsoup.com";
}

function buildDashboardPath(applicationId, token) {
  const params = new URLSearchParams({
    aid: applicationId,
    token,
  });

  return `${TWOWEEKS_DASHBOARD_PATH}?${params.toString()}`;
}

function buildDashboardUrl(applicationId, token) {
  return `${getSiteOrigin()}${buildDashboardPath(applicationId, token)}`;
}

function buildApplicantSms(dashboardUrl) {
  return [
    "[투윅스] 신청이 완료되었습니다.",
    "예치금 20,000원 입금 확인 및 신청 정보 검토 후 개별 안내드리겠습니다.",
    "입금계좌: 하나은행 112-891138-99107 전세환",
    "",
    "신청현황 확인:",
    dashboardUrl,
    "",
    "위 링크를 누르면 별도 로그인 없이 신청 현황을 확인할 수 있습니다.",
  ].join("\n");
}

function buildAdminSms(form, applicationId) {
  const gender = form.gender === "male" ? "남" : form.gender === "female" ? "여" : "-";
  return [
    "[투윅스] 신규 신청 도착",
    `${form.name?.trim() || "-"} / ${form.nickname?.trim() || "-"} / ${gender} / ${form.birthYear || "-"}`,
    `연락처: ${form.phone || "-"}`,
    `지역: ${compactAreaText(form.activityAreas) || "-"}`,
    `신청ID: ${applicationId}`,
  ].join("\n");
}

async function sendApplicationNotifications({ form, applicationId, applicationRef, dashboardUrl }) {
  const applicantPhone = normalizePhone(form.phone);
  const results = {
    applicant: { status: "skipped" },
    admin: { status: "skipped" },
  };

  try {
    if (applicantPhone) {
      await sendLms(applicantPhone, buildApplicantSms(dashboardUrl), "투윅스 신청 완료", { forceLms: true });
      results.applicant = { status: "sent", sentAtClient: new Date().toISOString(), dashboardUrlIncluded: true };
    }
  } catch (error) {
    console.error("[TwoWeeks] applicant sms failed:", error);
    results.applicant = { status: "failed", errorMessage: error?.message || String(error), dashboardUrlIncluded: true };
  }

  try {
    await sendLms(TWOWEEKS_ADMIN_PHONE, buildAdminSms(form, applicationId), "투윅스 신규 신청", { forceLms: true });
    results.admin = { status: "sent", sentAtClient: new Date().toISOString() };
  } catch (error) {
    console.error("[TwoWeeks] admin sms failed:", error);
    results.admin = { status: "failed", errorMessage: error?.message || String(error) };
  }

  const allSent = results.applicant.status === "sent" && results.admin.status === "sent";
  const anyFailed = results.applicant.status === "failed" || results.admin.status === "failed";

  await updateDoc(applicationRef, {
    completionSmsStatus: allSent ? "sent" : anyFailed ? "partial_failed" : "skipped",
    smsNotifications: results,
    smsNotificationUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return results;
}

export async function createTwoWeeksApplication(form, options = {}) {
  const { onUploadProgress, onStatusChange } = options;

  onStatusChange?.("신청 준비 중입니다.");
  onUploadProgress?.(0);

  const applicant = await ensureApplicantAuth();
  const applicationRef = doc(collection(db, "twoweeksApplications"));
  const applicationId = applicationRef.id;
  const dashboardToken = createDashboardAccessToken();
  const dashboardPath = buildDashboardPath(applicationId, dashboardToken);
  const dashboardUrl = buildDashboardUrl(applicationId, dashboardToken);
  const basePath = `twoweeksApplications/${applicationId}/${applicant.uid}`;

  const additionalPhotoFiles = (form.additionalPhotos || []).filter(Boolean);
  const fileKeys = ["representativePhoto", ...additionalPhotoFiles.map((_, index) => `additionalPhoto_${index}`), "verificationDocument"];
  const track = createAggregateProgressTracker(fileKeys, onUploadProgress);

  onStatusChange?.("사진과 인증 자료를 업로드 중입니다.");

  const representativePhoto = await uploadFile(
    form.representativePhoto,
    `${basePath}/photos/representative_${Date.now()}_${safeFileName(form.representativePhoto.name)}`,
    track("representativePhoto")
  );

  const additionalPhotos = await Promise.all(
    additionalPhotoFiles.map((file, index) =>
      uploadFile(file, `${basePath}/photos/additional_${index + 1}_${Date.now()}_${safeFileName(file.name)}`, track(`additionalPhoto_${index}`))
    )
  );

  const verificationDocument = await uploadFile(
    form.verificationDocument,
    `${basePath}/verification/verification_${Date.now()}_${safeFileName(form.verificationDocument.name)}`,
    track("verificationDocument")
  );

  onStatusChange?.("신청 정보를 저장 중입니다.");

  const birthYear = Number(form.birthYear);
  const age = getAgeFromBirthYear(birthYear);
  const phoneNormalized = normalizePhone(form.phone);

  const applicationData = {
    schemaVersion: 3,
    source: "twoweeks_mvp_web",
    roundId: TWOWEEKS_ROUND_ID,
    roundLabel: TWOWEEKS_ROUND_LABEL,

    uid: applicant.uid,
    applicantAuthProvider: applicant.isAnonymous ? "anonymous" : "firebase_auth",

    status: "applied",
    reviewStatus: "pending",
    matchingStatus: "not_started",
    proposalCount: 0,
    rematchingPriority: false,

    completionSmsStatus: "pending",
    inquiryLinkClicked: false,

    dashboardAccess: {
      method: "sms_magic_link",
      token: dashboardToken,
      path: dashboardPath,
      url: dashboardUrl,
      revoked: false,
      createdAtClient: new Date().toISOString(),
      sessionTtlDays: 7,
      note: "문자 링크 기반 신청현황 조회용 토큰입니다.",
    },

    basic: {
      gender: form.gender,
      name: form.name.trim(),
      nickname: form.nickname.trim(),
      birthYear,
      age,
      phone: form.phone,
      phoneNormalized,
      phoneVerified: form.phoneVerified === true,
      phoneVerificationSkipped: form.phoneVerificationSkipped !== false,
      activityAreas: form.activityAreas,
      preferredArea: form.preferredArea,
      maritalStatus: form.maritalStatus,
      availableTimeSlots: form.availableTimeSlots,
      height: form.height ? Number(form.height) : null,
      introduction: form.introduction?.trim() || "",
    },

    phoneIdentityVerification: form.identityVerifiedData?.verified
      ? {
          verified: true,
          provider: form.identityVerifiedData.provider || "PORTONE",
          phone: form.identityVerifiedData.phone || phoneNormalized,
          name: form.identityVerifiedData.name || "",
          birth: form.identityVerifiedData.birth || "",
          gender: form.identityVerifiedData.gender || "",
          carrier: form.identityVerifiedData.carrier || "",
          ci: form.identityVerifiedData.ci || "",
          di: form.identityVerifiedData.di || "",
          verifiedAtClient: form.identityVerifiedData.verifiedAtClient || null,
        }
      : {
          verified: false,
          skipped: form.phoneVerificationSkipped !== false,
        },

    identity: {
      jobCategory: form.jobCategory,
      organizationName: form.organizationName.trim(),
      representativePhoto,
      additionalPhotos,
      verificationDocument,
    },

    deposit: {
      ...DEPOSIT_INFO,
      status: "pending",
      purpose: "신청 진정성 확인 및 노쇼 방지",
      policySnapshot: {
        matchingFailedCarryOverDefault: true,
        matchingFailedRefundOnRequest: true,
        noShowOrSameDayCancelNonRefundable: true,
        normalParticipationRefundOrCarryOver: true,
      },
    },

    disclosurePolicySnapshot: {
      proposalStage: "대표 사진 1장과 기본 정보 일부 공개",
      contactDisclosure: "바이트미팅 후 상호 연결 희망 시 공개",
      identityDocumentDisclosure: "상대방에게 공개하지 않음",
      organizationDisclosure: "운영자 인증용, 상대방에게 공개하지 않음",
    },

    consents: {
      privacy: form.consents.privacy === true,
      profileContact: form.consents.profileContact === true,
      noShowDeposit: form.consents.noShowDeposit === true,
      falseInfo: form.consents.falseInfo === true,
      marketing: form.consents.marketing === true,
      agreedAtClient: new Date().toISOString(),
    },

    completedAtClient: new Date().toISOString(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    submittedAt: serverTimestamp(),
  };

  await setDoc(applicationRef, applicationData);

  onStatusChange?.("신청 완료 문자를 발송 중입니다.");
  await sendApplicationNotifications({ form, applicationId, applicationRef, dashboardUrl });

  onUploadProgress?.(100);
  onStatusChange?.("업로드 성공");

  return { applicationId, uid: applicant.uid, dashboardToken, dashboardPath, dashboardUrl };
}

export async function markInquiryClicked(applicationId) {
  if (!applicationId) return;

  await updateDoc(doc(db, "twoweeksApplications", applicationId), {
    inquiryLinkClicked: true,
    inquiryLinkClickedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
