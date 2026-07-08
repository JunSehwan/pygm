function toMillis(value) {
  if (!value) return 0;
  if (typeof value === "string") return new Date(value).getTime();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (value?.seconds) return value.seconds * 1000;
  return 0;
}

function compareAnsweredFirst(a, b, answeredIdsSet) {
  const aAnswered = answeredIdsSet?.has?.(a?.id) ? 1 : 0;
  const bAnswered = answeredIdsSet?.has?.(b?.id) ? 1 : 0;

  // 미작성(0) 먼저, 작성완료(1) 나중
  if (aAnswered !== bAnswered) {
    return aAnswered - bAnswered;
  }

  return 0;
}

export function sortCards(cards = [], activeTab = "recommended", answeredIdsSet = new Set()) {
  const next = [...(cards || [])];

  const sortByTab = (a, b) => {
    if (activeTab === "latest") {
      return (
        toMillis(b?.updatedAt || b?.createdAt) -
        toMillis(a?.updatedAt || a?.createdAt)
      );
    }

    if (activeTab === "popular") {
      const aScore =
        Number(a?.interestedCount || 0) * 1.2 + Number(a?.views || 0) * 0.01;
      const bScore =
        Number(b?.interestedCount || 0) * 1.2 + Number(b?.views || 0) * 0.01;

      return bScore - aScore;
    }

    // recommended 기본값
    const aScore =
      Number(a?.views || 0) * 0.55 + Number(a?.interestedCount || 0) * 0.45;
    const bScore =
      Number(b?.views || 0) * 0.55 + Number(b?.interestedCount || 0) * 0.45;

    return bScore - aScore;
  };

  return next.sort((a, b) => {
    const answeredCompare = compareAnsweredFirst(a, b, answeredIdsSet);
    if (answeredCompare !== 0) return answeredCompare;

    return sortByTab(a, b);
  });
}

export function getTodayRecommendCard(cards = [], answeredIdsSet = new Set()) {
  const sorted = sortCards(cards, "recommended", answeredIdsSet);
  return sorted?.[0] || null;
}