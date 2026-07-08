import {
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiCoffee,
  FiFileText,
  FiHeart,
  FiImage,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiShield,
  FiTarget,
  FiUser,
} from "react-icons/fi";

export const LOGIN_URL = "/2weeks/proposal/dashboard";
export const REGISTER_URL = "/2weeks/register";

export const DEPOSIT_AMOUNT_LABEL = "20,000원";

export const AUDIENCE_CARDS = [
  {
    icon: <FiUser />,
    title: "대상",
    desc: "85년생 ~ 00년생\n미혼 남녀",
  },
  {
    icon: <FiMapPin />,
    title: "지역",
    desc: "강남 / 서초 / 동작 /\n관악 / 영등포구",
  },
  {
    icon: <FiCalendar />,
    title: "주기",
    desc: "2주에 한 번\n우선 소개",
  },
  {
    icon: <FiCoffee />,
    title: "첫 만남 방식",
    desc: "바이트미팅\n오프라인 카페 1시간",
  },
  {
    icon: <FiShield />,
    title: "회원 기준",
    desc: "신원 인증 기반\n참여자 중심 운영",
  },
  {
    icon: <FiHeart />,
    title: "매칭 방향",
    desc: "내 인연을\n만날 때까지!",
  },
];

export const FEATURE_CARDS = [
  {
    icon: <FiTarget />,
    title: "연령대·지역\n우선 매칭",
    desc: "서로 실제로 만날 수 있는\n연령대와 활동 지역을 우선 반영합니다.",
  },
  {
    icon: <FiShield />,
    title: "신뢰 기반 참여",
    desc: "사진과 신원 인증 자료를 바탕으로\n가벼운 장난 신청을 줄입니다.",
  },
  {
    icon: <FiCoffee />,
    title: "바이트미팅",
    desc: "오래 끄는 채팅보다\n카페 1시간 대화로 빠르게 판단합니다.",
  },
];

export const FLOW_STEPS = [
  {
    no: "01",
    title: "신청",
    desc: "기본 정보, 사진,\n인증 자료 제출",
    icon: <FiFileText />,
  },
  {
    no: "02",
    title: "신원 확인",
    desc: "사진과 인증 자료로\n참여 신뢰도 확인",
    icon: <FiShield />,
  },
  {
    no: "03",
    title: "우선 소개",
    desc: "연령대와 활동 지역을 기준으로\n만남 가능성이 높은 이성 추천",
    icon: <FiTarget />,
  },
  {
    no: "04",
    title: "매칭 제안",
    desc: "대표 사진 1장과 기본 정보\n일부 확인 후 24시간 내 응답",
    icon: <FiHeart />,
  },
  {
    no: "05",
    title: "바이트미팅",
    desc: "오프라인 카페에서\n1시간 만남",
    icon: <FiCoffee />,
  },
  {
    no: "06",
    title: "상호 연결",
    desc: "만남 후 서로 원하면\n연락처 공개",
    icon: <FiPhone />,
  },
];

export const POLICY_CARDS = [
  {
    icon: <FiCheckCircle />,
    title: `예치금 ${DEPOSIT_AMOUNT_LABEL}`,
    desc: "신청 진정성 확인 및\n노쇼 방지 목적",
  },
  {
    icon: <FiTarget />,
    title: "소개 기준",
    desc: "연령대와 활동 지역을 기준으로\n만남 가능성이 높은 이성을 우선 소개",
  },
  {
    icon: <FiImage />,
    title: "프로필 공개 범위",
    desc: "매칭 제안 시 대표 사진 1장과\n기본 정보 일부 공개",
  },
  {
    icon: <FiPhone />,
    title: "연락처 공개",
    desc: "바이트미팅 후 서로 연결을\n희망할 때 공개",
  },
  {
    icon: <FiAlertTriangle />,
    title: "노쇼 정책",
    desc: "확정 후 무단 불참 또는 당일 취소 시\n예치금이 미반환될 수 있음",
  },
  {
    icon: <FiRefreshCw />,
    title: "매칭 실패",
    desc: "운영상 진행되지 않을 경우\n환불 또는 다음 회차 이월 가능",
  },
];

export const FAQ_ITEMS = [
  {
    q: "누구를 소개받게 되나요?",
    a: "투윅스는 85년생부터 00년생까지의 미혼 남녀를 대상으로, 연령대와 활동 지역이 맞는 이성을 우선순위로 소개합니다. 강남·서초·동작·관악·영등포구에서 실제로 만날 수 있는 가능성을 중요하게 봅니다.",
  },
  {
    q: "사진은 언제 공개되나요?",
    a: "매칭 제안 단계에서 대표 사진 1장과 기본 정보 일부가 공개됩니다. 신원 인증 자료, 회사명/학교명, 전체 프로필은 운영자 확인용이며 상대방에게 그대로 공개되지 않습니다.",
  },
  {
    q: "연락처는 언제 공개되나요?",
    a: "연락처는 신청 직후 또는 매칭 제안 단계에서 공개되지 않습니다. 바이트미팅 진행 후 서로 연결을 원할 때 공개되는 구조입니다.",
  },
  {
    q: "예치금은 어떻게 운영되나요?",
    a: "투윅스 1기 예치금은 20,000원이며, 신청 진정성 확인과 노쇼 방지를 위한 장치입니다. 운영상 매칭이 진행되지 않을 경우 환불 또는 다음 회차 이월이 가능하고, 확정 후 무단 불참이나 당일 취소 시 미반환될 수 있습니다.",
  },
  {
    q: "바이트미팅은 무엇인가요?",
    a: "바이트미팅은 오프라인 카페에서 약 1시간 동안 진행되는 부담 낮은 첫 만남입니다. 길게 채팅하며 시간을 쓰기보다, 실제 대화를 통해 빠르게 서로의 분위기를 확인하는 방식입니다.",
  },
];

export const HERO_POLICY_NOTES = [
  "연령대와 활동 지역을 기준으로 만날 가능성이 높은 이성을 우선 소개합니다.",
  "신원 인증과 사진 확인을 바탕으로 신뢰할 수 있는 참여자 중심으로 운영합니다.",
  "확정 후 무단 불참 또는 당일 취소 시 예치금이 미반환될 수 있습니다.",
];

export const HERO_PROCESS_ITEMS = [
  "신원 인증 기반 참여",
  "연령대·활동 지역 우선 소개",
  "매칭 제안 및 24시간 응답",
  "오프라인 카페 1시간 바이트미팅",
  "만남 후 상호 연결 시 연락처 공개",
  `신청 및 예치금 ${DEPOSIT_AMOUNT_LABEL}`,
];
