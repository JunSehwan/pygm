const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const { assertApplicationOwner } = require("./twoWeeksCallerAuth");
const { notifyTwoWeeksAdminLifecycle } = require("./twoWeeksAdminLifecycleNotification");

if (!admin.apps.length) {
  admin.initializeApp();
}

const DECLINE_REASON_LABELS = {
  photo_attraction: "사진·외적 호감",
  basic_conditions: "기본 조건",
  values_direction: "가치관·장기 방향",
  lifestyle_profile: "직업·생활 조건",
  personal_timing: "개인 사정",
  other: "기타",
};

function normalizeDeclineReason(input = {}) {
  const code = String(input?.code || "").trim();
  const label = DECLINE_REASON_LABELS[code] || "";
  const text = String(input?.text || "").replace(/\s+/g, " ").trim().slice(0, 300);

  if (!label) {
    throw new HttpsError("invalid-argument", "거절 사유가 올바르지 않습니다.");
  }

  if (code === "other" && !text) {
    throw new HttpsError("invalid-argument", "기타 사유를 작성해주세요.");
  }

  return { code, label, text: code === "other" ? text : "" };
}

function onlyDigits(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

function getPhone(application = {}) {
  return onlyDigits(
    application?.basic?.phoneNormalized ||
      application?.basic?.phone ||
      application?.phoneIdentityVerification?.phone ||
      application?.phone
  );
}

function appendTab(url = "", tab = "candidate") {
  const fallback = "https://charmingsoup.com/2weeks/proposal/dashboard";
  const raw = String(url || fallback).trim() || fallback;

  try {
    const parsed = new URL(raw, "https://charmingsoup.com");
    parsed.searchParams.set("tab", tab);
    return parsed.toString();
  } catch {
    return `${fallback}?tab=${encodeURIComponent(tab)}`;
  }
}

function getDashboardUrl(application = {}, tab = "candidate") {
  const base =
    application?.dashboardAccess?.url ||
    (application?.dashboardAccess?.path
      ? `https://charmingsoup.com${application.dashboardAccess.path}`
      : "https://charmingsoup.com/2weeks/proposal/dashboard");

  return appendTab(base, tab);
}

function getDisplayName(application = {}) {
  return application?.basic?.name || application?.basic?.nickname || "신청자";
}

function buildMessage(application = {}) {
  return [
    "[투윅스] 이번 제안 결과 안내",
    "",
    `${getDisplayName(application)}님, 이번 제안은 아쉽게 연결되지 않았습니다.`,
    "한 번의 선택이 회원님의 매력이나 가치를 뜻하는 것은 아닙니다.",
    "투윅스가 더 잘 맞는 다음 만남을 신중하게 준비하겠습니다.",
    "",
    "신청현황 확인:",
    getDashboardUrl(application, "candidate"),
  ].join("\n");
}

async function sendNcpLms(to, message, subject = "투윅스 제안 결과 안내") {
  const serviceId = process.env.NEXT_PUBLIC_NCP_SERVICE_ID;
  const accessKey = process.env.NEXT_PUBLIC_NCP_KEY;
  const secretKey = process.env.NEXT_PUBLIC_NCP_SECRET_KEY;
  const from = onlyDigits(process.env.NEXT_PUBLIC_MY_NUM || "");

  if (!serviceId || !accessKey || !secretKey || !from) {
    throw new Error("NCP SMS 환경변수가 설정되지 않았습니다.");
  }

  const method = "POST";
  const urlPath = `/sms/v2/services/${serviceId}/messages`;
  const timestamp = Date.now().toString();

  const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
  hmac.update(method);
  hmac.update(" ");
  hmac.update(urlPath);
  hmac.update("\n");
  hmac.update(timestamp);
  hmac.update("\n");
  hmac.update(accessKey);
  const signature = hmac.finalize().toString(CryptoJS.enc.Base64);

  const response = await axios.post(
    `https://sens.apigw.ntruss.com${urlPath}`,
    {
      type: "LMS",
      countryCode: "82",
      from,
      subject,
      content: String(message || "").replace(/([\uD800-\uDBFF][\uDC00-\uDFFF])/g, ""),
      messages: [{ to }],
    },
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "x-ncp-iam-access-key": accessKey,
        "x-ncp-apigw-timestamp": timestamp,
        "x-ncp-apigw-signature-v2": signature,
      },
    }
  );

  return response.data;
}

