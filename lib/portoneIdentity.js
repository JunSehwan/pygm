// lib/portoneIdentity.js
import { normalizeCarrierForDanal } from "./identityVerificationClient";

function buildDanalBypass({ carrier = "", source = "" }) {
  const danalCarrier = normalizeCarrierForDanal(carrier);

  const title =
    process.env.NEXT_PUBLIC_IDENTITY_CPTITLE ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  return {
    danal: {
      ...(danalCarrier ? { IsCarrier: danalCarrier } : {}),
      AGELIMIT: 19,
      CPTITLE: title || source || "차밍수프",
    },
  };
}

function isCancelLikeError(error) {
  const code = String(error?.code || error?.error_code || "").toUpperCase();
  const message = String(error?.message || error?.error_msg || "").toLowerCase();

  return (
    code.includes("CANCEL") ||
    code.includes("CLOSE") ||
    code.includes("CLOSED") ||
    code.includes("USER") ||
    message.includes("취소") ||
    message.includes("닫") ||
    message.includes("cancel") ||
    message.includes("close") ||
    message.includes("closed")
  );
}

function isMobileLikeBrowser() {
  if (typeof window === "undefined") return false;

  const ua = window.navigator?.userAgent || "";
  const platform = window.navigator?.platform || "";
  const maxTouchPoints = window.navigator?.maxTouchPoints || 0;

  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isIPadOS = platform === "MacIntel" && maxTouchPoints > 1;

  return isIOS || isAndroid || isIPadOS;
}

function normalizeSdkFailure(response) {
  if (response?.ok === false) return response;

  if (response?.code) {
    const isCancel = isCancelLikeError(response);

    return {
      ok: false,
      code: response.code,
      message:
        response.message ||
        (isCancel
          ? "본인인증이 완료되지 않았습니다. 다시 진행해주세요."
          : "본인인증 요청에 실패했습니다."),
      raw: response,
    };
  }

  return null;
}

export async function requestPortoneIdentityVerification({
  phone,
  name,
  carrier,
  source = "signup",
  identityVerificationId,
  redirectUrl,
  timeoutMs = 30000,
  forceRedirect,
}) {
  if (typeof window === "undefined") {
    return {
      ok: false,
      code: "BROWSER_ONLY",
      message: "브라우저 환경에서만 본인인증을 요청할 수 있습니다.",
    };
  }

  if (!window.PortOne || !window.PortOne.requestIdentityVerification) {
    return {
      ok: false,
      code: "SDK_NOT_LOADED",
      message: "포트원 SDK가 아직 로드되지 않았습니다.",
    };
  }

  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
  const channelKey = process.env.NEXT_PUBLIC_PORTONE_IDV_CHANNEL_KEY;

  if (!storeId || !channelKey) {
    return {
      ok: false,
      code: "ENV_MISSING",
      message: "포트원 환경변수(storeId/channelKey)가 설정되지 않았습니다.",
    };
  }

  if (!identityVerificationId) {
    return {
      ok: false,
      code: "IDV_ID_MISSING",
      message: "본인인증 요청 ID가 없습니다.",
    };
  }

  const finalRedirectUrl =
    redirectUrl ||
    `${window.location.origin}/signup?idv=${encodeURIComponent(
      identityVerificationId
    )}`;

  // 핵심: PC 웹에서는 redirect 강제 사용을 끈다.
  // redirect 강제 + focus 취소 감지를 같이 쓰면
  // 인증창 닫힘/중간 focus 복귀를 취소로 오판한 뒤 다시 /signup?idv=...로 돌아오는 현상이 생긴다.
  const shouldForceRedirect =
    typeof forceRedirect === "boolean" ? forceRedirect : isMobileLikeBrowser();

  let timeoutId = null;

  try {
    const requestPromise = window.PortOne.requestIdentityVerification({
      storeId,
      channelKey,
      identityVerificationId,
      redirectUrl: finalRedirectUrl,
      forceRedirect: shouldForceRedirect,

      customer: {
        fullName: name || undefined,
        phoneNumber: phone || undefined,
      },

      bypass: buildDanalBypass({ carrier, source }),

      customData: JSON.stringify({
        source,
        identityVerificationId,
      }),
    });

    const timeoutPromise = new Promise((resolve) => {
      timeoutId = window.setTimeout(() => {
        resolve({
          ok: false,
          code: "IDV_TIMEOUT_OR_CLOSED",
          message: "본인인증이 완료되지 않았습니다. 다시 진행해주세요.",
        });
      }, timeoutMs);
    });

    const sdkResponse = await Promise.race([requestPromise, timeoutPromise]);

    const failure = normalizeSdkFailure(sdkResponse);
    if (failure) return failure;

    return {
      ok: true,
      data: sdkResponse,
      identityVerificationId:
        sdkResponse?.identityVerificationId ||
        sdkResponse?.id ||
        sdkResponse?.imp_uid ||
        identityVerificationId,
      redirected: shouldForceRedirect,
    };
  } catch (error) {
    console.error("[PortOne SDK throw]", error);

    return {
      ok: false,
      code: error?.code || "PORTONE_THROW",
      message: isCancelLikeError(error)
        ? "본인인증이 완료되지 않았습니다. 다시 진행해주세요."
        : error?.message ||
        "본인인증 창 호출에 실패했습니다. 채널 설정을 확인해주세요.",
      raw: error,
    };
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
}