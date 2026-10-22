export const REGISTER_URL = "/2weeks/register";
export const LOGIN_URL = "/2weeks/proposal/dashboard";
export const GUIDE_URL = "/2weeks/guide";
export const KAKAO_INQUIRY_URL =
  process.env.NEXT_PUBLIC_TWOWEEKS_KAKAO_CHANNEL_URL ||
  "https://open.kakao.com/o/sAJwMNCe";

// 다음 모집 때는 이 객체의 문구와 deadline만 바꾸면
// 내비게이션, 히어로, 하단 고정 바의 날짜가 함께 변경됩니다.
export const RECRUITMENT_CONFIG = {
  enabled: true,
  cohortLabel: "1기",
  statusLabel: "모집중",
  deadlineLabel: "10월 25일 마감",
  deadline: "2026-10-25T23:59:59+09:00",
};

export const HERO_METRICS = [
  { value: "2주에 한 번", label: "나와 맞는 한 사람" },
  { value: "60분 미니소개팅", label: "부담 없는 오프라인 만남" },
  { value: "거리 부담없이", label: "동네 이성 중심 매칭" },
];

export const QUICK_PROCESS_STEPS = [
  {
    number: "01",
    key: "profile",
    title: "프로필 등록",
    desc: "프로필 사진 3장 이상, 활동지역, 가능한 일정, 직업과 기본 가치관을 입력합니다.",
  },
  {
    number: "02",
    key: "ready",
    title: "승인 & 매칭 준비",
    desc: "프로필 확인 후 노쇼 방지 예치금까지 확인되면 준비가 끝납니다.",
  },
  {
    number: "03",
    key: "proposal",
    title: "맞춤이성 제안",
    desc: "지역, 나이 등을 고려하여 한 사람의 프로필을 확인합니다.",
  },
  {
    number: "04",
    key: "schedule",
    title: "마음에 들면 약속",
    desc: "두 사람 모두 원할 때 가능한 일정과 카페를 선택합니다.",
  },
  {
    number: "05",
    key: "meeting",
    title: "카페에서 60분",
    desc: "연락처를 미리 공개하지 않고 카페에서 편하게 대화합니다.",
  },
];

export const BENEFIT_ITEMS = [
  {
    key: "focus",
    title: "한 번에 한 사람",
    desc: "수십 명을 비교하고 선택하기보다 한 사람씩 천천히 확인합니다.",
  },
  {
    key: "offline",
    title: "채팅보다 실제 만남",
    desc: "서로 만나보고 싶다면 긴 대화 없이 일정과 장소를 정합니다.",
  },
  {
    key: "coffee",
    title: "카페에서 약 60분",
    desc: "짧게 여러 사람을 만나는 대신 한 사람과 충분히 이야기합니다.",
  },
];

export const SAFETY_QA_ITEMS = [
  {
    q: "누구를 소개받게 되나요?",
    a: "기본 프로필과 직업정보 등을 확인한 참여자를 대상으로 운영자가 매칭을 검토합니다.",
  },
  {
    q: "소개받으면 반드시 만나야 하나요?",
    a: "아닙니다. 상대 프로필을 확인한 뒤 직접 진행 여부를 선택할 수 있습니다.",
  },
  {
    q: "연락처가 바로 공개되나요?",
    a: "아닙니다. 실제 만남 후 두 사람 모두 재만남과 연락처 공개에 동의한 경우에만 공개됩니다.",
  },
  {
    q: "노쇼는 어떻게 관리하나요?",
    a: "노쇼 방지 예치금과 참석·현장 도착 확인 절차를 운영해 두 사람의 약속을 보호합니다.",
  },
];

