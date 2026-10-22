const DAY_MS = 24 * 60 * 60 * 1000;

function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getSanctionSummary(application = {}) {
  return application?.sanctionSummary && typeof application.sanctionSummary === "object"
    ? application.sanctionSummary
    : {};
}

function isMatchingRestricted(application = {}, nowMs = Date.now()) {
  const summary = getSanctionSummary(application);
  if (summary.exceptionActive === true) return false;

  const status = String(summary.status || "none");
  if (status === "next_round_restricted") {
    const endMs = toMillis(summary.restrictedUntil) || Number(summary.restrictedUntilMs || 0);
    return endMs ? endMs > nowMs : true;
  }
  if (["manual_review", "long_term_restricted"].includes(status)) return true;
  if (status === "restricted_until") return (toMillis(summary.restrictedUntil) || Number(summary.restrictedUntilMs || 0)) > nowMs;
  return false;
}

function recommendSanction(summary = {}, eventType = "", nowMs = Date.now()) {
  const noShowCount = Number(summary.noShowCount || 0) + (eventType === "no_show" ? 1 : 0);
  const sameDayCancelCount = Number(summary.sameDayCancelCount || 0) + (eventType === "same_day_cancel" ? 1 : 0);

  if (eventType === "no_show") {
    if (noShowCount >= 3) {
      return { status: "manual_review", noShowCount, sameDayCancelCount, needsAdminReview: true };
    }
    if (noShowCount === 2) {
      return {
        status: "restricted_until",
        noShowCount,
        sameDayCancelCount,
        restrictedUntilMs: nowMs + (30 * DAY_MS),
        needsAdminReview: false,
      };
    }
    return {
      status: "next_round_restricted",
      noShowCount,
      sameDayCancelCount,
      restrictionRemainingRounds: 1,
      restrictedUntilMs: nowMs + (14 * DAY_MS),
      needsAdminReview: false,
    };
  }

  if (eventType === "same_day_cancel") {
    if (sameDayCancelCount >= 2) {
      return {
        status: "next_round_restricted",
        noShowCount,
        sameDayCancelCount,
        restrictionRemainingRounds: 1,
        restrictedUntilMs: nowMs + (14 * DAY_MS),
        needsAdminReview: false,
      };
    }
    return { status: "warning", noShowCount, sameDayCancelCount, needsAdminReview: false };
  }

  return {
    status: String(summary.status || "warning"),
    noShowCount,
    sameDayCancelCount,
    needsAdminReview: summary.needsAdminReview === true,
  };
}

module.exports = {
  DAY_MS,
  getSanctionSummary,
  isMatchingRestricted,
  recommendSanction,
  toMillis,
};
