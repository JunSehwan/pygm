import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PiArrowLeft, PiCaretDownBold, PiCaretUpBold } from "react-icons/pi";
import { buildValueSections } from "./arenaDetailUtils";

function SectionCard({ section, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  if (!section?.items?.length) return null;

  return (
    <div className="overflow-hidden rounded-[14px] border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between px-4 py-4 text-left ${open ? "bg-violet-50" : "bg-white"
          }`}
        style={{ cursor: "pointer" }}
      >
        <div className="min-w-0">
          <div className="text-[15px] font-bold text-zinc-900">{section.title}</div>
          <div className="mt-1 text-[12px] font-medium text-slate-400">
            {section.items.length}개 응답
          </div>
        </div>

        <div className="text-slate-500">
          {open ? <PiCaretUpBold className="text-[16px]" /> : <PiCaretDownBold className="text-[16px]" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden border-t border-slate-200"
          >
            <div className="space-y-3 px-4 py-4">
              {section.items.map((item, index) => (
                <div key={`${section.key}-${index}`} className="rounded-[12px] bg-slate-50 px-4 py-3">
                  <div className="text-[12px] font-semibold text-slate-400">
                    {item.label}
                  </div>
                  <div className="mt-1 break-keep text-[14px] font-semibold leading-6 text-zinc-800">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function ArenaValueModal({ open, onClose, user }) {
  const sections = useMemo(() => buildValueSections(user || {}), [user]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="absolute inset-0 z-40 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.985 }}
            className="absolute inset-x-0 bottom-0 z-50 flex max-h-[84%] flex-col rounded-t-[18px] bg-white shadow-[0_-18px_60px_rgba(15,23,42,0.18)]"
          >
            <div className="shrink-0 border-b border-slate-200">
              <div className="flex h-[58px] items-center justify-between px-4">
                <div className="text-[17px] font-extrabold tracking-[-0.03em] text-zinc-900">
                  가치관
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 hover:bg-slate-100"
                  style={{ cursor: "pointer" }}
                >
                  <PiArrowLeft className="text-[20px]" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-3">
                {sections.map((section, index) => (
                  <SectionCard
                    key={section.key}
                    section={section}
                    defaultOpen={index === 0}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}