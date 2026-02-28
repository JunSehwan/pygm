// /data/tests/realismQuestions.js
// JS Only

/**
 * 성별 기준
 * userGender === "male"  -> "여자가 남자봄(남자점수)" 가중치 사용
 * userGender === "female"-> "남자가 여자봄" 가중치 사용
 *
 * choiceIndex: 0~4 (1~5번)
 */

export const GENDERS = {
  male: "male",
  female: "female",
};

export const SECTIONS = {
  SELF: "self",   // <나에 대한 평가>
  IDEAL: "ideal", // <원하는 이상형>
};

// 공통 유틸: 선택지 '-' 는 선택 불가로 처리할 예정(렌더에서 disabled)
export function isDisabledOption(label) {
  if (label === null || label === undefined) return true;
  const t = String(label).trim();
  return t === "" || t === "-" || t === "—";
}

/**
 * 질문 스키마
 * - optionsByGender: { male: [5], female: [5] }
 * - weights: { femaleSeesMale: [5], maleSeesFemale: [5] }
 */
export const SELF_QUESTIONS = [
  {
    id: "S1",
    section: SECTIONS.SELF,
    category: "성별",
    title: "귀하의 성별은?",
    // 성별 문항은 스코어링 제외(가중치 없음). 화면에서 특별 처리.
    optionCount: 2, // ✅ 추가
    optionsByGender: {
      male: ["남자", "여자"],
      female: ["남자", "여자"],
    },
    weights: null,
  },

  {
    id: "S2",
    section: SECTIONS.SELF,
    category: "연령대",
    title: "연령이 어떻게 되시나요?",
    optionsByGender: {
      male: ["28세 이하", "32세 이하", "35세 이하", "40세 이하", "40세 이상"],
      female: ["25세 이하", "29세 이하", "33세 이하", "38세 이하", "38세 이상"],
    },
    weights: {
      femaleSeesMale: [20, 16, 13, 9, 5],
      maleSeesFemale: [35, 28, 20, 13, 5],
    },
  },

  {
    id: "S3",
    section: SECTIONS.SELF,
    category: "지역",
    title: "거주지역은 어디쪽인가요?",
    optionsByGender: {
      male: ["서울", "수도권", "충청권", "지방", "외국"],
      female: ["서울", "수도권", "충청권", "지방", "외국"],
    },
    weights: {
      femaleSeesMale: [27, 22, 16, 11, 5],
      maleSeesFemale: [30, 24, 18, 11, 5],
    },
  },

  {
    id: "S4",
    section: SECTIONS.SELF,
    category: "능력",
    title: "어느정도 학력의 이성을 원하시나요?",
    optionsByGender: {
      male: [
        "최상위권(스카이·의치한·명문대)",
        "수도권 4년제 또는 중~상위권 대학 이상",
        "4년제졸업",
        "전문대졸",
        "고졸이하",
      ],
      female: [
        "최상위권(스카이·의치한·명문대)",
        "수도권 4년제 또는 중~상위권 대학 이상",
        "4년제졸업",
        "전문대졸",
        "고졸이하",
      ],
    },
    weights: {
      femaleSeesMale: [10, 7, 5, 3, 1],
      maleSeesFemale: [10, 7, 5, 3, 1],
    },
  },

  {
    id: "S5",
    section: SECTIONS.SELF,
    category: "능력",
    title: "당신의 직업을 선택해주세요.",
    optionsByGender: {
      male: ["전문직", "대기업/금융권", "중견기업/공기업/우량중소기업", "중소기업/자영업자/프리랜서", "학생/취준/무직"],
      female: ["전문직", "대기업/금융권", "중견기업/공기업/우량중소기업", "중소기업/자영업자/프리랜서", "학생/취준/무직"],
    },
    weights: {
      femaleSeesMale: [26, 21, 16, 10, 5],
      maleSeesFemale: [15, 13, 10, 8, 5],
    },
  },

  {
    id: "S6",
    section: SECTIONS.SELF,
    category: "능력",
    title: "당신의 현재 연봉수준(세전)은?",
    optionsByGender: {
      male: ["1억이상", "7천~1억", "5천~7천", "3천~5천", "3천이하"],
      female: ["1억이상", "7천~1억", "5천~7천", "3천~5천", "3천이하"],
    },
    weights: {
      femaleSeesMale: [23, 19, 14, 10, 5],
      maleSeesFemale: [12, 10, 9, 7, 5],
    },
  },

  {
    id: "S7",
    section: SECTIONS.SELF,
    category: "능력",
    title: "보유자산은 어느정도 수준인가요?",
    optionsByGender: {
      male: ["10억 이상", "3억~10억", "1억~3억", "5천만~1억", "5천만원미만"],
      female: ["10억 이상", "3억~10억", "1억~3억", "5천만~1억", "5천만원미만"],
    },
    weights: {
      femaleSeesMale: [20, 16, 13, 9, 5],
      maleSeesFemale: [15, 13, 10, 8, 5],
    },
  },

  {
    id: "S8",
    section: SECTIONS.SELF,
    category: "능력",
    title: "부모님 노후준비는 되어 있나요?",
    optionsByGender: {
      male: [
        "노후 준비가 충분히 되어 있고 걱정 없다",
        "노후 준비가 어느 정도 되어 있다",
        "크게 걱정은 없지만 완전하진 않다",
        "약간의 지원이 필요한 편이다",
        "부모님 지원을 해드려야 하는 편이다",
      ],
      female: [
        "노후 준비가 충분히 되어 있고 걱정 없다",
        "노후 준비가 어느 정도 되어 있다",
        "크게 걱정은 없지만 완전하진 않다",
        "약간의 지원이 필요한 편이다",
        "부모님 지원을 해드려야 하는 편이다",
      ],
    },
    weights: {
      femaleSeesMale: [18, 15, 12, 8, 5],
      maleSeesFemale: [10, 9, 8, 6, 5],
    },
  },

  {
    id: "S9",
    section: SECTIONS.SELF,
    category: "외모평가",
    title: "평소 본인의 외모에 대한 얘기를 들어보신 적 있으신가요?",
    optionsByGender: {
      male: [
        "잘생겼다는 얘기를 자주 듣는다",
        "꽤 괜찮다는 말을 종종 듣는다",
        "가끔 “꾸미면 괜찮다”는 말을 듣는다",
        "외모에 관한 얘기를 들은 적이 많이 없다.",
        "외모가 별로라는 말을 가끔 들어본 적 있다.",
      ],
      female: [
        "예쁘다는 얘기를 자주 듣는다",
        "꽤 괜찮다는 말을 종종 듣는다",
        "가끔 “꾸미면 괜찮다”는 말을 듣는다",
        "외모에 관한 얘기를 들은 적이 많이 없다.",
        "외모가 별로라는 말을 가끔 들어본 적 있다.",
      ],
    },
    weights: {
      femaleSeesMale: [26, 21, 16, 10, 5],
      maleSeesFemale: [40, 31, 23, 14, 5],
    },
  },

  {
    id: "S10",
    section: SECTIONS.SELF,
    category: "외모평가",
    title: "본인의 키는?",
    optionsByGender: {
      male: ["180 이상", "176~179", "170~175", "164~170", "164 미만"],
      female: ["165 이상", "163 이상", "160 이상", "155~160", "155 미만"],
    },
    weights: {
      femaleSeesMale: [25, 20, 15, 10, 5],
      maleSeesFemale: [15, 13, 10, 8, 5],
    },
  },

  {
    id: "S11",
    section: SECTIONS.SELF,
    category: "외모평가",
    title: "본인의 체형은 어떠신가요?",
    optionsByGender: {
      male: [
        // "75~84(보통체형)",
        // "68~74(호리호리한편)",
        // "85~100미만(퉁퉁한편)",
        // "67 미만(마른편)",
        // "100kg이상(뚱뚱한 편)",
        "보통체형",
        "호리호리한편",
        "퉁퉁한편",
        "마른편",
        "뚱뚱한 편",
      ],
      female: ["보통체형", "호리호리한 편", "퉁퉁한편", "깡마른편", "뚱뚱한 편"],
    },
    weights: {
      femaleSeesMale: [20, 15, 15, 5, 5],
      maleSeesFemale: [25, 15, 15, 5, 5],
    },
  },

  {
    id: "S12",
    section: SECTIONS.SELF,
    category: "부가질문1",
    title: "모발상태는 어떠신가요?",
    optionsByGender: {
      male: ["모발이 풍성하고 건강한 편이다", "정상 범주, 특별한 고민 없음", "조금 약해졌지만 크게 티는 안 난다", "눈에 보이는 탈모 초기 증상 있음", "두피가 많이 비어 보인다"],
      female: ["모발이 풍성하고 건강한 편이다", "정상 범주, 특별한 고민 없음", "조금 약해졌지만 크게 티는 안 난다", "눈에 보이는 탈모 초기 증상 있음", "두피가 많이 비어 보인다"],
    },
    weights: {
      femaleSeesMale: [25, 20, 15, 10, 5],
      maleSeesFemale: [25, 20, 15, 10, 5],
    },
  },

  {
    id: "S13",
    section: SECTIONS.SELF,
    category: "성격",
    title: "성격·정서적인 안정에 관하여 평상시 어떻습니까?",
    optionsByGender: {
      male: ["항상 침착하고 큰 상황에서도 안정적이다", "대체로 차분하고 감정 조절을 잘한다", "보통 수준이다 (기복은 있지만 조절 가능)", "감정 변화가 종종 있다", "감정 기복이 크고 스트레스를 잘 받는 편이다"],
      female: ["항상 침착하고 큰 상황에서도 안정적이다", "대체로 차분하고 감정 조절을 잘한다", "보통 수준이다 (기복은 있지만 조절 가능)", "감정 변화가 종종 있다", "감정 기복이 크고 스트레스를 잘 받는 편이다"],
    },
    weights: {
      femaleSeesMale: [10, 9, 8, 6, 5],
      maleSeesFemale: [20, 16, 13, 9, 5],
    },
  },

  {
    id: "S14",
    section: SECTIONS.SELF,
    category: "성격",
    title: "평소에 어떤 성격을 가지고 계신가요?",
    optionsByGender: {
      male: ["분위기를 잘 띄우는 편이다 (유머 감각 좋음)", "재밌다는 말을 종종 듣는다", "평범한 편이다", "가끔 어색해지는 편이다", "재미없다는 말을 들은 적 있다"],
      female: ["분위기를 잘 띄우는 편이다 (유머 감각 좋음)", "재밌다는 말을 종종 듣는다", "평범한 편이다", "가끔 어색해지는 편이다", "재미없다는 말을 들은 적 있다"],
    },
    weights: {
      femaleSeesMale: [10, 9, 8, 6, 5],
      maleSeesFemale: [8, 7, 7, 6, 5],
    },
  },

  {
    id: "S15",
    section: SECTIONS.SELF,
    category: "음주량",
    title: "주량이 어떻게 되시나요?",
    optionsByGender: {
      male: ["적당히 즐기는 편이다.", "술자리를 좋아하고 어느정도 마시는 편이다.", "한두 잔이면 충분하다.", "전혀 못마신다.", "상당히 강한 편이며 자주마신다."],
      female: ["적당히 즐기는 편이다.", "술자리를 좋아하고 어느정도 마시는 편이다.", "한두 잔이면 충분하다.", "전혀 못마신다.", "상당히 강한 편이며 자주마신다."],
    },
    weights: {
      femaleSeesMale: [8, 7, 7, 6, 5],
      maleSeesFemale: [10, 9, 8, 6, 5],
    },
  },

  {
    id: "S16",
    section: SECTIONS.SELF,
    category: "부가질문2",
    title: "흡연을 하시나요?",
    optionsByGender: {
      male: ["비흡연", "-", "전자담배만 핀다", "-", "흡연을 한다."],
      female: ["비흡연", "-", "전자담배만 핀다", "-", "흡연을 한다."],
    },
    weights: {
      femaleSeesMale: [15, 0, 10, 0, 5],
      maleSeesFemale: [15, 0, 10, 0, 5],
    },
  },

  {
    id: "S17",
    section: SECTIONS.SELF,
    category: "패션평가",
    title: "이성에게 옷을 잘 입는다는 소리를 들어보셨나요?",
    optionsByGender: {
      male: ["패션 센스가 좋다는 칭찬을 자주 듣는다", "옷 잘 입는다는 말을 종종 듣는다", "평범한 편이다 (무난하게 입는 편)", "가끔은 스타일이 아쉽다는 말을 들은 적 있다", "패션에 신경을 거의 쓰지 않는 편이다"],
      female: ["패션 센스가 좋다는 칭찬을 자주 듣는다", "옷 잘 입는다는 말을 종종 듣는다", "평범한 편이다 (무난하게 입는 편)", "가끔은 스타일이 아쉽다는 말을 들은 적 있다", "패션에 신경을 거의 쓰지 않는 편이다"],
    },
    weights: {
      femaleSeesMale: [12, 9, 6, 3, 0],
      maleSeesFemale: [10, 8, 5, 3, 0],
    },
  },

  {
    id: "S18",
    section: SECTIONS.SELF,
    category: "성격",
    title: "나는 내 매력을 객관적으로 설명할 수 있다",
    optionsByGender: {
      male: ["내 매력을 명확하게 알고 잘 설명할 수 있다", "상대에게 충분히 설명할 수 있다", "조금은 설명할 수 있다", "어렴풋이 알고는 있지만 표현이 어렵다", "솔직히 잘 모르겠다 (설명하기 어렵다)"],
      female: ["내 매력을 명확하게 알고 잘 설명할 수 있다", "상대에게 충분히 설명할 수 있다", "조금은 설명할 수 있다", "어렴풋이 알고는 있지만 표현이 어렵다", "솔직히 잘 모르겠다 (설명하기 어렵다)"],
    },
    weights: {
      femaleSeesMale: [7, 5, 4, 2, 0],
      maleSeesFemale: [10, 8, 5, 3, 0],
    },
  },

  {
    id: "S19",
    section: SECTIONS.SELF,
    category: "사회적능력",
    title: "관계에 있어서 여유가 넘치는 편이신가요?",
    optionsByGender: {
      male: ["항상 차분하고 여유가 넘치는 편이다", "대체로 여유로운 편이다", "평범한 수준 (상황에 따라 다름)", "어색하거나 부담되면 긴장하는 편이다", "긴장을 많이 하고 여유가 거의 없다"],
      female: ["항상 차분하고 여유가 넘치는 편이다", "대체로 여유로운 편이다", "평범한 수준 (상황에 따라 다름)", "어색하거나 부담되면 긴장하는 편이다", "긴장을 많이 하고 여유가 거의 없다"],
    },
    weights: {
      femaleSeesMale: [8, 6, 4, 2, 0],
      maleSeesFemale: [5, 4, 3, 1, 0],
    },
  },
];

