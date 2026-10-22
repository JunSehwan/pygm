export const TABS = [
  { id: "overview", label: "대시보드" },
  { id: "applications", label: "신청자" },
  { id: "review", label: "신청완료" },
  { id: "matching", label: "매칭보드" },
  { id: "schedule", label: "일정관리" },
  { id: "results", label: "결과관리" },
  { id: "marketingStories", label: "후기/성공사례" },
  { id: "marketingAttribution", label: "마케팅 유입" },
  { id: "homeContent", label: "HOME 콘텐츠" },
  { id: "referralRewards", label: "추천 보상" },
  { id: "deposit", label: "예치금관리" },
  { id: "rounds", label: "회차관리" },
  { id: "cafes", label: "카페관리" },
];

export const STATUS_LABELS = {
  applied: "신청 완료",
  pending: "대기",
  reviewing: "검토 중",
  approved: "승인",
  rejected: "반려",
  waitlisted: "대기풀",
  not_ready: "매칭 준비 전",
  not_started: "매칭 대기",
  proposed: "제안 발송",
  accepted: "수락",
  declined: "거절",
  confirmed: "확정",
  completed: "완료",
  cancelled: "취소",
  failed: "매칭 실패",
  refund_requested: "반환 요청",
  refunded: "반환 완료",
  topup_required: "추가 예치 필요",
  waived: "예치금 면제",
  top_up_required: "추가 예치 필요",
  incomplete: "정보부족",
  mutualAccepted: "양쪽 수락",
  schedule_ready: "일정 선택 대기",
  first_selected: "1차 선택 완료",
  waiting_counterpart: "상대 선택 대기",
  needs_final_choice: "일정 선택 필요",
  place_pending: "장소 확정 대기",
  schedule_confirmed: "일정 확정",
  draft: "준비중",
  open: "모집중",
  matching: "매칭중",
  meeting: "만남진행",
  closed: "마감",
  paused: "일시정지",
  user_paused: "사용자 일시정지",
  contact_connected: "연락처 공개 후 일시정지",
  feedback_no_response_recorded: "피드백 미응답 기록",
  ready: "준비 완료",
  admin_review: "운영자 검토",
  priority_review: "우선 검토",
  hidden: "비공개",
  revealed: "공개",
  feedback_requested: "피드백 요청",
  feedback_overdue: "피드백 미응답",
  timeout_processed: "미응답 처리 완료",
  waiting: "대기",
  proposal_expired: "제안 기한초과",
  schedule_expired: "일정 기한초과",
  counterpart_expired: "상대 기한초과",
  both_confirmed: "양쪽 확정",
  both_arrived: "양쪽 도착",
  attending: "참석",
  arrived: "도착",
  no_show_confirmed: "노쇼 확정",
  no_show_dismissed: "노쇼 아님",
  evidence_requested: "추가 확인",
  no_penalty_rematch: "불이익 없이 재매칭",
  sanction_restricted: "노쇼 제재중",
};

export const DEFAULT_ROUND_ID = "twoweeks_beta_1";
export const DEFAULT_ROUND_LABEL = "투윅스 1기";
export const TEST_PHONE_NORMALIZED = "01000000001";
export const TEST_PHONE_FORMATTED = "010-0000-0001";

export const DUMMY_NAMES = [
  "김도윤",
  "박서준",
  "이하린",
  "정유진",
  "최민재",
  "한지우",
  "윤서아",
  "강지훈",
  "오나연",
  "문태오",
];

export const DUMMY_NICKNAMES = [
  "퇴근러너",
  "카페산책",
  "주말등산",
  "책읽는밤",
  "한강러버",
  "성수탐방",
  "라떼주의",
  "편안한대화",
  "맛집노트",
  "느긋한오후",
];

export const DUMMY_JOBS = ["회사원", "공무원", "전문직", "자영업", "프리랜서"];
export const DUMMY_ORGS = ["린나이코리아", "네이버", "카카오", "삼성전자", "현대모비스", "서울시", "LG CNS", "SK텔레콤"];
export const DUMMY_AREAS = ["강남구", "서초구", "동작구", "관악구", "영등포구"];
export const DUMMY_TIMES = ["금요일 저녁", "토요일 낮", "토요일 저녁", "일요일 낮", "일요일 저녁"];

export const DUMMY_INTROS = [
  "주말에는 카페를 가거나 산책하는 걸 좋아해요.",
  "대화가 편한 사람과 천천히 알아가고 싶어요.",
  "일은 진지하게, 쉬는 날은 가볍게 보내는 편입니다.",
  "맛집과 전시를 같이 즐길 수 있는 만남을 기대해요.",
  "바쁜 일상 속에서도 좋은 인연은 놓치고 싶지 않아요.",
];


export const RESPONSE_DUE_DAYS = 2;
export const SCHEDULE_STAGE_DUE_HOURS = 24;
export const SCHEDULE_TOTAL_DUE_HOURS = 48;

export const MANAGED_TIME_SLOTS = [
  { key: "friday_evening", label: "금요일 저녁", hour: 19, minute: 30 },
  { key: "saturday_afternoon", label: "토요일 낮", hour: 14, minute: 0 },
  { key: "saturday_evening", label: "토요일 저녁", hour: 19, minute: 0 },
  { key: "sunday_afternoon", label: "일요일 낮", hour: 14, minute: 0 },
  { key: "sunday_evening", label: "일요일 저녁", hour: 19, minute: 0 },
];
