import { TWOWEEKS_DEPOSIT_AMOUNT, TWOWEEKS_DEPOSIT_BANK } from "../TwoWeeksShared/depositPolicy";

export const TWOWEEKS_REGISTER_PATH = "/2weeks/register";
export const TWOWEEKS_COMPLETE_PATH = "/2weeks/complete";
export const TWOWEEKS_DASHBOARD_PATH = "/2weeks/proposal/dashboard";

export const TWOWEEKS_ROUND_ID = "twoweeks_beta_1";
export const TWOWEEKS_ROUND_LABEL = "투윅스 1기";

export const TARGET_BIRTH_YEAR_MIN = 1985;
export const TARGET_BIRTH_YEAR_MAX = 2000;

export const DEPOSIT_INFO = {
  amount: TWOWEEKS_DEPOSIT_AMOUNT,
  currency: "KRW",
  ...TWOWEEKS_DEPOSIT_BANK,
  method: "manual_bank_transfer",
};

export const TWOWEEKS_ADMIN_PHONE = "01075781252";
export const KAKAO_INQUIRY_URL = "https://open.kakao.com/o/sAJwMNCe";

export const ACTIVITY_AREAS = ["강남구", "서초구", "동작구", "관악구", "영등포구"];
export const TIME_SLOTS = ["금요일 저녁", "토요일 낮", "토요일 저녁", "일요일 낮", "일요일 저녁"];
export const JOB_CATEGORIES = ["회사원", "공무원", "전문직", "자영업", "프리랜서", "학생", "기타"];
export const COMPANY_SCALE_OPTIONS = ["대기업", "중견기업", "중소기업", "스타트업", "공기업·공공기관", "기타"];
export const MARRIAGE_PLAN_OPTIONS = [
  { label: "1~2년 안에 하고 싶어요", value: "within_2_years" },
  { label: "3~5년 안에 생각하고 있어요", value: "within_5_years" },
  { label: "좋은 사람을 만나면 시기는 열려 있어요", value: "open" },
  { label: "아직 잘 모르겠어요", value: "unsure" },
  { label: "결혼 의향이 없어요", value: "no_intent" },
];
export const CHILDREN_PLAN_OPTIONS = [
  { label: "꼭 원해요", value: "definitely" }, { label: "가능하면 원해요", value: "preferably" },
  { label: "상대방과 상의하고 싶어요", value: "discuss" }, { label: "원하지 않아요", value: "no" }, { label: "아직 모르겠어요", value: "unsure" },
];
export const RELIGION_OPTIONS = [
  { label: "무교", value: "none" }, { label: "기독교", value: "christian" }, { label: "천주교", value: "catholic" }, { label: "불교", value: "buddhist" }, { label: "기타", value: "other" },
];
export const RELIGION_PREFERENCE_OPTIONS = [
  { label: "같은 종교여야 해요", value: "same_only" }, { label: "달라도 서로 존중하면 괜찮아요", value: "respect_any" },
  { label: "종교는 상관없어요", value: "no_matter" }, { label: "종교 활동이 많지 않은 상대를 선호해요", value: "low_activity" },
];
export const SMOKING_OPTIONS = [
  { label: "비흡연", value: "non_smoker" }, { label: "전자담배", value: "e_cigarette" }, { label: "가끔 흡연", value: "occasional" }, { label: "흡연", value: "smoker" },
];
export const SMOKING_PREFERENCE_OPTIONS = [
  { label: "상관없어요", value: "no_matter" }, { label: "전자담배까지 괜찮아요", value: "e_cigarette_ok" }, { label: "비흡연자만 원해요", value: "non_smoker_only" },
];
export const DRINKING_FREQUENCY_OPTIONS = [
  { label: "거의 마시지 않아요", value: "rarely" }, { label: "월 1~2회", value: "monthly_1_2" }, { label: "주 1~2회", value: "weekly_1_2" }, { label: "주 3회 이상", value: "weekly_3_plus" },
];

