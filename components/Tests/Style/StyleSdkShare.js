function waitForFacebookSdk(timeout = 8000) {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("window 없음"));
      return;
    }

    const startedAt = Date.now();

    const check = () => {
      if (window.FB && typeof window.FB.init === "function" && typeof window.FB.ui === "function") {
        resolve(window.FB);
        return;
      }

      if (Date.now() - startedAt > timeout) {
        reject(new Error("Facebook SDK 로드 대기 시간 초과"));
        return;
      }

      setTimeout(check, 120);
    };

    check();
  });
}

export function initKakaoSdk() {
  if (typeof window === "undefined") return false;
  if (!window.Kakao) return false;

  const jsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (!jsKey) {
    console.error("[StyleSdkShare] NEXT_PUBLIC_KAKAO_JS_KEY 없음");
    return false;
  }

  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(jsKey);
  }

  return true;
}

export async function initFacebookSdk() {
  if (typeof window === "undefined") return false;

  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  if (!appId) {
    console.error("[StyleSdkShare] NEXT_PUBLIC_FACEBOOK_APP_ID 없음");
    return false;
  }

  const FB = await waitForFacebookSdk();

  if (!window.__styleFbInitDone) {
    FB.init({
      appId,
      xfbml: false,
      version: "v20.0",
    });
    window.__styleFbInitDone = true;
  }

  return true;
}

export function shareResultToKakao({
  title,
  description,
  imageUrl,
  resultUrl,
  introUrl,
}) {
  const ok = initKakaoSdk();
  if (!ok) throw new Error("Kakao SDK 초기화 실패");

  window.Kakao.Share.sendDefault({
    objectType: "feed",
    content: {
      title,
      description,
      imageUrl,
      link: {
        mobileWebUrl: resultUrl,
        webUrl: resultUrl,
      },
    },
    buttons: [
      {
        title: "내 결과 보기",
        link: {
          mobileWebUrl: resultUrl,
          webUrl: resultUrl,
        },
      },
      {
        title: "테스트 바로하기",
        link: {
          mobileWebUrl: introUrl,
          webUrl: introUrl,
        },
      },
    ],
    installTalk: true,
  });
}

export function shareIntroToKakao({ shareUrl, imageUrl }) {
  const ok = initKakaoSdk();
  if (!ok) throw new Error("Kakao SDK 초기화 실패");

  window.Kakao.Share.sendDefault({
    objectType: "feed",
    content: {
      title: "연애스타일 진단테스트",
      description: "내 연애스타일을 알아보는 테스트! 바로 참여해보세요.",
      imageUrl,
      link: {
        mobileWebUrl: shareUrl,
        webUrl: shareUrl,
      },
    },
    buttons: [
      {
        title: "테스트 하러가기",
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
    ],
    installTalk: true,
  });
}

export async function shareToFacebook({ shareUrl }) {
  const ok = await initFacebookSdk();
  if (!ok) throw new Error("Facebook SDK 초기화 실패");

  return new Promise((resolve, reject) => {
    window.FB.ui(
      {
        method: "share",
        href: shareUrl,
        hashtag: "#연애스타일테스트",
      },
      function (response) {
        if (response === undefined || response === null) {
          resolve(false);
          return;
        }
        resolve(true);
      }
    );
  });
}