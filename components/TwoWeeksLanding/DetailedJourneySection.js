import { useState } from "react";
import { FiCheck, FiChevronRight } from "react-icons/fi";
import MobileFrame from "./MobileFrame";
import { JOURNEY_GROUPS } from "./constants";

function JourneyGroupCard({ group }) {
  return (
    <article className="h-full rounded-[28px] border border-solid shadow border-slate-200 bg-white p-5 md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black text-[#d85b48]">{group.eyebrow}</p>
          <h3 className="mt-2 text-2xl font-black tracking-[-0.045em] text-slate-950">
            {group.title}
          </h3>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
          {group.label}
        </span>
      </div>

      <ol className="mt-7 space-y-2.5">
        {group.steps.map((step) => (
          <li key={step.number} className="rounded-2xl bg-[#f7f8fa] p-4">
            <div className="flex gap-3">
              <span className="pt-0.5 text-[11px] font-black text-[#d85b48]">{step.number}</span>
              <div>
                <h4 className="text-sm font-black text-slate-950 md:text-base">{step.title}</h4>
                <p className="mt-1.5 break-keep text-[13px] font-medium leading-4 text-slate-600 md:text-sm md:leading-5">
                  {step.desc}
                </p>
                {step.detail ? (
                  <p className="mt-2 break-keep text-xs font-semibold leading-5 text-slate-500">
                    {step.detail}
                  </p>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-800">
        <FiCheck className="shrink-0 text-[#d85b48]" aria-hidden="true" />
        {group.closing}
      </div>
    </article>
  );
}

export default function DetailedJourneySection() {
  const [activeKey, setActiveKey] = useState(JOURNEY_GROUPS[0].key);
  const activeGroup =
    JOURNEY_GROUPS.find((group) => group.key === activeKey) || JOURNEY_GROUPS[0];

  return (
    <section id="journey" className="border-b border-slate-100 bg-white py-16 md:py-28">
      <MobileFrame>
        <div className="max-w-3xl">
          <p className="text-xs font-black tracking-[0.08em] text-[#d85b48]">상세 이용 과정</p>
          <h2 className="mt-3 break-keep text-[34px] font-black leading-[1.15] tracking-[-0.055em] text-slate-950 md:text-6xl">
            처음 가입부터 실제 만남까지
          </h2>
          <p className="mt-5 break-keep text-base font-medium leading-8 text-slate-600 md:text-lg">
            처음 한 번만 준비하면, 새로운 소개부터 약속과 만남 후 선택까지 화면에서 차례로 안내합니다.
          </p>
        </div>

        <div className="mt-9 md:hidden">
          <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="상세 이용 과정 단계">
            {JOURNEY_GROUPS.map((group) => {
              const isActive = group.key === activeKey;
              const shortLabel = {
                prepare: "준비",
                proposal: "소개",
                meeting: "약속",
              }[group.key];
              return (
                <button
                  key={group.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`journey-panel-${group.key}`}
                  onClick={() => setActiveKey(group.key)}
                  className={`rounded-2xl px-2 py-3 text-xs font-black transition ${
                    isActive
                      ? "bg-slate-950 text-white"
                      : "border border-solid shadow border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {group.label}. {shortLabel}
                </button>
              );
            })}
          </div>
          <div
            id={`journey-panel-${activeGroup.key}`}
            role="tabpanel"
            className="mt-4"
          >
            <JourneyGroupCard group={activeGroup} />
          </div>
          <button
            type="button"
            onClick={() => {
              const index = JOURNEY_GROUPS.findIndex((group) => group.key === activeKey);
              const nextIndex = Math.min(index + 1, JOURNEY_GROUPS.length - 1);
              setActiveKey(JOURNEY_GROUPS[nextIndex].key);
            }}
            disabled={activeKey === JOURNEY_GROUPS[JOURNEY_GROUPS.length - 1].key}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-slate-300 text-sm font-black text-slate-800 disabled:hidden"
          >
            다음 과정 보기 <FiChevronRight aria-hidden="true" />
          </button>
        </div>

        <div className="mt-14 hidden items-start gap-5 md:grid md:grid-cols-3">
          {JOURNEY_GROUPS.map((group) => (
            <JourneyGroupCard key={group.key} group={group} />
          ))}
        </div>
      </MobileFrame>
    </section>
  );
}
