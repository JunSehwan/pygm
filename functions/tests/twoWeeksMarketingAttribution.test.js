const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeSource,
  normalizeCampaignCode,
  meetingCompleted,
} = require("../twoWeeksMarketingAttribution").__test;

test("campaign source and code are normalized to stable keys", () => {
  assert.equal(normalizeSource(" Naver_Cafe "), "naver_cafe");
  assert.equal(normalizeSource("offline<script>"), "offlinescript");
  assert.equal(normalizeCampaignCode(" pilates-01 "), "PILATES-01");
  assert.equal(normalizeCampaignCode("카페 01"), "01");
});

test("meeting completion uses real lifecycle terminal states", () => {
  assert.equal(meetingCompleted({ status: "completed" }), true);
  assert.equal(meetingCompleted({ meetingStatus: "feedback_requested" }), true);
  assert.equal(meetingCompleted({ feedbackStatus: "timeout_processed" }), true);
  assert.equal(meetingCompleted({ status: "confirmed", feedbackStatus: "waiting" }), false);
  assert.equal(meetingCompleted({ status: "confirmed", feedbackStatus: "" }), false);
});

