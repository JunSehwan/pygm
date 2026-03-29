export function toMillis(value) {
  if (!value) return 0;
  if (typeof value === "string") return new Date(value).getTime();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (value?.seconds) return value.seconds * 1000;
  return 0;
}

export function sortCards(cards, tabKey, answeredIdsSet) {
  const next = [...cards];

  if (tabKey === "unanswered") {
    return next.filter((card) => !answeredIdsSet.has(card.id));
  }

  if (tabKey === "mine") {
    return next.filter((card) => answeredIdsSet.has(card.id));
  }

  if (tabKey === "latest") {
    return next.sort(
      (a, b) => toMillis(b.updatedAt || b.createdAt) - toMillis(a.updatedAt || a.createdAt)
    );
  }

  if (tabKey === "popular") {
    return next.sort(
      (a, b) =>
        b.answerCount + b.interestedCount + b.views * 0.01 -
        (a.answerCount + a.interestedCount + a.views * 0.01)
    );
  }

  return next.sort((a, b) => (b.recommendedScore || 0) - (a.recommendedScore || 0));
}

export function getTodayRecommendCard(cards, answeredIdsSet) {
  const unanswered = (cards || []).filter((card) => !answeredIdsSet.has(card.id));

  if (unanswered.length > 0) {
    return [...unanswered].sort(
      (a, b) => (b.recommendedScore || 0) - (a.recommendedScore || 0)
    )[0];
  }

  if ((cards || []).length > 0) {
    return [...cards].sort(
      (a, b) => (b.recommendedScore || 0) - (a.recommendedScore || 0)
    )[0];
  }

  return null;
}