export const IDEAL_QUESTIONS = [
  {
    id: "I1",
    section: SECTIONS.IDEAL,
    category: "연령선호",
    title: "어떤 연령대를 선호하십니까?",
    optionsByGender: {
      male: ["7살이상 어려야 한다", "3살이상 어려야 한다", "동갑이하 가능", "위로 5살까지는 가능", "나이는 상관없다"],
      female: ["동갑이하 선호", "위아래 3살까지 가능", "위아래 5살까지 가능", "위아래로 10살까지는 가능", "나이는 상관없다"],
    },
    weights: {
      femaleSeesMale: [22, 18, 14, 10, 4],
      maleSeesFemale: [37, 30, 24, 17, 7],
    },
  },

  {
    id: "I2",
    section: SECTIONS.IDEAL,
    category: "지역",
    title: "거주지역은 어디까지 허용 가능한가요?",
    optionsByGender: {
      male: ["같은 시/구 안만 가능", "같은 권역(수도권·충청권·영남권 등)만 가능", "수도권 / 광역시까지만 가능", "수도권 + 광역시까지 가능", "전국 어디든 상관없다 (해외 포함)"],
      female: ["같은 시/구 안만 가능", "같은 권역(수도권·충청권·영남권 등)만 가능", "수도권 / 광역시까지만 가능", "수도권 + 광역시까지 가능", "전국 어디든 상관없다 (해외 포함)"],
    },
    weights: {
      femaleSeesMale: [12, 10, 8, 5, 2],
      maleSeesFemale: [12, 10, 8, 5, 2],
    },
  },

  {
    id: "I3",
    section: SECTIONS.IDEAL,
    category: "종교",
    title: "상대방의 종교는 어디까지 가능한가요?",
    optionsByGender: {
      male: ["종교·신앙 생활 방식까지 세부적으로 맞아야 한다", "반드시 같은 종교여야 한다", "같은 종교면 좋고, 무교도 괜찮다", "특정 종교만 아니면 괜찮다", "종교 전혀 상관없다"],
      female: ["종교·신앙 생활 방식까지 세부적으로 맞아야 한다", "반드시 같은 종교여야 한다", "같은 종교면 좋고, 무교도 괜찮다", "특정 종교만 아니면 괜찮다", "종교 전혀 상관없다"],
    },
    weights: {
      femaleSeesMale: [9, 7, 6, 4, 2],
      maleSeesFemale: [6, 5, 4, 3, 1],
    },
  },

  {
    id: "I4",
    section: SECTIONS.IDEAL,
    category: "능력",
    title: "어느정도 학력의 이성을 원하시나요?",
    optionsByGender: {
      male: ["최상위권(스카이·의치한·명문대) 이상", "수도권 4년제 또는 중~상위권 대학 이상", "4년제졸업 이상", "전문대졸 이상", "학력 상관없음"],
      female: ["최상위권(스카이·의치한·명문대) 이상", "수도권 4년제 또는 중~상위권 대학 이상", "4년제졸업 이상", "전문대졸 이상", "학력 상관없음"],
    },
    weights: {
      femaleSeesMale: [19, 15, 12, 9, 4],
      maleSeesFemale: [12, 10, 8, 5, 2],
    },
  },

  {
    id: "I5",
    section: SECTIONS.IDEAL,
    category: "능력",
    title: "어느정도 직업을 선호하시나요?",
    optionsByGender: {
      male: ["전문직선호", "대기업/금융권이상", "중견기업/공기업/우량중소기업 가능", "중소기업/자영업자/프리랜서 가능", "상관없음"],
      female: ["전문직선호", "대기업/금융권이상", "중견기업/공기업/우량중소기업 가능", "중소기업/자영업자/프리랜서 가능", "상관없음"],
    },
    weights: {
      femaleSeesMale: [31, 25, 20, 14, 6],
      maleSeesFemale: [9, 7, 6, 4, 2],
    },
  },

  {
    id: "I6",
    section: SECTIONS.IDEAL,
    category: "능력",
    title: "상대방의 연봉이 어느정도 수준이어야 할까요?",
    optionsByGender: {
      male: ["1억이상", "7천~1억", "5천~7천", "3천~5천", "상관없음"],
      female: ["1억이상", "7천~1억", "5천~7천", "3천~5천", "상관없음"],
    },
    weights: {
      femaleSeesMale: [43, 34, 28, 19, 9],
      maleSeesFemale: [9, 7, 6, 4, 2],
    },
  },

  {
    id: "I7",
    section: SECTIONS.IDEAL,
    category: "외모평가",
    title: "외모는 어느정도면 좋을까요?",
    optionsByGender: {
      male: ["매우 잘생겨야 함", "잘 꾸미면 괜찮은 정도", "평범하지만 깔끔한 수준", "너무 못생기지 않으면 괜찮음", "외모는 전혀 보지 않음"],
      female: ["매우 예뻐야 함", "잘 꾸미면 괜찮은 정도", "평범하지만 깔끔한 수준", "너무 못생기지 않으면 괜찮음", "외모는 전혀 보지 않음"],
    },
    weights: {
      femaleSeesMale: [28, 22, 18, 13, 6],
      maleSeesFemale: [62, 50, 40, 28, 12],
    },
  },

  {
    id: "I8",
    section: SECTIONS.IDEAL,
    category: "외모평가",
    title: "상대방의 키는 어느정도면 좋을까요?",
    optionsByGender: {
      male: ["180 이상", "176 이상", "170 이상", "164 이상", "상관없음"],
      female: ["165 이상", "163 이상", "160 이상", "155 이상", "상관없음"],
    },
    weights: {
      femaleSeesMale: [19, 15, 12, 9, 4],
      maleSeesFemale: [12, 10, 8, 5, 2],
    },
  },

  {
    id: "I9",
    section: SECTIONS.IDEAL,
    category: "외모평가",
    title: "체형은 어느정도가 허용 가능할까요?",
    optionsByGender: {
      male: ["모델 몸매거나 근육질을 원한다.", "몸이 좀 좋고 어깨가 조금은 넓어야 한다.", "평균체형은 되어야 한다.", "심하지 않으면 괜찮다.", "전혀 상관없다"],
      female: ["몸매가 매우 좋아야 한다.", "몸매가 조금은 괜찮아야 한다.", "평범한 체형이면 가능하다.", "조금은 뚱뚱하거나 말라도 괜찮다.", "전혀 상관없다."],
    },
    weights: {
      femaleSeesMale: [9, 7, 6, 4, 2],
      maleSeesFemale: [25, 20, 16, 11, 5],
    },
  },

  {
    id: "I10",
    section: SECTIONS.IDEAL,
    category: "부가질문1",
    title: "모발상태는 어떠 상태를 원하시나요?",
    optionsByGender: {
      male: ["모발이 풍성하고 건강해야 한다.", "정상 범주면 괜찮다", "조금은 빠져도 괜찮다.", "M자, 원형탈모 심하지 않으면 괜찮다.", "전혀 상관없다."],
      female: ["모발이 풍성하고 건강해야 한다.", "정상 범주면 괜찮다", "조금은 빠져도 괜찮다.", "M자, 원형탈모 심하지 않으면 괜찮다.", "전혀 상관없다."],
    },
    weights: {
      femaleSeesMale: [6, 5, 4, 3, 1],
      maleSeesFemale: [12, 10, 8, 5, 2],
    },
  },

  {
    id: "I11",
    section: SECTIONS.IDEAL,
    category: "성격",
    title: "상대방의 성격이 어떠하면 좋을까요?",
    optionsByGender: {
      male: [
        "항상 침착하고 큰 상황에서도 안정적이어야 한다.",
        "대체로 차분하고 감정 조절을 잘하면 좋다.",
        "보통 수준이면 괜찮다. (기복은 있지만 조절 가능)",
        "감정 변화가 종종 있어도 괜찮다.",
        "감정 기복이 크고 스트레스를 잘 받는 편이라도 좋다.",
      ],
      female: [
        "항상 침착하고 큰 상황에서도 안정적이어야 한다.",
        "대체로 차분하고 감정 조절을 잘하면 좋다.",
        "보통 수준이면 괜찮다. (기복은 있지만 조절 가능)",
        "감정 변화가 종종 있어도 괜찮다.",
        "감정 기복이 크고 스트레스를 잘 받는 편이라도 좋다.",
      ],
    },
    weights: {
      femaleSeesMale: [43, 34, 28, 19, 9],
      maleSeesFemale: [31, 25, 20, 14, 6],
    },
  },

  {
    id: "I12",
    section: SECTIONS.IDEAL,
    category: "성격",
    title: "평소에 어떤 성격을 원하나요?",
    optionsByGender: {
      male: ["유머감각이 좋아야 한다.", "이따금씩 재밌어야 한다.", "평범하면 괜찮다.", "가끔 어색해도 괜찮다.", "전혀 상관없다."],
      female: ["유머감각이 좋아야 한다.", "이따금씩 재밌어야 한다.", "평범하면 괜찮다.", "가끔 어색해도 괜찮다.", "전혀 상관없다."],
    },
    weights: {
      femaleSeesMale: [19, 15, 12, 9, 4],
      maleSeesFemale: [25, 20, 16, 11, 5],
    },
  },

  {
    id: "I13",
    section: SECTIONS.IDEAL,
    category: "부가질문1",
    title: "상대방의 주량은 어느정도를 원하시나요?",
    optionsByGender: {
      male: ["전혀 안마셔야 한다.", "가끔 마시는건 괜찮다.", "일주일에 1회정도 괜찮다.", "자주 마셔도 괜찮다.", "전혀 상관없다."],
      female: ["전혀 안마셔야 한다.", "가끔 마시는건 괜찮다.", "일주일에 1회정도 괜찮다.", "자주 마셔도 괜찮다.", "전혀 상관없다."],
    },
    weights: {
      femaleSeesMale: [9, 7, 6, 4, 2],
      maleSeesFemale: [12, 10, 8, 5, 2],
    },
  },

  {
    id: "I14",
    section: SECTIONS.IDEAL,
    category: "부가질문2",
    title: "흡연에 대해 어떻게 생각하시나요?",
    optionsByGender: {
      male: ["절대 피면 안된다.", "왠만하면 내앞에서는 피면 안된다.", "전자담배정도는 괜찮다.", "이따금씩 펴도 괜찮다.", "전혀 상관없다."],
      female: ["절대 피면 안된다.", "왠만하면 내앞에서는 피면 안된다.", "전자담배정도는 괜찮다.", "이따금씩 펴도 괜찮다.", "전혀 상관없다."],
    },
    weights: {
      femaleSeesMale: [12, 10, 8, 5, 2],
      maleSeesFemale: [16, 13, 10, 7, 3],
    },
  },

  {
    id: "I15",
    section: SECTIONS.IDEAL,
    category: "패션평가",
    title: "상대방의 패션에 대해 신경을 많이 쓰시나요?",
    optionsByGender: {
      male: ["패션 센스가 좋다는 칭찬을 자주 듣는다", "옷 잘 입는다는 말을 종종 듣는다", "평범한 편이다 (무난하게 입는 편)", "가끔은 스타일이 아쉽다는 말을 들은 적 있다", "패션에 신경을 거의 쓰지 않는 편이다"],
      female: ["패션 센스가 좋다는 칭찬을 자주 듣는다", "옷 잘 입는다는 말을 종종 듣는다", "평범한 편이다 (무난하게 입는 편)", "가끔은 스타일이 아쉽다는 말을 들은 적 있다", "패션에 신경을 거의 쓰지 않는 편이다"],
    },
    weights: {
      femaleSeesMale: [12, 10, 8, 5, 2],
      maleSeesFemale: [19, 15, 12, 9, 4],
    },
  },

  {
    id: "I16",
    section: SECTIONS.IDEAL,
    category: "연애역량",
    title: "연인이 SNS에 자주 사진을 올리는 건 어떻게 생각하나요?",
    optionsByGender: {
      male: [
        "SNS에 사진 자주 올리는 사람은 절대 싫다.",
        "SNS 활동을 거의 안 했으면 좋겠다. (미니멀 SNS 선호)",
        "적당히만 올렸으면 좋겠다. (한 달 1~2회 정도)",
        "본인 사생활 공유는 괜찮지만, 연애 관련은 조금 조심했으면 좋겠다.",
        "상관없다. SNS 활동 자유롭게 하는 걸 선호한다.",
      ],
      female: [
        "SNS에 사진 자주 올리는 사람은 절대 싫다.",
        "SNS 활동을 거의 안 했으면 좋겠다. (미니멀 SNS 선호)",
        "적당히만 올렸으면 좋겠다. (한 달 1~2회 정도)",
        "본인 사생활 공유는 괜찮지만, 연애 관련은 조금 조심했으면 좋겠다.",
        "상관없다. SNS 활동 자유롭게 하는 걸 선호한다.",
      ],
    },
    weights: {
      femaleSeesMale: [16, 13, 10, 7, 3],
      maleSeesFemale: [9, 7, 6, 4, 2],
    },
  },
];

