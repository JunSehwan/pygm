const admin = require("firebase-admin");
const { onCall, HttpsError } = require("firebase-functions/v2/https");

const REGION = "asia-northeast3";

const ALLOWED_REASONS = [
  "few_matches",
  "too_expensive",
  "not_using",
  "met_someone",
  "privacy_concern",
  "app_quality",
  "other",
];

async function deleteDocsByWhere(db, collectionName, field, value) {
  const snap = await db.collection(collectionName).where(field, "==", value).get();
  if (snap.empty) return 0;

  const batchSize = 300;
  let deletedCount = 0;
  const docs = snap.docs;

  for (let i = 0; i < docs.length; i += batchSize) {
    const chunk = docs.slice(i, i + batchSize);
    const batch = db.batch();

    chunk.forEach((docSnap) => {
      batch.delete(docSnap.ref);
      deletedCount += 1;
    });

    await batch.commit();
  }

  return deletedCount;
}

async function deleteDocsByWhereAny(db, rules, uid) {
  let total = 0;

  for (const rule of rules) {
    try {
      const deleted = await deleteDocsByWhere(db, rule.collection, rule.field, uid);
      total += deleted;
      console.log("[account delete] cleanup", rule.collection, rule.field, deleted);
    } catch (error) {
      console.error(
        "[account delete] cleanup error:",
        rule.collection,
        rule.field,
        error
      );
    }
  }

  return total;
}

exports.deleteCurrentUserAccount = onCall(
  { region: REGION, timeoutSeconds: 120 },
  async (request) => {
    try {
      const uid = request.auth?.uid || null;

      if (!uid) {
        throw new HttpsError("unauthenticated", "로그인이 필요해요.");
      }

      const {
        reason = "",
        reasonTitle = "",
        detailText = "",
        agreeProfileLoss = false,
        agreeNoRecovery = false,
      } = request.data || {};

      if (!reason || !ALLOWED_REASONS.includes(reason)) {
        throw new HttpsError("invalid-argument", "탈퇴 사유를 선택해주세요.");
      }

      if (reason === "other" && String(detailText || "").trim().length < 5) {
        throw new HttpsError("invalid-argument", "기타 사유를 5자 이상 입력해주세요.");
      }

      if (!agreeProfileLoss || !agreeNoRecovery) {
        throw new HttpsError("invalid-argument", "안내 사항을 모두 확인해주세요.");
      }

      const db = admin.firestore();
      const userRef = db.collection("users").doc(uid);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        throw new HttpsError("not-found", "사용자 정보를 찾지 못했어요.");
      }

      const userData = userSnap.data() || {};
      const now = admin.firestore.FieldValue.serverTimestamp();

      await db.collection("accountDeletionLogs").doc(uid).set(
        {
          uid,
          email: userData.email || "",
          username: userData.username || "",
          nickname: userData.nickname || "",
          gender: userData.gender || "",
          phonenumber: userData.phonenumber || "",
          reason,
          reasonTitle: reasonTitle || "",
          detailText: String(detailText || "").trim(),
          deletedAt: now,
          source: "account_delete_page",
        },
        { merge: true }
      );

      /**
       * 연관 데이터 정리 규칙
       * 차밍카드는 남기고,
       * 답변 / 반응 / 관심 / 알림 / 차단 / 결제 등만 삭제
       */
      const cleanupRules = [
        // 차밍카드 답변
        { collection: "charmingCardAnswers", field: "creatorUid" },
        { collection: "charmingCardAnswers", field: "answererUid" },
        { collection: "charmingCardAnswers", field: "uid" },

        // // 차밍카드 반응
        // { collection: "charmingCardAnswerReactions", field: "uid" },
        // { collection: "charmingCardAnswerReactions", field: "creatorUid" },
        // { collection: "charmingCardAnswerReactions", field: "answererUid" },

        // 아레나 / 관심 / 보드 / 알림
        { collection: "arenaInterests", field: "fromUid" },
        { collection: "arenaInterests", field: "toUid" },
        { collection: "arenaInterests", field: "uid" },
        { collection: "notifications", field: "uid" },
        { collection: "notifications", field: "targetUid" },
        { collection: "boardContacts", field: "uid" },

        // 차단 / 결제 / 기타
        { collection: "userBlocks", field: "uid" },
        { collection: "purchases", field: "uid" },
        { collection: "paymentLogs", field: "uid" },
      ];

      const cleanupCount = await deleteDocsByWhereAny(db, cleanupRules, uid);
      console.log("[account delete] total cleaned docs:", cleanupCount);

      await userRef.delete();
      await admin.auth().deleteUser(uid);

      return {
        ok: true,
        cleanupCount,
      };
    } catch (error) {
      console.error("deleteCurrentUserAccount error:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        error?.message || "계정 삭제 중 문제가 발생했어요."
      );
    }
  }
);