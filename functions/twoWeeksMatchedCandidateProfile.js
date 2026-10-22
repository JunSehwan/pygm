const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { assertApplicationOwner } = require("./twoWeeksCallerAuth");

if (!admin.apps.length) {
  admin.initializeApp();
}

function safeString(value = "") {
  return String(value || "").trim();
}

function sanitizePhoto(photo = {}) {
  const url = safeString(photo?.url || photo?.downloadURL || photo?.originalUrl || "");

  if (!url) {
    return {
      url: "",
      proposalVisible: true,
      originalMissing: true,
      originalRedacted: false,
    };
  }

  return {
    url,
    name: safeString(photo?.name || ""),
    type: safeString(photo?.type || "image/jpeg"),
    size: Number(photo?.size || 0),
    proposalVisible: true,
    originalRedacted: false,
  };
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

async function hasAccepted(db, viewerApplicationId, candidateApplicationId) {
  const responseSnap = await db
    .collection("twoweeksProposalResponses")
    .doc(`${viewerApplicationId}_${candidateApplicationId}`)
    .get();

  return responseSnap.exists && responseSnap.data()?.response === "accepted";
}

function isTerminalProposalStatus(value = "") {
  return [
    "declined",
    "failed",
    "expired",
    "proposal_expired",
    "schedule_expired",
    "counterpart_expired",
    "cancelled",
    "canceled",
  ].includes(safeString(value));
}

async function isOrganizationVisible(db, match = {}, maleApplicationId = "", femaleApplicationId = "") {
  const status = safeString(match?.status || "");
  const proposalStatus = safeString(match?.proposalStatus || "");
  const scheduleStatus = safeString(match?.scheduleStatus || match?.schedule?.status || "");

  if (
    isTerminalProposalStatus(status) ||
    isTerminalProposalStatus(proposalStatus) ||
    isTerminalProposalStatus(scheduleStatus)
  ) {
    return false;
  }

  if (
    ["mutualAccepted", "confirmed"].includes(status) ||
    ["ready", "waiting_counterpart", "needs_final_choice", "place_pending", "confirmed"].includes(scheduleStatus)
  ) {
    return true;
  }

  const [maleAccepted, femaleAccepted] = await Promise.all([
    hasAccepted(db, maleApplicationId, femaleApplicationId),
    hasAccepted(db, femaleApplicationId, maleApplicationId),
  ]);

  return maleAccepted && femaleAccepted;
}

function buildCandidate(candidate = {}, options = {}) {
  const basic = candidate?.basic || {};
  const identity = candidate?.identity || {};
  const matchingPreferences = candidate?.matchingPreferences || basic?.matchingPreferences || {};
  const organizationVisible = options.organizationVisible === true;

  return {
    id: safeString(candidate?.id || ""),
    roundId: safeString(candidate?.roundId || ""),
    roundLabel: safeString(candidate?.roundLabel || ""),
    status: safeString(candidate?.status || ""),
    reviewStatus: safeString(candidate?.reviewStatus || ""),
    matchingStatus: safeString(candidate?.matchingStatus || ""),
    photoRevealStatus: "proposal_visible",
    basic: {
      gender: safeString(basic?.gender || ""),
      nickname: safeString(basic?.nickname || ""),
      birthYear: basic?.birthYear || null,
      age: basic?.age || null,
      ageType: safeString(basic?.ageType || "full_age"),
      activityAreas: normalizeArray(basic?.activityAreas),
      preferredArea: safeString(basic?.preferredArea || ""),
      availableTimeSlots: normalizeArray(basic?.availableTimeSlots),
      height: basic?.height || null,
      introduction: safeString(basic?.introduction || ""),
      maritalStatus: safeString(basic?.maritalStatus || ""),
    },
    identity: {
      jobCategory: safeString(identity?.jobCategory || ""),
      organizationName: organizationVisible ? safeString(identity?.organizationName || "") : "",
      representativePhoto: sanitizePhoto(identity?.representativePhoto),
      additionalPhotos: normalizeArray(identity?.additionalPhotos).map(sanitizePhoto).filter(Boolean),
      verificationDocument: null,
    },
    matchingPreferences: {
      marriagePlan: safeString(matchingPreferences?.marriagePlan || ""),
      childrenPlan: safeString(matchingPreferences?.childrenPlan || ""),
      religion: safeString(matchingPreferences?.religion || ""),
      religionPreference: safeString(matchingPreferences?.religionPreference || ""),
      smoking: safeString(matchingPreferences?.smoking || ""),
      smokingPreference: safeString(matchingPreferences?.smokingPreference || ""),
      drinkingFrequency: safeString(matchingPreferences?.drinkingFrequency || ""),
    },
    disclosure: {
      proposalPhotosVisible: true,
      originalPhotoRedacted: false,
      sanitizedForDashboard: true,
      source: "matched_candidate_clear_v1",
    },
  };
}

const getTwoWeeksMatchedCandidateProfile = onCall(
  { region: "asia-northeast3" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const data = request.data || {};
    const viewerApplicationId = safeString(data?.viewerApplicationId || "");
    const matchId = safeString(data?.matchId || "");
    if (!viewerApplicationId || !matchId) {
      throw new HttpsError("invalid-argument", "신청현황 접근 정보가 필요합니다.");
    }

    await assertApplicationOwner(request, viewerApplicationId, { allowAdmin: false });

    const db = admin.firestore();
    const [viewerSnap, matchSnap] = await Promise.all([
      db.collection("twoweeksApplications").doc(viewerApplicationId).get(),
      db.collection("twoweeksMatches").doc(matchId).get(),
    ]);

    if (!viewerSnap.exists || !matchSnap.exists) {
      throw new HttpsError("not-found", "매칭 또는 신청 정보를 찾을 수 없습니다.");
    }

    const match = { id: matchSnap.id, ...matchSnap.data() };

    const maleApplicationId = safeString(match?.maleApplicationId || "");
    const femaleApplicationId = safeString(match?.femaleApplicationId || "");
    const participantIds = [maleApplicationId, femaleApplicationId].filter(Boolean);

    if (participantIds.length !== 2 || !participantIds.includes(viewerApplicationId)) {
      throw new HttpsError("permission-denied", "해당 매칭의 참여자가 아닙니다.");
    }

    const candidateApplicationId =
      viewerApplicationId === maleApplicationId ? femaleApplicationId : maleApplicationId;
    const candidateSnap = await db
      .collection("twoweeksApplications")
      .doc(candidateApplicationId)
      .get();

    if (!candidateSnap.exists) {
      throw new HttpsError("not-found", "후보 정보를 찾을 수 없습니다.");
    }

    const organizationVisible = await isOrganizationVisible(
      db,
      match,
      maleApplicationId,
      femaleApplicationId
    );
    const candidate = buildCandidate(
      { id: candidateSnap.id, ...candidateSnap.data() },
      { organizationVisible }
    );

    await matchSnap.ref.update({
      [`candidatePreviews.${viewerApplicationId}`]: candidate,
      "securePhotoPolicy.proposalStageUsesClearPhotos": true,
      "securePhotoPolicy.originalPhotoVisibleFromProposal": true,
      "securePhotoPolicy.previewVersion": "clear_v1",
      "securePhotoPolicy.upgradedAt": admin.firestore.FieldValue.serverTimestamp(),
      "securePhotoPolicy.upgradedAtClient": new Date().toISOString(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      ok: true,
      candidate,
      photoPolicy: "proposal_clear_v1",
    };
  }
);

module.exports = { getTwoWeeksMatchedCandidateProfile };
