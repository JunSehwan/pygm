const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { assertApplicationOwner } = require("./twoWeeksCallerAuth");
const { sendTwoWeeksAdminSms } = require("./twoWeeksAdminSms");
const {
  TWOWEEKS_MAX_PROFILE_PHOTOS,
  TWOWEEKS_MIN_PROFILE_PHOTOS,
} = require("./twoWeeksProfilePhotoPolicy");

if (!admin.apps.length) admin.initializeApp();

const REGION = "asia-northeast3";
const MAX_PROFILE_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VERIFICATION_IMAGE_BYTES = 15 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ACTIVITY_AREAS = new Set(["강남구", "서초구", "동작구", "관악구", "영등포구"]);
const TIME_SLOTS = new Set(["금요일 저녁", "토요일 낮", "토요일 저녁", "일요일 낮", "일요일 저녁"]);
const JOB_CATEGORIES = new Set(["회사원", "공무원", "전문직", "자영업", "프리랜서", "학생", "기타"]);
const COMPANY_SCALES = new Set(["대기업", "중견기업", "중소기업", "스타트업", "공기업·공공기관", "기타", ""]);
const ENUMS = {
  marriagePlan: new Set(["within_2_years", "within_5_years", "open", "unsure", "no_intent"]),
  childrenPlan: new Set(["definitely", "preferably", "discuss", "no", "unsure"]),
  religion: new Set(["none", "christian", "catholic", "buddhist", "other"]),
  religionPreference: new Set(["same_only", "respect_any", "no_matter", "low_activity"]),
  smoking: new Set(["non_smoker", "e_cigarette", "occasional", "smoker"]),
  smokingPreference: new Set(["no_matter", "e_cigarette_ok", "non_smoker_only"]),
  drinkingFrequency: new Set(["rarely", "monthly_1_2", "weekly_1_2", "weekly_3_plus"]),
};
const EDUCATION_LEVELS = new Set(["", "고등학교 졸업", "전문대 졸업", "4년제 대학 졸업", "대학원 재학·졸업", "기타"]);
const MBTI_VALUES = new Set(["", "모름", ...["I","E"].flatMap(a => ["N","S"].flatMap(b => ["T","F"].flatMap(c => ["J","P"].map(d => a+b+c+d))))]);
const DRINKING_PREFERENCES = new Set(["", "no_matter", "moderate_ok", "rarely_only"]);
const STYLE_VALUES = new Set(["대화가 잘 통하는", "자기관리하는", "자기 일을 좋아하는", "가까운 곳에 사는", "진지하게 다가오는", "밝고 유쾌한", "차분한", "배려하는", "활동적인"]);
const INTEREST_VALUES = new Set([
  "헬스", "러닝", "요가·필라테스", "수영", "등산", "자전거", "테니스", "배드민턴", "골프", "축구", "야구", "클라이밍",
  "국내여행", "해외여행", "캠핑", "차박", "드라이브", "산책", "트레킹", "바다", "사진 촬영", "피크닉",
  "영화·드라마", "뮤지컬", "연극", "콘서트", "전시·미술관", "독서", "웹툰", "애니메이션", "게임", "보드게임", "악기 연주", "노래·음악",
  "맛집 탐방", "카페", "요리", "베이킹", "와인", "커피", "디저트", "인테리어", "쇼핑", "패션", "홈카페",
  "자기계발", "외국어", "재테크", "봉사활동", "반려동물", "식물 키우기", "명상", "글쓰기", "새로운 경험"
]);
const PREFERRED_JOB_CATEGORIES = JOB_CATEGORIES;
function optionalList(values, allowed, max, label, existing = []) {
  if (!Array.isArray(values)) throw new HttpsError("invalid-argument", `${label} 정보를 다시 선택해주세요.`);
  const result = [...new Set(values.map(v => clean(v, 50)).filter(Boolean))];
  // Older registrations may hold labels that are no longer in the current choices.
  // Permit retaining an existing value, but never introducing an unlisted value.
  const previous = new Set(Array.isArray(existing) ? existing.map(v => clean(v, 50)) : []);
  if (result.length > max || result.some(v => !allowed.has(v) && !previous.has(v))) throw new HttpsError("invalid-argument", `${label} 입력을 확인해주세요.`);
  return result;
}
const TERMINAL_MATCH_STATUSES = new Set([
  "declined", "cancelled", "canceled", "expired", "proposal_expired", "schedule_expired",
  "counterpart_expired", "failed", "withdrawn", "rematched",
]);
const TERMINAL_FEEDBACK_STATUSES = new Set(["completed", "reviewed", "timeout_processed", "closed"]);

