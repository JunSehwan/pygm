import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { signInAnonymously } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "firebaseConfig";

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

const CONTACT_CONNECTION_OPTIONS = [
  {
    value: "yes",
    label: "네, 서로 원하면 연락처를 공개해주세요",
    desc: "상대방도 같은 선택을 한 경우에만 서로의 연락처가 공개됩니다.",
  },
  {
    value: "no",
    label: "아니요, 이번 만남으로 마무리할게요",
    desc: "상대방에게 내 선택은 공개되지 않으며 다음 매칭을 기다리게 됩니다.",
  },
];

const MOOD_OPTIONS = [
  { value: "good", label: "좋았어요" },
  { value: "neutral", label: "무난했어요" },
  { value: "disappointing", label: "아쉬웠어요" },
  { value: "uncomfortable", label: "불편했어요" },
];

const DISCOMFORT_REASON_OPTIONS = [
  { value: "rude_behavior", label: "무례한 언행" },
  { value: "profile_mismatch", label: "프로필 정보 차이" },
  { value: "excessive_alcohol_smoking", label: "과도한 음주·흡연" },
  { value: "safety_concern", label: "안전상 불편" },
  { value: "other", label: "기타" },
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

const FEEDBACK_WINDOW_MS = 48 * 60 * 60 * 1000;

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

function parseDateMs(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getFeedbackRequestedMs(match = {}, tokenEntry = {}) {
  const candidates = [
    match?.postMeeting?.feedbackRequestedAtClient,
    match?.feedbackRequestSms?.sentAtClient,
    tokenEntry?.requestSentAtClient,
    match?.postMeeting?.feedbackDueAtClient,
  ];

  for (const value of candidates) {
    const parsed = parseDateMs(value);
    if (parsed) return parsed;
  }

  return parseDateMs(match?.postMeeting?.feedbackRequestedAt);
}

function getFeedbackDeadlineMs(match = {}, tokenEntry = {}) {
  const explicit = parseDateMs(match?.postMeeting?.feedbackDeadlineAtClient);
  if (explicit) return explicit;
  const requestedMs = getFeedbackRequestedMs(match, tokenEntry);
  return requestedMs ? requestedMs + FEEDBACK_WINDOW_MS : 0;
}

function formatDeadline(value) {
  const ms = typeof value === "number" ? value : parseDateMs(value);
  if (!ms) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));
}

