const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { assertApplicationOwner } = require("./twoWeeksCallerAuth");
const { getTwoWeeksFeedbacks } = require("./twoWeeksFeedbackPrivateStore");

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = "asia-northeast3";

function safeString(value = "") {
  return String(value || "").trim();
}

function onlyDigits(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

function getPhone(application = {}) {
  return onlyDigits(
    application?.basic?.phoneNormalized ||
      application?.basic?.phone ||
      application?.phoneIdentityVerification?.phone ||
      application?.phone ||
      ""
  );
}

function getContinueMeetingIntent(feedback = {}) {
  return safeString(feedback?.continueMeetingIntent || feedback?.meetAgainIntent || "");
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

function isMutualInterest(match = {}, participantIds = [], feedbacks = match?.feedbacks || {}) {
  if (participantIds.length !== 2) return false;

  if (
    safeString(match?.connectionOutcome?.status) === "mutual_connected" ||
    match?.connectionOutcome?.mutualContactConsent === true ||
    match?.feedbackSummary?.mutualContactConsent === true ||
    match?.feedbackSummary?.mutualInterest === true ||
    safeString(match?.contactOpenStatus) === "mutual_open"
  ) {
    return true;
  }

  return participantIds.every((applicationId) => hasContactShareConsent(feedbacks?.[applicationId] || {}));
}

const getTwoWeeksMutualContact = onCall(
  { region: REGION, timeoutSeconds: 60, memory: "256MiB" },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");

    const data = request.data || {};
    const viewerApplicationId = safeString(data.viewerApplicationId);
    const matchId = safeString(data.matchId);
    if (!viewerApplicationId || !matchId) {
      throw new HttpsError("invalid-argument", "연락처 확인 정보가 필요합니다.");
    }

    await assertApplicationOwner(request, viewerApplicationId, { allowAdmin: false });

    const db = admin.firestore();
    const [viewerSnap, matchSnap] = await Promise.all([
      db.collection("twoweeksApplications").doc(viewerApplicationId).get(),
      db.collection("twoweeksMatches").doc(matchId).get(),
    ]);

    if (!viewerSnap.exists || !matchSnap.exists) throw new HttpsError("not-found", "매칭 정보를 찾을 수 없습니다.");

    const viewer = { id: viewerSnap.id, ...viewerSnap.data() };
    const match = { id: matchSnap.id, ...matchSnap.data() };

    const participantIds = [match.maleApplicationId, match.femaleApplicationId].filter(Boolean);
    if (participantIds.length !== 2 || !participantIds.includes(viewerApplicationId)) {
      throw new HttpsError("permission-denied", "해당 매칭의 참여자가 아닙니다.");
    }

    const feedbacks = await getTwoWeeksFeedbacks(db, matchId, match);
    if (!isMutualInterest(match, participantIds, feedbacks)) {
      return { ok: true, opened: false };
    }

    const viewerVisibility = match?.contactVisibilityByApplicationId?.[viewerApplicationId] || {};
    const viewerClosedThisContact =
      safeString(viewer?.lastClosedContactMatchId) === matchId ||
      safeString(viewerVisibility?.status) === "hidden";
    if (viewerClosedThisContact) {
      return { ok: true, opened: false, reason: "MATCHING_RESUMED" };
    }

    const counterpartApplicationId = participantIds.find((id) => id !== viewerApplicationId);
    const counterpartSnap = await db.collection("twoweeksApplications").doc(counterpartApplicationId).get();
    if (!counterpartSnap.exists) throw new HttpsError("not-found", "상대 정보를 찾을 수 없습니다.");

    const counterpart = { id: counterpartSnap.id, ...counterpartSnap.data() };
    const phone = getPhone(counterpart);
    if (!phone) throw new HttpsError("not-found", "상대 연락처를 확인할 수 없습니다.");

    const nowClient = new Date().toISOString();
    const batch = db.batch();
    batch.set(
      matchSnap.ref,
      {
        contactOpenStatus: "mutual_open",
        contactOpenedAt: admin.firestore.FieldValue.serverTimestamp(),
        contactOpenedAtClient: match.contactOpenedAtClient || nowClient,
        contactVisibilityByApplicationId: {
          [viewerApplicationId]: {
            status: "mutual_open",
            openedAt: admin.firestore.FieldValue.serverTimestamp(),
            openedAtClient: nowClient,
          },
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    // 상대가 이미 '매칭 다시 시작'을 선택했더라도 다시 연락처를 열지 않도록 현재 조회자만 갱신한다.
    batch.set(
      viewerSnap.ref,
      {
        contactOpenStatus: "mutual_open",
        lastMutualContactMatchId: matchId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    await batch.commit();

    return {
      ok: true,
      opened: true,
      contact: {
        applicationId: counterpartApplicationId,
        name: safeString(counterpart?.basic?.nickname || counterpart?.basic?.name || "상대방"),
        phone,
      },
    };
  }
);

module.exports = { getTwoWeeksMutualContact };