function clean(value = "", max = 200) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, max);
}

function uniqueAllowedList(value, allowed, label) {
  if (!Array.isArray(value)) throw new HttpsError("invalid-argument", `${label}을 다시 선택해주세요.`);
  const result = [...new Set(value.map((item) => clean(item, 40)).filter(Boolean))];
  if (!result.length || result.some((item) => !allowed.has(item))) {
    throw new HttpsError("invalid-argument", `${label}에 허용되지 않은 값이 있습니다.`);
  }
  return result;
}

function requireEnum(value, allowed, label) {
  const result = clean(value, 60);
  if (!allowed.has(result)) throw new HttpsError("invalid-argument", `${label}을 다시 선택해주세요.`);
  return result;
}

function photoList(identity = {}) {
  return [identity?.representativePhoto, ...(Array.isArray(identity?.additionalPhotos) ? identity.additionalPhotos : [])]
    .filter(Boolean);
}

function storagePath(meta = {}) {
  return clean(meta?.path || meta?.storagePath || "", 1000);
}

function normalizeStorageMeta(meta = {}) {
  return {
    path: storagePath(meta),
    url: clean(meta?.url || meta?.downloadURL || "", 2200),
    name: clean(meta?.name || meta?.fileName || "", 255),
    type: clean(meta?.type || "", 120),
    size: Number(meta?.size || 0),
  };
}

async function verifyOwnedImage(meta, { applicationId, requestUid, folder, maxBytes, label }) {
  const normalized = normalizeStorageMeta(meta);
  const prefix = `twoweeksApplications/${applicationId}/${requestUid}/profileEdits/${folder}/`;
  if (!normalized.path.startsWith(prefix)) {
    throw new HttpsError("permission-denied", `${label}은 본인 업로드 경로의 파일만 사용할 수 있습니다.`);
  }

  let metadata;
  try {
    [metadata] = await admin.storage().bucket().file(normalized.path).getMetadata();
  } catch (error) {
    throw new HttpsError("not-found", `${label} 파일을 확인하지 못했습니다. 다시 업로드해주세요.`);
  }

  const contentType = clean(metadata?.contentType || normalized.type, 120).toLowerCase();
  const size = Number(metadata?.size || normalized.size || 0);
  if (!IMAGE_TYPES.has(contentType)) throw new HttpsError("invalid-argument", `${label}은 JPG, PNG, WEBP만 가능합니다.`);
  if (!Number.isFinite(size) || size <= 0 || size > maxBytes) {
    throw new HttpsError("invalid-argument", `${label} 파일 용량이 허용 범위를 초과했습니다.`);
  }

  return { ...normalized, type: contentType, size };
}

function matchIsActive(match = {}) {
  const status = clean(match?.status, 60);
  const proposalStatus = clean(match?.proposalStatus, 60);
  const scheduleStatus = clean(match?.scheduleStatus || match?.schedule?.status, 60);
  if (TERMINAL_MATCH_STATUSES.has(status) || TERMINAL_MATCH_STATUSES.has(proposalStatus) || TERMINAL_MATCH_STATUSES.has(scheduleStatus)) return false;
  if (status === "completed") {
    return !TERMINAL_FEEDBACK_STATUSES.has(clean(match?.feedbackStatus, 60));
  }
  return true;
}

