const test = require("node:test");
const assert = require("node:assert/strict");
const { __test } = require("../twoWeeksProfileUpdate");

test("제안·상호수락·일정확정·피드백 대기 매칭은 활성 상태다", () => {
  assert.equal(__test.matchIsActive({ status: "proposed" }), true);
  assert.equal(__test.matchIsActive({ status: "mutualAccepted", scheduleStatus: "waiting_counterpart" }), true);
  assert.equal(__test.matchIsActive({ status: "confirmed", scheduleStatus: "confirmed" }), true);
  assert.equal(__test.matchIsActive({ status: "completed", feedbackStatus: "waiting" }), true);
});

test("거절·만료·취소와 피드백 완료 매칭은 수정 잠금 대상이 아니다", () => {
  assert.equal(__test.matchIsActive({ status: "declined" }), false);
  assert.equal(__test.matchIsActive({ status: "proposed", proposalStatus: "proposal_expired" }), false);
  assert.equal(__test.matchIsActive({ status: "cancelled" }), false);
  assert.equal(__test.matchIsActive({ status: "completed", feedbackStatus: "completed" }), false);
});
