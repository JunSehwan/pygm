import React from "react";

export function SummaryCard({ icon: Icon, title, value, accent = "violet" }) {
  const accentClass =
    accent === "rose"
      ? "bg-rose-50 text-rose-600"
      : accent === "blue"
        ? "bg-blue-50 text-blue-600"
        : accent === "emerald"
          ? "bg-emerald-50 text-emerald-600"
          : "bg-violet-50 text-violet-600";

  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-md ${accentClass}`}>
          <Icon className="text-[20px]" />
        </div>
        <div className="min-w-0">
          <div className="text-[12px] font-medium text-slate-500">{title}</div>
          <div className="mt-1 text-[20px] font-bold leading-none text-slate-900">{value}</div>
        </div>
      </div>
    </div>
  );
}

export function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white px-2 py-2 shadow-sm">
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600">
            <Icon className="text-[20px]" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-bold text-slate-900">{title}</div>
          {description ? (
            <p className="mt-1 break-keep text-[13px] leading-5 text-slate-500">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

export function ActionButton({ children, onClick, tone = "violet", disabled = false, className = "" }) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-600 hover:bg-emerald-700"
      : tone === "rose"
        ? "bg-rose-500 hover:bg-rose-600"
        : tone === "slate"
          ? "bg-slate-700 hover:bg-slate-800"
          : tone === "bg"
            ? "bg-slate-900 hover:bg-slate-950"
            : "bg-violet-600 hover:bg-violet-700";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ cursor: disabled ? "default" : "pointer" }}
      className={`flex h-10 items-center justify-center rounded-md px-3 text-[13px] font-semibold text-white transition disabled:opacity-50 ${toneClass} ${className}`}
    >
      {children}
    </button>
  );
}

export function OutlineButton({ children, onClick, disabled = false, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ cursor: disabled ? "default" : "pointer" }}
      className={`flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function MiniBadge({ children, tone = "slate" }) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "rose"
        ? "bg-rose-50 text-rose-700"
        : tone === "violet"
          ? "bg-violet-50 text-violet-700"
          : tone === "blue"
            ? "bg-blue-50 text-blue-700"
            : "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${toneClass}`}>
      {children}
    </span>
  );
}

export function InfoRow({ title, value }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-3">
      <div className="text-[12px] font-medium text-slate-500">{title}</div>
      <div className="text-right text-[12px] font-semibold text-slate-800">{value}</div>
    </div>
  );
}

export function EmptyBlock({ text }) {
  return (
    <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-[13px] text-slate-500">
      {text}
    </div>
  );
}

export function LabelValue({ label, value }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-3">
      <div className="text-[11px] font-medium text-slate-500">{label}</div>
      <div className="mt-1 break-keep text-[13px] font-semibold leading-5 text-slate-800">
        {value}
      </div>
    </div>
  );
}
