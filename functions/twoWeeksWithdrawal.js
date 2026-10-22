const crypto = require("crypto");
const admin = require("firebase-admin");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { assertApplicationOwner } = require("./twoWeeksCallerAuth");
const { sendTwoWeeksAdminSms } = require("./twoWeeksAdminSms");
const {
  formatWon,
  getBalance,
  getCancellationPolicy,
  getName,
  getPhone,
  getRequiredBalance,
  isCancellable,
  isDepositEligible,
  sendLmsDirect,
} = require("./twoWeeksMatchCancellation");

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = "asia-northeast3";
const REFUND_PROCESSING_DAYS = 3;
const TERMINAL_MATCH_STATUSES = new Set([
  "cancelled",
  "canceled",
  "completed",
  "failed",
  "declined",
  "proposal_expired",
  "schedule_expired",
  "counterpart_expired",
  "withdrawn",
]);

const WITHDRAWAL_REASONS = {
  deposit_burden: "예치금이 부담돼서",
  service_unclear: "서비스 방식이 아직 잘 이해되지 않아서",
  privacy_concern: "개인정보가 걱정돼서",
  personal_circumstances: "다른 인연/사정이 생겨서",
  area_conditions_mismatch: "지역/조건이 맞지 않아서",
  other: "기타",
};

