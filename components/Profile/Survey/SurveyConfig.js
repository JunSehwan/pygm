export const SURVEY_SECTIONS = [
  {
    key: "romance",
    title: "연애/결혼관",
    description: "연애 스타일과 결혼 가치관을 정리해보세요.",
    fields: [
      {
        key: "opfriend",
        title: "이성친구 수(과거 포함)가 많은 편인가요?",
        type: "single",
        options: ["전혀없음", "한 두명", "몇명 있음", "많은 편이다"],
      },
      {
        key: "friendmeeting",
        title: "내 연인이 다른 이성친구와 단 둘이 만나는 건 어떤가요?",
        type: "single",
        options: ["절대불가", "차 한잔 정도", "같이 식사 한끼", "문화생활 함께하기", "술한잔 가능", "상관 없음"],
      },
      {
        key: "longdistance",
        title: "장거리연애에 대해서 어떻게 생각하나요?",
        type: "single",
        options: ["절대불가", "가능하지만 자신은 없음", "가능한 편", "웬만하면 가능"],
      },
      {
        key: "datecycle",
        title: "선호하는 데이트/만남의 주기는?",
        type: "single",
        options: ["한달에 1회미만", "한달에 1회", "격주 1회", "주1~2회", "주3~4회", "주5~7회"],
      },
      {
        key: "dateromance",
        title: "원하는 연애 스타일은 무엇인가요?",
        type: "single",
        options: ["같이 산책하는 등 소소한 행복", "항상 설레는 연애", "새로운 경험을 함께하는 연애", "현실적, 안정적인 연애"],
      },
      {
        key: "contact",
        title: "연락의 빈도는 얼마나 중요한가요?",
        type: "single",
        options: ["전혀 중요하지 않다", "크게 중요하지 않음", "연애 초기만 중요한 편", "중요한 편이다", "매우 중요하다"],
      },
      {
        key: "contactcycle",
        title: "선호하는 연락 주기는?",
        type: "single",
        options: ["매번 어디든 상황공유", "최소 아침/저녁에는 연락", "이따금씩 한번씩", "하루에 한번정도", "상관 없다"],
      },
      {
        key: "passwordshare",
        title: "연인끼리 휴대폰/비밀번호 공유가 가능한가요?",
        type: "single",
        options: ["프라이버시는 지켜줘야 한다", "알려줘도 상관없다"],
      },
      {
        key: "wedding",
        title: "결혼에 대해 얼마나 열려 있나요?",
        type: "single",
        options: ["아직 관심없음", "원하지만 계획은 없음", "1~2년내", "당장이라도 가능"],
      },
      {
        key: "wedding_dating",
        title: "결혼 전 적정 연애기간은 어느 정도인가요?",
        type: "single",
        options: ["크게 중요하지 않음", "3년 이상", "1년~3년", "6개월~1년", "6개월이내 가능", "3개월이내 가능"],
      },
    ],
  },
  {
    key: "hobby",
    title: "취미/여가",
    description: "취미와 생활 패턴을 선택해주세요.",
    fields: [
      {
        key: "mbti",
        title: "MBTI를 선택해주세요",
        type: "mbti",
      },
      {
        key: "hobby",
        title: "취미를 선택해주세요",
        type: "multi_chip",
        maxSelect: 5,
        options: [
          "러닝 / 헬스", "필라테스 / 요가", "등산 / 트레킹", "수영", "테니스 / 배드민턴", "골프",
          "산책 / 드라이브", "자전거", "축구 / 농구 / 풋살", "캠핑 / 차박",
          "여행 / 국내", "여행 / 해외", "카페 / 디저트", "맛집탐방", "요리 / 베이킹",
          "영화 / 드라마", "OTT / 유튜브", "전시 / 미술관", "공연 / 뮤지컬", "독서",
          "글쓰기 / 일기", "사진 / 영상", "음악감상", "악기연주", "댄스",
          "게임 / 콘솔", "보드게임", "반려동물", "봉사활동", "외국어 공부",
          "재테크 / 경제공부", "명상 / 마음챙김", "와인 / 위스키", "클래식 / 재즈", "기타",
        ],
        saveMode: "multi_text",
      },
      {
        key: "drink",
        title: "음주 빈도는 어떻게 되시나요?",
        type: "single",
        options: ["전혀 없음", "월 1회 미만", "월 1회", "주 1회", "주 2~3회", "주 3~4회", "주 5회 이상"],
      },
      {
        key: "health",
        title: "평소에 운동을 즐기시나요?",
        type: "single",
        options: ["전혀 안함", "아주 가끔", "주 1회", "주 2~3회", "주 4~5회", "매일"],
      },
      {
        key: "hotplace",
        title: "핫플레이스/맛집 탐방을 좋아하시나요?",
        type: "single",
        options: ["관심없음", "집 근처면 가끔 가는수준", "가끔씩 맛집방문", "맛집탐방 매니아"],
      },
      {
        key: "tour",
        title: "여행을 자주 다니는 편인가요?",
        type: "single",
        options: ["관심없음", "수년에 1회", "년 1~2회", "년 3~6회", "년 7~12회", "월 1회이상"],
      },
      {
        key: "tourlike",
        title: "어떤 여행을 더 선호하시나요?",
        type: "single",
        options: ["관심없음", "국내여행", "해외여행", "어디든 좋음"],
      },
      {
        key: "tourpurpose",
        title: "여행의 주된 목적은 무엇인가요?",
        type: "single",
        options: ["주로 관광", "주로 휴양", "새로운 경험과 문화접촉", "사람들과 관계", "일상의 해방", "도전과 탐험"],
      },
      {
        key: "hobbyshare",
        title: "연인과 취미를 얼마나 공유하고 싶나요?",
        type: "single",
        options: ["상대방의 취미엔 신경안씀", "한 개 정도는 공유하고 싶다", "많은 취미를 함께하고 싶다", "생각해 본 적 없음"],
      },
    ],
  },
  {
    key: "career",
    title: "커리어/생활",
    description: "생활 습관과 현실적인 가치관을 알려주세요.",
    fields: [
      {
        key: "career_goal",
        title: "미래의 경력목표가 있나요?",
        type: "single",
        options: ["꾸준히 지금 일을 계속한다", "학위 또는 자격취득", "이직 또는 취업", "사업", "카페나 자영업", "투자/재테크", "투잡", "관심 없음"],
      },
      {
        key: "living_weekend",
        title: "주말에는 주로 어떤 활동을 하시나요?",
        type: "single",
        options: ["집에서 휴식", "산책과 운동", "친구만나기", "학습(직무/재테크 등)", "취미생활", "봉사활동", "드라이브", "게임", "기타"],
      },
      {
        key: "living_consume",
        title: "본인의 소비습관은 어떤가요?",
        type: "single",
        options: ["자린고비", "필요한것만 사는 편", "이따금씩 플렉스", "고민없이 플렉스", "스트레스로 플렉스"],
      },
      {
        key: "living_pet",
        title: "반려동물에 대해서 어떻게 생각하시나요?",
        type: "single",
        options: ["매우 싫다", "반려동물은 그닥...", "크게 상관없다", "매우 긍정적", "동물에 따라 다름"],
      },
      {
        key: "living_tatoo",
        title: "타투(문신)에 대해서 어떻게 생각하시나요?",
        type: "single",
        options: ["매우 싫다", "한 두개는 괜찮다", "괜찮다", "멋지다고 생각한다", "나 역시 타투 경험이 있다"],
      },
      {
        key: "living_smoke",
        title: "흡연에 대해서 어떻게 생각하시나요?",
        type: "single",
        options: ["긍정적이다", "크게 상관없다", "전자담배는 괜찮다", "조금은 부정적이다", "끊으면 좋겠다", "매우 싫다", "생각해본 적 없다"],
      },
      {
        key: "living_charming",
        title: "이성에게 매력적으로 느끼는 포인트는?",
        type: "single",
        options: ["귀여움", "섹시함", "청순함", "시크함", "유머러스", "배려심", "듬직함", "로맨틱", "자유분방함", "섬세함"],
      },
    ],
  },
  {
    key: "extra",
    title: "기타 가치관",
    description: "종교/식습관 등의 생활 가치관을 확인해요.",
    fields: [
      {
        key: "religion_important",
        title: "본인에게 종교는 얼마나 큰 의미인가요?",
        type: "single",
        options: ["무교", "큰 의미는 없음", "이따금씩 의지하는 수준", "종교는 매우 중요한 존재", "내 인생의 가장 우선순위"],
      },
      {
        key: "religion_visit",
        title: "종교행사에 참석하는 빈도는 어떻게 되나요?",
        type: "single",
        options: ["무교", "거의 참석 안함", "월 1회 이하", "월 2~3회", "주 1회", "주 2회 이상"],
      },
      {
        key: "religion_accept",
        title: "내 연인이 종교활동(행사)에 참여하는 것에 대해서 어떻게 생각하나요?",
        type: "single",
        options: ["무교만 가능", "안했으면 한다", "아주 가끔은 괜찮다", "월 1회", "월 2~3회", "주 1회", "상관 없음"],
      },
      {
        key: "food_taste",
        title: "입맛이 까다로운 편이신가요?",
        type: "single",
        options: ["가리는게 없음", "몇가지 빼고는 다 잘먹음", "까다로운 편", "매우 까다로움"],
      },
      {
        key: "food_like",
        title: "어떤 음식종류를 가장 선호하시나요?",
        type: "single",
        options: ["돼지고기", "소고기", "치킨", "중식", "돈까스", "회", "초밥", "피자", "패스트푸드", "찜,탕류", "족발,보쌈", "떡볶이 등 분식류", "감자탕", "한식류", "기타"],
      },
      {
        key: "food_dislike",
        title: "못 먹는 음식을 선택해주세요.",
        type: "single",
        options: ["가리는 것 없음", "비린내나는 음식", "소고기", "돼지고기", "닭고기", "채소류", "생선류", "날것류", "곱창/내장 등", "고수", "향신료 강한 음식", "매운 음식", "징그러운 비주얼", "냄새가 강한 음식"],
      },
      {
        key: "food_vegetarian",
        title: "채식주의자인가요?",
        type: "single",
        options: ["채식주의자다", "채식을 주로 먹는다", "채식주의자가 아니다", "채식을 선호하지 않는다"],
      },
      {
        key: "food_spicy",
        title: "매운 음식을 선호하시나요?",
        type: "single",
        options: ["정말 못 먹는다", "있으면 먹는 정도", "가끔 찾아먹는다", "즐겨 먹는다", "매운맛 매니아"],
      },
      {
        key: "food_diet",
        title: "다이어트 식단을 하시나요?",
        type: "single",
        options: ["관심없다", "현재 하지 않는다", "이따금씩 식단 한다", "진행중이다", "매끼마다 식단 중"],
      },
    ],
  },
];

