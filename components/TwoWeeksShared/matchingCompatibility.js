const MARRIAGE_SCORES = {
  within_2_years: { within_2_years: 15, within_5_years: 12, open: 10, unsure: 6, no_intent: 0 },
  within_5_years: { within_2_years: 12, within_5_years: 15, open: 12, unsure: 8, no_intent: 1 },
  open: { within_2_years: 10, within_5_years: 12, open: 15, unsure: 10, no_intent: 4 },
  unsure: { within_2_years: 6, within_5_years: 8, open: 10, unsure: 15, no_intent: 7 },
  no_intent: { within_2_years: 0, within_5_years: 1, open: 4, unsure: 7, no_intent: 15 },
};
const CHILDREN_SCORES = {
  definitely: { definitely: 15, preferably: 13, discuss: 9, no: 0, unsure: 7 },
  preferably: { definitely: 13, preferably: 15, discuss: 12, no: 2, unsure: 9 },
  discuss: { definitely: 9, preferably: 12, discuss: 15, no: 8, unsure: 12 },
  no: { definitely: 0, preferably: 2, discuss: 8, no: 15, unsure: 8 },
  unsure: { definitely: 7, preferably: 9, discuss: 12, no: 8, unsure: 15 },
};
const DRINKING_ORDER = { rarely: 0, monthly_1_2: 1, weekly_1_2: 2, weekly_3_plus: 3 };

export const MATCHING_OPTION_LABELS = {
  marriagePlan: { within_2_years: "1~2년 안에 결혼 희망", within_5_years: "3~5년 안에 결혼 희망", open: "좋은 사람을 만나면 열려 있음", unsure: "아직 잘 모르겠음", no_intent: "결혼 의향 없음" },
  childrenPlan: { definitely: "꼭 원함", preferably: "가능하면 원함", discuss: "상대방과 상의", no: "원하지 않음", unsure: "아직 모르겠음" },
  religion: { none: "무교", christian: "기독교", catholic: "천주교", buddhist: "불교", other: "기타" },
  religionPreference: { same_only: "같은 종교여야 함", respect_any: "달라도 존중하면 괜찮음", no_matter: "상관없음", low_activity: "종교 활동이 많지 않은 상대 선호" },
  smoking: { non_smoker: "비흡연", e_cigarette: "전자담배", occasional: "가끔 흡연", smoker: "흡연" },
  smokingPreference: { no_matter: "상관없음", e_cigarette_ok: "전자담배까지 가능", non_smoker_only: "비흡연자만 희망" },
  drinkingFrequency: { rarely: "거의 마시지 않음", monthly_1_2: "월 1~2회", weekly_1_2: "주 1~2회", weekly_3_plus: "주 3회 이상" },
};

function arr(value) { return Array.isArray(value) ? value.filter(Boolean) : []; }
function basic(app = {}) { return app?.basic || {}; }
function prefs(app = {}) { return app?.matchingPreferences || app?.basic?.matchingPreferences || {}; }
function overlap(a, b) { const right = arr(b); return arr(a).filter((item) => right.includes(item)); }
function ageFromBasic(value = {}) { const y = Number(value.birthYear || 0); return Number(value.age || 0) || (y ? new Date().getFullYear() - y : null); }
function ageScore(a = {}, b = {}) {
  const ba = basic(a); const bb = basic(b); const aa = ageFromBasic(ba); const ab = ageFromBasic(bb);
  if (!aa || !ab) return { score: 0, diff: null };
  const maleAge = ba.gender === "male" ? aa : bb.gender === "male" ? ab : null;
  const femaleAge = ba.gender === "female" ? aa : bb.gender === "female" ? ab : null;
  if (!maleAge || !femaleAge) return { score: Math.max(5, 15 - Math.abs(aa - ab) * 2), diff: Math.abs(aa - ab) };
  const diff = maleAge - femaleAge;
  if ([3, 4].includes(diff)) return { score: 15, diff };
  if ([2, 5].includes(diff)) return { score: 13, diff };
  if ([1, 6].includes(diff)) return { score: 10, diff };
  if (diff === 0) return { score: 9, diff };
  if (diff < 0) return { score: Math.max(4, 8 - Math.abs(diff) * 2), diff };
  return { score: Math.max(4, 9 - Math.abs(diff - 4)), diff };
}
function smokingAllows(pref, smoking) {
  if (!pref || !smoking) return true;
  if (pref === "no_matter") return true;
  if (pref === "e_cigarette_ok") return ["non_smoker", "e_cigarette"].includes(smoking);
  if (pref === "non_smoker_only") return smoking === "non_smoker";
  return true;
}
function religionAllows(owner = {}, other = {}) {
  if (!owner.religionPreference || !other.religion) return true;
  if (owner.religionPreference === "no_matter" || owner.religionPreference === "respect_any") return true;
  if (owner.religionPreference === "same_only") return owner.religion === other.religion;
  if (owner.religionPreference === "low_activity") return true;
  return true;
}

