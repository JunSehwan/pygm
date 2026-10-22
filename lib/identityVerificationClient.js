import { getFunctions, httpsCallable } from "firebase/functions";

const PENDING_KEY = "portone_identity_pending_v2";
const LEGACY_PENDING_KEY = "danal_identity_pending_v1";
const REDIRECT_RESULT_KEY = "portone_identity_redirect_result_v1";

function safeSetStorage(storage, key, value) {
  try {
    storage?.setItem(key, value);
  } catch {
    // storage 사용 불가 환경에서는 무시
  }
}

function safeGetStorage(storage, key) {
  try {
    return storage?.getItem(key) || "";
  } catch {
    return "";
  }
}

function safeRemoveStorage(storage, key) {
  try {
    storage?.removeItem(key);
  } catch {
    // storage 사용 불가 환경에서는 무시
  }
}

export function normalizePhone(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}


export function createIdentityVerificationId(prefix = "signup") {
  const cleanPrefix = String(prefix || "idv").replace(/[^A-Za-z0-9]/g, "").slice(0, 8) || "idv";
  const random =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().replace(/[^A-Za-z0-9]/g, "")
      : Math.random().toString(36).replace(/[^A-Za-z0-9]/g, "").slice(2);

  // PG별 제약 차이를 피하기 위해 영문/숫자만 사용하고 40자 이하로 통일한다.
  return `${cleanPrefix}${Date.now()}${random}`.slice(0, 40);
}

export function prepareIdentityVerificationPending(payload = {}) {
  if (typeof window === "undefined") return;

  const value = JSON.stringify({
    source: payload.source || "",
    returnUrl: payload.returnUrl || window.location.href,
    requestedPhone: normalizePhone(payload.requestedPhone || ""),
    requestedCarrier: payload.requestedCarrier || "",
    identityVerificationId: payload.identityVerificationId || "",
    preparedAt: Date.now(),
  });

  // PASS 앱 인증은 돌아올 때 sessionStorage가 비는 케이스가 있어서 둘 다 저장
  safeSetStorage(window.sessionStorage, PENDING_KEY, value);
  safeSetStorage(window.localStorage, PENDING_KEY, value);
}

export function getPendingIdentityVerification() {
  if (typeof window === "undefined") return null;

  try {
    const raw =
      safeGetStorage(window.sessionStorage, PENDING_KEY) ||
      safeGetStorage(window.localStorage, PENDING_KEY) ||
      // 다날 시절 진행 중이던 redirect 정보는 1회 호환 후 정리한다.
      safeGetStorage(window.sessionStorage, LEGACY_PENDING_KEY) ||
      safeGetStorage(window.localStorage, LEGACY_PENDING_KEY);

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingIdentityVerification() {
  if (typeof window === "undefined") return;

  safeRemoveStorage(window.sessionStorage, PENDING_KEY);
  safeRemoveStorage(window.localStorage, PENDING_KEY);
  safeRemoveStorage(window.sessionStorage, LEGACY_PENDING_KEY);
  safeRemoveStorage(window.localStorage, LEGACY_PENDING_KEY);
}

export function setIdentityVerificationRedirectResult(payload = {}) {
  if (typeof window === "undefined") return;

  const value = JSON.stringify({
    ...(payload || {}),
    savedAt: Date.now(),
  });

  // 외부 인증 앱에서 복귀할 때 sessionStorage가 유지되지 않는 환경을
  // 고려해 두 저장소에 기록하고, 소비 시 양쪽 모두 정리한다.
  safeSetStorage(window.sessionStorage, REDIRECT_RESULT_KEY, value);
  safeSetStorage(window.localStorage, REDIRECT_RESULT_KEY, value);
}

export async function verifyIdentityResultWithServer({
  identityVerificationId,
  requestedPhone = "",
  requestedCarrier = "",
  source = "",
}) {
  const functions = getFunctions(undefined, "asia-northeast3");
  const verifyIdentityResult = httpsCallable(functions, "verifyIdentityResult");

  try {
    const result = await verifyIdentityResult({
      identityVerificationId,
      requestedPhone: normalizePhone(requestedPhone),
      requestedCarrier,
      source,
    });

    return result?.data;
  } catch (error) {
    const code = String(error?.code || "").toLowerCase();
    const message = String(error?.message || "").replace(/^FirebaseError:\s*/i, "").trim();
    const existingApplication =
      code.includes("already-exists") ||
      message.includes("이미 가입") ||
      message.includes("기존 신청");

    // 이미 신청된 회원은 예외가 아니라 정상적인 분기다.
    // 개발환경의 Next.js runtime overlay까지 띄우지 않고 화면에서 안내한다.
    if (existingApplication) {
      return {
        verified: false,
        existingApplication: true,
        code: "already-exists",
        message: message || "이미 가입된 연락처입니다. 기존 신청 현황에서 확인해주세요.",
      };
    }

    throw error;
  }
}

export function consumeIdentityVerificationRedirectResult(source = "") {
  if (typeof window === "undefined") return null;

  const storedResult =
    safeGetStorage(window.sessionStorage, REDIRECT_RESULT_KEY) ||
    safeGetStorage(window.localStorage, REDIRECT_RESULT_KEY);

  if (storedResult) {
    safeRemoveStorage(window.sessionStorage, REDIRECT_RESULT_KEY);
    safeRemoveStorage(window.localStorage, REDIRECT_RESULT_KEY);

    try {
      const parsed = JSON.parse(storedResult);
      if (source && parsed?.source && parsed.source !== source) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  const params = new URLSearchParams(window.location.search || "");
  const identityVerificationId =
    params.get("idv") ||
    params.get("identityVerificationId") ||
    params.get("identity_verification_id") ||
    params.get("id") ||
    "";

  if (!identityVerificationId) return null;

  const pending = getPendingIdentityVerification();

  if (source && pending?.source && pending.source !== source) {
    return null;
  }

  return {
    source: pending?.source || source || "",
    identityVerificationId,
    requestedPhone: pending?.requestedPhone || "",
    requestedCarrier: pending?.requestedCarrier || "",
    returnUrl: pending?.returnUrl || window.location.href,
    verified: false,
  };
}
