import hangjungdong from "components/Common/Address";
import {
  getDisplayName,
  getEducationLabel,
  getJobLabel,
  getJobTypeLabel,
  getMaritalLabel,
  getProfileImage,
  getStyleAxisLetters,
  getStyleDisplayLine,
  getArenaBadgeTooltip,
} from "lib/arena";


const romanceMaps = {
  opfriend: ["전혀없음", "한 두명", "몇명 있음", "많은 편이다"],
  friendmeeting: ["절대불가", "차 한잔 정도", "같이 식사 한끼", "문화생활 함께하기", "술한잔 가능", "상관 없음"],
  longdistance: ["절대불가", "가능하지만 자신은 없음", "가능한 편", "웬만하면 가능"],
  datecycle: ["한달에 1회미만", "한달에 1회", "격주 1회", "주1~2회", "주3~4회", "주5~7회"],
  dateromance: ["같이 산책하는 등 소소한 행복", "항상 설레는 연애", "새로운 경험을 함께하는 연애", "현실적, 안정적인 연애"],
  contact: ["전혀 중요하지 않다", "크게 중요하지 않음", "연애 초기만 중요한 편", "중요한 편이다", "매우 중요하다"],
  contactcycle: ["매번 어디든 상황공유", "최소 아침/저녁에는 연락", "이따금씩 한번씩", "하루에 한번정도", "상관 없다"],
  passwordshare: ["프라이버시는 지켜줘야 한다", "알려줘도 상관없다"],
  wedding: ["아직 관심없음", "원하지만 계획은 없음", "1~2년내", "당장이라도 가능"],
  wedding_dating: ["크게 중요하지 않음", "3년 이상", "1년~3년", "6개월~1년", "6개월이내 가능", "3개월이내 가능"],
};

const hobbyMaps = {
  drink: ["전혀 없음", "월 1회 미만", "월 1회", "주 1회", "주 2~3회", "주 3~4회", "주 5회 이상"],
  health: ["전혀 안함", "아주 가끔", "주 1회", "주 2~3회", "주 4~5회", "매일"],
  hotplace: ["관심없음", "집 근처면 가끔 가는수준", "가끔씩 맛집방문", "맛집탐방 매니아"],
  tour: ["관심없음", "수년에 1회", "년 1~2회", "년 3~6회", "년 7~12회", "월 1회이상"],
  tourlike: ["관심없음", "국내여행", "해외여행", "어디든 좋음"],
  tourpurpose: ["주로 관광", "주로 휴양", "새로운 경험과 문화접촉", "사람들과 관계", "일상의 해방", "도전과 탐험"],
  hobbyshare: ["상대방의 취미엔 신경안씀", "한 개 정도는 공유하고 싶다", "많은 취미를 함께하고 싶다", "생각해 본 적 없음"],
};

const careerMaps = {
  career_goal: ["꾸준히 지금 일을 계속한다", "학위 또는 자격취득", "이직 또는 취업", "사업", "카페나 자영업", "투자, 재테크", "투잡", "관심 없음"],
  living_weekend: ["집에서 휴식", "산책과 운동", "친구만나기", "학습(직무/재테크 등)", "취미생활", "봉사활동", "드라이브", "게임", "기타"],
  living_consume: ["자린고비", "필요한것만 사는 편", "이따금씩 플랙스!", "고민없이 플랙스!", "스트레스 해소로 플랙스!"],
  living_pet: ["매우 싫다", "반려동물은 그닥...", "크게 상관없다", "매우 긍정적", "동물에 따라 다름"],
  living_tatoo: ["매우 싫다", "한 두개는 괜찮다", "괜찮다", "멋지다고 생각한다", "나 역시 타투 경험이 있다"],
  living_smoke: ["긍정적이다", "크게 상관없다", "전자담배는 괜찮다", "조금은 부정적이다", "끊으면 좋겠다", "매우 싫다", "생각해본 적 없다"],
  living_charming: ["귀여움", "섹시함", "청순함", "시크함", "유머러스", "배려심", "듬직함", "로맨틱", "자유분방함", "섬세함"],
};

