const admin = require("firebase-admin");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");

if (!admin.apps.length) admin.initializeApp();

exports.migrateTwoWeeksFeedbackPrivacy = onSchedule(
  {
    region: "asia-northeast3",
    schedule: "every 6 hours",
    timeZone: "Asia/Seoul",
    timeoutSeconds: 540,
    memory: "256MiB",
  },
  async () => {
    const db = admin.firestore();
    const snapshot = await db.collection("twoweeksMatches").get();
    let migrated = 0;

    for (const matchSnap of snapshot.docs) {
      const match = matchSnap.data() || {};
      const hasFeedbacks = match.feedbacks && Object.keys(match.feedbacks).length > 0;
      const hasTokens = match.feedbackTokens && Object.keys(match.feedbackTokens).length > 0;
      if (!hasFeedbacks && !hasTokens) continue;

      await db.runTransaction(async (tx) => {
        const latestSnap = await tx.get(matchSnap.ref);
        if (!latestSnap.exists) return;
        const latest = latestSnap.data() || {};
        const feedbacks = latest.feedbacks || {};
        const feedbackTokens = latest.feedbackTokens || {};
        if (!Object.keys(feedbacks).length && !Object.keys(feedbackTokens).length) return;

        const privateRef = db.collection("twoweeksFeedbackPrivate").doc(matchSnap.id);
        tx.set(
          privateRef,
          {
            matchId: matchSnap.id,
            feedbacks,
            feedbackTokens,
            migratedAt: admin.firestore.FieldValue.serverTimestamp(),
            migratedAtClient: new Date().toISOString(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        tx.set(
          matchSnap.ref,
          {
            feedbacks: admin.firestore.FieldValue.delete(),
            feedbackTokens: admin.firestore.FieldValue.delete(),
            feedbackPrivacyVersion: 2,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        migrated += 1;
      });
    }

    logger.info("[TwoWeeksFeedbackPrivacyMigration] completed", { scanned: snapshot.size, migrated });
    return { scanned: snapshot.size, migrated };
  }
);