export const PROFILE_EXAMPLES = [
  {
    age: "31세",
    job: "회사원",
    areas: "강남 · 서초",
    schedule: "주말 가능",
    tags: ["비흡연", "카페 선호"],
    image: "/image/twoweeks/landing/profiles/profile-blurred-01.webp",
  },
  {
    age: "34세",
    job: "전문직",
    areas: "동작 · 관악",
    schedule: "금요일 저녁 · 주말",
    tags: ["가벼운 음주", "반려동물 선호"],
    image: "/image/twoweeks/landing/profiles/profile-blurred-02.webp",
  },
  {
    age: "37세",
    job: "IT · 기획",
    areas: "강남 · 동작",
    schedule: "토요일 낮 · 일요일",
    tags: ["비흡연", "장기적인 만남"],
    image: "/image/twoweeks/landing/profiles/profile-blurred-03.webp",
  },
];

export const JOURNEY_GROUPS = [
  {
    key: "prepare",
    label: "A",
    eyebrow: "처음 한 번만 준비",
    title: "등록해두면 준비 끝",
    steps: [
      {
        number: "01",
        title: "프로필 작성",
        desc: "출생연도, 프로필 사진 3장 이상, 직업, 회사 또는 학교, 활동지역, 가능한 시간을 입력합니다.",
        detail:
          "결혼 방향, 자녀 계획, 흡연, 종교, 음주 등 좋은 소개에 필요한 기본 정보도 함께 확인합니다.",
      },
      {
        number: "02",
        title: "프로필 확인 및 승인",
        desc: "운영자가 제출 정보와 프로필을 직접 확인합니다.",
      },
      {
        number: "03",
        title: "예치금 확인",
        desc: "프로필 승인 후 노쇼 방지 예치금 30,000원이 확인되면 매칭 준비가 완료됩니다.",
      },
    ],
    closing: "여기까지 하면 준비 끝.",
  },
  {
    key: "proposal",
    label: "B",
    eyebrow: "새로운 소개가 도착하면",
    title: "확인해보고 선택",
    steps: [
      {
        number: "04",
        title: "한 사람의 프로필 확인",
        desc: "약 2주 단위로 활동지역, 가능한 일정, 나이와 기본 조건 등을 고려한 한 사람을 제안합니다.",
        detail:
          "적절한 상대가 있을 때 제안하며, 매 회차의 소개를 무조건 보장하지는 않습니다.",
      },
      {
        number: "05",
        title: "내가 진행 여부 선택",
        desc: "‘진행할래요’ 또는 ‘이번 만남은 쉬어갈게요’ 중 편하게 선택합니다.",
        detail: "소개를 받았다고 반드시 만날 필요는 없습니다.",
      },
    ],
    closing: "괜찮다고 느껴질 때만 다음으로.",
  },
  {
    key: "meeting",
    label: "C",
    eyebrow: "두 사람 모두 만나고 싶다면",
    title: "약속부터 만남까지",
    steps: [
      {
        number: "06",
        title: "일정 선택",
        desc: "금요일 19:30, 토·일요일 14:00 또는 19:00 중 가능한 후보를 고르고, 겹치는 일정으로 확정합니다.",
      },
      {
        number: "07",
        title: "카페 선택",
        desc: "추천 카페 후보를 확인하고 두 사람이 편한 장소를 선택합니다.",
      },
      {
        number: "08",
        title: "만남 전 한마디",
        desc: "‘베이지색 자켓 입었어요’처럼 복장, 가방, 기다리는 위치를 간단히 전달합니다.",
      },
      {
        number: "09",
        title: "카페에서 만남",
        desc: "각자 음료를 주문하고 약 60분 동안 편하게 대화합니다. 원한다면 더 이야기해도 됩니다.",
      },
      {
        number: "10",
        title: "만남 후 선택",
        desc: "다시 만나고 싶은지와 연락처 공개 여부를 각자 선택합니다. 두 사람 모두 동의할 때만 공개됩니다.",
      },
    ],
    closing: "연락처 공개도 두 사람의 선택으로.",
  },
];

