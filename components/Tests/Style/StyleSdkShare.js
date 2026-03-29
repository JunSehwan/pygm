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

export function initFacebookSdk() {
  if (typeof window === "undefined") return false;
  if (!window.FB) return false;

  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  if (!appId) {
    console.error("[StyleSdkShare] NEXT_PUBLIC_FACEBOOK_APP_ID 없음");
    return false;
  }

  if (!window.__styleFbInitDone) {
    window.FB.init({
      appId,
      xfbml: false,
      version: "v23.0",
    });
    window.__styleFbInitDone = true;
  }

  return true;
}

export function shareResultToKakao({
  title,
  description,
  imageUrl,
  shareUrl,
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
        mobileWebUrl: shareUrl,
        webUrl: shareUrl,
      },
    },
    buttons: [
      {
        title: "테스트 바로하기",
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
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

export function shareToFacebook({ shareUrl }) {
  const ok = initFacebookSdk();
  if (!ok) throw new Error("Facebook SDK 초기화 실패");

  window.FB.ui(
    {
      method: "share",
      href: shareUrl,
      hashtag: "#연애스타일테스트",
    },
    function (response) {
      console.log("[Facebook Share response]", response);
    }
  );
}