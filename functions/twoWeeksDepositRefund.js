const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const { assertApplicationOwner } = require("./twoWeeksCallerAuth");
const { getBalance, isDepositWaived } = require("./twoWeeksDepositPolicy");
const { getTwoWeeksFeedbacks } = require("./twoWeeksFeedbackPrivateStore");

if (!admin.apps.length) {
  admin.initializeApp();
}

const REFUND_PROCESSING_DAYS = 3;

function onlyDigits(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

function compactText(value = "", maxLength = 80) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function getRegisteredPhone(application = {}) {
  return onlyDigits(
    application?.basic?.phoneNormalized ||
      application?.basic?.phone ||
      application?.phoneIdentityVerification?.phone ||
      application?.phone
  );
}

function normalizeAccountNumber(value = "") {
  return String(value || "").replace(/[^0-9-]/g, "").slice(0, 40);
}

function getAccountLast4(value = "") {
  const digits = onlyDigits(value);
  return digits ? digits.slice(-4) : "";
}

function normalizeAccountHolder(value = "") {
  return String(value || "").trim().replace(/\s+/g, "").toLowerCase();
}

function getRefundPrivateRef(db, applicationId = "") {
  return db.collection("twoweeksDepositRefundPrivate").doc(applicationId);
}

function isRefundRequestPending(deposit = {}) {
  return deposit?.refundRequest?.status === "requested" || deposit?.status === "refund_requested";
}

function hasActiveMatchingObligation(application = {}) {
  const matchingStatus = String(application?.matchingStatus || "");
  const scheduleStatus = String(application?.scheduleStatus || application?.schedule?.status || "");
  const proposalResponse = String(application?.currentProposal?.response || "");
  const reviewStatus = String(application?.nextRoundStatus || application?.penaltyStats?.reviewStatus || "");

  if (["admin_review", "evidence_requested"].includes(reviewStatus)) return true;

  if (["accepted", "mutualAccepted", "confirmed"].includes(matchingStatus)) return true;
  if (["waiting_counterpart", "needs_final_choice", "place_pending", "confirmed", "schedule_confirmed"].includes(scheduleStatus)) {
    return true;
  }

  if (
    matchingStatus === "proposed" &&
    application?.currentProposal?.matchId &&
    !["declined", "proposal_expired", "expired", "cancelled", "canceled"].includes(proposalResponse)
  ) {
    return true;
  }

  return false;
}

async function hasUnresolvedMeetingIssue(db, applicationId = "") {
  if (!applicationId) return false;

  const [maleSnap, femaleSnap] = await Promise.all([
    db.collection("twoweeksMatches").where("maleApplicationId", "==", applicationId).limit(20).get(),
    db.collection("twoweeksMatches").where("femaleApplicationId", "==", applicationId).limit(20).get(),
  ]);

  const matches = new Map();
  [...maleSnap.docs, ...femaleSnap.docs].forEach((docSnap) => {
    matches.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
  });

  for (const match of matches.values()) {
    const reviewStatus = String(match?.noShowReviewStatus || "");
    if (reviewStatus && !["evidence_requested", "needs_admin_review", "issue_reported"].includes(reviewStatus)) {
      continue;
    }

    if (match?.feedbackSummary?.needsAdminReview === true) return true;
    const feedbacks = Object.values(await getTwoWeeksFeedbacks(db, match.id, match));
    const unresolvedFeedback = feedbacks.some((feedback) =>
      feedback &&
      feedback.meetingResult &&
      feedback.meetingResult !== "met" &&
      (feedback.issueStatus === "needs_admin_review" ||
        feedback.noShow?.reviewStatus === "needs_admin_review" ||
        feedback.selfNoShow?.reviewStatus === "needs_admin_review")
    );

    if (unresolvedFeedback || ["evidence_requested", "needs_admin_review", "issue_reported"].includes(reviewStatus)) {
      return true;
    }
  }

  return false;
}

async function isAdminRequester(uid = "") {
  if (!uid) return false;

  const envUids = String(process.env.TWOWEEKS_ADMIN_UIDS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (envUids.includes(uid)) return true;

  try {
    const snap = await admin.firestore().collection("adminConfig").doc("access").get();
    const data = snap.data() || {};
    const allowed = [
      ...(Array.isArray(data.allowedUids) ? data.allowedUids : []),
      ...(Array.isArray(data.superAdmins) ? data.superAdmins : []),
    ];
    return allowed.includes(uid);
  } catch (error) {
    console.error("[twoWeeksDepositRefund] admin access check failed:", error);
    return false;
  }
}

function getAdminPhone() {
  return onlyDigits(
    process.env.TWOWEEKS_ADMIN_PHONE ||
      process.env.NEXT_PUBLIC_ADMIN_PHONE ||
      process.env.NEXT_PUBLIC_MY_NUM ||
      ""
  );
}

async function sendNcpMessage(to, message, subject = "투윅스 예치금") {
  const serviceId = process.env.NEXT_PUBLIC_NCP_SERVICE_ID;
  const accessKey = process.env.NEXT_PUBLIC_NCP_KEY;
  const secretKey = process.env.NEXT_PUBLIC_NCP_SECRET_KEY;
  const from = onlyDigits(process.env.NEXT_PUBLIC_MY_NUM);
  const recipient = onlyDigits(to);

  if (!serviceId || !accessKey || !secretKey || !from || !recipient) {
    return { status: "skipped", reason: "SMS_CONFIG_MISSING" };
  }

  const cleanMessage = String(message || "").replace(/([\uD800-\uDBFF][\uDC00-\uDFFF])/g, "");
  const type = Buffer.byteLength(cleanMessage, "utf8") > 90 ? "LMS" : "SMS";
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
        type,
        countryCode: "82",
        from,
        content: cleanMessage,
        messages: [{ to: recipient }],
        ...(type === "LMS" ? { subject } : {}),
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

    return { status: "sent", data: response?.data || {} };
  } catch (error) {
    console.error("[twoWeeksDepositRefund] sms failed:", error?.response?.data || error?.message || error);
    return { status: "failed", errorMessage: error?.message || String(error) };
  }
}

function makeHistoryEntry({ type, amount = 0, balanceAfter = 0, note = "", adminUid = "" } = {}) {
  return {
    id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    amount: Number(amount || 0),
    balanceAfter: Number(balanceAfter || 0),
    note: compactText(note, 160),
    adminUid: adminUid || "",
    createdAtClient: new Date().toISOString(),
  };
}

const requestTwoWeeksDepositRefund = onCall(
  { region: "asia-northeast3" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const applicationId = compactText(request.data?.applicationId, 120);
    const bankName = compactText(request.data?.bankName, 30);
    const accountNumber = normalizeAccountNumber(request.data?.accountNumber);
    const accountHolder = compactText(request.data?.accountHolder, 40);

    if (!applicationId) throw new HttpsError("invalid-argument", "신청 정보가 필요합니다.");
    if (!bankName || !accountNumber || onlyDigits(accountNumber).length < 6 || !accountHolder) {
      throw new HttpsError("invalid-argument", "반환받을 은행, 계좌번호, 예금주를 확인해주세요.");
    }

    const db = admin.firestore();
    const ref = db.collection("twoweeksApplications").doc(applicationId);
    const privateRefundRef = getRefundPrivateRef(db, applicationId);
    const preSnap = await ref.get();

    if (!preSnap.exists) throw new HttpsError("not-found", "신청 정보를 찾을 수 없습니다.");
    const preApplication = preSnap.data() || {};
    await assertApplicationOwner(request, applicationId, { allowAdmin: false });

    if (isDepositWaived(preApplication?.deposit || {})) {
      throw new HttpsError("failed-precondition", "예치금 면제 대상은 반환할 예치금이 없습니다.");
    }

    const registeredName = compactText(preApplication?.basic?.name || "", 40);
    if (registeredName && normalizeAccountHolder(accountHolder) !== normalizeAccountHolder(registeredName)) {
      throw new HttpsError(
        "invalid-argument",
        `예금주는 신청자 본인 명의(${registeredName})로 입력해주세요.`
      );
    }

    if (await hasUnresolvedMeetingIssue(db, applicationId)) {
      throw new HttpsError(
        "failed-precondition",
        "노쇼·불참 등 운영자 확인이 필요한 만남 기록이 있습니다. 확인이 끝난 뒤 예치금 반환을 요청해주세요."
      );
    }

    let result = null;

    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists) throw new HttpsError("not-found", "신청 정보를 찾을 수 없습니다.");

      const application = snap.data() || {};

      const deposit = application.deposit || {};
      const balance = getBalance(deposit);

      if (balance <= 0) {
        throw new HttpsError("failed-precondition", "반환할 예치금 잔액이 없습니다.");
      }

      if (isRefundRequestPending(deposit)) {
        throw new HttpsError("already-exists", "이미 예치금 반환 요청이 접수되어 있습니다.");
      }

      if (hasActiveMatchingObligation(application)) {
        throw new HttpsError(
          "failed-precondition",
          "진행 중인 제안 또는 만남 일정이 있습니다. 해당 만남을 먼저 정리한 뒤 예치금 반환을 요청해주세요."
        );
      }

      const now = new Date();
      const requestedAtClient = now.toISOString();
      const dueAtClient = new Date(now.getTime() + REFUND_PROCESSING_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const history = makeHistoryEntry({
        type: "refund_request",
        amount: balance,
        balanceAfter: balance,
        note: "예치금 반환 요청 접수",
      });

      const accountLast4 = getAccountLast4(accountNumber);

      transaction.update(ref, {
        matchingStatus: "paused",
        nextRoundStatus: "refund_requested",
        "deposit.status": "refund_requested",
        "deposit.participationEligible": false,
        "deposit.refundRequest": {
          status: "requested",
          requestedAmount: balance,
          bankName,
          accountLast4,
          requestedAt: admin.firestore.FieldValue.serverTimestamp(),
          requestedAtClient,
          dueAtClient,
          requestedByAuthUid: request.auth.uid,
          accountStoredPrivately: true,
        },
        "deposit.history": admin.firestore.FieldValue.arrayUnion(history),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 계좌번호/예금주 원문은 일반 신청서 문서에 남기지 않는다.
      // 이 컬렉션은 Firestore Rules상 관리자만 읽을 수 있고, 쓰기는 Admin SDK만 수행한다.
      transaction.set(
        privateRefundRef,
        {
          applicationId,
          status: "requested",
          requestedAmount: balance,
          bankName,
          accountNumber,
          accountHolder,
          accountLast4,
          requestedAt: admin.firestore.FieldValue.serverTimestamp(),
          requestedAtClient,
          dueAtClient,
          requestedByAuthUid: request.auth.uid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      result = {
        applicationId,
        requestedAmount: balance,
        requestedAtClient,
        dueAtClient,
        applicantName: application?.basic?.name || application?.basic?.nickname || "신청자",
      };
    });

    const adminPhone = getAdminPhone();
    const adminSms = await sendNcpMessage(
      adminPhone,
      [
        "[투윅스] 예치금 반환 요청",
        "",
        `${result?.applicantName || "신청자"}님의 예치금 반환 요청이 접수되었습니다.`,
        `반환 예정액: ${Number(result?.requestedAmount || 0).toLocaleString()}원`,
        "반환 계좌는 투윅스 관리자 예치금 관리에서 확인해주세요.",
      ].join("\n"),
      "투윅스 예치금 반환 요청"
    );

    await Promise.all([
      privateRefundRef.set(
        {
          adminSms,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {}),
      ref.update({
        "deposit.refundRequest.adminSmsStatus": adminSms?.status || "skipped",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }).catch(() => {}),
    ]);

    return { ok: true, ...result, adminSmsStatus: adminSms?.status || "skipped" };
  }
);

const completeTwoWeeksDepositRefund = onCall(
  { region: "asia-northeast3" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "관리자 로그인이 필요합니다.");
    }

    if (!(await isAdminRequester(request.auth.uid))) {
      throw new HttpsError("permission-denied", "관리자 권한이 없습니다.");
    }

    const applicationId = compactText(request.data?.applicationId, 120);
    if (!applicationId) throw new HttpsError("invalid-argument", "신청 정보가 필요합니다.");

    const db = admin.firestore();
    const ref = db.collection("twoweeksApplications").doc(applicationId);
    const privateRefundRef = getRefundPrivateRef(db, applicationId);
    const withdrawalPrivateRef = db.collection("twoweeksWithdrawalPrivate").doc(applicationId);
    let result = null;

    await db.runTransaction(async (transaction) => {
      const [snap, privateRefundSnap, withdrawalPrivateSnap] = await Promise.all([
        transaction.get(ref),
        transaction.get(privateRefundRef),
        transaction.get(withdrawalPrivateRef),
      ]);
      if (!snap.exists) throw new HttpsError("not-found", "신청 정보를 찾을 수 없습니다.");

      const application = snap.data() || {};
      const deposit = application.deposit || {};
      const refundRequest = deposit.refundRequest || {};
      const privateRefund = privateRefundSnap.exists ? privateRefundSnap.data() || {} : {};
      const withdrawalPrivate = withdrawalPrivateSnap.exists
        ? withdrawalPrivateSnap.data() || {}
        : {};
      const withdrawn =
        application?.status === "withdrawn" ||
        application?.withdrawal?.status === "completed";

      if (refundRequest.status !== "requested") {
        throw new HttpsError("failed-precondition", "처리 대기 중인 예치금 반환 요청이 없습니다.");
      }

      const currentBalance = getBalance(deposit);
      if (currentBalance <= 0) {
        throw new HttpsError("failed-precondition", "현재 반환할 예치금 잔액이 없습니다.");
      }

      const requestedAmount = Number(refundRequest.requestedAmount || 0);
      const refundAmount = Math.min(currentBalance, requestedAmount > 0 ? requestedAmount : currentBalance);
      const nowClient = new Date().toISOString();
      const history = makeHistoryEntry({
        type: "refund",
        amount: refundAmount,
        balanceAfter: 0,
        note: "관리자 예치금 반환 완료",
        adminUid: request.auth.uid,
      });

      transaction.update(ref, {
        matchingStatus: withdrawn ? "withdrawn" : "paused",
        nextRoundStatus: withdrawn ? "withdrawn" : "refunded",
        "deposit.status": "refunded",
        "deposit.balance": 0,
        "deposit.topUpRequiredAmount": 0,
        "deposit.participationEligible": false,
        "deposit.totalRefunded": Number(deposit.totalRefunded || 0) + refundAmount,
        "deposit.lastRefundAmount": refundAmount,
        "deposit.lastRefundedAt": admin.firestore.FieldValue.serverTimestamp(),
        "deposit.lastRefundedAtClient": nowClient,
        "deposit.lastRefundedByUid": request.auth.uid,
        "deposit.refundRequest.status": "completed",
        "deposit.refundRequest.completedAmount": refundAmount,
        "deposit.refundRequest.completedAt": admin.firestore.FieldValue.serverTimestamp(),
        "deposit.refundRequest.completedAtClient": nowClient,
        "deposit.refundRequest.completedByUid": request.auth.uid,
        "deposit.refundRequest.accountStoredPrivately": true,
        "deposit.refundRequest.accountNumber": admin.firestore.FieldValue.delete(),
        "deposit.refundRequest.accountHolder": admin.firestore.FieldValue.delete(),
        "deposit.history": admin.firestore.FieldValue.arrayUnion(history),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      transaction.set(
        privateRefundRef,
        {
          ...privateRefund,
          applicationId,
          status: "completed",
          completedAmount: refundAmount,
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAtClient: nowClient,
          completedByUid: request.auth.uid,
          accountNumber: admin.firestore.FieldValue.delete(),
          accountHolder: admin.firestore.FieldValue.delete(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      if (withdrawalPrivateSnap.exists) {
        transaction.set(
          withdrawalPrivateRef,
          {
            refundStatus: "completed",
            refundCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
            refundCompletedAtClient: nowClient,
            phone: admin.firestore.FieldValue.delete(),
            applicantName: admin.firestore.FieldValue.delete(),
            accountNumber: admin.firestore.FieldValue.delete(),
            accountHolder: admin.firestore.FieldValue.delete(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      result = {
        applicationId,
        refundAmount,
        phone: getRegisteredPhone(application) || onlyDigits(withdrawalPrivate.phone || ""),
        applicantName:
          application?.basic?.name ||
          withdrawalPrivate.applicantName ||
          application?.basic?.nickname ||
          "신청자",
      };
    });

    const userSms = await sendNcpMessage(
      result?.phone,
      [
        "[투윅스] 예치금 반환 완료",
        "",
        `${result?.applicantName || "회원"}님, 요청하신 예치금 ${Number(result?.refundAmount || 0).toLocaleString()}원의 반환 처리가 완료되었습니다.`,
        "입력하신 계좌의 실제 입금 내역을 확인해주세요.",
      ].join("\n"),
      "투윅스 예치금 반환 완료"
    );

    await Promise.all([
      privateRefundRef.set(
        {
          completedSms: userSms,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {}),
      ref.update({
        "deposit.refundRequest.completedSmsStatus": userSms?.status || "skipped",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }).catch(() => {}),
    ]);

    return { ok: true, ...result, smsStatus: userSms?.status || "skipped" };
  }
);

module.exports = {
  requestTwoWeeksDepositRefund,
  completeTwoWeeksDepositRefund,
};