function safeString(value = "", maxLength = 300) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function onlyDigits(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

function hashValue(value = "") {
  const clean = String(value || "").trim();
  return clean ? crypto.createHash("sha256").update(clean).digest("hex") : "";
}

function normalizeAccountNumber(value = "") {
  return String(value || "").replace(/[^0-9-]/g, "").slice(0, 40);
}

function normalizeAccountHolder(value = "") {
  return String(value || "").trim().replace(/\s+/g, "").toLowerCase();
}

function getAccountLast4(value = "") {
  return onlyDigits(value).slice(-4);
}

function getRefundAccountSmsLines(account = null, refundAmount = 0) {
  if (Number(refundAmount || 0) <= 0 || !account) return [];

  const bankName = safeString(account.bankName, 30);
  const accountNumber = normalizeAccountNumber(account.accountNumber);
  const accountHolder = safeString(account.accountHolder, 40);
  if (!bankName || !accountNumber || !accountHolder) return [];

  return [
    `반환계좌: ${bankName} ${accountNumber}`,
    `예금주: ${accountHolder}`,
  ];
}

function getTimeMs(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  if (typeof value === "number") return value;
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getDocumentTimeMs(data = {}) {
  return Math.max(
    getTimeMs(data.updatedAt),
    getTimeMs(data.createdAt),
    getTimeMs(data.createdAtClient),
    getTimeMs(data.proposedAtClient)
  );
}

function getMeetingStartAtClient(match = {}) {
  const finalMeeting = match?.finalMeeting || match?.schedule?.finalMeeting || {};
  return String(
    finalMeeting?.startAtClient ||
      finalMeeting?.finalTimeChoice?.startAtClient ||
      finalMeeting?.timeChoice?.startAtClient ||
      finalMeeting?.selectedChoice?.startAtClient ||
      ""
  );
}

function isTerminalMatch(match = {}) {
  return TERMINAL_MATCH_STATUSES.has(safeString(match?.status));
}

function isProposalStage(match = {}) {
  if (isTerminalMatch(match) || isCancellable(match)) return false;
  const status = safeString(match?.status || match?.proposalStatus).toLowerCase();
  return ["proposed", "pending", "matcheddraft", "awaiting_response"].includes(status);
}

function getCounterpartId(match = {}, applicationId = "") {
  const participantIds = [match?.maleApplicationId, match?.femaleApplicationId].filter(Boolean);
  if (participantIds.length !== 2 || !participantIds.includes(applicationId)) return "";
  return participantIds.find((id) => id !== applicationId) || "";
}

function getMatchPhase(match = {}) {
  if (!match?.id || isTerminalMatch(match)) return "none";
  if (isCancellable(match)) return "committed_meeting";
  return isProposalStage(match) ? "proposal" : "none";
}

function getRefundPrivateRef(db, applicationId) {
  return db.collection("twoweeksDepositRefundPrivate").doc(applicationId);
}

function getWithdrawalPrivateRef(db, applicationId) {
  return db.collection("twoweeksWithdrawalPrivate").doc(applicationId);
}

function isRefundRequestPending(deposit = {}) {
  return deposit?.refundRequest?.status === "requested" || deposit?.status === "refund_requested";
}

function makeHistoryEntry({ id, type, amount, balanceAfter, note, matchId = "" }) {
  return {
    id,
    type,
    amount: Number(amount || 0),
    balanceAfter: Number(balanceAfter || 0),
    note: safeString(note, 160),
    matchId,
    createdAtClient: new Date().toISOString(),
  };
}

function appendHistory(history = [], entry = {}) {
  const rows = Array.isArray(history) ? history : [];
  if (rows.some((item) => item?.id === entry.id)) return rows;
  return [...rows, entry];
}

function validateReason(reasonCode = "", reasonDetail = "") {
  const code = safeString(reasonCode, 50);
  if (!code) {
    return { code: "not_provided", label: "응답하지 않음", detail: "" };
  }
  if (!WITHDRAWAL_REASONS[code]) {
    throw new HttpsError("invalid-argument", "탈퇴 사유를 선택해주세요.");
  }

  const detail = safeString(reasonDetail, 500);
  if (code === "other" && detail.length < 2) {
    throw new HttpsError("invalid-argument", "기타 사유를 간단히 작성해주세요.");
  }

  return { code, label: WITHDRAWAL_REASONS[code], detail };
}

function validateRefundAccount({ application, deposit, bankName, accountNumber, accountHolder }) {
  if (getBalance(deposit) <= 0 || isRefundRequestPending(deposit)) return null;

  const cleanBankName = safeString(bankName, 30);
  const cleanAccountNumber = normalizeAccountNumber(accountNumber);
  const cleanAccountHolder = safeString(accountHolder, 40);
  if (!cleanBankName || onlyDigits(cleanAccountNumber).length < 6 || !cleanAccountHolder) {
    throw new HttpsError(
      "invalid-argument",
      "예치금 반환을 위해 은행, 계좌번호, 예금주를 확인해주세요."
    );
  }

  const registeredName = safeString(application?.basic?.name, 40);
  if (
    registeredName &&
    normalizeAccountHolder(cleanAccountHolder) !== normalizeAccountHolder(registeredName)
  ) {
    throw new HttpsError(
      "invalid-argument",
      `예금주는 신청자 본인 명의(${registeredName})로 입력해주세요.`
    );
  }

  return {
    bankName: cleanBankName,
    accountNumber: cleanAccountNumber,
    accountHolder: cleanAccountHolder,
    accountLast4: getAccountLast4(cleanAccountNumber),
  };
}

async function getMatchesForApplication(db, applicationId) {
  const [maleSnap, femaleSnap] = await Promise.all([
    db.collection("twoweeksMatches").where("maleApplicationId", "==", applicationId).limit(30).get(),
    db.collection("twoweeksMatches").where("femaleApplicationId", "==", applicationId).limit(30).get(),
  ]);
  const rows = new Map();
  [...maleSnap.docs, ...femaleSnap.docs].forEach((docSnap) => {
    rows.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
  });
  return [...rows.values()];
}

async function findActiveMatch(db, application = {}) {
  const applicationId = application?.id || "";
  if (!applicationId) return null;

  const currentMatchId = safeString(application?.currentProposal?.matchId, 120);
  if (currentMatchId) {
    const currentSnap = await db.collection("twoweeksMatches").doc(currentMatchId).get();
    if (currentSnap.exists) {
      const current = { id: currentSnap.id, ...currentSnap.data() };
      if (getCounterpartId(current, applicationId) && getMatchPhase(current) !== "none") {
        return current;
      }
    }
  }

  const matches = await getMatchesForApplication(db, applicationId);
  return matches
    .filter((match) => getMatchPhase(match) !== "none")
    .sort((a, b) => getDocumentTimeMs(b) - getDocumentTimeMs(a))[0] || null;
}

async function hasUnresolvedMeetingIssue(db, applicationId) {
  const matches = await getMatchesForApplication(db, applicationId);
  return matches.some((match) => {
    const reviewStatus = String(match?.noShowReviewStatus || "");
    if (["evidence_requested", "needs_admin_review", "issue_reported"].includes(reviewStatus)) {
      return true;
    }
    if (reviewStatus) return false;
    if (match?.feedbackSummary?.needsAdminReview === true) return true;
    return Object.values(match?.feedbacks || {}).some((feedback) =>
      Boolean(
        feedback &&
          feedback.meetingResult &&
          feedback.meetingResult !== "met" &&
          (feedback.issueStatus === "needs_admin_review" ||
            feedback.noShow?.reviewStatus === "needs_admin_review" ||
            feedback.selfNoShow?.reviewStatus === "needs_admin_review")
      )
    );
  });
}

function buildWithdrawalPreview(application = {}, activeMatch = null, unresolvedReview = false) {
  const deposit = application?.deposit || {};
  const balance = getBalance(deposit);
  const requiredBalance = getRequiredBalance(deposit);
  const phase = getMatchPhase(activeMatch || {});
  const cancellationPolicy = phase === "committed_meeting"
    ? getCancellationPolicy(activeMatch, Date.now(), requiredBalance)
    : null;
  const deductionAmount = cancellationPolicy
    ? Math.min(balance, Number(cancellationPolicy.amount || 0))
    : 0;
  const refundAlreadyRequested = isRefundRequestPending(deposit);

  return {
    ok: true,
    applicationId: application.id,
    withdrawalStatus: String(application?.withdrawal?.status || ""),
    balance,
    requiredBalance,
    refundProcessingDays: REFUND_PROCESSING_DAYS,
    refundAlreadyRequested,
    requiresRefundAccount: balance > 0 && !refundAlreadyRequested,
    unresolvedReview,
    activeMatch: activeMatch?.id
      ? {
          matchId: activeMatch.id,
          phase,
          scheduleConfirmed: Boolean(cancellationPolicy && cancellationPolicy.code !== "before_schedule_confirmed"),
          meetingStartAtClient: getMeetingStartAtClient(activeMatch),
        }
      : null,
    cancellation: cancellationPolicy
      ? {
          policyCode: cancellationPolicy.code,
          policyLabel: cancellationPolicy.label,
          deductionAmount,
          refundableAmount: Math.max(0, balance - deductionAmount),
        }
      : {
          policyCode: phase === "proposal" ? "proposal_decline" : "none",
          policyLabel: phase === "proposal" ? "제안 단계 거절" : "차감 없음",
          deductionAmount: 0,
          refundableAmount: balance,
        },
    availableModes: phase === "committed_meeting"
      ? ["after_current_match", "cancel_and_withdraw"]
      : ["immediate"],
  };
}

async function loadPreview(db, applicationId) {
  const appSnap = await db.collection("twoweeksApplications").doc(applicationId).get();
  if (!appSnap.exists) throw new HttpsError("not-found", "신청 정보를 찾을 수 없습니다.");
  const application = { id: appSnap.id, ...appSnap.data() };
  const [activeMatch, unresolvedReview] = await Promise.all([
    findActiveMatch(db, application),
    hasUnresolvedMeetingIssue(db, applicationId),
  ]);
  return {
    application,
    activeMatch,
    unresolvedReview,
    preview: buildWithdrawalPreview(application, activeMatch, unresolvedReview),
  };
}

function getCounterpartReadyPatch(
  counterpart = {},
  matchId = "",
  applicationId = "",
  phase = "none"
) {
  const nowClient = new Date().toISOString();
  if (phase === "proposal") {
    return {
      matchingStatus: "declined",
      scheduleStatus: "not_started",
      meetingStatus: "not_started",
      "currentProposal.candidateApplicationId": applicationId,
      "currentProposal.matchId": matchId,
      "currentProposal.status": "declined",
      "currentProposal.counterpartResponse": "declined",
      "currentProposal.counterpartRespondedAt": admin.firestore.FieldValue.serverTimestamp(),
      "currentProposal.counterpartRespondedAtClient": nowClient,
      "currentProposal.endedByCounterpart": true,
      "currentProposal.outcome": "counterpart_declined",
      lastCounterpartWithdrawal: {
        matchId,
        applicationId,
        atClient: nowClient,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
  }

  const ready = isDepositEligible(counterpart);
  const deleteField = admin.firestore.FieldValue.delete();
  return {
    currentProposal: deleteField,
    schedule: deleteField,
    matchingStatus: ready ? "not_started" : "paused",
    scheduleStatus: "not_started",
    meetingStatus: "not_started",
    nextRoundStatus: ready ? "ready" : "top_up_required",
    lastCounterpartWithdrawal: {
      matchId,
      applicationId,
      atClient: new Date().toISOString(),
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

function getRedactedApplicationPatch({
  application,
  withdrawal,
  deposit,
  nowClient,
}) {
  const deleteField = admin.firestore.FieldValue.delete();
  return {
    uid: "",
    applicantAuthProvider: "withdrawn",
    status: "withdrawn",
    reviewStatus: "withdrawn",
    matchingStatus: "withdrawn",
    matchingAvailability: "withdrawn",
    matchingPauseReason: "withdrawn",
    nextRoundStatus: "withdrawn",
    accountStatus: "withdrawn",
    withdraw: true,
    withdrawn: true,
    withdrawal,
    withdrawnAt: admin.firestore.FieldValue.serverTimestamp(),
    withdrawnAtClient: nowClient,
    basic: {
      name: "",
      nickname: "탈퇴회원",
      phone: "",
      phoneNormalized: "",
      phoneVerified: false,
      phoneVerificationSkipped: false,
    },
    identity: {
      jobCategory: "",
      companyScale: "",
      organizationName: "",
      representativePhoto: null,
      additionalPhotos: [],
      verificationDocument: null,
      verificationDocumentStoredPrivately: false,
    },
    matchingPreferences: {},
    phoneIdentityVerification: {
      verified: false,
      phone: "",
      name: "",
      birth: "",
      gender: "",
      carrier: "",
      verificationId: "",
      withdrawn: true,
    },
    consents: {},
    dashboardAccess: {
      revoked: true,
      revokedReason: "withdrawn",
      revokedAtClient: nowClient,
    },
    deposit,
    currentProposal: deleteField,
    schedule: deleteField,
    phone: deleteField,
    phoneNormalized: deleteField,
    dashboardToken: deleteField,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    previousRoundId: application?.roundId || "",
  };
}

function buildRefundDeposit({ application, balance, account, nowClient, unresolvedReview }) {
  const deposit = application?.deposit || {};
  if (balance <= 0) {
    return {
      deposit: {
        ...deposit,
        balance: 0,
        participationEligible: false,
        status: "withdrawn_no_balance",
        topUpRequiredAmount: 0,
      },
      refundStatus: "not_applicable",
      refundDueAtClient: "",
      refundHistoryAdded: false,
    };
  }

  if (isRefundRequestPending(deposit)) {
    return {
      deposit: { ...deposit, participationEligible: false },
      refundStatus: "requested",
      refundDueAtClient: deposit?.refundRequest?.dueAtClient || "",
      refundHistoryAdded: false,
    };
  }

  if (unresolvedReview) {
    return {
      deposit: {
        ...deposit,
        balance,
        status: "withdrawal_review",
        participationEligible: false,
      },
      refundStatus: "pending_admin_review",
      refundDueAtClient: "",
      refundHistoryAdded: false,
    };
  }

  if (!account) {
    throw new HttpsError("invalid-argument", "예치금 반환 계좌를 확인해주세요.");
  }

  const dueAtClient = new Date(
    Date.now() + REFUND_PROCESSING_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  const historyEntry = makeHistoryEntry({
    id: `withdraw_refund_${application.id}`,
    type: "refund_request",
    amount: balance,
    balanceAfter: balance,
    note: "투윅스 탈퇴 예치금 반환 요청",
  });

  return {
    deposit: {
      ...deposit,
      balance,
      status: "refund_requested",
      participationEligible: false,
      topUpRequiredAmount: 0,
      refundRequest: {
        status: "requested",
        requestedAmount: balance,
        bankName: account.bankName,
        accountLast4: account.accountLast4,
        requestedAt: admin.firestore.FieldValue.serverTimestamp(),
        requestedAtClient: nowClient,
        dueAtClient,
        source: "twoweeks_withdrawal",
        accountStoredPrivately: true,
      },
      history: appendHistory(deposit.history, historyEntry),
    },
    refundStatus: "requested",
    refundDueAtClient: dueAtClient,
    refundHistoryAdded: true,
  };
}

async function revokeDashboardAccess(db, applicationId) {
  const sessionSnap = await db
    .collection("twoweeksDashboardSessions")
    .where("applicationId", "==", applicationId)
    .limit(100)
    .get();
  const batch = db.batch();
  sessionSnap.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
  batch.set(
    db.collection("twoweeksDashboardAccess").doc(applicationId),
    {
      revoked: true,
      revokedReason: "withdrawn",
      revokedAt: admin.firestore.FieldValue.serverTimestamp(),
      tokenHash: admin.firestore.FieldValue.delete(),
      ownerUid: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  await batch.commit();
}

async function anonymizeHistoricalMatches(db, applicationId) {
  const matches = await getMatchesForApplication(db, applicationId);
  for (let index = 0; index < matches.length; index += 400) {
    const chunk = matches.slice(index, index + 400);
    const batch = db.batch();
    chunk.forEach((match) => {
      const patch = {
        [`candidatePreviews.${applicationId}`]: admin.firestore.FieldValue.delete(),
        [`feedbacks.${applicationId}`]: admin.firestore.FieldValue.delete(),
        [`contactVisibilityByApplicationId.${applicationId}`]: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (match.maleApplicationId === applicationId) {
        patch.maleName = "탈퇴회원";
        patch["proposalSms.male.phone"] = admin.firestore.FieldValue.delete();
      }
      if (match.femaleApplicationId === applicationId) {
        patch.femaleName = "탈퇴회원";
        patch["proposalSms.female.phone"] = admin.firestore.FieldValue.delete();
      }
      batch.set(db.collection("twoweeksMatches").doc(match.id), patch, { merge: true });
    });
    await batch.commit();
  }
}

async function cleanupPrivateApplicationData(db, applicationId) {
  const [verificationSnap, claimSnap] = await Promise.all([
    db
      .collection("twoweeksIdentityVerifications")
      .where("applicationId", "==", applicationId)
      .limit(20)
      .get()
      .catch(() => null),
    db
      .collection("twoweeksIdentityClaims")
      .where("applicationId", "==", applicationId)
      .limit(20)
      .get()
      .catch(() => null),
  ]);
  const batch = db.batch();
  batch.delete(db.collection("twoweeksApplicationPrivate").doc(applicationId));
  verificationSnap?.docs?.forEach((docSnap) => batch.delete(docSnap.ref));
  claimSnap?.docs?.forEach((docSnap) => batch.delete(docSnap.ref));
  await batch.commit().catch((error) => {
    console.error("[twoWeeksWithdrawal] private data cleanup failed:", error?.message || error);
  });
  try {
    await admin.storage().bucket().deleteFiles({ prefix: `twoweeksApplications/${applicationId}/` });
  } catch (error) {
    console.error("[twoWeeksWithdrawal] storage cleanup failed:", error?.message || error);
  }
}

async function sendWithdrawalNotifications({
  db,
  applicationId,
  result,
  counterpart,
  matchId,
  refundAccount,
}) {
  const userLines = [
    "[투윅스] 탈퇴 처리가 완료되었습니다.",
    result.applicantName ? `${result.applicantName}님의 투윅스 이용이 종료되었습니다.` : "투윅스 이용이 종료되었습니다.",
    result.deductionAmount > 0 ? `예치금 차감: ${formatWon(result.deductionAmount)}` : "",
    result.refundAmount > 0 && result.refundStatus === "requested"
      ? `반환 예정액: ${formatWon(result.refundAmount)} (접수 후 ${REFUND_PROCESSING_DAYS}일 이내)`
      : "",
    result.refundStatus === "pending_admin_review"
      ? "예치금은 운영자 확인 후 반환 가능 금액을 별도로 안내드립니다."
      : "",
  ].filter(Boolean);

  const adminLines = [
    "[투윅스] 회원 탈퇴 요청 처리",
    `신청자: ${result.applicantName || "신청자"}`,
    `사유: ${result.reasonLabel}`,
    `처리방식: ${result.mode}`,
    matchId ? `매칭ID: ${matchId}` : "진행 중 매칭 없음",
    result.deductionAmount > 0 ? `차감: ${formatWon(result.deductionAmount)}` : "차감 없음",
    result.refundAmount > 0 ? `반환 예정: ${formatWon(result.refundAmount)}` : "반환 잔액 없음",
    result.refundStatus === "pending_admin_review" ? "운영자 확인 후 반환액 확정 필요" : "",
    ...getRefundAccountSmsLines(refundAccount, result.refundAmount),
    result.refundStatus === "requested" ? "관리자 예치금 관리에서 계좌 확인 후 입금 필요" : "",
    `신청ID: ${applicationId}`,
  ].filter(Boolean);

  const tasks = [
    sendLmsDirect({
      to: result.phone,
      subject: "투윅스 탈퇴 처리 안내",
      message: userLines.join("\n"),
    }),
    sendTwoWeeksAdminSms({
      subject: "투윅스 회원 탈퇴",
      message: adminLines.join("\n"),
    }),
  ];

  if (counterpart?.id) {
    tasks.push(
      sendLmsDirect({
        to: getPhone(counterpart),
        subject: "투윅스 매칭 결과 안내",
        message: [
          "[투윅스] 이번 매칭 결과 안내",
          `${getName(counterpart)}님, 상대방이 이번 매칭 진행을 취소했습니다.`,
          "회원님에게는 예치금 차감이 없으며 다음 매칭을 준비해드리겠습니다.",
        ].join("\n"),
      })
    );
  }

  const notificationResults = await Promise.allSettled(tasks);
  await db.collection("twoweeksWithdrawalLogs").doc(applicationId).set(
    {
      notificationResults: notificationResults.map((item) =>
        item.status === "fulfilled"
          ? item.value
          : { status: "failed", errorMessage: item.reason?.message || String(item.reason) }
      ),
      notificationsHandledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  if (!["requested", "pending_admin_review"].includes(result.refundStatus)) {
    await getWithdrawalPrivateRef(db, applicationId).set(
      {
        phone: admin.firestore.FieldValue.delete(),
        applicantName: admin.firestore.FieldValue.delete(),
        bankName: admin.firestore.FieldValue.delete(),
        accountNumber: admin.firestore.FieldValue.delete(),
        accountHolder: admin.firestore.FieldValue.delete(),
        accountLast4: admin.firestore.FieldValue.delete(),
        piiClearedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    ).catch(() => {});
  }
}

async function scheduleAfterCurrentMatch({
  request,
  application,
  activeMatch,
  reason,
  account,
}) {
  if (getMatchPhase(activeMatch) !== "committed_meeting") {
    throw new HttpsError(
      "failed-precondition",
      "현재 진행 중인 만남이 없어 즉시 탈퇴 방식으로 다시 확인해주세요."
    );
  }

  const db = admin.firestore();
  const appRef = db.collection("twoweeksApplications").doc(application.id);
  const matchRef = db.collection("twoweeksMatches").doc(activeMatch.id);
  const privateRef = getWithdrawalPrivateRef(db, application.id);
  const nowClient = new Date().toISOString();
  const balance = getBalance(application.deposit || {});

  await db.runTransaction(async (tx) => {
    const [freshSnap, matchSnap] = await Promise.all([tx.get(appRef), tx.get(matchRef)]);
    if (!freshSnap.exists) throw new HttpsError("not-found", "신청 정보를 찾을 수 없습니다.");
    if (!matchSnap.exists || !isCancellable({ id: matchSnap.id, ...matchSnap.data() })) {
      throw new HttpsError(
        "aborted",
        "매칭 상태가 변경되었습니다. 화면을 새로고침한 뒤 다시 확인해주세요."
      );
    }
    const fresh = { id: freshSnap.id, ...freshSnap.data() };
    if (fresh?.withdrawal?.status === "scheduled_after_match") return;
    if (safeString(fresh?.currentProposal?.matchId, 120) !== activeMatch.id) {
      throw new HttpsError(
        "aborted",
        "매칭 상태가 변경되었습니다. 화면을 새로고침한 뒤 다시 확인해주세요."
      );
    }

    tx.set(
      appRef,
      {
        matchingAvailability: "paused",
        futureMatchingDisabled: true,
        nextRoundStatus: "withdrawal_scheduled",
        withdrawal: {
          status: "scheduled_after_match",
          mode: "after_current_match",
          reasonCode: reason.code,
          reasonLabel: reason.label,
          activeMatchId: activeMatch.id,
          requestedAt: admin.firestore.FieldValue.serverTimestamp(),
          requestedAtClient: nowClient,
          requestedByAuthUidHash: hashValue(request.auth.uid),
          expectedRefundAmount: balance,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    tx.set(
      privateRef,
      {
        applicationId: application.id,
        status: "scheduled_after_match",
        mode: "after_current_match",
        reasonCode: reason.code,
        reasonLabel: reason.label,
        reasonDetail: reason.detail,
        applicantName: application?.basic?.name || "",
        phone: getPhone(application),
        requestedByAuthUidHash: hashValue(request.auth.uid),
        ...(account || {}),
        requestedAt: admin.firestore.FieldValue.serverTimestamp(),
        requestedAtClient: nowClient,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  await Promise.allSettled([
    sendLmsDirect({
      to: getPhone(application),
      subject: "투윅스 탈퇴 예약 안내",
      message: [
        "[투윅스] 현재 만남 후 탈퇴가 예약되었습니다.",
        "현재 상대와의 만남 및 일정은 그대로 진행됩니다.",
        "다음 매칭은 지금부터 중단되며, 만남 정리 후 탈퇴와 예치금 반환 요청으로 전환됩니다.",
      ].join("\n"),
    }),
    sendTwoWeeksAdminSms({
      subject: "투윅스 탈퇴 예약",
      message: [
        "[투윅스] 현재 만남 후 탈퇴 예약",
        `신청자: ${getName(application)}`,
        `예상 반환액: ${formatWon(balance)}`,
        ...getRefundAccountSmsLines(account, balance),
        `매칭ID: ${activeMatch.id}`,
        "현재 만남은 유지되며, 만남 정리 후 반환 요청으로 자동 전환됩니다.",
      ].join("\n"),
    }),
  ]);

  return {
    ok: true,
    status: "scheduled_after_match",
    mode: "after_current_match",
    refundAmount: balance,
    matchId: activeMatch.id,
  };
}

async function processImmediateWithdrawal({
  request,
  application,
  activeMatch,
  unresolvedReview,
  reason,
  account,
  mode,
}) {
  const db = admin.firestore();
  const appRef = db.collection("twoweeksApplications").doc(application.id);
  const matchRef = activeMatch?.id
    ? db.collection("twoweeksMatches").doc(activeMatch.id)
    : null;
  const counterpartId = activeMatch ? getCounterpartId(activeMatch, application.id) : "";
  const counterpartRef = counterpartId
    ? db.collection("twoweeksApplications").doc(counterpartId)
    : null;
  const refundPrivateRef = getRefundPrivateRef(db, application.id);
  const withdrawalPrivateRef = getWithdrawalPrivateRef(db, application.id);
  const accessRef = db.collection("twoweeksDashboardAccess").doc(application.id);
  const logRef = db.collection("twoweeksWithdrawalLogs").doc(application.id);
  const responseRef = counterpartId
    ? db.collection("twoweeksProposalResponses").doc(`${application.id}_${counterpartId}`)
    : null;
  const linkedSessionSnap = await db
    .collection("twoweeksDashboardSessions")
    .where("applicationId", "==", application.id)
    .limit(100)
    .get();
  const sessionRef = request.auth.uid && request.auth.uid !== "system"
    ? linkedSessionSnap.docs.find((docSnap) => docSnap.id === request.auth.uid)?.ref || null
    : null;
  const linkedSessionRefs = linkedSessionSnap.docs
    .map((docSnap) => docSnap.ref)
    .filter((ref) => !sessionRef || ref.path !== sessionRef.path);
  const nowClient = new Date().toISOString();
  let result = null;
  let counterpart = null;
  let refundAccountForNotification = account || null;

  await db.runTransaction(async (tx) => {
    const readRefs = [appRef, refundPrivateRef];
    if (matchRef) readRefs.push(matchRef);
    if (counterpartRef) readRefs.push(counterpartRef);
    const snaps = await Promise.all(readRefs.map((ref) => tx.get(ref)));
    const freshAppSnap = snaps[0];
    const refundPrivateSnap = snaps[1];
    if (!freshAppSnap.exists) throw new HttpsError("not-found", "신청 정보를 찾을 수 없습니다.");
    const fresh = { id: freshAppSnap.id, ...freshAppSnap.data() };

    if (fresh?.withdrawal?.status === "completed") {
      result = {
        ok: true,
        alreadyCompleted: true,
        status: "completed",
        mode: fresh?.withdrawal?.mode || mode,
        refundAmount: Number(fresh?.withdrawal?.refundAmount || 0),
        deductionAmount: Number(fresh?.withdrawal?.deductionAmount || 0),
      };
      return;
    }

    const freshCurrentMatchId = safeString(fresh?.currentProposal?.matchId, 120);
    if (freshCurrentMatchId && freshCurrentMatchId !== activeMatch?.id) {
      throw new HttpsError(
        "aborted",
        "매칭 상태가 변경되었습니다. 화면을 새로고침한 뒤 다시 확인해주세요."
      );
    }

    let match = null;
    let phase = "none";
    let deductionAmount = 0;
    let cancellationPolicy = null;
    let balanceBefore = getBalance(fresh.deposit || {});
    const requiredBalance = getRequiredBalance(fresh.deposit || {});
    let balanceAfter = balanceBefore;
    let nextDeposit = { ...(fresh.deposit || {}) };
    let nextHistory = Array.isArray(nextDeposit.history) ? nextDeposit.history : [];

    if (matchRef) {
      const matchSnap = snaps[2];
      if (!matchSnap.exists) throw new HttpsError("not-found", "진행 중인 매칭을 찾을 수 없습니다.");
      match = { id: matchSnap.id, ...matchSnap.data() };
      phase = getMatchPhase(match);
      if (phase === "none") {
        throw new HttpsError(
          "aborted",
          "매칭 상태가 변경되었습니다. 화면을 새로고침한 뒤 다시 확인해주세요."
        );
      }
      if (phase === "committed_meeting" && mode !== "cancel_and_withdraw") {
        throw new HttpsError(
          "failed-precondition",
          "진행 중인 만남을 유지하려면 '현재 만남 후 탈퇴'를 선택해주세요."
        );
      }
      if (phase === "committed_meeting") {
        cancellationPolicy = getCancellationPolicy(match, Date.now(), requiredBalance);
        deductionAmount = Math.min(balanceBefore, Number(cancellationPolicy.amount || 0));
        balanceAfter = Math.max(0, balanceBefore - deductionAmount);
        nextHistory = appendHistory(
          nextHistory,
          makeHistoryEntry({
            id: `withdraw_cancel_${match.id}_${application.id}`,
            type: "deduction",
            amount: deductionAmount,
            balanceAfter,
            note: `${cancellationPolicy.label} 탈퇴 취소 차감`,
            matchId: match.id,
          })
        );
        nextDeposit = {
          ...nextDeposit,
          balance: balanceAfter,
          totalDeducted: Number(nextDeposit.totalDeducted || 0) + deductionAmount,
          lastDeductionAmount: deductionAmount,
          lastDeductionReason: cancellationPolicy.code,
          lastDeductedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastDeductedAtClient: nowClient,
          history: nextHistory,
        };
      }
    }

    const accountForRefund = account || (
      refundPrivateSnap.exists
        ? {
            bankName: refundPrivateSnap.data()?.bankName || "",
            accountNumber: refundPrivateSnap.data()?.accountNumber || "",
            accountHolder: refundPrivateSnap.data()?.accountHolder || "",
            accountLast4: refundPrivateSnap.data()?.accountLast4 || "",
          }
        : null
    );
    refundAccountForNotification = accountForRefund
      ? {
          bankName: accountForRefund.bankName || "",
          accountNumber: accountForRefund.accountNumber || "",
          accountHolder: accountForRefund.accountHolder || "",
        }
      : null;
    const refundBuild = buildRefundDeposit({
      application: { ...fresh, deposit: nextDeposit },
      balance: balanceAfter,
      account: accountForRefund,
      nowClient,
      unresolvedReview,
    });
    nextDeposit = refundBuild.deposit;

    const withdrawal = {
      status: "completed",
      mode,
      reasonCode: reason.code,
      reasonLabel: reason.label,
      activeMatchId: match?.id || "",
      activeMatchPhase: phase,
      deductionPolicyCode: cancellationPolicy?.code || "",
      deductionPolicyLabel: cancellationPolicy?.label || "",
      deductionAmount,
      refundAmount: balanceAfter,
      refundStatus: refundBuild.refundStatus,
      refundDueAtClient: refundBuild.refundDueAtClient,
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
      requestedAtClient: nowClient,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      completedAtClient: nowClient,
    };

    tx.set(
      appRef,
      getRedactedApplicationPatch({
        application: fresh,
        withdrawal,
        deposit: nextDeposit,
        nowClient,
      }),
      { merge: true }
    );

    if (match && counterpartRef) {
      const counterpartSnap = snaps[3];
      if (!counterpartSnap?.exists) {
        throw new HttpsError("not-found", "상대방 신청 정보를 찾을 수 없습니다.");
      }
      counterpart = { id: counterpartSnap.id, ...counterpartSnap.data() };
      tx.set(
        counterpartRef,
        getCounterpartReadyPatch(counterpart, match.id, application.id, phase),
        { merge: true }
      );

      const matchPatch = {
        status: phase === "committed_meeting" ? "cancelled" : "declined",
        proposalStatus: phase === "committed_meeting" ? "cancelled" : "declined",
        scheduleStatus: phase === "committed_meeting" ? "cancelled" : "not_started",
        meetingStatus: phase === "committed_meeting" ? "cancelled" : "not_started",
        photoRevealStatus: "hidden",
        withdrawnByApplicationId: application.id,
        ...(phase === "proposal"
          ? {
              declinedByApplicationId: application.id,
              declinedCounterpartApplicationId: counterpart.id,
              declinedAt: admin.firestore.FieldValue.serverTimestamp(),
              declinedAtClient: nowClient,
            }
          : {}),
        withdrawal: {
          status: "completed",
          mode,
          byApplicationId: application.id,
          counterpartApplicationId: counterpart.id,
          deductionAmount,
          policyCode: cancellationPolicy?.code || "proposal_decline",
          at: admin.firestore.FieldValue.serverTimestamp(),
          atClient: nowClient,
        },
        [`candidatePreviews.${application.id}`]: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (match.maleApplicationId === application.id) matchPatch.maleName = "탈퇴회원";
      if (match.femaleApplicationId === application.id) matchPatch.femaleName = "탈퇴회원";
      tx.set(matchRef, matchPatch, { merge: true });

      if (responseRef) {
        tx.set(
          responseRef,
          {
            viewerApplicationId: application.id,
            candidateApplicationId: counterpart.id,
            matchId: match.id,
            response: "declined",
            declineReasonCode: "account_withdrawal",
            respondedAt: admin.firestore.FieldValue.serverTimestamp(),
            respondedAtClient: nowClient,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    }

    if (balanceAfter > 0 && refundBuild.refundStatus === "requested" && accountForRefund) {
      tx.set(
        refundPrivateRef,
        {
          applicationId: application.id,
          status: "requested",
          requestedAmount: balanceAfter,
          bankName: accountForRefund.bankName,
          accountNumber: accountForRefund.accountNumber,
          accountHolder: accountForRefund.accountHolder,
          accountLast4: accountForRefund.accountLast4 || getAccountLast4(accountForRefund.accountNumber),
          requestedAt: admin.firestore.FieldValue.serverTimestamp(),
          requestedAtClient: nowClient,
          dueAtClient: refundBuild.refundDueAtClient,
          source: "twoweeks_withdrawal",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    tx.set(
      withdrawalPrivateRef,
      {
        applicationId: application.id,
        status: "completed",
        mode,
        reasonCode: reason.code,
        reasonLabel: reason.label,
        reasonDetail: reason.detail,
        applicantName: fresh?.basic?.name || "",
        phone: getPhone(fresh),
        ...(request.auth.uid !== "system"
          ? { requestedByAuthUidHash: hashValue(request.auth.uid) }
          : {}),
        ...(accountForRefund || {}),
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAtClient: nowClient,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    tx.set(
      logRef,
      {
        applicationId: application.id,
        previousOwnerUidHash: hashValue(fresh.uid || ""),
        phoneHash: hashValue(getPhone(fresh)),
        phoneLast4: getPhone(fresh).slice(-4),
        reasonCode: reason.code,
        reasonLabel: reason.label,
        mode,
        activeMatchId: match?.id || "",
        deductionAmount,
        refundAmount: balanceAfter,
        refundStatus: refundBuild.refundStatus,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAtClient: nowClient,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    tx.set(
      accessRef,
      {
        revoked: true,
        revokedReason: "withdrawn",
        revokedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    if (sessionRef) {
      tx.set(
        sessionRef,
        {
          revoked: true,
          revokedReason: "withdrawn",
          revokedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
    linkedSessionRefs.forEach((ref) => {
      tx.set(
        ref,
        {
          revoked: true,
          revokedReason: "withdrawn",
          revokedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    result = {
      ok: true,
      status: "completed",
      mode,
      applicantName: fresh?.basic?.name || getName(fresh),
      phone: getPhone(fresh),
      reasonLabel: reason.label,
      deductionAmount,
      refundAmount: balanceAfter,
      refundStatus: refundBuild.refundStatus,
      refundDueAtClient: refundBuild.refundDueAtClient,
      matchId: match?.id || "",
    };
  });

  if (!result || result.alreadyCompleted) return result || { ok: true };

  await Promise.allSettled([
    revokeDashboardAccess(db, application.id),
    anonymizeHistoricalMatches(db, application.id),
    cleanupPrivateApplicationData(db, application.id),
  ]);
  await sendWithdrawalNotifications({
    db,
    applicationId: application.id,
    result,
    counterpart,
    matchId: result.matchId,
    refundAccount: refundAccountForNotification,
  });
  return result;
}

const getTwoWeeksWithdrawalPreview = onCall(
  { region: REGION, timeoutSeconds: 60, memory: "256MiB" },
  async (request) => {
    if (!request.auth?.uid) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    const applicationId = safeString(request.data?.applicationId, 120);
    if (!applicationId) throw new HttpsError("invalid-argument", "신청 정보가 필요합니다.");
    await assertApplicationOwner(request, applicationId, { allowAdmin: false });
    const loaded = await loadPreview(admin.firestore(), applicationId);
    return loaded.preview;
  }
);

const requestTwoWeeksWithdrawal = onCall(
  { region: REGION, timeoutSeconds: 180, memory: "512MiB" },
  async (request) => {
    if (!request.auth?.uid) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    const applicationId = safeString(request.data?.applicationId, 120);
    if (!applicationId) throw new HttpsError("invalid-argument", "신청 정보가 필요합니다.");
    const db = admin.firestore();
    try {
      await assertApplicationOwner(request, applicationId, { allowAdmin: false });
    } catch (authError) {
      const [appSnap, privateSnap] = await Promise.all([
        db.collection("twoweeksApplications").doc(applicationId).get(),
        getWithdrawalPrivateRef(db, applicationId).get(),
      ]);
      const application = appSnap.exists ? appSnap.data() || {} : {};
      const privateData = privateSnap.exists ? privateSnap.data() || {} : {};
      const sameRequester =
        String(privateData.requestedByAuthUidHash || "") === hashValue(request.auth.uid || "");
      if (sameRequester && application?.withdrawal?.status === "completed") {
        return {
          ok: true,
          alreadyCompleted: true,
          status: "completed",
          mode: application?.withdrawal?.mode || "immediate",
          deductionAmount: Number(application?.withdrawal?.deductionAmount || 0),
          refundAmount: Number(application?.withdrawal?.refundAmount || 0),
          refundStatus: application?.withdrawal?.refundStatus || "",
          refundDueAtClient: application?.withdrawal?.refundDueAtClient || "",
        };
      }
      throw authError;
    }

    const reason = validateReason(request.data?.reasonCode, request.data?.reasonDetail);
    const mode = safeString(request.data?.mode, 40) || "immediate";
    if (!["immediate", "after_current_match", "cancel_and_withdraw"].includes(mode)) {
      throw new HttpsError("invalid-argument", "탈퇴 처리 방식을 다시 선택해주세요.");
    }
    if (request.data?.confirmed !== true) {
      throw new HttpsError("invalid-argument", "탈퇴 및 예치금 안내를 확인해주세요.");
    }

    const loaded = await loadPreview(db, applicationId);
    if (loaded.application?.withdrawal?.status === "completed") {
      return {
        ok: true,
        alreadyCompleted: true,
        status: "completed",
        mode: loaded.application?.withdrawal?.mode || mode,
      };
    }

    const phase = getMatchPhase(loaded.activeMatch || {});
    if (phase === "committed_meeting" && mode === "immediate") {
      throw new HttpsError(
        "failed-precondition",
        "진행 중인 만남을 유지하거나 취소하는 방식을 선택해주세요."
      );
    }
    if (phase !== "committed_meeting" && mode !== "immediate") {
      throw new HttpsError(
        "failed-precondition",
        "현재 매칭 단계가 변경되었습니다. 다시 확인해주세요."
      );
    }

    const expectedRefundAmount = mode === "cancel_and_withdraw"
      ? Number(loaded.preview?.cancellation?.refundableAmount || 0)
      : getBalance(loaded.application.deposit || {});
    const account = validateRefundAccount({
      application: loaded.application,
      deposit: {
        ...(loaded.application.deposit || {}),
        balance: expectedRefundAmount,
      },
      bankName: request.data?.bankName,
      accountNumber: request.data?.accountNumber,
      accountHolder: request.data?.accountHolder,
    });

    if (mode === "after_current_match") {
      return scheduleAfterCurrentMatch({
        request,
        application: loaded.application,
        activeMatch: loaded.activeMatch,
        reason,
        account,
      });
    }

    return processImmediateWithdrawal({
      request,
      application: loaded.application,
      activeMatch: loaded.activeMatch,
      unresolvedReview: loaded.unresolvedReview,
      reason,
      account,
      mode,
    });
  }
);

async function finalizeScheduledWithdrawal(applicationId) {
  const db = admin.firestore();
  const appRef = db.collection("twoweeksApplications").doc(applicationId);
  const privateRef = getWithdrawalPrivateRef(db, applicationId);
  const [appSnap, privateSnap] = await Promise.all([appRef.get(), privateRef.get()]);
  if (!appSnap.exists || !privateSnap.exists) return null;

  const application = { id: appSnap.id, ...appSnap.data() };
  if (application?.withdrawal?.status !== "scheduled_after_match") return null;
  if (application?.currentProposal?.matchId) return null;
  if (["admin_review", "evidence_requested"].includes(String(application?.nextRoundStatus || ""))) {
    return null;
  }

  const privateData = privateSnap.data() || {};
  const unresolvedReview = await hasUnresolvedMeetingIssue(db, applicationId);
  const syntheticRequest = {
    auth: { uid: "system" },
  };
  const account = privateData.accountNumber
    ? {
        bankName: privateData.bankName || "",
        accountNumber: privateData.accountNumber || "",
        accountHolder: privateData.accountHolder || "",
        accountLast4: privateData.accountLast4 || getAccountLast4(privateData.accountNumber),
      }
    : null;
  const reason = {
    code: privateData.reasonCode || application?.withdrawal?.reasonCode || "other",
    label: privateData.reasonLabel || application?.withdrawal?.reasonLabel || "기타",
    detail: privateData.reasonDetail || "",
  };

  return processImmediateWithdrawal({
    request: syntheticRequest,
    application,
    activeMatch: null,
    unresolvedReview,
    reason,
    account,
    mode: "after_current_match",
  });
}

async function activateReviewedWithdrawalRefund(applicationId) {
  const db = admin.firestore();
  const appRef = db.collection("twoweeksApplications").doc(applicationId);
  const withdrawalPrivateRef = getWithdrawalPrivateRef(db, applicationId);
  const refundPrivateRef = getRefundPrivateRef(db, applicationId);
  const appSnap = await appRef.get();
  if (!appSnap.exists) return null;

  const application = { id: appSnap.id, ...appSnap.data() };
  if (
    application?.withdrawal?.status !== "completed" ||
    application?.withdrawal?.refundStatus !== "pending_admin_review"
  ) {
    return null;
  }
  if (await hasUnresolvedMeetingIssue(db, applicationId)) return null;

  let result = null;
  await db.runTransaction(async (tx) => {
    const [freshSnap, privateSnap] = await Promise.all([
      tx.get(appRef),
      tx.get(withdrawalPrivateRef),
    ]);
    if (!freshSnap.exists || !privateSnap.exists) return;
    const fresh = { id: freshSnap.id, ...freshSnap.data() };
    const privateData = privateSnap.data() || {};
    if (
      fresh?.withdrawal?.status !== "completed" ||
      fresh?.withdrawal?.refundStatus !== "pending_admin_review"
    ) {
      return;
    }

    const balance = getBalance(fresh.deposit || {});
    const nowClient = new Date().toISOString();
    if (balance <= 0) {
      tx.set(
        appRef,
        {
          status: "withdrawn",
          reviewStatus: "withdrawn",
          matchingStatus: "withdrawn",
          matchingAvailability: "withdrawn",
          nextRoundStatus: "withdrawn",
          "withdrawal.refundStatus": "not_applicable",
          "withdrawal.refundAmount": 0,
          "deposit.status": "withdrawn_no_balance",
          "deposit.balance": 0,
          "deposit.participationEligible": false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      result = { refundAmount: 0, phone: privateData.phone || "", applicantName: privateData.applicantName || "" };
      return;
    }

    const account = {
      bankName: safeString(privateData.bankName, 30),
      accountNumber: normalizeAccountNumber(privateData.accountNumber),
      accountHolder: safeString(privateData.accountHolder, 40),
      accountLast4: privateData.accountLast4 || getAccountLast4(privateData.accountNumber),
    };
    if (!account.bankName || onlyDigits(account.accountNumber).length < 6 || !account.accountHolder) {
      throw new Error("탈퇴 반환 계좌정보를 확인할 수 없습니다.");
    }

    const dueAtClient = new Date(
      Date.now() + REFUND_PROCESSING_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();
    const historyEntry = makeHistoryEntry({
      id: `withdraw_review_refund_${applicationId}`,
      type: "refund_request",
      amount: balance,
      balanceAfter: balance,
      note: "운영자 검토 완료 후 탈퇴 예치금 반환 요청",
    });

    tx.set(
      appRef,
      {
        status: "withdrawn",
        reviewStatus: "withdrawn",
        matchingStatus: "withdrawn",
        matchingAvailability: "withdrawn",
        nextRoundStatus: "withdrawn",
        "withdrawal.refundStatus": "requested",
        "withdrawal.refundAmount": balance,
        "withdrawal.refundDueAtClient": dueAtClient,
        "deposit.status": "refund_requested",
        "deposit.balance": balance,
        "deposit.participationEligible": false,
        "deposit.topUpRequiredAmount": 0,
        "deposit.refundRequest": {
          status: "requested",
          requestedAmount: balance,
          bankName: account.bankName,
          accountLast4: account.accountLast4,
          requestedAt: admin.firestore.FieldValue.serverTimestamp(),
          requestedAtClient: nowClient,
          dueAtClient,
          source: "twoweeks_withdrawal_after_admin_review",
          accountStoredPrivately: true,
        },
        "deposit.history": appendHistory(fresh?.deposit?.history, historyEntry),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    tx.set(
      refundPrivateRef,
      {
        applicationId,
        status: "requested",
        requestedAmount: balance,
        ...account,
        requestedAt: admin.firestore.FieldValue.serverTimestamp(),
        requestedAtClient: nowClient,
        dueAtClient,
        source: "twoweeks_withdrawal_after_admin_review",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    tx.set(
      withdrawalPrivateRef,
      {
        refundStatus: "requested",
        refundAmount: balance,
        refundDueAtClient: dueAtClient,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    result = {
      refundAmount: balance,
      phone: privateData.phone || "",
      applicantName: privateData.applicantName || "",
      refundAccount: account,
    };
  });

  if (!result) return null;
  const messages = [];
  if (result.refundAmount > 0) {
    messages.push(
      sendLmsDirect({
        to: result.phone,
        subject: "투윅스 예치금 반환 안내",
        message: [
          "[투윅스] 예치금 반환 요청 접수",
          `${result.applicantName || "회원"}님, 운영자 확인이 완료되었습니다.`,
          `반환 예정액: ${formatWon(result.refundAmount)}`,
          `접수 후 ${REFUND_PROCESSING_DAYS}일 이내 입력하신 계좌로 반환됩니다.`,
        ].join("\n"),
      }),
      sendTwoWeeksAdminSms({
        subject: "투윅스 탈퇴 반환 확정",
        message: [
          "[투윅스] 탈퇴회원 예치금 반환 확정",
          `신청자: ${result.applicantName || "신청자"}`,
          `반환 예정액: ${formatWon(result.refundAmount)}`,
          ...getRefundAccountSmsLines(result.refundAccount, result.refundAmount),
          "관리자 예치금 관리에서 계좌 확인 후 입금해주세요.",
          `신청ID: ${applicationId}`,
        ].join("\n"),
      })
    );
  } else {
    messages.push(
      sendLmsDirect({
        to: result.phone,
        subject: "투윅스 예치금 검토 안내",
        message: [
          "[투윅스] 예치금 검토가 완료되었습니다.",
          `${result.applicantName || "회원"}님, 취소·불참 정책 반영 후 반환 가능한 예치금 잔액은 없습니다.`,
          "자세한 확인이 필요하면 고객상담으로 문의해주세요.",
        ].join("\n"),
      }),
      sendTwoWeeksAdminSms({
        subject: "투윅스 탈퇴 반환 없음",
        message: [
          "[투윅스] 탈퇴회원 예치금 검토 완료",
          `신청자: ${result.applicantName || "신청자"}`,
          "정책 반영 후 반환 잔액 없음",
          `신청ID: ${applicationId}`,
        ].join("\n"),
      })
    );
  }
  await Promise.allSettled(messages);
  if (result.refundAmount <= 0) {
    await withdrawalPrivateRef.set(
      {
        phone: admin.firestore.FieldValue.delete(),
        applicantName: admin.firestore.FieldValue.delete(),
        bankName: admin.firestore.FieldValue.delete(),
        accountNumber: admin.firestore.FieldValue.delete(),
        accountHolder: admin.firestore.FieldValue.delete(),
        accountLast4: admin.firestore.FieldValue.delete(),
        piiClearedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    ).catch(() => {});
  }
  return result;
}

const finalizeScheduledTwoWeeksWithdrawal = onDocumentUpdated(
  {
    region: REGION,
    document: "twoweeksApplications/{applicationId}",
    timeoutSeconds: 180,
    memory: "512MiB",
  },
  async (event) => {
    const before = event.data?.before?.data() || {};
    const after = event.data?.after?.data() || {};
    if (after?.withdrawal?.status !== "scheduled_after_match") return null;
    if (after?.currentProposal?.matchId) return null;
    if (
      before?.currentProposal?.matchId === after?.currentProposal?.matchId &&
      before?.nextRoundStatus === after?.nextRoundStatus
    ) {
      return null;
    }

    try {
      return await finalizeScheduledWithdrawal(event.params.applicationId);
    } catch (error) {
      console.error(
        "[twoWeeksWithdrawal] scheduled finalization failed:",
        event.params.applicationId,
        error?.message || error
      );
      throw error;
    }
  }
);

const activateReviewedTwoWeeksWithdrawalRefund = onDocumentUpdated(
  {
    region: REGION,
    document: "twoweeksApplications/{applicationId}",
    timeoutSeconds: 180,
    memory: "512MiB",
  },
  async (event) => {
    const after = event.data?.after?.data() || {};
    if (
      after?.withdrawal?.status !== "completed" ||
      after?.withdrawal?.refundStatus !== "pending_admin_review"
    ) {
      return null;
    }
    return activateReviewedWithdrawalRefund(event.params.applicationId);
  }
);

module.exports = {
  WITHDRAWAL_REASONS,
  activateReviewedTwoWeeksWithdrawalRefund,
  buildWithdrawalPreview,
  finalizeScheduledTwoWeeksWithdrawal,
  getTwoWeeksWithdrawalPreview,
  requestTwoWeeksWithdrawal,
};
