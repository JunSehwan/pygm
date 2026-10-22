const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const { sendTwoWeeksAdminSms } = require("./twoWeeksAdminSms");
const { assertApplicationOwner } = require("./twoWeeksCallerAuth");
const {
  DEFAULT_DEPOSIT_AMOUNT,
  getBalance,
  getRequiredBalance,
  isDepositWaived,
  isParticipationEligible,
} = require("./twoWeeksDepositPolicy");
const { recommendSanction } = require("./twoWeeksSanctionPolicy");

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = "asia-northeast3";
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const CANCELLATION_POLICY = {
  beforeScheduleConfirmed: { rate: 0.3, amount: 9000, code: "before_schedule_confirmed", label: "일정·장소 확정 전 취소" },
  afterScheduleConfirmed: { rate: 0.5, amount: 15000, code: "after_schedule_confirmed", label: "일정·장소 확정 후 만남 전날까지 취소" },
  sameDay: { rate: 1, amount: 30000, code: "same_day", label: "만남 당일 취소" },
};

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

function getName(application = {}) {
  return safeString(application?.basic?.name || application?.basic?.nickname || "신청자");
}

function isDepositEligible(application = {}) {
  return isParticipationEligible(application?.deposit || {});
}

function getFinalMeeting(match = {}) {
  return match?.finalMeeting || match?.schedule?.finalMeeting || {};
}

function getMeetingStartMs(match = {}) {
  const finalMeeting = getFinalMeeting(match);
  const value =
    finalMeeting?.startAtClient ||
    finalMeeting?.finalTimeChoice?.startAtClient ||
    finalMeeting?.timeChoice?.startAtClient ||
    finalMeeting?.selectedChoice?.startAtClient ||
    "";
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? 0 : ms;
}

