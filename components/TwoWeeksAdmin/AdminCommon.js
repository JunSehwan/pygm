import { cx, getStatusLabel } from "./utils";

export function StatCard({ label, value, sub }) {
  return (
    <div className="border border-zinc-200 bg-white p-4">
      <div className="text-xs font-bold text-zinc-400">{label}</div>
      <div className="mt-2 text-3xl font-black tracking-[-0.06em] text-zinc-950">{value}</div>
      {sub ? <div className="mt-1 text-xs font-semibold text-zinc-500">{sub}</div> : null}
    </div>
  );
}

export function StatusBadge({ value, tone = "default" }) {
  const styles = {
    default: "border-zinc-200 bg-zinc-50 text-zinc-700",
    dark: "border-zinc-950 bg-zinc-950 text-white",
    good: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warn: "border-orange-200 bg-orange-50 text-orange-700",
    bad: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <span className={cx("inline-flex whitespace-nowrap border px-2.5 py-1 text-xs font-black", styles[tone] || styles.default)}>
      {getStatusLabel(value)}
    </span>
  );
}

export function Section({ title, desc, action, children }) {
  return (
    <section className="border border-zinc-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-[-0.045em] text-zinc-950">{title}</h2>
          {desc ? <p className="mt-1 break-keep text-sm leading-6 text-zinc-500">{desc}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function FieldRow({ label, value }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-3 border-t border-zinc-100 py-3 first:border-t-0">
      <div className="text-xs font-bold text-zinc-400">{label}</div>
      <div className="break-keep text-sm font-semibold leading-6 text-zinc-800">{value || "-"}</div>
    </div>
  );
}

export function ActionButton({ children, onClick, disabled, tone = "dark" }) {
  const styles = {
    dark: "border-zinc-950 bg-zinc-950 text-white hover:bg-zinc-800",
    light: "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-950",
    good: "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700",
    warn: "border-orange-500 bg-orange-500 text-white hover:bg-orange-600",
    bad: "border-rose-600 bg-rose-600 text-white hover:bg-rose-700",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "h-9 border px-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50",
        styles[tone] || styles.dark
      )}
    >
      {children}
    </button>
  );
}

export function InfoBox({ label, value, tone = "default" }) {
  return (
    <div className={cx("border p-4", tone === "dark" ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-zinc-50 text-zinc-950")}>
      <div className="text-xs font-bold text-zinc-400">{label}</div>
      <div className="mt-1 break-keep text-base font-black tracking-[-0.03em]">
        {value || "-"}
      </div>
    </div>
  );
}