const etcMaps = {
  religion: ["무교", "기독교", "천주교", "불교", "원불교", "유교", "기타"],
  religion_important: ["무교", "큰 의미는 없음", "이따금씩 의지하는 수준", "종교는 매우 중요한 존재", "내 인생의 가장 우선순위"],
  religion_visit: ["무교", "거의 참석 안함", "월 1회 이하", "월 2~3회", "주 1회", "주 2회 이상"],
  religion_accept: ["무교만 가능", "안했으면 한다", "아주 가끔은 괜찮다", "월 1회", "월 2~3회", "주 1회", "상관 없음"],
  food_taste: ["가리는게 없음", "몇가지 빼고는 다 잘먹음", "까다로운 편", "매우 까다로움"],
  food_like: ["돼지고기", "소고기", "치킨", "중식", "돈까스", "회", "초밥", "피자", "패스트푸드", "찜,탕류", "족발,보쌈", "떡볶이 등 분식류", "감자탕", "한식류", "기타"],
  food_dislike: ["가리는 것 없음", "비린내나는 음식", "소고기", "돼지고기", "닭고기", "채소류", "생선류", "날것류", "곱창/내장 등", "고수", "향신료 강한 음식", "매운 음식", "징그러운 비주얼", "냄새가 강한 음식"],
  food_vegetarian: ["채식주의자다", "채식을 주로 먹는다", "채식주의자가 아니다", "채식을 선호하지 않는다"],
  food_spicy: ["정말 못먹는다", "있으면 먹는 정도", "가끔 찾아먹는다", "즐겨 먹는다", "매운맛 매니아"],
  food_diet: ["관심없다", "현재 하지 않는다", "이따금씩 식단을 한다", "진행중이다", "매끼마다 식단 중"],
};

function decodeByMap(value, map) {
  if (value === null || value === undefined || value === "") return "";
  const stringValue = String(value).trim();
  if (!stringValue) return "";

  if (Array.isArray(map)) {
    const index = Number(stringValue);
    if (!Number.isNaN(index) && index >= 1 && index <= map.length) {
      return map[index - 1];
    }
  }

  return stringValue;
}

function findSidoName(sidoCodeOrName) {
  const value = String(sidoCodeOrName || "").trim();
  if (!value) return "";

  const found = hangjungdong.sido.find((item) => item.sido === value);
  if (found?.codeNm) return found.codeNm;
  return value;
}

function findSigugunName(sidoCodeOrName, sigugunCodeOrName) {
  const sidoValue = String(sidoCodeOrName || "").trim();
  const sigugunValue = String(sigugunCodeOrName || "").trim();
  if (!sigugunValue) return "";

  const found = hangjungdong.sigugun.find(
    (item) => item.sido === sidoValue && item.sigugun === sigugunValue
  );
  if (found?.codeNm) return found.codeNm;

  return sigugunValue;
}

export function getAreaLabel(user = {}, type = "home") {
  const isCompany = type === "company";

  const sido =
    user?.[isCompany ? "company_location_sido" : "address_sido"] ||
    user?.[isCompany ? "companyLocationSido" : "address_sido_code"] ||
    user?.[isCompany ? "company_location_sido_name" : "address_sido_name"] ||
    "";

  const sigugun =
    user?.[isCompany ? "company_location_sigugun" : "address_sigugun"] ||
    user?.[isCompany ? "companyLocationSigugun" : "address_sigugun_code"] ||
    user?.[isCompany ? "company_location_sigugun_name" : "address_sigugun_name"] ||
    "";

  const sidoName = findSidoName(sido);
  const sigugunName = findSigugunName(sido, sigugun);

  return [sidoName, sigugunName].filter(Boolean).join(" ");
}

function normalizePhotoItem(item) {
  if (!item) return "";
  if (typeof item === "string") return item.trim();
  if (item?.url) return String(item.url).trim();
  if (item?.downloadURL) return String(item.downloadURL).trim();
  if (item?.src) return String(item.src).trim();
  return "";
}

export function getPhotoList(user = {}) {
  const profilePhotos = Array.isArray(user?.profilePhotos)
    ? user.profilePhotos.map(normalizePhotoItem).filter(Boolean)
    : [];
  if (profilePhotos.length) return profilePhotos;

  const thumbImages = Array.isArray(user?.thumbimage)
    ? user.thumbimage.map(normalizePhotoItem).filter(Boolean)
    : [];
  if (thumbImages.length) return thumbImages;

  if (typeof user?.thumbimage === "string" && user.thumbimage.trim()) {
    return [user.thumbimage.trim()];
  }

  const fallback = getProfileImage(user);
  return fallback ? [fallback] : [];
}

export function getRegisteredPhotoCount(user = {}) {
  return getPhotoList(user).length;
}

export function getBirthYearShort(user = {}) {
  const year = Number(user?.birthday?.year || 0);
  if (!year) return "";
  return String(year).slice(-2);
}

