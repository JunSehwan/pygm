import { FiCheckCircle } from "react-icons/fi";
import { DEPOSIT_INFO } from "./constants";

const policyItems = [
  "운영상 매칭 실패 시 다음 회차 이월이 기본이며, 요청 시 환불 가능합니다.",
  "정상 참여 시 환급 또는 다음 회차 크레딧 전환이 가능합니다.",
  "상호 수락 후 확정된 뒤 무단 불참 또는 당일 취소 시 미환급될 수 있습니다.",
  "거절 또는 실패 시 운영자 검토 후 다음 후보 제안이 가능합니다.",
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
