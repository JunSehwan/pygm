import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { signInAnonymously } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "firebaseConfig";

const MEETING_RESULT_OPTIONS = [
  {
    value: "met",
    label: "네, 만났어요",
    desc: "정상적으로 만나 대화했습니다.",
  },
  {
    value: "counterpart_no_show",
    label: "상대가 오지 않았어요",
    desc: "약속 장소에서 상대를 만나지 못했습니다.",
  },
  {
    value: "self_no_show",
    label: "제가 참석하지 못했어요",
    desc: "내가 약속에 참석하지 못했습니다.",
  },
];

const MEET_AGAIN_OPTIONS = [
  { value: "yes", label: "네, 다시 만나보고 싶어요" },
  { value: "maybe", label: "조금 더 고민해보고 싶어요" },
  { value: "no", label: "아니요, 이번 만남으로 충분해요" },
];

const MOOD_OPTIONS = [
  { value: "good", label: "좋았어요" },
  { value: "neutral", label: "무난했어요" },
  { value: "disappointing", label: "아쉬웠어요" },
  { value: "uncomfortable", label: "불편했어요" },
];

const NO_SHOW_OPTIONS = [
  { value: "no_contact_absent", label: "연락 없이 오지 않았어요" },
  { value: "late_too_long", label: "많이 늦어서 만남이 어려웠어요" },
  { value: "could_not_find", label: "장소에서 찾지 못했어요" },
  { value: "other", label: "기타 상황이 있었어요" },
];

const ARRIVAL_OPTIONS = [
  { value: "arrived_before_time", label: "약속시간 전에 도착했어요" },
  { value: "arrived_on_time", label: "약속시간 전후로 도착했어요" },
  { value: "arrived_late", label: "제가 조금 늦게 도착했어요" },
];

const SELF_NO_SHOW_REASONS = [
  { value: "urgent_schedule", label: "급한 일정이 생겼어요" },
  { value: "health", label: "몸이 좋지 않았어요" },
  { value: "mistake", label: "장소/시간을 착각했어요" },
  { value: "changed_mind", label: "단순 변심이 있었어요" },
  { value: "other", label: "기타" },
];

const NEXT_ROUND_OPTIONS = [
  {
    value: "join_next_round",
    label: "다음 회차도 이어서 받아볼래요",
    desc: "운영자가 다음 회차 후보 검토 시 참고합니다.",
  },
  {
    value: "pause_one_round",
    label: "이번에는 한 회차 쉬어갈래요",
    desc: "바로 다음 회차 매칭에서는 제외하고 이후 재참여를 검토합니다.",
  },
  {
    value: "wait_admin_review",
    label: "운영자 안내 후 결정할게요",
    desc: "노쇼/불편 상황 검토 또는 재만남 가능성 확인 후 결정합니다.",
  },
];

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

async function ensureAuth() {
  if (auth.currentUser) return auth.currentUser;

  try {
    const credential = await signInAnonymously(auth);
    return credential.user;
  } catch (error) {
    console.warn("[TwoWeeksFeedback] anonymous auth unavailable:", error?.code || error?.message || error);
    return null;
  }
}

function getTokenEntry(match = {}, token = "") {
  const cleanToken = String(token || "").trim();
  const tokens = match.feedbackTokens || {};

  if (!cleanToken) return null;

  const found = Object.entries(tokens).find(([, value]) => {
    return String(value?.token || "").trim() === cleanToken;
  });

  if (!found) return null;

  return {
    applicationId: found[0],
    ...found[1],
  };
}

function getFinalMeeting(match = {}) {
  return match.finalMeeting || match.schedule?.finalMeeting || {};
}

function formatTime(finalMeeting = {}) {
  const time =
    finalMeeting.finalTimeChoice ||
    finalMeeting.timeChoice ||
    finalMeeting.selectedChoice ||
    finalMeeting ||
    {};

  return [time.dateLabel, time.timeLabel].filter(Boolean).join(" ") || "-";
}

function formatPlace(finalMeeting = {}) {
  const place =
    finalMeeting.finalPlaceChoice ||
    finalMeeting.placeChoice ||
    finalMeeting.selectedChoice ||
    finalMeeting ||
    {};

  return [place.area, finalMeeting.placeName || place.cafeName || place.placeName]
    .filter(Boolean)
    .join(" / ") || "-";
}