export function getShortStyleOneLine(user = {}) {
  return (
    user?.styleTest?.oneLine ||
    user?.styleTest?.summary ||
    user?.styleTest?.subTitle ||
    user?.styleTest?.description ||
    ""
  );
}

export function getShortIntro(user = {}) {
  return getShortStyleOneLine(user) || user?.introduce || user?.intro || user?.bio || "";
}

export function getInterestLabel(user = {}) {
  if (user?.interest && String(user.interest).trim()) return String(user.interest).trim();
  if (user?.hobby && String(user.hobby).trim()) return String(user.hobby).trim();

  if (Array.isArray(user?.hobbyList)) {
    const first = user.hobbyList.find((item) => String(item || "").trim());
    if (first) return String(first).trim();
  }

  return "";
}

export function getHeightLabel(user = {}) {
  if (!user?.height) return "";
  const onlyNumber = String(user.height).replace(/[^0-9]/g, "");
  return onlyNumber ? `${onlyNumber}cm` : "";
}

export function getReligionLabel(user = {}) {
  return decodeByMap(user?.religion, etcMaps.religion);
}

export function getCompanyDisplay(user = {}) {
  if (user?.company_open === true && user?.company) return user.company;
  return "";
}

export function isIdentityVerified(user = {}) {
  return user?.phone_verified === true || user?.identityVerified === true;
}

export function isCompanyVerified(user = {}) {
  return user?.company_verified === true || user?.job_verified === true || user?.companyVerified === true;
}

export function getMbtiLabel(user = {}) {
  const ei = String(user?.mbti_ei || "").trim();
  const sn = String(user?.mbti_sn || "").trim();
  const tf = String(user?.mbti_tf || "").trim();
  const jp = String(user?.mbti_jp || "").trim();
  const result = `${ei}${sn}${tf}${jp}`.toUpperCase();
  return result.length === 4 ? result : "";
}

export function getDrinkLabel(user = {}) {
  return decodeByMap(user?.drink, hobbyMaps.drink);
}

export function getSmokeLabel(user = {}) {
  return decodeByMap(user?.living_smoke, careerMaps.living_smoke);
}

export function getDatingStyleLabel(user = {}) {
  return decodeByMap(user?.dateromance, romanceMaps.dateromance);
}

export function getWeekendLabel(user = {}) {
  return decodeByMap(user?.living_weekend, careerMaps.living_weekend);
}

export function getContactStyleLabel(user = {}) {
  return decodeByMap(user?.contactcycle, romanceMaps.contactcycle);
}

export function getSpicyLabel(user = {}) {
  return decodeByMap(user?.food_spicy, etcMaps.food_spicy);
}

export function getProfileSummary(user = {}) {
  return {
    name: getDisplayName(user),
    birthYearShort: getBirthYearShort(user),
    job: getJobLabel(user),
    jobType: getJobTypeLabel(user),
    mbti: getMbtiLabel(user),
    drink: getDrinkLabel(user),
    smoke: getSmokeLabel(user),
    datingStyle: getDatingStyleLabel(user),
    weekendStyle: getWeekendLabel(user),
    contactStyle: getContactStyleLabel(user),
    spicyStyle: getSpicyLabel(user),
    styleAxisLetters: getStyleAxisLetters(user),
    styleLine: getStyleDisplayLine(user),
    homeArea: getAreaLabel(user, "home"),
    companyArea: getAreaLabel(user, "company"),
    marital: getMaritalLabel(user),
    education: getEducationLabel(user),
    interest: getInterestLabel(user),
    height: getHeightLabel(user),
    religion: getReligionLabel(user),
    company: getCompanyDisplay(user),
    intro: getShortIntro(user),
  };
}

export function formatAnswerValue(key, value, user = {}) {
  if (key === "mbti") {
    return getMbtiLabel(user);
  }

  if (value === null || value === undefined || value === "") return "";

  if (Array.isArray(value)) {
    const cleaned = value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object") {
          return item.label || item.value || item.name || "";
        }
        return "";
      })
      .filter(Boolean);

    return cleaned.join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "예" : "아니오";
  }

  const stringValue = String(value).trim();
  if (!stringValue) return "";

  const allMaps = {
    ...romanceMaps,
    ...hobbyMaps,
    ...careerMaps,
    ...etcMaps,
  };

  if (allMaps[key]) {
    return decodeByMap(stringValue, allMaps[key]);
  }

  return stringValue;
}

