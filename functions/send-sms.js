const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config(); // .env 파일에서 환경변수 로딩

const ACCESS_KEY = process.env.NEXT_PUBLIC_NCP_KEY;
const SECRET_KEY = process.env.NEXT_PUBLIC_NCP_SECRET_KEY;
const SERVICE_ID = process.env.NEXT_PUBLIC_NCP_SERVICE_ID;
const SENDER_NUMBER = '01075781252'; // 실제 발신 등록된 번호로 바꾸세요

module.exports = async function sendSMS(to, content) {
  const timestamp = Date.now().toString();
  const method = 'POST';
  const uri = `/sms/v2/services/${SERVICE_ID}/messages`;
  const url = `https://sens.apigw.ntruss.com${uri}`;

  // Signature 생성
  const message = `${method} ${uri}\n${timestamp}\n${ACCESS_KEY}`;
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(message)
    .digest('base64');

  try {
    const response = await axios.post(
      url,
      {
        type: 'SMS',
        contentType: 'COMM',
        countryCode: '82',
        from: SENDER_NUMBER,
        content: content,
        messages: [{ to }],
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'x-ncp-apigw-timestamp': timestamp,
          'x-ncp-iam-access-key': ACCESS_KEY,
          'x-ncp-apigw-signature-v2': signature,
        },
      }
    );

    console.log('SMS 발송 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('SMS 발송 실패:', error.response?.data || error.message);
    throw error;
  }
};
