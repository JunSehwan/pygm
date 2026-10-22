export const TWOWEEKS_DEPOSIT_AMOUNT = 30000;
export const TWOWEEKS_DEPOSIT_PRESET_AMOUNTS = [20000, 30000];
export const TWOWEEKS_DEPOSIT_BANK = {
  bankName: "하나은행",
  accountNumber: "112-891138-99107",
  accountHolder: "전세환",
};

export const TWOWEEKS_DEPOSIT_DEDUCTION_POLICY = {
  afterMutualAcceptBeforeScheduleConfirmed: {
    rate: 0.3,
    amount: 9000,
    label: "양쪽 수락 후 일정·장소 확정 전 취소",
  },
  afterScheduleConfirmedUntilDayBefore: {
    rate: 0.5,
    amount: 15000,
    label: "일정·장소 확정 후 만남 전날까지 취소",
  },
  sameDayCancel: {
    rate: 1,
    amount: 30000,
    label: "만남 당일 00:00 이후 취소",
  },
  noShow: {
    rate: 1,
    amount: 30000,
    label: "노쇼(무단 불참)",
  },
};

export function normalizeDepositAmount(value, fallback = TWOWEEKS_DEPOSIT_AMOUNT) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric >= 0) return Math.round(numeric);

  const safeFallback = Number(fallback);
  return Number.isFinite(safeFallback) && safeFallback > 0
    ? Math.round(safeFallback)
    : TWOWEEKS_DEPOSIT_AMOUNT;
}

export function isDepositWaived(deposit = {}) {
  return deposit?.policy === "waived" || deposit?.status === "waived" || deposit?.waived === true;
}

export function getDepositRequiredBalance(deposit = {}) {
  if (isDepositWaived(deposit)) return 0;
  const explicit = Number(deposit?.requiredBalance);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;

  const amount = Number(deposit?.amount);
  if (Number.isFinite(amount) && amount > 0) return amount;

  return TWOWEEKS_DEPOSIT_AMOUNT;
}

export function getDepositDeductionPolicy(depositOrAmount = {}) {
  const requiredBalance = typeof depositOrAmount === "number"
    ? normalizeDepositAmount(depositOrAmount, 0)
    : getDepositRequiredBalance(depositOrAmount);

  return Object.fromEntries(
    Object.entries(TWOWEEKS_DEPOSIT_DEDUCTION_POLICY).map(([key, policy]) => [
      key,
      {
        ...policy,
        amount: Math.min(requiredBalance, Math.round(requiredBalance * Number(policy.rate || 0))),
      },
    ])
  );
}

export function getDepositPolicySnapshot(depositOrAmount = {}) {
  const requiredBalance = typeof depositOrAmount === "number"
    ? normalizeDepositAmount(depositOrAmount, 0)
    : getDepositRequiredBalance(depositOrAmount);
  const policy = getDepositDeductionPolicy(requiredBalance);

  return {
    amount: requiredBalance,
    cancellationAfterMutualAcceptBeforeScheduleConfirmedDeduction:
      policy.afterMutualAcceptBeforeScheduleConfirmed.amount,
    cancellationAfterScheduleConfirmedUntilDayBeforeDeduction:
      policy.afterScheduleConfirmedUntilDayBefore.amount,
    sameDayCancellationDeduction: policy.sameDayCancel.amount,
    noShowDeduction: policy.noShow.amount,
    topUpRequiredBeforeNextMatching: requiredBalance > 0,
    matchingFailedCarryOverDefault: true,
    matchingFailedRefundOnRequest: true,
    normalParticipationRefundOrCarryOver: true,
  };
}

export function getDepositBalance(deposit = {}) {
  if (isDepositWaived(deposit)) return 0;
  const explicit = Number(deposit?.balance);
  if (Number.isFinite(explicit) && explicit >= 0) return explicit;

  const required = getDepositRequiredBalance(deposit);
  const topUpRequired = Number(deposit?.topUpRequiredAmount);
  if (Number.isFinite(topUpRequired) && topUpRequired > 0) {
    return Math.max(0, required - topUpRequired);
  }

  if (deposit?.status === "confirmed") return required;
  return 0;
}

export function getDepositTopUpRequiredAmount(deposit = {}) {
  if (isDepositWaived(deposit)) return 0;
  if (["refund_requested", "refunded"].includes(String(deposit?.status || ""))) return 0;

  const required = getDepositRequiredBalance(deposit);
  const balance = getDepositBalance(deposit);
  return Math.max(0, required - balance);
}

export function isDepositParticipationEligible(deposit = {}) {
  if (isDepositWaived(deposit)) return true;
  if (deposit?.status !== "confirmed") return false;
  return getDepositTopUpRequiredAmount(deposit) === 0;
}

export function getDepositHistory(deposit = {}) {
  return Array.isArray(deposit?.history) ? deposit.history : [];
}

export function formatWon(value = 0) {
  const number = Number(value || 0);
  return `${(Number.isFinite(number) ? number : 0).toLocaleString()}원`;
}
