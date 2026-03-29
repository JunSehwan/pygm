export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\w가-힣]/g, "")
    .trim();
}

function isDuplicate(candidate, compareList = []) {
  const titleKey = normalizeText(candidate?.title || "");
  const bodyKey = normalizeText(candidate?.body || candidate?.guide || "");

  return compareList.some((item) => {
    const itemTitle = normalizeText(item?.title || "");
    const itemBody = normalizeText(item?.body || item?.guide || "");

    if (titleKey && itemTitle && titleKey === itemTitle) return true;
    if (bodyKey && itemBody && bodyKey === itemBody) return true;
    if (titleKey && itemTitle && (titleKey.includes(itemTitle) || itemTitle.includes(titleKey))) {
      return true;
    }
    return false;
  });
}

function buildPrompt({ existingCards = [], currentDrafts = [], categoryHint = "" }) {
  const comparePool = [...existingCards, ...currentDrafts]
    .slice(0, 60)
    .map((item) => ({
      title: item.title || "",
      body: item.body || item.guide || "",
      category: item.categoryLabel || item.category || "",
      questionType: item.questionType || "",
    }));

  return `
너는 한국 데이팅 서비스 "차밍수프"의 운영자용 콘텐츠 추천 도우미다.

목표:
- 남성 회원에게 보여줄 차밍카드 1개를 생성한다.
- 너무 뻔하지 않고, 실제 대화/첫인상/가치관/연애관/생활 취향을 자연스럽게 드러내는 질문이어야 한다.
- 기존 카드와 겹치지 않아야 한다.
- 너무 자극적이거나 저속하면 안 된다.
- 너무 AI스럽거나 딱딱하지 않게 쓴다.
- 제목과 본문은 자연스러운 한국어여야 한다.
- 최근 유튜브 연애관련 콘텐츠, 인스타그램에서의 연애관련 콘텐츠 등 SNS에서 이슈가 될만한 콘텐츠 중심이어야 한다.

반드시 아래 JSON 한 개만 반환:
{
  "questionType": "choice" 또는 "text",
  "category": "sense|value|date|lifestyle|marriage",
  "categoryLabel": "센스|가치관|연애|생활|결혼관",
  "title": "질문 제목",
  "body": "질문 본문",
  "guide": "짧은 안내문",
  "options": ["...", "...", "...", "..."] // choice일 때만 4개, text면 []
}

규칙:
- questionType은 choice 또는 text 중 하나
- choice면 options는 정확히 4개
- text면 options는 빈 배열
- title은 28자 내외로 짧고 선명하게
- body는 1~2문장
- guide는 1문장
- categoryHint가 있으면 가급적 반영

categoryHint:
${categoryHint || "-"}

중복 방지를 위해 참고할 기존 카드/초안:
${JSON.stringify(comparePool, null, 2)}
`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    const {
      existingCards = [],
      currentDrafts = [],
      replaceDraftId = "",
      categoryHint = "",
    } = req.body || {};

    const compareList = [...existingCards, ...currentDrafts].filter(
      (item) => item?.id !== replaceDraftId
    );

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        ok: false,
        message: "OPENAI_API_KEY가 설정되지 않았어요.",
      });
    }

    const prompt = buildPrompt({
      existingCards: compareList,
      currentDrafts: compareList,
      categoryHint,
    });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.4-mini",
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "card_draft",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                questionType: {
                  type: "string",
                  enum: ["choice", "text"],
                },
                category: {
                  type: "string",
                  enum: ["sense", "value", "date", "lifestyle", "marriage"],
                },
                categoryLabel: {
                  type: "string",
                  enum: ["센스", "가치관", "연애", "생활", "결혼관"],
                },
                title: { type: "string" },
                body: { type: "string" },
                guide: { type: "string" },
                options: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: [
                "questionType",
                "category",
                "categoryLabel",
                "title",
                "body",
                "guide",
                "options",
              ],
            },
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[generate-card-draft] openai error:", data);
      return res.status(500).json({
        ok: false,
        message: "AI 추천 생성 중 문제가 발생했어요.",
        detail: data,
      });
    }

    const rawText =
      data?.output?.[0]?.content?.[0]?.text ||
      data?.output_text ||
      "";

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      return res.status(500).json({
        ok: false,
        message: "AI 응답 파싱에 실패했어요.",
        rawText,
      });
    }

    const draft = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      questionType: parsed.questionType === "choice" ? "choice" : "text",
      category: parsed.category || "sense",
      categoryLabel: parsed.categoryLabel || "센스",
      title: parsed.title || "",
      body: parsed.body || "",
      guide: parsed.guide || "",
      options:
        parsed.questionType === "choice"
          ? Array.isArray(parsed.options)
            ? parsed.options.slice(0, 4)
            : ["", "", "", ""]
          : [],
      visibilityTarget: "male",
      source: "ai",
    };

    if (isDuplicate(draft, compareList)) {
      return res.status(409).json({
        ok: false,
        message: "기존 카드와 너무 유사한 초안이 생성됐어요. 다시 시도해주세요.",
      });
    }

    return res.status(200).json({
      ok: true,
      draft,
    });
  } catch (error) {
    console.error("[generate-card-draft] error:", error);
    return res.status(500).json({
      ok: false,
      message: "서버 오류가 발생했어요.",
    });
  }
}