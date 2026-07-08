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

const TOPIC_BUCKETS = [
  "first_impression",
  "texting",
  "flirting",
  "values",
  "jealousy",
  "lifestyle",
  "money",
  "marriage",
  "family",
  "social",
  "dating_manners",
  "conflict",
  "boundaries",
  "confidence",
  "sns",
  "ex_relationship",
  "talking_style",
  "emotional_maturity",
  "self_awareness",
  "greenflag_redflag",
];

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

function normalizeText(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeCompactText(value = "") {
  return normalizeText(value).replace(/\s+/g, "");
}

function getOptionSignature(options = []) {
  return (Array.isArray(options) ? options : [])
    .map((item) => normalizeCompactText(item))
    .filter(Boolean)
    .join("|");
}

function getTopicSignature(draft = {}) {
  return String(draft?.topicKey || "").trim().toLowerCase();
}

function getKeywordSignature(draft = {}) {
  const text = `${draft?.title || ""} ${draft?.body || ""} ${draft?.guide || ""}`;
  const tokens = normalizeText(text)
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter(
      (item) =>
        item.length >= 2 &&
        ![
          "나는",
          "당신은",
          "상대가",
          "연애",
          "소개팅",
          "상황",
          "가장",
          "무엇",
          "어떻게",
          "답해주세요",
          "골라보세요",
          "선택지",
        ].includes(item)
    );

  return [...new Set(tokens)].sort().slice(0, 8).join("|");
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
    "연락 빈도",
    "소개팅 매너",
  ];
  return banned.some((item) => t.includes(normalizeText(item)));
}

function hasDuplicateOptions(options = []) {
  const normalized = options.map((item) => normalizeCompactText(item)).filter(Boolean);
  return new Set(normalized).size !== normalized.length;
}

function isWeakChoicePattern(options = []) {
  const normalized = options.map((item) => normalizeText(item));
  const weakWords = ["상관없다", "상황에 따라 다르다", "괜찮다", "싫다", "별로다", "안 된다"];
  const weakCount = normalized.filter((item) =>
    weakWords.some((word) => item.includes(word))
  ).length;
  return weakCount >= 2;
}

function compactCard(card) {
  return {
    title: card?.title || "",
    body: card?.body || "",
    guide: card?.guide || "",
    category: card?.category || "",
    questionType: normalizeQuestionType(card?.questionType),
    options: Array.isArray(card?.options) ? card.options : [],
    topicKey: card?.topicKey || "",
    angleKey: card?.angleKey || "",
  };
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
    topicKey: String(raw?.topicKey || "").trim(),
    angleKey: String(raw?.angleKey || "").trim(),
    viralWhy: String(raw?.viralWhy || "").trim(),
    targetReaction: String(raw?.targetReaction || "").trim(),
  };
}

function validateDraft(draft, comparePool = []) {
  if (!draft.title || draft.title.length < 8) return false;
  if (!draft.body || draft.body.length < 12) return false;
  if (!draft.topicKey || draft.topicKey.length < 5) return false;
  if (isTooGenericTitle(draft.title)) return false;

  if (draft.questionType === "choice") {
    if (!Array.isArray(draft.options) || draft.options.length !== 4) return false;
    if (hasDuplicateOptions(draft.options)) return false;
    if (isWeakChoicePattern(draft.options)) return false;
  }

  const compareTopicSignatures = new Set(comparePool.map(getTopicSignature).filter(Boolean));
  const compareKeywordSignatures = new Set(comparePool.map(getKeywordSignature).filter(Boolean));
  const compareOptionSignatures = new Set(
    comparePool
      .filter((item) => normalizeQuestionType(item?.questionType) === "choice")
      .map((item) => getOptionSignature(item?.options || []))
      .filter(Boolean)
  );

  if (compareTopicSignatures.has(getTopicSignature(draft))) return false;
  if (compareKeywordSignatures.has(getKeywordSignature(draft))) return false;

  if (
    draft.questionType === "choice" &&
    compareOptionSignatures.has(getOptionSignature(draft.options || []))
  ) {
    return false;
  }

  return true;
}

