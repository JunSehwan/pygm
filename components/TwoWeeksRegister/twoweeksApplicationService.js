import { signInAnonymously } from "firebase/auth";
import { collection, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth, db, storage, sendLms } from "firebaseConfig";
import {
  DEPOSIT_INFO,
  TWOWEEKS_ADMIN_PHONE,
  TWOWEEKS_DASHBOARD_PATH,
  TWOWEEKS_ROUND_ID,
  TWOWEEKS_ROUND_LABEL,
} from "./constants";
import { TWOWEEKS_DEPOSIT_AMOUNT, getDepositPolicySnapshot } from "../TwoWeeksShared/depositPolicy";
import { getFullAgeFromBirth, normalizePhone, normalizeTimeSlotLabels } from "./helpers";
import { isTwoWeeksTestPhone } from "../TwoWeeksShared/testAuth";
import { getRegistrationAttribution, getTwoWeeksInvite } from "lib/twoWeeksAttribution";
import {
  TWOWEEKS_MAX_PROFILE_PHOTOS,
  TWOWEEKS_MIN_PROFILE_PHOTOS,
} from "../TwoWeeksShared/profilePhotoPolicy";

async function ensureApplicantAuth() {
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}

// 만료/세션 불일치는 예상 가능한 가입 흐름으로 UI에서 재인증 화면을 엽니다.
export function isTwoWeeksReverificationError(error) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "");
  return error?.requiresReverification === true ||
    code.includes("deadline-exceeded") ||
    code.includes("identity-expired") ||
    (/본인인증|인증 세션|로그인 세션|인증 확인정보/.test(message) &&
      /지났|만료|없습|다시|일치하지|달라졌/.test(message));
}

async function validateApplicationSubmissionIdentity({ applicant, verifiedIdentity, phoneNormalized, testMode }) {
  const functions = getFunctions(undefined, "asia-northeast3");
  const callable = httpsCallable(functions, "validateTwoWeeksApplicationSubmission");

  try {
    const result = await callable({
      identityVerificationId: verifiedIdentity?.identityVerificationId || "",
      phone: phoneNormalized,
      testMode: testMode === true,
    });

    if (result?.data?.ready !== true) {
      throw new Error("본인인증 상태를 확인하지 못했습니다. 다시 본인인증해주세요.");
    }
  } catch (error) {
    const message = String(error?.message || "");
    const cleanMessage = message.replace(/^FirebaseError:\s*/i, "");
    if (isTwoWeeksReverificationError(error)) {
      const retry = new Error(cleanMessage || "본인인증 유효시간이 지났습니다. 다시 인증해주세요.");
      retry.code = "twoweeks/identity-expired";
      retry.requiresReverification = true;
      throw retry;
    }
    if (
      message.includes("본인인증") ||
      message.includes("인증 세션") ||
      message.includes("연락처") ||
      message.includes("이미 가입") ||
      message.includes("기존 신청") ||
      String(error?.code || "").includes("already-exists")
    ) {
      throw new Error(cleanMessage);
    }

    console.error("[TwoWeeks] application preflight failed:", {
      uid: applicant?.uid || "",
      code: error?.code || "",
      message,
    });
    throw new Error("신청 저장 준비 중 인증 상태를 확인하지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해주세요.");
  }
}

export async function checkExistingTwoWeeksApplication({ verifiedIdentity, phone }) {
  const applicant = await ensureApplicantAuth();
  try {
    await validateApplicationSubmissionIdentity({
      applicant,
      verifiedIdentity,
      phoneNormalized: normalizePhone(phone),
      testMode: isTwoWeeksTestPhone(phone),
    });
    return { existing: false, reason: "" };
  } catch (error) {
    const message = String(error?.message || "");
    if (message.includes("이미 가입") || message.includes("기존 신청") || message.includes("등록된 신청") ||
      String(error?.code || "").includes("already-exists")) {
      const reason = /본인인증 정보|동일한 본인|동일인|연락처를 변경/.test(message) ? "identity" : "phone";
      return { existing: true, reason };
    }
    throw error;
  }
}

// 이전 호출부 호환 유지
export async function hasExistingTwoWeeksApplication(args) {
  const result = await checkExistingTwoWeeksApplication(args);
  return result.existing;
}

