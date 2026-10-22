import { FiCheck, FiHeart } from "react-icons/fi";

export default function MatchingReasonCard({ score }) {
  const reasons = Array.isArray(score?.reasons) ? score.reasons.filter(Boolean).slice(0, 3) : [];
  if (!score?.complete || !reasons.length) return null;

  return (
    <div className="rounded-[24px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-rose-50 p-5 md:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-lg text-[#1877f2] shadow-sm ring-1 ring-inset ring-blue-100">
          <FiHeart aria-hidden="true" />
        </span>
        <div>
          <div className="text-[12px] font-bold text-[#1877f2]">조건 계산 + 운영자 최종 검토</div>
          <h3 className="mt-1 text-[20px] font-bold tracking-[-0.04em] text-[#1c1e21]">두 분을 소개한 이유</h3>
          <p className="mt-1 break-keep text-[12px] font-semibold leading-5 text-[#65676b]">
            내부 점수 대신, 실제 선택에 도움이 되는 이유만 간단히 보여드려요.
          </p>
        </div>
      </div>

      <ul className="mt-5 grid gap-2.5">
        {reasons.map((reason, index) => (
          <li key={`${reason}_${index}`} className="flex gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-sm">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1877f2] text-[11px] text-white">
              <FiCheck aria-hidden="true" />
            </span>
            <div className="break-keep text-[13px] font-bold leading-6 text-[#1c1e21]">{reason}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
