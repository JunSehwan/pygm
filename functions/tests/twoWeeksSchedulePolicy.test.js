const test = require("node:test");
const assert = require("node:assert/strict");
const { buildSchedulePolicy, isValidSchedulePolicy } = require("../twoWeeksSchedulePolicy");

test("월·화에 매칭해도 만남 후보는 다음 주 금·토·일이다", () => {
  const monday = buildSchedulePolicy("2026-10-19T01:00:00.000Z");
  const tuesday = buildSchedulePolicy("2026-10-20T01:00:00.000Z");

  assert.equal(monday.windowStartDateKey, "2026-10-30");
  assert.equal(monday.windowEndDateKey, "2026-11-01");
  assert.equal(tuesday.windowStartDateKey, "2026-10-30");
  assert.equal(tuesday.windowEndDateKey, "2026-11-01");
  assert.equal(isValidSchedulePolicy(monday), true);
  assert.equal(isValidSchedulePolicy(tuesday), true);
});

test("주말에 매칭하면 바로 다음 주말 후보를 사용한다", () => {
  const saturday = buildSchedulePolicy("2026-10-17T03:00:00.000Z");

  assert.equal(saturday.windowStartDateKey, "2026-10-23");
  assert.equal(saturday.windowEndDateKey, "2026-10-25");
  assert.equal(new Set(saturday.allowedTimeOptionIds).size, 5);
});
