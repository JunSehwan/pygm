import { FiCheckCircle } from "react-icons/fi";
import { DEPOSIT_INFO } from "./constants";
import { TWOWEEKS_DEPOSIT_DEDUCTION_POLICY, formatWon } from "../TwoWeeksShared/depositPolicy";

const policyItems = [
  `양쪽 수락 후 일정·장소 확정 전 취소: ${formatWon(TWOWEEKS_DEPOSIT_DEDUCTION_POLICY.afterMutualAcceptBeforeScheduleConfirmed.amount)} 차감`,
  `일정·장소 확정 후 만남 전날까지 취소: ${formatWon(TWOWEEKS_DEPOSIT_DEDUCTION_POLICY.afterScheduleConfirmedUntilDayBefore.amount)} 차감`,
  `만남 당일 00:00 이후 취소: ${formatWon(TWOWEEKS_DEPOSIT_DEDUCTION_POLICY.sameDayCancel.amount)} 전액 차감`,
  `노쇼(무단 불참): ${formatWon(TWOWEEKS_DEPOSIT_DEDUCTION_POLICY.noShow.amount)} 전액 차감`,
  `차감 후 예치금 잔액이 ${formatWon(DEPOSIT_INFO.amount)} 미만이면 다음 매칭 전 부족분을 추가 예치해야 합니다.`,
  "정상 참여 시 예치금은 반환받거나 다음 회차 예치금으로 유지할 수 있습니다.",
  "운영상 매칭 실패 시 다음 회차 이월이 기본이며, 요청 시 반환 가능합니다.",
  "서비스 이용을 중단할 경우 신청현황의 예치금 메뉴에서 반환 계좌를 입력해 요청할 수 있으며, 처리 가능한 잔액은 접수 후 3일 이내 반환합니다.",
  "반환에는 은행명·계좌번호·예금주만 필요하며 통장사본은 제출하지 않습니다.",
];

export default function DepositPolicyCard({ dark = false }) {
  if (dark) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-white">
        <h3 className="text-xl font-black tracking-[-0.04em]">예치금 입금 안내</h3>
        <div className="mt-5 space-y-3 text-sm leading-6 text-zinc-200">
          <div>입금 계좌 : {DEPOSIT_INFO.bankName} {DEPOSIT_INFO.accountNumber}</div>
          <div>예금주 : {DEPOSIT_INFO.accountHolder}</div>
          <div>예치금 : {DEPOSIT_INFO.amount.toLocaleString()}원</div>
        </div>
        <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
          {policyItems.map((item) => (
            <div key={item} className="flex gap-2 text-xs leading-5 text-zinc-300 md:text-sm md:leading-6">
              <FiCheckCircle className="mt-0.5 shrink-0 text-zinc-500" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_36px_rgba(15,23,42,0.04)]">
      <h3 className="text-xl font-black tracking-[-0.04em] text-slate-950">투윅스 1기 참여 예치금</h3>
      <div className="mt-3 text-[34px] font-black tracking-[-0.05em] text-slate-950">
        {DEPOSIT_INFO.amount.toLocaleString()}원
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
        <div>입금 계좌 : <span className="font-bold text-slate-950">{DEPOSIT_INFO.bankName} {DEPOSIT_INFO.accountNumber}</span></div>
        <div>예금주 : <span className="font-bold text-slate-950">{DEPOSIT_INFO.accountHolder}</span></div>
      </div>

      <div className="mt-6 space-y-3">
        {policyItems.map((item) => (
          <div key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
            <FiCheckCircle className="mt-1 shrink-0 text-black" />
            <span className="break-keep">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
