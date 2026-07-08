import React from "react";
import { useRouter } from "next/router";
import { FiPlus } from "react-icons/fi";

export default function CardListHeader({
  title = "차밍카드",
  desc = "",
  showCreateButton,
}) {
  const router = useRouter();

  return (
    <div className="border-b border-slate-200 bg-white px-4 pb-3 pt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[22px] font-extrabold tracking-[-0.03em] text-zinc-900">
            {title}
          </div>

          {desc ? (
            <div className="mt-1 break-keep text-[13px] leading-5 text-slate-500">
              {desc}
            </div>
          ) : null}
        </div>

        {showCreateButton ? (
          <button
            type="button"
            onClick={() => router.push("/cards/create")}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 px-3 text-[13px] font-semibold text-violet-700 transition hover:bg-violet-100"
            style={{ cursor: "pointer" }}
          >
            <FiPlus className="text-[15px]" />
            차밍카드 만들기
          </button>
        ) : null}
      </div>
    </div>
  );
}