async function finalizeApplicationSubmission({ applicationId, applicationData, verificationDocument }) {
  const functions = getFunctions(undefined, "asia-northeast3");
  const callable = httpsCallable(functions, "finalizeTwoWeeksApplicationSubmission");

  try {
    const result = await callable({
      applicationId,
      application: applicationData,
      verificationDocument,
    });

    if (result?.data?.ok !== true) {
      throw new Error("신청 정보를 저장하지 못했습니다. 다시 시도해주세요.");
    }

    return result.data;
  } catch (error) {
    const message = String(error?.message || "").replace(/^FirebaseError:\s*/i, "");
    console.error("[TwoWeeks] application finalize failed:", {
      code: error?.code || "",
      message,
    });

    // 네트워크 오류와 서버의 확정적 거절을 구별해 파일 정리 여부를 판단합니다.
    const safeError = new Error(message && !message.includes("internal")
      ? message : "신청 정보 저장 중 오류가 발생했습니다. 신청현황을 확인한 뒤 다시 시도해주세요.");
    safeError.code = String(error?.code || "");
    throw safeError;
  }
}

async function cleanupUploadedApplicationFiles(fileMetas = []) {
  const uniquePaths = Array.from(
    new Set(
      fileMetas
        .map((item) => String(item?.path || "").trim())
        .filter(Boolean)
    )
  );

  await Promise.allSettled(
    uniquePaths.map((path) => deleteObject(ref(storage, path)))
  );
}

