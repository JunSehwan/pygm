export const CARD_TYPE_OPTIONS = [
  {
    value: "choice",
    label: "선택형",
    desc: "보기 중 선택",
  },
  {
    value: "text",
    label: "작성형",
    desc: "직접 작성",
  },
];

export const CARD_CATEGORY_OPTIONS = [
  { value: "value", label: "가치관" },
  { value: "dating", label: "연애상황" },
  { value: "care", label: "배려/공감" },
  { value: "sense", label: "센스" },
  { value: "life", label: "생활습관" },
  { value: "marriage", label: "결혼관" },
];

export const CARD_CATEGORY_LABEL_MAP = {
  value: "가치관",
  dating: "연애상황",
  care: "배려/공감",
  sense: "센스",
  life: "생활습관",
  marriage: "결혼관",
};

export const MAX_TITLE_LENGTH = 80;
export const MAX_BODY_LENGTH = 500;
export const MAX_GUIDE_LENGTH = 500;
export const MAX_OPTION_LENGTH = 20;
export const MAX_OPTIONS = 6;
export const MIN_OPTIONS = 2;

export const DEFAULT_FORM = {
  questionType: "choice",
  category: "value",
  title: "",
  body: "",
  guide: "",
  options: ["", "", "", ""],
};

export const EXAMPLE_TEXT = {
  title: "갑자기 약속이 취소되면 상대에게 어떤 말을 하나요?",
  body: "갑자스레 연기되거나 약속이 취소된 이 상황에서 어떻게 반응할지, 그리고 그 이유를 짧게 적어주세요.",
  subbody: "약속이 취소된 이유가 그렇게 중요해보이지 않는다고 판단할 경우 어떻게 반응할지 생각해주세요.",
  guide: "정답보다 생각이 보이는 답변이 좋아요.",
};