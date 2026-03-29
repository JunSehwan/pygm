import React from "react";
import { useRouter } from "next/router";

const ABOUT_TABS = [
  { key: "spoon", label: "스푼 안내", href: "/about/spoon" },
  { key: "service", label: "이용약관", href: "/about/service" },
  { key: "privacy", label: "개인정보", href: "/about/privacy" },
];

export default function AboutTabs({ activeKey = "spoon" }) {
  const router = useRouter();

  return (
    <div className="border-t border-slate-100 bg-white px-4 pt-2">
      <div className="flex items-center rounded-md bg-slate-100 p-1">
        {ABOUT_TABS.map((tab) => {
          const active = tab.key === activeKey;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => router.push(tab.href)}
              style={{ cursor: "pointer" }}
              className={[
                "flex-1 rounded-md px-3 py-2.5 text-[13px] font-semibold transition",
                active
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}