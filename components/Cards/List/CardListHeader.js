import React from "react";

export default function CardListHeader({ title, desc }) {
  return (
    <div className="border-b border-slate-200 bg-white border-solid px-4 pb-4 pt-8">
      <h1 className="text-[24px] font-bold tracking-[-0.03em] text-slate-900">
        {title}
      </h1>

      {desc ? (
        <p className="mt-2 whitespace-pre-line text-[14px] leading-6 text-slate-500">
          {desc}
        </p>
      ) : null}
    </div>
  );
}