import { typeMetaMap } from "data/tests/styleQuestions";

export const TOTAL_COMPLETED_COUNT = 1542;

export const axisMeta = {
  DT: { left: "다정", right: "무심" },
  SM: { left: "직진", right: "신중" },
  LF: { left: "주도", right: "맞춤" },
  RP: { left: "로맨틱", right: "현실" },
};

export const likertScale = [
  {
    value: 1,
    label: "아니다",
    size: "h-9 w-9 sm:h-12 sm:w-12",
    inactive: "border-green-500",
    active:
      "border-green-500 bg-green-500 border shadow-[0_10px_20px_rgba(34,197,94,0.24)]",
  },
  {
    value: 2,
    label: "",
    size: "h-8 w-8 sm:h-11 sm:w-11",
    inactive: "border-green-500",
    active:
      "border-green-500 bg-green-300 border shadow-[0_8px_18px_rgba(34,197,94,0.20)]",
  },
  {
    value: 3,
    label: "",
    size: "h-7 w-7 sm:h-10 sm:w-10",
    inactive: "border-green-500",
    active:
      "border-green-500 bg-green-200 border shadow-[0_8px_16px_rgba(34,197,94,0.16)]",
  },
  {
    value: 4,
    label: "",
    size: "h-6 w-6 sm:h-9 sm:w-9",
    inactive: "border-gray-500",
    active:
      "border-gray-500 bg-gray-200 border shadow-[0_8px_16px_rgba(107,114,128,0.20)]",
  },
  {
    value: 5,
    label: "",
    size: "h-7 w-7 sm:h-10 sm:w-10",
    inactive: "border-blue-500",
    active:
      "border-blue-500 bg-blue-200 border shadow-[0_8px_16px_rgba(59,130,246,0.16)]",
  },
  {
    value: 6,
    label: "",
    size: "h-8 w-8 sm:h-11 sm:w-11",
    inactive: "border-blue-500",
    active:
      "border-blue-500 bg-blue-300 border shadow-[0_8px_18px_rgba(59,130,246,0.20)]",
  },
  {
    value: 7,
    label: "그렇다",
    size: "h-9 w-9 sm:h-12 sm:w-12",
    inactive: "border-blue-500",
    active:
      "border-blue-500 bg-blue-600 border shadow-[0_10px_20px_rgba(37,99,235,0.24)]",
  },
];

export function getAnswerContribution(value) {
  const map = {
    1: -4.6,
    2: -2.8,
    3: -1.2,
    4: 0,
    5: 1.2,
    6: 2.8,
    7: 4.6,
  };

  return map[value] ?? 0;
}

export function initAxisState() {
  return {
    DT: { D: 0, T: 0, weightedD: 0, weightedT: 0, extremeD: 0, extremeT: 0 },
    SM: { S: 0, M: 0, weightedS: 0, weightedM: 0, extremeS: 0, extremeM: 0 },
    LF: { L: 0, F: 0, weightedL: 0, weightedF: 0, extremeL: 0, extremeF: 0 },
    RP: { R: 0, P: 0, weightedR: 0, weightedP: 0, extremeR: 0, extremeP: 0 },
  };
}

export function calculateAxisScores(answers, questions) {
  const result = initAxisState();

  questions.forEach((q, index) => {
    const answer = answers[index];
    if (!answer) return;

    const delta = getAnswerContribution(answer);
    if (delta === 0) return;

    const absDelta = Math.abs(delta);
    const weighted = absDelta * q.weight;
    const isExtreme = answer === 1 || answer === 7;

    const axisObj = result[q.axis];
    const positiveKey = q.positive;
    const negativeKey = q.negative;

    if (delta > 0) {
      axisObj[positiveKey] += absDelta;
      axisObj[`weighted${positiveKey}`] += weighted;
      if (isExtreme) axisObj[`extreme${positiveKey}`] += 1;
    } else {
      axisObj[negativeKey] += absDelta;
      axisObj[`weighted${negativeKey}`] += weighted;
      if (isExtreme) axisObj[`extreme${negativeKey}`] += 1;
    }
  });

  return result;
}

export function resolveAxisLetter(axis, scores) {
  const keys = {
    DT: ["D", "T"],
    SM: ["S", "M"],
    LF: ["L", "F"],
    RP: ["R", "P"],
  };

  const [left, right] = keys[axis];
  const leftScore = scores[axis][left];
  const rightScore = scores[axis][right];

  if (leftScore > rightScore) {
    return { letter: left, balance: false };
  }

  if (rightScore > leftScore) {
    return { letter: right, balance: false };
  }

  const leftWeighted = scores[axis][`weighted${left}`];
  const rightWeighted = scores[axis][`weighted${right}`];

  if (leftWeighted > rightWeighted) {
    return { letter: left, balance: true };
  }

  if (rightWeighted > leftWeighted) {
    return { letter: right, balance: true };
  }

  const leftExtreme = scores[axis][`extreme${left}`];
  const rightExtreme = scores[axis][`extreme${right}`];

  if (leftExtreme > rightExtreme) {
    return { letter: left, balance: true };
  }

  if (rightExtreme > leftExtreme) {
    return { letter: right, balance: true };
  }

  return { letter: left, balance: true };
}

