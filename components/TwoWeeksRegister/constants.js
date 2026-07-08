export const TWOWEEKS_REGISTER_PATH = "/2weeks/register";
export const TWOWEEKS_COMPLETE_PATH = "/2weeks/complete";
export const TWOWEEKS_DASHBOARD_PATH = "/2weeks/proposal/dashboard";

export const TWOWEEKS_ROUND_ID = "twoweeks_beta_1";
export const TWOWEEKS_ROUND_LABEL = "투윅스 1기";

export const TARGET_BIRTH_YEAR_MIN = 1985;
export const TARGET_BIRTH_YEAR_MAX = 2000;

export const DEPOSIT_INFO = {
  amount: 20000,
  currency: "KRW",
  bankName: "하나은행",
  accountNumber: "112-891138-99107",
  accountHolder: "전세환",
  method: "manual_bank_transfer",
};

export const TWOWEEKS_ADMIN_PHONE = "01075781252";
export const KAKAO_INQUIRY_URL = "https://open.kakao.com/o/sAJwMNCe";

export const ACTIVITY_AREAS = ["강남구", "서초구", "동작구", "관악구", "영등포구"];
export const TIME_SLOTS = ["평일 저녁", "토요일 낮", "토요일 저녁", "일요일 낮", "일요일 저녁"];
export const JOB_CATEGORIES = ["회사원", "공무원", "전문직", "자영업", "프리랜서", "학생", "기타"];

export const STEP_LABELS = [
  "기본정보 입력",
  "프로필사진, 재직증명",
  "약관동의",
  "예치금 입금",
];

export const REQUIRED_CONSENTS = [
  {
    key: "privacy",
    title: "[필수] 개인정보 수집·이용 동의",
    summary:
      "투윅스 신청, 운영자 검토, 매칭 제안, 예치금 확인 및 문의 응대를 위해 필요한 정보를 수집·이용합니다.",
    detail:
      "수집 항목: 성별, 이름, 닉네임, 출생연도, 연락처, 활동 지역, 결혼여부, 만남 가능 시간대, 사진, 직업군, 회사명/학교명, 인증자료, 예치금 확인 관련 정보. 보유 기간은 서비스 운영 및 분쟁 대응에 필요한 기간까지이며, 삭제 요청 시 관계 법령상 필요한 경우를 제외하고 삭제됩니다.",
  },
  {
    key: "profileContact",
    title: "[필수] 프로필 및 연락처 공개 동의",
    summary: "매칭 진행을 위해 일부 프로필이 상대방에게 공개될 수 있습니다.",
    detail:
      "매칭 제안 단계에서는 대표 사진 1장과 기본 정보 일부가 공개될 수 있습니다. 연락처는 신청 직후 공개되지 않으며, 바이트미팅 이후 서로 연결을 희망할 경우 공개됩니다.",
  },
  {
    key: "noShowDeposit",
    title: "[필수] 노쇼 및 예치금 정책 동의",
    summary: "상호 수락 후 무단 불참 또는 당일 취소 시 예치금이 미반환될 수 있습니다.",
    detail:
      "예치금은 신청 진정성 확인 및 노쇼 방지 목적입니다. 운영상 매칭 실패 시 다음 회차 이월을 기본으로 하며, 요청 시 환불 가능합니다. 상호 수락 후 무단 불참 또는 당일 취소 시 예치금이 반환되지 않을 수 있습니다.",
  },
  {
    key: "falseInfo",
    title: "[필수] 허위정보 및 인증자료 도용 제재 동의",
    summary: "허위 정보 입력, 타인 자료 도용, 기혼/교제 사실 은폐 시 이용 제한될 수 있습니다.",
    detail:
      "기혼자, 사실혼 관계, 교제 중인 상대가 있는 경우 이용할 수 없습니다. 타인의 인증자료 도용 또는 허위 서류 제출 시 이용 제한 및 법적 책임이 발생할 수 있습니다.",
  },
];

export const OPTIONAL_CONSENTS = [
  {
    key: "marketing",
    title: "[선택] 이벤트 및 마케팅 알림 수신 동의",
    summary: "이벤트, 프로모션 및 맞춤형 정보를 받아볼 수 있습니다.",
    detail:
      "마케팅 정보 수신에 동의하지 않아도 투윅스 신청 및 매칭 검토는 가능합니다. 동의는 이후 언제든 철회할 수 있습니다.",
  },
];

export const INITIAL_FORM = {
  gender: "",
  name: "",
  nickname: "",
  birthYear: "",
  phone: "",
  phoneVerified: false,
  phoneVerificationSkipped: true,
  identityVerifiedData: null,
  activityAreas: ACTIVITY_AREAS,
  preferredArea: "",
  maritalStatus: "",
  availableTimeSlots: TIME_SLOTS,
  height: "",
  introduction: "",
  jobCategory: "",
  organizationName: "",
  representativePhoto: null,
  additionalPhotos: [],
  verificationDocument: null,
  consents: {
    privacy: false,
    profileContact: false,
    noShowDeposit: false,
    falseInfo: false,
    marketing: false,
  },
};

export const PROFILE_EXAMPLE = {
  title: "여성 / 34세 / 직장인",
  subtitle: "강남·서초 가능 / 주말 오후 가능",
  rows: [
    ["직업", "직장인"],
    ["활동 지역", "강남·서초 가능"],
    ["가능 요일", "주말"],
    ["가능 시간대", "오후"],
  ],
};
