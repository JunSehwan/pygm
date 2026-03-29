import React from "react";

export default function LegalSectionCard({ title, children }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="text-[15px] font-bold text-slate-900">{title}</div>
      <div className="mt-3 space-y-2 break-keep text-[13px] leading-6 text-slate-600">
        {children}
      </div>
    </section>
  );
}