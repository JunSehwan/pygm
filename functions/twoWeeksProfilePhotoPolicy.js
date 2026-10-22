const TWOWEEKS_MIN_PROFILE_PHOTOS = 3;
const TWOWEEKS_MAX_PROFILE_PHOTOS = 5;

function hasPhotoValue(photo) {
  if (!photo) return false;
  if (typeof photo === "string") return Boolean(photo.trim());
  if (typeof photo !== "object") return false;

  return Boolean(
    photo.url ||
    photo.downloadURL ||
    photo.originalUrl ||
    photo.previewUrl ||
    photo.securePreviewUrl ||
    photo.path
  );
}

function getTwoWeeksProfilePhotoCount(application = {}) {
  const identity = application && typeof application.identity === "object"
    ? application.identity
    : {};
  const additionalPhotos = Array.isArray(identity.additionalPhotos)
    ? identity.additionalPhotos
    : [];

  return [identity.representativePhoto, ...additionalPhotos]
    .filter(hasPhotoValue)
    .slice(0, TWOWEEKS_MAX_PROFILE_PHOTOS)
    .length;
}

function hasMinimumTwoWeeksProfilePhotos(application = {}) {
  return getTwoWeeksProfilePhotoCount(application) >= TWOWEEKS_MIN_PROFILE_PHOTOS;
}

function hasApprovedProfileRecord(application = {}) {
  const reviewStatus = String(application?.reviewStatus || "");
  const status = String(application?.status || "");

  if ([reviewStatus, status].includes("rejected")) return false;
  return reviewStatus === "approved" || status === "approved";
}

function hasLegacyApprovedTwoWeeksProfilePhotoException(application = {}) {
  const photoCount = getTwoWeeksProfilePhotoCount(application);

  return (
    photoCount > 0 &&
    photoCount < TWOWEEKS_MIN_PROFILE_PHOTOS &&
    hasApprovedProfileRecord(application)
  );
}

function hasMatchingEligibleTwoWeeksProfilePhotos(application = {}) {
  return (
    hasMinimumTwoWeeksProfilePhotos(application) ||
    hasLegacyApprovedTwoWeeksProfilePhotoException(application)
  );
}

module.exports = {
  TWOWEEKS_MIN_PROFILE_PHOTOS,
  TWOWEEKS_MAX_PROFILE_PHOTOS,
  getTwoWeeksProfilePhotoCount,
  hasMinimumTwoWeeksProfilePhotos,
  hasLegacyApprovedTwoWeeksProfilePhotoException,
  hasMatchingEligibleTwoWeeksProfilePhotos,
};
