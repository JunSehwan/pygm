const test = require("node:test");
const assert = require("node:assert/strict");
const { isTwoWeeksTestPhone } = require("../twoWeeksTestAuth");

test("고정 인증번호 테스트 계정은 운영 환경에서 기본적으로 비활성화된다", () => {
  const saved = { enabled: process.env.TWOWEEKS_ENABLE_TEST_AUTH, emulator: process.env.FUNCTIONS_EMULATOR };
  try {
    delete process.env.TWOWEEKS_ENABLE_TEST_AUTH;
    delete process.env.FUNCTIONS_EMULATOR;
    assert.equal(isTwoWeeksTestPhone("01000000001"), false);
    process.env.TWOWEEKS_ENABLE_TEST_AUTH = "true";
    assert.equal(isTwoWeeksTestPhone("+82 10-0000-0001"), true);
    assert.equal(isTwoWeeksTestPhone("01055550111"), false);
    delete process.env.TWOWEEKS_ENABLE_TEST_AUTH;
    process.env.FUNCTIONS_EMULATOR = "true";
    assert.equal(isTwoWeeksTestPhone("01000000002"), true);
  } finally {
    if (saved.enabled === undefined) delete process.env.TWOWEEKS_ENABLE_TEST_AUTH;
    else process.env.TWOWEEKS_ENABLE_TEST_AUTH = saved.enabled;
    if (saved.emulator === undefined) delete process.env.FUNCTIONS_EMULATOR;
    else process.env.FUNCTIONS_EMULATOR = saved.emulator;
  }
});
