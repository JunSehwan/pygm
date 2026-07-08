import { useState } from "react";
import { motion } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";
import MobileFrame from "./MobileFrame";
import SectionTitle from "./SectionTitle";
import { FAQ_ITEMS } from "./constants";
import { reveal } from "./motionConfig";

function FAQItem({ item, open, onToggle }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-7"
      >
        <div className="break-keep text-sm font-semibold leading-7 text-zinc-950 md:text-base">
          Q. {item.q}
        </div>
        <FiChevronDown
          className={`shrink-0 text-xl text-zinc-500 transition duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="break-keep border-t border-zinc-100 px-5 py-5 text-sm leading-7 text-zinc-600 md:px-7 md:text-base">
            {item.a}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="min-h-[100svh] bg-white md:min-h-screen md:snap-start">
      <MobileFrame className="flex min-h-[100svh] flex-col justify-center py-16 md:min-h-screen md:py-20">
        <motion.div {...reveal("up")}>
          <SectionTitle
            eyebrow="faq"
            title="자주 묻는 질문"
            desc="처음 신청하는 분들이 가장 궁금해하는 내용들을 정리했습니다."
          />
        </motion.div>

        <div className="mx-auto mt-8 w-full max-w-[390px] space-y-3 sm:max-w-[520px] md:mt-12 md:max-w-4xl md:space-y-4">
          {FAQ_ITEMS.map((item, idx) => (
            <motion.div key={item.q} {...reveal(idx % 2 === 0 ? "left" : "right", idx * 0.04)}>
              <FAQItem
                item={item}
                open={openIndex === idx}
                onToggle={() => setOpenIndex(openIndex === idx ? -1 : idx)}
              />
            </motion.div>
          ))}
        </div>
      </MobileFrame>
    </section>
  );
}
