import React from "react";
import {
  PiBookOpenTextDuotone,
  PiBuildingsDuotone,
  PiHeartDuotone,
  PiMapPinDuotone,
} from "react-icons/pi";

function GroupCard({ title, icon: Icon, rows = [] }) {
  if (!rows.length) return null;

  return (
    <div className="rounded-[14px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-3">
        <div className="flex shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500">
          <Icon className="text-[18px]" />
        </div>
        <div className="text-[12px] font-semibold text-slate-400">{title}</div>
      </div>

      <div className="mt-4 space-y-1">
        {rows.map((row) => (
          <div key={`${title}-${row.label}`} className="flex items-center gap-2">
            <div className="min-w-[64px] text-[13px] font-semibold text-slate-400">
              {row.label}
            </div>
            <div className="min-w-0 flex-1 break-keep text-[15px] leading-6 text-slate-900">
              {row.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ArenaBasicInfoList({ summary }) {
  if (!summary) return null;

  const jobRows = Array.isArray(summary?.jobInfoRows) ? summary.jobInfoRows : [];
  const educationRows = Array.isArray(summary?.educationInfoRows)
    ? summary.educationInfoRows
    : [];
  const livingRows = Array.isArray(summary?.livingInfoRows)
    ? summary.livingInfoRows
    : [];
  const etcRows = Array.isArray(summary?.etcInfoRows) ? summary.etcInfoRows : [];

  const hasAnyRows =
    jobRows.length || educationRows.length || livingRows.length || etcRows.length;

  if (!hasAnyRows) return null;

  return (
    <div className="mt-4 space-y-1">
      <GroupCard
        title="직업"
        icon={PiBuildingsDuotone}
        rows={jobRows}
      />

      <GroupCard
        title="학력"
        icon={PiBookOpenTextDuotone}
        rows={educationRows}
      />

      <GroupCard
        title="생활 정보"
        icon={PiMapPinDuotone}
        rows={livingRows}
      />

      <GroupCard
        title="기타 정보"
        icon={PiHeartDuotone}
        rows={etcRows}
      />
    </div>
  );
}