function getSurveyFieldKey(field = {}) {
  return field?.key || field?.field || "";
}

function isMbtiField(field = {}) {
  return field?.type === "mbti" || getSurveyFieldKey(field) === "mbti";
}

export function sanitizeMultiArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function parseMbtiString(mbti = "") {
  const text = String(mbti || "").trim().toUpperCase();
  if (text.length !== 4) {
    return { ei: "", sn: "", tf: "", jp: "" };
  }

  return {
    ei: text[0] || "",
    sn: text[1] || "",
    tf: text[2] || "",
    jp: text[3] || "",
  };
}

function normalizeSingleChoiceStoredValue(rawValue, field = {}) {
  const value = String(rawValue ?? "").trim();
  if (!value) return "";

  const options = Array.isArray(field?.options) ? field.options : [];

  if (/^\d+$/.test(value)) {
    return value;
  }

  const matchedIndex = options.findIndex((option) => String(option).trim() === value);
  if (matchedIndex >= 0) {
    return String(matchedIndex + 1);
  }

  return value;
}

export function getFieldValue(user = {}, field = {}) {
  if (isMbtiField(field)) {
    const fromFlat = {
      ei: user?.mbti_ei || "",
      sn: user?.mbti_sn || "",
      tf: user?.mbti_tf || "",
      jp: user?.mbti_jp || "",
    };

    if (fromFlat.ei || fromFlat.sn || fromFlat.tf || fromFlat.jp) {
      return fromFlat;
    }

    return parseMbtiString(user?.mbti || "");
  }

  const fieldKey = getSurveyFieldKey(field);
  const rawValue = user?.[fieldKey];

  if (field.type === "multi_chip") {
    if (Array.isArray(user?.[`${fieldKey}List`])) {
      return sanitizeMultiArray(user[`${fieldKey}List`]);
    }

    if (Array.isArray(rawValue)) {
      return sanitizeMultiArray(rawValue);
    }

    if (typeof rawValue === "string" && rawValue.trim()) {
      return sanitizeMultiArray(rawValue.split("|").map((v) => v.trim()));
    }

    return [];
  }

  if (field.type === "single") {
    return normalizeSingleChoiceStoredValue(rawValue, field);
  }

  return rawValue ?? "";
}

