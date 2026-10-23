const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { assertApplicationOwner, isAdminUid } = require("./twoWeeksCallerAuth");
const { getMatchSchedulePolicy, getScheduleStageDueMs, addHoursClient, toMillis } = require("./twoWeeksSchedulePolicy");

const TERMINAL = new Set(["declined", "failed", "expired", "proposal_expired", "schedule_expired", "counterpart_expired", "cancelled", "canceled", "completed", "withdrawn"]);
const placeId = (value = {}) => String(value.cafeId || value.placeId || value.id || "").trim();

function buildScheduleOpeningPatch(match = {}, now = new Date().toISOString()) {
  const schedule = match.schedule || {};
  const openedAt = schedule.serverPolicyInitializedAt || schedule.openedAt || admin.firestore.FieldValue.serverTimestamp();
  const openedAtClient = schedule.serverPolicyInitializedAtClient || schedule.openedAtClient || now;
  return {
    status: "mutualAccepted",
    scheduleStatus: "ready",
    schedulePolicy: getMatchSchedulePolicy(match),
    mutualAcceptedAt: match.mutualAcceptedAt || admin.firestore.FieldValue.serverTimestamp(),
    mutualAcceptedAtClient: match.mutualAcceptedAtClient || now,
    schedule: {
      ...schedule, status: "ready", dueHours: 24, totalDueHours: 48,
      dueAtClient: schedule.dueAtClient || addHoursClient(24, openedAtClient),
      openedAt: schedule.openedAt || openedAt,
      openedAtClient: schedule.openedAtClient || openedAtClient,
      serverPolicyInitializedAt: openedAt,
      serverPolicyInitializedAtClient: openedAtClient,
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

function assertLiveMatch(match) {
  if ([match.status, match.proposalStatus, match.scheduleStatus, match.schedule?.status].some((value) => TERMINAL.has(value))) {
    throw new HttpsError("failed-precondition", "이미 종료된 소개입니다. 신청현황을 다시 확인해주세요.");
  }
}

function canonicalPlace(snapshot) {
  const data = snapshot.exists ? snapshot.data() : null;
  if (!data || data.status !== "active" || !data.name || !data.area) {
    throw new HttpsError("failed-precondition", "선택한 장소가 현재 이용 가능하지 않습니다. 장소 목록을 다시 확인해주세요.");
  }
  return {
    id: snapshot.id, placeId: snapshot.id, cafeId: snapshot.id,
    area: data.area, cafeName: data.name, cafeStation: data.station || "",
    cafeRatingLabel: data.ratingLabel || "", cafeReason: data.reason || "",
    cafeMapQuery: data.mapQuery || "", cafeMapUrl: data.mapUrl || "", address: data.address || "",
  };
}

async function recordTwoWeeksSchedule(request, db = admin.firestore()) {
  const input = request.data || {};
  const mode = String(input.mode || "");
  const matchId = String(input.matchId || "").trim();
  const viewerId = String(input.viewerApplicationId || "").trim();
  const candidateId = String(input.candidateApplicationId || "").trim();
  const adminMode = mode === "admin_confirm";
  if (!matchId || !["first", "final", "admin_confirm"].includes(mode)) {
    throw new HttpsError("invalid-argument", "일정 선택 정보를 확인해주세요.");
  }
  if (adminMode) {
    if (!request.auth?.uid || !await isAdminUid(request.auth.uid)) {
      throw new HttpsError("permission-denied", "관리자만 일정을 확정할 수 있습니다.");
    }
  } else {
    if (!viewerId || !candidateId || viewerId === candidateId) throw new HttpsError("invalid-argument", "매칭 참여자 정보를 확인해주세요.");
    await assertApplicationOwner(request, viewerId, { allowAdmin: false });
  }
  const matchRef = db.collection("twoweeksMatches").doc(matchId);
  return db.runTransaction(async (tx) => {
    const matchSnap = await tx.get(matchRef);
    if (!matchSnap.exists) throw new HttpsError("not-found", "매칭 정보를 찾을 수 없습니다.");
    const match = matchSnap.data();
    assertLiveMatch(match);
    const ids = [match.maleApplicationId, match.femaleApplicationId];
    if (!ids[0] || !ids[1] || ids[0] === ids[1] || (!adminMode && (!ids.includes(viewerId) || !ids.includes(candidateId)))) {
      throw new HttpsError("permission-denied", "해당 매칭의 참여자가 아닙니다.");
    }
    const refs = ids.map((id) => db.collection("twoweeksApplications").doc(id));
    const responseRefs = ids.map((id, index) => db.collection("twoweeksProposalResponses").doc(`${id}_${ids[1 - index]}`));
    const snapshots = await Promise.all([...refs, ...responseRefs].map((ref) => tx.get(ref)));
    const apps = snapshots.slice(0, 2);
    if (apps.some((snap) => !snap.exists || snap.data().status === "withdrawn" || snap.data().reviewStatus !== "approved" || snap.data().withdrawal?.status === "completed" || snap.data().currentProposal?.matchId !== matchId)) {
      throw new HttpsError("failed-precondition", "현재 진행 중인 소개가 아닙니다. 신청현황을 다시 확인해주세요.");
    }
    if (snapshots.slice(2).some((snap) => !snap.exists || snap.data().response !== "accepted" || snap.data().matchId !== matchId)) {
      throw new HttpsError("failed-precondition", "양쪽 모두 소개를 수락한 뒤 일정조율을 진행해주세요.");
    }
    const schedule = match.schedule || {};
    const status = match.scheduleStatus || schedule.status || "";
    const policy = getMatchSchedulePolicy(match);
    const nowMs = Date.now();
    const now = new Date(nowMs).toISOString();
    const timeIds = mode === "first" ? input.timeIds : [adminMode ? schedule.finalTimeChoice?.id : input.timeId];
    const cafeIds = mode === "first" ? input.placeIds : [adminMode ? placeId(schedule.finalPlaceChoice) : input.placeId];
    const count = mode === "first" ? 3 : 1;
    if (!Array.isArray(timeIds) || !Array.isArray(cafeIds) || timeIds.length !== count || cafeIds.length !== count ||
        new Set(timeIds).size !== count || new Set(cafeIds).size !== count ||
        [...timeIds, ...cafeIds].some((id) => typeof id !== "string" || !id || id.includes("/"))) {
      throw new HttpsError("invalid-argument", count === 3 ? "서로 다른 일시 후보 3개와 장소 후보 3개를 선택해주세요." : "확정할 일시와 장소를 선택해주세요.");
    }
    const times = timeIds.map((id) => policy.timeOptions.find((option) => option.id === id));
    if (times.some((time) => !time || toMillis(time.startAtClient) <= nowMs)) {
      throw new HttpsError("invalid-argument", "현재 허용된 다음 주말 일시 중에서 선택해주세요.");
    }
    if (!adminMode && mode === "final" && status === "confirmed") {
      if (schedule.finalTimeChoice?.id === timeIds[0] && placeId(schedule.finalPlaceChoice) === cafeIds[0] && schedule.finalChoice?.selectedByApplicationId === viewerId) {
        return { ok: true, matchId, alreadySubmitted: true, finalMeeting: match.finalMeeting, choice: schedule.finalChoice, timeChoice: schedule.finalTimeChoice, placeChoice: schedule.finalPlaceChoice };
      }
      throw new HttpsError("already-exists", "이미 확정된 일정입니다. 신청현황을 다시 확인해주세요.");
    }
    if (mode === "first" && ["waiting_counterpart", "needs_final_choice"].includes(status)) {
      const sameIds = (values, requested, getId) => values?.length === requested.length && requested.every((id) => values.some((value) => getId(value) === id));
      if (schedule.firstSelectorApplicationId === viewerId && sameIds(schedule.timeChoices, timeIds, (item) => item.id) && sameIds(schedule.placeChoices, cafeIds, placeId)) {
        return { ok: true, matchId, alreadySubmitted: true, timeChoices: schedule.timeChoices, placeChoices: schedule.placeChoices };
      }
      throw new HttpsError("already-exists", "이미 일정 후보가 제출됐습니다. 상대가 제안한 후보를 확인해주세요.");
    }
    if (!adminMode) {
      const due = getScheduleStageDueMs(match) || (toMillis(match.mutualAcceptedAt) + 24 * 60 * 60 * 1000);
      if (!due || nowMs >= due) throw new HttpsError("deadline-exceeded", "일정 선택 기한이 지났습니다. 신청현황을 확인해주세요.");
    }
    if (mode === "first" && !["ready", "needs_first_choice"].includes(status)) {
      throw new HttpsError("failed-precondition", "현재는 일정 후보를 제출할 수 없습니다.");
    }
    if (mode === "final" && (!["waiting_counterpart", "needs_final_choice"].includes(status) || schedule.firstSelectorApplicationId !== candidateId)) {
      throw new HttpsError("failed-precondition", "상대방이 제출한 후보에서 최종 일정을 선택해주세요.");
    }
    if (mode !== "first" && (!schedule.timeChoices?.some((time) => time.id === timeIds[0]) || !schedule.placeChoices?.some((place) => placeId(place) === cafeIds[0]))) {
      throw new HttpsError("invalid-argument", "상대방이 제안한 일시와 장소 중에서 선택해주세요.");
    }
    const cafeSnaps = await Promise.all(cafeIds.map((id) => tx.get(db.collection("twoweeksCafeCandidates").doc(id))));
    const places = cafeSnaps.map(canonicalPlace);
    const field = admin.firestore.FieldValue;
    if (mode === "first") {
      const nextSchedule = {
        ...schedule, status: "waiting_counterpart", firstSelectorApplicationId: viewerId, counterpartApplicationId: candidateId,
        timeChoices: times, placeChoices: places, firstChoices: times,
        firstSelectedAt: field.serverTimestamp(), firstSelectedAtClient: now,
        counterpartDueHours: 24, counterpartDueDays: 1, counterpartDueAtClient: addHoursClient(24, now),
      };
      tx.update(matchRef, { status: "mutualAccepted", scheduleStatus: "waiting_counterpart", schedule: nextSchedule, updatedAt: field.serverTimestamp() });
      return { ok: true, matchId, timeChoices: times, placeChoices: places, alreadySubmitted: false };
    }
    const timeChoice = times[0];
    const placeChoice = places[0];
    const selectedBy = adminMode ? schedule.finalChoice?.selectedByApplicationId || "" : viewerId;
    const choice = { ...timeChoice, ...placeChoice, timeChoice, placeChoice, selectedByApplicationId: selectedBy, selectedAtClient: now };
    // 장소 ID와 일시 ID는 각각 placeChoice/timeChoice에 보존합니다.
    const finalMeeting = {
      ...choice, finalTimeChoice: timeChoice, finalPlaceChoice: placeChoice,
      placeName: placeChoice.cafeName, address: placeChoice.address, mapUrl: placeChoice.cafeMapUrl,
      memo: "카페에서 60분 정도 가볍게 대화해주세요.", paymentNote: "음료 등 개인 주문 비용은 각자 부담입니다.",
      meetingGuide: "만남 전 한마디에 복장이나 기다리는 위치를 남겨두면 서로를 찾기 쉽습니다.",
      confirmedAtClient: now, confirmedBy: adminMode ? "admin" : "auto",
      ...(adminMode ? { confirmedByUid: request.auth.uid } : {}),
    };
    if (adminMode) {
      for (const key of ["placeName", "address", "mapUrl", "memo"]) {
        if (typeof input.place?.[key] === "string" && input.place[key].trim()) finalMeeting[key] = input.place[key].trim().slice(0, 1000);
      }
    }
    tx.update(matchRef, {
      status: "confirmed", scheduleStatus: "confirmed", photoRevealStatus: "revealed", finalMeeting,
      schedule: { ...schedule, status: "confirmed", finalTimeChoice: timeChoice, finalPlaceChoice: placeChoice, finalChoice: choice, selectedChoice: choice, finalMeeting,
        finalSelectedAt: field.serverTimestamp(), finalSelectedAtClient: now, confirmedAt: field.serverTimestamp(), confirmedAtClient: now, confirmedBy: finalMeeting.confirmedBy },
      updatedAt: field.serverTimestamp(),
    });
    for (const ref of refs) tx.update(ref, {
      matchingStatus: "confirmed", photoRevealStatus: "revealed", "currentProposal.photoRevealStatus": "revealed",
      "schedule.status": "confirmed", "schedule.finalMeeting": finalMeeting,
      "schedule.confirmedAt": field.serverTimestamp(), "schedule.confirmedAtClient": now, updatedAt: field.serverTimestamp(),
    });
    return { ok: true, matchId, finalMeeting, choice, timeChoice, placeChoice, alreadySubmitted: false };
  });
}

const submitTwoWeeksSchedule = onCall({ region: "asia-northeast3" }, (request) => recordTwoWeeksSchedule(request));
module.exports = { submitTwoWeeksSchedule, recordTwoWeeksSchedule, buildScheduleOpeningPatch, assertLiveMatch };
