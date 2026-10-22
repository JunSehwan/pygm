const DEFAULT_DEPOSIT_AMOUNT = 30000;

function isDepositWaived(deposit = {}) {
  return deposit?.policy === "waived" || deposit?.status === "waived" || deposit?.waived === true;
}

function getRequiredBalance(deposit = {}) {
  if (isDepositWaived(deposit)) return 0;
  const explicit = Number(deposit?.requiredBalance);
  if (Number.isFinite(explicit) && explicit > 0) return Math.round(explicit);
  const amount = Number(deposit?.amount);
  if (Number.isFinite(amount) && amount > 0) return Math.round(amount);
  return DEFAULT_DEPOSIT_AMOUNT;
}

function getBalance(deposit = {}) {
  if (isDepositWaived(deposit)) return 0;
  const explicit = Number(deposit?.balance);
  if (Number.isFinite(explicit) && explicit >= 0) return Math.round(explicit);
  return deposit?.status === "confirmed" ? getRequiredBalance(deposit) : 0;
}

function isParticipationEligible(deposit = {}) {
  if (isDepositWaived(deposit)) return true;
  return deposit?.status === "confirmed" && getBalance(deposit) >= getRequiredBalance(deposit);
}

function clampDeduction(requiredBalance, rate) {
  const amount = Math.max(0, Number(requiredBalance || 0));
  return Math.min(amount, Math.round(amount * Number(rate || 0)));
}

module.exports = {
  DEFAULT_DEPOSIT_AMOUNT,
  clampDeduction,
  getBalance,
  getRequiredBalance,
  isDepositWaived,
  isParticipationEligible,
};