export function hasMeaningfulAnswer(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => String(item || "").trim() !== "").length > 0;
  }

  if (typeof value === "string") {
    return value.trim() !== "";
  }

  if (typeof value === "number") {
    return true;
  }

  if (typeof value === "boolean") {
    return true;
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((v) => hasMeaningfulAnswer(v));
  }

  return false;
}

export function getQuestionAnsweredCount(user = {}, section = {}) {
  const fields = Array.isArray(section?.fields) ? section.fields : [];

  return fields.filter((field) => {
    const value = getFieldValue(user, field);

    if (isMbtiField(field)) {
      return !!(
        String(value?.ei || "").trim() &&
        String(value?.sn || "").trim() &&
        String(value?.tf || "").trim() &&
        String(value?.jp || "").trim()
      );
    }

    if (field.type === "multi_chip") {
      return Array.isArray(value) && value.length > 0;
    }

    return !!String(value || "").trim();
  }).length;
}

export function getAllSurveyQuestions() {
  if (!Array.isArray(SURVEY_SECTIONS)) return [];

  return SURVEY_SECTIONS.flatMap((section) => {
    if (!Array.isArray(section?.fields)) return [];
    return section.fields;
  });
}

export function getAllSurveyFields() {
  return getAllSurveyQuestions();
}

