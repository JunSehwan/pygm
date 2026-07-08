const admin = require("firebase-admin");
const crypto = require("crypto");
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

function normalizePhone(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

function maskEmail(email = "") {
  const value = String(email || "").trim();
  if (!value || !value.includes("@")) return "";

  const [local, domain] = value.split("@");
  if (!local || !domain) return "";

  if (local.length <= 2) {
    return `${local.slice(0, 1)}*@${domain}`;
  }

  return `${local.slice(0, 2)}***@${domain}`;
}

function hashValue(value = "") {
  const normalized = String(value || "").trim();
  if (!normalized) return "";

  return crypto.createHash("sha256").update(normalized).digest("hex");
}

function getProfilePhotoPaths(userData = {}) {
  const paths = [];

  if (Array.isArray(userData.profilePhotos)) {
    userData.profilePhotos.forEach((item) => {
      if (typeof item === "string") return;
      const path = String(item?.path || "").trim();
      if (path) paths.push(path);
    });
  }

  [
    userData.profilePhotoPath,
    userData.profileImagePath,
    userData.thumbimagePath,
    userData.thumbnailPath,
  ].forEach((item) => {
    const path = String(item || "").trim();
    if (path) paths.push(path);
  });

  return [...new Set(paths)];
}

async function deleteStorageFiles(paths = []) {
  if (!Array.isArray(paths) || !paths.length) return 0;

  let deletedCount = 0;
  let bucket = null;

  try {
    bucket = admin.storage().bucket();
  } catch (error) {
    console.error("[account withdraw] storage bucket init error:", error);
    return 0;
  }

  for (const path of paths) {
    try {
      await bucket.file(path).delete({ ignoreNotFound: true });
      deletedCount += 1;
    } catch (error) {
      // Storage 정리는 실패해도 탈퇴 처리를 막지 않습니다.
      console.error("[account withdraw] storage cleanup error:", path, error);
    }
  }

  return deletedCount;
}

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
      console.log("[account withdraw] cleanup", rule.collection, rule.field, deleted);
    } catch (error) {
      console.error(
        "[account withdraw] cleanup error:",
        rule.collection,
        rule.field,
        error
      );
    }
  }

  return total;
}

async function updateDocsByWhere(db, collectionName, field, value, patch) {
  const snap = await db.collection(collectionName).where(field, "==", value).get();
  if (snap.empty) return 0;

  const batchSize = 300;
  let updatedCount = 0;
  const docs = snap.docs;

  for (let i = 0; i < docs.length; i += batchSize) {
    const chunk = docs.slice(i, i + batchSize);
    const batch = db.batch();

    chunk.forEach((docSnap) => {
      batch.set(docSnap.ref, patch, { merge: true });
      updatedCount += 1;
    });

    await batch.commit();
  }

  return updatedCount;
}

async function redactMatchingReferences(db, uid, now) {
  const basePatch = {
    updatedAt: now,
    withdrawnUserIncluded: true,
  };

  const results = await Promise.all([
    updateDocsByWhere(db, "arenaMatches", "maleUid", uid, {
      ...basePatch,
      malePhone: "",
      maleNickname: "탈퇴회원",
      maleWithdraw: true,
    }),
    updateDocsByWhere(db, "arenaMatches", "femaleUid", uid, {
      ...basePatch,
      femalePhone: "",
      femaleNickname: "탈퇴회원",
      femaleWithdraw: true,
    }),
    updateDocsByWhere(db, "arenaInterests", "maleUid", uid, {
      ...basePatch,
      malePhone: "",
      maleWithdraw: true,
      withdrawnAt: now,
      status: "withdrawn",
    }),
    updateDocsByWhere(db, "arenaInterests", "femaleUid", uid, {
      ...basePatch,
      femalePhone: "",
      femaleWithdraw: true,
      withdrawnAt: now,
      status: "withdrawn",
    }),
    updateDocsByWhere(db, "arenaInterests", "fromUid", uid, {
      ...basePatch,
      fromWithdraw: true,
      withdrawnAt: now,
      status: "withdrawn",
    }),
    updateDocsByWhere(db, "arenaInterests", "toUid", uid, {
      ...basePatch,
      toWithdraw: true,
      withdrawnAt: now,
      status: "withdrawn",
    }),
  ]);

  return results.reduce((sum, count) => sum + count, 0);
}

