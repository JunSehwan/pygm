import { initKakao } from "./KakaoShareUtils";

export function shareToKakaoResult({
  resultTitle,
  resultDescription,
  imageUrl,
  shareUrl,
}) {
  const ok = initKakao();
  if (!ok) throw new Error("Kakao SDK not ready");

  window.Kakao.Share.sendDefault({
    objectType: "feed",
    content: {
      title: resultTitle,
      description: resultDescription,
      imageUrl,
      link: {
        mobileWebUrl: shareUrl,
        webUrl: shareUrl,
      },
    },
    buttons: [
      {
        title: "나도 테스트하기",
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
    ],
    installTalk: true,
  });
}

export function shareToFacebookResult({ shareUrl, hashtag }) {
  if (!window.FB) throw new Error("Facebook SDK not ready");

  window.FB.ui({
    method: "share",
    href: shareUrl,
    hashtag: hashtag || "#연애스타일테스트",
  });
}

export async function shareToInstagramFallback({
  imageFile,
  text,
  shareUrl,
}) {
  const fullText = `${text}\n${shareUrl}`;

  try {
    await navigator.clipboard.writeText(fullText);
  } catch (error) {
    console.error("[Instagram fallback] copy fail", error);
  }

  const objectUrl = URL.createObjectURL(imageFile);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = imageFile.name || "style-result.png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);

  alert("결과 이미지가 저장되고 문구가 복사되었어요. 인스타그램 앱에서 업로드 후 붙여넣어보세요.");
}

export function shareToSms({ text, shareUrl }) {
  const body = `${text}\n${shareUrl}`;
  window.location.href = `sms:?&body=${encodeURIComponent(body)}`;
}