import { Section, StatCard } from "./AdminCommon";
import {
  formatDate,
  getApplicationName,
  getMatchingPauseReasonLabel,
  getNoResponseReviewState,
  getPenaltyReasonLabel,
  getPenaltyStats,
  getPenaltySummaryText,
  getStatusLabel,
  hasPenaltyRecord,
} from "./utils";
import { getTwoWeeksDeclineReasonLabel } from "../TwoWeeksShared/declineReasons";

function getFeedbackLabel(value = "") {
  const labels = {
    met: "만남 진행",
    counterpart_no_show: "상대 노쇼",
    self_no_show: "본인 불참",
    yes: "있음",
    maybe: "고민",
    no: "없음",
    good: "좋았음",
    neutral: "무난",
    disappointing: "아쉬움",
    uncomfortable: "불편",
    rude_behavior: "무례한 언행",
    profile_mismatch: "프로필 정보 차이",
    excessive_alcohol_smoking: "과도한 음주·흡연",
    safety_concern: "안전상 불편",
    no_contact_absent: "연락 없이 미참석",
    late_too_long: "지각으로 불발",
    could_not_find: "장소에서 못 찾음",
    other: "기타",
    urgent_schedule: "급한 일정",
    health: "건강 사유",
    mistake: "시간/장소 착각",
    changed_mind: "단순 변심",
    join_next_round: "다음 회차 참여 희망(기존)",
    pause_one_round: "한 회차 쉬기(기존)",
    wait_admin_review: "운영자 안내 후 결정(기존)",
    pause_until_resume: "재개 전까지 일시정지",
    requested: "처리 대기",
    queued: "매칭 대기",
    paused: "일시정지",
    user_paused: "사용자 일시정지",
    contact_connected: "연락처 공개 후 일시정지",
    feedback_no_response_recorded: "피드백 미응답 기록",
    timeout_processed: "피드백 기한 종료",
    top_up_required: "추가 예치 필요",
    admin_review: "운영자 검토",
    no_show_confirmed: "노쇼 확정",
    self_no_show_confirmed: "본인 불참 확정",
    no_show_dismissed: "노쇼 아님",
    evidence_requested: "추가 확인 필요",
    no_penalty_rematch: "불이익 없이 재매칭",
  };

  return labels[value] || value || "-";
}

function getPairName(match = {}, applicationsById = {}) {
  const male = applicationsById[match.maleApplicationId];
  const female = applicationsById[match.femaleApplicationId];

  return `${getApplicationName(male || { id: match.maleApplicationId })} ↔ ${getApplicationName(female || { id: match.femaleApplicationId })}`;
}

function getFinalMeeting(match = {}) {
  return match.finalMeeting || match.schedule?.finalMeeting || {};
}

function getPlaceName(finalMeeting = {}) {
  return finalMeeting.placeName || finalMeeting.finalPlaceChoice?.cafeName || finalMeeting.placeChoice?.cafeName || "-";
}

function getTimeText(finalMeeting = {}) {
  return [finalMeeting.finalTimeChoice?.dateLabel || finalMeeting.dateLabel, finalMeeting.finalTimeChoice?.timeLabel || finalMeeting.timeLabel].filter(Boolean).join(" ") || "-";
}

function getCounterpartId(match = {}, applicationId = "") {
  if (applicationId === match.maleApplicationId) return match.femaleApplicationId || "";
  if (applicationId === match.femaleApplicationId) return match.maleApplicationId || "";
  return "";
}

function ProofImage({ proof }) {
  if (!proof?.photo?.url) return <span className="text-zinc-400">등록 없음</span>;

  return (
    <a href={proof.photo.url} target="_blank" rel="noreferrer" className="grid gap-2">
      <img src={proof.photo.url} alt="현장 인증" className="h-24 w-32 rounded-lg object-cover" />
      <span className="text-xs font-bold text-blue-700">원본 보기</span>
    </a>
  );
}