export const ALL_QUESTIONS = [...SELF_QUESTIONS, ...IDEAL_QUESTIONS];

// 스코어링용: userGender에 따라 어떤 가중치 열을 쓸지 결정
export function getWeightsForUser(q, userGender) {
  if (!q.weights) return null;
  if (userGender === GENDERS.male) return q.weights.femaleSeesMale;   // 여자가 남자봄
  if (userGender === GENDERS.female) return q.weights.maleSeesFemale; // 남자가 여자봄
  return null;
}

export function getOptionLabels(q, userGender) {
  if (!q.optionsByGender) return ["", "", "", "", ""];
  return (q.optionsByGender[userGender] || q.optionsByGender.male || ["", "", "", "", ""]).slice(0, 5);
}

// 점수 합산 (문항별 가중치 그대로)
export function getChoiceScore(q, userGender, choiceIndex) {
  const w = getWeightsForUser(q, userGender);
  if (!w) return 0;
  return w[choiceIndex] ?? 0;
}

// 섹션 최대점(엑셀상 self=310, ideal=310)
export function getSectionMaxScore(section, userGender) {
  const list = section === SECTIONS.SELF ? SELF_QUESTIONS : IDEAL_QUESTIONS;
  return list.reduce((sum, q) => sum + (getWeightsForUser(q, userGender)?.[0] ? 0 : 0), 0);
}
// 위 함수는 실제로 max를 “1번 점수 합”으로 계산해야 하는데,
// 성별 문항(S1)은 weights가 없으므로 자동 제외.
// 아래 max 계산 유틸로 대체해 사용

export function getSelfMax(userGender) {
  return SELF_QUESTIONS.reduce((sum, q) => {
    const w = getWeightsForUser(q, userGender);
    if (!w) return sum;
    return sum + (w[0] ?? 0); // 1번이 max
  }, 0);
}

export function getIdealMax(userGender) {
  return IDEAL_QUESTIONS.reduce((sum, q) => {
    const w = getWeightsForUser(q, userGender);
    if (!w) return sum;
    return sum + (w[0] ?? 0);
  }, 0);
}
