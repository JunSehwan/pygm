export function getSanctionSummary(application = {}) {
  return application?.sanctionSummary && typeof application.sanctionSummary === "object"
    ? application.sanctionSummary
    : {};
}

export function getSanctionEndMs(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function isMatchingRestricted(application = {}, nowMs = Date.now()) {
  const summary = getSanctionSummary(application);
  if (summary.exceptionActive === true) return false;
  const status = String(summary.status || "none");
  if (status === "next_round_restricted") {
    const endMs = getSanctionEndMs(summary.restrictedUntil) || Number(summary.restrictedUntilMs || 0);
    return endMs ? endMs > nowMs : true;
  }
  if (["manual_review", "long_term_restricted"].includes(status)) return true;
  return status === "restricted_until" && (getSanctionEndMs(summary.restrictedUntil) || Number(summary.restrictedUntilMs || 0)) > nowMs;
}

export function getSanctionStatusLabel(application = {}) {
  const status = String(getSanctionSummary(application).status || "none");
  const labels = {
    none: "제재 없음",
    warning: "경고",
    next_round_restricted: "다음 1회차 제한",
    restricted_until: "기간 제한",
    manual_review: "장기 제한 검토",
    long_term_restricted: "장기 이용 제한",
    released: "제재 해제",
    exception: "운영자 예외",
  };
  return labels[status] || status;
}