function formatSubmittedAt(value = "") {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getLabel(options = [], value = "") {
  return options.find((item) => item.value === value)?.label || value || "-";
}

function makeFeedbackSummary(feedbacks = {}) {
  const list = Object.values(feedbacks || {}).filter(Boolean);
  const issueList = list.filter((item) => item.meetingResult && item.meetingResult !== "met");
  const metList = list.filter((item) => item.meetingResult === "met");
  const positiveList = list.filter((item) => item.meetAgainIntent === "yes");
  const maybeList = list.filter((item) => item.meetAgainIntent === "maybe");
  const joinNextRoundList = list.filter((item) => item.nextRoundPreference === "join_next_round");
  const pauseNextRoundList = list.filter((item) => item.nextRoundPreference === "pause_one_round");

  return {
    submittedCount: list.length,
    metCount: metList.length,
    issueCount: issueList.length,
    positiveCount: positiveList.length,
    maybeCount: maybeList.length,
    joinNextRoundCount: joinNextRoundList.length,
    pauseNextRoundCount: pauseNextRoundList.length,
    needsAdminReview: issueList.length > 0,
    mutualInterest:
      list.length >= 2 && list.every((item) => item.meetingResult === "met" && item.meetAgainIntent === "yes"),
    nextRoundReady:
      list.length >= 2 && list.every((item) => item.meetingResult === "met" && item.nextRoundPreference === "join_next_round"),
    lastSubmittedAtClient: new Date().toISOString(),
  };
}

function makeFeedbackStatus(feedbacks = {}) {
  const summary = makeFeedbackSummary(feedbacks);

  if (summary.needsAdminReview) return "issue_reported";
  if (summary.submittedCount >= 2) return "completed";
  if (summary.submittedCount >= 1) return "partial";

  return "waiting";
}

function OptionButton({ selected, title, desc, onClick, tone = "blue" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full rounded-2xl border border-solid p-4 text-left transition",
        selected
          ? tone === "rose"
            ? "border-rose-400 bg-rose-50"
            : "border-[#1877f2] bg-blue-50"
          : "border-[#dfe3e8] bg-white hover:border-[#1877f2]/50"
      )}
    >
      <div className={cx("text-[15px] font-bold", selected ? (tone === "rose" ? "text-rose-800" : "text-[#1877f2]") : "text-[#1c1e21]")}>
        {title}
      </div>
      {desc ? <div className="mt-1 break-keep text-[12px] font-semibold leading-5 text-[#65676b]">{desc}</div> : null}
    </button>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-3 border-b border-solid border-[#eef0f3] py-3 last:border-b-0">
      <div className="w-24 shrink-0 text-[12px] font-bold text-[#65676b]">{label}</div>
      <div className="min-w-0 flex-1 break-keep text-[13px] font-bold leading-5 text-[#1c1e21]">{value || "-"}</div>
    </div>
  );
}

