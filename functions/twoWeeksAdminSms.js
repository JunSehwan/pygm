const axios = require("axios");
const CryptoJS = require("crypto-js");

function onlyDigits(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

function getTwoWeeksAdminPhone() {
  return onlyDigits(
    process.env.TWOWEEKS_ADMIN_PHONE ||
      process.env.NEXT_PUBLIC_ADMIN_PHONE ||
      process.env.NEXT_PUBLIC_MY_NUM ||
      ""
  );
}

async function sendTwoWeeksAdminSms({ message = "", subject = "투윅스 운영 알림" } = {}) {
  const serviceId = process.env.NEXT_PUBLIC_NCP_SERVICE_ID;
  const accessKey = process.env.NEXT_PUBLIC_NCP_KEY;
  const secretKey = process.env.NEXT_PUBLIC_NCP_SECRET_KEY;
  const from = onlyDigits(process.env.NEXT_PUBLIC_MY_NUM || "");
  const to = getTwoWeeksAdminPhone();

  if (!serviceId || !accessKey || !secretKey || !from || !to) {
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
    await axios.post(
      url,
      {
        type,
        contentType: "COMM",
        countryCode: "82",
        from,
        content: cleanMessage,
        messages: [{ to }],
        ...(type === "LMS" ? { subject: String(subject || "투윅스 운영 알림").slice(0, 40) } : {}),
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
      sentAtClient: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "failed",
      failedAtClient: new Date().toISOString(),
      reason: "SMS_SEND_FAILED",
    };
  }
}

module.exports = {
  getTwoWeeksAdminPhone,
  sendTwoWeeksAdminSms,
};