async function removeUidFromArenaOffers(db, uid, now) {
  const snap = await db.collection("arenaOffers").get();
  if (snap.empty) return 0;

  let updatedCount = 0;
  const batchSize = 300;
  const docsToUpdate = [];

  snap.docs.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const maleUids = Array.isArray(data.maleUids)
      ? data.maleUids.map((item) => String(item || "").trim()).filter(Boolean)
      : [];

    const nextMaleUids = maleUids.filter((item) => item !== uid);
    const shouldUpdate =
      String(data.maleUid || "") === uid || nextMaleUids.length !== maleUids.length;

    if (!shouldUpdate) return;

    docsToUpdate.push({
      ref: docSnap.ref,
      data,
      nextMaleUids,
    });
  });

  for (let i = 0; i < docsToUpdate.length; i += batchSize) {
    const chunk = docsToUpdate.slice(i, i + batchSize);
    const batch = db.batch();

    chunk.forEach(({ ref, data, nextMaleUids }) => {
      const valueMatchPercentMap = { ...(data.valueMatchPercentMap || {}) };
      delete valueMatchPercentMap[uid];

      batch.set(
        ref,
        {
          maleUid: nextMaleUids[0] || "",
          maleUids: nextMaleUids,
          count: nextMaleUids.length,
          status: nextMaleUids.length ? data.status || "offered" : "empty",
          valueMatchPercent: nextMaleUids[0]
            ? Number(valueMatchPercentMap[nextMaleUids[0]] || 0)
            : 0,
          valueMatchPercentMap,
          updatedAt: now,
        },
        { merge: true }
      );
      updatedCount += 1;
    });

    await batch.commit();
  }

  return updatedCount;
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
      const plainPhone = normalizePhone(userData.phonenumber || userData.phoneNumber || "");
      const plainEmail = String(userData.email || "").trim().toLowerCase();
      const profilePhotoPaths = getProfilePhotoPaths(userData);

      await db.collection("accountDeletionLogs").doc(uid).set(
        {
          uid,
          reason,
          reasonTitle: reasonTitle || "",
          detailText: String(detailText || "").trim(),
          emailMasked: maskEmail(plainEmail),
          emailHash: hashValue(plainEmail),
          phoneLast4: plainPhone.slice(-4),
          phoneHash: hashValue(plainPhone),
          identityCiHash: hashValue(userData.identity_ci || ""),
          identityDiHash: hashValue(userData.identity_di || ""),
          previousNickname: userData.nickname || "",
          previousGender: userData.gender || userData.identity_gender || "",
          previousBirthdayYear: Number(userData?.birthday?.year || 0) || null,
          previousSignupApproved: userData.signupApproved === true,
          previousAdminApprovalStatus: userData.adminApprovalStatus || "",
          previousReviewStatus: userData.reviewStatus || "",
          previousPendingStatus: userData.pendingStatus || "",
          previousSpoonFree: Number(userData.spoon_free || 0),
          previousSpoonPaid: Number(userData.spoon_paid || 0),
          profilePhotoCount: Array.isArray(userData.profilePhotos)
            ? userData.profilePhotos.filter((item) => item?.url || item?.path || item).length
            : 0,
          storagePhotoPathCount: profilePhotoPaths.length,
          withdrawnAt: now,
          deletedAt: now,
          source: "account_delete_page",
          mode: "soft_withdraw_user_doc_retained",
        },
        { merge: true }
      );

      // 사용자에게 노출될 수 있는 공개성/개인성 데이터는 정리하고,
      // users/{uid} 문서 자체는 운영 이력 보존을 위해 남깁니다.
      await userRef.set({
        uid,
        id: uid,
        userID: uid,

        accountStatus: "withdrawn",
        withdraw: true,
        withdrawn: true,
        withdrawAt: now,
        withdrawReasonCode: reason,
        withdrawReasonTitle: reasonTitle || "",

        username: "탈퇴회원",
        nickname: "탈퇴회원",
        displayName: "탈퇴회원",
        name: "",
        email: "",
        phonenumber: "",
        phoneNumber: "",

        thumbimage: "",
        profilePhotos: [],
        charmingCardPhotoPublic: false,

        signupApproved: false,
        adminApprovalStatus: "withdrawn",
        reviewStatus: "withdrawn",
        pendingStatus: "withdrawn",
        rejectReasonCode: "",
        rejectReasonText: "",

        date_sleep: true,
        sleep: true,
        date_pending: false,
        date_profile_finished: false,
        profile_setup_required_done: false,
        profile_photo_required_done: false,
        profile_setup_step: 0,
        adminMatchExposureBlocked: true,
        arenaReceivePaused: true,

        phone_verified: false,
        phone_verified_at: null,
        identityVerified: false,
        identityVerifiedAt: null,
        identityReminderDismissedAt: null,

        spoon: 0,
        spoon_free: 0,
        spoon_paid: 0,
        wink: 0,

        datecard: [],
        liked: [],
        likes: [],
        disliked: [],
        dislikes: [],
        blockedContacts: [],
        blockedCompanyKeywords: [],

        createdAt: userData.createdAt || null,
        timestamp: userData.timestamp || "",
        approvedAt: userData.approvedAt || null,
        approvedBy: userData.approvedBy || "",
        updatedAt: now,
      });

      /**
       * 삭제하는 항목은 공개/알림/차단 등 사용자에게 남을 수 있는 흔적 중심으로만 정리합니다.
       * 매칭·결제 기록은 운영/CS/통계 확인을 위해 삭제하지 않고,
       * 전화번호 등 민감값만 별도 redaction 처리합니다.
       */
      const cleanupRules = [
        { collection: "charmingCardAnswers", field: "creatorUid" },
        { collection: "charmingCardAnswers", field: "answererUid" },
        { collection: "charmingCardAnswers", field: "uid" },
        { collection: "notifications", field: "uid" },
        { collection: "notifications", field: "targetUid" },
        { collection: "userBlocks", field: "uid" },
      ];

      const cleanupCount = await deleteDocsByWhereAny(db, cleanupRules, uid);
      const redactedReferenceCount = await redactMatchingReferences(db, uid, now);
      const offerCleanupCount = await removeUidFromArenaOffers(db, uid, now);
      const storageDeletedCount = await deleteStorageFiles(profilePhotoPaths);

      try {
        await admin.auth().deleteUser(uid);
      } catch (error) {
        if (error?.code !== "auth/user-not-found") {
          throw error;
        }
      }

      return {
        ok: true,
        mode: "soft_withdraw_user_doc_retained",
        cleanupCount,
        redactedReferenceCount,
        offerCleanupCount,
        storageDeletedCount,
      };
    } catch (error) {
      console.error("deleteCurrentUserAccount error:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        error?.message || "회원 탈퇴 처리 중 문제가 발생했어요."
      );
    }
  }
);
