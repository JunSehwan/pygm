export const GA_TRACKING_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ANAL ||
  process.env.NEXT_PUBLIC_GA_TRACKING_ID ||
  "";

const SENSITIVE_QUERY_KEYS = new Set([
  "token",
  "aid",
  "idv",
  "id",
  "code",
  "applicationid",
  "dashboardtoken",
  "matchid",
  "uid",
  "userid",
  "phone",
  "email",
  "name",
  "identityverificationid",
  "identity_verification_id",
]);

function normalizeAnalyticsPath(pathname = "/") {
  const path = pathname || "/";
  const pathWithoutTrailingSlash =
    path.length > 1 ? path.replace(/\/+$/, "") : path;

  if (/^\/2weeks\/feedback\/[^/]+$/.test(pathWithoutTrailingSlash)) {
    return "/2weeks/feedback/:matchId";
  }

  if (/^\/arena\/received\/[^/]+$/.test(pathWithoutTrailingSlash)) {
    return "/arena/received/:interestId";
  }

  if (
    /^\/arena\/[^/]+$/.test(pathWithoutTrailingSlash) &&
    pathWithoutTrailingSlash !== "/arena/pending"
  ) {
    return "/arena/:uid";
  }

  if (/^\/cards\/[^/]+\/(answer|answer-read)$/.test(pathWithoutTrailingSlash)) {
    return pathWithoutTrailingSlash.endsWith("answer-read")
      ? "/cards/:cardId/answer-read"
      : "/cards/:cardId/answer";
  }

  if (
    /^\/cards\/[^/]+$/.test(pathWithoutTrailingSlash) &&
    !["/cards/create", "/cards/list"].includes(pathWithoutTrailingSlash)
  ) {
    return "/cards/:cardId";
  }

  return path;
}

function getSafeLocation(rawUrl = "") {
  if (typeof window === "undefined") {
    return { pageLocation: "", pagePath: "" };
  }

  try {
    const parsed = new URL(rawUrl || window.location.href, window.location.origin);
    Array.from(parsed.searchParams.keys()).forEach((key) => {
      if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
        parsed.searchParams.delete(key);
      }
    });

    const query = parsed.searchParams.toString();
    const normalizedPathname = normalizeAnalyticsPath(parsed.pathname);
    const pagePath = `${normalizedPathname}${query ? `?${query}` : ""}`;

    return {
      pageLocation: `${parsed.origin}${pagePath}`,
      pagePath,
    };
  } catch {
    return {
      pageLocation: `${window.location.origin}${window.location.pathname}`,
      pagePath: window.location.pathname || "/",
    };
  }
}

function canSend() {
  if (!GA_TRACKING_ID || typeof window === "undefined") return false;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  return true;
}

export const pageview = (url) => {
  if (!canSend()) return false;

  try {
    const { pageLocation, pagePath } = getSafeLocation(url);

    window.gtag("event", "page_view", {
      page_title: document.title || "",
      page_location: pageLocation,
      page_path: pagePath,
      send_to: GA_TRACKING_ID,
    });

    return true;
  } catch (error) {
    console.error("[analytics] page_view error:", error);
    return false;
  }
};

export const event = ({
  action,
  category = "",
  label = "",
  value,
  params = {},
}) => {
  if (!action || !canSend()) return false;

  try {
    const payload = {
      ...params,
      send_to: GA_TRACKING_ID,
    };

    if (category) payload.event_category = category;
    if (label) payload.event_label = label;
    if (value !== undefined && value !== null) payload.value = value;

    window.gtag("event", action, payload);
    return true;
  } catch (error) {
    console.error(`[analytics] ${action} error:`, error);
    return false;
  }
};

export const trackTwoWeeksEvent = (action, params = {}) =>
  event({
    action,
    category: "twoweeks",
    label: String(params.location || params.step || ""),
    params,
  });

export const getSafeAnalyticsPath = () => {
  if (typeof window === "undefined") return "/";
  return getSafeLocation(window.location.href).pagePath || window.location.pathname || "/";
};

