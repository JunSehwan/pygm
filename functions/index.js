
const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const axios = require("axios");
const dayjs = require("dayjs");
const apps = express();
const cors = require('cors');
const CryptoJS = require("crypto-js");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
// const serviceAccount = require("./admin-sdk.json");
const serviceAccount = require("./serviceAccountKey.json");
const { onCall, onRequest, HttpsError, } = require("firebase-functions/v2/https");
const logI = functions.logger.info;
const logE = functions.logger.error;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_APIKEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECTID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APPID,
};

// function 초기화
const app = admin.initializeApp(
  // {
  //   credential: admin.credential.applicationDefault(),
  // }
  {
    credential: admin.credential.cert(serviceAccount),
    firebaseConfig
  }
);
// const app = admin.initializeApp(
//   {
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://pygmalion-96c6f-default-rtdb.asia-southeast1.firebasedatabase.app"
// }
// );

const auth = admin.auth(app);
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


exports.makeSignature = functions
  .https.onRequest({
    region: 'asia-northeast3',
    // timeoutSeconds: 1200,
    cors: true,
  }, async (req, res) => {
    var space = " ";				// one space
    var newLine = "\n";				// new line
    var method = "POST";				// method
    const timestamp = Date.now().toString();
    const serviceId = process.env.NEXT_PUBLIC_NCP_SERVICE_ID;
    const secretKey = process.env.NEXT_PUBLIC_NCP_SECRET_KEY;
    const accessKey = process.env.NEXT_PUBLIC_NCP_KEY;
    const my_number = process.env.NEXT_PUBLIC_MY_NUM;
    var url = `/sms/v2/services/${serviceId}/messages`;	// url (include query string)

    var hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
    hmac.update(method);
    hmac.update(space);
    hmac.update(url);
    hmac.update(newLine);
    hmac.update(timestamp);
    hmac.update(newLine);
    hmac.update(accessKey);

    var hash = hmac.finalize();

    return hash.toString(CryptoJS.enc.Base64);
  })

function makeSignatures() {
  var space = " ";				// one space
  var newLine = "\n";				// new line
  var method = "POST";				// method
  const timestamp = Date.now().toString();
  const serviceId = process.env.NEXT_PUBLIC_NCP_SERVICE_ID;
  const secretKey = process.env.NEXT_PUBLIC_NCP_SECRET_KEY;
  const accessKey = process.env.NEXT_PUBLIC_NCP_KEY;
  const my_number = process.env.NEXT_PUBLIC_MY_NUM;
  var url = `/sms/v2/services/${serviceId}/messages`;	// url (include query string)

  var hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
  hmac.update(method);
  hmac.update(space);
  hmac.update(url);
  hmac.update(newLine);
  hmac.update(timestamp);
  hmac.update(newLine);
  hmac.update(accessKey);

  var hash = hmac.finalize();

  return hash.toString(CryptoJS.enc.Base64);
}