export function buildFinalType(scores) {
  const dt = resolveAxisLetter("DT", scores);
  const sm = resolveAxisLetter("SM", scores);
  const lf = resolveAxisLetter("LF", scores);
  const rp = resolveAxisLetter("RP", scores);

  const code = `${dt.letter}${sm.letter}${lf.letter}${rp.letter}`;
  const balanceBadges = [
    dt.balance ? "D/T 밸런스형" : null,
    sm.balance ? "S/M 밸런스형" : null,
    lf.balance ? "L/F 밸런스형" : null,
    rp.balance ? "R/P 밸런스형" : null,
  ].filter(Boolean);

  return {
    code,
    meta: typeMetaMap[code],
    axisLetters: {
      DT: dt.letter,
      SM: sm.letter,
      LF: lf.letter,
      RP: rp.letter,
    },
    balanceBadges,
  };
}

export function getAxisSummary(finalType, axisScores) {
  const axisMap = [
    {
      axis: "DT",
      label: "다정 ↔ 무심",
      leftKey: "D",
      rightKey: "T",
      leftLabel: "다정",
      rightLabel: "무심",
    },
    {
      axis: "SM",
      label: "직진 ↔ 신중",
      leftKey: "S",
      rightKey: "M",
      leftLabel: "직진",
      rightLabel: "신중",
    },
    {
      axis: "LF",
      label: "주도 ↔ 맞춤",
      leftKey: "L",
      rightKey: "F",
      leftLabel: "주도",
      rightLabel: "맞춤",
    },
    {
      axis: "RP",
      label: "로맨틱 ↔ 현실",
      leftKey: "R",
      rightKey: "P",
      leftLabel: "로맨틱",
      rightLabel: "현실",
    },
  ];

  return axisMap.map((item) => {
    const leftWeighted = axisScores[item.axis][`weighted${item.leftKey}`] || 0;
    const rightWeighted = axisScores[item.axis][`weighted${item.rightKey}`] || 0;
    const total = leftWeighted + rightWeighted;

    const diff = leftWeighted - rightWeighted;
    const normalized = total === 0 ? 0 : diff / total;
    const curved = Math.sign(normalized) * Math.pow(Math.abs(normalized), 0.58);

    const leftPercent = Math.round(
      Math.max(3, Math.min(97, 50 + curved * 47))
    );
    const rightPercent = 100 - leftPercent;

    const selectedLetter = finalType.axisLetters[item.axis];
    const selectedLabel =
      selectedLetter === item.leftKey ? item.leftLabel : item.rightLabel;

    const gap = Math.abs(leftPercent - rightPercent);

    return {
      axis: item.axis,
      label: item.label,
      selected: selectedLetter,
      selectedLabel,
      leftLabel: item.leftLabel,
      rightLabel: item.rightLabel,
      leftPercent,
      rightPercent,
      leftWeighted,
      rightWeighted,
      strengthText:
        gap >= 55
          ? "매우 강함"
          : gap >= 35
            ? "분명한 편"
            : gap >= 18
              ? "조금 더 강함"
              : "균형형",
    };
  });
}

export function getCompatibility(typeCode) {
  const compatibilityMap = {
    DSLR: ["DMFP", "DSFP", "TMLR"],
    DMLR: ["TSFP", "TMFP", "DSLR"],
    DSFR: ["DMFP", "TMLP", "DSLP"],
    DMFR: ["TSLR", "TSLP", "DSFR"],
    TSLR: ["DMFR", "DMFP", "DMLP"],
    TMLR: ["DSLR", "DMFR", "DSFP"],
    TSFR: ["DMFP", "DMLP", "DMFR"],
    TMFR: ["DSLR", "DSFR", "DMFP"],
    DSLP: ["TMLR", "TSFP", "TMFP"],
    DMLP: ["TSLR", "TSFR", "TMFP"],
    DSFP: ["TMLR", "TSLP", "DMLR"],
    DMFP: ["DSLR", "TSFR", "TMFR"],
    TSLP: ["DSFP", "DMFR", "DMLR"],
    TMLP: ["DSFR", "DMFP", "DSLP"],
    TSFP: ["DMLR", "DSLP", "DMFP"],
    TMFP: ["DMLP", "DMLR", "DSLP"],
  };

  return (compatibilityMap[typeCode] || []).map((code) => typeMetaMap[code]);
}

export function getAllTypes() {
  return Object.values(typeMetaMap);
}