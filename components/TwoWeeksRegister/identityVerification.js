import { normalizePhone } from "./helpers";

export const TWOWEEKS_IDENTITY_SOURCE = "twoweeks_register";
export const TWOWEEKS_DRAFT_KEY = "twoweeks_register_draft_v1";
export const TWOWEEKS_DRAFT_TTL_MS = 30 * 60 * 1000;

export function safeSetStorage(storage, key, value) {
  try {
    storage?.setItem(key, value);
  } catch {
    // storage 사용 불가 환경에서는 무시
  }
}

export function safeGetStorage(storage, key) {
  try {
    return storage?.getItem(key) || "";
  } catch {
    return "";
  }
}

export function safeRemoveStorage(storage, key) {
  try {
    storage?.removeItem(key);
  } catch {
    // storage 사용 불가 환경에서는 무시
  }
}

export function normalizeBirthDate(value = "") {
  return String(value || "").replace(/[^0-9]/g, "").slice(0, 8);
}

export function birthYearFromIdentityBirth(value = "") {
  const birth = normalizeBirthDate(value);
  if (birth.length < 4) return "";
  return birth.slice(0, 4);
}

export function normalizeGender(value = "") {
  const raw = String(value || "").trim();
  const lower = raw.toLowerCase();

  if (["1", "3", "m", "male", "man", "남", "남자", "남성"].includes(lower) || raw === "남" || raw === "남자" || raw === "남성") {
    return "male";
  }

  if (["2", "4", "f", "female", "woman", "여", "여자", "여성"].includes(lower) || raw === "여" || raw === "여자" || raw === "여성") {
    return "female";
  }

  return "";
}

export function buildIdentityData(payload = {}, fallbackPhone = "") {
  if (!payload?.verified) {
    return {
      verified: false,
      message: payload?.message || "본인인증 결과가 유효하지 않습니다.",
    };
  }

  const verifiedPhone = normalizePhone(payload?.phone || fallbackPhone || "");

  if (!verifiedPhone) {
    return {
      verified: false,
      message: "본인인증 결과에서 연락처를 확인하지 못했습니다.",
    };
  }

  return {
    verified: true,
    provider: payload?.provider || "PORTONE",
    phone: verifiedPhone,
    name: payload?.name || "",
    birth: normalizeBirthDate(payload?.birth || ""),
    gender: normalizeGender(payload?.gender || ""),
    carrier: payload?.carrier || "",
    ci: payload?.ci || "",
    di: payload?.di || "",
    verifiedAtClient: new Date().toISOString(),
  };
}

function serializeDraftForm(form = {}) {
  return {
    gender: form.gender || "",
    name: form.name || "",
    nickname: form.nickname || "",
    birthYear: form.birthYear || "",
    phone: form.phone || "",
    phoneVerified: form.phoneVerified === true,
    phoneVerificationSkipped: form.phoneVerificationSkipped !== false,
    activityAreas: Array.isArray(form.activityAreas) ? form.activityAreas : [],
    preferredArea: form.preferredArea || "",
    maritalStatus: form.maritalStatus || "",
    availableTimeSlots: Array.isArray(form.availableTimeSlots) ? form.availableTimeSlots : [],
    height: form.height || "",
    introduction: form.introduction || "",
    jobCategory: form.jobCategory || "",
    organizationName: form.organizationName || "",
    consents: form.consents || {},
  };
}

export function writeTwoWeeksDraft(payload = {}) {
  if (typeof window === "undefined") return;

  try {
    const value = JSON.stringify({
      ...payload,
      form: serializeDraftForm(payload.form || {}),
      updatedAt: Date.now(),
    });

    safeSetStorage(window.sessionStorage, TWOWEEKS_DRAFT_KEY, value);
    safeSetStorage(window.localStorage, TWOWEEKS_DRAFT_KEY, value);
  } catch {
    // File 객체 등 직렬화 불가 상황에서는 무시
  }
}

export function readTwoWeeksDraft() {
  if (typeof window === "undefined") return null;

  try {
    const raw =
      safeGetStorage(window.sessionStorage, TWOWEEKS_DRAFT_KEY) ||
      safeGetStorage(window.localStorage, TWOWEEKS_DRAFT_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const updatedAt = Number(parsed?.updatedAt || 0);

    if (updatedAt && Date.now() - updatedAt > TWOWEEKS_DRAFT_TTL_MS) {
      clearTwoWeeksDraft();
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clearTwoWeeksDraft() {
  if (typeof window === "undefined") return;

  safeRemoveStorage(window.sessionStorage, TWOWEEKS_DRAFT_KEY);
  safeRemoveStorage(window.localStorage, TWOWEEKS_DRAFT_KEY);
}
