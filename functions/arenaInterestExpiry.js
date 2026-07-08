const admin = require("firebase-admin");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const { onSchedule } = require("firebase-functions/v2/scheduler");

const CHARMINGSOUP_URL = "https://charmingsoup.com";
const DEFAULT_REFUND_AMOUNT = 8;
const MAX_REJECTED_REFUND_PER_RUN = 100;

function buildSmsMessage(lines = []) {
  const cleaned = lines
    .map((line) => String(line || "").trim())
    .filter(Boolean);

  return ["[차밍수프]", ...cleaned, CHARMINGSOUP_URL].join("\n");
}

async function sendLmsDirect(to, message, subject = "차밍수프 안내") {
  const serviceId = process.env.NEXT_PUBLIC_NCP_SERVICE_ID;
  const secretKey = process.env.NEXT_PUBLIC_NCP_SECRET_KEY;
  const accessKey = process.env.NEXT_PUBLIC_NCP_KEY;
  const from = (process.env.NEXT_PUBLIC_MY_NUM || "").replace(/[^0-9]/g, "");

  if (!serviceId || !secretKey || !accessKey || !from || !to || !message) {
    throw new Error("LMS env missing");
  }

  const method = "POST";
  const space = " ";
  const newLine = "\n";
  const urlPath = `/sms/v2/services/${serviceId}/messages`;
  const timestamp = Date.now().toString();

  const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
  hmac.update(method);
  hmac.update(space);
  hmac.update(urlPath);
  hmac.update(newLine);
  hmac.update(timestamp);
  hmac.update(newLine);
  hmac.update(accessKey);

  const signature = hmac.finalize().toString(CryptoJS.enc.Base64);

  await axios.post(
    `https://sens.apigw.ntruss.com${urlPath}`,
    {
      type: "LMS",
      countryCode: "82",
      from,
      subject,
      content: String(message || ""),
      messages: [{ to: String(to).replace(/[^0-9]/g, "") }],
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
}

function getSpoonState(user = {}) {
  const total = Math.max(Number(user?.spoon || 0), 0);
  const free = Math.max(Number(user?.spoon_free || 0), 0);
  const paid = Math.max(
    Number.isFinite(Number(user?.spoon_paid))
      ? Number(user?.spoon_paid || 0)
      : Math.max(total - free, 0),
    0
  );

  return {
    total,
    free,
    paid,
  };
}

function getRefundBucketState(interestData = {}, refundAmount = 0) {
  const normalizedAmount = Math.max(Number(refundAmount || 0), 0);
  const storedFree = Number(interestData?.spoonDeductedFree);
  const storedPaid = Number(interestData?.spoonDeductedPaid);

  if (
    normalizedAmount > 0 &&
    Number.isFinite(storedFree) &&
    Number.isFinite(storedPaid) &&
    storedFree + storedPaid > 0
  ) {
    const refundPaid = Math.max(Math.min(storedPaid, normalizedAmount), 0);
    const refundFreeBase = Math.max(
      Math.min(storedFree, normalizedAmount - refundPaid),
      0
    );
    const remainder = Math.max(normalizedAmount - refundPaid - refundFreeBase, 0);

    return {
      refundFree: refundFreeBase + remainder,
      refundPaid,
    };
  }

  return {
    refundFree: normalizedAmount,
    refundPaid: 0,
  };
}

function getPhone(user = {}) {
  return String(user?.phonenumber || user?.phoneNumber || "").replace(
    /[^0-9]/g,
    ""
  );
}

function getRefundAmount(data = {}) {
  const amount = Math.max(Number(data?.spoonCost || DEFAULT_REFUND_AMOUNT), 0);
  return Number.isFinite(amount) ? amount : DEFAULT_REFUND_AMOUNT;
}

async function refundArenaInterest({
  db,
  interestRef,
  allowedStatuses = [],
  nextStatus = "rejected",
  refundType = "arena_like_refund_rejected",
  refundReason = "male_rejected",
  notificationBody = "사용한 스푼이 반환되었어요.",
  smsLine = "스푼이 반환되었습니다.",
  extraInterestPayload = {},
}) {
  let smsPhone = "";
  let refundedAmount = 0;
  let skipped = false;

  await db.runTransaction(async (transaction) => {
    const interestSnap = await transaction.get(interestRef);

    if (!interestSnap.exists) {
      skipped = true;
      return;
    }

    const interestData = interestSnap.data() || {};
    const currentStatus = String(interestData?.status || "");
    const alreadyRefunded = Boolean(interestData?.refundProcessedAt);

    if (alreadyRefunded || !allowedStatuses.includes(currentStatus)) {
      skipped = true;
      return;
    }

    const femaleUid = String(interestData?.femaleUid || "").trim();
    const refundAmount = getRefundAmount(interestData);
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    const baseInterestPayload = {
      ...extraInterestPayload,
      status: nextStatus,
      updatedAt: timestamp,
    };

    if (!femaleUid || refundAmount <= 0) {
      transaction.set(
        interestRef,
        {
          ...baseInterestPayload,
          refundSkippedAt: timestamp,
          refundSkippedReason: !femaleUid ? "female_uid_missing" : "invalid_amount",
        },
        { merge: true }
      );
      skipped = true;
      return;
    }

    const femaleRef = db.collection("users").doc(femaleUid);
    const femaleSnap = await transaction.get(femaleRef);

    if (!femaleSnap.exists) {
      transaction.set(
        interestRef,
        {
          ...baseInterestPayload,
          refundSkippedAt: timestamp,
          refundSkippedReason: "female_user_not_found",
        },
        { merge: true }
      );
      skipped = true;
      return;
    }

    const femaleData = femaleSnap.data() || {};
    const spoonState = getSpoonState(femaleData);
    const { refundFree, refundPaid } = getRefundBucketState(
      interestData,
      refundAmount
    );

    transaction.set(
      femaleRef,
      {
        spoon: spoonState.total + refundAmount,
        spoon_free: spoonState.free + refundFree,
        spoon_paid: spoonState.paid + refundPaid,
        updatedAt: timestamp,
      },
      { merge: true }
    );

    transaction.set(
      interestRef,
      {
        ...baseInterestPayload,
        refundProcessedAt: timestamp,
        refundAmount,
        refundReason,
        refundedTo: refundPaid > 0 ? "original_bucket" : "free",
      },
      { merge: true }
    );

    const historyRef = db.collection("spoonHistories").doc();
    transaction.set(historyRef, {
      uid: femaleUid,
      type: refundType,
      amount: refundAmount,
      balanceBefore: spoonState.total,
      balanceAfter: spoonState.total + refundAmount,
      spoonFreeBefore: spoonState.free,
      spoonFreeAfter: spoonState.free + refundFree,
      spoonPaidBefore: spoonState.paid,
      spoonPaidAfter: spoonState.paid + refundPaid,
      refundedFree: refundFree,
      refundedPaid: refundPaid,
      interestId: interestRef.id,
      createdAt: timestamp,
    });

    const notificationRef = db.collection("notifications").doc();
    transaction.set(notificationRef, {
      targetUid: femaleUid,
      type: refundType,
      title: `스푼 ${refundAmount}개가 반환됐어요`,
      body: notificationBody,
      href: "/arena",
      isRead: false,
      createdAt: timestamp,
    });

    smsPhone = getPhone(femaleData);
    refundedAmount = refundAmount;
    skipped = false;
  });

  if (smsPhone && refundedAmount > 0) {
    try {
      await sendLmsDirect(
        smsPhone,
        buildSmsMessage([smsLine.replace("{amount}", String(refundedAmount))]),
        "차밍수프 스푼 반환"
      );
    } catch (error) {
      console.error("[refundArenaInterest] sms error:", interestRef.id, error);
    }
  }

  return {
    skipped,
    refundedAmount,
  };
}

async function expireSentInterests(db, now) {
  const snap = await db
    .collection("arenaInterests")
    .where("status", "==", "sent")
    .where("expiresAt", "<=", now)
    .get();

  if (snap.empty) {
    console.log("[expireArenaInterests] no expired interests");
    return 0;
  }

  let processed = 0;

  for (const docSnap of snap.docs) {
    try {
      await refundArenaInterest({
        db,
        interestRef: docSnap.ref,
        allowedStatuses: ["sent"],
        nextStatus: "expired",
        refundType: "arena_like_refund_expired",
        refundReason: "male_no_response_expired",
        notificationBody: "응답 시간이 지나 스푼이 자동 반환되었어요.",
        smsLine: "응답 시간이 지나 스푼 {amount}개 반환",
        extraInterestPayload: {
          expiredAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      });
      processed += 1;
      console.log("[expireArenaInterests] expired:", docSnap.id);
    } catch (error) {
      console.error("[expireArenaInterests] error:", docSnap.id, error);
    }
  }

  return processed;
}

async function refundRejectedInterests(db) {
  const snap = await db
    .collection("arenaInterests")
    .where("status", "==", "rejected")
    .where("refundProcessedAt", "==", null)
    .limit(MAX_REJECTED_REFUND_PER_RUN)
    .get();

  if (snap.empty) {
    console.log("[refundRejectedArenaInterests] no rejected interests");
    return 0;
  }

  let processed = 0;

  for (const docSnap of snap.docs) {
    try {
      await refundArenaInterest({
        db,
        interestRef: docSnap.ref,
        allowedStatuses: ["rejected"],
        nextStatus: "rejected",
        refundType: "arena_like_refund_rejected",
        refundReason: "male_rejected",
        notificationBody: "상대가 호감표시를 거절해 사용한 스푼이 반환되었어요.",
        smsLine: "상대방 거절로 스푼 {amount}개 반환",
      });
      processed += 1;
      console.log("[refundRejectedArenaInterests] refunded:", docSnap.id);
    } catch (error) {
      console.error("[refundRejectedArenaInterests] error:", docSnap.id, error);
    }
  }

  return processed;
}

exports.expireArenaInterests = onSchedule(
  {
    schedule: "every 10 minutes",
    timeZone: "Asia/Seoul",
    region: "asia-northeast3",
  },
  async () => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    const expiredCount = await expireSentInterests(db, now);
    const rejectedRefundCount = await refundRejectedInterests(db);

    console.log("[expireArenaInterests] completed", {
      expiredCount,
      rejectedRefundCount,
    });

    return null;
  }
);
