const TWO_WEEKS_TEST_PHONES = new Set([
  "01000000001",
  "01000000002",
  "01000000003",
]);

function normalizeTwoWeeksPhone(value = "") {
  let digits = String(value || "").replace(/[^0-9]/g, "");

  if (digits.startsWith("8210") && digits.length >= 12) {
    digits = `0${digits.slice(2)}`;
  }

  if (digits.startsWith("82010") && digits.length >= 13) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("82") && digits.length >= 11 && !digits.startsWith("820")) {
    digits = `0${digits.slice(2)}`;
  }

  return digits;
}

function isTwoWeeksTestPhone(value = "") {
  const enabled = process.env.FUNCTIONS_EMULATOR === "true" || process.env.TWOWEEKS_ENABLE_TEST_AUTH === "true";
  return enabled && TWO_WEEKS_TEST_PHONES.has(normalizeTwoWeeksPhone(value));
}

module.exports = {
  TWO_WEEKS_TEST_PHONES,
  normalizeTwoWeeksPhone,
  isTwoWeeksTestPhone,
};
