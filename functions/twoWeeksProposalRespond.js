// 제안 응답과 신청서 상태를 하나의 서버 트랜잭션으로 반영합니다.
// 클라이언트가 보호된 matchingStatus/currentProposal 필드를 직접 변경하지 않습니다.
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { assertApplicationOwner } = require("./twoWeeksCallerAuth");
const { getProposalResponseDueMs, toMillis } = require("./twoWeeksSchedulePolicy");

if (!admin.apps.length) admin.initializeApp();

const TERMINAL = new Set([
  "declined", "failed", "expired", "proposal_expired", "schedule_expired",
  "counterpart_expired", "cancelled", "canceled", "completed", "withdrawn",
]);
const DECLINE_CODES = new Set([
  "photo_attraction", "basic_conditions", "values_direction",
  "lifestyle_profile", "personal_timing", "other",
]);

function validateDecline(input) {
  const code = String(input?.code || "").trim();
  const detail = String(input?.text || "").trim();
  if (!DECLINE_CODES.has(code) || (code === "other" && !detail)) {
    throw new HttpsError("invalid-argument", "거절 사유를 확인해주세요.");
  }
  return { code, text: code === "other" ? detail.slice(0, 300) : "" };
}

function pairInMatch(match, viewerId, candidateId) {
  return (match.maleApplicationId === viewerId && match.femaleApplicationId === candidateId) ||
    (match.femaleApplicationId === viewerId && match.maleApplicationId === candidateId);
}

function buildResponsePayload({ viewer, counterpart, matchId, response, order, now, due, reason }) {
  const stage = order === 2 ? "second_response" : "first_response";
  return {
    roundId: viewer.roundId || "",
    matchId,
    viewerApplicationId: viewer.id,
    candidateApplicationId: counterpart.id,
    viewerUid: viewer.uid || "",
    candidateUid: counterpart.uid || "",
    viewerGender: viewer.basic?.gender || "",
    candidateGender: counterpart.basic?.gender || "",
    response,
    status: response,
    responseOrder: order,
    responseStage: stage,
    responseDueDays: 2,
    responseDueAtClient: due ? new Date(due).toISOString() : "",
    respondedAt: admin.firestore.FieldValue.serverTimestamp(),
    respondedAtClient: now,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    policySnapshot: {
      proposalResponseDueDays: 2,
      scheduleSelectionDueDays: 2,
      contactOpenAfterMutualConnection: true,
      proposalStageContactPrivate: true,
      photoBlurredAtProposalStage: false,
      photoRevealAfterScheduleConfirmed: false,
      declineReasonPrivateToAdmin: true,
    },
    ...(reason ? { declineReasonSubmitted: true, declineStage: stage } : {}),
  };
}

