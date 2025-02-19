
const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const axios = require("axios");
const dayjs = require("dayjs");
const apps = express();
const { setGlobalOptions } = require("firebase-functions/v2");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
// const serviceAccount = require("./admin-sdk.json");
const serviceAccount = require("./serviceAccountKey.json");
const { onCall } = require("firebase-functions/v2/https");
const { onRequest } = require('firebase-functions/v2/https');
const logI = functions.logger.info;
const logE = functions.logger.error;

// function 초기화
// const app = admin.initializeApp({
//   credential: admin.credential.applicationDefault(),
// });

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pygmalion-96c6f-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const auth = admin.auth(app);
const cors = require("cors");
apps.use(cors());
// const app = admin.initializeApp({
// credential: admin.credential.cert(serviceAccount),
// });
setGlobalOptions({
  region: "asia-northeast3", maxInstances: 10,
});

exports.getGreeting = onCall(
  { cors: true },
  // { cors: [/firebase\.com$/, "https://pygm.co.kr"] },
  (request) => {
    return "Hello, world!";
  }
);


exports.webhookasia = onRequest({
  region: 'asia-northeast3'
}, (req, res) => {
  res.send("Hello");
});
// const dateApp = express.Router();
// app.use(express.json()); // body-parser 설정
// app.use("/api", dateApp);

exports.myfunction = onDocumentWritten("date_message", (event) => {
  // Your code here
});

// async function chatCompletions(text) {
// try {
// const option = {
// method: "POST",
// body: JSON.stringify({
// prompt: "마크다운 파일을 읽고 질문을 만들어주세요. 질문은 다음과 같은 형식으로 출력해주세요. [\"첫 번째 질문\", \"두 번째 질문\", ...]",
// text: text,
// }),
// };

// const response = await fetch("/question-generator/v1/json", option);

// if (!response.ok) {
// throw new Error("Network response was not ok");
// }

// return await response.json();
// } catch (err) {
// console.error("Error during fetch:", err);
// }

// return null;
// }

// /** *function test */
// async function sendMessage(phone) {

//   // 예약자 번호, 닉네임, 코인이름
//   const user_phone_number = phone;
//   const user_nickname = nickname;
//   const user_coin_name = coin_name;

//   // 모듈들을 불러오기. 오류 코드는 맨 마지막에 삽입 예정
//   const finErrCode = 404;
//   const date = Date.now().toString();

//   // 환경변수로 저장했던 중요한 정보들
//   const serviceId = process.env.NEXT_PUBLIC_NCP_SERVICE_ID;
//   const secretKey = process.env.NEXT_PUBLIC_NCP_SECRET_KEY;
//   const accessKey = process.env.NEXT_PUBLIC_NCP_KEY;
//   const my_number = process.env.NEXT_PUBLIC_MY_NUM;

//   // 그 외 url 관련
//   const method = "POST";
//   const space = "  ";
//   const newLine = "\n";
//   const url = `https://sens.apigw.ntruss.com/sms/v2/services/${uri}/messages`;
//   const url2 = `/sms/v2/services/${uri}/messages`;


//   await axios({
//     method: "POST",
//     url: url,
//     // request는 uri였지만 axios는 url이다
//     url: process.env.NEXT_PUBLIC_SERVICE_ID,
//     headers: {
//       "Contenc-type": "application/json; charset=utf-8",
//       "x-ncp-iam-access-key": accessKey,
//       "x-ncp-apigw-timestamp": date,
//       // "x-ncp-apig w-signature-v2": signature,
//     },
//     // request는 body였지만 axios는 data다
//     data: {
//       type: "SMS",
//       countryCode: "82",
//       from: phone,
//       // 원하는 메세지 내용
//       content: `세환님 가격 예약을 신청해주셔서 감사합니다.`,
//       messages: [
//         // 신청자의 전화번호
//         {
//           to: `${phone}`,
//         }],
//     },
//   }).then((res) => {
//     console.log(res.data);
//   })
//     .catch((err) => {
//       console.log(err);
//     })
//   return;
// }
// module.exports = sendMessage;

exports.test = functions
  // .region("asia-northeast3")
  .https.onRequest((request, response) => {
    response.send("Hello World!");
  });

apps.get("/senddatemessage", async (req, res) => {
  // const { name } = req.body;
  // 예약자 번호, 닉네임, 코인이름
  const user_phone_number = phone;
  const user_nickname = nickname;
  const user_coin_name = coin_name;

  // 모듈들을 불러오기. 오류 코드는 맨 마지막에 삽입 예정
  const finErrCode = 404;
  const date = Date.now().toString();

  // 환경변수로 저장했던 중요한 정보들
  const serviceId = process.env.NEXT_PUBLIC_NCP_SERVICE_ID;
  const secretKey = process.env.NEXT_PUBLIC_NCP_SECRET_KEY;
  const accessKey = process.env.NEXT_PUBLIC_NCP_KEY;
  const my_number = process.env.NEXT_PUBLIC_MY_NUM;

  // 그 외 url 관련
  const method = "POST";
  const space = "  ";
  const newLine = "\n";
  const url = `https://sens.apigw.ntruss.com/sms/v2/services/${uri}/messages`;
  const url2 = `/sms/v2/services/${uri}/messages`;


  await axios({
    method: "POST",
    url: url,
    // request는 uri였지만 axios는 url이다
    url: process.env.NEXT_PUBLIC_SERVICE_ID,
    headers: {
      "Contenc-type": "application/json; charset=utf-8",
      "x-ncp-iam-access-key": accessKey,
      "x-ncp-apigw-timestamp": date,
      "Access-Control-Allow-Origin": true,
      // "x-ncp-apig w-signature-v2": signature,
    },
    // request는 body였지만 axios는 data다
    data: {
      type: "SMS",
      countryCode: "82",
      from: phone,
      // 원하는 메세지 내용
      content: `세환님 가격 예약을 신청해주셔서 감사합니다.`,
      messages: [
        // 신청자의 전화번호
        {
          to: `${phone}`,
        }],
    },
  }).then((res) => {
    console.log(res.data);
  })
    .catch((err) => {
      console.log(err);
    })
  return;
})

apps.get("/sitemap.xml", async (request, response) => {
  let sitemapHeader = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  let basucURL = `<url><loc>https://pygm.co.kr</loc><lastmod>2022-12-29</lastmod></url>`;
  let blogURL = `<url><loc>https://pygm.co.kr/date/cards</loc><lastmod>2022-12-29</lastmod></url>`;
  let projectsURL = `<url><loc>https://pygm.co.kr/date/board</loc><lastmod>2022-12-29</lastmod></url>`;
  let aboutURL = `<url><loc>https://pygm.co.kr/date/profile</loc><lastmod>2022-12-29</lastmod></url>`;
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Reading data dynamically from the database
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  let snapshot = await admin.database().ref("users").once("userID");
  let posts = snapshot.val();
  let postURLs = Object.keys(posts).reduce((acc, url) => {

    acc = acc + `<url><loc>https://pygm.co.kr/date/cards/${url}</loc></url>`;
    return acc;

  }, "");
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  let sitemapFooter = `</urlset>`;

  let sitemapString = sitemapHeader + basucURL + blogURL + projectsURL + aboutURL + postURLs + sitemapFooter;
  // logI("# sitemapString", sitemapString);
  response.set("Content-Type", "text/xml");
  response.status(200).send(sitemapString);

})
// exports.myApp = functions.https.onRequest(apps);




exports.myApp = functions
  // .region("asia-northeast3")
  .https.onCall(apps, {
    cors: true
  });
// // 함수내용

