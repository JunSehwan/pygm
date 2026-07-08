import React from "react";

const TAB_ITEMS = [
  { key: "overview", label: "대시보드" },
  { key: "broadcast", label: "방송용" },
  { key: "users", label: "회원 승인" },
  { key: "memberList", label: "전체 회원" },
  { key: "cards", label: "카드 승인" },
  { key: "reports", label: "신고 검토" },
  { key: "payments", label: "결제 확인" },
  { key: "matches", label: "매칭 현황" },
];

export default function AdminTabs({ activeTab, onChange, counts = {} }) {
  const getCount = (key) => {
    if (key === "broadcast") return counts.totalUsers || 0;
    if (key === "users") return counts.approvalUsers || counts.pendingUsers || 0;
    if (key === "memberList") return counts.totalUsers || 0;
    if (key === "cards") return counts.pendingCards || 0;
    if (key === "reports") return counts.pendingReports || 0;
    if (key === "payments") return counts.pendingPayments || 0;
    if (key === "matches") return counts.successMatches || 0;
    return 0;
  };

  return (
    <div className="rounded-md border border-slate-200 bg-white p-2 shadow-sm">
      <div className="flex gap-2 overflow-x-auto py-2">
        {TAB_ITEMS.map((item) => {
          const active = activeTab === item.key;
          const count = getCount(item.key);

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-[13px] font-semibold transition-all duration-150 active:scale-[0.97] ${active
                  ? "bg-violet-600 text-white shadow-[0_4px_12px_rgba(124,58,237,0.18)]"
                  : "bg-slate-50 text-slate-700 hover:shadow-sm"
                }`}
              style={{ cursor: "pointer" }}
            >
              <span>{item.label}</span>

              {item.key !== "overview" ? (
                <span
                  className={`inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] ${active ? "bg-white/20 text-white" : "bg-white text-slate-500"
                    }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}