const FINAL_RESPONSES = new Set(["accepted", "declined"]);

const TERMINAL_MATCH_STATUSES = new Set([
  "declined",
  "cancelled",
  "canceled",
  "expired",
  "proposal_expired",
  "schedule_expired",
  "counterpart_expired",
  "failed",
]);

const TERMINAL_SCHEDULE_STATUSES = new Set([
  "cancelled",
  "canceled",
  "expired",
  "proposal_expired",
  "schedule_expired",
  "counterpart_expired",
  "failed",
]);

export const SCHEDULE_OPEN_STATUSES = [
  "ready",
  "needs_first_choice",
  "waiting_counterpart",
  "needs_final_choice",
  "place_pending",
  "confirmed",
];

function clean(value) {
  return String(value || "").trim();
}

function finalResponse(...values) {
  return values.map(clean).find((value) => FINAL_RESPONSES.has(value)) || "";
}

function getSchedule(bestMatch = {}) {
  return bestMatch?.match?.schedule || bestMatch?.schedule || {};
}

function hasScheduleProgress(schedule = {}, finalMeeting = null) {
  return Boolean(
    schedule?.firstSelectorApplicationId ||
      schedule?.counterpartApplicationId ||
      (Array.isArray(schedule?.timeChoices) && schedule.timeChoices.length) ||
      (Array.isArray(schedule?.placeChoices) && schedule.placeChoices.length) ||
      (Array.isArray(schedule?.firstChoices) && schedule.firstChoices.length) ||
      schedule?.finalChoice ||
      schedule?.selectedChoice ||
      schedule?.finalMeeting ||
      finalMeeting
  );
}

export function areProposalResponsesMutuallyAccepted(viewerResponse = null, counterpartResponse = null) {
  return clean(viewerResponse?.response || viewerResponse) === "accepted" &&
    clean(counterpartResponse?.response || counterpartResponse) === "accepted";
}

export function isTerminalProposalStatus(value = "") {
  const status = clean(value);
  return TERMINAL_MATCH_STATUSES.has(status) || TERMINAL_SCHEDULE_STATUSES.has(status);
}

/**
 * 모든 고객 탭이 같은 우선순위로 제안 상태를 해석하도록 만든 단일 판정 함수다.
 * 거절/취소/만료는 응답 대기나 일정 진행보다 항상 우선한다.
 */
export function getProposalLifecycleState({
  application = {},
  bestMatch = {},
  responseStatus = "",
} = {}) {
  const match = bestMatch?.match || {};
  const schedule = getSchedule(bestMatch);
  const proposal = application?.currentProposal || {};
  const viewerApplicationId = clean(application?.id);
  const matchId = clean(match?.id || bestMatch?.matchId);
  const proposalMatchId = clean(proposal?.matchId);
  const proposalAppliesToMatch = !matchId || !proposalMatchId || matchId === proposalMatchId;

  const matchStatus = clean(match?.status || bestMatch?.status);
  const proposalStatus = clean(match?.proposalStatus);
  const scheduleStatus = clean(
    match?.scheduleStatus ||
      match?.schedule?.status ||
      bestMatch?.schedule?.status ||
      (proposalAppliesToMatch ? application?.scheduleStatus || application?.schedule?.status : "")
  );

  const viewerResponse = finalResponse(
    responseStatus,
    bestMatch?.viewerResponse?.response,
    proposalAppliesToMatch ? proposal?.response : "",
    proposalAppliesToMatch ? proposal?.status : ""
  );
  const counterpartResponse = finalResponse(
    bestMatch?.counterpartResponse?.response,
    proposalAppliesToMatch ? proposal?.counterpartResponse : "",
    proposalAppliesToMatch ? proposal?.partnerResponse : ""
  );

  const declinedByApplicationId = clean(
    match?.declinedByApplicationId || match?.decline?.declinedByApplicationId
  );
  const endedByCounterpart = Boolean(
    proposalAppliesToMatch &&
      (proposal?.endedByCounterpart === true || proposal?.outcome === "counterpart_declined")
  );
  const viewerDeclined = Boolean(
    viewerResponse === "declined" ||
      (declinedByApplicationId && viewerApplicationId && declinedByApplicationId === viewerApplicationId) ||
      (proposalAppliesToMatch && proposal?.outcome === "self_declined")
  );
  const counterpartDeclined = Boolean(
    counterpartResponse === "declined" ||
      endedByCounterpart ||
      (declinedByApplicationId && viewerApplicationId && declinedByApplicationId !== viewerApplicationId)
  );
  const applicationDeclined = Boolean(
    proposalAppliesToMatch &&
      clean(application?.matchingStatus) === "declined" &&
      (proposalMatchId || bestMatch?.candidate)
  );
  const declined = Boolean(
    viewerDeclined ||
      counterpartDeclined ||
      matchStatus === "declined" ||
      proposalStatus === "declined" ||
      applicationDeclined
  );

  const cancelled =
    [matchStatus, proposalStatus, scheduleStatus].some((value) => ["cancelled", "canceled"].includes(value));
  const expired = [matchStatus, proposalStatus, scheduleStatus].some((value) =>
    ["expired", "proposal_expired", "schedule_expired", "counterpart_expired"].includes(value)
  );
  const failed = matchStatus === "failed" || proposalStatus === "failed" || scheduleStatus === "failed";
  const terminal = declined || cancelled || expired || failed;

  const finalMeeting = bestMatch?.finalMeeting || match?.finalMeeting || schedule?.finalMeeting || null;
  const scheduleProgressed = hasScheduleProgress(schedule, finalMeeting);
  const confirmedLike = Boolean(
    matchStatus === "confirmed" ||
      matchStatus === "completed" ||
      scheduleStatus === "confirmed" ||
      finalMeeting ||
      match?.photoRevealStatus === "revealed"
  );
  const bothAccepted = Boolean(
    !terminal &&
      (areProposalResponsesMutuallyAccepted(viewerResponse, counterpartResponse) ||
        matchStatus === "mutualAccepted" ||
        confirmedLike)
  );
  const mutualAcceptedLike = bothAccepted || scheduleProgressed || confirmedLike;
  const scheduleOpen = Boolean(
    !terminal &&
      (confirmedLike || (SCHEDULE_OPEN_STATUSES.includes(scheduleStatus) && mutualAcceptedLike))
  );

  let terminalReason = "";
  if (declined) terminalReason = "declined";
  else if (cancelled) terminalReason = "cancelled";
  else if (expired) terminalReason = "expired";
  else if (failed) terminalReason = "failed";

  return {
    matchId,
    matchStatus,
    proposalStatus,
    scheduleStatus,
    viewerResponse,
    counterpartResponse,
    declinedByApplicationId,
    viewerDeclined,
    counterpartDeclined,
    bothDeclined: viewerDeclined && counterpartDeclined,
    declined,
    cancelled,
    expired,
    failed,
    terminal,
    terminalReason,
    bothAccepted,
    scheduleProgressed,
    scheduleOpen,
    waitingForCounterpart:
      !terminal && viewerResponse === "accepted" && counterpartResponse !== "accepted" && !scheduleOpen,
    canRespond: !terminal && !FINAL_RESPONSES.has(viewerResponse),
  };
}
