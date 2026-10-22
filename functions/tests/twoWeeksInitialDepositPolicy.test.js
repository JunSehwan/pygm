const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildInitialDeposit,
  shouldWaiveInitialDeposit,
} = require("../twoWeeksInitialDepositPolicy");

test("여성 1기는 예치금 면제 정책으로 생성한다", () => {
  assert.equal(shouldWaiveInitialDeposit({ gender: "female", roundId: "twoweeks_beta_1" }), true);
  const deposit = buildInitialDeposit({ gender: "female", roundId: "twoweeks_beta_1" });
  assert.equal(deposit.policy, "waived");
  assert.equal(deposit.status, "waived");
  assert.equal(deposit.participationEligible, true);
  assert.equal(deposit.requiredBalance, 0);
});

test("남성 1기는 기존 3만원 필수 정책을 유지한다", () => {
  const deposit = buildInitialDeposit({ gender: "male", roundId: "twoweeks_beta_1" });
  assert.equal(deposit.policy, "required");
  assert.equal(deposit.status, "pending");
  assert.equal(deposit.requiredBalance, 30000);
  assert.equal(deposit.participationEligible, false);
});

test("다른 회차 여성은 영구 하드코딩 면제되지 않는다", () => {
  const deposit = buildInitialDeposit({ gender: "female", roundId: "future_round" });
  assert.equal(deposit.policy, "required");
});
