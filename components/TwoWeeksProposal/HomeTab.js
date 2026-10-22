import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "firebaseConfig";
import { FiArrowRight, FiGift, FiHeart, FiInstagram, FiClock, FiCheckCircle, FiCopy } from "react-icons/fi";
import { profileCompletion, resolveHomeState } from "./dashboardHomeState";
import { createMyTwoWeeksInviteLink } from "./referralService";

function Card({ children, className = "" }) { return <section className={`rounded-[20px] border border-[#e7edf5] bg-white px-4 py-5 shadow-[0_4px_18px_rgba(31,59,102,.025)] sm:px-5 ${className}`}>{children}</section>; }
const JOURNEY_LABELS = ["매칭 대기", "이번 소개", "보증금", "상호 수락", "일정·장소", "만남", "피드백"];
function journeyPosition(journey, application) {
  const phase = String(journey?.phase || "waiting");
  const stage = {
    candidate: 1, accepted: 1, mutual: 3, schedule_action: 4, schedule_wait: 4,
    confirmed: 4, meeting_tomorrow: 5, meeting_soon: 5, meeting_day: 5,
    feedback: 6, result: 6,
  };
  if (phase === "deposit") return 2;
  if (Object.prototype.hasOwnProperty.call(stage, phase)) return stage[phase];
  if (phase === "ended") return 0; // A new 1:1 introduction starts its own journey.
  return 0;
}
function ProcessTimeline({ journey, application }) {
  const current = journeyPosition(journey, application);
  const deposit = application?.deposit || {};
  const depositNote = deposit.status === "confirmed" ? "입금 확인됨" : deposit.status === "exempt" ? "면제" : deposit.requestStage === "requested" ? "안내 확인 필요" : "필요할 때 별도 안내";
  return <section aria-label="만남 진행 순서" className="rounded-[20px] border border-[#e8eaf0] bg-white px-4 py-5 sm:px-5">
    <div className="mb-4 flex items-center justify-between gap-2"><h2 className="text-[17px] font-extrabold text-[#1c354f]">우리의 만남 과정</h2><span className="rounded-full bg-[#edf4ff] px-2.5 py-1 text-xs font-bold text-[#2869ce]">{JOURNEY_LABELS[current]}</span></div>
    <ol className="grid grid-cols-7 gap-0.5" aria-label="총 7단계">
      {JOURNEY_LABELS.map((label,idx) => {
        const depositPending = idx === 2 && !["confirmed","exempt"].includes(String(deposit.status || ""));
        const filled = idx < current && !depositPending;
        const focused = idx === current;
        return <li key={label} className="min-w-0 text-center">
        <div className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full border border-solid text-xs font-extrabold sm:h-8 sm:w-8 ${filled ? "border-[#3378d8] bg-[#3378d8] text-white" : focused ? "border-[#3378d8] bg-[#ecf3ff] text-[#2369cf] ring-2 ring-[#e5efff]" : "border-[#e6eaf1] bg-[#f5f6f8] text-[#a9b3c0]"}`}>{filled ? "✓" : idx+1}</div>
        <p className={`mt-2 break-keep text-[8px] font-bold leading-[1.4] sm:text-[11px] ${(idx <= current && !depositPending) ? "text-[#2869ce]" : "text-[#a9b3c0]"}`}>{label}</p>
      </li>})}
    </ol>
    <p className="mt-4 break-keep border-t border-[#f0f1f4] pt-3 text-xs leading-5 text-[#728498]">보증금: {depositNote} · 실제 진행 단계에 따라 안내해요.</p>
  </section>;
}

function friendlyDeadline(value) {
  if (!value) return "";
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })} ${date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}까지`;
}

export default function HomeTab({ application, bestMatch, responseStatus, feedbackReady, scheduleActionRequired, scheduleOpen, counterpartDeclined, proposalExpired, proposalDueAt, scheduleDueAt, nowMs, introJourney, onNavigate, onOpenFeedback }) {
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [contentError, setContentError] = useState(false);
  const [contentLoading, setContentLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState("");
  useEffect(() => {
    let live = true;
    // Independent loads: an unavailable event collection must not hide the notes feed.
    Promise.allSettled([
      getDocs(query(collection(db, "twoweeksReferralEvents"), where("active", "==", true), limit(12))),
      getDocs(query(collection(db, "twoweeksDatingNotes"), where("active", "==", true), limit(15))),
    ]).then(([eventResult, noteResult]) => {
      if (!live) return;
      const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
      if (eventResult.status === "fulfilled") {
        const activeEvents = eventResult.value.docs.map((d) => ({ id: d.id, ...d.data() }))
          .filter(e => (!e.startAt || e.startAt <= today) && (!e.endAt || e.endAt >= today));
        setEvents(activeEvents.sort((a,b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)));
      }
      if (noteResult.status === "fulfilled") {
        setNotes(noteResult.value.docs.map(d => ({ id:d.id, ...d.data() }))
          .sort((a,b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)).slice(0,3));
      }
      if (eventResult.status === "rejected" || noteResult.status === "rejected") {
        console.warn("[TwoWeeksHome] content access unavailable");
        setContentError(true);
      }
    }).finally(() => { if (live) setContentLoading(false); });
    return () => { live = false; };
  }, []);
  // HOME and 소개 share the same state/CTA decision for the current meeting.
  const state = useMemo(() => introJourney ? ({
    title: introJourney.title,
    description: introJourney.description,
    label: introJourney.cta,
    tab: introJourney.target,
    dueAt: introJourney.dueAt || "",
  }) : resolveHomeState({ application, bestMatch, responseStatus, feedbackReady, scheduleActionRequired, scheduleOpen, counterpartDeclined, proposalExpired, proposalDueAt, scheduleDueAt, nowMs }), [introJourney, application, bestMatch, responseStatus, feedbackReady, scheduleActionRequired, scheduleOpen, counterpartDeclined, proposalExpired, proposalDueAt, scheduleDueAt, nowMs]);
  const completion = useMemo(() => profileCompletion(application), [application]);
  const event = events[0];
  const match = bestMatch?.match || {};
  const fm = bestMatch?.finalMeeting || match.finalMeeting || match.schedule?.finalMeeting || {};
  const meetingTime = fm.startAtClient || fm.finalTimeChoice?.startAtClient || fm.timeChoice?.startAtClient;
  const meetingDate = friendlyDeadline(meetingTime).replace(/까지$/, "");
  const meetingPlace = fm.placeName || fm.cafeName || fm.place?.name || "";
  const hasMeeting = Boolean(meetingDate || meetingPlace);
  const handleInvite = async () => {
    setInviteBusy(true); setInviteError("");
    try {
      const response = await createMyTwoWeeksInviteLink(application.id);
      setInviteLink(response.url);
      if (navigator.share) await navigator.share({ title: "투윅스 친구초대", url: response.url }).catch(() => {});
      else if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(response.url);
    } catch(error) { setInviteError(error?.message || "초대 링크를 발급하지 못했어요."); }
    finally { setInviteBusy(false); }
  };
  return (
    <div className="space-y-4 pb-3">
      <ProcessTimeline journey={introJourney} application={application} />
      <Card className="border-[#e7e7e1] bg-[#fffcf8] !py-5">
        <p className="text-xs font-extrabold text-[#326bda]">{application?.reviewStatus === "approved" ? "프로필 승인 완료" : "현재 진행 상태"}</p>
        <h2 className="mt-2 break-keep text-[23px] font-black leading-[1.35] tracking-tight text-[#122841]">{introJourney?.phase === "waiting" ? "좋은 인연을 준비하고 있어요." : state.title}</h2>
        <p className="mt-2 break-keep text-[14px] leading-6 text-[#637790]">{introJourney?.phase === "waiting" ? "다음 소개가 도착하면 문자로 알려드릴게요." : state.description}</p>
        {application?.reviewStatus === "approved" && ["waiting", "ended"].includes(introJourney?.phase) ? <div className="mt-4 border-t border-[#dfe7f4] pt-3"><p className="break-keep text-[13px] leading-6 text-[#5d7695]">프로필과 원하는 상대 조건을 정리해두면 더 적합한 소개를 준비하는 데 도움이 돼요.</p><button type="button" onClick={() => onNavigate("profile")} className="mt-2 inline-flex min-h-10 items-center gap-1 text-sm font-bold text-[#2869ce] hover:underline">내 프로필 확인 <FiArrowRight/></button><button type="button" onClick={() => onNavigate("conditions")} className="ml-4 inline-flex min-h-10 items-center gap-1 text-sm font-bold text-[#2869ce] hover:underline">소개조건 보기 <FiArrowRight/></button></div> : null}
        {state.dueAt ? <div className="mt-3 flex items-center gap-2 text-sm font-bold text-[#bf683b]"><FiClock/> {friendlyDeadline(state.dueAt)}</div> : null}
        {state.label ? <button type="button" onClick={() => state.tab === "feedback" ? onOpenFeedback?.() : onNavigate(state.tab)} className="mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#326bda] text-sm font-bold text-white">{state.label}<FiArrowRight/></button> : null}
      </Card>
      {(bestMatch?.candidate || hasMeeting) ? <Card>
        <p className="text-xs font-bold text-[#4772b4]">현재 소개 · 다가오는 만남</p>
        <h2 className="mt-2 text-lg font-extrabold text-[#122841]">{hasMeeting ? "다가오는 약속" : "이번 소개"}</h2>
        <p className="mt-2 break-keep text-sm leading-6 text-[#677a90]">{hasMeeting ? [meetingDate, meetingPlace].filter(Boolean).join(" · ") : "한 분과 진행 중인 소개가 있어요."}</p>
        {/* HOME Hero already owns the next action: avoid repeating its CTA. */}
      </Card> : null}
      <Card>
        <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold text-[#122841]">내 프로필 완성도</h2><strong className="text-xl text-[#326bda]">{completion.percent}%</strong></div>
        <div role="progressbar" aria-valuenow={completion.percent} aria-valuemin={0} aria-valuemax={100} className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#e9eff9]"><div className="h-full rounded-full bg-[#326bda]" style={{width:`${completion.percent}%`}}/></div>
        <p className="mt-2 break-keep text-[13px] leading-6 text-[#647890]">{completion.missing.length ? `${completion.missing[0]} 항목을 추가할 수 있어요.` : "프로필 정보가 채워져 있어요."}</p>
        <button type="button" onClick={() => onNavigate("profile")} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#326bda]">내 프로필 보기 <FiArrowRight/></button>
      </Card>
      {event ? <Card className="bg-[#fffaf5]">
        <div className="flex items-center gap-2 text-[#de7c62]"><FiGift/><span className="text-xs font-extrabold">친구추천 이벤트</span></div>
        <h2 className="mt-2 break-keep text-lg font-black text-[#122841]">{event.title}</h2>
        <p className="mt-2 break-keep text-sm leading-6 text-[#647890]">{event.description || event.rewardDetails || ""}</p>
        {event.rewardName ? <p className="mt-2 text-sm font-bold text-[#385c96]">혜택: {event.rewardName}</p> : null}
        <Link href={`/2weeks/referral?event=${encodeURIComponent(event.id)}`} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#326bda]">이벤트 자세히 보기 <FiArrowRight/></Link>
        {event.conditions ? <p className="mt-2 break-keep text-xs leading-5 text-[#77849b]">{event.conditions}</p> : null}
        <button type="button" disabled={inviteBusy} onClick={handleInvite} className="mt-4 inline-flex min-h-[43px] items-center gap-2 rounded-xl bg-[#326bda] px-4 text-sm font-bold text-white disabled:opacity-50"><FiCopy/>{inviteBusy ? "초대 링크 만드는 중..." : "친구에게 초대 링크 공유"}</button>
        {inviteLink ? <p className="mt-2 break-all text-xs text-[#47617e]">{inviteLink}</p> : null}
        {inviteError ? <p role="alert" className="mt-2 text-xs text-red-600">{inviteError}</p> : null}
        <p className="mt-3 text-xs text-[#74859a]">지급 여부는 실제 첫 만남 완료와 관리자 확인 후 결정돼요.</p>
      </Card> : null}
      {notes.length ? <section aria-label="윅키의 연애노트" className="space-y-3 pb-2">
        <div className="flex items-center gap-2 px-1"><FiHeart className="text-[#de846c]"/><h2 className="text-lg font-black text-[#122841]">윅키의 연애노트</h2></div>
        <div className={`flex gap-3 ${notes.length >= 3 ? "overflow-x-auto pb-3" : ""}`}>
          {notes.map(item => <a key={item.id} href={item.instagramUrl} target="_blank" rel="noopener noreferrer" className={`overflow-hidden rounded-[19px] border border-[#e7ecf4] bg-white shadow-sm ${notes.length === 1 ? "w-[57%] shrink-0 sm:w-[49%]" : notes.length === 2 ? "min-w-0 flex-1" : "w-[66%] shrink-0 sm:w-[49%]"}`}>
            {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" loading="lazy" className="aspect-[3/4] w-full object-cover"/> : null}
            <p className="break-keep px-3 py-3 text-sm font-bold leading-5 text-[#1c3556]">{item.title}</p>
          </a>)}
          {notes.length === 1 ? <div aria-hidden="true" className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-[19px] bg-[#fff5ed] px-3 text-center">
            <span className="text-3xl">♡</span><p className="mt-3 break-keep text-[13px] font-bold text-[#ad6d62]">연애의 작은 힌트,<br/>천천히 읽어보세요.</p>
          </div> : null}
        </div>
        <a href="https://www.instagram.com/2weeks_dating/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-1 text-sm font-bold text-[#326bda]"><FiInstagram/> 인스타그램에서 더 보기 <FiArrowRight/></a>
      </section> : null}
      {contentLoading ? <p role="status" className="py-3 text-center text-xs text-[#718299]">혜택과 연애노트를 확인하고 있어요.</p> : null}
      {contentError ? <p role="alert" className="text-center text-xs text-[#718299]">일부 소식은 잠시 불러오지 못했어요.</p> : null}
      <style jsx>{`.wicky-float { animation: wickyFloat 3.6s ease-in-out infinite; } @keyframes wickyFloat { 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-4px) } } @media(prefers-reduced-motion:reduce){.wicky-float{ animation:none }} `}</style>
    </div>
  );
}
