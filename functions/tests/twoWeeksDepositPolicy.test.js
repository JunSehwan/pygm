const test = require("node:test");
const assert = require("node:assert/strict");
const {
  getBalance,
  getRequiredBalance,
  isDepositWaived,
  isParticipationEligible,
} = require("../twoWeeksDepositPolicy");

test("예치금 면제는 0원으로 매칭 참여 가능하다", () => {
  const deposit = { status: "waived", waived: true, requiredBalance: 0, balance: 0 };
  assert.equal(isDepositWaived(deposit), true);
  assert.equal(getRequiredBalance(deposit), 0);
  assert.equal(getBalance(deposit), 0);
  assert.equal(isParticipationEligible(deposit), true);
});

test("정식 policy 필드의 면제값을 우선 인식한다", () => {
  const deposit = { policy: "waived", status: "pending", requiredBalance: 30000, balance: 0 };
  assert.equal(isDepositWaived(deposit), true);
  assert.equal(getRequiredBalance(deposit), 0);
  assert.equal(isParticipationEligible(deposit), true);
});

test("회원별 예치금은 1,000원 같은 개별 금액도 그대로 판정한다", () => {
  const deposit = { status: "confirmed", requiredBalance: 1000, balance: 1000 };
  assert.equal(getRequiredBalance(deposit), 1000);
  assert.equal(isParticipationEligible(deposit), true);
});

test("확정 상태라도 잔액이 기준보다 부족하면 매칭 대상이 아니다", () => {
  const deposit = { status: "confirmed", requiredBalance: 20000, balance: 11000 };
  assert.equal(isParticipationEligible(deposit), false);
});

test("면제 표시 없이 0원이 들어간 레거시 오류값은 기본 예치금으로 보호한다", () => {
  const deposit = { status: "pending", requiredBalance: 0, amount: 0, balance: 0 };
  assert.equal(getRequiredBalance(deposit), 30000);
  assert.equal(isParticipationEligible(deposit), false);
});