function formatRemaining(deadlineMs, nowMs) {
  if (!deadlineMs) return "";
  const remaining = deadlineMs - nowMs;
  if (remaining <= 0) return "제출 기한 종료";

  const totalMinutes = Math.max(1, Math.ceil(remaining / (60 * 1000)));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}일 ${hours}시간 남음`;
  if (hours > 0) return `${hours}시간 ${minutes}분 남음`;
  return `${minutes}분 남음`;
}

function getLabel(options = [], value = "") {
  return options.find((item) => item.value === value)?.label || value || "-";
}

function getContinueMeetingIntent(feedback = {}) {
  return String(feedback?.continueMeetingIntent || feedback?.meetAgainIntent || "");
}

function hasContactShareConsent(feedback = {}) {
  if (feedback?.meetingResult !== "met") return false;
  const intent = getContinueMeetingIntent(feedback);
  if (typeof feedback?.contactShareConsent === "boolean") {
    return intent === "yes" && feedback.contactShareConsent;
  }
  // 기존 피드백은 '재만남 희망 시 연락처 공개' 안내 아래 수집되어 호환 처리합니다.
  return intent === "yes";
}

function OptionButton({ selected, title, desc, onClick, tone = "blue" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full rounded-xl border border-solid p-4 text-left transition",
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

function MultiOptionButton({ selected, title, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex min-h-[48px] items-center justify-between rounded-xl border border-solid px-4 py-3 text-left transition",
        selected
          ? "border-rose-400 bg-rose-50 text-rose-800"
          : "border-[#dfe3e8] bg-white text-[#1c1e21] hover:border-rose-300"
      )}
    >
      <span className="text-[14px] font-bold">{title}</span>
      <span
        className={cx(
          "flex h-6 w-6 items-center justify-center rounded-full border text-[13px] font-bold",
          selected ? "border-rose-500 bg-rose-500 text-white" : "border-[#cfd4da] bg-white text-transparent"
        )}
      >
        ✓
      </span>
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

function SubmittedView({ feedback, finalMeeting, onBackToDashboard, onOpenReview, reviewBusy = false }) {
  const noShow = feedback?.noShow || {};
  const selfNoShow = feedback?.selfNoShow || {};

  return (
    <div className="rounded-xl border border-solid border-[#dfe3e8] bg-white p-5 shadow-sm">
      <div className="rounded-xl bg-emerald-50 p-4">
        <div className="text-[20px] font-bold tracking-[-0.04em] text-emerald-900">
          피드백 제출이 완료되었습니다
        </div>
        <p className="mt-2 break-keep text-[13px] font-semibold leading-6 text-emerald-800">
          남겨주신 내용은 다음 매칭과 만남 운영에 반영됩니다.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-solid border-[#eef0f3] px-4">
        <Row label="만남 일시" value={formatTime(finalMeeting)} />
        <Row label="장소" value={formatPlace(finalMeeting)} />
        <Row label="실제 만남" value={getLabel(MEETING_RESULT_OPTIONS, feedback.meetingResult)} />
        {feedback.meetingResult === "met" ? (
          <>
            <Row
              label="만남 이어가기"
              value={getLabel(CONTACT_CONNECTION_OPTIONS, hasContactShareConsent(feedback) ? "yes" : "no")}
            />
            <Row label="만남 느낌" value={getLabel(MOOD_OPTIONS, feedback.meetingMood)} />
            {feedback.meetingMood === "uncomfortable" ? (
              <>
                <Row
                  label="불편 사유"
                  value={(Array.isArray(feedback.discomfortReasons) ? feedback.discomfortReasons : [])
                    .map((value) => getLabel(DISCOMFORT_REASON_OPTIONS, value))
                    .join(", ") || "-"}
                />
                {feedback.discomfortOtherText ? <Row label="기타 의견" value={feedback.discomfortOtherText} /> : null}
              </>
            ) : null}
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
        <Row label="메모" value={feedback.memo || noShow.memo || selfNoShow.memo || "-"} />
        <Row label="제출일" value={formatSubmittedAt(feedback.submittedAtClient)} />
      </div>

      <div className="mt-4 rounded-xl bg-[#f0f2f5] px-4 py-3 text-[12px] font-semibold leading-5 text-[#65676b]">
        상대가 남긴 선택은 공개되지 않습니다. 두 분 모두 만남 이어가기를 선택한 경우에만 결과보기에서 서로의 연락처가 공개되고 새 매칭이 일시정지됩니다. 한쪽이라도 선택하지 않으면 연락처 공개 없이 다음 매칭 대기로 자동 전환됩니다.
      </div>

      <div className="mt-3 text-[11px] font-semibold leading-5 text-[#8a8d91]">
        제출이 완료된 피드백은 수정할 수 없습니다.
      </div>

      {feedback.meetingResult === "met" ? (
        <div className="mt-5 rounded-xl border border-solid border-orange-200 bg-orange-50 p-4">
          <div className="text-[15px] font-bold text-orange-950">이번 투윅스 경험을 한 줄로 남겨주세요.</div>
          <p className="mt-1 break-keep text-[12px] font-semibold leading-5 text-orange-900/80">
            실제 후기가 쌓일수록 투윅스를 믿고 참여하는 좋은 회원이 늘고, 다음 매칭의 선택지도 더 좋아질 수 있습니다. 후기 작성은 선택이며 공개 여부도 직접 정할 수 있습니다.
          </p>
          <button
            type="button"
            onClick={onOpenReview}
            disabled={reviewBusy}
            className="mt-3 min-h-[44px] w-full rounded-xl border border-solid border-orange-300 bg-white px-4 py-3 text-[13px] font-bold text-orange-800 transition hover:border-orange-500 disabled:opacity-50"
          >
            {reviewBusy ? "후기 페이지 준비 중..." : "1분 후기 남기기 · 선택"}
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onBackToDashboard}
        className="mt-3 min-h-[50px] w-full rounded-xl bg-[#1877f2] px-5 py-3 text-[14px] font-bold text-white transition hover:bg-[#166fe5]"
      >
        신청현황으로 돌아가기
      </button>
    </div>
  );
}

export default function TwoWeeksFeedbackPage() {
  const router = useRouter();
  const { matchId: routeMatchId, token: routeToken } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [error, setError] = useState("");
  const [match, setMatch] = useState(null);
  const [tokenEntry, setTokenEntry] = useState(null);
  const [accessToken, setAccessToken] = useState("");
  const [dashboardPath, setDashboardPath] = useState("/2weeks/proposal/dashboard");
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [meetingResult, setMeetingResult] = useState("");
  const [continueMeetingIntent, setContinueMeetingIntent] = useState("");
  const [meetingMood, setMeetingMood] = useState("");
  const [discomfortReasons, setDiscomfortReasons] = useState([]);
  const [discomfortOtherText, setDiscomfortOtherText] = useState("");
  const [memo, setMemo] = useState("");

  const [noShowSituation, setNoShowSituation] = useState("");
  const [waitedMinutes, setWaitedMinutes] = useState("20");
  const [arrivalStatus, setArrivalStatus] = useState("");
  const [noShowMemo, setNoShowMemo] = useState("");

  const [selfNoShowReason, setSelfNoShowReason] = useState("");
  const [selfNoShowMemo, setSelfNoShowMemo] = useState("");

  const finalMeeting = useMemo(() => getFinalMeeting(match || {}), [match]);
  const applicationId = tokenEntry?.applicationId || "";
  const counterpartApplicationId =
    applicationId && match
      ? applicationId === match.maleApplicationId
        ? match.femaleApplicationId
        : match.maleApplicationId
      : "";
  const submittedFeedback = applicationId ? match?.feedbacks?.[applicationId] : null;
  const feedbackDeadlineMs = useMemo(
    () => getFeedbackDeadlineMs(match || {}, tokenEntry || {}),
    [match, tokenEntry]
  );
  const feedbackExpired =
    !submittedFeedback &&
    feedbackDeadlineMs > 0 &&
    nowMs >= feedbackDeadlineMs;

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!router.isReady) return;

    async function load() {
      const browserToken =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("token") || ""
          : "";
      const cleanToken = String(routeToken || browserToken || "").trim();

      // localhost의 구형 /feedback/{matchId}?token=... 주소도 한동안 호환한다.
      let cleanMatchId = String(routeMatchId || "").trim();
      if (!cleanMatchId && typeof window !== "undefined") {
        const prefix = "/2weeks/feedback/";
        const pathname = window.location.pathname || "";
        if (pathname.startsWith(prefix)) {
          cleanMatchId = decodeURIComponent(pathname.slice(prefix.length).split("/")[0] || "").trim();
        }
      }

      if (!cleanToken) {
        setError("피드백 링크가 올바르지 않습니다.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setAccessToken(cleanToken);

      try {
        await ensureAuth();

        // 신규/구형 URL 모두 token을 서버에서 확인한다.
        // 신청현황 상대경로도 함께 받아 localhost/preview origin을 그대로 유지한다.
        const functions = getFunctions(undefined, "asia-northeast3");
        const resolveAccess = httpsCallable(functions, "resolveTwoWeeksFeedbackAccess");
        const resolved = await resolveAccess({ token: cleanToken });
        const resolvedMatchId = String(resolved?.data?.matchId || "").trim();
        if (resolvedMatchId) cleanMatchId = resolvedMatchId;
        if (resolved?.data?.dashboardPath) {
          setDashboardPath(String(resolved.data.dashboardPath));
        }

        if (!cleanMatchId) {
          throw new Error("피드백 대상 만남을 찾지 못했습니다.");
        }

        const data = resolved?.data?.feedbackView || null;
        if (!data?.id || data.id !== cleanMatchId) {
          throw new Error("피드백 대상 만남을 찾지 못했습니다.");
        }
        const foundToken = getTokenEntry(data, cleanToken);

        if (!foundToken?.applicationId) {
          throw new Error("만료되었거나 올바르지 않은 피드백 링크입니다.");
        }

        setMatch(data);
        setTokenEntry(foundToken);

        // 예전에 발송한 beta/matchId 포함 URL로 들어와도 주소창은 즉시 깨끗하게 정리한다.
        if (typeof window !== "undefined") {
          const cleanUrl = `/2weeks/feedback?token=${encodeURIComponent(cleanToken)}`;
          if (`${window.location.pathname}${window.location.search}` !== cleanUrl) {
            window.history.replaceState({}, "", cleanUrl);
          }
        }
      } catch (loadError) {
        console.error("[TwoWeeksFeedback] load error:", loadError);
        setError(loadError?.message?.replace(/^FirebaseError:\s*/i, "") || "피드백 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router.isReady, routeMatchId, routeToken]);

  const validate = () => {
    if (!meetingResult) return "오늘 실제로 만남이 진행되었는지 선택해주세요.";

    if (meetingResult === "met") {
      if (!continueMeetingIntent) return "상대방과 만남을 이어갈지 선택해주세요.";
      if (!meetingMood) return "오늘 만남이 어땠는지 선택해주세요.";
      if (meetingMood === "uncomfortable" && !discomfortReasons.length) return "불편했던 이유를 하나 이상 선택해주세요.";
      if (
        meetingMood === "uncomfortable" &&
        discomfortReasons.includes("other") &&
        !String(discomfortOtherText || "").trim()
      ) {
        return "기타 불편 사유를 간단히 적어주세요.";
      }
    }

    if (meetingResult === "counterpart_no_show") {
      if (!noShowSituation) return "상대가 오지 않은 상황을 선택해주세요.";
      if (!arrivalStatus) return "내 도착 상황을 선택해주세요.";
    }

    if (meetingResult === "self_no_show") {
      if (!selfNoShowReason) return "참석하지 못한 이유를 선택해주세요.";
    }


    return "";
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      alert(validationError);
      return;
    }

    if (!match?.id || !applicationId || !accessToken) {
      alert("피드백 저장 정보를 확인할 수 없습니다.");
      return;
    }

    if (feedbackExpired) {
      alert("피드백 제출 기한이 종료되었습니다. 이번 만남은 연락처 공개 없이 처리됩니다.");
      return;
    }

    setSaving(true);

    try {
      await ensureAuth();

      const functions = getFunctions(undefined, "asia-northeast3");
      const submitFeedback = httpsCallable(functions, "submitTwoWeeksFeedback");
      const submitResult = await submitFeedback({
        token: accessToken,
        feedback: {
          meetingResult,
          continueMeetingIntent: meetingResult === "met" ? continueMeetingIntent : "",
          contactShareConsent: meetingResult === "met" && continueMeetingIntent === "yes",
          meetingMood: meetingResult === "met" ? meetingMood : "",
          discomfortReasons:
            meetingResult === "met" && meetingMood === "uncomfortable"
              ? discomfortReasons
              : [],
          discomfortOtherText:
            meetingResult === "met" &&
            meetingMood === "uncomfortable" &&
            discomfortReasons.includes("other")
              ? String(discomfortOtherText || "").trim().slice(0, 300)
              : "",
          memo: meetingResult === "met" ? String(memo || "").trim().slice(0, 500) : "",
          noShow:
            meetingResult === "counterpart_no_show"
              ? {
                  situation: noShowSituation,
                  waitedMinutes: Number(waitedMinutes || 0),
                  arrivalStatus,
                  memo: String(noShowMemo || "").trim().slice(0, 500),
                }
              : null,
          selfNoShow:
            meetingResult === "self_no_show"
              ? {
                  reason: selfNoShowReason,
                  memo: String(selfNoShowMemo || "").trim().slice(0, 500),
                }
              : null,
        },
      });

      const submitted = submitResult?.data?.feedback || {
        submittedAtClient: submitResult?.data?.submittedAtClient || new Date().toISOString(),
      };
      setMatch((current) => ({
        ...(current || {}),
        feedbacks: {
          ...(current?.feedbacks || {}),
          [applicationId]: submitted,
        },
      }));
    } catch (saveError) {
      console.error("[TwoWeeksFeedback] save error:", saveError);
      const message =
        saveError?.message
          ?.replace(/^FirebaseError:\s*/i, "")
          ?.replace(/^functions\/[a-z-]+:\s*/i, "") ||
        "피드백 저장 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const handleBackToDashboard = () => {
    const target = String(dashboardPath || "/2weeks/proposal/dashboard").trim();
    router.push(target.startsWith("/") ? target : "/2weeks/proposal/dashboard");
  };

  const handleOpenReview = async () => {
    if (!accessToken) return alert("후기 작성 정보를 확인할 수 없습니다.");
    setReviewBusy(true);
    try {
      await ensureAuth();
      const functions = getFunctions(undefined, "asia-northeast3");
      const ensureReviewAccess = httpsCallable(functions, "ensureTwoWeeksReviewAccess");
      const result = await ensureReviewAccess({ feedbackToken: accessToken });
      if (result?.data?.alreadySubmitted) {
        alert("이미 이용 후기를 남겨주셨습니다. 감사합니다.");
        return;
      }
      const path = String(result?.data?.path || "").trim();
      if (!path) throw new Error("후기 페이지를 열 수 없습니다.");
      router.push(path);
    } catch (reviewError) {
      console.error("[TwoWeeksFeedback] review access error:", reviewError);
      alert(reviewError?.message?.replace(/^FirebaseError:\s*/i, "") || "후기 페이지를 여는 중 오류가 발생했습니다.");
    } finally {
      setReviewBusy(false);
    }
  };

  return (
    <>
      <Head>
        <title>투윅스 만남 피드백</title>
      </Head>

      <main className="min-h-screen bg-[#f0f2f5] px-4 py-6 text-[#1c1e21]">
        <div className="mx-auto grid w-full max-w-2xl gap-4">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#1877f2]">2WEEKS FEEDBACK</div>
            <h1 className="mt-2 text-[28px] font-bold tracking-[-0.05em]">만남 피드백</h1>
            <p className="mt-2 break-keep text-[14px] font-semibold leading-6 text-[#65676b]">
              피드백은 다음 매칭 품질과 노쇼·불편 상황 확인에 활용됩니다. 상대에게 내 피드백 내용은 공개되지 않습니다.
            </p>
          </div>

          {!loading && !error && !submittedFeedback && feedbackDeadlineMs ? (
            <div
              className={cx(
                "rounded-xl border border-solid p-4 shadow-sm",
                feedbackExpired
                  ? "border-rose-200 bg-rose-50"
                  : feedbackDeadlineMs - nowMs <= 24 * 60 * 60 * 1000
                  ? "border-amber-200 bg-amber-50"
                  : "border-blue-100 bg-blue-50"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div
                  className={cx(
                    "text-[15px] font-bold",
                    feedbackExpired
                      ? "text-rose-800"
                      : feedbackDeadlineMs - nowMs <= 24 * 60 * 60 * 1000
                      ? "text-amber-900"
                      : "text-blue-900"
                  )}
                >
                  {feedbackExpired ? "피드백 제출 기한이 종료되었습니다" : `피드백 마감까지 ${formatRemaining(feedbackDeadlineMs, nowMs)}`}
                </div>
                <div className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold text-[#65676b]">
                  {formatDeadline(feedbackDeadlineMs)}까지
                </div>
              </div>
              <p className="mt-2 break-keep text-[12px] font-semibold leading-5 text-[#65676b]">
                피드백은 요청 후 48시간 이내에 작성해주세요. 기한 내 미응답은 이번 만남의 연락처 공개 의사가 없는 것으로 처리되어 연락처가 공개되지 않습니다. 반복적인 미응답은 추후 매칭에 영향을 줄 수 있습니다.
              </p>
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-xl bg-white p-8 text-center text-[14px] font-bold text-[#65676b]">
              피드백 정보를 불러오는 중입니다.
            </div>
          ) : error ? (
            <div className="rounded-xl border border-solid border-rose-200 bg-white p-6">
              <div className="text-[20px] font-bold text-rose-700">피드백을 열 수 없습니다</div>
              <p className="mt-2 break-keep text-[14px] font-semibold leading-6 text-[#65676b]">{error}</p>
            </div>
          ) : submittedFeedback ? (
            <SubmittedView feedback={submittedFeedback} finalMeeting={finalMeeting} onBackToDashboard={handleBackToDashboard} onOpenReview={handleOpenReview} reviewBusy={reviewBusy} />
          ) : feedbackExpired ? (
            <div className="rounded-xl border border-solid border-[#dfe3e8] bg-white p-5 shadow-sm">
              <div className="text-[20px] font-bold tracking-[-0.04em] text-[#1c1e21]">이번 피드백 접수가 마감되었습니다</div>
              <p className="mt-2 break-keep text-[13px] font-semibold leading-6 text-[#65676b]">
                피드백 요청 후 48시간이 지나 이번 만남은 연락처 공개 없이 마무리됩니다. 다음 매칭은 현재 이용 상태에 따라 이어집니다.
              </p>
              <button
                type="button"
                onClick={handleBackToDashboard}
                className="mt-5 min-h-[50px] w-full rounded-xl bg-[#1877f2] px-5 py-3 text-[14px] font-bold text-white transition hover:bg-[#166fe5]"
              >
                신청현황으로 돌아가기
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="rounded-xl border border-solid border-[#dfe3e8] bg-white p-5 shadow-sm">
                <div className="text-[18px] font-bold">만남 정보</div>
                <div className="mt-3 rounded-xl border border-solid border-[#eef0f3] px-4">
                  <Row label="일시" value={formatTime(finalMeeting)} />
                  <Row label="장소" value={formatPlace(finalMeeting)} />
                </div>
              </div>

              <div className="rounded-xl border border-solid border-[#dfe3e8] bg-white p-5 shadow-sm">
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
                  <div className="rounded-xl border border-solid border-[#dfe3e8] bg-white p-5 shadow-sm">
                    <div className="text-[18px] font-bold">상대방과 만남을 이어가시겠어요?</div>
                    <p className="mt-2 break-keep text-[12px] font-semibold leading-5 text-[#65676b]">
                      두 분 모두 이어가기를 선택한 경우에만 결과보기에서 서로의 연락처가 공개됩니다. 한쪽이라도 선택하지 않으면 연락처는 공개되지 않습니다.
                    </p>
                    <div className="mt-4 grid gap-3">
                      {CONTACT_CONNECTION_OPTIONS.map((item) => (
                        <OptionButton
                          key={item.value}
                          selected={continueMeetingIntent === item.value}
                          title={item.label}
                          desc={item.desc}
                          onClick={() => setContinueMeetingIntent(item.value)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-solid border-[#dfe3e8] bg-white p-5 shadow-sm">
                    <div className="text-[18px] font-bold">오늘 만남은 전반적으로 어땠나요?</div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {MOOD_OPTIONS.map((item) => (
                        <OptionButton
                          key={item.value}
                          selected={meetingMood === item.value}
                          title={item.label}
                          onClick={() => {
                            setMeetingMood(item.value);
                            if (item.value !== "uncomfortable") {
                              setDiscomfortReasons([]);
                              setDiscomfortOtherText("");
                            }
                          }}
                        />
                      ))}
                    </div>

                    {meetingMood === "uncomfortable" ? (
                      <div className="mt-4 rounded-xl border border-solid border-rose-200 bg-rose-50/50 p-4">
                        <div className="text-[14px] font-bold text-rose-900">불편했던 이유를 선택해주세요</div>
                        <p className="mt-1 break-keep text-[12px] font-semibold leading-5 text-rose-700">
                          해당되는 항목을 여러 개 선택할 수 있습니다. 이 내용은 상대에게 공개되지 않고 운영 확인에만 사용됩니다.
                        </p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {DISCOMFORT_REASON_OPTIONS.map((item) => (
                            <MultiOptionButton
                              key={item.value}
                              selected={discomfortReasons.includes(item.value)}
                              title={item.label}
                              onClick={() => {
                                setDiscomfortReasons((current) => {
                                  const exists = current.includes(item.value);
                                  const next = exists
                                    ? current.filter((value) => value !== item.value)
                                    : [...current, item.value];
                                  if (item.value === "other" && exists) setDiscomfortOtherText("");
                                  return next;
                                });
                              }}
                            />
                          ))}
                        </div>
                        {discomfortReasons.includes("other") ? (
                          <textarea
                            value={discomfortOtherText}
                            maxLength={300}
                            onChange={(event) => setDiscomfortOtherText(event.target.value)}
                            rows={3}
                            placeholder="기타 불편했던 점을 간단히 적어주세요."
                            className="mt-3 w-full rounded-xl border border-solid border-rose-200 bg-white px-4 py-3 text-[14px] font-semibold leading-6 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                          />
                        ) : null}
                      </div>
                    ) : null}

                    <textarea
                      value={memo}
                      maxLength={500}
                      onChange={(event) => setMemo(event.target.value)}
                      rows={4}
                      placeholder="운영자에게 남기고 싶은 말이 있다면 적어주세요. 예: 대화는 편했지만 거리감이 조금 있었습니다."
                      className="mt-4 w-full rounded-xl border border-solid border-[#dfe3e8] bg-white px-4 py-3 text-[14px] font-semibold leading-6 outline-none focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/10"
                    />
                  </div>
                </>
              ) : null}

              {meetingResult === "counterpart_no_show" ? (
                <div className="rounded-xl border border-solid border-rose-200 bg-white p-5 shadow-sm">
                  <div className="text-[18px] font-bold text-rose-800">노쇼/미팅 불발 상황 확인</div>
                  <p className="mt-2 break-keep text-[13px] font-semibold leading-6 text-[#65676b]">
                    운영자가 참석 기록과 양쪽 피드백을 확인한 후 노쇼 여부를 판정합니다.
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

                  <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-[12px] font-semibold leading-5 text-rose-800">
                    필요한 경우 현장 사진이나 결제 내역 등 증빙을 요청할 수 있습니다.
                  </div>

                  <textarea
                    value={noShowMemo}
                    maxLength={500}
                    onChange={(event) => setNoShowMemo(event.target.value)}
                    rows={4}
                    placeholder="상황을 간단히 적어주세요. 예: 약속시간 20분 전 도착했고, 입구와 좌석 주변을 확인했지만 상대를 찾지 못했습니다."
                    className="mt-4 w-full rounded-xl border border-solid border-[#dfe3e8] bg-white px-4 py-3 text-[14px] font-semibold leading-6 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  />
                </div>
              ) : null}

              {meetingResult === "self_no_show" ? (
                <div className="rounded-xl border border-solid border-orange-200 bg-white p-5 shadow-sm">
                  <div className="text-[18px] font-bold text-orange-800">참석하지 못한 이유</div>
                  <p className="mt-2 break-keep text-[13px] font-semibold leading-6 text-[#65676b]">
                    운영 확인 후 회원에게 설정된 예치금 전액이 차감되고 매칭이 제한될 수 있습니다. 불가피한 사유는 별도 검토합니다.
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
                    className="mt-4 w-full rounded-xl border border-solid border-[#dfe3e8] bg-white px-4 py-3 text-[14px] font-semibold leading-6 outline-none focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/10"
                  />
                </div>
              ) : null}

              {meetingResult === "met" ? (
                <div className="rounded-xl border border-solid border-blue-100 bg-blue-50 p-5 shadow-sm">
                  <div className="text-[16px] font-bold text-blue-900">피드백 완료 후 다음 상태가 자동으로 정리됩니다</div>
                  <p className="mt-2 break-keep text-[13px] font-semibold leading-6 text-blue-800">
                    두 분 모두 추후 만남 의향과 연락처 공개에 동의하면 연락처가 서로 공개되고 새 매칭은 일시정지됩니다. 그 외에는 다음 매칭 대기로 자동 전환됩니다.
                  </p>
                </div>
              ) : null}

              <div className="px-1 text-center text-[11px] font-semibold leading-5 text-[#8a8d91]">
                제출한 피드백은 수정할 수 없습니다. 내용을 한 번 더 확인한 뒤 제출해주세요.
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={handleSubmit}
                className="min-h-[54px] rounded-xl bg-[#1877f2] px-5 py-3 text-[15px] font-bold text-white shadow-sm transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
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
