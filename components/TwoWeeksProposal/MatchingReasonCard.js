import { FiMapPin, FiStar, FiClock } from "react-icons/fi";
import { AGE_PRIORITY_LABELS } from "./constants";

export default function MatchingReasonCard({ score }) {
  if (!score) return null;

  const age = score.agePriority || {};

  return (
    <div className="rounded-[28px] border border-zinc-200 bg-[#faf8f6] p-5 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-orange-500">추천 기준</div>
          <h3 className="mt-1 text-xl font-black tracking-[-0.04em] text-zinc-950">
            {AGE_PRIORITY_LABELS[age.grade] || "후보풀 검토"}
          </h3>
        </div>
        <div className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-black text-white">
          {score.total}점
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex gap-3 rounded-2xl bg-white p-4">
          <FiStar className="mt-1 shrink-0 text-orange-500" />
          <div>
            <div className="text-sm font-black text-zinc-950">{age.diffLabel}</div>
            <div className="mt-1 break-keep text-xs leading-5 text-zinc-500">{age.detail}</div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-black text-zinc-950">
              <FiMapPin className="text-orange-500" />
              활동 지역
            </div>
            <div className="mt-2 text-xs leading-5 text-zinc-500">
              {score.areaOverlap?.length ? score.areaOverlap.join(" · ") : "추가 조율 필요"}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-black text-zinc-950">
              <FiClock className="text-orange-500" />
              가능 시간
            </div>
            <div className="mt-2 text-xs leading-5 text-zinc-500">
              {score.timeOverlap?.length ? score.timeOverlap.join(" · ") : "추가 조율 필요"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
