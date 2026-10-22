const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const { getTwoWeeksFeedbacks } = require("./twoWeeksFeedbackPrivateStore");

if (!admin.apps.length) {
  admin.initializeApp();
}

function normalizePhone(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

function getIssueFeedbacks(feedbacks = {}) {
  return Object.entries(feedbacks)
    .filter(([, feedback]) => feedback && feedback.meetingResult && feedback.meetingResult !== "met")
    .map(([applicationId, feedback]) => ({ applicationId, ...feedback }));
}

function getMeetingResultLabel(value = "") {
  const labels = {
    counterpart_no_show: "상대가 오지 않았어요",
    self_no_show: "본인이 참석하지 못했어요",
  };
  return labels[value] || value || "노쇼/불참";
}

function getNoShowSituationLabel(value = "") {
  const labels = {
    no_contact_absent: "연락 없이 오지 않음",
    late_too_long: "많이 늦어 만남 불가",
    could_not_find: "장소에서 찾지 못함",
    other: "기타 상황",
  };
  return labels[value] || value || "-";
}

function getSelfNoShowReasonLabel(value = "") {
  const labels = {
    urgent_schedule: "급한 일정",
    health: "건강 사유",
    mistake: "장소/시간 착각",
    changed_mind: "단순 변심",
    other: "기타",
  };
  return labels[value] || value || "-";
}

function buildAdminMessage(matchId, feedback = {}) {
  const lines = [
    "[투윅스] 노쇼/불참 피드백 접수",
    `결과: ${getMeetingResultLabel(feedback.meetingResult)}`,
    `신고/제출자: ${feedback.applicationId || "-"}`,
    `상대 신청ID: ${feedback.counterpartApplicationId || "-"}`,
  ];

  if (feedback.meetingResult === "counterpart_no_show") {
    lines.push(`상황: ${getNoShowSituationLabel(feedback.noShow?.situation)}`);
    lines.push(`대기: ${Number(feedback.noShow?.waitedMinutes || 0)}분`);
    if (feedback.noShow?.memo) lines.push(`메모: ${feedback.noShow.memo}`);
  }

  if (feedback.meetingResult === "self_no_show") {
    lines.push(`불참사유: ${getSelfNoShowReasonLabel(feedback.selfNoShow?.reason)}`);
    if (feedback.selfNoShow?.memo) lines.push(`메모: ${feedback.selfNoShow.memo}`);
  }

  lines.push(`매칭ID: ${matchId}`);
  lines.push("");
  lines.push("관리자 > 결과관리에서 확인 후 노쇼 확정 여부를 처리해주세요.");

  return lines.join("\n");
}

async function sendNcpMessage(to, message) {
  const serviceId = process.env.NEXT_PUBLIC_NCP_SERVICE_ID;
  const accessKey = process.env.NEXT_PUBLIC_NCP_KEY;
  const secretKey = process.env.NEXT_PUBLIC_NCP_SECRET_KEY;
  const from = normalizePhone(process.env.NEXT_PUBLIC_MY_NUM);
  const recipient = normalizePhone(to);

  if (!serviceId || !accessKey || !secretKey || !from || !recipient) {
    throw new Error("NCP SMS 환경변수 또는 관리자 수신번호가 없습니다.");
  }

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

  const cleanMessage = String(message || "").replace(/([\uD800-\uDBFF][\uDC00-\uDFFF])/g, "");
  const type = Buffer.byteLength(cleanMessage, "utf8") > 90 ? "LMS" : "SMS";

  await axios.post(
    url,
    {
      type,
      countryCode: "82",
      from,
      content: cleanMessage,
      messages: [{ to: recipient }],
      ...(type === "LMS" ? { subject: "투윅스 노쇼 피드백" } : {}),
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

exports.notifyTwoWeeksFeedbackIssue = onDocumentUpdated(
  {
    region: "asia-northeast3",
    document: "twoweeksMatches/{matchId}",
  },
  async (event) => {
    const after = event.data?.after?.data() || {};
    const matchId = event.params.matchId;
    const db = admin.firestore();
    const afterFeedbacks = await getTwoWeeksFeedbacks(db, matchId, after);
    const afterIssues = getIssueFeedbacks(afterFeedbacks);
    const existingNotifications = after.adminIssueNotifications || {};

    const newIssues = afterIssues.filter((feedback) => {
      const notification = existingNotifications[feedback.applicationId];
      return notification?.status !== "sent";
    });

    if (!newIssues.length) return null;

    const adminPhone =
      process.env.TWOWEEKS_ADMIN_PHONE ||
      process.env.NEXT_PUBLIC_ADMIN_PHONE ||
      process.env.NEXT_PUBLIC_MY_NUM ||
      "";

    const matchRef = event.data.after.ref;

    for (const feedback of newIssues) {
      let result;

      try {
        await sendNcpMessage(adminPhone, buildAdminMessage(matchId, feedback));
        result = {
          status: "sent",
          meetingResult: feedback.meetingResult || "",
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          sentAtClient: new Date().toISOString(),
        };
      } catch (error) {
        console.error("[notifyTwoWeeksFeedbackIssue] sms failed:", error?.response?.data || error?.message || error);
        result = {
          status: "failed",
          meetingResult: feedback.meetingResult || "",
          errorMessage: error?.message || String(error),
          failedAtClient: new Date().toISOString(),
        };
      }

      await matchRef.set(
        {
          adminIssueNotifications: {
            [feedback.applicationId]: result,
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    return null;
  }
);