function buildPublicMatchingReasons({
  age,
  areaOverlap,
  timeOverlap,
  marriageScore,
  childrenScore,
  smokingScore,
  religionScore,
}) {
  const candidates = [];
  const ageDifference = Number.isFinite(age?.diff) ? Math.abs(age.diff) : null;

  if (ageDifference != null && age?.score >= 9) {
    candidates.push({
      code: "AGE_FIT",
      label:
        ageDifference === 0
          ? "같은 연령대로 기본 매칭 기준에 잘 맞아요."
          : `나이 차이 ${ageDifference}세로 기본 매칭 기준에 잘 맞아요.`,
    });
  }

  if (areaOverlap.length) {
    candidates.push({
      code: "AREA_OVERLAP",
      label: `${areaOverlap.slice(0, 2).join(" · ")} 생활권이 겹쳐요.`,
    });
  }

  if (marriageScore >= 10 && childrenScore >= 9) {
    candidates.push({
      code: "VALUES_FIT",
      label: "결혼과 자녀에 대한 방향이 비슷해요.",
    });
  } else if (marriageScore >= 10) {
    candidates.push({
      code: "MARRIAGE_FIT",
      label: "결혼에 대한 방향이 비슷해요.",
    });
  } else if (childrenScore >= 9) {
    candidates.push({
      code: "CHILDREN_FIT",
      label: "자녀 계획에 큰 차이가 없어요.",
    });
  }

  if (timeOverlap.length) {
    candidates.push({
      code: "TIME_OVERLAP",
      label: `${timeOverlap.slice(0, 2).join(" · ")}에 서로 시간이 맞아요.`,
    });
  }

  if (smokingScore >= 5) {
    candidates.push({
      code: "SMOKING_FIT",
      label: "서로의 흡연 조건에 충돌이 없어요.",
    });
  }

  if (religionScore >= 4) {
    candidates.push({
      code: "RELIGION_FIT",
      label: "종교에 대한 수용 범위가 잘 맞아요.",
    });
  }

  return candidates.slice(0, 3);
}

export function calculateMatchingCompatibility(a = {}, b = {}) {
  const ba = basic(a); const bb = basic(b); const pa = prefs(a); const pb = prefs(b);
  const areaOverlap = overlap(ba.activityAreas, bb.activityAreas);
  const timeOverlap = overlap(ba.availableTimeSlots, bb.availableTimeSlots);
  const age = ageScore(a, b);
  // 상대 선호(종교/흡연 허용도)는 선택사항이므로, 내 기본 가치관 응답만으로 완성도를 판단합니다.
  // 점수와 하드 충돌 검사 자체는 기존 로직을 그대로 유지합니다.
  const complete = ["marriagePlan", "childrenPlan", "religion", "smoking", "drinkingFrequency"].every((key) => pa[key] && pb[key]);

  const blockers = [];
  if (!areaOverlap.length) blockers.push({ code: "NO_COMMON_AREA", label: "공통 활동지역 없음" });
  if (!timeOverlap.length) blockers.push({ code: "NO_COMMON_TIME", label: "공통 가능시간 없음" });
  if (
    (pa.marriagePlan === "no_intent" && ["within_2_years", "within_5_years"].includes(pb.marriagePlan)) ||
    (pb.marriagePlan === "no_intent" && ["within_2_years", "within_5_years"].includes(pa.marriagePlan))
  ) blockers.push({ code: "MARRIAGE_CONFLICT", label: "결혼 의향 핵심 충돌" });
  if ((pa.childrenPlan === "definitely" && pb.childrenPlan === "no") || (pb.childrenPlan === "definitely" && pa.childrenPlan === "no")) blockers.push({ code: "CHILDREN_CONFLICT", label: "자녀 계획 핵심 충돌" });
  if (!smokingAllows(pa.smokingPreference, pb.smoking) || !smokingAllows(pb.smokingPreference, pa.smoking)) blockers.push({ code: "SMOKING_CONFLICT", label: "흡연 조건 충돌" });
  if (!religionAllows(pa, pb) || !religionAllows(pb, pa)) blockers.push({ code: "RELIGION_CONFLICT", label: "종교 조건 충돌" });

  const areaScore = areaOverlap.length >= 3 ? 20 : areaOverlap.length === 2 ? 16 : areaOverlap.length === 1 ? 12 : 0;
  const timeScore = timeOverlap.length >= 3 ? 20 : timeOverlap.length === 2 ? 16 : timeOverlap.length === 1 ? 12 : 0;
  const marriageScore = MARRIAGE_SCORES[pa.marriagePlan]?.[pb.marriagePlan] ?? 0;
  const childrenScore = CHILDREN_SCORES[pa.childrenPlan]?.[pb.childrenPlan] ?? 0;
  const smokingScore = pa.smoking && pb.smoking && smokingAllows(pa.smokingPreference, pb.smoking) && smokingAllows(pb.smokingPreference, pa.smoking) ? (pa.smoking === pb.smoking ? 7 : 5) : 0;
  const religionScore = pa.religion && pb.religion && religionAllows(pa, pb) && religionAllows(pb, pa) ? (pa.religion === pb.religion ? 5 : 4) : 0;
  const da = DRINKING_ORDER[pa.drinkingFrequency]; const db = DRINKING_ORDER[pb.drinkingFrequency];
  const drinkingScore = Number.isInteger(da) && Number.isInteger(db) ? Math.max(0, 3 - Math.abs(da - db)) : 0;
  const total = Math.max(0, Math.min(100, areaScore + timeScore + age.score + marriageScore + childrenScore + smokingScore + religionScore + drinkingScore));

  const reasonDetails = buildPublicMatchingReasons({
    age,
    areaOverlap,
    timeOverlap,
    marriageScore,
    childrenScore,
    smokingScore,
    religionScore,
  });

  return {
    total,
    complete,
    eligible: blockers.length === 0,
    blockers,
    reasons: reasonDetails.map((item) => item.label),
    reasonDetails,
    reasonVersion: "public_v2",
    areaOverlap,
    timeOverlap,
    ageDiff: age.diff,
    breakdown: { area: areaScore, time: timeScore, age: age.score, marriage: marriageScore, children: childrenScore, smoking: smokingScore, religion: religionScore, drinking: drinkingScore },
  };
}
