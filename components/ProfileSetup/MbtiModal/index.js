import React, { useEffect, useState } from "react";
import BottomSheet from ".././BottomSheet";
import { MBTI_GROUPS } from ".././constants";

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

export default function MbtiModal({ open, value, onClose, onConfirm }) {
  const [temp, setTemp] = useState(["", "", "", ""]);

  useEffect(() => {
    if (!open) return;
    const parsed =
      value && value.length === 4 ? value.split("") : ["", "", "", ""];
    setTemp(parsed);
  }, [open, value]);

  const isComplete = temp.every(Boolean);

  const pick = (index, key) => {
    setTemp((prev) => {
      const next = [...prev];
      next[index] = key;
      return next;
    });
  };

  return (
    <BottomSheet open={open} title="MBTI는 이성분들의 관심사입니다." onClose={onClose}>
      {/* 옵션 그리드 */}
      <div className="grid grid-cols-2 gap-2">
        {MBTI_GROUPS.map((pair, groupIndex) =>
          pair.map((item) => {
            const active = temp[groupIndex] === item.key;
            return (
              <button
                key={`${groupIndex}-${item.key}`}
                type="button"
                onClick={() => pick(groupIndex, item.key)}
                className={cn(
                  "rounded-xl border p-3 text-left transition",
                  active
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                )}
              >
                <p
                  className={cn(
                    "text-[15px] font-black",
                    active ? "text-blue-600" : "text-slate-700"
                  )}
                >
                  {item.key}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-600">
                  {item.title}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">{item.desc}</p>
              </button>
            );
          })
        )}
      </div>

      {/* 선택 결과 */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-[12px] font-semibold text-slate-500">선택 결과</p>
        <p className="mt-1 text-[20px] font-black tracking-widest text-slate-900">
          {temp.map((v) => v || "_").join("")}
        </p>
      </div>

      {/* ✅ 하단 버튼: BottomSheet 내부에 포함 (fixed 제거) */}
      <div className="mt-4 grid grid-cols-2 gap-2 pb-2">
        <button
          type="button"
          onClick={onClose}
          className="h-12 rounded-xl bg-slate-200 text-[15px] font-extrabold text-slate-700 transition hover:bg-slate-300"
        >
          취소
        </button>
        <button
          type="button"
          disabled={!isComplete}
          onClick={() => onConfirm(temp.join(""))}
          className="h-12 rounded-xl bg-[#ff4338] text-[15px] font-extrabold text-white transition hover:brightness-95 disabled:opacity-50"
        >
          확인
        </button>
      </div>
    </BottomSheet>
  );
}