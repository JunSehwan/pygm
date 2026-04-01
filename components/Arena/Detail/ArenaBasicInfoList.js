import React, { useMemo } from "react";
import {
  PiBookOpenTextDuotone,
  PiBuildingsDuotone,
  PiHeartDuotone,
  PiMapPinDuotone,
  PiMoneyDuotone,
  PiMoonDuotone,
  PiRulerDuotone,
  PiUserCircleDuotone,
  PiWineDuotone,
} from "react-icons/pi";
import { getProfileSummary } from "lib/arena";

function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3 rounded-[12px] bg-slate-50 px-3 py-3">
      <div className="mt-[2px] flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
        <Icon className="text-[16px]" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-semibold text-slate-400">{label}</div>
        <div className="mt-1 break-keep text-[14px] leading-6 text-slate-900">
          {value}
        </div>
      </div>
    </div>
  );
}

function getDrinkLabel(user = {}) {
  const raw = String(user?.drink || user?.alcohol || "").trim();

  const map = {
    "0": "안마심",
    "1": "가끔",
    "2": "보통",
    "3": "자주",
    none: "안마심",
    no: "안마심",
    sometimes: "가끔",
    normal: "보통",
    often: "자주",
  };

  return map[raw] || raw || "";
}

function getSmokeLabel(user = {}) {
  const raw = String(user?.smoke || user?.smoking || "").trim();

  const map = {
    "0": "비흡연",
    "1": "가끔",
    "2": "흡연",
    none: "비흡연",
    no: "비흡연",
    sometimes: "가끔",
    yes: "흡연",
  };

  return map[raw] || raw || "";
}

export default function ArenaBasicInfoList({ user }) {
  const summary = useMemo(() => getProfileSummary(user || {}), [user]);

  const rows = [
    {
      icon: PiUserCircleDuotone,
      label: "직업군",
      value: summary?.jobTypeLabel || summary?.jobType || "",
    },
    {
      icon: PiBuildingsDuotone,
      label: "직업",
      value: summary?.jobLabel || "",
    },
    // {
    //   icon: PiRulerDuotone,
    //   label: "키",
    //   value: summary?.heightLabel || summary?.height || "",
    // },
    {
      icon: PiHeartDuotone,
      label: "관심사",
      value: summary?.interestLabel || summary?.interest || "",
    },
    {
      icon: PiWineDuotone,
      label: "음주",
      value: getDrinkLabel(user || {}),
    },
    {
      icon: PiMoonDuotone,
      label: "흡연",
      value: getSmokeLabel(user || {}),
    },
    // {
    //   icon: PiBookOpenTextDuotone,
    //   label: "학력",
    //   value: summary?.educationLabel || summary?.education || "",
    // },
    // {
    //   icon: PiMoneyDuotone,
    //   label: "연봉",
    //   value: summary?.salaryLabel || summary?.salary || "",
    // },
    // {
    //   icon: PiMapPinDuotone,
    //   label: "거주지",
    //   value: summary?.residenceLabel || summary?.residence || "",
    // },
    // {
    //   icon: PiMapPinDuotone,
    //   label: "근무지",
    //   value: summary?.workAreaLabel || summary?.workArea || "",
    // },
  ];

  return (
    <div className="mt-4 rounded-[14px] border border-slate-200 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="grid grid-cols-1 gap-2">
        {rows.map((row) => (
          <DetailRow
            key={row.label}
            icon={row.icon}
            label={row.label}
            value={row.value}
          />
        ))}
      </div>
    </div>
  );
}