function buildPrompt({
  count,
  existingCards = [],
  currentDrafts = [],
  excludedTopicKeys = [],
  categoryHint = "",
}) {
  const comparePool = [...existingCards, ...currentDrafts]
    .map(compactCard)
    .slice(-150);

  const suggestedCount = Math.max(count * 3, 6);

  return `
너는 차밍수프 admin에서 차밍카드 추천 초안을 만드는 한국어 에디터야.

목표:
- 남성이 답하고 싶어지는 질문
- 여성 입장에서 답변을 보고 사람 판단이 쉬운 질문
- 너무 흔한 밸런스게임 금지
- 친구끼리도 의견이 갈릴 만한 "현실 연애 질문" 우선
- 댓글/반응이 붙을 만한 산뜻한 질문
- 제목만 다르고 내용이 같은 재탕 금지
- 최근 카드와 topicKey가 겹치면 안 됨
- 혐오/선정성/과도한 자극 금지

이번에는 최종 ${count}개가 필요하지만,
후보는 ${suggestedCount}개를 먼저 만들어도 된다.

카테고리:
- sense
- value
- date
- lifestyle
- marriage

반드시 각 draft에 아래 필드를 포함해:
- title
- body
- guide
- questionType
- category
- options
- topicKey
- angleKey
- viralWhy
- targetReaction

topicKey 규칙:
- 영어 소문자 snake_case
- 같은 의미 질문이면 절대 다른 topicKey로 포장하지 말 것
- 예: reply_delay_early_stage, insta_opposite_sex_comments 같은 느낌

angleKey 규칙:
- honest_reaction / manners / trust / jealousy / pace / boundary 같은 짧은 키

다양성 규칙:
- 결과 후보들은 서로 완전히 다른 topicKey를 가져야 한다.
- 아래 bucket이 한 번에 2개 이상 과도하게 반복되면 안 된다:
  ${TOPIC_BUCKETS.join(", ")}
- "연락 / 호감표현 / 어색함" 계열은 전체 후보에서 최대 1개씩만 허용
- 돈, 가족, SNS, 갈등해결, 장거리, 사과 방식, 자기객관화 같은 비교적 다양한 소재를 섞어라
- 같은 category만 몰아서 만들지 말 것
- categoryHint가 주어지면 그 카테고리를 조금 더 우선하되, 나머지 카테고리도 섞어라

금지:
- 연락 빈도, 전애인 연락, 더치페이, 결혼 생각, 술/흡연 같은 너무 흔한 질문 반복
- "상관없다 / 상황에 따라 다르다 / 괜찮다 / 싫다" 같은 무성의한 선택지
- 같은 의미인데 제목만 바꾼 질문
- 설명 문장, 마크다운, 코드블록

응답 형식(JSON object only):
{
  "drafts": [
    {
      "title": "...",
      "body": "...",
      "guide": "...",
      "questionType": "choice" 또는 "text",
      "category": "sense|value|date|lifestyle|marriage",
      "options": ["...", "...", "...", "..."],
      "topicKey": "...",
      "angleKey": "...",
      "viralWhy": "...",
      "targetReaction": "..."
    }
  ]
}

categoryHint:
${categoryHint || "없음"}

excludedTopicKeys:
${JSON.stringify(excludedTopicKeys, null, 2)}

최근 카드/초안 참고:
${JSON.stringify(comparePool, null, 2)}

반드시 JSON object 하나만 출력해.
`;
}

async function requestDraftsFromOpenAI({
  count,
  existingCards,
  currentDrafts,
  excludedTopicKeys,
  categoryHint,
}) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 1.15,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "너는 차밍수프 admin용 차밍카드 추천 초안을 만드는 한국어 에디터다. 반드시 JSON object만 출력해야 하며, 중복 주제와 뻔한 연애 질문을 매우 싫어한다.",
        },
        {
          role: "user",
          content: `${buildPrompt({
            count,
            existingCards,
            currentDrafts,
            excludedTopicKeys,
            categoryHint,
          })}\n\n반드시 유효한 JSON object로만 응답해.`,
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
      excludedTopicKeys = [],
      categoryHint = "",
    } = req.body || {};

    const safeCount = Math.max(1, Math.min(Number(count || 1), 8));
    const comparePool = [...existingCards, ...currentDrafts].map(compactCard);

    let accepted = [];
    let attempts = 0;

    while (accepted.length < safeCount && attempts < 4) {
      attempts += 1;

      const rawDrafts = await requestDraftsFromOpenAI({
        count: safeCount - accepted.length,
        existingCards,
        currentDrafts: [...currentDrafts, ...accepted],
        excludedTopicKeys: [
          ...excludedTopicKeys,
          ...accepted.map((item) => item.topicKey).filter(Boolean),
        ],
        categoryHint,
      });

      const normalized = rawDrafts.map((item) => normalizeDraft(item, "ai"));

      for (const draft of normalized) {
        const valid = validateDraft(draft, [...comparePool, ...accepted]);
        if (valid) {
          accepted.push(draft);
        }
        if (accepted.length >= safeCount) break;
      }
    }

    return res.status(200).json({
      ok: true,
      drafts: accepted,
      source: "ai",
      attempts,
    });
  } catch (error) {
    console.error("[lib/admin/cards/recommend] error:", error);
    return res.status(500).json({
      ok: false,
      message: error?.message || "추천 초안 생성 중 오류가 발생했어요.",
    });
  }
}