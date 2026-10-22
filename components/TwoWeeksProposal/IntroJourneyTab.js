import { useEffect, useState } from "react";
import { FiArrowRight, FiCheck, FiCheckCircle, FiChevronDown, FiChevronUp, FiClock, FiHeart, FiCalendar, FiMapPin, FiMessageCircle, FiX } from "react-icons/fi";
import { getSeoulDay, toMillis } from "./introJourneyState";

const STEPS = [
  { title: "소개 확인", Icon: FiHeart },
  { title: "상호수락", Icon: FiCheckCircle },
  { title: "일정 조율", Icon: FiCalendar },
  { title: "만남", Icon: FiMapPin },
  { title: "피드백", Icon: FiMessageCircle },
];

function conciseTime(ms) {
  if (!ms) return "";
  try { return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date(ms)); }
  catch { return ""; }
}

function Hero({ journey, onAction, nowMs }) {
  
  const dueMs = toMillis(journey.dueAt);
  const left = dueMs ? Math.max(0, dueMs - nowMs) : 0;
  const hours = Math.floor(left / 3600000);
  const minutes = Math.floor((left % 3600000) / 60000);
  const remaining = dueMs ? (left ? `남은 시간 ${hours ? `${hours}시간 ` : ""}${minutes}분` : "응답 기한 종료") : "";
  return (
    <section className="rounded-[20px] border shadow border-[#ebe5df] bg-[#fffaf5] px-5 py-6 sm:px-6" aria-label="현재 소개 상태">
      <div>
        <span className="text-[11px] font-bold text-[#326bda]">현재 소개</span>
        <h2 className="mt-2 break-keep text-[23px] font-black leading-[1.35] tracking-[-0.035em] text-[#122841]">{journey.title}</h2>
        {journey.description ? <p className="mt-2 break-keep text-[14px] leading-6 text-[#667d96]">{journey.description}</p> : null}
        {journey.phase === "waiting" ? <div role="status" className="mt-5 flex items-center gap-3 rounded-2xl border border-[#e7edf5] bg-white/85 px-3 py-3">
          <div aria-hidden="true" className="relative flex h-12 w-[84px] shrink-0 items-center justify-center">
            <span className="tw-wait-profile absolute left-1 h-10 w-10 rounded-full bg-[#dbe4ed] shadow-[0_2px_8px_rgba(55,88,115,.12)]"/>
            <span className="tw-wait-profile tw-wait-profile-2 absolute right-1 h-10 w-10 rounded-full bg-[#eededc] shadow-[0_2px_8px_rgba(55,88,115,.12)]"/>
            <span className="absolute bottom-1 left-2 h-4 w-8 rounded-t-full bg-[#becfe1] blur-[2px]"/>
            <span className="absolute bottom-1 right-2 h-4 w-8 rounded-t-full bg-[#e5c5c2] blur-[2px]"/>
          </div>
          <p className="break-keep text-[13px] font-semibold leading-5 text-[#55718b]">새로운 소개를 준비 중이에요 <span className="tw-wait-dots" aria-hidden="true">···</span></p>
        </div> : null}
      </div>
      {remaining && ["candidate", "schedule_action"].includes(journey.phase) ? (
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-xs font-bold text-[#2c5faf]"><FiClock/>{remaining}</div>
      ) : null}
      {journey.startMs && ["confirmed", "meeting_day", "meeting_tomorrow", "meeting_soon"].includes(journey.phase) ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-white/85 px-3 py-3 text-sm font-bold text-[#31527a]"><FiCalendar className="shrink-0"/> {conciseTime(journey.startMs)}</p>
      ) : null}
      {journey.actionable && journey.cta ? <button type="button" onClick={onAction} className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[13px] bg-[#286ad3] px-4 text-[14px] font-extrabold text-white shadow-sm transition hover:bg-[#195ab9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286ad3]">{journey.cta}<FiArrowRight aria-hidden="true"/></button> : null}
    </section>
  );
}

function JourneyProgress({ journey }) {
  if (!["candidate", "accepted", "mutual", "schedule_action", "schedule_wait", "confirmed", "meeting_tomorrow", "meeting_soon", "meeting_day", "feedback", "result"].includes(journey.phase)) return null;
  const current = journey.step === 5 ? 5 : Math.max(1, journey.step || 1);
  return (
    <section className="rounded-[22px] border border-[#e5ebf5] bg-white px-3 py-5 sm:px-5" aria-label="소개 진행 단계">
      <h3 className="mb-4 px-2 text-[14px] font-extrabold text-[#183450]">우리의 만남 여정</h3>
      <ol className="grid grid-cols-5 gap-0.5">
        {STEPS.map(({title,Icon},i) => {
          const step = i + 1;
          const done = step < current || (current === 5 && journey.phase === "result");
          const active = step === current && journey.phase !== "result";
          return <li key={title} className="relative min-w-0 text-center">
            {i > 0 && <span aria-hidden="true" className={`absolute right-1/2 top-[19px] h-[2px] w-full -translate-y-1/2 ${done || active ? "bg-[#94b8fa]" : "bg-[#e4eaf3]"}`}/>}
            <span className={`relative z-10 mx-auto flex h-[38px] w-[38px] items-center justify-center rounded-full border ${done ? "border-[#256bd4] bg-[#256bd4] text-white" : active ? "border-[#256bd4] bg-[#edf4ff] text-[#256bd4] ring-[3px] ring-[#e4efff]" : "border-[#e1e8f1] bg-[#f7f9fc] text-[#8ea0b6]"}`}>
              {done ? <FiCheck aria-hidden="true"/> : <Icon aria-hidden="true"/>}
            </span>
            <span className={`mt-2 block break-keep text-[10px] font-bold leading-4 sm:text-[11px] ${active ? "text-[#225ebd]" : done ? "text-[#3d5c7b]" : "text-[#9aaabc]"}`}>{title}</span>
          </li>;
        })}
      </ol>
    </section>
  );
}

function PastIntroductions({ items = [], loading, error, onLoad }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  // These records are limited to terminal, participant-authorized match summaries.
  // An old match cannot be opened through the CURRENT match's ResultTab.
  const visibleItems = items.filter((item) => item?.id && item?.label);

  useEffect(() => {
    if (!selected) return undefined;
    const onEscape = (event) => { if (event.key === "Escape") setSelected(null); };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [selected]);

  if (!loading && !error && !visibleItems.length) return null;
  return (
    <>
      <section className="rounded-[20px] border border-[#e5ebf5] bg-white p-4 sm:p-5">
        <button type="button" aria-expanded={open} onClick={() => { const next = !open; setOpen(next); if (next) onLoad?.(); }} className="flex w-full items-center justify-between gap-3 text-left">
          <span className="text-[15px] font-extrabold text-[#183450]">지난 소개</span>
          {open ? <FiChevronUp className="text-[#7c90aa]"/> : <FiChevronDown className="text-[#7c90aa]"/>}
        </button>
        {open ? <div className="mt-4 border-t border-[#edf0f5] pt-3">
          {loading ? <p role="status" className="text-sm text-[#71839a]">지난 소개를 불러오고 있어요.</p> :
            error ? <p role="alert" className="text-sm text-[#a25b5b]">지난 소개를 불러오지 못했어요.</p> :
            !visibleItems.length ? <p className="text-sm text-[#71839a]">조회 가능한 기록이 없어요.</p> :
            <ul className="space-y-2">{visibleItems.slice(0, 3).map((item) =>
              <li key={item.id} className="flex items-center justify-between gap-2 rounded-xl bg-[#f7f9fc] px-3 py-3">
                <div className="min-w-0"><p className="text-[13px] font-bold text-[#294963]">{item.label}</p>
                  <p className="mt-1 text-xs text-[#748aa0]">{item.dateMs ? getSeoulDay(item.dateMs) : "일자 정보 없음"}</p>
                </div>
                <button type="button" onClick={() => setSelected(item)} className="shrink-0 rounded-lg px-2 py-2 text-xs font-extrabold text-[#286ad3] transition hover:bg-[#eaf2fe] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#286ad3]">
                  결과 보기 <FiArrowRight className="inline"/>
                </button>
              </li>)}</ul>}
        </div> : null}
      </section>
      {selected ? <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-[#152b45]/55 px-4 py-6 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
        <div role="dialog" aria-modal="true" aria-labelledby="tw-history-result-title" className="w-full max-w-[380px] rounded-[22px] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,.20)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 id="tw-history-result-title" className="text-lg font-black text-[#142c46]">지난 소개 결과</h3>
            <button type="button" autoFocus onClick={() => setSelected(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f2f5f9] text-[#597089]" aria-label="결과 창 닫기"><FiX/></button>
          </div>
          <div className="mt-5 rounded-2xl bg-[#f4f7fb] px-4 py-4">
            <div className="text-xs font-semibold text-[#7990a7]">진행 결과</div>
            <div className="mt-1 text-xl font-extrabold text-[#203f60]">{selected.label}</div>
            <div className="mt-3 text-sm font-medium text-[#617c98]">{selected.dateMs ? getSeoulDay(selected.dateMs) : "일자 정보 없음"}</div>
          </div>
          <p className="mt-4 break-keep text-[13px] leading-6 text-[#637b94]">현재 확인할 수 있는 지난 소개 기록이에요. 상대방의 상세정보와 개인 피드백은 이 화면에 표시되지 않아요.</p>
          <button type="button" onClick={() => setSelected(null)} className="mt-5 h-12 w-full rounded-xl bg-[#286ad3] text-sm font-extrabold text-white transition hover:bg-[#195ab9]">확인</button>
        </div>
      </div> : null}
    </>
  );
}

export default function IntroJourneyTab({ journey, nowMs, application, activeTab, onChangeTab, onOpenFeedback, onGoMy, children, historyItems, historyLoading, historyError, onLoadHistory }) {
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    const phases = ["mutual", "confirmed", "result"];
    if (!phases.includes(journey.phase) || !application?.id) return undefined;
    const key = `tw:intro:milestone:${application.id}:${journey.phase}`;
    try {
      if (window.sessionStorage.getItem(key)) return undefined;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // Private browsing may disable session storage. UI works without the effect.
      return undefined;
    }
    setCelebrate(true);
    const timer = window.setTimeout(() => setCelebrate(false), 550);
    return () => window.clearTimeout(timer);
  }, [application?.id, journey.phase]);
  const currentIsResult = journey.phase === "result" || journey.phase === "feedback";
  const showCandidate = journey.phase === "candidate" || journey.phase === "accepted" || journey.phase === "mutual";
  const showSchedule = ["mutual", "schedule_action", "schedule_wait", "confirmed", "meeting_tomorrow", "meeting_soon", "meeting_day"].includes(journey.phase);
  const showResult = currentIsResult && journey.phase !== "feedback";
  const requestedDetail = activeTab === "schedule" ? (showSchedule ? "schedule" : "") : activeTab === "result" ? (showResult ? "result" : "") : activeTab === "candidate" ? (showCandidate ? "candidate" : "") : "";
  const defaultDetail = showSchedule ? "schedule" : showCandidate ? "candidate" : showResult ? "result" : "";
  const detail = requestedDetail || defaultDetail;
  const handleAction = () => {
    if (journey.target === "feedback") return onOpenFeedback?.();
    if (journey.target === "deposit" || journey.target === "status" || journey.target === "profile") return onGoMy?.(journey.target);
    const desired = journey.target === "result" ? "result" : journey.target === "schedule" ? "schedule" : "candidate";
    onChangeTab?.(desired);
    window.requestAnimationFrame?.(() => document.getElementById("tw-intro-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  return (
    <div className="space-y-4 pb-4">
      <div className={celebrate ? "tw-intro-celebrate" : ""}><Hero journey={journey} nowMs={nowMs} onAction={handleAction}/></div>

      {showSchedule && detail !== "schedule" ? <button type="button" onClick={() => onChangeTab?.("schedule")} className="w-full rounded-[16px] border border-[#cfe0fa] bg-white px-4 py-3 text-left text-sm font-extrabold text-[#2568c7]">일정·약속 보기 <FiArrowRight className="inline"/></button> : null}
      {showCandidate && detail !== "candidate" ? <button type="button" onClick={() => onChangeTab?.("candidate")} className="w-full rounded-[16px] border border-[#cfe0fa] bg-white px-4 py-3 text-left text-sm font-extrabold text-[#2568c7]">상대 프로필 확인 <FiArrowRight className="inline"/></button> : null}
      {detail ? <div id="tw-intro-detail" className="tw-intro-detail scroll-mt-32">{children?.[detail] || null}</div> : null}
      <PastIntroductions items={historyItems} loading={historyLoading} error={historyError} onLoad={onLoadHistory}/>
      <style jsx global>{`.tw-intro-wicky{animation:tw-intro-float 3.6s ease-in-out infinite;transform-origin:50% 85%}@keyframes tw-intro-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}.tw-intro-detail > section{border-radius:22px;border-color:#e5ebf5;box-shadow:0 10px 30px rgba(33,67,103,.04)}.tw-intro-celebrate{animation:tw-intro-welcome .45s ease-out both}@keyframes tw-intro-welcome{from{transform:scale(.985);opacity:.7}to{transform:scale(1);opacity:1}}@keyframes tw-wait-breathe{0%,100%{transform:scale(.96);opacity:.78}50%{transform:scale(1.06);opacity:1}}.tw-wait-profile{animation:tw-wait-breathe 3.3s ease-in-out infinite}.tw-wait-profile-2{animation-delay:1.1s}.tw-wait-dots{animation:tw-wait-breathe 1.8s ease-in-out infinite}@media(prefers-reduced-motion:reduce){.tw-intro-wicky,.tw-intro-celebrate,.tw-wait-profile,.tw-wait-dots{animation:none}}`}</style>
    </div>
  );
}