export const EDUCATION_OPTIONS = ["고등학교 졸업", "전문대 졸업", "4년제 대학 졸업", "대학원 재학·졸업", "기타"];
export const MBTI_OPTIONS = ["모름", "ISTJ", "ISFJ", "INFJ", "INTJ", "ISTP", "ISFP", "INFP", "INTP", "ESTP", "ESFP", "ENFP", "ENTP", "ESTJ", "ESFJ", "ENFJ", "ENTJ"];
// 저장 형식은 기존 interests: string[] 그대로 유지합니다.
export const INTEREST_GROUPS = [
  { name: "운동·스포츠", items: ["헬스", "러닝", "요가·필라테스", "수영", "등산", "자전거", "테니스", "배드민턴", "골프", "축구", "야구", "클라이밍"] },
  { name: "여행·야외", items: ["국내여행", "해외여행", "캠핑", "차박", "드라이브", "산책", "트레킹", "바다", "사진 촬영", "피크닉"] },
  { name: "문화·취미", items: ["영화·드라마", "뮤지컬", "연극", "콘서트", "전시·미술관", "독서", "웹툰", "애니메이션", "게임", "보드게임", "악기 연주", "노래·음악"] },
  { name: "맛집·일상", items: ["맛집 탐방", "카페", "요리", "베이킹", "와인", "커피", "디저트", "인테리어", "쇼핑", "패션", "홈카페"] },
  { name: "성장·관계", items: ["자기계발", "외국어", "재테크", "봉사활동", "반려동물", "식물 키우기", "명상", "글쓰기", "새로운 경험"] },
];
export const INTEREST_OPTIONS = INTEREST_GROUPS.flatMap((group) => group.items);
export const DEFAULT_ACTIVITY_AREAS = [...ACTIVITY_AREAS];
export const DEFAULT_TIME_SLOTS = [...TIME_SLOTS];
export const PREFERRED_STYLE_OPTIONS = ["대화가 잘 통하는", "자기관리하는", "자기 일을 좋아하는", "가까운 곳에 사는", "진지하게 다가오는", "밝고 유쾌한", "차분한", "배려하는", "활동적인"];
export const DRINKING_PREFERENCE_OPTIONS = [
  { label: "상관없어요", value: "no_matter" },
  { label: "가끔 마시는 분까지", value: "moderate_ok" },
  { label: "술을 거의 안 마시는 분", value: "rarely_only" },
];

export const SELF_REPORTED_SOURCE_OPTIONS = [
  { value: "instagram_facebook", label: "인스타그램/페이스북" },
  { value: "naver_cafe", label: "네이버 카페" },
  { value: "munto", label: "문토" },
  { value: "frip", label: "프립" },
  { value: "danggeun", label: "당근" },
  { value: "open_chat", label: "오픈채팅" },
  { value: "referral", label: "지인 추천" },
  { value: "offline_qr", label: "오프라인 카드/QR" },
  { value: "search", label: "검색" },
  { value: "other", label: "기타" },
];

export const STEP_LABELS = [
  "기본정보 입력",
  "프로필, 재직증명",
  "약관동의",
  "신청현황 확인",
];

