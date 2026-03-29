import React from "react";
import {
  PiHeartDuotone,
  PiUserCircleDuotone,
  PiWineDuotone,
  PiCigaretteDuotone,
  PiChatsCircleDuotone,
  PiCalendarHeartDuotone,
} from "react-icons/pi";
import { normalizeInterestList } from "./arenaDetailUtils";

function DetailRow({ icon, label, value }) {
  if (!value) return null;

  const Icon = icon;

  return (
    <div className="flex items-center gap-3 rounded-[12px] bg-slate-50 px-3.5 py-3">
      <div className="shrink-0 text-slate-500">
        <Icon className="text-[20px]" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-semibold text-slate-400">{label}</div>
        <div className="mt-0.5 break-keep text-[14px] font-semibold leading-5 text-zinc-800">
          {value}
        </div>
      </div>
    </div>
  );
}

export default function ArenaBasicInfoList({ summary }) {
  return (
    <div className="mt-4 rounded-[14px] border border-slate-200 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="grid grid-cols-1 gap-2">
        <DetailRow icon={PiUserCircleDuotone} label="직업군" value={summary.jobType} />
        <DetailRow icon={PiUserCircleDuotone} label="키" value={summary.height} />
        <DetailRow icon={PiHeartDuotone} label="관심사" value={summary.interest} />
        <DetailRow icon={PiWineDuotone} label="음주" value={summary.drink} />
        <DetailRow icon={PiCigaretteDuotone} label="흡연 인식" value={summary.smoke} />
        <DetailRow icon={PiCalendarHeartDuotone} label="연애 성향" value={summary.datingStyle} />
        <DetailRow icon={PiChatsCircleDuotone} label="연락 스타일" value={summary.contactStyle} />
      </div>
    </div>
  );
}