async function getActiveMatches(applicationId) {
  const db = admin.firestore();
  const [male, female] = await Promise.all([
    db.collection("twoweeksMatches").where("maleApplicationId", "==", applicationId).get(),
    db.collection("twoweeksMatches").where("femaleApplicationId", "==", applicationId).get(),
  ]);
  const found = new Map();
  [...male.docs, ...female.docs].forEach((item) => found.set(item.id, { id: item.id, ...item.data() }));
  return [...found.values()].filter(matchIsActive);
}

function sameJson(left, right) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

function changedFields(application, next) {
  const basic = application?.basic || {};
  const identity = application?.identity || {};
  const preferences = application?.matchingPreferences || {};
  const checks = {
    nickname: [basic.nickname, next.nickname],
    introduction: [basic.introduction, next.introduction],
    activityAreas: [basic.activityAreas || [], next.activityAreas],
    preferredArea: [basic.preferredArea, next.preferredArea],
    availableTimeSlots: [basic.availableTimeSlots || [], next.availableTimeSlots],
    height: [basic.height || null, next.height],
    jobCategory: [identity.jobCategory, next.jobCategory],
    companyScale: [identity.companyScale || "", next.companyScale],
    organizationName: [identity.organizationName, next.organizationName],
    profilePhotos: [photoList(identity).map(storagePath), next.photos.map(storagePath)],
    marriagePlan: [preferences.marriagePlan, next.marriagePlan],
    childrenPlan: [preferences.childrenPlan, next.childrenPlan],
    religion: [preferences.religion, next.religion],
    religionPreference: [preferences.religionPreference, next.religionPreference],
    smoking: [preferences.smoking, next.smoking],
    smokingPreference: [preferences.smokingPreference, next.smokingPreference],
    drinkingFrequency: [preferences.drinkingFrequency, next.drinkingFrequency],
    educationLevel: [identity.educationLevel || "", next.educationLevel],
    schoolName: [identity.schoolName || "", next.schoolName],
    mbti: [application?.profileTraits?.mbti || "", next.mbti],
    interests: [application?.profileTraits?.interests || [], next.interests],
    preferredAgeRange: [preferences.preferredAgeRange || null, next.preferredAgeRange],
    drinkingPreference: [preferences.drinkingPreference || "", next.drinkingPreference],
    preferredStyles: [preferences.preferredStyles || [], next.preferredStyles],
    preferredJobCategories: [preferences.preferredJobCategories || [], next.preferredJobCategories],
    additionalPreference: [preferences.additionalPreference || "", next.additionalPreference],
  };
  return Object.entries(checks).filter(([, pair]) => !sameJson(pair[0], pair[1])).map(([key]) => key);
}

async function safeDelete(paths = []) {
  await Promise.all(paths.filter(Boolean).map((path) => admin.storage().bucket().file(path).delete({ ignoreNotFound: true }).catch(() => null)));
}

