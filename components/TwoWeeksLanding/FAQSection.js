import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import MobileFrame from "./MobileFrame";
import { FAQ_ITEMS } from "./constants";

function FAQItem({ item, index, open, onToggle }) {
  return (
    <article className="border-b border-slate-200 border-solid last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-5 py-6 text-left md:py-7"
      >
        <span className="flex min-w-0 items-start gap-4">
          <span className="mt-1 text-xs font-black text-[#ff5b4d]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="break-keep text-base font-black leading-7 text-slate-950 md:text-lg">
            {item.q}
          </span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600">
          <FiChevronDown
            className={`transition duration-300 ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <p className="break-keep pb-7 pl-8 pr-12 text-sm font-medium leading-7 text-slate-600 md:pl-10 md:text-base md:leading-8">
            {item.a}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="bg-white text-slate-950">
      <MobileFrame className="py-20 md:py-32">
        <div className="grid gap-10 lg:grid-cols-[0.68fr_1.32fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-black tracking-[0.08em] text-[#ff5b4d] md:text-sm">
              자주 묻는 질문
            </p>
            <h2 className="mt-5 break-keep text-[38px] font-black leading-[1.12] tracking-[-0.015em] md:text-6xl">
              신청 전,
              <br />
              궁금한 점을 확인하세요.
            </h2>
          </div>

          <div className="border-t border-slate-950">
            {FAQ_ITEMS.map((item, index) => (
              <FAQItem
                key={item.q}
                item={item}
                index={index}
                open={openIndex === index}
                onToggle={() =>
                  setOpenIndex(openIndex === index ? -1 : index)
                }
              />
            ))}
          </div>
        </div>
      </MobileFrame>
    </section>
  );
}
