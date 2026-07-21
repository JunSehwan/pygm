import { TARGET_BIRTH_YEAR_MAX, TARGET_BIRTH_YEAR_MIN } from "./constants";

export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function normalizePhone(value = "") {
  return String(value).replace(/[^0-9]/g, "");
}

export function formatPhone(value = "") {
  const numbers = normalizePhone(value).slice(0, 11);

  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
}

function parseBirthDate(value = "") {
  const digits = String(value || "").replace(/[^0-9]/g, "");
  if (digits.length < 8) return null;

  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));

  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;

  return { year, month, day };
}

export function getAgeFromBirthYear(birthYear) {
  const year = Number(birthYear);
  if (!year) return null;
  return new Date().getFullYear() - year;
}

export function getFullAgeFromBirth(birth, fallbackBirthYear = "") {
  const parsed = parseBirthDate(birth);
  const now = new Date();

  if (!parsed) return getAgeFromBirthYear(fallbackBirthYear);

  let age = now.getFullYear() - parsed.year;
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  if (currentMonth < parsed.month || (currentMonth === parsed.month && currentDay < parsed.day)) {
    age -= 1;
  }

  return age;
}

export function formatFullAgeLabel({ birth = "", birthYear = "", age = "" } = {}) {
  const fullAge = getFullAgeFromBirth(birth, birthYear) ?? Number(age || 0);
  return fullAge ? `만 ${fullAge}세` : "-";
}

export function isImageFile(file) {
  if (!file) return false;
  return ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type);
}

export function focusFirstError() {
  if (typeof window === "undefined") return;

  window.requestAnimationFrame(() => {
    const firstError = document.querySelector("[data-tw-error='true']");
    if (!firstError) return;

    const target = firstError.closest("[data-tw-field]") || firstError;
    target.scrollIntoView({ behavior: "smooth", block: "center" });

    const focusable = target.querySelector("input, textarea, select, button");
    if (focusable && typeof focusable.focus === "function") {
      setTimeout(() => focusable.focus({ preventScroll: true }), 260);
    }
  });
}

export function validateStep1(form) {
  const errors = {};
  const birthYear = Number(form.birthYear);
  const phone = normalizePhone(form.phone);

  if (!form.gender) errors.gender = "성별을 선택해주세요.";
  if (!form.name?.trim()) errors.name = "이름을 입력해주세요.";
  if (!form.nickname?.trim()) errors.nickname = "닉네임을 입력해주세요.";
  if (form.nickname?.trim() && form.nickname.trim().length < 2) {
    errors.nickname = "닉네임은 2자 이상 입력해주세요.";
  }
  if (!birthYear || birthYear < TARGET_BIRTH_YEAR_MIN || birthYear > TARGET_BIRTH_YEAR_MAX) {
    errors.birthYear = `${TARGET_BIRTH_YEAR_MIN}년생 ~ ${TARGET_BIRTH_YEAR_MAX}년생만 신청할 수 있습니다.`;
  }
  if (!phone || phone.length < 10) errors.phone = "연락처를 정확히 입력해주세요.";
  if (!form.activityAreas?.length) errors.activityAreas = "정말 이동 가능한 지역을 1개 이상 남겨주세요.";
  if (!form.preferredArea) errors.preferredArea = "가장 편한 지역을 선택해주세요.";
  if (!form.maritalStatus) errors.maritalStatus = "미혼/싱글 여부를 확인해주세요.";
  if (form.maritalStatus !== "single") errors.maritalStatus = "투윅스 1기는 미혼/싱글만 신청할 수 있습니다.";
  if (!form.availableTimeSlots?.length) errors.availableTimeSlots = "가능한 시간대를 1개 이상 남겨주세요.";
  if (!form.introduction?.trim()) errors.introduction = "1줄 자기소개를 입력해주세요.";

  return errors;
}

export function validateStep2(form) {
  const errors = {};

  if (!form.representativePhoto) errors.representativePhoto = "대표 얼굴 사진 1장을 등록해주세요.";
  if (form.representativePhoto && !isImageFile(form.representativePhoto)) {
    errors.representativePhoto = "대표 사진은 JPG, PNG, WEBP 형식만 가능합니다.";
  }

  const invalidAdditional = (form.additionalPhotos || []).filter(Boolean).find((file) => !isImageFile(file));
  if (invalidAdditional) errors.additionalPhotos = "추가 사진은 JPG, PNG, WEBP 형식만 가능합니다.";

  if (!form.jobCategory) errors.jobCategory = "직업군을 선택해주세요.";
  if (!form.organizationName?.trim()) errors.organizationName = "회사명을 입력해주세요.";

  if (!form.verificationDocument) errors.verificationDocument = "신원 인증 자료를 업로드해주세요.";
  if (form.verificationDocument && !isImageFile(form.verificationDocument)) {
    errors.verificationDocument = "인증 자료는 JPG, PNG, WEBP 형식만 가능합니다.";
  }

  return errors;
}

export function validateStep3(form) {
  const required = ["privacy", "profileContact", "noShowDeposit", "falseInfo"];
  const errors = {};

  const missing = required.filter((key) => !form.consents?.[key]);
  if (missing.length) errors.consents = "필수 동의 항목을 모두 확인해주세요.";

  return errors;
}