export const REQUIRED_CONSENTS = [
  {
    key: "privacy",
    title: "[필수] 개인정보 수집·이용 동의",
    summary:
      "투윅스 신청, 운영자 검토, 매칭 제안, 예치금 확인 및 문의 응대를 위해 필요한 정보를 수집·이용합니다.",
    detail:
      "수집 항목: 성별, 이름, 닉네임, 출생연도, 연락처, 활동 지역, 결혼여부, 만남 가능 시간대, 결혼·자녀·종교·흡연·음주 관련 매칭 정보, 사진, 직업군, 회사명/학교명, 인증자료, 예치금 확인 관련 정보, 예치금 반환 요청 시 은행명·계좌번호·예금주 정보. 보유 기간은 서비스 운영 및 분쟁 대응에 필요한 기간까지이며, 삭제 요청 시 관계 법령상 필요한 경우를 제외하고 삭제됩니다.",
  },
  {
    key: "profileContact",
    title: "[필수] 프로필 및 연락처 공개 동의",
    summary: "매칭 진행을 위해 일부 프로필이 상대방에게 공개될 수 있습니다.",
    detail:
      "매칭 제안 단계에서는 등록한 프로필 사진(최소 3장)과 기본 정보 일부가 공개될 수 있습니다. 연락처는 신청 직후 공개되지 않으며, 바이트소개팅 이후 서로 연결을 희망할 경우 공개됩니다.",
  },
  {
    key: "noShowDeposit",
    title: "[필수] 취소·노쇼 및 예치금 정책 동의",
    summary: "가입할 때 바로 입금하지 않아요. 만남보증금은 추후 별도 안내드리며, 취소·노쇼 시 운영 정책에 따라 차감될 수 있습니다.",
    detail:
      "투윅스 가입 직후에는 예치금 입금을 요청하지 않으며, 필요한 시점에 별도로 입금 방법과 기한을 안내합니다. 투윅스 기본 예치금은 30,000원이며, 외부 플랫폼 또는 별도 상품 참여자는 신청 단계에서 안내된 회원별 기준 예치금이 적용될 수 있습니다. 양쪽이 만남 진행에 수락한 뒤 일정·장소 확정 전 취소 시 기준 예치금의 30%, 일정·장소 확정 후 만남 전날까지 취소 시 50%, 만남 당일 00:00 이후 취소 및 사전 연락 없는 노쇼 시 100%가 차감됩니다. 기본 30,000원은 9,000원·15,000원·30,000원, 기준 20,000원은 6,000원·10,000원·20,000원입니다. 운영상 매칭이 성사되지 않은 경우 다음 회차 이월을 기본으로 하며 요청 시 환불할 수 있습니다. 정상적으로 만남에 참여한 경우 예치금은 반환받거나 다음 회차 예치금으로 유지할 수 있습니다. 차감 후 잔액이 회원별 기준 예치금보다 적으면 다음 매칭 참여 전 부족 금액을 추가 예치해야 하며, 추가 예치가 확인되기 전에는 다음 매칭이 제한됩니다. 서비스 이용을 중단하려는 경우 신청현황의 예치금 메뉴에서 반환을 요청할 수 있으며, 진행 중인 제안·확정 일정 또는 운영자 확인이 필요한 건이 없는 경우 접수된 잔액을 입력한 본인 명의 계좌로 3일 이내 반환합니다. 반환을 위해 은행명, 계좌번호, 예금주를 입력하며 통장사본은 수집하지 않습니다.",
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
  selectionDefaultsVersion: 1,
  name: "",
  nickname: "",
  birthYear: "",
  phone: "",
  phoneVerified: false,
  phoneVerificationSkipped: false,
  identityVerifiedData: null,
  activityAreas: [...DEFAULT_ACTIVITY_AREAS],
  preferredArea: "강남구",
  maritalStatus: "",
  availableTimeSlots: [...DEFAULT_TIME_SLOTS],
  height: "",
  introduction: "",
  marriagePlan: "",
  childrenPlan: "",
  religion: "",
  religionPreference: "",
  smoking: "",
  smokingPreference: "",
  drinkingFrequency: "",
  jobCategory: "",
  companyScale: "",
  organizationName: "",
  representativePhoto: null,
  additionalPhotos: [],
  verificationDocument: null,
  educationLevel: "",
  schoolName: "",
  mbti: "",
  mbtiDraft: "",
  interests: [],
  preferredAgeMin: "",
  preferredAgeMax: "",
  preferredDrinking: "",
  preferredStyles: [],
  preferredJobCategories: [],
  additionalPreference: "",
  selfReportedSource: "",
  selfReportedSourceDetail: "",
  referrerName: "",
  referrerPhoneLast4: "",
  hasReferrer: false,
  consents: {
    privacy: false,
    profileContact: false,
    noShowDeposit: false,
    falseInfo: false,
    marketing: false,
  },
};

export const PROFILE_EXAMPLE = {
  title: "여성 / 만 34세 / 직장인",
  subtitle: "강남·서초 가능 / 주말 오후 가능",
  rows: [
    ["직업", "직장인"],
    ["활동 지역", "강남·서초 가능"],
    ["가능 요일", "금요일 또는 주말"],
    ["가능 시간대", "오후"],
  ],
};