export function getTotalQuestionCount() {
  return getAllSurveyFields().length;
}

export function getTotalAnsweredCount(user = {}) {
  return SURVEY_SECTIONS.reduce((acc, section) => {
    return acc + getQuestionAnsweredCount(user, section);
  }, 0);
}

export function buildSurveyPatch(section, draft = {}) {
  const patch = {};
  const fields = Array.isArray(section?.fields) ? section.fields : [];

  fields.forEach((field) => {
    const fieldKey = getSurveyFieldKey(field);
    const value = draft?.[fieldKey];

    if (isMbtiField(field)) {
      const mbtiValue = value && typeof value === "object" ? value : {};

      patch.mbti_ei = mbtiValue.ei || "";
      patch.mbti_sn = mbtiValue.sn || "";
      patch.mbti_tf = mbtiValue.tf || "";
      patch.mbti_jp = mbtiValue.jp || "";

      const fullMbti = [
        mbtiValue.ei || "",
        mbtiValue.sn || "",
        mbtiValue.tf || "",
        mbtiValue.jp || "",
      ].join("");

      patch.mbti = fullMbti.length === 4 ? fullMbti : "";
      return;
    }

    if (field.type === "multi_chip") {
      const sanitized = sanitizeMultiArray(value);
      patch[`${fieldKey}List`] = sanitized;
      patch[fieldKey] = sanitized.join("|");
      return;
    }

    patch[fieldKey] = value ?? "";
  });

  return patch;
}