export function buildValueSections(user = {}) {
  const sectionMap = [
    {
      key: "romance",
      title: "연애/결혼관",
      items: [
        ["이성친구가 많은 편인가요?", "opfriend", user?.opfriend],
        ["연인의 이성친구 만남 허용 범위", "friendmeeting", user?.friendmeeting],
        ["장거리연애에 대한 생각", "longdistance", user?.longdistance],
        ["선호하는 데이트/만남 주기", "datecycle", user?.datecycle],
        ["원하는 연애 스타일", "dateromance", user?.dateromance],
        ["연락 빈도의 중요도", "contact", user?.contact],
        ["선호하는 연락 주기", "contactcycle", user?.contactcycle],
        ["휴대폰/비밀번호 공유", "passwordshare", user?.passwordshare],
        ["결혼에 대한 생각", "wedding", user?.wedding],
        ["적정 연애기간", "wedding_dating", user?.wedding_dating],
      ],
    },
    {
      key: "hobby",
      title: "취미/여가",
      items: [
        ["MBTI", "mbti", getMbtiLabel(user)],
        ["취미", "hobby", Array.isArray(user?.hobbyList) ? user.hobbyList : user?.hobby],
        ["음주 빈도", "drink", user?.drink],
        ["운동 습관", "health", user?.health],
        ["핫플/맛집 선호", "hotplace", user?.hotplace],
        ["여행 빈도", "tour", user?.tour],
        ["선호하는 여행", "tourlike", user?.tourlike],
        ["여행 목적", "tourpurpose", user?.tourpurpose],
        ["취미 공유 성향", "hobbyshare", user?.hobbyshare],
      ],
    },
    {
      key: "career",
      title: "커리어/생활",
      items: [
        ["미래의 경력목표", "career_goal", user?.career_goal],
        ["주말 활동", "living_weekend", user?.living_weekend],
        ["소비습관", "living_consume", user?.living_consume],
        ["반려동물에 대한 생각", "living_pet", user?.living_pet],
        ["타투에 대한 생각", "living_tatoo", user?.living_tatoo],
        ["흡연에 대한 생각", "living_smoke", user?.living_smoke],
        ["이성에게 매력적인 포인트", "living_charming", user?.living_charming],
      ],
    },
    {
      key: "extra",
      title: "기타 가치관",
      items: [
        ["종교", "religion", user?.religion],
        ["종교의 의미", "religion_important", user?.religion_important],
        ["종교행사 참석 빈도", "religion_visit", user?.religion_visit],
        ["연인의 종교활동 수용도", "religion_accept", user?.religion_accept],
        ["입맛 성향", "food_taste", user?.food_taste],
        ["선호 음식", "food_like", user?.food_like],
        ["못 먹는 음식", "food_dislike", user?.food_dislike],
        ["채식 여부", "food_vegetarian", user?.food_vegetarian],
        ["매운맛 선호", "food_spicy", user?.food_spicy],
        ["다이어트 식단 여부", "food_diet", user?.food_diet],
      ],
    },
  ];

  return sectionMap.map((section) => ({
    ...section,
    items: section.items
      .map(([label, key, value]) => ({
        label,
        value: formatAnswerValue(key, value, user),
      }))
      .filter((item) => item.value),
  }));
}

export function extractStyleBars(styleTest = {}) {
  if (Array.isArray(styleTest?.bars) && styleTest.bars.length) {
    return styleTest.bars.slice(0, 4).map((item) => ({
      leftLabel: item.leftLabel || item.left || "",
      rightLabel: item.rightLabel || item.right || "",
      leftValue: Number(item.leftValue || item.leftPercent || 0),
      rightValue: Number(item.rightValue || item.rightPercent || 0),
    }));
  }

  if (Array.isArray(styleTest?.dimensions) && styleTest.dimensions.length) {
    return styleTest.dimensions.slice(0, 4).map((item) => ({
      leftLabel: item.leftLabel || item.left || "",
      rightLabel: item.rightLabel || item.right || "",
      leftValue: Number(item.leftValue || item.leftPercent || 0),
      rightValue: Number(item.rightValue || item.rightPercent || 0),
    }));
  }

  return [];
}

export function getBadgeTooltip(badgeInfo = {}) {
  return getArenaBadgeTooltip(badgeInfo);
}

export function normalizeInterestList(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .flatMap((item) =>
        String(item || "")
          .split("|")
          .flatMap((part) => part.split("/"))
          .flatMap((part) => part.split(","))
      )
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  return String(value)
    .split("|")
    .flatMap((part) => part.split("/"))
    .flatMap((part) => part.split(","))
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}