function toKstDateKey(ms) {
  const date = new Date(ms + KST_OFFSET_MS);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function withRequiredBalance(policy = {}, requiredBalance = DEFAULT_DEPOSIT_AMOUNT) {
  const safeRequiredBalance = Number.isFinite(Number(requiredBalance)) && Number(requiredBalance) >= 0
    ? Number(requiredBalance)
    : DEFAULT_DEPOSIT_AMOUNT;
  return {
    ...policy,
    amount: Math.min(safeRequiredBalance, Math.round(safeRequiredBalance * Number(policy.rate || 0))),
  };
}

function getCancellationPolicy(match = {}, nowMs = Date.now(), requiredBalance = DEFAULT_DEPOSIT_AMOUNT) {
  const matchStatus = safeString(match?.status || "");
  const scheduleStatus = safeString(match?.scheduleStatus || match?.schedule?.status || "");
  const meetingStartMs = getMeetingStartMs(match);
  const scheduleConfirmed =
    matchStatus === "confirmed" ||
    scheduleStatus === "confirmed" ||
    Boolean(match?.finalMeeting || match?.schedule?.finalMeeting);

  if (!scheduleConfirmed) return withRequiredBalance(CANCELLATION_POLICY.beforeScheduleConfirmed, requiredBalance);

  if (meetingStartMs && toKstDateKey(nowMs) === toKstDateKey(meetingStartMs)) {
    return withRequiredBalance(CANCELLATION_POLICY.sameDay, requiredBalance);
  }

  if (meetingStartMs && nowMs > meetingStartMs) {
    return withRequiredBalance(CANCELLATION_POLICY.sameDay, requiredBalance);
  }

  return withRequiredBalance(CANCELLATION_POLICY.afterScheduleConfirmed, requiredBalance);
}

function isCancellable(match = {}) {
  const matchStatus = safeString(match?.status || "");
  const scheduleStatus = safeString(match?.scheduleStatus || match?.schedule?.status || "");

  if (["cancelled", "canceled", "completed", "failed", "declined", "proposal_expired", "schedule_expired", "counterpart_expired"].includes(matchStatus)) {
    return false;
  }

  return (
    ["mutualAccepted", "confirmed"].includes(matchStatus) ||
    ["ready", "waiting_counterpart", "needs_final_choice", "place_pending", "confirmed"].includes(scheduleStatus)
  );
}

async function sendLmsDirect({ to, message, subject = "투윅스 만남 취소 안내" }) {
  const phone = onlyDigits(to);
  if (!phone) return { status: "skipped", reason: "NO_PHONE" };

  const serviceId = process.env.NEXT_PUBLIC_NCP_SERVICE_ID;
  const accessKey = process.env.NEXT_PUBLIC_NCP_KEY;
  const secretKey = process.env.NEXT_PUBLIC_NCP_SECRET_KEY;
  const from = onlyDigits(process.env.NEXT_PUBLIC_MY_NUM || "");
  if (!serviceId || !accessKey || !secretKey || !from) return { status: "failed", reason: "MISSING_NCP_ENV" };

  const method = "POST";
  const urlPath = `/sms/v2/services/${serviceId}/messages`;
  const url = `https://sens.apigw.ntruss.com${urlPath}`;
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

  try {
    const response = await axios.post(
      url,
      {
        type: "LMS",
        contentType: "COMM",
        countryCode: "82",
        from,
        subject: String(subject).slice(0, 40),
        content: message,
        messages: [{ to: phone }],
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
    return {
      status: "sent",
      providerRequestId: String(response?.data?.requestId || ""),
      sentAtClient: new Date().toISOString(),
    };
  } catch (error) {
    return { status: "failed", errorMessage: error.response?.data || error.message, failedAtClient: new Date().toISOString() };
  }
}

function formatWon(value = 0) {
  return `${Number(value || 0).toLocaleString("ko-KR")}원`;
}

const cancelTwoWeeksMatch = onCall(
  { region: REGION, timeoutSeconds: 120, memory: "256MiB" },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");

    const data = request.data || {};
    const viewerApplicationId = safeString(data.viewerApplicationId);
    const matchId = safeString(data.matchId);
    const reason = safeString(data.reason).slice(0, 300);

    if (!viewerApplicationId || !matchId) {
      throw new HttpsError("invalid-argument", "취소할 만남 정보를 확인할 수 없습니다.");
    }

    await assertApplicationOwner(request, viewerApplicationId, { allowAdmin: false });

    const db = admin.firestore();
    const viewerRef = db.collection("twoweeksApplications").doc(viewerApplicationId);
    const matchRef = db.collection("twoweeksMatches").doc(matchId);

    const [viewerSnap, matchSnap] = await Promise.all([viewerRef.get(), matchRef.get()]);
    if (!viewerSnap.exists || !matchSnap.exists) throw new HttpsError("not-found", "만남 정보를 찾을 수 없습니다.");

    const viewer = { id: viewerSnap.id, ...viewerSnap.data() };
    const initialMatch = { id: matchSnap.id, ...matchSnap.data() };

    const participantIds = [initialMatch.maleApplicationId, initialMatch.femaleApplicationId].filter(Boolean);
    if (participantIds.length !== 2 || !participantIds.includes(viewerApplicationId)) {
      throw new HttpsError("permission-denied", "해당 만남의 참여자가 아닙니다.");
    }

    const counterpartApplicationId = participantIds.find((id) => id !== viewerApplicationId);
    const counterpartRef = db.collection("twoweeksApplications").doc(counterpartApplicationId);
    const nowClient = new Date().toISOString();
    let result = null;

    await db.runTransaction(async (tx) => {
      const [freshMatchSnap, freshViewerSnap, counterpartSnap] = await Promise.all([
        tx.get(matchRef),
        tx.get(viewerRef),
        tx.get(counterpartRef),
      ]);

      if (!freshMatchSnap.exists || !freshViewerSnap.exists || !counterpartSnap.exists) {
        throw new HttpsError("not-found", "만남 또는 참여자 정보를 찾을 수 없습니다.");
      }

      const match = { id: freshMatchSnap.id, ...freshMatchSnap.data() };
      const freshViewer = { id: freshViewerSnap.id, ...freshViewerSnap.data() };
      const counterpart = { id: counterpartSnap.id, ...counterpartSnap.data() };

      if (match?.cancellation?.status === "completed") {
        if (match.cancellation.byApplicationId === viewerApplicationId) {
          result = {
            ok: true,
            alreadyCancelled: true,
            deductionAmount: Number(match.cancellation.deductionAmount || 0),
            balanceAfter: Number(match.cancellation.balanceAfter || 0),
            topUpRequiredAmount: Number(match.cancellation.topUpRequiredAmount || 0),
          };
          return;
        }
        throw new HttpsError("failed-precondition", "이미 취소 처리된 만남입니다.");
      }

      if (!isCancellable(match)) {
        throw new HttpsError("failed-precondition", "현재 단계에서는 만남 취소 처리를 할 수 없습니다.");
      }

      const requiredBalance = getRequiredBalance(freshViewer.deposit || {});
      const depositWaived = isDepositWaived(freshViewer.deposit || {});
      const policy = getCancellationPolicy(match, Date.now(), requiredBalance);
      const beforeBalance = getBalance(freshViewer.deposit || {});
      const actualDeduction = Math.min(beforeBalance, policy.amount);
      const balanceAfter = Math.max(0, beforeBalance - actualDeduction);
      const topUpRequiredAmount = Math.max(0, requiredBalance - balanceAfter);
      const sameDaySanction = policy.code === "same_day"
        ? recommendSanction(freshViewer.sanctionSummary || {}, "same_day_cancel", Date.now())
        : null;
      const sanctionRestricted = Boolean(
        sameDaySanction && ["next_round_restricted", "restricted_until", "manual_review", "long_term_restricted"].includes(sameDaySanction.status)
      );
      const history = Array.isArray(freshViewer?.deposit?.history) ? freshViewer.deposit.history : [];
      const historyId = `cancel_${matchId}_${viewerApplicationId}`;
      const nextHistory = history.some((item) => item?.id === historyId)
        ? history
        : [
            ...history,
            {
              id: historyId,
              type: "deduction",
              amount: actualDeduction,
              policyAmount: policy.amount,
              balanceAfter,
              reason: policy.code,
              note: `${policy.label} 예치금 차감`,
              matchId,
              createdAtClient: nowClient,
            },
          ];

      const counterpartReady = isDepositEligible(counterpart);
      const deleteField = admin.firestore.FieldValue.delete();

      tx.set(
        viewerRef,
        {
          currentProposal: deleteField,
          schedule: deleteField,
          matchingStatus: sanctionRestricted ? "paused" : depositWaived ? "not_started" : "paused",
          scheduleStatus: "cancelled",
          meetingStatus: "cancelled",
          nextRoundStatus: sanctionRestricted ? "sanction_restricted" : depositWaived ? "ready" : "top_up_required",
          matchingAvailability: sanctionRestricted ? "paused" : depositWaived ? "active" : "paused",
          matchingPauseReason: sanctionRestricted ? "sanction_restricted" : depositWaived ? deleteField : "top_up_required",
          deposit: {
            ...(freshViewer.deposit || {}),
            amount: requiredBalance,
            requiredBalance,
            balance: balanceAfter,
            status: depositWaived ? "waived" : "topup_required",
            topUpRequiredAmount,
            participationEligible: depositWaived,
            totalDeducted: Number(freshViewer?.deposit?.totalDeducted || 0) + actualDeduction,
            history: nextHistory,
            lastDeductionAmount: actualDeduction,
            lastDeductionReason: policy.code,
            lastDeductedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastDeductedAtClient: nowClient,
          },
          lastCancelledMatchId: matchId,
          lastCancelledAt: admin.firestore.FieldValue.serverTimestamp(),
          lastCancelledAtClient: nowClient,
          ...(sameDaySanction
            ? {
                sanctionSummary: {
                  ...(freshViewer.sanctionSummary || {}),
                  ...sameDaySanction,
                  ...(sameDaySanction.restrictedUntilMs
                    ? { restrictedUntil: admin.firestore.Timestamp.fromMillis(sameDaySanction.restrictedUntilMs) }
                    : {}),
                  lastType: "same_day_cancel",
                  lastMatchId: matchId,
                  lastMemo: reason,
                  lastHandledByUid: "system_same_day_cancel",
                  lastHandledAt: admin.firestore.FieldValue.serverTimestamp(),
                  lastHandledAtClient: nowClient,
                },
              }
            : {}),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(
        counterpartRef,
        {
          currentProposal: deleteField,
          schedule: deleteField,
          matchingStatus: counterpartReady ? "not_started" : "paused",
          scheduleStatus: "not_started",
          meetingStatus: "not_started",
          nextRoundStatus: counterpartReady ? "ready" : "top_up_required",
          lastCounterpartCancellation: {
            matchId,
            byApplicationId: viewerApplicationId,
            atClient: nowClient,
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(
        matchRef,
        {
          status: "cancelled",
          scheduleStatus: "cancelled",
          meetingStatus: "cancelled",
          cancellation: {
            status: "completed",
            byApplicationId: viewerApplicationId,
            counterpartApplicationId,
            policyCode: policy.code,
            policyLabel: policy.label,
            policyAmount: policy.amount,
            deductionAmount: actualDeduction,
            balanceBefore: beforeBalance,
            balanceAfter,
            topUpRequiredAmount,
            reason,
            cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
            cancelledAtClient: nowClient,
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      if (sameDaySanction) {
        tx.set(db.collection("twoweeksSanctions").doc(`${viewerApplicationId}_same_day_${matchId}`), {
          applicationId: viewerApplicationId,
          type: "same_day_cancel",
          action: "record_same_day_cancel",
          matchId,
          occurredAt: admin.firestore.FieldValue.serverTimestamp(),
          occurredAtClient: nowClient,
          sanctionStatus: sameDaySanction.status,
          sanctionEndAt: sameDaySanction.restrictedUntilMs
            ? admin.firestore.Timestamp.fromMillis(sameDaySanction.restrictedUntilMs)
            : null,
          adminMemo: reason,
          appliedByUid: "system_same_day_cancel",
          exception: false,
        });
      }

      result = {
        ok: true,
        deductionAmount: actualDeduction,
        policyAmount: policy.amount,
        policyCode: policy.code,
        policyLabel: policy.label,
        balanceAfter,
        topUpRequiredAmount,
        counterpartApplicationId,
      };
    });

    if (!result || result.alreadyCancelled) return result || { ok: true };

    const [freshViewerSnap, counterpartSnap] = await Promise.all([viewerRef.get(), counterpartRef.get()]);
    const freshViewer = freshViewerSnap.exists ? { id: freshViewerSnap.id, ...freshViewerSnap.data() } : viewer;
    const counterpart = counterpartSnap.exists ? { id: counterpartSnap.id, ...counterpartSnap.data() } : {};

    const viewerMessage = [
      "[투윅스] 만남 취소가 처리되었습니다.",
      `${getName(freshViewer)}님이 요청한 만남 취소가 반영되었습니다.`,
      `예치금 차감: ${formatWon(result.deductionAmount)}`,
      `현재 잔액: ${formatWon(result.balanceAfter)}`,
      result.topUpRequiredAmount > 0 ? `다음 매칭 참여 전 추가 예치: ${formatWon(result.topUpRequiredAmount)}` : "",
    ].filter(Boolean).join("\n");

    const counterpartMessage = [
      "[투윅스] 예정된 만남이 취소되었습니다.",
      `${getName(counterpart)}님, 상대방의 사정으로 이번 만남이 취소되었습니다.`,
      "회원님에게는 취소로 인한 예치금 차감이 없습니다.",
      "다음 매칭을 준비해드리겠습니다.",
    ].join("\n");

    const adminMessage = [
      "[투윅스] 만남 취소 및 예치금 차감",
      `취소자: ${getName(freshViewer)}`,
      `상대: ${getName(counterpart)}`,
      `구간: ${result.policyLabel}`,
      `차감: ${formatWon(result.deductionAmount)} / 잔액: ${formatWon(result.balanceAfter)}`,
      result.topUpRequiredAmount > 0 ? `추가예치 필요: ${formatWon(result.topUpRequiredAmount)}` : "추가예치 필요 없음",
      "상대방은 무차감으로 다음 매칭 상태로 복귀합니다.",
      `매칭ID: ${matchId}`,
    ].join("\n");

    const [viewerSms, counterpartSms, adminSms] = await Promise.all([
      sendLmsDirect({ to: getPhone(freshViewer), message: viewerMessage }),
      sendLmsDirect({ to: getPhone(counterpart), message: counterpartMessage }),
      sendTwoWeeksAdminSms({ subject: "투윅스 만남 취소", message: adminMessage }),
    ]);

    await matchRef.set(
      {
        cancellationSms: {
          viewer: viewerSms,
          counterpart: counterpartSms,
          admin: adminSms,
          handledAtClient: new Date().toISOString(),
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return result;
  }
);

module.exports = {
  cancelTwoWeeksMatch,
  CANCELLATION_POLICY,
  formatWon,
  getBalance,
  getCancellationPolicy,
  getName,
  getPhone,
  getRequiredBalance,
  isCancellable,
  isDepositEligible,
  sendLmsDirect,
};