function SubmittedView({ feedback, finalMeeting }) {
  const noShow = feedback?.noShow || {};
  const selfNoShow = feedback?.selfNoShow || {};

  return (
    <div className="rounded-3xl border border-solid border-[#dfe3e8] bg-white p-5 shadow-sm">
      <div className="rounded-2xl bg-emerald-50 p-4">
        <div className="text-[20px] font-bold tracking-[-0.04em] text-emerald-900">
          피드백 제출이 완료되었습니다
        </div>
        <p className="mt-2 break-keep text-[13px] font-semibold leading-6 text-emerald-800">
          남겨주신 내용은 운영자가 다음 매칭과 만남 운영 검토에 반영합니다.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-solid border-[#eef0f3] px-4">
        <Row label="만남 일시" value={formatTime(finalMeeting)} />
        <Row label="장소" value={formatPlace(finalMeeting)} />
        <Row label="실제 만남" value={getLabel(MEETING_RESULT_OPTIONS, feedback.meetingResult)} />
        {feedback.meetingResult === "met" ? (
          <>
            <Row label="재만남 의향" value={getLabel(MEET_AGAIN_OPTIONS, feedback.meetAgainIntent)} />
            <Row label="만남 느낌" value={getLabel(MOOD_OPTIONS, feedback.meetingMood)} />
          </>
        ) : null}
        {feedback.meetingResult === "counterpart_no_show" ? (
          <>
            <Row label="상황" value={getLabel(NO_SHOW_OPTIONS, noShow.situation)} />
            <Row label="대기 시간" value={noShow.waitedMinutes ? `${noShow.waitedMinutes}분 이상` : "-"} />
            <Row label="내 도착" value={getLabel(ARRIVAL_OPTIONS, noShow.arrivalStatus)} />
          </>
        ) : null}
        {feedback.meetingResult === "self_no_show" ? (
          <Row label="불참 사유" value={getLabel(SELF_NO_SHOW_REASONS, selfNoShow.reason)} />
        ) : null}
        <Row label="다음 회차" value={getLabel(NEXT_ROUND_OPTIONS, feedback.nextRoundPreference)} />
        <Row label="메모" value={feedback.memo || noShow.memo || selfNoShow.memo || "-"} />
        <Row label="제출일" value={formatSubmittedAt(feedback.submittedAtClient)} />
      </div>

      <div className="mt-4 rounded-2xl bg-[#f0f2f5] px-4 py-3 text-[12px] font-semibold leading-5 text-[#65676b]">
        상대가 남긴 피드백은 공개되지 않습니다. 노쇼, 지각, 불편 상황은 운영자 검토 후 예치금과 다음 매칭에 반영됩니다.
      </div>
    </div>
  );
}

export default function TwoWeeksFeedbackPage() {
  const router = useRouter();
  const { matchId, token } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [match, setMatch] = useState(null);
  const [tokenEntry, setTokenEntry] = useState(null);

  const [meetingResult, setMeetingResult] = useState("");
  const [meetAgainIntent, setMeetAgainIntent] = useState("");
  const [meetingMood, setMeetingMood] = useState("");
  const [memo, setMemo] = useState("");

  const [noShowSituation, setNoShowSituation] = useState("");
  const [waitedMinutes, setWaitedMinutes] = useState("20");
  const [arrivalStatus, setArrivalStatus] = useState("");
  const [noShowMemo, setNoShowMemo] = useState("");

  const [selfNoShowReason, setSelfNoShowReason] = useState("");
  const [selfNoShowMemo, setSelfNoShowMemo] = useState("");
  const [nextRoundPreference, setNextRoundPreference] = useState("");

  const finalMeeting = useMemo(() => getFinalMeeting(match || {}), [match]);
  const applicationId = tokenEntry?.applicationId || "";
  const counterpartApplicationId =
    applicationId && match
      ? applicationId === match.maleApplicationId
        ? match.femaleApplicationId
        : match.maleApplicationId
      : "";
  const submittedFeedback = applicationId ? match?.feedbacks?.[applicationId] : null;

  useEffect(() => {
    if (!router.isReady) return;

    async function load() {
      const cleanMatchId = String(matchId || "").trim();
      const cleanToken = String(token || "").trim();

      if (!cleanMatchId || !cleanToken) {
        setError("피드백 링크가 올바르지 않습니다.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        await ensureAuth();

        const matchRef = doc(db, "twoweeksMatches", cleanMatchId);
        const snap = await getDoc(matchRef);

        if (!snap.exists()) {
          throw new Error("피드백 대상 만남을 찾지 못했습니다.");
        }

        const data = { id: snap.id, ...snap.data() };
        const foundToken = getTokenEntry(data, cleanToken);

        if (!foundToken?.applicationId) {
          throw new Error("만료되었거나 올바르지 않은 피드백 링크입니다.");
        }

        setMatch(data);
        setTokenEntry(foundToken);
      } catch (loadError) {
        console.error("[TwoWeeksFeedback] load error:", loadError);
        setError(loadError?.message || "피드백 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router.isReady, matchId, token]);

  const validate = () => {
    if (!meetingResult) return "오늘 실제로 만남이 진행되었는지 선택해주세요.";

    if (meetingResult === "met") {
      if (!meetAgainIntent) return "다시 만나보고 싶은 마음을 선택해주세요.";
      if (!meetingMood) return "오늘 만남이 어땠는지 선택해주세요.";
    }

    if (meetingResult === "counterpart_no_show") {
      if (!noShowSituation) return "상대가 오지 않은 상황을 선택해주세요.";
      if (!arrivalStatus) return "내 도착 상황을 선택해주세요.";
    }

    if (meetingResult === "self_no_show") {
      if (!selfNoShowReason) return "참석하지 못한 이유를 선택해주세요.";
    }

    if (meetingResult === "met" && !nextRoundPreference) {
      return "다음 회차 참여 의사를 선택해주세요.";
    }

    return "";
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      alert(validationError);
      return;
    }

    if (!match?.id || !applicationId) {
      alert("피드백 저장 정보를 확인할 수 없습니다.");
      return;
    }

    setSaving(true);

    try {
      await ensureAuth();

      const nowClient = new Date().toISOString();
      const isIssue = meetingResult !== "met";
      const feedbackPayload = {
        version: 1,
        matchId: match.id,
        applicationId,
        counterpartApplicationId,
        meetingResult,
        meetAgainIntent: meetingResult === "met" ? meetAgainIntent : "",
        meetingMood: meetingResult === "met" ? meetingMood : "",
        memo: meetingResult === "met" ? String(memo || "").trim().slice(0, 500) : "",
        noShow:
          meetingResult === "counterpart_no_show"
            ? {
                situation: noShowSituation,
                waitedMinutes: Number(waitedMinutes || 0),
                arrivalStatus,
                memo: String(noShowMemo || "").trim().slice(0, 500),
                reviewStatus: "needs_admin_review",
              }
            : null,
        selfNoShow:
          meetingResult === "self_no_show"
            ? {
                reason: selfNoShowReason,
                memo: String(selfNoShowMemo || "").trim().slice(0, 500),
                reviewStatus: "needs_admin_review",
              }
            : null,
        nextRoundPreference:
          meetingResult === "met" ? nextRoundPreference : "wait_admin_review",
        nextRoundStatus:
          meetingResult === "met" && nextRoundPreference === "join_next_round"
            ? "requested"
            : meetingResult === "met" && nextRoundPreference === "pause_one_round"
            ? "paused"
            : "admin_review",
        issueStatus: isIssue ? "needs_admin_review" : "none",
        submittedAt: serverTimestamp(),
        submittedAtClient: nowClient,
      };

      const nextFeedbacks = {
        ...(match.feedbacks || {}),
        [applicationId]: feedbackPayload,
      };
      const feedbackSummary = makeFeedbackSummary(nextFeedbacks);
      const feedbackStatus = makeFeedbackStatus(nextFeedbacks);

      const matchRef = doc(db, "twoweeksMatches", match.id);
      await setDoc(
        matchRef,
        {
          feedbacks: {
            [applicationId]: feedbackPayload,
          },
          nextRoundRequests: {
            [applicationId]: {
              applicationId,
              matchId: match.id,
              preference: feedbackPayload.nextRoundPreference,
              status: feedbackPayload.nextRoundStatus,
              requestedAt: serverTimestamp(),
              requestedAtClient: nowClient,
            },
          },
          feedbackStatus,
          feedbackSummary,
          feedbackTokens: {
            [applicationId]: {
              ...(tokenEntry || {}),
              token: tokenEntry?.token || String(token || ""),
              applicationId,
              matchId: match.id,
              usedAt: serverTimestamp(),
              usedAtClient: nowClient,
            },
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      const freshSnap = await getDoc(matchRef);
      const fresh = freshSnap.exists() ? { id: freshSnap.id, ...freshSnap.data() } : match;

      setMatch(fresh);
    } catch (saveError) {
      console.error("[TwoWeeksFeedback] save error:", saveError);
      alert(saveError?.message || "피드백 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>투윅스 만남 피드백</title>
      </Head>

      <main className="min-h-screen bg-[#f0f2f5] px-4 py-6 text-[#1c1e21]">
        <div className="mx-auto grid w-full max-w-2xl gap-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#1877f2]">2WEEKS FEEDBACK</div>
            <h1 className="mt-2 text-[28px] font-bold tracking-[-0.05em]">만남 피드백</h1>
            <p className="mt-2 break-keep text-[14px] font-semibold leading-6 text-[#65676b]">
              피드백은 다음 매칭 품질과 노쇼/불참 검토에만 활용됩니다. 상대에게 내 피드백 내용은 공개되지 않습니다.
            </p>
          </div>

          {loading ? (
            <div className="rounded-3xl bg-white p-8 text-center text-[14px] font-bold text-[#65676b]">
              피드백 정보를 불러오는 중입니다.
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-solid border-rose-200 bg-white p-6">
              <div className="text-[20px] font-bold text-rose-700">피드백을 열 수 없습니다</div>
              <p className="mt-2 break-keep text-[14px] font-semibold leading-6 text-[#65676b]">{error}</p>
            </div>
          ) : submittedFeedback ? (
            <SubmittedView feedback={submittedFeedback} finalMeeting={finalMeeting} />
          ) : (
            <div className="grid gap-4">
              <div className="rounded-3xl border border-solid border-[#dfe3e8] bg-white p-5 shadow-sm">
                <div className="text-[18px] font-bold">만남 정보</div>
                <div className="mt-3 rounded-2xl border border-solid border-[#eef0f3] px-4">
                  <Row label="일시" value={formatTime(finalMeeting)} />
                  <Row label="장소" value={formatPlace(finalMeeting)} />
                </div>
              </div>

              <div className="rounded-3xl border border-solid border-[#dfe3e8] bg-white p-5 shadow-sm">
                <div className="text-[18px] font-bold">오늘 실제로 만남이 진행되었나요?</div>
                <div className="mt-4 grid gap-3">
                  {MEETING_RESULT_OPTIONS.map((item) => (
                    <OptionButton
                      key={item.value}
                      selected={meetingResult === item.value}
                      title={item.label}
                      desc={item.desc}
                      tone={item.value === "counterpart_no_show" ? "rose" : "blue"}
                      onClick={() => setMeetingResult(item.value)}
                    />
                  ))}
                </div>
              </div>

              {meetingResult === "met" ? (
                <>
                  <div className="rounded-3xl border border-solid border-[#dfe3e8] bg-white p-5 shadow-sm">
                    <div className="text-[18px] font-bold">상대와 다시 만나보고 싶은 마음이 있나요?</div>
                    <div className="mt-4 grid gap-3">
                      {MEET_AGAIN_OPTIONS.map((item) => (
                        <OptionButton
                          key={item.value}
                          selected={meetAgainIntent === item.value}
                          title={item.label}
                          onClick={() => setMeetAgainIntent(item.value)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-solid border-[#dfe3e8] bg-white p-5 shadow-sm">
                    <div className="text-[18px] font-bold">오늘 만남은 전반적으로 어땠나요?</div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {MOOD_OPTIONS.map((item) => (
                        <OptionButton
                          key={item.value}
                          selected={meetingMood === item.value}
                          title={item.label}
                          onClick={() => setMeetingMood(item.value)}
                        />
                      ))}
                    </div>

                    <textarea
                      value={memo}
                      maxLength={500}
                      onChange={(event) => setMemo(event.target.value)}
                      rows={4}
                      placeholder="운영자에게 남기고 싶은 말이 있다면 적어주세요. 예: 대화는 편했지만 거리감이 조금 있었습니다."
                      className="mt-4 w-full rounded-2xl border border-solid border-[#dfe3e8] bg-white px-4 py-3 text-[14px] font-semibold leading-6 outline-none focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/10"
                    />
                  </div>
                </>
              ) : null}

              {meetingResult === "counterpart_no_show" ? (
                <div className="rounded-3xl border border-solid border-rose-200 bg-white p-5 shadow-sm">
                  <div className="text-[18px] font-bold text-rose-800">노쇼/미팅 불발 상황 확인</div>
                  <p className="mt-2 break-keep text-[13px] font-semibold leading-6 text-[#65676b]">
                    단순 체크만으로 바로 불이익을 주지 않고, 운영자가 양쪽 피드백과 참석 확인 기록을 함께 검토합니다.
                  </p>

                  <div className="mt-4 grid gap-3">
                    {NO_SHOW_OPTIONS.map((item) => (
                      <OptionButton
                        key={item.value}
                        selected={noShowSituation === item.value}
                        title={item.label}
                        onClick={() => setNoShowSituation(item.value)}
                        tone="rose"
                      />
                    ))}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-[13px] font-bold text-[#65676b]">약속 장소에서 기다린 시간</label>
                      <select
                        value={waitedMinutes}
                        onChange={(event) => setWaitedMinutes(event.target.value)}
                        className="mt-2 h-12 w-full rounded-xl border border-solid border-[#dfe3e8] bg-white px-3 text-[14px] font-bold outline-none"
                      >
                        <option value="10">10분 이상</option>
                        <option value="20">20분 이상</option>
                        <option value="30">30분 이상</option>
                        <option value="40">40분 이상</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[13px] font-bold text-[#65676b]">내 도착 상황</label>
                      <select
                        value={arrivalStatus}
                        onChange={(event) => setArrivalStatus(event.target.value)}
                        className="mt-2 h-12 w-full rounded-xl border border-solid border-[#dfe3e8] bg-white px-3 text-[14px] font-bold outline-none"
                      >
                        <option value="">선택해주세요</option>
                        {ARRIVAL_OPTIONS.map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-[12px] font-semibold leading-5 text-rose-800">
                    증빙은 ① 참석 확인 시각 ② 상대 참석 확인 여부 ③ 양쪽 피드백 불일치 ④ 운영자 연락 기록을 우선 확인합니다.
                    필요하면 운영자가 카페 영수증, 주문내역, 현장 사진, 지도 타임라인 캡처 등을 추가로 요청할 수 있습니다.
                  </div>

                  <textarea
                    value={noShowMemo}
                    maxLength={500}
                    onChange={(event) => setNoShowMemo(event.target.value)}
                    rows={4}
                    placeholder="상황을 간단히 적어주세요. 예: 약속시간 20분 전 도착했고, 입구와 좌석 주변을 확인했지만 상대를 찾지 못했습니다."
                    className="mt-4 w-full rounded-2xl border border-solid border-[#dfe3e8] bg-white px-4 py-3 text-[14px] font-semibold leading-6 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  />
                </div>
              ) : null}

              {meetingResult === "self_no_show" ? (
                <div className="rounded-3xl border border-solid border-orange-200 bg-white p-5 shadow-sm">
                  <div className="text-[18px] font-bold text-orange-800">참석하지 못한 이유</div>
                  <p className="mt-2 break-keep text-[13px] font-semibold leading-6 text-[#65676b]">
                    당일 불참 또는 노쇼는 다음 매칭 우선순위에 영향을 줄 수 있습니다.
                  </p>

                  <div className="mt-4 grid gap-3">
                    {SELF_NO_SHOW_REASONS.map((item) => (
                      <OptionButton
                        key={item.value}
                        selected={selfNoShowReason === item.value}
                        title={item.label}
                        onClick={() => setSelfNoShowReason(item.value)}
                      />
                    ))}
                  </div>

                  <textarea
                    value={selfNoShowMemo}
                    maxLength={500}
                    onChange={(event) => setSelfNoShowMemo(event.target.value)}
                    rows={4}
                    placeholder="불참 사유를 간단히 적어주세요."
                    className="mt-4 w-full rounded-2xl border border-solid border-[#dfe3e8] bg-white px-4 py-3 text-[14px] font-semibold leading-6 outline-none focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/10"
                  />
                </div>
              ) : null}

              {meetingResult === "met" ? (
                <div className="rounded-3xl border border-solid border-[#dfe3e8] bg-white p-5 shadow-sm">
                  <div className="text-[18px] font-bold">다음 회차는 어떻게 할까요?</div>
                  <p className="mt-2 break-keep text-[13px] font-semibold leading-6 text-[#65676b]">
                    이 선택은 바로 자동 매칭으로 이어지지 않고, 운영자가 다음 회차 후보 검토 시 참고합니다.
                  </p>
                  <div className="mt-4 grid gap-3">
                    {NEXT_ROUND_OPTIONS.map((item) => (
                      <OptionButton
                        key={item.value}
                        selected={nextRoundPreference === item.value}
                        title={item.label}
                        desc={item.desc}
                        onClick={() => setNextRoundPreference(item.value)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                disabled={saving}
                onClick={handleSubmit}
                className="min-h-[54px] rounded-2xl bg-[#1877f2] px-5 py-3 text-[15px] font-bold text-white shadow-sm transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "저장 중..." : "피드백 제출하기"}
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
