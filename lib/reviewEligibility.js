// lib/reviewEligibility.js
import { serverTimestamp } from "firebase/firestore";

export const REVIEW_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

function hasText(value) {
  return String(value || "").trim().length > 0;
}

function onlyNumber(value) {
  return String(value || "").replace(/[^0-9]/g, "");
}

function hasAddress(address = {}) {
  if (!address) return false;
  if (typeof address === "string") return hasText(address);

  return hasText(address?.sido) && hasText(address?.sigugun);
}

function hasMbti(userData = {}) {
  const mbti = String(userData?.mbti || "").trim().toUpperCase();

  if (mbti.length === 4) return true;

  return (
    hasText(userData?.mbti_ei) &&
    hasText(userData?.mbti_sn) &&
    hasText(userData?.mbti_tf) &&
    hasText(userData?.mbti_jp)
  );
}

function getPhotoCount(profilePhotos = [], thumbimage = []) {
  const photos = Array.isArray(profilePhotos) ? profilePhotos : [];
  const thumbs = Array.isArray(thumbimage)
    ? thumbimage
    : thumbimage
      ? [thumbimage]
      : [];

  const merged = [...photos, ...thumbs];
  const unique = new Set();

  merged.forEach((item) => {
    if (!item) return;

    if (typeof item === "string") {
      if (hasText(item)) unique.add(item.trim());
      return;
    }

    if (hasText(item?.url)) {
      unique.add(String(item.url).trim());
    }
  });

  return unique.size;
}

function getCurrentPhone(userData = {}) {
  return onlyNumber(
    userData?.phonenumber ||
    userData?.phone ||
    userData?.tel ||
    userData?.identity_phone ||
    userData?.identityPhone ||
    userData?.verifiedPhone ||
    userData?.identityVerification?.phone ||
    userData?.identityVerifiedData?.phone ||
    ""
  );
}

function getVerifiedPhone(userData = {}) {
  return onlyNumber(
    userData?.identity_phone ||
    userData?.identityPhone ||
    userData?.verifiedPhone ||
    userData?.identityVerification?.phone ||
    userData?.identityVerifiedData?.phone ||
    userData?.phonenumber ||
    ""
  );
}

function hasIdentityVerified(userData = {}) {
  return Boolean(
    userData?.identityVerified === true ||
    userData?.phoneVerified === true ||
    userData?.telVerified === true ||
    userData?.identityVerifiedAt ||
    userData?.identityVerification?.verifiedAt ||
    userData?.identityVerifiedData
  );
}

function hasContactVerification(userData = {}) {
  if (!hasIdentityVerified(userData)) return false;

  const currentPhone = getCurrentPhone(userData);
  const verifiedPhone = getVerifiedPhone(userData);

  // 둘 다 있으면 같은 번호일 때만 인증 완료
  if (currentPhone && verifiedPhone) {
    return currentPhone === verifiedPhone;
  }

  // 예전 가입자 중 인증 플래그만 있는 경우 호환
  return true;
}

export const DATING_REVIEW_REQUIREMENTS = [
  // 본인인증은 신뢰도를 높이는 선택 인증으로 운영합니다.
  // 미인증 회원도 기본 프로필/사진 조건을 충족하면 매칭 심사를 진행할 수 있습니다.
  {
    key: "profilePhotos",
    label: "프로필사진 3장 이상",
    helper: "얼굴이 잘 보이는 사진을 3장 이상 등록해주세요.",
    check: (user) => getPhotoCount(user?.profilePhotos, user?.thumbimage) >= 3,
  },
  {
    key: "residence",
    label: "거주지역",
    helper: "거주 지역을 선택해주세요.",
    check: (user) =>
      hasAddress(user?.residence) ||
      (hasText(user?.address_sido) && hasText(user?.address_sigugun)),
  },
  {
    key: "workArea",
    label: "근무지역",
    helper: "근무 지역을 선택해주세요.",
    check: (user) =>
      hasAddress(user?.workArea) ||
      (hasText(user?.company_location_sido) &&
        hasText(user?.company_location_sigugun)),
  },
  {
    key: "job",
    label: "직업",
    helper: "현재 직업군을 선택해주세요.",
    check: (user) => hasText(user?.job),
  },
  {
    key: "education",
    label: "최종학력",
    helper: "학력 정보를 입력해주세요.",
    check: (user) => hasText(user?.education),
  },
  {
    key: "maritalStatus",
    label: "상태",
    helper: "미혼/돌싱 여부를 선택해주세요.",
    check: (user) => hasText(user?.maritalStatus),
  },
  {
    key: "mbti",
    label: "MBTI",
    helper: "네 가지 성향을 모두 선택해주세요.",
    check: hasMbti,
  },
];

export function getDatingReviewMissingItems(userData = {}) {
  return DATING_REVIEW_REQUIREMENTS.filter((item) => !item.check(userData)).map(
    ({ key, label, helper }) => ({
      key,
      label,
      helper,
    })
  );
}

export function isReadyForDatingReview(userData = {}) {
  return getDatingReviewMissingItems(userData).length === 0;
}

export function buildDatingReviewPatch(nextUser = {}, prevUser = {}) {
  const prevStatus = prevUser?.reviewStatus || REVIEW_STATUS.DRAFT;
  const prevPending = prevUser?.date_pending === true;
  const prevFinished = prevUser?.date_profile_finished === true;

  const ready = isReadyForDatingReview(nextUser);
  const alreadyApproved = prevStatus === REVIEW_STATUS.APPROVED;
  const alreadyPending = prevStatus === REVIEW_STATUS.PENDING || prevPending;

  if (alreadyApproved) {
    return {
      patch: {
        date_profile_finished: true,
        profile_setup_required_done: true,
        profile_photo_required_done: true,
      },
      shouldMoveToPending: false,
    };
  }

  if (!ready) {
    return {
      patch: {
        date_profile_finished: false,
        date_pending: false,
        reviewStatus: REVIEW_STATUS.DRAFT,
        profile_setup_required_done: false,
      },
      shouldMoveToPending: false,
    };
  }

  const shouldMoveToPending = !alreadyPending && !prevFinished;

  return {
    patch: {
      date_profile_finished: true,
      date_pending: true,
      reviewStatus: REVIEW_STATUS.PENDING,
      reviewRequestedAt: shouldMoveToPending
        ? serverTimestamp()
        : prevUser?.reviewRequestedAt || serverTimestamp(),
      pendingReviewAlertSentAt: shouldMoveToPending
        ? null
        : prevUser?.pendingReviewAlertSentAt || null,
      pendingStatus: "reviewing",
      profile_setup_required_done: true,
      profile_photo_required_done: true,
      date_sleep: false,
    },
    shouldMoveToPending,
  };
}