import { Section, StatCard } from "./AdminCommon";
import {
  formatDate,
  getApplicationName,
  getPenaltyReasonLabel,
  getPenaltyStats,
  getPenaltySummaryText,
  hasPenaltyRecord,
} from "./utils";

function getFeedbackLabel(value = "") {
  const labels = {
    met: "만남 진행",
    counterpart_no_show: "상대 노쇼",
    self_no_show: "본인 불참",
    yes: "다시 만나고 싶음",
    maybe: "고민",
    no: "재만남 의향 낮음",
    good: "좋았음",
    neutral: "무난",
    disappointing: "아쉬움",
    uncomfortable: "불편",
    no_contact_absent: "연락 없이 미참석",
    late_too_long: "지각으로 불발",
    could_not_find: "장소에서 못 찾음",
    other: "기타",
    urgent_schedule: "급한 일정",
    health: "건강 사유",
    mistake: "시간/장소 착각",
    changed_mind: "단순 변심",
    join_next_round: "다음 회차 참여 희망",
    pause_one_round: "한 회차 쉬기",
    wait_admin_review: "운영자 안내 후 결정",
    requested: "다음 회차 요청",
    paused: "휴식 요청",
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
  const note = match.preMeetingNotes?.[app?.id] || {};
  const proof = match.meetingProofs?.[app?.id] || {};

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3">
      <div className="text-xs font-bold text-zinc-400">{label}</div>
      <div className="mt-1 text-sm font-bold text-zinc-950">{getApplicationName(app)}</div>
      <div className="mt-3 grid gap-2 text-xs font-semibold leading-5 text-zinc-600">
        <div>참석확인: <b>{attendance.status === "attending" ? "완료" : "없음"}</b> {attendance.updatedAtClient ? `· ${formatDate(attendance.updatedAtClient)}` : ""}</div>
        <div>도착확인: <b>{arrival.status === "arrived" ? "완료" : "없음"}</b> {arrival.arrivedAtClient ? `· ${formatDate(arrival.arrivedAtClient)}` : ""}</div>
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
          {summary.mutualInterest ? <span className="bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">상호 긍정</span> : null}
          {summary.nextRoundReady ? <span className="bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">다음 회차 가능</span> : null}
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
                      <div>재만남: <b>{getFeedbackLabel(feedback.meetAgainIntent)}</b></div>
                      <div>느낌: <b>{getFeedbackLabel(feedback.meetingMood)}</b></div>
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
                  <div>다음회차: <b>{getFeedbackLabel(feedback.nextRoundPreference)}</b></div>
                  {hasPenaltyRecord(app) ? <div className="text-orange-700">무응답 기록: <b>{getPenaltySummaryText(app)}</b></div> : null}
                  <div className="text-zinc-400">제출: {feedback.submittedAtClient ? formatDate(feedback.submittedAtClient) : "-"}</div>
                </div>

                {onPrepareNextRound && feedback.meetingResult === "met" ? (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-200 pt-3">
                    <button
                      type="button"
                      disabled={busyId === `nextRound:${match.id}:${feedback.applicationId}:ready`}
                      onClick={() => onPrepareNextRound({ match, applicationId: feedback.applicationId, mode: "ready" })}
                      className="border border-zinc-950 bg-zinc-950 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                    >
                      다음 회차 투입
                    </button>
                    <button
                      type="button"
                      disabled={busyId === `nextRound:${match.id}:${feedback.applicationId}:pause`}
                      onClick={() => onPrepareNextRound({ match, applicationId: feedback.applicationId, mode: "pause" })}
                      className="border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 disabled:opacity-50"
                    >
                      한 회차 쉬기
                    </button>
                  </div>
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

export default function ResultsTab({ applications, responses, matches = [], onPrepareNextRound, onResolveNoShow, busyId }) {
  const confirmed = applications.filter((item) => item.matchingStatus === "confirmed" || item.matchingStatus === "completed");
  const accepted = responses.filter((item) => item.response === "accepted");
  const declined = responses.filter((item) => item.response === "declined");
  const applicationsById = Object.fromEntries(applications.map((item) => [item.id, item]));
  const feedbackMatches = matches
    .filter((match) => match.feedbackStatus || match.feedbacks || match.reminders?.feedbackRequestSentAtClient || match.noShowReviewStatus)
    .sort((a, b) => String(b.feedbackSummary?.lastSubmittedAtClient || b.updatedAtClient || "").localeCompare(String(a.feedbackSummary?.lastSubmittedAtClient || a.updatedAtClient || "")));
  const issueFeedbackCount = feedbackMatches.filter((match) => match.feedbackStatus === "issue_reported" || match.feedbackSummary?.needsAdminReview).length;
  const penaltyApplications = applications
    .filter(hasPenaltyRecord)
    .sort((a, b) => getPenaltyStats(b).totalNoResponseCount - getPenaltyStats(a).totalNoResponseCount);
  const totalPenaltyCount = penaltyApplications.reduce((sum, item) => sum + getPenaltyStats(item).totalNoResponseCount, 0);
  const adminReviewPenaltyCount = penaltyApplications.filter((item) => item.nextRoundStatus === "admin_review" || item.matchingStatus === "paused").length;

  return (
    <div className="grid gap-4">
      <Section title="결과 요약" desc="응답/확정/완료 데이터를 확인합니다.">
        <div className="grid gap-3 md:grid-cols-6">
          <StatCard label="수락 응답" value={accepted.length} />
          <StatCard label="패스 응답" value={declined.length} />
          <StatCard label="확정/완료" value={confirmed.length} />
          <StatCard label="검토 필요 피드백" value={issueFeedbackCount} />
          <StatCard label="무응답 회원" value={penaltyApplications.length} />
          <StatCard label="무응답 누적" value={totalPenaltyCount} sub={`검토 ${adminReviewPenaltyCount}명`} />
        </div>
      </Section>

      <Section title="무응답/기한초과 기록" desc="제안 응답 또는 일정조율 기한을 넘긴 회원입니다. 관리자 검토 후 매칭풀 복귀 여부를 판단하세요.">
        {penaltyApplications.length ? (
          <div className="overflow-x-auto bg-white">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead className="bg-zinc-950 text-white">
                <tr>
                  <th className="px-3 py-3">회원</th>
                  <th className="px-3 py-3">총 무응답</th>
                  <th className="px-3 py-3">제안</th>
                  <th className="px-3 py-3">일정</th>
                  <th className="px-3 py-3">마지막 사유</th>
                  <th className="px-3 py-3">마지막 기록</th>
                  <th className="px-3 py-3">현재 상태</th>
                </tr>
              </thead>
              <tbody>
                {penaltyApplications.map((app) => {
                  const stats = getPenaltyStats(app);

                  return (
                    <tr key={app.id} className="border-b border-zinc-100">
                      <td className="px-3 py-3 font-bold">{getApplicationName(app)}</td>
                      <td className="px-3 py-3 font-bold text-orange-700">{stats.totalNoResponseCount}</td>
                      <td className="px-3 py-3">{stats.proposalNoResponseCount}</td>
                      <td className="px-3 py-3">{stats.scheduleNoResponseCount}</td>
                      <td className="px-3 py-3">{getPenaltyReasonLabel(stats.lastPenaltyReason)}</td>
                      <td className="px-3 py-3">{stats.lastPenaltyAtClient ? formatDate(stats.lastPenaltyAtClient) : "-"}</td>
                      <td className="px-3 py-3">
                        <div className="grid gap-1 text-xs font-bold text-zinc-600">
                          <span>{app.matchingStatus || "-"}</span>
                          <span className="text-zinc-400">{app.nextRoundStatus || "-"}</span>
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