function safeFileName(name = "file") {
  return String(name).replace(/[\\/#?%*:|"<>]/g, "_");
}

function buildFileMeta(downloadURL, storagePath, file, extra = {}) {
  if (!file) return null;

  return {
    url: downloadURL,
    path: storagePath,
    name: file.name || "",
    type: file.type || "",
    size: file.size || 0,
    ...extra,
  };
}

async function uploadImageFileWithBlurredPreview(file, storagePath, onProgress) {
  // 투윅스는 제안 단계부터 등록 사진을 선명하게 공개한다.
  // 저장 공간과 업로드 시간을 늘리는 별도 블러 프리뷰는 생성하지 않는다.
  return uploadFile(file, storagePath, onProgress);
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

function getSiteOrigin() {
  // 브라우저에서 실행될 때는 현재 origin을 최우선으로 사용한다.
  // localhost/preview에서 운영 도메인으로 튀는 문제를 방지한다.
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  const configuredOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SERVICE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "";

  if (configuredOrigin) return configuredOrigin.replace(/\/$/, "");

  return "https://charmingsoup.com";
}

function buildApplicantSms(dashboardUrl, depositPolicy = "required") {
  const lines = [
    "[투윅스] 소개 신청이 완료됐어요!",
    "작성해주신 프로필을 운영자가 검토한 뒤 안내드릴게요.",
    depositPolicy === "waived"
      ? "현재 모집회차의 만남보증금은 면제됩니다."
      : "만남보증금은 필요한 시점에 별도 안내드릴게요. 지금은 입금하지 않으셔도 됩니다.",
    "",
    "신청현황 조회:",
    dashboardUrl,
    "조회할 때 휴대폰 번호로 발송되는 인증번호 6자리를 입력해주세요.",
  ];
  return lines.join("\n");
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

async function sendApplicationNotifications({ form, applicationId, applicationRef, dashboardUrl, depositPolicy }) {
  const applicantPhone = normalizePhone(form.phone);
  const results = {
    applicant: { status: "skipped" },
    admin: { status: "skipped" },
  };

  try {
    if (isTwoWeeksTestPhone(applicantPhone)) {
      results.applicant = {
        status: "skipped",
        reason: "TEST_PHONE",
        dashboardUrlIncluded: true,
        skippedAtClient: new Date().toISOString(),
      };
    } else if (applicantPhone) {
      await sendLms(applicantPhone, buildApplicantSms(dashboardUrl, depositPolicy), "투윅스 신청 완료", { forceLms: true });
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

  try {
    await updateDoc(applicationRef, {
      completionSmsStatus: allSent ? "sent" : anyFailed ? "partial_failed" : "skipped",
      smsNotifications: results,
      smsNotificationUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    // 신청서 저장 자체는 이미 완료된 상태다. 문자 메타데이터 기록 실패로 고객에게 신청 실패를 보여주지 않는다.
    console.warn("[TwoWeeks] sms metadata update failed:", error?.code || error?.message || error);
  }

  return results;
}

export async function createTwoWeeksApplication(form, options = {}) {
  const { onUploadProgress, onStatusChange } = options;
  const profilePhotoFiles = [form?.representativePhoto, ...(form?.additionalPhotos || [])].filter(Boolean);

  if (profilePhotoFiles.length < TWOWEEKS_MIN_PROFILE_PHOTOS) {
    throw new Error(`프로필 사진은 대표사진 포함 최소 ${TWOWEEKS_MIN_PROFILE_PHOTOS}장을 등록해주세요.`);
  }
  if (profilePhotoFiles.length > TWOWEEKS_MAX_PROFILE_PHOTOS) {
    throw new Error(`프로필 사진은 최대 ${TWOWEEKS_MAX_PROFILE_PHOTOS}장까지 등록할 수 있습니다.`);
  }

  // 서버 최종 검증 전에도 확인해, 동의 누락 상태로 파일을 업로드하는 일을 막습니다.
  const mandatoryKeys = ["privacy", "profileContact", "noShowDeposit", "falseInfo"];
  if (!mandatoryKeys.every((key) => form?.consents?.[key] === true)) {
    throw new Error("필수 약관에 모두 동의한 뒤 신청해주세요.");
  }

  const verifiedIdentity = form?.identityVerifiedData || {};
  const formPhoneNormalized = normalizePhone(form?.phone || "");
  const verifiedPhoneNormalized = normalizePhone(verifiedIdentity?.phone || "");
  const testPhone = isTwoWeeksTestPhone(formPhoneNormalized);

  if (!(form?.phoneVerified === true && verifiedIdentity?.verified === true)) {
    throw new Error("안전한 실제 만남을 위해 본인인증을 완료한 뒤 신청해주세요.");
  }

  if (!formPhoneNormalized || verifiedPhoneNormalized !== formPhoneNormalized) {
    throw new Error("본인인증한 연락처와 신청 연락처가 일치하지 않습니다. 다시 본인인증해주세요.");
  }

  if (!testPhone && !String(verifiedIdentity?.identityVerificationId || "").trim()) {
    throw new Error("본인인증 확인정보가 만료되었습니다. 다시 본인인증해주세요.");
  }

  onStatusChange?.("신청 준비 중입니다.");
  onUploadProgress?.(0);

  const applicant = await ensureApplicantAuth();

  onStatusChange?.("본인인증 상태를 확인 중입니다.");
  await validateApplicationSubmissionIdentity({
    applicant,
    verifiedIdentity,
    phoneNormalized: formPhoneNormalized,
    testMode: testPhone,
  });

  const applicationRef = doc(collection(db, "twoweeksApplications"));
  const applicationId = applicationRef.id;
  const basePath = `twoweeksApplications/${applicationId}/${applicant.uid}`;

  const additionalPhotoFiles = (form.additionalPhotos || []).filter(Boolean);
  const fileKeys = ["representativePhoto", ...additionalPhotoFiles.map((_, index) => `additionalPhoto_${index}`), "verificationDocument"];
  const track = createAggregateProgressTracker(fileKeys, onUploadProgress);

  onStatusChange?.("사진과 인증 자료를 업로드 중입니다.");

  const representativePhoto = await uploadImageFileWithBlurredPreview(
    form.representativePhoto,
    `${basePath}/photos/representative_${Date.now()}_${safeFileName(form.representativePhoto.name)}`,
    track("representativePhoto")
  );

  const additionalPhotos = await Promise.all(
    additionalPhotoFiles.map((file, index) =>
      uploadImageFileWithBlurredPreview(file, `${basePath}/photos/additional_${index + 1}_${Date.now()}_${safeFileName(file.name)}`, track(`additionalPhoto_${index}`))
    )
  );

  const verificationDocument = await uploadFile(
    form.verificationDocument,
    `${basePath}/verification/verification_${Date.now()}_${safeFileName(form.verificationDocument.name)}`,
    track("verificationDocument")
  );

  onStatusChange?.("신청 정보를 저장 중입니다.");

  const birthYear = Number(form.birthYear);
  const birthDate = form.identityVerifiedData?.birth || "";
  const age = getFullAgeFromBirth(birthDate, birthYear);
  const phoneNormalized = normalizePhone(form.phone);

  const applicationData = {
    schemaVersion: 4,
    source: "twoweeks_mvp_web",
    testMode: isTwoWeeksTestPhone(phoneNormalized),
    roundId: TWOWEEKS_ROUND_ID,
    roundLabel: TWOWEEKS_ROUND_LABEL,

    uid: applicant.uid,
    applicantAuthProvider: applicant.isAnonymous ? "anonymous" : "firebase_auth",

    status: "applied",
    reviewStatus: "pending",
    matchingStatus: "not_ready",
    proposalCount: 0,
    rematchingPriority: false,

    // 서버에서 등록된 캠페인과 추천회원 여부를 다시 검증한 뒤 정식 필드로 변환한다.
    marketingAttributionInput: getRegistrationAttribution(),
    selfReportedSourceInput: {
      source: form.selfReportedSource || "",
      detail: form.selfReportedSource === "other" ? form.selfReportedSourceDetail?.trim() || "" : "",
    },
    referralInput: {
      inviteCode: getTwoWeeksInvite(),
      name: form.hasReferrer ? form.referrerName?.trim() || "" : "",
      phoneLast4: form.hasReferrer ? String(form.referrerPhoneLast4 || "").replace(/[^0-9]/g, "").slice(-4) : "",
    },

    completionSmsStatus: "pending",
    inquiryLinkClicked: false,

    dashboardAccess: {
      method: "sms_otp",
      revoked: false,
      tokenStoredPrivately: false,
      createdAtClient: new Date().toISOString(),
      sessionTtlDays: 7,
      note: "신청현황 조회는 문자 6자리 OTP 인증을 사용합니다.",
    },

    basic: {
      gender: form.gender,
      name: form.name.trim(),
      nickname: form.nickname.trim(),
      birthYear,
      birthDate,
      age,
      ageType: "full_age",
      phone: form.phone,
      phoneNormalized,
      phoneVerified: true,
      phoneVerificationSkipped: false,
      activityAreas: form.activityAreas,
      preferredArea: form.preferredArea,
      maritalStatus: form.maritalStatus,
      availableTimeSlots: normalizeTimeSlotLabels(form.availableTimeSlots),
      height: form.height ? Number(form.height) : null,
      introduction: form.introduction?.trim() || "",
    },

    matchingPreferences: {
      marriagePlan: form.marriagePlan,
      childrenPlan: form.childrenPlan,
      religion: form.religion,
      religionPreference: form.religionPreference,
      smoking: form.smoking,
      smokingPreference: form.smokingPreference,
      drinkingFrequency: form.drinkingFrequency,
      preferredAgeRange: form.preferredAgeMin && form.preferredAgeMax
        ? { min: Number(form.preferredAgeMin), max: Number(form.preferredAgeMax) }
        : null,
      preferredDrinking: form.preferredDrinking || "",
      preferredStyles: Array.isArray(form.preferredStyles) ? form.preferredStyles.slice(0, 3) : [],
      preferredJobCategories: Array.isArray(form.preferredJobCategories) ? form.preferredJobCategories.slice(0, 2) : [],
      additionalPreference: form.additionalPreference?.trim() || "",
      completed: true,
      updatedAtClient: new Date().toISOString(),
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
          verificationId: form.identityVerifiedData.identityVerificationId || "",
          source: "twoweeks_register",
          // 투윅스 신청서에는 CI/DI 원문을 저장하지 않는다. 본인인증 성공 여부만 사용한다.
          verifiedAtClient: form.identityVerifiedData.verifiedAtClient || null,
        }
      : {
          verified: false,
          skipped: false,
        },

    identity: {
      jobCategory: form.jobCategory,
      companyScale: form.jobCategory === "회사원" ? form.companyScale || "" : "",
      organizationName: form.organizationName.trim(),
      educationLevel: form.educationLevel || "",
      schoolName: form.schoolName?.trim() || "",
      representativePhoto,
      additionalPhotos,
      // 인증 자료 원문 URL은 관리자 전용 문서에 별도 저장한다.
      verificationDocument: null,
      verificationDocumentStoredPrivately: Boolean(verificationDocument),
    },

    profileTraits: {
      mbti: form.mbti || "",
      interests: Array.isArray(form.interests) ? form.interests.slice(0, 3) : [],
    },

    deposit: {
      ...DEPOSIT_INFO,
      policy: form.gender === "female" && TWOWEEKS_ROUND_ID === "twoweeks_beta_1" ? "waived" : "required",
      // 실제 수납은 운영자가 필요한 시점에 별도 요청합니다.
      requestStage: "later",
      requestedAtClient: null,
      status: "pending",
      balance: 0,
      requiredBalance: TWOWEEKS_DEPOSIT_AMOUNT,
      topUpRequiredAmount: TWOWEEKS_DEPOSIT_AMOUNT,
      totalDeposited: 0,
      totalDeducted: 0,
      participationEligible: false,
      history: [],
      purpose: "신청 진정성 확인 및 노쇼 방지",
      policySnapshot: getDepositPolicySnapshot(TWOWEEKS_DEPOSIT_AMOUNT),
    },

    disclosurePolicySnapshot: {
      proposalStage: "등록한 프로필 사진(최소 3장)과 기본 정보 일부 공개",
      profilePhotoMinimum: TWOWEEKS_MIN_PROFILE_PHOTOS,
      profilePhotoMaximum: TWOWEEKS_MAX_PROFILE_PHOTOS,
      contactDisclosure: "바이트소개팅 후 상호 연결 희망 시 공개",
      identityDocumentDisclosure: "상대방에게 공개하지 않음",
      organizationDisclosure: "후보 제안 단계 비공개, 양쪽 만남 진행 의사 확인 후 공개",
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
  };

  onStatusChange?.("신청 정보를 안전하게 저장 중입니다.");

  let finalizeResult = null;
  try {
    finalizeResult = await finalizeApplicationSubmission({
      applicationId,
      applicationData,
      verificationDocument,
    });
  } catch (error) {
    // Callable의 응답만 유실되고 서버 트랜잭션이 이미 성공했을 수 있습니다.
    // 본인 신청서가 실제로 생겼는지 먼저 확인합니다. 저장됐다면 업로드 파일을 삭제하지 않습니다.
    try {
      const saved = await getDoc(applicationRef);
      if (saved.exists() && saved.data()?.uid === applicant.uid) {
        const savedData = saved.data() || {};
        finalizeResult = {
          ok: true,
          applicationId,
          alreadyFinalized: true,
          referralStatus: savedData.referral?.status || "none",
          gender: savedData.basic?.gender || form.gender || "",
          depositPolicy: savedData.deposit?.policy || "required",
        };
      }
    } catch (readError) {
      console.warn("[TwoWeeks] 저장 여부 확인 실패:", readError?.code || readError?.message || readError);
    }

    if (!finalizeResult) {
      // 서버에서 명확히 거절한 경우에만 업로드 임시파일을 정리합니다.
      // 연결 불량 등 결과가 불명확하면 삭제하지 않아 이미 생성된 신청서의 사진을 보호합니다.
      const code = String(error?.code || "");
      const definiteRejection = ["invalid-argument", "failed-precondition", "permission-denied", "already-exists", "unauthenticated"]
        .some((kind) => code === kind || code.endsWith(`/${kind}`));
      if (definiteRejection) {
        await cleanupUploadedApplicationFiles([
          representativePhoto, ...additionalPhotos, verificationDocument,
        ]);
      }
      throw error;
    }
  }

  // 가입 뒤 조회는 반드시 문자 6자리 OTP 인증으로 진행합니다.
  // 과거 magic-link 발급 호출은 신규 가입에서 사용하지 않습니다.
  const dashboardPath = TWOWEEKS_DASHBOARD_PATH;
  const dashboardUrl = `${getSiteOrigin()}${TWOWEEKS_DASHBOARD_PATH}`;

  onStatusChange?.("신청 완료 문자를 발송 중입니다.");
  const depositPolicy = String(finalizeResult?.depositPolicy || applicationData.deposit.policy || "required");
  await sendApplicationNotifications({ form, applicationId, applicationRef, dashboardUrl, depositPolicy });

  onUploadProgress?.(100);
  onStatusChange?.("업로드 성공");

  return {
    applicationId,
    uid: applicant.uid,
    firestoreProjectId: String(finalizeResult?.firestoreProjectId || ""),
    dashboardToken: "",
    dashboardPath,
    dashboardUrl,
    referralStatus: finalizeResult?.referralStatus || "none",
    gender: finalizeResult?.gender || form.gender || "",
    depositPolicy,
  };
}

export async function markInquiryClicked(applicationId) {
  if (!applicationId) return;

  await updateDoc(doc(db, "twoweeksApplications", applicationId), {
    inquiryLinkClicked: true,
    inquiryLinkClickedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
