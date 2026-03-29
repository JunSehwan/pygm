const admin = require("firebase-admin");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const { onSchedule } = require("firebase-functions/v2/scheduler");

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

exports.expireArenaInterests = onSchedule(
  {
    schedule: "every 10 minutes",
    timeZone: "Asia/Seoul",
    region: "asia-northeast3",
  },
  async () => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    const snap = await db
      .collection("arenaInterests")
      .where("status", "==", "sent")
      .where("expiresAt", "<=", now)
      .get();

    if (snap.empty) {
      console.log("[expireArenaInterests] no expired interests");
      return null;
    }

    for (const docSnap of snap.docs) {
      const data = docSnap.data() || {};
      const femaleUid = data.femaleUid || "";
      const refundAmount = Number(data.spoonCost || 8);

      try {
        const femaleRef = db.collection("users").doc(femaleUid);
        const femaleSnap = await femaleRef.get();
        const femaleData = femaleSnap.exists ? femaleSnap.data() || {} : {};

        const batch = db.batch();

        batch.set(
          docSnap.ref,
          {
            status: "expired",
            expiredAt: admin.firestore.FieldValue.serverTimestamp(),
            refundProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
            refundAmount,
          },
          { merge: true }
        );

        if (femaleUid) {
          batch.update(femaleRef, {
            spoon: admin.firestore.FieldValue.increment(refundAmount),
          });

          const historyRef = db.collection("spoonHistories").doc();
          batch.set(historyRef, {
            uid: femaleUid,
            type: "arena_like_refund_expired",
            amount: refundAmount,
            balanceBefore: Number(femaleData?.spoon || 0),
            balanceAfter: Number(femaleData?.spoon || 0) + refundAmount,
            interestId: docSnap.id,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        await batch.commit();

        if (femaleData?.phonenumber) {
          await sendLmsDirect(
            femaleData.phonenumber,
            "[차밍수프]\n응답시간이 지나 스푼 8개가 반환됐어요.",
            "차밍수프 안내"
          );
        }

        console.log("[expireArenaInterests] expired:", docSnap.id);
      } catch (error) {
        console.error("[expireArenaInterests] error:", docSnap.id, error);
      }
    }

    return null;
  }
);