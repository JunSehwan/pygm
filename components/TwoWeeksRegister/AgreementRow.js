import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { cx } from "./helpers";

export default function AgreementRow({ item, checked, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-slate-100 first:border-t-0">
      <div className="flex items-start gap-4 py-4 md:py-5">
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={cx(
            "mt-0.5 flex h-7 w-7 shrink-0 border-solid items-center justify-center rounded-md border text-sm font-black transition",
            checked ? "border-black bg-black text-white" : "border-slate-300 bg-white text-transparent"
          )}
          aria-label={`${item.title} 체크`}
        >
          ✓
        </button>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex w-full items-start justify-between gap-4 text-left"
          >
            <div>
              <div className="break-keep text-sm font-black leading-6 text-slate-950 md:text-base">
                {item.title}
              </div>
              {item.summary ? (
                <div className="mt-1 break-keep text-xs leading-5 text-slate-500 md:text-sm md:leading-6">
                  {item.summary}
                </div>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-500 md:text-sm">
              내용 보기
              <FiChevronDown className={cx("transition", open ? "rotate-180" : "")} />
            </div>
          </button>

          <div className={cx("grid transition-all duration-300", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}> 
            <div className="overflow-hidden">
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-600 md:text-sm md:leading-7">
                {item.detail}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
