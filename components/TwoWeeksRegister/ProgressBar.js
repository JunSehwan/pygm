import { STEP_LABELS } from "./constants";
import { cx } from "./helpers";

export default function ProgressBar({ step, dark = false }) {
  return (
    <div>
      <div className={dark ? "text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 md:text-sm" : "text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 md:text-sm"}>
        STEP {step} / 4
      </div>
      <div className="mt-4 grid w-full max-w-[520px] grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((item) => (
          <div key={item}>
            <div
              className={cx(
                "h-1 rounded-full transition",
                item <= step ? (dark ? "bg-white" : "bg-black") : (dark ? "bg-white/18" : "bg-slate-200")
              )}
            />
            <div
              className={cx(
                "mt-2 hidden text-[11px] font-semibold leading-4 md:block",
                item <= step ? (dark ? "text-white" : "text-slate-950") : (dark ? "text-white/35" : "text-slate-400")
              )}
            >
              {STEP_LABELS[item - 1]}
            </div>
          </div>
        ))}
      </div>
      <div className={cx("mt-2 text-xs font-semibold md:hidden", dark ? "text-white/70" : "text-slate-500")}>
        {STEP_LABELS[step - 1]}
      </div>
    </div>
  );
}
