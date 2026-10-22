const test = require("node:test");
const assert = require("node:assert/strict");
const {
  DAY_MS,
  isMatchingRestricted,
  recommendSanction,
} = require("../twoWeeksSanctionPolicy");

test("첫 무단 노쇼는 다음 1회차 제한이다", () => {
  const next = recommendSanction({}, "no_show", 1000);
  assert.equal(next.noShowCount, 1);
  assert.equal(next.status, "next_round_restricted");
  assert.equal(isMatchingRestricted({ sanctionSummary: next }, 1000), true);
  assert.equal(isMatchingRestricted({ sanctionSummary: next }, next.restrictedUntilMs + 1), false);
});

test("두 번째 무단 노쇼는 30일 제한이다", () => {
  const next = recommendSanction({ noShowCount: 1 }, "no_show", 1000);
  assert.equal(next.noShowCount, 2);
  assert.equal(next.status, "restricted_until");
  assert.equal(next.restrictedUntilMs, 1000 + 30 * DAY_MS);
  assert.equal(isMatchingRestricted({ sanctionSummary: next }, 2000), true);
});

test("세 번째 무단 노쇼는 자동탈퇴가 아닌 운영자 검토다", () => {
  const next = recommendSanction({ noShowCount: 2 }, "no_show", 1000);
  assert.equal(next.status, "manual_review");
  assert.equal(next.needsAdminReview, true);
});

test("당일취소 1회는 경고, 반복은 다음 회차 제한이다", () => {
  const first = recommendSanction({}, "same_day_cancel", 1000);
  const second = recommendSanction(first, "same_day_cancel", 2000);
  assert.equal(first.status, "warning");
  assert.equal(isMatchingRestricted({ sanctionSummary: first }, 2000), false);
  assert.equal(second.status, "next_round_restricted");
  assert.equal(isMatchingRestricted({ sanctionSummary: second }, 2000), true);
});

test("운영자 예외는 기존 제한보다 우선한다", () => {
  assert.equal(isMatchingRestricted({ sanctionSummary: { status: "manual_review", exceptionActive: true } }), false);
});
