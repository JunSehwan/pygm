const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { assertApplicationOwner } = require("./twoWeeksCallerAuth");
const { sendTwoWeeksAdminSms } = require("./twoWeeksAdminSms");

if (!admin.apps.length) admin.initializeApp();

const REGION = "asia-northeast3";
const CLIENT_EVENTS = new Set(["schedule_candidates_submitted", "schedule_confirmed"]);
const SENDING_LOCK_STALE_MS = 2 * 60 * 1000;
const EVENT_LABELS = {
  proposal_declined: "한 명 거절",
  both_declined: "양쪽 거절",
  mutual_accepted: "양쪽 수락·일정조율 시작",
  proposal_timeout: "제안 응답기한 종료",
  schedule_candidates_submitted: "일정·장소 후보 선택",
  schedule_confirmed: "만남 일정 확정",
  schedule_timeout: "일정 선택기한 종료",
};

function clean(value = "", max = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function participantIds(match = {}) {
  return [clean(match.maleApplicationId, 120), clean(match.femaleApplicationId, 120)].filter(Boolean);
}

function formatMeeting(match = {}) {
  const meeting = match.finalMeeting || match.schedule?.finalMeeting || {};
  const time = clean(
    meeting.displayLabel ||
      meeting.timeLabel ||
      meeting.startAtClient ||
      match.schedule?.finalTimeChoice?.label ||
      match.schedule?.finalTimeChoice?.startAtClient,
    120
  );
  const place = clean(
    meeting.placeName ||
      meeting.cafeName ||
      meeting.place?.name ||
      match.schedule?.finalPlaceChoice?.name,
    120
  );
  return [time, place].filter(Boolean).join(" / ");
}

function buildMessage({ matchId = "", match = {}, event = "", detail = "" } = {}) {
  const pair = [clean(match.maleName, 50), clean(match.femaleName, 50)].filter(Boolean).join(" ↔ ") || "참여자 확인 필요";
  const meeting = event === "schedule_confirmed" ? formatMeeting(match) : "";
  return [
    `[투윅스 운영] ${EVENT_LABELS[event] || event}`,
    `매칭: ${pair}`,
    `매칭 ID: ${matchId}`,
    meeting ? `확정 일정: ${meeting}` : "",
    clean(detail, 500) ? `내용: ${clean(detail, 500)}` : "",
    "관리자 페이지에서 상태를 확인해주세요.",
  ].filter(Boolean).join("\n");
}

function assertClientEventState(match = {}, event = "", applicationId = "") {
  const schedule = match.schedule || {};
  const scheduleStatus = clean(match.scheduleStatus || schedule.status, 60);
  if (event === "schedule_candidates_submitted") {
    if (scheduleStatus !== "waiting_counterpart" || clean(schedule.firstSelectorApplicationId, 120) !== applicationId) {
      throw new HttpsError("failed-precondition", "일정 후보 저장 상태가 확인되지 않습니다.");
    }
    return;
  }
  if (event === "schedule_confirmed") {
    if (scheduleStatus !== "confirmed" || !(match.finalMeeting || schedule.finalMeeting)) {
      throw new HttpsError("failed-precondition", "확정된 만남 일정이 확인되지 않습니다.");
    }
  }
}

async function notifyTwoWeeksAdminLifecycle({ matchId = "", event = "", detail = "", match: suppliedMatch = null } = {}) {
  const cleanMatchId = clean(matchId, 160);
  const cleanEvent = clean(event, 80);
  if (!cleanMatchId || !EVENT_LABELS[cleanEvent]) return { status: "skipped", reason: "INVALID_EVENT" };

  const db = admin.firestore();
  const matchRef = db.collection("twoweeksMatches").doc(cleanMatchId);
  const lockRef = db.collection("twoweeksAdminLifecycleNotifications").doc(`${cleanMatchId}_${cleanEvent}`);
  const matchSnap = suppliedMatch ? null : await matchRef.get();
  const match = suppliedMatch || (matchSnap?.exists ? matchSnap.data() || {} : null);
  if (!match) return { status: "skipped", reason: "MATCH_NOT_FOUND" };

  const claimed = await db.runTransaction(async (tx) => {
    const lockSnap = await tx.get(lockRef);
    const current = lockSnap.exists ? lockSnap.data() || {} : {};
    const attemptMs = Date.parse(String(current.attemptAtClient || ""));
    const sendingIsFresh =
      current.status === "sending" &&
      Number.isFinite(attemptMs) &&
      Date.now() - attemptMs < SENDING_LOCK_STALE_MS;
    if (current.status === "sent" || sendingIsFresh || Number(current.attemptCount || 0) >= 3) return false;
    tx.set(lockRef, {
      matchId: cleanMatchId,
      event: cleanEvent,
      status: "sending",
      attemptCount: Number(current.attemptCount || 0) + 1,
      attemptAt: admin.firestore.FieldValue.serverTimestamp(),
      attemptAtClient: new Date().toISOString(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return true;
  });

  if (!claimed) return { status: "already_sent" };
  const result = await sendTwoWeeksAdminSms({
    subject: `투윅스 ${EVENT_LABELS[cleanEvent]}`,
    message: buildMessage({ matchId: cleanMatchId, match, event: cleanEvent, detail }),
  });

  await lockRef.set({
    status: result.status,
    reason: result.reason || "",
    sentAtClient: result.sentAtClient || "",
    failedAtClient: result.failedAtClient || "",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  return result;
}

const notifyTwoWeeksAdminMatchLifecycle = onCall(
  { region: REGION, timeoutSeconds: 60, memory: "256MiB" },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    const matchId = clean(request.data?.matchId, 160);
    const event = clean(request.data?.event, 80);
    const applicationId = clean(request.data?.applicationId, 120);
    if (!matchId || !applicationId || !CLIENT_EVENTS.has(event)) {
      throw new HttpsError("invalid-argument", "운영 알림 정보가 올바르지 않습니다.");
    }

    await assertApplicationOwner(request, applicationId);
    const matchSnap = await admin.firestore().collection("twoweeksMatches").doc(matchId).get();
    if (!matchSnap.exists) throw new HttpsError("not-found", "매칭 정보를 찾을 수 없습니다.");
    const match = matchSnap.data() || {};
    if (!participantIds(match).includes(applicationId)) {
      throw new HttpsError("permission-denied", "해당 매칭의 참여자가 아닙니다.");
    }
    assertClientEventState(match, event, applicationId);
    return notifyTwoWeeksAdminLifecycle({ matchId, event, match });
  }
);

module.exports = {
  notifyTwoWeeksAdminLifecycle,
  notifyTwoWeeksAdminMatchLifecycle,
};
