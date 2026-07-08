import { FiClock, FiCreditCard, FiHeart, FiUser } from "react-icons/fi";
import { STATUS_LABELS } from "./constants";
import { getGenderLabel, getSafeBasic } from "./helpers";

function StatBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5">
      <Icon className="text-2xl text-orange-500" />
      <div className="mt-4 text-xs font-semibold text-zinc-500">{label}</div>
      <div className="mt-1 break-keep text-lg font-black tracking-[-0.03em] text-zinc-950">
        {value}
      </div>
    </div>
  );
}

export default function StatusSummaryCard({ application }) {
  const basic = getSafeBasic(application);

  return (
    <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-[0_20px_70px_rgba(0,0,0,0.06)] md:p-7">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-semibold text-orange-500">내 신청 현황</div>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-zinc-950">
            {basic.nickname || basic.name || "신청자"}님의 투윅스
          </h2>
        </div>
        <div className="rounded-full bg-zinc-950 px-4 py-2 text-xs font-bold text-white">
          {STATUS_LABELS[application?.status] || application?.status || "신청 확인"}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <StatBox icon={FiUser} label="신청자" value={`${getGenderLabel(basic.gender)} / ${basic.age || "-"}세`} />
        <StatBox icon={FiCreditCard} label="예치금" value={application?.deposit?.status === "confirmed" ? "입금 확인" : "확인 대기"} />
        <StatBox icon={FiHeart} label="매칭 상태" value={STATUS_LABELS[application?.matchingStatus] || "매칭 대기"} />
        <StatBox icon={FiClock} label="응답 기준" value="제안 후 24시간" />
      </div>
    </div>
  );
}
