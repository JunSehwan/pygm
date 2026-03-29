// lib/portoneIdentity.js

/**
 * 포트원 본인인증 요청 래퍼
 * - SDK throw를 catch해서 { ok: false } 형태로 반환
 * - Signup.js에서 안전하게 처리 가능
 */
export async function requestPortoneIdentityVerification({
  phone,
  name,
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

  const identityVerificationId = `idv_${Date.now()}_${Math.floor(
    Math.random() * 100000
  )}`;

  
  try {
    const sdkResponse = await window.PortOne.requestIdentityVerification({
      storeId,
      channelKey,
      identityVerificationId,
      customer: {
        fullName: name || undefined,
        phoneNumber: phone || undefined,
      },
      customData: {
        source: "signup",
      },
    });
    // SDK가 throw 대신 code/message 반환하는 경우
    if (sdkResponse?.code) {
      return {
        ok: false,
        code: sdkResponse.code,
        message: sdkResponse.message || "본인인증 요청에 실패했습니다.",
        raw: sdkResponse,
      };
    }

    return {
      ok: true,
      data: sdkResponse,
      identityVerificationId:
        sdkResponse?.identityVerificationId ||
        sdkResponse?.id ||
        sdkResponse?.imp_uid ||
        identityVerificationId,
    };
  } catch (error) {
    console.error("[PortOne SDK throw]", error);

    return {
      ok: false,
      code: error?.code || "PORTONE_THROW",
      message:
        error?.message ||
        "본인인증 창 호출에 실패했습니다. 채널 설정을 확인해주세요.",
      raw: error,
    };
  }
}