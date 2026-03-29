export function initKakao() {
  if (typeof window === "undefined") return false;
  if (!window.Kakao) return false;

  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
  }

  return true;
}