const updateTwoWeeksProfile = onCall({ region: REGION }, async (request) => {
  const applicationId = clean(request.data?.applicationId, 120);
  const form = request.data?.profile;
  if (!applicationId || !form || typeof form !== "object") {
    throw new HttpsError("invalid-argument", "수정할 프로필 정보가 없습니다.");
  }

  const owner = await assertApplicationOwner(request, applicationId, { allowAdmin: false });
  const application = owner.application;
  const activeMatches = await getActiveMatches(applicationId);
  if (activeMatches.length) {
    throw new HttpsError("failed-precondition", "진행 중인 매칭이 종료된 뒤 다음 매칭용 프로필을 수정할 수 있습니다.");
  }

  const activityAreas = uniqueAllowedList(form.activityAreas, ACTIVITY_AREAS, "활동지역");
  const preferredArea = clean(form.preferredArea, 40);
  if (!activityAreas.includes(preferredArea)) {
    throw new HttpsError("invalid-argument", "가장 편한 지역은 선택한 활동지역 안에서 골라주세요.");
  }
  const availableTimeSlots = uniqueAllowedList(form.availableTimeSlots, TIME_SLOTS, "가능 시간");
  const nickname = clean(form.nickname, 20);
  const introduction = clean(form.introduction, 80);
  const organizationName = clean(form.organizationName, 80);
  const height = form.height === "" || form.height == null ? null : Number(form.height);
  if (nickname.length < 2) throw new HttpsError("invalid-argument", "닉네임은 2~20자로 입력해주세요.");
  if (!introduction) throw new HttpsError("invalid-argument", "자기소개를 입력해주세요.");
  if (!organizationName) throw new HttpsError("invalid-argument", "회사명 또는 학교명을 입력해주세요.");
  if (height !== null && (!Number.isFinite(height) || height < 130 || height > 230)) {
    throw new HttpsError("invalid-argument", "키는 130~230cm 범위로 입력해주세요.");
  }

  const jobCategory = requireEnum(form.jobCategory, JOB_CATEGORIES, "직업군");
  const companyScale = jobCategory === "회사원" ? requireEnum(form.companyScale, COMPANY_SCALES, "회사 유형") : "";
  const requestedPhotos = Array.isArray(form.photos) ? form.photos.filter(Boolean) : [];
  if (requestedPhotos.length < TWOWEEKS_MIN_PROFILE_PHOTOS || requestedPhotos.length > TWOWEEKS_MAX_PROFILE_PHOTOS) {
    throw new HttpsError("failed-precondition", `프로필 수정 시 사진을 ${TWOWEEKS_MIN_PROFILE_PHOTOS}~${TWOWEEKS_MAX_PROFILE_PHOTOS}장 등록해주세요.`);
  }

  const oldPhotos = photoList(application?.identity || {});
  const oldByPath = new Map(oldPhotos.map((item) => [storagePath(item), item]).filter(([path]) => path));
  const photos = [];
  for (let index = 0; index < requestedPhotos.length; index += 1) {
    const meta = normalizeStorageMeta(requestedPhotos[index]);
    if (oldByPath.has(meta.path)) {
      photos.push(oldByPath.get(meta.path));
    } else {
      photos.push(await verifyOwnedImage(meta, {
        applicationId,
        requestUid: owner.uid,
        folder: "photos",
        maxBytes: MAX_PROFILE_IMAGE_BYTES,
        label: `프로필 사진 ${index + 1}`,
      }));
    }
  }

  const next = {
    nickname,
    introduction,
    activityAreas,
    preferredArea,
    availableTimeSlots,
    height,
    jobCategory,
    companyScale,
    organizationName,
    photos,
    marriagePlan: requireEnum(form.marriagePlan, ENUMS.marriagePlan, "결혼 의향"),
    childrenPlan: requireEnum(form.childrenPlan, ENUMS.childrenPlan, "자녀 계획"),
    religion: requireEnum(form.religion, ENUMS.religion, "종교"),
    religionPreference: requireEnum(form.religionPreference, ENUMS.religionPreference, "종교 선호"),
    smoking: requireEnum(form.smoking, ENUMS.smoking, "흡연 여부"),
    smokingPreference: requireEnum(form.smokingPreference, ENUMS.smokingPreference, "흡연 선호"),
    drinkingFrequency: requireEnum(form.drinkingFrequency, ENUMS.drinkingFrequency, "음주 빈도"),
    educationLevel: requireEnum(form.educationLevel || "", EDUCATION_LEVELS, "학력"),
    schoolName: clean(form.schoolName, 80),
    mbti: requireEnum(form.mbti || "", MBTI_VALUES, "MBTI"),
    interests: optionalList(form.interests || [], INTEREST_VALUES, 10, "관심사", application?.profileTraits?.interests),
    drinkingPreference: requireEnum(form.preferredDrinking || "", DRINKING_PREFERENCES, "상대 음주 선호"),
    preferredStyles: optionalList(form.preferredStyles || [], STYLE_VALUES, 3, "상대 스타일", application?.matchingPreferences?.preferredStyles),
    preferredJobCategories: optionalList(form.preferredJobCategories || [], PREFERRED_JOB_CATEGORIES, 2, "선호 직업"),
    additionalPreference: clean(form.additionalPreference, 300),
    preferredAgeRange: null,
  };
  if (next.educationLevel && !next.schoolName) throw new HttpsError("invalid-argument", "학교명을 입력해주세요.");
  if (form.preferredAgeMin || form.preferredAgeMax) {
    const min = Number(form.preferredAgeMin), max = Number(form.preferredAgeMax);
    if (!form.preferredAgeMin || !form.preferredAgeMax || !Number.isInteger(min) || !Number.isInteger(max) || min < 18 || max > 80 || min > max) throw new HttpsError("invalid-argument", "희망 연령 범위를 확인해주세요.");
    next.preferredAgeRange = { min, max };
  }
  const changes = changedFields(application, next);
  const sensitive = changes.filter((key) => ["jobCategory", "companyScale", "organizationName", "profilePhotos", "educationLevel", "schoolName"].includes(key));
  const nowClient = new Date().toISOString();
  const update = {
    "basic.nickname": next.nickname,
    "basic.introduction": next.introduction,
    "basic.activityAreas": next.activityAreas,
    "basic.preferredArea": next.preferredArea,
    "basic.availableTimeSlots": next.availableTimeSlots,
    "basic.height": next.height,
    "identity.jobCategory": next.jobCategory,
    "identity.companyScale": next.companyScale,
    "identity.organizationName": next.organizationName,
    "identity.educationLevel": next.educationLevel,
    "identity.schoolName": next.schoolName,
    "profileTraits.mbti": next.mbti,
    "profileTraits.interests": next.interests,
    "matchingPreferences.preferredAgeRange": next.preferredAgeRange,
    "matchingPreferences.drinkingPreference": next.drinkingPreference,
    "matchingPreferences.preferredStyles": next.preferredStyles,
    "matchingPreferences.preferredJobCategories": next.preferredJobCategories,
    "matchingPreferences.additionalPreference": next.additionalPreference,
    "identity.representativePhoto": photos[0],
    "identity.additionalPhotos": photos.slice(1),
    "matchingPreferences.marriagePlan": next.marriagePlan,
    "matchingPreferences.childrenPlan": next.childrenPlan,
    "matchingPreferences.religion": next.religion,
    "matchingPreferences.religionPreference": next.religionPreference,
    "matchingPreferences.smoking": next.smoking,
    "matchingPreferences.smokingPreference": next.smokingPreference,
    "matchingPreferences.drinkingFrequency": next.drinkingFrequency,
    "matchingPreferences.completed": true,
    "matchingPreferences.updatedAt": admin.firestore.FieldValue.serverTimestamp(),
    "matchingPreferences.updatedAtClient": nowClient,
    "profileEdit.lastEditedAt": admin.firestore.FieldValue.serverTimestamp(),
    "profileEdit.lastEditedAtClient": nowClient,
    "profileEdit.editCount": admin.firestore.FieldValue.increment(1),
    "profileEdit.changedFields": changes,
    "profileEdit.reviewRequiredFields": sensitive,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (sensitive.length) {
    update.reviewStatus = "reviewing";
    update.nextRoundStatus = "not_ready";
    update.matchingStatus = application?.matchingAvailability === "paused" ? "paused" : "not_ready";
    update["profileReview.status"] = "needs_review";
    update["profileReview.changedFields"] = sensitive;
    update["profileReview.requestedAt"] = admin.firestore.FieldValue.serverTimestamp();
    update["profileReview.requestedAtClient"] = nowClient;
    update["profileReview.requestedByUid"] = owner.uid;
  }

  await admin.firestore().collection("twoweeksApplications").doc(applicationId).update(update);
  const keptPaths = new Set(photos.map(storagePath));
  await safeDelete(oldPhotos.map(storagePath).filter((path) => path.includes("/profileEdits/photos/") && !keptPaths.has(path)));
  if (sensitive.length) {
    await sendTwoWeeksAdminSms({
      subject: "투윅스 프로필 재검토",
      message: `[투윅스] 재검토가 필요한 프로필 변경이 접수되었습니다.\n신청자: ${clean(application?.basic?.name || application?.basic?.nickname || "신청자", 40)}\n변경 항목: ${sensitive.join(", ")}\n신청ID: ${applicationId}`,
    });
  }

  return { ok: true, applicationId, changedFields: changes, reviewRequired: sensitive.length > 0, reviewRequiredFields: sensitive };
});

const submitTwoWeeksVerificationDocument = onCall({ region: REGION }, async (request) => {
  const applicationId = clean(request.data?.applicationId, 120);
  const owner = await assertApplicationOwner(request, applicationId, { allowAdmin: false });
  const application = owner.application;
  const document = await verifyOwnedImage(request.data?.verificationDocument, {
    applicationId,
    requestUid: owner.uid,
    folder: "verification",
    maxBytes: MAX_VERIFICATION_IMAGE_BYTES,
    label: "직업 인증자료",
  });
  const db = admin.firestore();
  const privateRef = db.collection("twoweeksApplicationPrivate").doc(applicationId);
  const previous = await privateRef.get();
  const previousDocument = previous.exists ? previous.data()?.verificationDocument : null;
  const nowClient = new Date().toISOString();
  const batch = db.batch();
  batch.set(privateRef, {
    applicationId,
    ownerUid: String(application?.uid || owner.uid),
    verificationDocument: document,
    verificationReview: {
      status: "needs_review",
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      submittedAtClient: nowClient,
      submittedByUid: owner.uid,
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  batch.update(db.collection("twoweeksApplications").doc(applicationId), {
    reviewStatus: "reviewing",
    nextRoundStatus: "not_ready",
    "identity.verificationDocument": null,
    "identity.verificationDocumentStoredPrivately": true,
    "profileReview.status": "needs_review",
    "profileReview.changedFields": admin.firestore.FieldValue.arrayUnion("verificationDocument"),
    "profileReview.requestedAt": admin.firestore.FieldValue.serverTimestamp(),
    "profileReview.requestedAtClient": nowClient,
    "profileReview.requestedByUid": owner.uid,
    "verificationReview.status": "needs_review",
    "verificationReview.submittedAt": admin.firestore.FieldValue.serverTimestamp(),
    "verificationReview.submittedAtClient": nowClient,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await batch.commit();

  const oldPath = storagePath(previousDocument);
  if (oldPath && oldPath !== document.path) await safeDelete([oldPath]);
  await sendTwoWeeksAdminSms({
    subject: "투윅스 인증자료 재검토",
    message: `[투윅스] 새 직업 인증자료가 제출되었습니다.\n신청자: ${clean(application?.basic?.name || application?.basic?.nickname || "신청자", 40)}\n신청ID: ${applicationId}\n관리자 페이지에서 재검토해주세요.`,
  });
  return { ok: true, applicationId, reviewRequired: true };
});

const getTwoWeeksVerificationDocumentStatus = onCall({ region: REGION }, async (request) => {
  const applicationId = clean(request.data?.applicationId, 120);
  await assertApplicationOwner(request, applicationId, { allowAdmin: true });

  const snap = await admin.firestore().collection("twoweeksApplicationPrivate").doc(applicationId).get();
  if (!snap.exists) {
    return { ok: true, applicationId, document: null, review: null };
  }

  const data = snap.data() || {};
  const document = normalizeStorageMeta(data.verificationDocument || {});
  const hasDocument = Boolean(document.path || document.url || document.name);

  return {
    ok: true,
    applicationId,
    document: hasDocument ? document : null,
    review: data.verificationReview ? {
      status: clean(data.verificationReview.status || "", 40),
      submittedAtClient: clean(data.verificationReview.submittedAtClient || "", 80),
      reviewedAtClient: clean(data.verificationReview.reviewedAtClient || "", 80),
    } : null,
  };
});

module.exports = {
  updateTwoWeeksProfile,
  submitTwoWeeksVerificationDocument,
  getTwoWeeksVerificationDocumentStatus,
  __test: { matchIsActive },
};
