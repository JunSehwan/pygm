export const TWOWEEKS_MIN_PROFILE_PHOTOS = 3;
export const TWOWEEKS_MAX_PROFILE_PHOTOS = 5;

export function hasTwoWeeksProfilePhotoValue(photo) {
  if (!photo) return false;
  if (typeof photo === "string") return Boolean(photo.trim());

  return Boolean(
    photo.url ||
    photo.downloadURL ||
    photo.originalUrl ||
    photo.previewUrl ||
    photo.securePreviewUrl ||
    photo.path ||
    (photo.source === "file" && photo.file)
  );
}

export function getTwoWeeksProfilePhotos(application = {}) {
  const identity = application?.identity || {};
  const additionalPhotos = Array.isArray(identity.additionalPhotos)
    ? identity.additionalPhotos
    : [];

  return [identity.representativePhoto, ...additionalPhotos]
    .filter(hasTwoWeeksProfilePhotoValue)
    .slice(0, TWOWEEKS_MAX_PROFILE_PHOTOS);
}

export function getTwoWeeksProfilePhotoCount(application = {}) {
  return getTwoWeeksProfilePhotos(application).length;
}

export function hasMinimumTwoWeeksProfilePhotos(application = {}) {
  return getTwoWeeksProfilePhotoCount(application) >= TWOWEEKS_MIN_PROFILE_PHOTOS;
}

function hasApprovedProfileRecord(application = {}) {
  const reviewStatus = String(application?.reviewStatus || "");
  const status = String(application?.status || "");

  if ([reviewStatus, status].includes("rejected")) return false;
  return reviewStatus === "approved" || status === "approved";
}

// 신규 신청은 생성 단계에서 3장을 강제하므로, 현재 1~2장이면서 승인된 신청서는
// 정책 적용 전에 승인된 기존 회원으로 판단해 신규 매칭 자격을 유지한다.
export function hasLegacyApprovedTwoWeeksProfilePhotoException(application = {}) {
  const photoCount = getTwoWeeksProfilePhotoCount(application);

  return (
    photoCount > 0 &&
    photoCount < TWOWEEKS_MIN_PROFILE_PHOTOS &&
    hasApprovedProfileRecord(application)
  );
}

export function hasMatchingEligibleTwoWeeksProfilePhotos(application = {}) {
  return (
    hasMinimumTwoWeeksProfilePhotos(application) ||
    hasLegacyApprovedTwoWeeksProfilePhotoException(application)
  );
}
