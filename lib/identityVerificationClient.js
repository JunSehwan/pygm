import { getFunctions, httpsCallable } from "firebase/functions";

const PENDING_KEY = "danal_identity_pending_v1";

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

export function normalizeCarrierForDanal(carrier = "") {
  const key = String(carrier || "").trim().toLowerCase();

  if (!key) return "";
  if (key === "skt") return "SKT";
  if (key === "kt" || key === "ktf") return "KTF";
  if (key === "lgu" || key === "lgt" || key === "lgu+") return "LGT";
  if (key === "mvno" || key === "알뜰폰") return "MVNO";

  return carrier;
}

export function createIdentityVerificationId(prefix = "signup") {
  const random =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2);

  return `${prefix}_${Date.now()}_${random}`.slice(0, 80);
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
      safeGetStorage(window.localStorage, PENDING_KEY);

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingIdentityVerification() {
  if (typeof window === "undefined") return;

  safeRemoveStorage(window.sessionStorage, PENDING_KEY);
  safeRemoveStorage(window.localStorage, PENDING_KEY);
}

export async function verifyIdentityResultWithServer({
  identityVerificationId,
  requestedPhone = "",
  requestedCarrier = "",
}) {
  const functions = getFunctions(undefined, "asia-northeast3");
  const verifyIdentityResult = httpsCallable(functions, "verifyIdentityResult");

  const result = await verifyIdentityResult({
    identityVerificationId,
    requestedPhone: normalizePhone(requestedPhone),
    requestedCarrier,
  });

  return result?.data;
}

export function consumeIdentityVerificationRedirectResult(source = "") {
  if (typeof window === "undefined") return null;

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