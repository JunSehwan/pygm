const ATTRIBUTION_KEY = "twoweeks_marketing_attribution_v1";
const VISITOR_KEY = "twoweeks_marketing_visitor_v1";

function safeStorageGet(key) {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function safeStorageSet(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // private mode 등 localStorage를 사용할 수 없는 환경에서는 가입을 막지 않는다.
  }
}

export function normalizeAttributionSource(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 40);
}

export function normalizeCampaignCode(value = "") {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 60);
}

export function getTwoWeeksVisitorId() {
  const saved = safeStorageGet(VISITOR_KEY);
  if (/^[a-zA-Z0-9_-]{12,100}$/.test(saved)) return saved;

  const generated = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID().replace(/-/g, "")
    : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
  safeStorageSet(VISITOR_KEY, generated);
  return generated;
}

export function readTwoWeeksAttribution() {
  const raw = safeStorageGet(ATTRIBUTION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function captureTwoWeeksAttribution(search = "") {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(search || window.location.search || "");
  const source = normalizeAttributionSource(params.get("source"));
  const campaign = normalizeCampaignCode(params.get("campaign"));
  if (!source || !campaign) return readTwoWeeksAttribution();

  const previous = readTwoWeeksAttribution() || {};
  const now = new Date().toISOString();
  const next = {
    firstSource: previous.firstSource || source,
    firstCampaign: previous.firstCampaign || campaign,
    firstLandingAtClient: previous.firstLandingAtClient || now,
    lastSource: source,
    lastCampaign: campaign,
    lastLandingAtClient: now,
  };
  safeStorageSet(ATTRIBUTION_KEY, JSON.stringify(next));
  return next;
}

export function getRegistrationAttribution() {
  const stored = readTwoWeeksAttribution();
  if (!stored?.firstSource || !stored?.firstCampaign) {
    return {
      firstSource: "direct",
      firstCampaign: "",
      firstLandingAtClient: "",
      lastSource: "direct",
      lastCampaign: "",
      lastLandingAtClient: "",
    };
  }

  return {
    firstSource: normalizeAttributionSource(stored.firstSource),
    firstCampaign: normalizeCampaignCode(stored.firstCampaign),
    firstLandingAtClient: String(stored.firstLandingAtClient || "").slice(0, 80),
    lastSource: normalizeAttributionSource(stored.lastSource || stored.firstSource),
    lastCampaign: normalizeCampaignCode(stored.lastCampaign || stored.firstCampaign),
    lastLandingAtClient: String(stored.lastLandingAtClient || stored.firstLandingAtClient || "").slice(0, 80),
  };
}



const TWO_WEEKS_INVITE_KEY = "twoweeks_pending_invite_v1";
// The invite is a random opaque code. Persist it across the PortOne redirect.
export function captureTwoWeeksInvite(search = "") {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(search || window.location.search || "");
  const code = String(params.get("ref") || "").trim();
  if (/^[A-Za-z0-9_-]{18,80}$/.test(code)) safeStorageSet(TWO_WEEKS_INVITE_KEY, JSON.stringify({ code, savedAt: Date.now() }));
  return getTwoWeeksInvite();
}
export function getTwoWeeksInvite() {
  try {
    const { code, savedAt } = JSON.parse(safeStorageGet(TWO_WEEKS_INVITE_KEY) || "null") || {};
    return /^[A-Za-z0-9_-]{18,80}$/.test(code) && savedAt > Date.now() - 14 * 24 * 60 * 60 * 1000 && savedAt <= Date.now()
      ? code : "";
  } catch { return ""; }
}
export function clearTwoWeeksInvite() {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(TWO_WEEKS_INVITE_KEY); } catch { /* ignore */ }
}