export const VALUE_ITEMS = [
  {
    number: "01",
    label: "조건 기반 맞춤 제안",
    title: "수십 명 대신, 만나볼 한 사람",
    desc: "진짜 내 사람을 찾을 때까지, 한 번에 한 사람씩 소개를 이어갑니다.",
  },
  {
    number: "02",
    label: "생활권 중심 만남",
    title: "같은 동네에서 부담 없이",
    desc: "서로 겹치는 활동 지역을 중심으로 연결해, 멀리 이동하지 않고 실제 약속을 잡기 쉽습니다.",
  },
  {
    number: "03",
    label: "카페 약속까지 안내",
    title: "채팅보다 카페에서 직접",
    desc: "일정과 카페 선택까지 한 흐름으로 안내해, 길게 채팅하지 않고 60분의 실제 만남으로 이어집니다.",
  },
];

export const COMPARISON_ROWS = [
  {
    label: "주요 방식",
    datingApp: "프로필 탐색과 채팅 중심",
    groupMeeting: "여러 사람과 순환 대화",
    twoweeks: "한 사람과 60분 오프라인 만남",
  },
  {
    label: "만나는 사람",
    datingApp: "여러 프로필을 직접 탐색",
    groupMeeting: "여러 명과 한 번에 만남",
    twoweeks: "검토한 한 사람만 제안",
  },
  {
    label: "한 사람과 대화",
    datingApp: "채팅 후 개별 약속",
    groupMeeting: "약 10~15분",
    twoweeks: "카페에서 약 60분",
  },
  {
    label: "참여 확인",
    datingApp: "서비스별 인증 기준이 다름",
    groupMeeting: "모임별 기준이 다름",
    twoweeks: "본인인증·직업자료 검토",
  },
  {
    label: "약속까지",
    datingApp: "채팅 후 당사자가 직접 조율",
    groupMeeting: "정해진 현장에 참여",
    twoweeks: "일정·카페·만남까지 안내",
  },
];

export const FLOW_STEPS = [
  {
    number: "01",
    kicker: "신청",
    title: "본인인증과 프로필을 제출해요",
    desc: "기본 정보와 활동 지역, 프로필 사진 3장 이상, 직업 인증자료를 입력하면 운영자가 직접 검토합니다.",
    image: "/image/twoweeks/process/process-01.webp",
  },
  {
    number: "02",
    kicker: "제안",
    title: "검토된 한 사람의 프로필을 확인해요",
    desc: "등록한 프로필 사진과 나이·직업군·활동 지역·가능 시간 등 만남 전 필요한 정보를 먼저 확인합니다.",
    image: "/image/twoweeks/process/process-02.webp",
  },
  {
    number: "03",
    kicker: "일정 조율",
    title: "둘 다 원하면 일정과 카페를 정해요",
    desc: "서로 가능한 시간과 생활권을 바탕으로 약속 장소와 만남 시간을 화면에서 선택합니다.",
    image: "/image/twoweeks/process/process-03.webp",
  },
  {
    number: "04",
    kicker: "만남과 선택",
    title: "60분 만나고, 각자 다음을 선택해요",
    desc: "카페에서 편하게 대화한 뒤 두 사람 모두 원할 때만 연락처를 공개합니다.",
    image: "/image/twoweeks/process/process-04.webp",
  },
];

export const MEETING_TIMELINE_STEPS = [
  {
    time: "도착하면",
    title: "자리와 도착 여부를 간단히 확인해요",
    desc: "복장 한마디와 자리·음료 사진을 남기면 상대가 카페에서 쉽게 찾을 수 있습니다.",
  },
  {
    time: "약 1시간",
    title: "한 사람과 편하게 대화해요",
    desc: "정해진 카페에서 약 60분 동안 대화합니다. 두 분이 원한다면 더 이어가도 괜찮습니다.",
  },
  {
    time: "만남 후",
    title: "각자 편하게 다음 의사를 남겨요",
    desc: "짧은 피드백을 남기고, 두 사람 모두 다시 만나고 싶을 때만 연락처가 공개됩니다.",
  },
];

