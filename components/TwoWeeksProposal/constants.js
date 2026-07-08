export const TWOWEEKS_DASHBOARD_PATH = "/2weeks/proposal/dashboard";
export const TWOWEEKS_REGISTER_PATH = "/2weeks/register";
export const TWOWEEKS_LANDING_PATH = "/2weeks";

export const TWOWEEKS_ROUND_ID = "twoweeks_beta_1";
export const TWOWEEKS_ROUND_LABEL = "투윅스 1기";

export const PROPOSAL_IDENTITY_SOURCE = "twoweeks_proposal_dashboard";

export const STATUS_LABELS = {
  applied: "신청 완료",
  pending: "검토 대기",
  reviewing: "검토 중",
  approved: "검토 완료",
  not_started: "매칭 대기",
  proposed: "제안 도착",
  accepted: "수락 완료",
  declined: "거절 완료",
  confirmed: "확정 대기",
  completed: "완료",
  cancelled: "취소",
};

export const AGE_PRIORITY_LABELS = {
  best: "나이 우선순위 1순위",
  good: "나이 우선순위 적합",
  acceptable: "나이 우선순위 보통",
  fallback: "후보풀 고려 조합",
};


export const DEFAULT_PROPOSAL_EXPIRES_HOURS = 24;

export const PROPOSAL_SESSION_KEY = "twoweeks_proposal_verified_session_v1";
export const PROPOSAL_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const PROPOSAL_MAGIC_SESSION_METHOD = "sms_magic_link";

export const ACTIVITY_AREAS = ["강남구", "서초구", "동작구", "관악구", "영등포구"];
export const TIME_SLOTS = ["평일 저녁", "토요일 낮", "토요일 저녁", "일요일 낮", "일요일 저녁"];
export const JOB_CATEGORIES = ["회사원", "공무원", "전문직", "자영업", "프리랜서", "학생", "기타"];

export const PROFILE_LOCKED_MATCHING_STATUSES = ["confirmed", "completed"];
export const PROFILE_LOCKED_APPLICATION_STATUSES = ["cancelled", "withdrawn", "rejected"];

export const PROPOSAL_SMS_SESSION_METHOD = "sms_code";
export const LOOKUP_CODE_TTL_MS = 5 * 60 * 1000;
