export const TWOWEEKS_TEST_CODE = "000000";

const DEFAULT_TEST_PHONES = [
  "01000000001",
  "01000000002",
  "01000000003",
];

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

export function isTwoWeeksTestMode() {
  const enabled = String(process.env.NEXT_PUBLIC_TWOWEEKS_TEST_MODE || "").toLowerCase();

  if (enabled === "true" || enabled === "1" || enabled === "yes") return true;
  if (typeof window !== "undefined") {
    return ["localhost", "127.0.0.1"].includes(window.location.hostname);
  }

  return process.env.NODE_ENV !== "production";
}

export function getTwoWeeksTestPhones() {
  const configured = String(process.env.NEXT_PUBLIC_TWOWEEKS_TEST_PHONES || "")
    .split(",")
    .map(normalizeTestPhone)
    .filter(Boolean);

  return Array.from(new Set([...DEFAULT_TEST_PHONES, ...configured]));
}

export function isTwoWeeksTestPhone(phone = "") {
  if (!isTwoWeeksTestMode()) return false;
  return getTwoWeeksTestPhones().includes(normalizeTestPhone(phone));
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