async function recordTwoWeeksProposalResponse(request, db = admin.firestore()) {
  const payload = request.data || {};
  const viewerApplicationId = String(payload.viewerApplicationId || "").trim();
  const candidateApplicationId = String(payload.candidateApplicationId || "").trim();
  const matchId = String(payload.matchId || "").trim();
  const response = String(payload.response || "").trim();
  if (!viewerApplicationId || !candidateApplicationId || viewerApplicationId === candidateApplicationId ||
      !matchId || !["accepted", "declined"].includes(response)) {
    throw new HttpsError("invalid-argument", "매칭 응답 정보가 올바르지 않습니다.");
  }
  const reason = response === "declined" ? validateDecline(payload.declineReason) : null;
  await assertApplicationOwner(request, viewerApplicationId, { allowAdmin: false });

  const matchRef = db.collection("twoweeksMatches").doc(matchId);
  const viewerRef = db.collection("twoweeksApplications").doc(viewerApplicationId);
  const counterpartRef = db.collection("twoweeksApplications").doc(candidateApplicationId);
  const responseRef = db.collection("twoweeksProposalResponses").doc(`${viewerApplicationId}_${candidateApplicationId}`);
  const counterpartResponseRef = db.collection("twoweeksProposalResponses").doc(`${candidateApplicationId}_${viewerApplicationId}`);

  return db.runTransaction(async (tx) => {
    // 트랜잭션의 모든 읽기는 쓰기 전에 완료합니다.
    const [matchSnap, viewerSnap, counterpartSnap, responseSnap, counterpartResponseSnap] = await Promise.all([
      tx.get(matchRef), tx.get(viewerRef), tx.get(counterpartRef), tx.get(responseRef), tx.get(counterpartResponseRef),
    ]);
    if (!matchSnap.exists || !viewerSnap.exists || !counterpartSnap.exists) {
      throw new HttpsError("not-found", "매칭 또는 신청 정보를 찾을 수 없습니다.");
    }
    const match = matchSnap.data() || {};
    const viewer = { id: viewerSnap.id, ...viewerSnap.data() };
    const counterpart = { id: counterpartSnap.id, ...counterpartSnap.data() };
    if (!pairInMatch(match, viewerApplicationId, candidateApplicationId) ||
        viewer.currentProposal?.matchId !== matchId ||
        viewer.currentProposal?.candidateApplicationId !== candidateApplicationId ||
        counterpart.currentProposal?.matchId !== matchId ||
        viewer.roundId !== counterpart.roundId ||
        (match.roundId && match.roundId !== viewer.roundId)) {
      throw new HttpsError("failed-precondition", "현재 진행 중인 소개가 아닙니다. 화면을 새로고침해주세요.");
    }
    if (viewer.status === "withdrawn" || counterpart.status === "withdrawn" ||
        viewer.reviewStatus !== "approved" || counterpart.reviewStatus !== "approved") {
      throw new HttpsError("failed-precondition", "지금은 이 소개에 응답할 수 없습니다.");
    }
    const existing = responseSnap.exists ? responseSnap.data() || {} : null;
    const other = counterpartResponseSnap.exists ? counterpartResponseSnap.data() || {} : null;
    if (existing?.response && existing.response !== response) {
      throw new HttpsError("already-exists", "이미 다른 응답이 저장된 소개입니다. 현황을 다시 확인해주세요.");
    }
    // 성공 응답을 받기 전에 연결이 끊긴 경우 같은 선택으로 다시 요청하면 안전하게 복구합니다.
    const alreadySubmitted = existing?.response === response;
    const lifecycleStatus = String(match.status || "");
    const scheduleStatus = String(match.scheduleStatus || "");
    // 이미 처리된 응답 재시도 시 확정 일정이나 종료 기록을 절대 이전 단계로 되돌리지 않습니다.
    if (alreadySubmitted && (
      TERMINAL.has(lifecycleStatus) ||
      ["confirmed", "completed", "waiting_counterpart", "needs_final_choice", "place_pending"].includes(scheduleStatus)
    )) {
      return {
        ok: true, matchId, response, responseOrder: existing.responseOrder || 1,
        bothAccepted: response === "accepted" && other?.response === "accepted",
        alreadySubmitted: true, progressed: true,
      };
    }
    if (!alreadySubmitted && (
      TERMINAL.has(String(match.status || "")) ||
      TERMINAL.has(String(match.proposalStatus || "")) ||
      TERMINAL.has(String(viewer.matchingStatus || "")) ||
      TERMINAL.has(String(match.scheduleStatus || ""))
    )) {
      throw new HttpsError("failed-precondition", "이미 종료된 소개입니다. 현황을 다시 확인해주세요.");
    }
    const due = getProposalResponseDueMs(match) || toMillis(viewer.currentProposal?.responseDueAtClient);
    if (!alreadySubmitted && due && Date.now() >= due) {
      throw new HttpsError("deadline-exceeded", "제안 응답 기한이 지났습니다. 신청현황을 확인해주세요.");
    }
    if (other?.response === "declined" && response === "accepted") {
      throw new HttpsError("failed-precondition", "상대방 응답으로 이미 종료된 소개입니다.");
    }
    const bothAccepted = response === "accepted" && other?.response === "accepted";
    const order = existing?.responseOrder || (other?.response ? 2 : 1);
    const now = new Date().toISOString();
    if (!alreadySubmitted) {
      tx.set(responseRef, buildResponsePayload({ viewer, counterpart, matchId, response, order, now, due, reason }));
    }
    const field = admin.firestore.FieldValue;
    tx.update(viewerRef, {
      "currentProposal.candidateApplicationId": candidateApplicationId,
      "currentProposal.matchId": matchId,
      "currentProposal.response": response,
      "currentProposal.responseOrder": order,
      "currentProposal.respondedAt": existing?.respondedAt || field.serverTimestamp(),
      "currentProposal.respondedAtClient": existing?.respondedAtClient || now,
      ...(reason ? { "currentProposal.declineReasonSubmitted": true, "currentProposal.declineStage": order === 2 ? "second_response" : "first_response" } : {}),
      matchingStatus: bothAccepted ? "mutualAccepted" : response === "accepted" ? "accepted" : "declined",
      updatedAt: field.serverTimestamp(),
    });
    if (bothAccepted) {
      tx.update(counterpartRef, {
        matchingStatus: "mutualAccepted",
        "currentProposal.counterpartResponse": "accepted",
        "currentProposal.mutualAcceptedAt": field.serverTimestamp(),
        updatedAt: field.serverTimestamp(),
      });
      tx.set(matchRef, {
        status: "mutualAccepted", mutualAcceptedAt: field.serverTimestamp(), updatedAt: field.serverTimestamp(),
      }, { merge: true });
    } else if (response === "declined") {
      // 거절 알림 함수가 이후 상세 사유와 종료 상태를 다시 검증/동기화합니다.
      tx.set(matchRef, {
        status: "declined", proposalStatus: "declined", declinedByApplicationId: viewerApplicationId,
        declinedCounterpartApplicationId: candidateApplicationId, updatedAt: field.serverTimestamp(),
      }, { merge: true });
      tx.update(counterpartRef, {
        matchingStatus: "declined", "currentProposal.counterpartResponse": "declined",
        "currentProposal.endedByCounterpart": true, updatedAt: field.serverTimestamp(),
      });
    } else {
      // 매칭 문서에도 쓰기를 수행하여 동시 응답 트랜잭션을 충돌/재시도로 직렬화합니다.
      tx.set(matchRef, { lastProposalResponseAt: field.serverTimestamp() }, { merge: true });
    }
    return { ok: true, matchId, response, responseOrder: order, bothAccepted, alreadySubmitted };
  });
}

const respondTwoWeeksProposal = onCall({ region: "asia-northeast3" }, async (request) => {
  try {
    return await recordTwoWeeksProposalResponse(request);
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error("[TwoWeeksProposal] server response transaction failed:", error);
    throw new HttpsError("internal", "응답 처리 중 문제가 발생했습니다. 신청현황을 다시 확인해주세요.");
  }
});

module.exports = { respondTwoWeeksProposal, recordTwoWeeksProposalResponse, pairInMatch };