function EvidenceRow({ label, app, match }) {
  const attendance = match.meetingAttendance?.[app?.id] || {};
  const arrival = match.meetingArrival?.[app?.id] || {};
  const missingArrivalAlert = match.missingArrivalAlerts?.[app?.id] || {};
  const note = match.preMeetingNotes?.[app?.id] || {};
  const proof = match.meetingProofs?.[app?.id] || {};

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3">
      <div className="text-xs font-bold text-zinc-400">{label}</div>
      <div className="mt-1 text-sm font-bold text-zinc-950">{getApplicationName(app)}</div>
      <div className="mt-3 grid gap-2 text-xs font-semibold leading-5 text-zinc-600">
        <div>참석확인: <b>{attendance.status === "attending" ? "완료" : "없음"}</b> {attendance.updatedAtClient ? `· ${formatDate(attendance.updatedAtClient)}` : ""}</div>
        <div>도착확인: <b>{arrival.status === "arrived" ? "완료" : "없음"}</b> {arrival.arrivedAtClient ? `· ${formatDate(arrival.arrivedAtClient)}` : ""}</div>
        <div>상대 미도착 호출: <b>{missingArrivalAlert.status === "sent" ? "문자 발송" : missingArrivalAlert.status === "failed" ? "발송 실패" : "없음"}</b> {missingArrivalAlert.sentAtClient ? `· ${formatDate(missingArrivalAlert.sentAtClient)}` : ""}</div>
        <div className="break-keep">한마디: <b>{note.note || arrival.preMeetingNoteSnapshot || "-"}</b></div>
        <div>
          <div className="mb-1 text-zinc-400">현장 인증 사진</div>
          <ProofImage proof={proof} />
          {proof.note ? <div className="mt-1 break-keep text-zinc-500">메모: {proof.note}</div> : null}
        </div>
      </div>
    </div>
  );
}

function NoShowActionButton({ children, disabled, onClick, tone = "dark" }) {
  const cls =
    tone === "bad"
      ? "border-rose-600 bg-rose-600 text-white"
      : tone === "warn"
      ? "border-orange-500 bg-orange-500 text-white"
      : tone === "light"
      ? "border-zinc-200 bg-white text-zinc-700"
      : "border-zinc-950 bg-zinc-950 text-white";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`border px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50 ${cls}`}
    >
      {children}
    </button>
  );
}

