// lib/portoneIdentity.js
const DEFAULT_IDENTITY_EMAIL = "admin@pygm.co.kr";

function onlyDigits(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

function utf8ByteLength(value = "") {
  try {
    return new TextEncoder().encode(String(value || "")).length;
  } catch {
    return unescape(encodeURIComponent(String(value || ""))).length;
  }
}

function sanitizeFullName(value = "") {
  const name = String(value || "").trim();
  if (!name) return "";

  // KG이니시스 customer.fullName 최대 30바이트.
  if (utf8ByteLength(name) <= 30) return name;

  let result = "";
  for (const char of name) {
    const next = `${result}${char}`;
    if (utf8ByteLength(next) > 30) break;
    result = next;
  }
  return result;
}

function normalizeEmail(value = "") {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function getIdentityCustomerEmail(email = "") {
  return (
    normalizeEmail(email) ||
    normalizeEmail(process.env.NEXT_PUBLIC_PORTONE_IDV_CUSTOMER_EMAIL) ||
    DEFAULT_IDENTITY_EMAIL
  );
}

function decodePgMessage(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";

  // KG이니시스에서 URL-encoded 한글 메시지를 그대로 반환하는 경우가 있다.
  try {
    return decodeURIComponent(raw.replace(/\+/g, " "));
  } catch {
    return raw;
  }
}

function buildInicisUnifiedBypass() {
  const foreignerInput = String(
    process.env.NEXT_PUBLIC_PORTONE_IDV_FRGND_INFO || ""
  )
    .trim()
    .toUpperCase();

  return {
    inicisUnified: {
      // KG이니시스 통합인증 필수값.
      // N: 인증창에서 이용자가 정보를 직접 확인/입력할 수 있음.
      flgFixedUser: "N",

      // FRGNDInfo는 선택값이다. 환경변수로 Y/N을 명시한 경우에만 전달해서
      // 초기 실연동 요청을 불필요한 PG 특수값 없이 최소화한다.
      ...(foreignerInput === "Y" || foreignerInput === "N"
        ? { FRGNDInfo: foreignerInput }
        : {}),
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

function buildFriendlyPgMessage(response = {}) {
  const decodedPgMessage = decodePgMessage(response?.pgMessage || "");
  const pgCode = String(response?.pgCode || "").trim();

  // 9022는 KG 서비스/상점 설정에 따라 세부 메시지가 달라질 수 있으므로
  // 고객에게는 인코딩 문자열이나 내부코드를 노출하지 않는다.
  if (pgCode === "9022") {
    return "본인인증 서비스 연결 설정을 확인하지 못했습니다. 잠시 후 다시 시도해주세요.";
  }

  return (
    decodedPgMessage ||
    String(response?.message || "").trim() ||
    "본인인증 요청에 실패했습니다."
  );
}

function normalizeSdkFailure(response) {
  if (response?.ok === false) return response;

  if (response?.code) {
    const isCancel = isCancelLikeError(response);
    const decodedPgMessage = decodePgMessage(response?.pgMessage || "");

    console.error("[PortOne identity failure]", {
      code: response?.code || "",
      message: response?.message || "",
      pgCode: response?.pgCode || "",
      pgMessage: decodedPgMessage || response?.pgMessage || "",
    });

    return {
      ok: false,
      code: response.code,
      pgCode: response?.pgCode || "",
      pgMessage: decodedPgMessage,
      message: isCancel
        ? "본인인증이 완료되지 않았습니다. 다시 진행해주세요."
        : buildFriendlyPgMessage(response),
      raw: response,
    };
  }

  return null;
}

function buildSafeRequestId(identityVerificationId = "") {
  const raw = String(identityVerificationId || "");
  const safe = raw.replace(/[^A-Za-z0-9]/g, "").slice(0, 40);
  return safe || `idv${Date.now()}`.slice(0, 40);
}

export async function requestPortoneIdentityVerification({
  phone,
  name,
  email,
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
      message: "본인인증 모듈을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.",
    };
  }

  const storeId = String(process.env.NEXT_PUBLIC_PORTONE_STORE_ID || "").trim();
  const channelKey = String(
    process.env.NEXT_PUBLIC_PORTONE_IDV_CHANNEL_KEY || ""
  ).trim();

  if (!storeId || !channelKey) {
    return {
      ok: false,
      code: "ENV_MISSING",
      message: "본인인증 연동정보가 설정되지 않았습니다. 관리자에게 문의해주세요.",
    };
  }

  if (!identityVerificationId) {
    return {
      ok: false,
      code: "IDV_ID_MISSING",
      message: "본인인증 요청을 준비하지 못했습니다. 다시 시도해주세요.",
    };
  }

  // 본인인증 제공자는 KG이니시스 통합인증으로 단일화한다.
  const provider = "inicis_unified";
  const cleanPhone = onlyDigits(phone);
  const cleanName = sanitizeFullName(name);
  const cleanEmail = getIdentityCustomerEmail(email);
  const safeIdentityVerificationId = buildSafeRequestId(identityVerificationId);

  // flgFixedUser="N"에서는 인증창에서 이용자가 직접 정보를 입력할 수 있다.
  // 투윅스 가입화면은 휴대폰 번호만 먼저 받고 이름은 인증 결과에서 가져오므로,
  // 이름이 없는 경우 customer 객체 자체를 보내지 않는다.
  const prefilledCustomer = cleanName && cleanPhone
    ? {
        fullName: cleanName,
        phoneNumber: cleanPhone,
        email: cleanEmail,
      }
    : null;

  const finalRedirectUrl =
    redirectUrl ||
    `${window.location.origin}/2weeks/register?idv=${encodeURIComponent(
      safeIdentityVerificationId
    )}`;

  const shouldForceRedirect =
    typeof forceRedirect === "boolean" ? forceRedirect : isMobileLikeBrowser();

  // 실연동 장애를 추적할 때 secret 값을 노출하지 않고 필요한 정보만 남긴다.
  console.info("[PortOne identity request]", {
    provider,
    origin: window.location.origin,
    identityVerificationIdLength: safeIdentityVerificationId.length,
    hasStoreId: Boolean(storeId),
    hasChannelKey: Boolean(channelKey),
    hasName: Boolean(cleanName),
    hasPhone: Boolean(cleanPhone),
    hasEmail: Boolean(cleanEmail),
    prefillsCustomer: Boolean(prefilledCustomer),
    forceRedirect: shouldForceRedirect,
  });

  let timeoutId = null;

  try {
    const requestPayload = {
      storeId,
      channelKey,
      identityVerificationId: safeIdentityVerificationId,

      ...(prefilledCustomer ? { customer: prefilledCustomer } : {}),

      bypass: buildInicisUnifiedBypass(),

      // 모바일 redirect 방식에서만 redirect 관련 필드를 보낸다.
      ...(shouldForceRedirect
        ? {
            redirectUrl: finalRedirectUrl,
            forceRedirect: true,
          }
        : {}),
    };

    const requestPromise =
      window.PortOne.requestIdentityVerification(requestPayload);

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
        safeIdentityVerificationId,
      redirected: shouldForceRedirect,
    };
  } catch (error) {
    const decodedMessage = decodePgMessage(
      error?.pgMessage || error?.message || ""
    );

    console.error("[PortOne SDK throw]", {
      code: error?.code || "",
      pgCode: error?.pgCode || "",
      message: decodedMessage,
    });

    return {
      ok: false,
      code: error?.code || "PORTONE_THROW",
      pgCode: error?.pgCode || "",
      message: isCancelLikeError(error)
        ? "본인인증이 완료되지 않았습니다. 다시 진행해주세요."
        : decodedMessage ||
          "본인인증 창 호출에 실패했습니다. 잠시 후 다시 시도해주세요.",
      raw: error,
    };
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
}
