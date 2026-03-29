import React from "react";
import { CARD_SORT_TABS } from "./cardListMeta";

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

export default function CardListTabs({
  activeTab,
  tabs,
  onClickTab,
}) {
  return (
    <div className="border-b border-slate-200 bg-white px-3 pb-2 pt-3">
      <div className="flex gap-1 overflow-x-auto pb-2">
        {tabs.map((item) => {
          const active = activeTab === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onClickTab(item.key)}
              className={cn(
                "shrink-0 rounded-md border px-4 py-2 text-[14px] font-medium transition",
                active
                  ? "border-violet-300 bg-violet-700 text-white"
                  : "border-slate-300 bg-white text-slate-600"
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function getMaleTabs() {
  return CARD_SORT_TABS;
}

export function getSimpleTabs() {
  return CARD_SORT_TABS.filter((item) =>
    ["recommended", "latest", "popular"].includes(item.key)
  );
}