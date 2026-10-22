async function getTwoWeeksFeedbackPrivateData(db, matchId = "", legacyMatch = {}) {
  if (!db || !matchId) {
    return {
      feedbacks: legacyMatch?.feedbacks || {},
      feedbackTokens: legacyMatch?.feedbackTokens || {},
    };
  }

  const snap = await db.collection("twoweeksFeedbackPrivate").doc(matchId).get();
  const data = snap.exists ? snap.data() || {} : {};
  return {
    feedbacks: data.feedbacks || legacyMatch?.feedbacks || {},
    feedbackTokens: data.feedbackTokens || legacyMatch?.feedbackTokens || {},
  };
}

async function getTwoWeeksFeedbacks(db, matchId = "", legacyMatch = {}) {
  return (await getTwoWeeksFeedbackPrivateData(db, matchId, legacyMatch)).feedbacks;
}

async function getTwoWeeksFeedbackTokens(db, matchId = "", legacyMatch = {}) {
  return (await getTwoWeeksFeedbackPrivateData(db, matchId, legacyMatch)).feedbackTokens;
}

module.exports = {
  getTwoWeeksFeedbackPrivateData,
  getTwoWeeksFeedbacks,
  getTwoWeeksFeedbackTokens,
};