async function getApplication(db, applicationId = "") {
  if (!applicationId) return null;
  const snap = await db.collection("twoweeksApplications").doc(applicationId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

async function getResponse(db, viewerApplicationId = "", candidateApplicationId = "") {
  if (!viewerApplicationId || !candidateApplicationId) return null;
  const snap = await db
    .collection("twoweeksProposalResponses")
    .doc(`${viewerApplicationId}_${candidateApplicationId}`)
    .get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

async function claimNotificationLock({ db, matchId, counterpartApplicationId }) {
  const lockRef = db
    .collection("twoweeksNotificationLocks")
    .doc(`proposalDeclined_${matchId}_${counterpartApplicationId}`);
  const nowClient = new Date().toISOString();
  const retryBefore = Date.now() - 2 * 60 * 1000;

  const result = await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(lockRef);
    const data = snap.exists ? snap.data() || {} : {};

    if (data.status === "sent") {
      return { shouldSend: false, status: "already_sent", lockRef };
    }

    const attemptMs = Date.parse(data.attemptAtClient || "");
    if (data.status === "sending" && Number.isFinite(attemptMs) && attemptMs > retryBefore) {
      return { shouldSend: false, status: "sending", lockRef };
    }

    transaction.set(
      lockRef,
      {
        matchId,
        applicationId: counterpartApplicationId,
        event: "proposal_declined_counterpart_notice",
        status: "sending",
        attemptAt: admin.firestore.FieldValue.serverTimestamp(),
        attemptAtClient: nowClient,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAtClient: nowClient,
      },
      { merge: true }
    );

    return { shouldSend: true, status: "claimed", lockRef };
  });

  return result;
}

async function sendOnce({ db, matchId, application }) {
  const applicationId = application.id;
  const phone = getPhone(application);
  const claim = await claimNotificationLock({
    db,
    matchId,
    counterpartApplicationId: applicationId,
  });

  if (!claim.shouldSend) {
    return { applicationId, status: claim.status };
  }

  if (!phone) {
    await claim.lockRef.set(
      {
        status: "skipped",
        reason: "NO_PHONE",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAtClient: new Date().toISOString(),
      },
      { merge: true }
    );
    return { applicationId, status: "skipped", reason: "NO_PHONE" };
  }

  try {
    const response = await sendNcpLms(phone, buildMessage(application));

    await claim.lockRef.set(
      {
        status: "sent",
        phoneLast4: phone.slice(-4),
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        sentAtClient: new Date().toISOString(),
        providerRequestId: response?.requestId || "",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { applicationId, status: "sent" };
  } catch (error) {
    await claim.lockRef.set(
      {
        status: "failed",
        errorMessage: error?.message || String(error),
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
        failedAtClient: new Date().toISOString(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    throw error;
  }
}

const notifyTwoWeeksProposalDeclined = onCall(
  { region: "asia-northeast3" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const data = request.data || {};
    const matchId = String(data.matchId || "").trim();
    const declinedByApplicationId = String(data.declinedByApplicationId || "").trim();
    const declineReason = normalizeDeclineReason(data.declineReason || {});

    if (!matchId || !declinedByApplicationId) {
      throw new HttpsError("invalid-argument", "매칭과 거절자 정보가 필요합니다.");
    }

    const db = admin.firestore();
    const matchRef = db.collection("twoweeksMatches").doc(matchId);
    const matchSnap = await matchRef.get();

    if (!matchSnap.exists) {
      throw new HttpsError("not-found", "매칭 정보를 찾을 수 없습니다.");
    }

    const match = matchSnap.data() || {};
    const maleApplicationId = String(match.maleApplicationId || "");
    const femaleApplicationId = String(match.femaleApplicationId || "");
    const participantIds = [maleApplicationId, femaleApplicationId].filter(Boolean);

    if (participantIds.length !== 2 || !participantIds.includes(declinedByApplicationId)) {
      throw new HttpsError("permission-denied", "해당 매칭의 참여자가 아닙니다.");
    }

    await assertApplicationOwner(request, declinedByApplicationId);

    const counterpartApplicationId =
      declinedByApplicationId === maleApplicationId ? femaleApplicationId : maleApplicationId;
    const [declineResponse, counterpartResponse] = await Promise.all([
      getResponse(db, declinedByApplicationId, counterpartApplicationId),
      getResponse(db, counterpartApplicationId, declinedByApplicationId),
    ]);

    if (declineResponse?.response !== "declined") {
      throw new HttpsError("failed-precondition", "거절 응답이 확인되지 않습니다.");
    }

    const nowClient = new Date().toISOString();
    const responseOrder = Number(declineResponse.responseOrder || 0);
    const declineStage =
      declineResponse.declineStage ||
      declineResponse.responseStage ||
      (responseOrder === 2 ? "second_response" : "first_response");
    const reasonRef = db
      .collection("twoweeksProposalDeclineReasons")
      .doc(`${matchId}_${declinedByApplicationId}`);
    const bothDeclined = counterpartResponse?.response === "declined";
    const [declinedApplication, counterpartApplication] = await Promise.all([
      getApplication(db, declinedByApplicationId),
      getApplication(db, counterpartApplicationId),
    ]);

    if (!counterpartApplication) {
      throw new HttpsError("not-found", "상대 신청자 정보를 찾을 수 없습니다.");
    }

    const declinerRef = db.collection("twoweeksApplications").doc(declinedByApplicationId);
    const counterpartRef = db.collection("twoweeksApplications").doc(counterpartApplicationId);
    const stateBatch = db.batch();

    stateBatch.set(
      reasonRef,
      {
        matchId,
        responseId: `${declinedByApplicationId}_${counterpartApplicationId}`,
        roundId: declineResponse.roundId || match.roundId || "",
        declinedByApplicationId,
        counterpartApplicationId,
        reasonCode: declineReason.code,
        reasonLabel: declineReason.label,
        reasonText: declineReason.text,
        responseOrder,
        declineStage,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAtClient: nowClient,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAtClient: nowClient,
      },
      { merge: true }
    );
    stateBatch.set(
      matchRef,
      {
        status: "declined",
        proposalStatus: "declined",
        scheduleStatus: "not_started",
        schedule: { status: "not_started" },
        photoRevealStatus: "hidden",
        declinedByApplicationId,
        declinedCounterpartApplicationId: counterpartApplicationId,
        declinedAt: match.declinedAt || admin.firestore.FieldValue.serverTimestamp(),
        declinedAtClient: match.declinedAtClient || nowClient,
        decline: {
          stage: declineStage,
          responseOrder,
          reasonSubmitted: true,
          declinedByApplicationId,
          counterpartApplicationId,
          counterpartResponseAtDecline: counterpartResponse?.response || "pending",
          declinedAtClient: match.declinedAtClient || nowClient,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    stateBatch.update(declinerRef, {
      matchingStatus: "declined",
      "currentProposal.candidateApplicationId": counterpartApplicationId,
      "currentProposal.matchId": matchId,
      "currentProposal.status": "declined",
      "currentProposal.response": "declined",
      "currentProposal.responseOrder": responseOrder,
      "currentProposal.respondedAt": declineResponse.respondedAt || admin.firestore.FieldValue.serverTimestamp(),
      "currentProposal.respondedAtClient": declineResponse.respondedAtClient || nowClient,
      "currentProposal.declineReasonSubmitted": true,
      "currentProposal.declineStage": declineStage,
      "currentProposal.counterpartResponse": bothDeclined ? "declined" : admin.firestore.FieldValue.delete(),
      "currentProposal.endedByCounterpart": bothDeclined,
      "currentProposal.outcome": bothDeclined ? "both_declined" : "self_declined",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    stateBatch.update(counterpartRef, {
      matchingStatus: "declined",
      "currentProposal.candidateApplicationId": declinedByApplicationId,
      "currentProposal.matchId": matchId,
      "currentProposal.status": "declined",
      ...(bothDeclined ? { "currentProposal.response": "declined" } : {}),
      "currentProposal.counterpartResponse": "declined",
      "currentProposal.counterpartRespondedAt": declineResponse.respondedAt || admin.firestore.FieldValue.serverTimestamp(),
      "currentProposal.counterpartRespondedAtClient": declineResponse.respondedAtClient || nowClient,
      "currentProposal.endedByCounterpart": true,
      "currentProposal.outcome": bothDeclined ? "both_declined" : "counterpart_declined",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 응답·매칭·양쪽 신청서가 서로 다른 상태로 남지 않도록 먼저 원자적으로 확정한다.
    await stateBatch.commit();

    await notifyTwoWeeksAdminLifecycle({
      matchId,
      event: bothDeclined ? "both_declined" : "proposal_declined",
      match,
      detail: `${getDisplayName(declinedApplication || {})}님 거절 · ${declineReason.label}${declineReason.text ? ` (${declineReason.text})` : ""}`,
    }).catch((error) => console.error("[TwoWeeks] admin decline notification failed:", error));

    // 양쪽 모두 거의 동시에 거절한 경우에는 상대 위로 문자를 중복 발송하지 않는다.
    if (bothDeclined) {
      await matchRef.set(
        {
          declineNotification: {
            status: "both_declined",
            declinedByApplicationId,
            counterpartApplicationId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAtClient: nowClient,
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { status: "both_declined", sent: false };
    }

    let result;
    try {
      result = await sendOnce({
        db,
        matchId,
        application: counterpartApplication,
      });
    } catch (error) {
      result = {
        applicationId: counterpartApplicationId,
        status: "failed",
        errorMessage: error?.message || String(error),
      };
    }

    await matchRef.set(
      {
        declineNotification: {
          status: ["sent", "already_sent"].includes(result.status) ? "sent" : result.status,
          declinedByApplicationId,
          counterpartApplicationId,
          result,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAtClient: nowClient,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      status: result.status,
      sent: ["sent", "already_sent"].includes(result.status),
      counterpartApplicationId,
    };
  }
);

module.exports = { notifyTwoWeeksProposalDeclined };
