const { DEFAULT_DEPOSIT_AMOUNT } = require("./twoWeeksDepositPolicy");

const FEMALE_FIRST_COHORT_ROUND_ID = "twoweeks_beta_1";
const FEMALE_FIRST_COHORT_POLICY_SOURCE = "female_first_cohort_2026";

function normalizeGender(value = "") {
  const clean = String(value || "").trim().toLowerCase();
  if (["female", "f", "woman", "여", "여성"].includes(clean)) return "female";
  if (["male", "m", "man", "남", "남성"].includes(clean)) return "male";
  return clean;
}

function shouldWaiveInitialDeposit({ gender = "", roundId = "" } = {}) {
  return normalizeGender(gender) === "female" && String(roundId || "").trim() === FEMALE_FIRST_COHORT_ROUND_ID;
}

function buildInitialDeposit({ gender = "", roundId = "", incoming = {} } = {}) {
  const waived = shouldWaiveInitialDeposit({ gender, roundId });
  if (waived) {
    return {
      ...incoming,
      policy: "waived",
      policySource: FEMALE_FIRST_COHORT_POLICY_SOURCE,
      amount: 0,
      currency: "KRW",
      status: "waived",
      waived: true,
      balance: 0,
      requiredBalance: 0,
      topUpRequiredAmount: 0,
      totalDeposited: 0,
      totalDeducted: 0,
      participationEligible: true,
      history: [],
    };
  }

  return {
    ...incoming,
    policy: "required",
    amount: DEFAULT_DEPOSIT_AMOUNT,
    currency: "KRW",
    status: "pending",
    waived: false,
    balance: 0,
    requiredBalance: DEFAULT_DEPOSIT_AMOUNT,
    topUpRequiredAmount: DEFAULT_DEPOSIT_AMOUNT,
    totalDeposited: 0,
    totalDeducted: 0,
    participationEligible: false,
    history: [],
  };
}

module.exports = {
  FEMALE_FIRST_COHORT_POLICY_SOURCE,
  FEMALE_FIRST_COHORT_ROUND_ID,
  buildInitialDeposit,
  normalizeGender,
  shouldWaiveInitialDeposit,
};
