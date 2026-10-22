export const TWOWEEKS_DECLINE_REASON_OPTIONS = [
  {
    code: "photo_attraction",
    label: "사진·외적 호감이 제 취향과 달랐어요",
    adminLabel: "사진·외적 호감",
  },
  {
    code: "basic_conditions",
    label: "나이·거리·가능 시간 등 기본 조건이 맞지 않았어요",
    adminLabel: "기본 조건",
  },
  {
    code: "values_direction",
    label: "결혼·자녀·종교 등 중요한 방향이 달랐어요",
    adminLabel: "가치관·장기 방향",
  },
  {
    code: "lifestyle_profile",
    label: "직업·흡연·음주 등 생활 조건이 맞지 않았어요",
    adminLabel: "직업·생활 조건",
  },
  {
    code: "personal_timing",
    label: "개인 사정으로 지금은 만남을 진행하기 어려워요",
    adminLabel: "개인 사정",
  },
  {
    code: "other",
    label: "기타 사유",
    adminLabel: "기타",
  },
];

export function getTwoWeeksDeclineReasonOption(code = "") {
  return TWOWEEKS_DECLINE_REASON_OPTIONS.find((item) => item.code === String(code || "")) || null;
}

export function getTwoWeeksDeclineReasonLabel(code = "", fallback = "") {
  return getTwoWeeksDeclineReasonOption(code)?.adminLabel || fallback || "미입력";
}

export function normalizeTwoWeeksDeclineReason(input = {}) {
  const code = String(input?.code || "").trim();
  const option = getTwoWeeksDeclineReasonOption(code);
  const text = String(input?.text || "").replace(/\s+/g, " ").trim().slice(0, 300);

  if (!option) {
    return {
      valid: false,
      code: "",
      label: "",
      text: "",
      message: "거절 사유를 선택해주세요.",
    };
  }

  if (code === "other" && !text) {
    return {
      valid: false,
      code,
      label: option.adminLabel,
      text: "",
      message: "기타 사유를 작성해주세요.",
    };
  }

  return {
    valid: true,
    code,
    label: option.adminLabel,
    text: code === "other" ? text : "",
    message: "",
  };
}
