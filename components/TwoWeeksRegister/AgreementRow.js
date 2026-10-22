import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { cx } from "./helpers";

export default function AgreementRow({ item, checked, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-solid border-[#e8edf3] last:border-b-0">
      <div className="flex items-center gap-3 py-4">
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={cx(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border border-solid text-sm font-extrabold transition",
            checked ? "border-[#1769d2] bg-[#1769d2] text-white" : "border-[#c6d0da] bg-white text-transparent"
          )}
          aria-label={`${item.title} 동의`}
          aria-pressed={Boolean(checked)}
        >
          ✓
        </button>
        <span className="min-w-0 flex-1 break-keep text-xs font-bold leading-6 text-[#263f58]">
          {item.title}
        </span>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#718395]"
          aria-expanded={open}
          aria-label={`${item.title} 상세 ${open ? "닫기" : "보기"}`}
        >
          상세 <FiChevronDown className={cx("transition", open ? "rotate-180" : "")} />
        </button>
      </div>
      {open ? (
        <div className="mb-4 rounded-[10px] bg-[#f7f9fb] p-4 text-xs leading-6 text-[#5b6e81]">
          {item.summary ? <p className="mb-2 font-bold">{item.summary}</p> : null}
          {item.detail}
        </div>
      ) : null}
    </div>
  );
}
