export const TWOWEEKS_TEST_CODE = "000000";

export const TWOWEEKS_TEST_PHONES = Object.freeze([
  "01000000001",
  "01000000002",
  "01000000003",
]);

export function normalizeTestPhone(value = "") {
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

export function isTwoWeeksTestPhone(phone = "") {
  return TWOWEEKS_TEST_PHONES.includes(normalizeTestPhone(phone));
}

export function buildTwoWeeksTestIdentityData({
  phone = "",
  name = "",
  gender = "",
  birthYear = "",
} = {}) {
  const year = Number(birthYear || 1987) || 1987;

  return {
    verified: true,
    provider: "TEST_OTP",
    phone: normalizeTestPhone(phone),
    name: name || "테스트회원",
    birth: `${year}0101`,
    gender,
    carrier: "TEST",
    ci: `TEST_CI_${normalizeTestPhone(phone)}`,
    di: `TEST_DI_${normalizeTestPhone(phone)}`,
    testMode: true,
    verifiedAtClient: new Date().toISOString(),
  };
}
