import { createHash } from "crypto";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const CATEGORY_LABEL_MAP = {
  sense: "센스",
  value: "가치관",
  date: "연애",
  lifestyle: "생활",
  marriage: "결혼관",
};

function normalizeQuestionType(value = "") {
  return value === "text" ? "text" : "choice";
}

function normalizeCategory(value = "") {
  const safe = String(value || "").trim();
  if (CATEGORY_LABEL_MAP[safe]) return safe;
  return "sense";
}

function makeId(prefix = "draft") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeDraft(raw, seedTag = "ai") {
  const questionType = normalizeQuestionType(raw?.questionType);
  const category = normalizeCategory(raw?.category);
  const options = Array.isArray(raw?.options)
    ? raw.options.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 4)
    : [];

  return {
    id: makeId(seedTag),
    title: String(raw?.title || "").trim(),
    body: String(raw?.body || "").trim(),
    guide: String(raw?.guide || "").trim(),
    questionType,
    category,
    categoryLabel: CATEGORY_LABEL_MAP[category],
    visibilityTarget: "male",
    source: "ai",
    options: questionType === "choice" ? options : [],
  };
}

function normalizeText(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getOptionSignature(options = []) {
  return options.map((item) => normalizeText(item)).join(" | ");
}

function getKeywordSignature(draft) {
  const title = normalizeText(draft?.title);
  const body = normalizeText(draft?.body);
  return `${title}__${body}`;
}

function isTooGenericTitle(title = "") {
  const t = normalizeText(title);
  const banned = [
    "연락 스타일",
    "전애인 연락",
    "더치페이",
    "결혼 생각",
    "술",
    "흡연",
    "소개팅 매너",
    "연락 빈도",
  ];
  return banned.some((item) => t.includes(normalizeText(item)));
}

function hasDuplicateOptions(options = []) {
  const normalized = options.map((item) => normalizeText(item)).filter(Boolean);
  return new Set(normalized).size !== normalized.length;
}

function isWeakChoicePattern(options = []) {
  const normalized = options.map((item) => normalizeText(item));
  const weakWords = ["상관없다", "상황에 따라 다르다", "싫다", "괜찮다", "별로다", "안 된다"];
  const weakCount = normalized.filter((item) =>
    weakWords.some((word) => item.includes(word))
  ).length;
  return weakCount >= 3;
}

function validateDraft(draft, comparePool = []) {
  if (!draft.title || draft.title.length < 8) return false;
  if (!draft.body || draft.body.length < 12) return false;
  if (isTooGenericTitle(draft.title)) return false;

  if (draft.questionType === "choice") {
    if (!Array.isArray(draft.options) || draft.options.length !== 4) return false;
    if (hasDuplicateOptions(draft.options)) return false;
    if (isWeakChoicePattern(draft.options)) return false;
  }

  const compareSignatures = new Set(comparePool.map(getKeywordSignature));
  const compareOptionSignatures = new Set(
    comparePool
      .filter((item) => normalizeQuestionType(item?.questionType) === "choice")
      .map((item) => getOptionSignature(item?.options || []))
  );

  if (compareSignatures.has(getKeywordSignature(draft))) return false;

  if (
    draft.questionType === "choice" &&
    compareOptionSignatures.has(getOptionSignature(draft.options || []))
  ) {
    return false;
  }

  return true;
}

function compactCard(card) {
  return {
    title: card?.title || "",
    body: card?.body || "",
    category: card?.category || "",
    questionType: normalizeQuestionType(card?.questionType),
    options: Array.isArray(card?.options) ? card.options : [],
  };
}

function buildPrompt({ count, existingCards = [], currentDrafts = [] }) {
  const comparePool = [...existingCards, ...currentDrafts].map(compactCard).slice(-40);

  return `
너는 차밍카드 추천 초안을 만드는 편집자야.

목표:
- 남성이 답하고 싶어지는 질문
- 답변만 보면 성향이 드러나는 질문
- 너무 뻔한 연애 밸런스 게임 금지
- 제목만 바뀌고 선택지가 같은 재탕 금지
- 최근 카드와 유사 주제 금지
- 무난한 설문 느낌보다 "한 번쯤 친구와 얘기할 법한 현실 질문" 우선
- 혐오/선정성/노골적인 자극 금지
- choice는 반드시 선택지 4개
- choice 선택지는 서로 명확히 다른 태도/행동/감정이어야 함
- "상관없다 / 상황에 따라 다르다 / 괜찮다 / 싫다" 같은 뻔한 선택지 금지

카테고리:
- sense
- value
- date
- lifestyle
- marriage

응답 형식(JSON):
{
  "drafts": [
    {
      "title": "...",
      "body": "...",
      "guide": "...",
      "questionType": "choice" 또는 "text",
      "category": "sense|value|date|lifestyle|marriage",
      "options": ["...", "...", "...", "..."]
    }
  ]
}

주의:
- text 타입이면 options는 빈 배열
- choice 타입이면 options는 정확히 4개
- title/body/options가 기존과 유사하면 안 됨
- 기존 카드 제목/선택지 표현을 재활용하지 말 것
- 너무 흔한 주제(연락 빈도, 전애인 연락, 더치페이, 결혼 생각, 술/흡연) 피할 것
- 반드시 JSON object 하나만 출력할 것
- 설명 문장, 코드블록, 마크다운 없이 JSON만 출력할 것

최근 카드/초안 참고:
${JSON.stringify(comparePool, null, 2)}

이번에 ${count}개 생성해.
`;
}

async function requestDraftsFromOpenAI({ count, existingCards, currentDrafts }) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 1.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "너는 차밍카드 추천 초안을 만드는 한국어 에디터다. 반드시 JSON 형식으로만 응답해야 한다. 중복과 뻔한 선택지를 싫어한다.",
        },
        {
          role: "user",
          content:
            `${buildPrompt({ count, existingCards, currentDrafts })}\n\n반드시 유효한 JSON object로만 응답해.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OPENAI_ERROR: ${response.status} ${text}`);
  }

  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(rawText);
  return Array.isArray(parsed?.drafts) ? parsed.drafts : [];
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  if (!OPENAI_API_KEY) {
    return res.status(500).json({
      ok: false,
      message: "OPENAI_API_KEY가 설정되지 않았어요.",
    });
  }

  try {
    const {
      count = 1,
      existingCards = [],
      currentDrafts = [],
    } = req.body || {};

    const safeCount = Math.max(1, Math.min(Number(count || 1), 4));
    const comparePool = [...existingCards, ...currentDrafts].map(compactCard);

    let accepted = [];
    let attempts = 0;

    while (accepted.length < safeCount && attempts < 3) {
      attempts += 1;

      const rawDrafts = await requestDraftsFromOpenAI({
        count: safeCount - accepted.length,
        existingCards,
        currentDrafts: [...currentDrafts, ...accepted],
      });

      const normalized = rawDrafts.map((item) => normalizeDraft(item, "ai"));

      for (const draft of normalized) {
        const valid = validateDraft(draft, [...comparePool, ...accepted]);
        if (valid) {
          accepted.push(draft);
        }
      }
    }

    return res.status(200).json({
      ok: true,
      drafts: accepted,
      source: "ai",
      attempts,
    });
  } catch (error) {
    console.error("[api/admin/cards/recommend] error:", error);
    return res.status(500).json({
      ok: false,
      message: error?.message || "추천 초안 생성 중 오류가 발생했어요.",
    });
  }
}