function NoShowReviewPanel({ match, applicationsById, onResolveNoShow, busyId }) {
  const feedbacks = Object.values(match.feedbacks || {}).filter(Boolean);
  const issueFeedbacks = feedbacks.filter((item) => item.meetingResult && item.meetingResult !== "met");

  if (!issueFeedbacks.length) return null;

  return (
    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
      <div className="text-sm font-bold text-rose-900">노쇼/불참 검토</div>
      <p className="mt-1 break-keep text-xs font-semibold leading-5 text-rose-800">
        단일 신고만으로 자동 제재하지 않고, 참석확인·도착확인·현장 인증 사진·양쪽 피드백을 함께 보고 처리합니다.
      </p>

      <div className="mt-3 grid gap-3">
        {issueFeedbacks.map((feedback) => {
          const reporterId = feedback.applicationId;
          const accusedId = feedback.meetingResult === "self_no_show" ? reporterId : feedback.counterpartApplicationId || getCounterpartId(match, reporterId);
          const reporter = applicationsById[reporterId] || { id: reporterId };
          const accused = applicationsById[accusedId] || { id: accusedId };
          const noShow = feedback.noShow || {};
          const selfNoShow = feedback.selfNoShow || {};
          const review = match.noShowReview?.[reporterId] || {};
          const baseBusy = `noShow:${match.id}:${reporterId}`;

          return (
            <div key={reporterId} className="rounded-xl border border-rose-100 bg-white p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-zinc-950">{getApplicationName(reporter)} 신고/제출 건</div>
                  <div className="mt-1 text-xs font-semibold text-zinc-500">
                    대상: {getApplicationName(accused)} · 현재 처리: {getFeedbackLabel(review.status || "admin_review")}
                  </div>
                </div>
                {review.reviewedAtClient ? <span className="bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-500">{formatDate(review.reviewedAtClient)}</span> : null}
              </div>

              <div className="mt-3 grid gap-2 text-xs font-semibold leading-5 text-zinc-600">
                <div>유형: <b>{getFeedbackLabel(feedback.meetingResult)}</b></div>
                {feedback.meetingResult === "counterpart_no_show" ? (
                  <>
                    <div>상황: <b>{getFeedbackLabel(noShow.situation)}</b></div>
                    <div>대기: <b>{noShow.waitedMinutes || "-"}분 이상</b></div>
                    <div>도착상황: <b>{getFeedbackLabel(noShow.arrivalStatus)}</b></div>
                    {noShow.memo ? <div className="break-keep">메모: {noShow.memo}</div> : null}
                  </>
                ) : null}
                {feedback.meetingResult === "self_no_show" ? (
                  <>
                    <div>불참사유: <b>{getFeedbackLabel(selfNoShow.reason)}</b></div>
                    {selfNoShow.memo ? <div className="break-keep">메모: {selfNoShow.memo}</div> : null}
                  </>
                ) : null}
                {review.memo ? <div className="break-keep text-zinc-400">관리자 메모: {review.memo}</div> : null}
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <EvidenceRow label="신고자/제출자 증빙" app={reporter} match={match} />
                <EvidenceRow label="상대방 증빙" app={accused} match={match} />
              </div>

              <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-100 pt-3">
                <NoShowActionButton
                  disabled={busyId === `${baseBusy}:confirmed`}
                  tone="bad"
                  onClick={() => onResolveNoShow?.({ match, reporterApplicationId: reporterId, accusedApplicationId: accusedId, status: feedback.meetingResult === "self_no_show" ? "self_no_show_confirmed" : "no_show_confirmed" })}
                >
                  {feedback.meetingResult === "self_no_show" ? "본인 불참 확정" : "노쇼 확정"}
                </NoShowActionButton>
                <NoShowActionButton
                  disabled={busyId === `${baseBusy}:evidence`}
                  tone="warn"
                  onClick={() => onResolveNoShow?.({ match, reporterApplicationId: reporterId, accusedApplicationId: accusedId, status: "evidence_requested" })}
                >
                  추가 확인 필요
                </NoShowActionButton>
                <NoShowActionButton
                  disabled={busyId === `${baseBusy}:dismissed`}
                  tone="light"
                  onClick={() => onResolveNoShow?.({ match, reporterApplicationId: reporterId, accusedApplicationId: accusedId, status: "no_show_dismissed" })}
                >
                  노쇼 아님
                </NoShowActionButton>
                <NoShowActionButton
                  disabled={busyId === `${baseBusy}:rematch`}
                  tone="dark"
                  onClick={() => onResolveNoShow?.({ match, reporterApplicationId: reporterId, accusedApplicationId: accusedId, status: "no_penalty_rematch" })}
                >
                  불이익 없이 재매칭
                </NoShowActionButton>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FeedbackCard({ match, applicationsById, onPrepareNextRound, onResolveNoShow, busyId }) {
  const feedbacks = match.feedbacks || {};
  const list = Object.values(feedbacks).filter(Boolean);
  const summary = match.feedbackSummary || {};
  const finalMeeting = getFinalMeeting(match);
  const placeName = getPlaceName(finalMeeting);
  const timeText = getTimeText(finalMeeting);

  return (
    <div className="border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-zinc-950">{getPairName(match, applicationsById)}</div>
          <div className="mt-1 text-xs font-semibold text-zinc-500">{timeText} · {placeName}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-600">제출 {summary.submittedCount || list.length}/2</span>
          {summary.needsAdminReview || match.feedbackStatus === "issue_reported" ? (
            <span className="bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700">운영자 검토</span>
          ) : null}
          {match.noShowReviewStatus ? (
            <span className="bg-orange-50 px-2 py-1 text-xs font-bold text-orange-700">{getFeedbackLabel(match.noShowReviewStatus)}</span>
          ) : null}
          {Object.values(match.missingArrivalAlerts || {}).some((item) => item?.status === "sent") ? (
            <span className="bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">현장 미도착 호출</span>
          ) : null}
          {summary.mutualInterest || summary.mutualContactConsent ? <span className="bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">상호 연락처 동의</span> : null}
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <EvidenceRow label="남성 현장 기록" app={applicationsById[match.maleApplicationId] || { id: match.maleApplicationId }} match={match} />
        <EvidenceRow label="여성 현장 기록" app={applicationsById[match.femaleApplicationId] || { id: match.femaleApplicationId }} match={match} />
      </div>

      {list.length ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {list.map((feedback) => {
            const app = applicationsById[feedback.applicationId] || { id: feedback.applicationId };
            const noShow = feedback.noShow || {};
            const selfNoShow = feedback.selfNoShow || {};

            return (
              <div key={feedback.applicationId} className="border border-zinc-100 bg-zinc-50 p-3">
                <div className="text-xs font-bold text-zinc-950">{getApplicationName(app)}</div>
                <div className="mt-2 grid gap-1 text-xs font-semibold leading-5 text-zinc-600">
                  <div>실제 만남: <b>{getFeedbackLabel(feedback.meetingResult)}</b></div>
                  {feedback.meetingResult === "met" ? (
                    <>
                      <div>
                        만남 이어가기: <b>{(feedback.contactShareConsent ?? ((feedback.continueMeetingIntent || feedback.meetAgainIntent) === "yes")) ? "희망 · 상호 선택 시 연락처 공개" : "이번 만남으로 마무리"}</b>
                      </div>
                      <div>느낌: <b>{getFeedbackLabel(feedback.meetingMood)}</b></div>
                      {feedback.meetingMood === "uncomfortable" ? (
                        <>
                          <div className="break-keep">
                            불편 사유: <b>{(Array.isArray(feedback.discomfortReasons) ? feedback.discomfortReasons : []).map(getFeedbackLabel).join(", ") || "-"}</b>
                          </div>
                          {feedback.discomfortOtherText ? <div className="break-keep">기타 의견: {feedback.discomfortOtherText}</div> : null}
                        </>
                      ) : null}
                      {feedback.memo ? <div className="break-keep">메모: {feedback.memo}</div> : null}
                    </>
                  ) : null}
                  {feedback.meetingResult === "counterpart_no_show" ? (
                    <>
                      <div>상황: <b>{getFeedbackLabel(noShow.situation)}</b></div>
                      <div>대기: <b>{noShow.waitedMinutes || "-"}분 이상</b></div>
                      {noShow.memo ? <div className="break-keep">상황메모: {noShow.memo}</div> : null}
                    </>
                  ) : null}
                  {feedback.meetingResult === "self_no_show" ? (
                    <>
                      <div>불참사유: <b>{getFeedbackLabel(selfNoShow.reason)}</b></div>
                      {selfNoShow.memo ? <div className="break-keep">사유메모: {selfNoShow.memo}</div> : null}
                    </>
                  ) : null}
                  {hasPenaltyRecord(app) ? <div className="text-orange-700">무응답 기록: <b>{getPenaltySummaryText(app)}</b></div> : null}
                  <div className="text-zinc-400">제출: {feedback.submittedAtClient ? formatDate(feedback.submittedAtClient) : "-"}</div>
                </div>

                {feedback.meetingResult === "met" ? (
                  ["queued", "paused", "user_paused", "contact_connected", "admin_review", "top_up_required"].includes(String(match.nextRoundRequests?.[feedback.applicationId]?.status || "")) ? (
                    <div className="mt-3 border-t border-zinc-200 pt-3 text-xs font-bold text-emerald-700">
                      만남 후 매칭 상태: {getFeedbackLabel(match.nextRoundRequests?.[feedback.applicationId]?.status)}
                    </div>
                  ) : onPrepareNextRound ? (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-200 pt-3">
                      <button
                        type="button"
                        disabled={busyId === `nextRound:${match.id}:${feedback.applicationId}:ready`}
                        onClick={() => onPrepareNextRound({ match, applicationId: feedback.applicationId, mode: "ready" })}
                        className="border border-zinc-950 bg-zinc-950 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                      >
                        매칭 재개
                      </button>
                      <button
                        type="button"
                        disabled={busyId === `nextRound:${match.id}:${feedback.applicationId}:pause`}
                        onClick={() => onPrepareNextRound({ match, applicationId: feedback.applicationId, mode: "pause" })}
                        className="border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 disabled:opacity-50"
                      >
                        매칭 일시정지
                      </button>
                    </div>
                  ) : null
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 bg-zinc-50 p-4 text-center text-xs font-bold text-zinc-400">아직 제출된 피드백이 없습니다.</div>
      )}

      <NoShowReviewPanel match={match} applicationsById={applicationsById} onResolveNoShow={onResolveNoShow} busyId={busyId} />
    </div>
  );
}

function getDeclineReasonData(response = {}, reasonRecord = {}) {
  const reason = response.declineReason || {};
  const code = reasonRecord.reasonCode || reason.code || response.declineReasonCode || "";
  const storedLabel = reasonRecord.reasonLabel || reason.label || response.declineReasonLabel || "";
  const text = reasonRecord.reasonText || reason.text || response.declineReasonText || "";
  const responseOrder = Number(reasonRecord.responseOrder || reason.responseOrder || response.responseOrder || 0);
  const stage = reasonRecord.declineStage || reason.stage || response.declineStage || response.responseStage || "";

  return {
    code,
    label: getTwoWeeksDeclineReasonLabel(code, storedLabel || "기존 데이터·미입력"),
    text,
    responseOrder,
    stage,
  };
}

function getDeclineStageLabel(reason = {}) {
  if (reason.responseOrder === 1 || reason.stage === "first_response") return "1차 응답 거절";
  if (reason.responseOrder === 2 || reason.stage === "second_response") return "2차 응답 거절";
  return "응답 순서 미확인";
}

function DeclineReasonSection({ declinedResponses = [], declineReasons = [], applicationsById = {} }) {
  const reasonByResponseId = Object.fromEntries(
    declineReasons.filter((item) => item?.responseId).map((item) => [item.responseId, item])
  );
  const summary = declinedResponses.reduce((acc, response) => {
    const reason = getDeclineReasonData(response, reasonByResponseId[response.id]);
    const key = reason.code || "legacy_missing";
    const current = acc[key] || { label: reason.label, count: 0 };
    current.count += 1;
    acc[key] = current;
    return acc;
  }, {});
  const summaryRows = Object.entries(summary)
    .map(([code, item]) => ({ code, ...item }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ko"));

  return (
    <Section
      title="제안 거절 사유"
      desc="거절 사유는 운영 개선용으로만 확인합니다. 상대방에게는 상세 사유가 공개되지 않습니다."
    >
      {declinedResponses.length ? (
        <div className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {summaryRows.map((item) => (
              <div key={item.code} className="border border-zinc-200 bg-white p-3">
                <div className="text-xs font-bold text-zinc-500">{item.label}</div>
                <div className="mt-1 text-xl font-bold text-zinc-950">{item.count}건</div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto bg-white">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="bg-zinc-950 text-white">
                <tr>
                  <th className="px-3 py-3">거절 회원</th>
                  <th className="px-3 py-3">상대 회원</th>
                  <th className="px-3 py-3">응답 단계</th>
                  <th className="px-3 py-3">선택 사유</th>
                  <th className="px-3 py-3">기타 작성 내용</th>
                  <th className="px-3 py-3">응답 시각</th>
                </tr>
              </thead>
              <tbody>
                {declinedResponses.map((response) => {
                  const reason = getDeclineReasonData(response, reasonByResponseId[response.id]);
                  const viewer = applicationsById[response.viewerApplicationId] || { id: response.viewerApplicationId };
                  const candidate = applicationsById[response.candidateApplicationId] || { id: response.candidateApplicationId };

                  return (
                    <tr key={response.id} className="border-b border-zinc-100 align-top">
                      <td className="px-3 py-3 font-bold text-zinc-950">{getApplicationName(viewer)}</td>
                      <td className="px-3 py-3 font-semibold text-zinc-700">{getApplicationName(candidate)}</td>
                      <td className="px-3 py-3">
                        <span className="inline-flex bg-orange-50 px-2 py-1 text-xs font-bold text-orange-700">
                          {getDeclineStageLabel(reason)}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-bold text-zinc-800">{reason.label}</td>
                      <td className="max-w-[320px] whitespace-pre-wrap break-words px-3 py-3 text-xs font-semibold leading-5 text-zinc-600">
                        {reason.text || "-"}
                      </td>
                      <td className="px-3 py-3 text-xs font-semibold text-zinc-500">
                        {formatDate(response.respondedAtClient || response.respondedAt || response.updatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 text-center text-sm font-bold text-zinc-400">아직 거절 응답이 없습니다.</div>
      )}
    </Section>
  );
}

export default function ResultsTab({ applications, responses, declineReasons = [], matches = [], onPrepareNextRound, onResolveNoShow, busyId }) {
  const confirmed = applications.filter((item) => item.matchingStatus === "confirmed" || item.matchingStatus === "completed");
  const accepted = responses.filter((item) => item.response === "accepted");
  const declined = responses.filter((item) => item.response === "declined");
  const applicationsById = Object.fromEntries(applications.map((item) => [item.id, item]));
  const feedbackMatches = matches
    .filter((match) => match.feedbackStatus || match.feedbacks || match.reminders?.feedbackRequestSentAtClient || match.noShowReviewStatus || match.missingArrivalAlerts)
    .sort((a, b) => String(b.feedbackSummary?.lastSubmittedAtClient || b.updatedAtClient || "").localeCompare(String(a.feedbackSummary?.lastSubmittedAtClient || a.updatedAtClient || "")));
  const issueFeedbackCount = feedbackMatches.filter((match) => match.feedbackStatus === "issue_reported" || match.feedbackSummary?.needsAdminReview).length;
  const penaltyApplications = applications
    .filter(hasPenaltyRecord)
    .sort((a, b) => {
      const reviewDiff = Number(getNoResponseReviewState(b).isCurrentAdminReview) - Number(getNoResponseReviewState(a).isCurrentAdminReview);
      return reviewDiff || getPenaltyStats(b).totalNoResponseCount - getPenaltyStats(a).totalNoResponseCount;
    });
  const totalPenaltyCount = penaltyApplications.reduce((sum, item) => sum + getPenaltyStats(item).totalNoResponseCount, 0);
  const adminReviewPenaltyCount = penaltyApplications.filter((item) => getNoResponseReviewState(item).isCurrentAdminReview).length;
  const otherPauseCount = applications.filter((item) => {
    const state = getNoResponseReviewState(item);
    return state.isCurrentlyPaused && !state.isCurrentAdminReview;
  }).length;

  return (
    <div className="grid gap-4">
      <Section title="결과 요약" desc="응답/확정/완료 데이터를 확인합니다.">
        <div className="grid gap-3 md:grid-cols-6">
          <StatCard label="수락 응답" value={accepted.length} />
          <StatCard label="패스 응답" value={declined.length} />
          <StatCard label="확정/완료" value={confirmed.length} />
          <StatCard label="검토 필요 피드백" value={issueFeedbackCount} />
          <StatCard label="무응답 회원" value={penaltyApplications.length} />
          <StatCard label="무응답 누적" value={totalPenaltyCount} sub={`현재 검토 ${adminReviewPenaltyCount}명 · 기타 정지 ${otherPauseCount}명`} />
        </div>
      </Section>

      <DeclineReasonSection
        declinedResponses={declined}
        declineReasons={declineReasons}
        applicationsById={applicationsById}
      />

      <Section title="무응답 검토함 · 과거 이력" desc="현재 복귀 판단이 필요한 회원을 위에 우선 표시합니다. 해제된 과거 이력은 참고용이며 복귀 조치 대상이 아닙니다.">
        {penaltyApplications.length ? (
          <div className="overflow-x-auto bg-white">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead className="bg-zinc-950 text-white">
                <tr>
                  <th className="px-3 py-3">회원</th>
                  <th className="px-3 py-3">현재 판정</th>
                  <th className="px-3 py-3">총 무응답</th>
                  <th className="px-3 py-3">제안</th>
                  <th className="px-3 py-3">일정</th>
                  <th className="px-3 py-3">마지막 사유</th>
                  <th className="px-3 py-3">마지막 기록</th>
                  <th className="px-3 py-3">정지 원인 / 상태</th>
                </tr>
              </thead>
              <tbody>
                {penaltyApplications.map((app) => {
                  const stats = getPenaltyStats(app);
                  const state = getNoResponseReviewState(app);

                  return (
                    <tr key={app.id} className={`border-b border-zinc-100 ${state.isCurrentAdminReview ? "bg-orange-50" : "bg-white"}`}>
                      <td className="px-3 py-3 font-bold">{getApplicationName(app)}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-black ${state.isCurrentAdminReview ? "bg-orange-600 text-white" : state.isCurrentlyPaused ? "bg-rose-100 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                          {state.isCurrentAdminReview ? "복귀 판단 필요" : state.isCurrentlyPaused ? "다른 사유 정지" : "과거 이력"}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-bold text-orange-700">{stats.totalNoResponseCount}</td>
                      <td className="px-3 py-3">{stats.proposalNoResponseCount}</td>
                      <td className="px-3 py-3">{stats.scheduleNoResponseCount}</td>
                      <td className="px-3 py-3">{getPenaltyReasonLabel(stats.lastPenaltyReason)}</td>
                      <td className="px-3 py-3">{stats.lastPenaltyAtClient ? formatDate(stats.lastPenaltyAtClient) : "-"}</td>
                      <td className="px-3 py-3">
                        <div className="grid gap-1 text-xs font-bold text-zinc-600">
                          <span className="max-w-[240px] break-keep text-zinc-800">{getMatchingPauseReasonLabel(app)}</span>
                          <span>{getStatusLabel(app.matchingStatus || "-")}</span>
                          <span className="text-zinc-400">{getStatusLabel(app.nextRoundStatus || "-")}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white p-8 text-center text-sm font-bold text-zinc-400">무응답/기한초과 기록이 없습니다.</div>
        )}
      </Section>

      <Section title="만남 후 피드백 · 노쇼 검토" desc="고객이 제출한 피드백, 현장 증빙, 노쇼/불참 검토 대상을 한눈에 확인합니다.">
        {feedbackMatches.length ? (
          <div className="grid gap-3">
            {feedbackMatches.map((match) => (
              <FeedbackCard
                key={match.id}
                match={match}
                applicationsById={applicationsById}
                onPrepareNextRound={onPrepareNextRound}
                onResolveNoShow={onResolveNoShow}
                busyId={busyId}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 text-center text-sm font-bold text-zinc-400">아직 피드백 요청 또는 제출 내역이 없습니다.</div>
        )}
      </Section>

      <Section title="응답 원본" desc="제안 응답 원본 데이터를 최근순으로 확인합니다.">
        <div className="overflow-x-auto bg-white">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-zinc-950 text-white">
              <tr>
                <th className="px-3 py-3">응답자</th>
                <th className="px-3 py-3">상대</th>
                <th className="px-3 py-3">응답</th>
                <th className="px-3 py-3">사유</th>
                <th className="px-3 py-3">응답일</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((item) => (
                <tr key={item.id} className="border-b border-zinc-100">
                  <td className="px-3 py-3 font-bold">{getApplicationName(applicationsById[item.viewerApplicationId] || { id: item.viewerApplicationId })}</td>
                  <td className="px-3 py-3">{getApplicationName(applicationsById[item.candidateApplicationId] || { id: item.candidateApplicationId })}</td>
                  <td className="px-3 py-3">{item.response || "-"}</td>
                  <td className="px-3 py-3">{item.reason || "-"}</td>
                  <td className="px-3 py-3">{formatDate(item.respondedAtClient || item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