exports.sendmessages = onRequest({
  region: 'asia-northeast3',
  // timeoutSeconds: 1200,
  cors: true,
}, async (req, res) => {
  try {

    const user_phone_number = req.body.phone;
    const user_nickname = req.body.nickname;
    const user_coin_name = req.body.coin_name;

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
    const url = `https://sens.apigw.ntruss.com/sms/v2/services/${serviceId}/messages`;
    const url2 = `/sms/v2/services/${serviceId}/messages`
    const space = "  ";
    const newLine = "\n";
    // const url2 = `/sms/v2/services/${uri}/messages`;
    // logI(date, "시발시발")

    var hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
    hmac.update(method);
    hmac.update(space);
    hmac.update(url2);
    hmac.update(newLine);
    hmac.update(date);
    hmac.update(newLine);
    hmac.update(accessKey);

    var hash = hmac.finalize();
    const signature = hash.toString(CryptoJS.enc.Base64);
   
    res.setHeader('Access-Control-Allow-origin', '*'); // 모든 출처(orogin)을 허용
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // 모든 HTTP 메서드 허용
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // 클라이언트와 서버 간에 쿠키 주고받기 허용

    await axios({
      method: method,
      json: true,
      // request는 uri였지만 axios는 url이다
      url: url,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        // 'authorization': `Bearer ${accessToken}`,
        // 'Authorization': 'Bearer ' + naverAccessToken,
        "x-ncp-apigw-timestamp": date,
        "x-ncp-iam-access-key": accessKey,
        "Access-Control-Allow-Origin": "*",
        "x-ncp-apigw-signature-v2": signature,
        // "x-ncp-apigw-api-key-id": accessKey,
        // "x-ncp-apigw-api-key": secretKey,
        // "X-NCP-APIGW-API-KEY-ID": accessKey,
        // "X-NCP-APIGW-API-KEY": secretKey,
      },
      // reserveTime: "", //메시지 발송 예약 일시 (yyyy-MM-dd HH:mm)
      // request는 body였지만 axios는 data다
      data: {
        type: "SMS",
        countryCode: "82",
        from: my_number,
        // 원하는 메세지 내용
        content: `세환님 가격 예약을 신청해주셔서 감사합니다.`,
        messages:
          // 신청자의 전화번호
          [{
            // to: `${phone}`,
            to: "01075781252",
          }]
      },
    })
    return
  } catch (err) {
    console.error("Error during fetch:", err);
  }
  return
});

// app.get('/sms/:phone', (req, res) => {
apps.get('/sms', (req, res) => {
  // const paramObj = req.params;
  sendmessages("01075781252");
  res.send("complete!");
});
// apps.get("/senddatemessage", async (req, res) => {
//   // const { name } = req.body;
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
//       "Access-Control-Allow-Origin": true,
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
// })


exports.sendmessages = onRequest({
  region: 'asia-northeast3',
  // timeoutSeconds: 1200,
  cors: true,
}, async (req, res) => {
  try {

    const user_phone_number = req.body.phone;
    const user_nickname = req.body.nickname;
    const user_coin_name = req.body.coin_name;

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
    const url = `https://sens.apigw.ntruss.com/sms/v2/services/${serviceId}/messages`;
    const url2 = `/sms/v2/services/${serviceId}/messages`
    const space = "  ";
    const newLine = "\n";
    // const url2 = `/sms/v2/services/${uri}/messages`;
    // logI(date, "시발시발")

    var hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
    hmac.update(method);
    hmac.update(space);
    hmac.update(url2);
    hmac.update(newLine);
    hmac.update(date);
    hmac.update(newLine);
    hmac.update(accessKey);

    var hash = hmac.finalize();
    const signature = hash.toString(CryptoJS.enc.Base64);
   
    res.setHeader('Access-Control-Allow-origin', '*'); // 모든 출처(orogin)을 허용
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // 모든 HTTP 메서드 허용
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // 클라이언트와 서버 간에 쿠키 주고받기 허용

    await axios({
      method: method,
      json: true,
      // request는 uri였지만 axios는 url이다
      url: url,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        // 'authorization': `Bearer ${accessToken}`,
        // 'Authorization': 'Bearer ' + naverAccessToken,
        "x-ncp-apigw-timestamp": date,
        "x-ncp-iam-access-key": accessKey,
        "Access-Control-Allow-Origin": "*",
        "x-ncp-apigw-signature-v2": signature,
        // "x-ncp-apigw-api-key-id": accessKey,
        // "x-ncp-apigw-api-key": secretKey,
        // "X-NCP-APIGW-API-KEY-ID": accessKey,
        // "X-NCP-APIGW-API-KEY": secretKey,
      },
      // reserveTime: "", //메시지 발송 예약 일시 (yyyy-MM-dd HH:mm)
      // request는 body였지만 axios는 data다
      data: {
        type: "SMS",
        countryCode: "82",
        from: my_number,
        // 원하는 메세지 내용
        content: `세환님 가격 예약을 신청해주셔서 감사합니다.`,
        messages:
          // 신청자의 전화번호
          [{
            // to: `${phone}`,
            to: "01075781252",
          }]
      },
    })
    return
  } catch (err) {
    console.error("Error during fetch:", err);
  }
  return
});

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