export const CONSULTATION_CASES = [
  {
    topic: "참여 지역 문의",
    question: "아직 신청 전인데, 제가 참여 가능한 지역인지 먼저 확인할 수 있을까요?",
    answer: "네. 활동 가능한 지역을 알려주시면 현재 모집 상황과 함께 안내드릴게요.",
  },
  {
    topic: "프로필 공개 범위",
    question: "매칭 제안에서는 상대방의 어떤 정보까지 확인할 수 있나요?",
    answer: "등록한 프로필 사진과 나이, 직업군, 활동 지역, 가능 시간, 키, 소개를 확인할 수 있어요. 인증자료와 연락처는 공개하지 않습니다.",
  },
  {
    topic: "진행 방식 문의",
    question: "신청하기 전에 일정 조율이나 만남 진행 방식부터 상담받아도 될까요?",
    answer: "물론입니다. 공개 범위와 일정 조율, 만남 당일 진행까지 궁금한 내용을 먼저 확인한 뒤 신청하셔도 됩니다.",
  },
];

export const TRUST_ITEMS = [
  {
    label: "매칭비",
    value: "현재 무료",
    desc: "서비스 이용료 없이 시작합니다.",
  },
  {
    label: "예치금",
    value: "30,000원",
    desc: "노쇼 방지를 위한 보증금이며 정상 참여 시 소진되지 않습니다.",
  },
  {
    label: "연락처",
    value: "상호 동의",
    desc: "만남 후 두 사람 모두 원할 때만 공개합니다.",
  },
];

export const FAQ_ITEMS = [
  {
    q: "누가 신청할 수 있나요?",
    a: "현재 1985년생부터 2000년생까지, 서울 남부권에서 만남이 가능한 미혼 남녀를 모집합니다.",
  },
  {
    q: "어떤 검증을 거치나요?",
    a: "신청 시 본인인증을 완료하고, 프로필 사진 3장 이상과 명함·사원증·학생증·재직 또는 재학 확인 화면 중 한 가지 직업 인증자료를 제출합니다. 사진·프로필과 인증자료는 운영자가 직접 확인하며, 제출한 인증자료는 상대방에게 공개하지 않습니다.",
  },
  {
    q: "2주마다 반드시 매칭되나요?",
    a: "2주 단위 회차에 맞춰 한 사람을 제안하는 것이 기본입니다. 다만 지역, 일정, 기본 조건이 맞는 상대가 없을 때는 다음 회차로 조정될 수 있습니다.",
  },
  {
    q: "마음에 들지 않으면 거절할 수 있나요?",
    a: "네. 상대 프로필을 확인한 제안 단계에서는 원하지 않는 만남을 패스해도 예치금이 차감되지 않습니다. 다만 반복적인 패스나 무응답이 이어지면 실제 만남 의사가 낮은 것으로 판단되어 추후 매칭 우선순위가 조정될 수 있습니다.",
  },
  {
    q: "사진과 연락처는 언제 공개되나요?",
    a: "제안 단계부터 등록한 프로필 사진과 나이, 직업군, 활동 지역, 가능 시간, 키, 소개를 확인할 수 있습니다. 회사명은 양쪽이 진행 의사를 확인한 뒤 공개되며, 연락처는 실제 만남 후 두 사람 모두 재만남과 공개에 동의한 경우에만 전달합니다. 인증자료는 어느 단계에서도 상대에게 공개하지 않습니다.",
  },
  {
    q: "예치금은 왜 필요한가요?",
    a: "실제 만남 의사를 확인하고 노쇼를 줄이기 위한 보증금입니다. 정상적으로 만남에 참여하면 이용료처럼 소진되지 않으며, 서비스 중단 시 진행 중인 일정이나 확인 건이 없다면 반환을 요청할 수 있습니다.",
  },
  {
    q: "신청하기 전에 먼저 상담해도 되나요?",
    a: "물론입니다. 활동 지역, 모집 상황, 진행 방식이 궁금하다면 카카오톡으로 먼저 문의한 뒤 천천히 결정해도 됩니다.",
  },
];
