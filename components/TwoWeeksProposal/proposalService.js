import { signInAnonymously, signInWithCustomToken } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth, db, storage, sendLms } from "firebaseConfig";
import { TWOWEEKS_ROUND_ID } from "./constants";
import { TWOWEEKS_MAX_PROFILE_PHOTOS } from "../TwoWeeksShared/profilePhotoPolicy";
import {
  getApplicationTimeValue,
  isApplicationProfileEditable,
  normalizePhone,
  normalizeTimeSlotLabels,
} from "./helpers";
import { normalizeTwoWeeksDeclineReason } from "../TwoWeeksShared/declineReasons";
import { summaryPastMatch } from "./introJourneyState";

async function ensureAuth() {
  try {
    if (typeof auth.authStateReady === "function") {
      await auth.authStateReady();
    }
  } catch {
    // Firebase Auth 초기 상태 확인 실패 시 아래 fallback을 사용한다.
  }

  if (auth.currentUser) return auth.currentUser;

  try {
    const credential = await signInAnonymously(auth);
    return credential.user;
  } catch (error) {
    console.warn("[TwoWeeksProposal] anonymous auth unavailable:", error?.code || error?.message || error);
    return null;
  }
}

function isPermissionLikeError(error) {
  return (
    error?.code === "auth/admin-restricted-operation" ||
    error?.code === "permission-denied" ||
    error?.code === "firestore/permission-denied" ||
    String(error?.message || "").includes("Missing or insufficient permissions")
  );
}

function toConsumerError(error, fallback = "잠시 후 다시 시도해주세요.") {
  if (isPermissionLikeError(error)) return new Error(fallback);
  return error instanceof Error ? error : new Error(fallback);
}

function mapDoc(snap) {
  return {
    id: snap.id,
    ...snap.data(),
  };
}

export async function loadActiveCafeCandidates() {
  try {
    const snap = await getDocs(
      query(collection(db, "twoweeksCafeCandidates"), where("status", "==", "active"))
    );

    return snap.docs
      .map(mapDoc)
      .filter((item) => item?.name && item?.area)
      .sort((a, b) => {
        const areaCompare = String(a.area || "").localeCompare(String(b.area || ""), "ko");
        if (areaCompare) return areaCompare;

        const sortCompare = Number(a.sortOrder || 999) - Number(b.sortOrder || 999);
        if (sortCompare) return sortCompare;

        return String(a.name || "").localeCompare(String(b.name || ""), "ko");
      });
  } catch (error) {
    console.warn("[TwoWeeksProposal] cafe candidates load skipped:", error?.code || error?.message || error);
    return [];
  }
}

const RESPONSE_DUE_DAYS = 2;
const SCHEDULE_DUE_DAYS = 2;

function getTimeMs(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function getSeoulDateKey(value) {
  const ms = getTimeMs(value);
  if (!ms) return "";

  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(ms));
  } catch {
    return "";
  }
}

function getConfirmedMeetingStart(matchData = {}) {
  return (
    matchData?.finalMeeting?.startAtClient ||
    matchData?.finalMeeting?.finalTimeChoice?.startAtClient ||
    matchData?.finalMeeting?.timeChoice?.startAtClient ||
    matchData?.schedule?.finalMeeting?.startAtClient ||
    matchData?.schedule?.finalTimeChoice?.startAtClient ||
    matchData?.schedule?.finalChoice?.timeChoice?.startAtClient ||
    ""
  );
}

function assertMeetingDay(matchData = {}) {
  const meetingStart = getConfirmedMeetingStart(matchData);
  const meetingDayKey = getSeoulDateKey(meetingStart);
  const todayKey = getSeoulDateKey(Date.now());

  if (!meetingDayKey) {
    throw new Error("확정된 만남 일시를 확인할 수 없습니다.");
  }

  if (!todayKey || meetingDayKey !== todayKey) {
    throw new Error("현장사진과 도착 확인은 약속 당일에만 사용할 수 있습니다.");
  }
}

function addDaysClient(days = 2) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function getSiteOrigin() {
  // 브라우저에서 실행될 때는 현재 origin을 최우선으로 사용한다.
  // localhost/preview에서 운영 도메인으로 튀는 문제를 방지한다.
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  const configuredOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SERVICE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "";

  if (configuredOrigin) return configuredOrigin.replace(/\/$/, "");

  return "https://charmingsoup.com";
}

function getDashboardUrl(application = {}) {
  if (application?.dashboardAccess?.url) return application.dashboardAccess.url;

  if (application?.dashboardAccess?.path) {
    return `${getSiteOrigin()}${application.dashboardAccess.path}`;
  }

  return `${getSiteOrigin()}/2weeks/proposal/dashboard`;
}

function getApplicationPhone(application = {}) {
  return normalizePhone(
    application?.basic?.phoneNormalized ||
    application?.basic?.phone ||
    application?.phoneIdentityVerification?.phone ||
    application?.phone
  );
}

function buildEventMessage(application = {}, title = "", lines = []) {
  const basic = application?.basic || {};
  const name = basic.name || basic.nickname || "신청자";
  const dashboardUrl = getDashboardUrl(application);

  return [
    `[투윅스] ${title}`,
    "",
    ...lines,
    "",
    "신청현황 확인:",
    dashboardUrl,
  ]
    .filter((line) => line !== null && line !== undefined && line !== "")
    .join(String.fromCharCode(10));
}

async function sendEventSms(application = {}, title = "", lines = []) {
  const phone = getApplicationPhone(application);

  if (!phone) {
    return {
      status: "skipped",
      reason: "NO_PHONE",
    };
  }

  try {
    await sendLms(phone, buildEventMessage(application, title, lines), title, {
      forceLms: true,
    });

    return {
      status: "sent",
      phone,
      sentAtClient: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[TwoWeeksProposal] event sms failed:", error);

    return {
      status: "failed",
      phone,
      errorMessage: error?.message || String(error),
      failedAtClient: new Date().toISOString(),
    };
  }
}

async function notifyMutualAcceptedSchedule({ matchId = "", viewerApplicationId = "" } = {}) {
  if (!matchId || !viewerApplicationId) {
    return { status: "skipped", reason: "MISSING_MATCH" };
  }

  try {
    const functions = getFunctions(undefined, "asia-northeast3");
    const callable = httpsCallable(functions, "notifyTwoWeeksMutualAccepted");
    const result = await callable({ matchId, viewerApplicationId });

    return result?.data || { status: "sent" };
  } catch (error) {
    console.error("[TwoWeeksProposal] mutual accepted notification failed:", error);
    return {
      status: "failed",
      errorMessage: error?.message || String(error),
    };
  }
}

async function notifyProposalDeclined({ matchId = "", declinedByApplicationId = "", declineReason = null } = {}) {
  if (!matchId || !declinedByApplicationId || !declineReason?.code) {
    return { status: "skipped", reason: "MISSING_MATCH" };
  }

  try {
    const functions = getFunctions(undefined, "asia-northeast3");
    const callable = httpsCallable(functions, "notifyTwoWeeksProposalDeclined");
    const result = await callable({ matchId, declinedByApplicationId, declineReason });

    return result?.data || { status: "sent" };
  } catch (error) {
    console.error("[TwoWeeksProposal] decline notification failed:", error);
    return {
      status: "failed",
      errorMessage: error?.message || String(error),
    };
  }
}

async function getResponseDoc(viewerApplicationId, candidateApplicationId) {
  if (!viewerApplicationId || !candidateApplicationId) return null;

  try {
    const responseSnap = await getDoc(doc(db, "twoweeksProposalResponses", `${viewerApplicationId}_${candidateApplicationId}`));
    if (!responseSnap.exists()) return null;
    return {
      id: responseSnap.id,
      ...responseSnap.data(),
    };
  } catch (error) {
    console.warn("[TwoWeeksProposal] response read failed:", error?.code || error?.message || error);
    return null;
  }
}

async function getMatchDoc(matchId) {
  if (!matchId) return null;

  try {
    const matchSnap = await getDoc(doc(db, "twoweeksMatches", matchId));
    if (!matchSnap.exists()) return null;
    return {
      id: matchSnap.id,
      ...matchSnap.data(),
    };
  } catch (error) {
    console.warn("[TwoWeeksProposal] match read failed:", error?.code || error?.message || error);
    return null;
  }
}

function getMatchActivityTime(match = {}) {
  return Math.max(
    getTimeValue(match.updatedAt),
    getTimeValue(match.updatedAtClient),
    getTimeValue(match.finalSelectedAt),
    getTimeValue(match.finalSelectedAtClient),
    getTimeValue(match.mutualAcceptedAt),
    getTimeValue(match.mutualAcceptedAtClient),
    getTimeValue(match.createdAt),
    getTimeValue(match.createdAtClient)
  );
}

function getMatchStatusRank(match = {}) {
  const status = String(match?.status || "");
  const scheduleStatus = String(match?.scheduleStatus || match?.schedule?.status || "");
  const photoRevealStatus = String(match?.photoRevealStatus || "");

  // 종료된 만남에는 finalMeeting과 공개 상태가 그대로 남는다.
  // 종료 상태를 먼저 판정하지 않으면 과거 완료 건이 현재 확정 건과 같은
  // 최우선 순위(7000)로 다시 선택될 수 있다.
  if (status === "completed") {
    return 1000;
  }

  if (["declined", "failed", "expired", "cancelled", "canceled"].includes(status)) {
    return 0;
  }

  if (status === "confirmed" || scheduleStatus === "confirmed" || match?.finalMeeting || photoRevealStatus === "revealed") {
    return 7000;
  }

  if (status === "mutualAccepted" || ["waiting_counterpart", "needs_final_choice", "place_pending", "ready"].includes(scheduleStatus)) {
    return 6000;
  }

  if (status === "proposed" || match?.proposalStatus === "proposed") {
    return 5000;
  }

  return 1000;
}

function pickBestDashboardMatch(matches = []) {
  const rows = Array.isArray(matches) ? matches : [];

  return rows
    .filter((match) => match?.id && getMatchStatusRank(match) > 0)
    .sort((a, b) => {
      const rankDiff = getMatchStatusRank(b) - getMatchStatusRank(a);
      if (rankDiff) return rankDiff;
      return getMatchActivityTime(b) - getMatchActivityTime(a);
    })[0] || null;
}

function getCounterpartApplicationIdFromMatch(match = {}, viewerApplicationId = "") {
  if (!match || !viewerApplicationId) return "";

  if (match.maleApplicationId === viewerApplicationId) return match.femaleApplicationId || "";
  if (match.femaleApplicationId === viewerApplicationId) return match.maleApplicationId || "";

  return "";
}

function isSamePairMatch(match = {}, viewerApplicationId = "", candidateApplicationId = "") {
  if (!match?.id || !viewerApplicationId || !candidateApplicationId) return false;

  return (
    (match.maleApplicationId === viewerApplicationId && match.femaleApplicationId === candidateApplicationId) ||
    (match.femaleApplicationId === viewerApplicationId && match.maleApplicationId === candidateApplicationId)
  );
}

function isPhotoRevealedForMatch(match = {}) {
  const status = String(match?.status || "");
  const scheduleStatus = String(match?.scheduleStatus || match?.schedule?.status || "");
  const photoRevealStatus = String(match?.photoRevealStatus || "");

  return (
    status === "confirmed" ||
    scheduleStatus === "confirmed" ||
    photoRevealStatus === "revealed" ||
    Boolean(match?.finalMeeting || match?.schedule?.finalMeeting)
  );
}

function isOrganizationVisibleForMatch(match = {}, bothAccepted = false) {
  const status = String(match?.status || "");
  const scheduleStatus = String(match?.scheduleStatus || match?.schedule?.status || "");

  return (
    bothAccepted ||
    status === "mutualAccepted" ||
    status === "confirmed" ||
    ["ready", "waiting_counterpart", "needs_final_choice", "place_pending", "confirmed"].includes(scheduleStatus)
  );
}

function getProposalPhotoUrl(photo = {}) {
  return photo?.url || photo?.downloadURL || photo?.originalUrl || "";
}

function sanitizePhotoForProposalStage(photo = {}) {
  if (!photo) return null;

  const url = getProposalPhotoUrl(photo);

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
    name: photo.name || "",
    type: photo.type || "image/jpeg",
    size: photo.size || 0,
    proposalVisible: true,
    originalRedacted: false,
  };
}

function sanitizeCandidateApplicationForViewer(candidate = {}, options = {}) {
  if (!candidate?.id) return null;

  const basic = candidate.basic || {};
  const identity = candidate.identity || {};
  const matchingPreferences = candidate.matchingPreferences || basic.matchingPreferences || {};
  const photoRevealed = options.photoRevealed === true;
  const organizationVisible = options.organizationVisible === true;
  const mapPhoto = sanitizePhotoForProposalStage;

  return {
    id: candidate.id,
    roundId: candidate.roundId || "",
    roundLabel: candidate.roundLabel || "",
    status: candidate.status || "",
    reviewStatus: candidate.reviewStatus || "",
    matchingStatus: candidate.matchingStatus || "",
    photoRevealStatus: photoRevealed ? "revealed" : "hidden",
    basic: {
      gender: basic.gender || "",
      nickname: basic.nickname || "",
      birthYear: basic.birthYear || null,
      birthDate: basic.birthDate || "",
      age: basic.age || null,
      ageType: basic.ageType || "full_age",
      activityAreas: Array.isArray(basic.activityAreas) ? basic.activityAreas : [],
      preferredArea: basic.preferredArea || "",
      availableTimeSlots: normalizeTimeSlotLabels(basic.availableTimeSlots || []),
      height: basic.height || null,
      introduction: basic.introduction || "",
      maritalStatus: basic.maritalStatus || "",
    },
    identity: {
      jobCategory: identity.jobCategory || "",
      organizationName: organizationVisible ? identity.organizationName || "" : "",
      representativePhoto: mapPhoto(identity.representativePhoto),
      additionalPhotos: Array.isArray(identity.additionalPhotos)
        ? identity.additionalPhotos.map(mapPhoto).filter(Boolean)
        : [],
      verificationDocument: null,
    },
    matchingPreferences: {
      marriagePlan: matchingPreferences.marriagePlan || "",
      childrenPlan: matchingPreferences.childrenPlan || "",
      religion: matchingPreferences.religion || "",
      religionPreference: matchingPreferences.religionPreference || "",
      smoking: matchingPreferences.smoking || "",
      smokingPreference: matchingPreferences.smokingPreference || "",
      drinkingFrequency: matchingPreferences.drinkingFrequency || "",
    },
    disclosure: {
      proposalPhotosVisible: true,
      originalPhotoRedacted: false,
      organizationRedacted: !organizationVisible,
      sanitizedForDashboard: true,
      source: "matched_candidate_clear_v1",
    },
  };
}

function buildCandidatePreviewForViewerFromMatch(match = {}, viewerApplicationId = "") {
  const previews = match?.candidatePreviews || match?.candidatePreviewByApplicationId || {};
  const preview = previews?.[viewerApplicationId] || null;

  if (!preview?.id) return null;
  return preview;
}

function hasClearProposalPhotos(candidate = {}) {
  const representativePhoto = candidate?.identity?.representativePhoto || null;
  if (!representativePhoto?.url) return false;

  return (
    representativePhoto?.proposalVisible === true ||
    candidate?.disclosure?.proposalPhotosVisible === true ||
    candidate?.disclosure?.source === "matched_candidate_clear_v1"
  );
}

async function loadClearMatchedCandidateFromFunction({ viewerApplication = {}, match = {} }) {
  const viewerApplicationId = String(viewerApplication?.id || "").trim();
  const matchId = String(match?.id || "").trim();
  if (!viewerApplicationId || !matchId) return null;

  try {
    await ensureAuth();
    const functions = getFunctions(undefined, "asia-northeast3");
    const callable = httpsCallable(functions, "getTwoWeeksMatchedCandidateProfile");
    const result = await callable({ viewerApplicationId, matchId });
    return result?.data?.candidate || null;
  } catch (error) {
    console.warn(
      "[TwoWeeksProposal] clear matched candidate load skipped:",
      error?.code || error?.message || error
    );
    return null;
  }
}

async function getMatchesForApplication(applicationId = "") {
  if (!applicationId) return [];

  const results = new Map();

  const run = async (fieldPath) => {
    try {
      const snap = await getDocs(
        query(collection(db, "twoweeksMatches"), where(fieldPath, "==", applicationId))
      );

      snap.docs.forEach((item) => results.set(item.id, mapDoc(item)));
    } catch (error) {
      console.warn(`[TwoWeeksProposal] match lookup skipped: ${fieldPath}`, error?.code || error?.message || error);
    }
  };

  await run("maleApplicationId");
  await run("femaleApplicationId");

  return Array.from(results.values());
}

async function findBestMatchByPair(viewerApplicationId = "", candidateApplicationId = "") {
  const matches = await getMatchesForApplication(viewerApplicationId);
  return pickBestDashboardMatch(
    matches.filter((match) => isSamePairMatch(match, viewerApplicationId, candidateApplicationId))
  );
}

async function loadMatchCandidateFromMatch(viewerApplication = {}, match = {}, allApplications = []) {
  if (!viewerApplication?.id || !match?.id) return null;

  const candidateApplicationId = getCounterpartApplicationIdFromMatch(match, viewerApplication.id);
  if (!candidateApplicationId) return null;

  const viewerResponse = await getResponseDoc(viewerApplication.id, candidateApplicationId);
  const counterpartResponse = await getResponseDoc(candidateApplicationId, viewerApplication.id);
  const scheduleStatus = String(match?.scheduleStatus || match?.schedule?.status || "");
  const bothAccepted =
    viewerResponse?.response === "accepted" ||
    counterpartResponse?.response === "accepted" ||
    match?.status === "mutualAccepted" ||
    match?.status === "confirmed" ||
    scheduleStatus === "confirmed" ||
    Boolean(match?.finalMeeting);

  const photoRevealed = isPhotoRevealedForMatch(match);
  const organizationVisible = isOrganizationVisibleForMatch(match, bothAccepted);
  const matchPreview = buildCandidatePreviewForViewerFromMatch(match, viewerApplication.id);
  let candidate = matchPreview;

  // 신규 매칭은 match.candidatePreviews에 선명한 사진만 저장한다.
  // 기존 매칭에 흐림 프리뷰가 남아 있으면 서버 함수가 참여자와 접근 토큰을 검증한 뒤
  // 민감정보를 제외한 선명한 후보 프로필만 반환하고, 해당 매칭 스냅샷도 clear_v1로 갱신한다.
  if (!hasClearProposalPhotos(candidate) || (organizationVisible && !candidate?.identity?.organizationName)) {
    const clearCandidate = await loadClearMatchedCandidateFromFunction({ viewerApplication, match });
    if (clearCandidate?.id) candidate = clearCandidate;
  }

  if (!candidate) {
    candidate = sanitizeCandidateApplicationForViewer(
      {
        id: candidateApplicationId,
        basic: {},
        identity: {
          representativePhoto: { originalMissing: true },
          additionalPhotos: [],
        },
      },
      { photoRevealed, organizationVisible }
    );
  }

  if (!candidate) return null;

  return {
    candidate,
    score: match?.matchingCompatibility || { total: match?.scoreTotal || 0, complete: false, reasons: [] },
    source: hasClearProposalPhotos(candidate) ? "match_clear_preview" : "match_preview_missing",
    matchId: match.id,
    match,
    schedule: match?.schedule || {},
    finalMeeting: match?.finalMeeting || match?.schedule?.finalMeeting || null,
    photoRevealStatus: photoRevealed ? "revealed" : match?.photoRevealStatus || "hidden",
    viewerResponse,
    counterpartResponse,
    bothAccepted,
  };
}

async function loadHistoricalMatchForDashboard(viewerApplication = {}, match = {}) {
  if (!viewerApplication?.id || !match?.id) return null;

  const candidateApplicationId = getCounterpartApplicationIdFromMatch(match, viewerApplication.id);
  if (!candidateApplicationId) return null;

  const [viewerResponse, counterpartResponse] = await Promise.all([
    getResponseDoc(viewerApplication.id, candidateApplicationId),
    getResponseDoc(candidateApplicationId, viewerApplication.id),
  ]);

  // 종료 이력은 결과 탭에 필요한 매칭/일정/응답만 반환한다.
  // 과거 후보 프로필을 현재 대상후보처럼 다시 브라우저에 적재하지 않는다.
  return {
    candidate: null,
    score: match?.matchingCompatibility || { total: match?.scoreTotal || 0, complete: false, reasons: [] },
    source: "match_history",
    matchId: match.id,
    match,
    schedule: match?.schedule || {},
    finalMeeting: match?.finalMeeting || match?.schedule?.finalMeeting || null,
    photoRevealStatus: "hidden",
    viewerResponse,
    counterpartResponse,
    bothAccepted: false,
  };
}

async function loadLatestMatchForApplication(viewerApplication = {}, allApplications = []) {
  if (!viewerApplication?.id) return null;

  const lastCompletedMatchId = String(viewerApplication?.lastCompletedMatchId || "").trim();
  if (lastCompletedMatchId) {
    const lastCompletedMatch = await getMatchDoc(lastCompletedMatchId);
    const historicalMatch = await loadHistoricalMatchForDashboard(viewerApplication, lastCompletedMatch);
    if (historicalMatch) return historicalMatch;
  }

  const matches = await getMatchesForApplication(viewerApplication.id);
  const match = pickBestDashboardMatch(matches);

  return loadHistoricalMatchForDashboard(viewerApplication, match);
}

function isDashboardAccessRevoked(application = {}) {
  return application?.dashboardAccess?.revoked === true || application?.access?.revoked === true;
}


function getTimeValue(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function hasCurrentProposal(application = {}) {
  return Boolean(
    application?.currentProposal?.candidateApplicationId &&
    application?.currentProposal?.matchId
  );
}

function getCurrentProposalTime(application = {}) {
  const proposal = application?.currentProposal || {};

  return Math.max(
    getTimeValue(proposal.createdAtClient),
    getTimeValue(proposal.createdAt),
    getTimeValue(proposal.notificationUpdatedAt),
    getTimeValue(application.updatedAt),
    getApplicationTimeValue(application)
  );
}

function getDashboardApplicationRank(application = {}) {
  const status = String(application?.matchingStatus || "");
  const response = String(application?.currentProposal?.response || "");
  const proposalStatus = String(application?.currentProposal?.status || "");
  const scheduleStatus = String(application?.scheduleStatus || application?.schedule?.status || "");
  const photoRevealStatus = String(application?.photoRevealStatus || application?.currentProposal?.photoRevealStatus || "");

  const hasProposal = hasCurrentProposal(application);

  if (
    hasProposal &&
    (
      status === "confirmed" ||
      scheduleStatus === "confirmed" ||
      photoRevealStatus === "revealed" ||
      Boolean(application?.schedule?.finalMeeting)
    )
  ) {
    return 7000;
  }

  if (hasProposal && ["accepted", "mutualAccepted"].includes(status)) {
    return 6000;
  }

  if (hasProposal && ["waiting_counterpart", "needs_final_choice", "place_pending", "ready"].includes(scheduleStatus)) {
    return 5500;
  }

  if (hasProposal && ["proposed", "pending"].includes(response)) {
    return 5000;
  }

  if (hasProposal && status === "proposed") {
    return 4500;
  }

  if (hasProposal && proposalStatus === "proposed") {
    return 3500;
  }

  if (application?.reviewStatus === "approved" && application?.deposit?.status === "confirmed") {
    return 2000;
  }

  if (application?.reviewStatus === "approved") {
    return 1000;
  }

  return 0;
}


function pickDashboardApplication(applications = [], preferredApplicationId = "") {
  const rows = Array.isArray(applications) ? applications.filter((item) => item?.id) : [];

  if (!rows.length) return null;

  const preferred = preferredApplicationId
    ? rows.find((item) => item.id === preferredApplicationId)
    : null;

  if (preferred) return preferred;

  return [...rows].sort((a, b) => {
    const rankDiff = getDashboardApplicationRank(b) - getDashboardApplicationRank(a);
    if (rankDiff) return rankDiff;

    const proposalTimeDiff = getCurrentProposalTime(b) - getCurrentProposalTime(a);
    if (proposalTimeDiff) return proposalTimeDiff;

    return getApplicationTimeValue(b) - getApplicationTimeValue(a);
  })[0] || null;
}


async function loadCurrentProposalCandidate(viewerApplication = {}, allApplications = []) {
  const candidateApplicationId =
    viewerApplication?.currentProposal?.candidateApplicationId ||
    viewerApplication?.currentProposal?.candidateId ||
    viewerApplication?.proposal?.candidateApplicationId ||
    "";

  if (!candidateApplicationId) return null;

  const currentProposalMatchId = viewerApplication?.currentProposal?.matchId || "";
  let match = await getMatchDoc(currentProposalMatchId);

  // 신청자 문서의 currentProposal.matchId가 비어 있거나 오래된 경우,
  // 실제 twoweeksMatches 이력에서 같은 남녀 조합의 최신 매칭을 다시 찾는다.
  if (!match || (!match?.schedule && !match?.finalMeeting && !match?.status)) {
    const pairMatch = await findBestMatchByPair(viewerApplication.id, candidateApplicationId);
    if (pairMatch) match = pairMatch;
  }

  if (match?.id) {
    return loadMatchCandidateFromMatch(viewerApplication, match, allApplications);
  }

  // match 문서가 없는 레거시 데이터는 참여자 검증을 할 수 없어 안전한 placeholder만 반환한다.
  const safeCandidate = sanitizeCandidateApplicationForViewer(
    {
      id: candidateApplicationId,
      basic: {},
      identity: {
        representativePhoto: { securePreviewMissing: true },
        additionalPhotos: [],
      },
    },
    { photoRevealed: false, organizationVisible: false }
  );

  const viewerResponse = await getResponseDoc(viewerApplication.id, candidateApplicationId);
  const counterpartResponse = await getResponseDoc(candidateApplicationId, viewerApplication.id);
  const bothAccepted = viewerResponse?.response === "accepted" || counterpartResponse?.response === "accepted";

  return {
    candidate: safeCandidate,
    score: { total: 0 },
    source: "legacy_secure_placeholder",
    matchId: currentProposalMatchId,
    match,
    schedule: {},
    finalMeeting: null,
    photoRevealStatus: "hidden",
    viewerResponse,
    counterpartResponse,
    bothAccepted,
  };
}
async function loadRoundAndBestMatch(viewerApplication) {
  if (!viewerApplication?.id) {
    return {
      viewerApplication: null,
      allApplications: [],
      bestMatch: null,
    };
  }

  let freshViewerApplication = viewerApplication;

  try {
    const viewerSnap = await getDoc(doc(db, "twoweeksApplications", viewerApplication.id));
    if (viewerSnap.exists()) {
      freshViewerApplication = mapDoc(viewerSnap);
    }
  } catch (error) {
    console.warn("[TwoWeeksProposal] viewer refresh failed:", error?.code || error?.message || error);
  }

  // 보안상 고객 화면에서는 같은 회차의 전체 신청자 목록을 읽지 않는다.
  // 운영자가 생성한 match 문서의 candidatePreviews 또는 확정 후 개별 후보 문서만 사용한다.
  const allApplications = [];
  const currentProposalMatch = await loadCurrentProposalCandidate(freshViewerApplication, allApplications);
  const latestMatch = currentProposalMatch || (await loadLatestMatchForApplication(freshViewerApplication, allApplications));

  return {
    viewerApplication: freshViewerApplication,
    allApplications: [],
    bestMatch: latestMatch,
  };
}

export async function sendDashboardLookupCode(phone) {
  const phoneNormalized = normalizePhone(phone);

  if (!phoneNormalized || phoneNormalized.length < 10) {
    return {
      ok: false,
      code: "INVALID_PHONE",
      message: "휴대폰 번호를 확인해주세요.",
    };
  }

  try {
    // request callable 자체는 비로그인도 가능하지만, 현재 앱은 Firebase Auth 세션을
    // 먼저 준비해두어 App/사용자 단위 추적이 가능하도록 한다.
    await ensureAuth();

    const functions = getFunctions(undefined, "asia-northeast3");
    const callable = httpsCallable(functions, "requestTwoWeeksDashboardOtp");
    const result = await callable({ phone: phoneNormalized });
    const data = result?.data || {};

    return {
      ok: data?.ok === true,
      phoneNormalized,
      challengeId: data?.challengeId || "",
      expiresAt: Number(data?.expiresAt || 0),
      testMode: data?.testMode === true,
      sentAtClient: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[TwoWeeksProposal] lookup code failed:", error?.code || error?.message || error);

    const rawMessage = String(error?.message || "");
    const message =
      rawMessage.includes("신청내역")
        ? "신청내역을 확인할 수 없습니다."
        : rawMessage.includes("1분")
          ? "인증번호는 1분 후 다시 요청할 수 있습니다."
          : rawMessage.includes("횟수") || rawMessage.includes("너무 많")
            ? "인증번호 요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
            : "인증번호를 보내지 못했습니다. 잠시 후 다시 시도해주세요.";

    return {
      ok: false,
      code: "SMS_OR_LOOKUP_FAILED",
      message,
    };
  }
}

export async function verifyDashboardLookupCode({
  phone,
  code,
  challengeId,
  preferredApplicationId = "",
}) {
  const phoneNormalized = normalizePhone(phone);
  const cleanCode = String(code || "").replace(/[^0-9]/g, "");
  const cleanChallengeId = String(challengeId || "").trim();

  if (!phoneNormalized || cleanCode.length !== 6 || !cleanChallengeId) {
    throw new Error("인증번호 정보를 확인해주세요.");
  }

  try {
    await ensureAuth();

    const functions = getFunctions(undefined, "asia-northeast3");
    const callable = httpsCallable(functions, "verifyTwoWeeksDashboardOtp");
    const result = await callable({
      phone: phoneNormalized,
      code: cleanCode,
      challengeId: cleanChallengeId,
      preferredApplicationId: String(preferredApplicationId || "").trim(),
    });
    const data = result?.data || {};

    if (!data?.applicationId || (data?.sessionAuthorized !== true && !data?.customToken)) {
      return {
        ok: false,
        code: "SESSION_CREATE_FAILED",
        message: "신청현황 인증 세션을 만들지 못했습니다. 인증번호를 다시 요청해주세요.",
      };
    }

    // 이전 배포 버전이 customToken을 반환해도 호환하고,
    // 최신 버전은 현재 anonymous auth UID에 서버 세션만 연결한다.
    if (data?.customToken) {
      await signInWithCustomToken(auth, data.customToken);
    }

    return {
      ok: true,
      applicationId: data.applicationId,
      phone: normalizePhone(data.phone || phoneNormalized),
      name: data.name || "",
      sessionExpiresAt: Number(data.sessionExpiresAt || 0),
    };
  } catch (error) {
    const code = String(error?.code || "");
    const raw = String(error?.message || "");
    console.warn("[TwoWeeksProposal] lookup verify failed:", code || raw || error);

    let message = "인증번호 확인 중 오류가 발생했습니다. 인증번호를 다시 요청해주세요.";
    let nextCode = "VERIFY_FAILED";
    if (raw.includes("만료") || code.includes("deadline-exceeded")) {
      message = "인증번호가 만료되었습니다. 다시 요청해주세요.";
      nextCode = "OTP_EXPIRED";
    } else if (raw.includes("횟수") || code.includes("resource-exhausted")) {
      message = "인증번호 입력 횟수를 초과했습니다. 다시 요청해주세요.";
      nextCode = "OTP_ATTEMPTS_EXCEEDED";
    } else if (raw.includes("일치") || code.includes("permission-denied")) {
      message = "인증번호가 일치하지 않습니다.";
      nextCode = "OTP_MISMATCH";
    } else if (raw.includes("이미 사용") || code.includes("failed-precondition")) {
      message = "이미 사용했거나 만료된 인증번호입니다. 다시 요청해주세요.";
      nextCode = "OTP_CONSUMED";
    }

    return { ok: false, code: nextCode, message };
  }
}

async function loadOwnedApplicationById(applicationId = "") {
  const cleanApplicationId = String(applicationId || "").trim();
  if (!cleanApplicationId) {
    throw new Error("신청 정보를 확인할 수 없습니다.");
  }

  if (typeof auth.authStateReady === "function") {
    await auth.authStateReady();
  }

  if (!auth.currentUser) {
    throw new Error("신청현황 인증 세션이 만료되었습니다.");
  }

  const applicationRef = doc(db, "twoweeksApplications", cleanApplicationId);
  const snap = await getDoc(applicationRef);

  if (!snap.exists()) {
    throw new Error("신청 정보를 찾지 못했습니다.");
  }

  return mapDoc(snap);
}

export async function loadApplicationByAccessToken({ applicationId, token }) {
  const cleanApplicationId = String(applicationId || "").trim();
  const cleanToken = String(token || "").trim();

  if (!cleanApplicationId || !cleanToken) {
    throw new Error("신청현황 링크 정보가 올바르지 않습니다.");
  }

  try {
    await ensureAuth();

    const functions = getFunctions(undefined, "asia-northeast3");
    const callable = httpsCallable(functions, "authenticateTwoWeeksDashboardLink");
    const result = await callable({
      applicationId: cleanApplicationId,
      token: cleanToken,
    });
    const data = result?.data || {};

    if (!data?.applicationId || (data?.sessionAuthorized !== true && !data?.customToken)) {
      throw new Error("신청현황 인증 세션을 만들지 못했습니다.");
    }

    // 이전 customToken 방식도 호환하지만 최신 버전은 현재 Firebase Auth UID에
    // 서버가 7일짜리 dashboard session을 연결한다.
    if (data?.customToken) {
      await signInWithCustomToken(auth, data.customToken);
    }

    const viewerApplication = await loadOwnedApplicationById(data.applicationId);
    return loadRoundAndBestMatch(viewerApplication);
  } catch (error) {
    const code = String(error?.code || "");
    const message = String(error?.message || "");
    const expectedAuthFailure =
      code.includes("permission-denied") ||
      code.includes("not-found") ||
      code.includes("invalid-argument") ||
      code.includes("failed-precondition") ||
      message.includes("만료") ||
      message.includes("올바르지");

    if (expectedAuthFailure) {
      console.warn("[TwoWeeksProposal] magic link requires re-authentication:", code || message);
      return {
        authRequired: true,
        reason: "magic_link_reauth",
        applicationId: cleanApplicationId,
      };
    }

    console.error("[TwoWeeksProposal] magic link authentication failed:", code || message || error);
    throw new Error("신청현황을 불러오는 중 오류가 발생했습니다. 휴대폰 번호 인증으로 다시 확인해주세요.");
  }
}

export async function completeDashboardIdentityUpgrade({ applicationId, identityVerificationId }) {
  const cleanApplicationId = String(applicationId || "").trim();
  const cleanVerificationId = String(identityVerificationId || "").trim();
  if (!cleanApplicationId || !cleanVerificationId) {
    throw new Error("본인인증 완료 정보를 확인할 수 없습니다.");
  }

  try {
    const functions = getFunctions(undefined, "asia-northeast3");
    const callable = httpsCallable(functions, "completeTwoWeeksDashboardIdentity");
    const result = await callable({
      applicationId: cleanApplicationId,
      identityVerificationId: cleanVerificationId,
    });
    return result?.data || {};
  } catch (error) {
    console.error("[TwoWeeksProposal] identity upgrade completion failed:", error?.code || error?.message || error);
    const raw = String(error?.message || "");
    if (raw.includes("일치")) throw new Error("기존 신청정보와 본인인증 정보가 일치하지 않습니다. 관리자에게 문의해주세요.");
    if (raw.includes("만료")) throw new Error("본인인증 확인정보가 만료되었습니다. 다시 본인인증해주세요.");
    throw new Error("본인인증 정보를 기존 신청내역에 반영하지 못했습니다. 다시 시도해주세요.");
  }
}

export async function loadApplicationByVerifiedPhone(phone, options = {}) {
  // 서버 OTP 검증 후 custom auth가 발급되므로 더 이상 고객 브라우저에서
  // 전화번호로 전체 신청서 컬렉션을 query하지 않는다.
  const applicationId = String(options?.preferredApplicationId || "").trim();
  if (!applicationId) {
    throw new Error("신청현황 인증 세션이 만료되었습니다. 휴대폰 번호로 다시 인증해주세요.");
  }

  const viewerApplication = await loadOwnedApplicationById(applicationId);
  const verifiedPhone = normalizePhone(phone);
  const applicationPhone = normalizePhone(
    viewerApplication?.basic?.phoneNormalized ||
      viewerApplication?.basic?.phone ||
      viewerApplication?.phoneIdentityVerification?.phone ||
      ""
  );

  if (verifiedPhone && applicationPhone && verifiedPhone !== applicationPhone) {
    throw new Error("인증된 연락처와 신청 정보가 일치하지 않습니다.");
  }

  return loadRoundAndBestMatch(viewerApplication);
}


export async function saveProposalResponse({ viewerApplication, candidateApplication, response, declineReason = null }) {
  await ensureAuth();
  if (!viewerApplication?.id || !candidateApplication?.id || !viewerApplication?.currentProposal?.matchId) {
    throw new Error("응답을 저장할 현재 매칭 정보가 없습니다. 새로고침 후 다시 시도해주세요.");
  }
  if (!["accepted", "declined"].includes(response)) {
    throw new Error("응답값이 올바르지 않습니다.");
  }
  const normalizedDeclineReason = response === "declined" ? normalizeTwoWeeksDeclineReason(declineReason || {}) : null;
  if (response === "declined" && !normalizedDeclineReason?.valid) {
    throw new Error(normalizedDeclineReason?.message || "거절 사유를 선택해주세요.");
  }

  // 응답 기록과 보호된 신청서 상태 변경은 서버 트랜잭션에서 함께 처리합니다.
  // 기존 클라이언트의 'setDoc 성공 → updateDoc 권한 거부' 부분 저장을 방지합니다.
  const functions = getFunctions(undefined, "asia-northeast3");
  const submit = httpsCallable(functions, "respondTwoWeeksProposal");
  const matchId = viewerApplication.currentProposal.matchId;
  const payload = {
    viewerApplicationId: viewerApplication.id,
    candidateApplicationId: candidateApplication.id,
    matchId,
    response,
    ...(normalizedDeclineReason ? {
      declineReason: { code: normalizedDeclineReason.code, text: normalizedDeclineReason.text || "" },
    } : {}),
  };
  let result;
  try {
    const call = await submit(payload);
    result = call?.data;
    if (!result?.ok) throw new Error("응답 저장 결과를 확인하지 못했습니다.");
  } catch (error) {
    // 타임아웃 후 재시도를 허용합니다. 서버에서 중복 응답을 검증합니다.
    const raw = String(error?.message || "").replace(/^FirebaseError:\s*/i, "").trim();
    throw new Error(raw && !raw.includes("internal") ? raw : "응답 처리 결과를 확인하지 못했습니다. 새로고침 후 신청현황을 확인해주세요.");
  }

  let mutualAcceptedNotification = null;
  let declineNotification = null;
  if (response === "declined") {
    // 기존 서버의 거절 사유 기록·상대 알림·관리자 기록 절차를 그대로 사용합니다.
    declineNotification = await notifyProposalDeclined({
      matchId,
      declinedByApplicationId: viewerApplication.id,
      declineReason: { code: normalizedDeclineReason.code, text: normalizedDeclineReason.text || "" },
    });
  }
  if (result.bothAccepted) {
    // 기존 서버의 일정 24시간 정책 초기화/문자·관리자 안내를 그대로 재사용합니다.
    // 발송 실패가 이미 저장된 수락 응답을 취소하지는 않습니다.
    mutualAcceptedNotification = await notifyMutualAcceptedSchedule({
      matchId,
      viewerApplicationId: viewerApplication.id,
    });
  }
  return {
    responseId: `${viewerApplication.id}_${candidateApplication.id}`,
    bothAccepted: result.bothAccepted === true,
    matchId,
    responseOrder: result.responseOrder,
    alreadySubmitted: result.alreadySubmitted === true,
    mutualAcceptedNotification,
    declineNotification,
  };
}

function formatMeetingTimeText(timeChoice = {}) {
  return [timeChoice.dateLabel, timeChoice.timeLabel].filter(Boolean).join(" ") || "-";
}

function formatMeetingPlaceText(placeChoice = {}) {
  return [placeChoice.area, placeChoice.cafeName || placeChoice.placeName].filter(Boolean).join(" / ") || "-";
}

function buildAutoFinalMeeting({ finalChoice = {}, timeChoice = {}, placeChoice = {}, selectedByApplicationId = "" }) {
  const confirmedAtClient = new Date().toISOString();

  return {
    ...finalChoice,
    ...timeChoice,
    ...placeChoice,
    timeChoice,
    placeChoice,
    finalTimeChoice: timeChoice,
    finalPlaceChoice: placeChoice,
    placeName: placeChoice.cafeName || placeChoice.placeName || "",
    address: placeChoice.address || "",
    mapUrl: placeChoice.cafeMapUrl || placeChoice.mapUrl || "",
    cafeMapUrl: placeChoice.cafeMapUrl || placeChoice.mapUrl || "",
    memo: "카페에서 60분 정도 가볍게 대화해주세요.",
    paymentNote: "음료 등 개인 주문 비용은 각자 부담입니다.",
    meetingGuide: "만남 전 한마디에 복장이나 기다리는 위치를 남겨두면 서로를 찾기 쉽습니다.",
    selectedByApplicationId,
    confirmedAtClient,
    confirmedBy: "auto",
  };
}

function truncateText(value = "", max = 80) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.length > max ? `${clean.slice(0, max)}...` : clean;
}

function buildCounterpartNoteLine(note = "") {
  const preview = truncateText(note, 80);
  return preview ? `상대 한마디: ${preview}` : "상대 한마디는 아직 없습니다.";
}

function buildFinalMeetingSmsLines(finalMeeting = {}, options = {}) {
  const timeText = formatMeetingTimeText(finalMeeting.finalTimeChoice || finalMeeting.timeChoice || finalMeeting);
  const placeText = formatMeetingPlaceText(finalMeeting.finalPlaceChoice || finalMeeting.placeChoice || finalMeeting);

  return [
    `일시: ${timeText}`,
    `장소: ${placeText}`,
    finalMeeting.mapUrl ? `지도: ${finalMeeting.mapUrl}` : "",
    buildCounterpartNoteLine(options.counterpartNote),
    "상대 사진과 자세한 안내는 신청현황에서 확인해주세요.",
    "개인 주문 비용은 각자 부담입니다.",
  ].filter(Boolean);
}

function buildMeetingReadySmsLines(finalMeeting = {}) {
  const timeText = formatMeetingTimeText(finalMeeting.finalTimeChoice || finalMeeting.timeChoice || finalMeeting);
  const placeText = formatMeetingPlaceText(finalMeeting.finalPlaceChoice || finalMeeting.placeChoice || finalMeeting);

  return [
    `일시: ${timeText}`,
    `장소: ${placeText}`,
    finalMeeting.mapUrl ? `지도: ${finalMeeting.mapUrl}` : "",
    "신청현황에서 상대 프로필을 확인하고 참석 확인을 눌러주세요.",
    "복장이나 기다리는 위치는 만남 전 한마디에 남겨주세요.",
  ].filter(Boolean);
}

function getApplicationDisplayName(application = {}) {
  const basic = application.basic || {};
  return basic.nickname || basic.name || "상대";
}

function normalizeTimeChoices(value = []) {
  return Array.isArray(value)
    ? value
        .filter((item) => item?.id)
        .slice(0, 3)
        .map((item) => ({
          id: item.id,
          dateKey: item.dateKey || "",
          dateLabel: item.dateLabel || "",
          dayLabel: item.dayLabel || "",
          timeSlotKey: item.timeSlotKey || "",
          timeLabel: item.timeLabel || "",
          startAtClient: item.startAtClient || "",
        }))
    : [];
}

function normalizePlaceChoices(value = []) {
  return Array.isArray(value)
    ? value
        .filter((item) => item?.placeId || item?.cafeId || item?.id)
        .slice(0, 3)
        .map((item) => ({
          id: item.placeId || item.cafeId || item.id,
          placeId: item.placeId || item.cafeId || item.id,
          area: item.area || "",
          cafeId: item.cafeId || item.placeId || item.id || "",
          cafeName: item.cafeName || item.name || "",
          cafeStation: item.cafeStation || item.station || "",
          cafeRatingLabel: item.cafeRatingLabel || item.ratingLabel || "",
          cafeReason: item.cafeReason || item.reason || "",
          cafeMapQuery: item.cafeMapQuery || item.mapQuery || "",
          cafeMapUrl: item.cafeMapUrl || item.mapUrl || "",
        }))
    : [];
}

function combineFinalChoice(timeChoice = {}, placeChoice = {}, selectedByApplicationId = "") {
  return {
    id: `${timeChoice.id || "time"}_${placeChoice.placeId || placeChoice.cafeId || placeChoice.id || "place"}`,
    ...timeChoice,
    area: placeChoice.area || "",
    placeId: placeChoice.placeId || placeChoice.cafeId || placeChoice.id || "",
    cafeId: placeChoice.cafeId || placeChoice.placeId || placeChoice.id || "",
    cafeName: placeChoice.cafeName || "",
    cafeStation: placeChoice.cafeStation || "",
    cafeRatingLabel: placeChoice.cafeRatingLabel || "",
    cafeReason: placeChoice.cafeReason || "",
    cafeMapQuery: placeChoice.cafeMapQuery || "",
    cafeMapUrl: placeChoice.cafeMapUrl || "",
    timeChoice,
    placeChoice,
    selectedByApplicationId,
    selectedAtClient: new Date().toISOString(),
  };
}

export async function saveScheduleChoices({
  viewerApplication,
  candidateApplication,
  choices = [],
}) {
  await ensureAuth();

  if (!viewerApplication?.id || !candidateApplication?.id) {
    throw new Error("일정 선택 정보를 확인할 수 없습니다.");
  }

  const matchId = viewerApplication?.currentProposal?.matchId || "";
  if (!matchId) throw new Error("매칭 정보를 찾지 못했습니다.");

  const source = Array.isArray(choices)
    ? {
        timeChoices: choices,
        placeChoices: choices,
      }
    : choices || {};

  const cleanTimeChoices = normalizeTimeChoices(source.timeChoices || source.times || []);
  const cleanPlaceChoices = normalizePlaceChoices(source.placeChoices || source.places || []);

  if (cleanTimeChoices.length !== 3 || cleanPlaceChoices.length !== 3) {
    throw new Error("일시 후보 3개와 장소 후보 3개를 선택해주세요.");
  }

  const matchRef = doc(db, "twoweeksMatches", matchId);
  const existingMatch = await getMatchDoc(matchId);

  if (existingMatch?.schedule?.firstSelectorApplicationId && existingMatch.schedule.firstSelectorApplicationId !== viewerApplication.id) {
    throw new Error("상대가 먼저 후보를 선택했습니다. 상대가 제안한 일시/장소 중 1개씩 선택해주세요.");
  }

  const counterpartDueAtClient = addDaysClient(SCHEDULE_DUE_DAYS);

  await setDoc(
    matchRef,
    {
      status: "mutualAccepted",
      scheduleStatus: "waiting_counterpart",
      schedule: {
        status: "waiting_counterpart",
        firstSelectorApplicationId: viewerApplication.id,
        counterpartApplicationId: candidateApplication.id,
        timeChoices: cleanTimeChoices,
        placeChoices: cleanPlaceChoices,
        firstChoices: cleanTimeChoices,
        firstSelectedAt: serverTimestamp(),
        firstSelectedAtClient: new Date().toISOString(),
        counterpartDueDays: SCHEDULE_DUE_DAYS,
        counterpartDueAtClient,
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await sendEventSms(candidateApplication, "일정 후보 도착", [
    "상대가 일시 3개와 장소 3개를 선택했습니다.",
    "2일 내 일시 1개와 장소 1개를 선택해주세요.",
  ]);

  return {
    matchId,
    timeChoices: cleanTimeChoices,
    placeChoices: cleanPlaceChoices,
  };
}

export async function saveScheduleFinalChoice({
  viewerApplication,
  candidateApplication,
  choice,
}) {
  await ensureAuth();

  if (!viewerApplication?.id || !candidateApplication?.id) {
    throw new Error("일정 선택 정보를 확인할 수 없습니다.");
  }

  const matchId = viewerApplication?.currentProposal?.matchId || "";
  if (!matchId) throw new Error("매칭 정보를 찾지 못했습니다.");

  const timeChoice = choice?.timeChoice || choice?.time || null;
  const placeChoice = choice?.placeChoice || choice?.place || null;

  if (!timeChoice?.id) {
    throw new Error("확정할 일시를 선택해주세요.");
  }

  if (!(placeChoice?.placeId || placeChoice?.cafeId || placeChoice?.id)) {
    throw new Error("확정할 장소를 선택해주세요.");
  }

  const cleanTimeChoice = normalizeTimeChoices([timeChoice])[0];
  const cleanPlaceChoice = normalizePlaceChoices([placeChoice])[0];
  const finalChoice = combineFinalChoice(cleanTimeChoice, cleanPlaceChoice, viewerApplication.id);
  const finalMeeting = buildAutoFinalMeeting({
    finalChoice,
    timeChoice: cleanTimeChoice,
    placeChoice: cleanPlaceChoice,
    selectedByApplicationId: viewerApplication.id,
  });

  const matchRef = doc(db, "twoweeksMatches", matchId);
  const matchSnap = await getDoc(matchRef);
  const matchData = matchSnap.exists() ? { id: matchSnap.id, ...matchSnap.data() } : {};
  const hadPreviousNote = Boolean(matchData?.preMeetingNotes?.[viewerApplication.id]?.note);

  await setDoc(
    matchRef,
    {
      status: "confirmed",
      scheduleStatus: "confirmed",
      photoRevealStatus: "revealed",
      finalMeeting,
      schedule: {
        status: "confirmed",
        finalTimeChoice: cleanTimeChoice,
        finalPlaceChoice: cleanPlaceChoice,
        finalChoice,
        selectedChoice: finalChoice,
        finalMeeting,
        finalSelectedAt: serverTimestamp(),
        finalSelectedAtClient: finalChoice.selectedAtClient,
        confirmedAt: serverTimestamp(),
        confirmedAtClient: finalMeeting.confirmedAtClient,
        confirmedBy: "auto",
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  const applicationPatch = {
    matchingStatus: "confirmed",
    photoRevealStatus: "revealed",
    "currentProposal.photoRevealStatus": "revealed",
    "schedule.status": "confirmed",
    "schedule.finalMeeting": finalMeeting,
    "schedule.confirmedAt": serverTimestamp(),
    "schedule.confirmedAtClient": finalMeeting.confirmedAtClient,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(db, "twoweeksApplications", viewerApplication.id), applicationPatch).catch(() => {});
  await updateDoc(doc(db, "twoweeksApplications", candidateApplication.id), applicationPatch).catch(() => {});

  const smsResults = {
    viewer: await sendEventSms(viewerApplication, "일시와 장소 안내", buildMeetingReadySmsLines(finalMeeting)),
    candidate: await sendEventSms(candidateApplication, "일시와 장소 안내", buildMeetingReadySmsLines(finalMeeting)),
  };

  await setDoc(
    matchRef,
    {
      meetingReadySms: smsResults,
      meetingReadySmsUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  ).catch(() => {});

  return {
    matchId,
    choice: finalChoice,
    timeChoice: cleanTimeChoice,
    placeChoice: cleanPlaceChoice,
    finalMeeting,
    smsResults,
  };
}

export async function saveMeetingAttendance({
  viewerApplication,
  candidateApplication,
  status = "attending",
}) {
  await ensureAuth();

  if (!viewerApplication?.id || !candidateApplication?.id) {
    throw new Error("참석 확인을 저장할 매칭 정보를 확인할 수 없습니다.");
  }

  const matchId = viewerApplication?.currentProposal?.matchId || "";
  if (!matchId) throw new Error("매칭 정보를 찾지 못했습니다.");

  const cleanStatus = status === "attending" ? "attending" : "attending";
  const payload = {
    applicationId: viewerApplication.id,
    displayName: getApplicationDisplayName(viewerApplication),
    status: cleanStatus,
    updatedAtClient: new Date().toISOString(),
  };

  const matchRef = doc(db, "twoweeksMatches", matchId);
  const matchSnap = await getDoc(matchRef);
  const matchData = matchSnap.exists() ? { id: matchSnap.id, ...matchSnap.data() } : {};
  const existingAttendance = matchData?.meetingAttendance || {};
  const nextAttendance = {
    ...existingAttendance,
    [viewerApplication.id]: payload,
  };

  const viewerConfirmed = nextAttendance?.[viewerApplication.id]?.status === "attending";
  const counterpartConfirmed = nextAttendance?.[candidateApplication.id]?.status === "attending";
  const bothConfirmed = viewerConfirmed && counterpartConfirmed;
  const finalMeeting = matchData?.finalMeeting || matchData?.schedule?.finalMeeting || viewerApplication?.schedule?.finalMeeting || {};

  await setDoc(
    matchRef,
    {
      meetingAttendance: {
        [viewerApplication.id]: payload,
      },
      attendanceStatus: bothConfirmed ? "both_confirmed" : "waiting_counterpart",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await updateDoc(doc(db, "twoweeksApplications", viewerApplication.id), {
    "schedule.attendanceStatus": cleanStatus,
    "schedule.attendanceConfirmedAt": serverTimestamp(),
    "schedule.attendanceConfirmedAtClient": payload.updatedAtClient,
    updatedAt: serverTimestamp(),
  }).catch(() => {});

  const selfResult = await sendEventSms(viewerApplication, "만남 확정 완료", [
    bothConfirmed
      ? "상대방도 확정했습니다. 최종 만남 안내를 보내드립니다."
      : "상대방도 확정하면 최종 만남 안내가 발송됩니다.",
    "복장이나 기다리는 위치는 만남 전 한마디에 남겨주세요.",
  ]);

  const counterpartResult = await sendEventSms(candidateApplication, "상대방 만남 확정", [
    `${payload.displayName}님이 만남을 확정했습니다.`,
    bothConfirmed
      ? "양쪽 모두 확정했습니다. 최종 만남 안내를 보내드립니다."
      : "신청현황에서 참석 확인을 눌러주세요.",
  ]);

  let finalGuideSms = null;

  if (bothConfirmed && !matchData?.finalAttendanceGuideSms?.sentAtClient) {
    const preMeetingNotes = matchData?.preMeetingNotes || {};

    finalGuideSms = {
      viewer: await sendEventSms(
        viewerApplication,
        "최종 만남 안내",
        buildFinalMeetingSmsLines(finalMeeting, {
          counterpartNote: preMeetingNotes?.[candidateApplication.id]?.note || "",
        })
      ),
      candidate: await sendEventSms(
        candidateApplication,
        "최종 만남 안내",
        buildFinalMeetingSmsLines(finalMeeting, {
          counterpartNote: preMeetingNotes?.[viewerApplication.id]?.note || "",
        })
      ),
      sentAtClient: new Date().toISOString(),
    };
  }

  await setDoc(
    matchRef,
    {
      meetingAttendanceSms: {
        [viewerApplication.id]: {
          self: selfResult,
          counterpart: counterpartResult,
          sentAtClient: new Date().toISOString(),
        },
      },
      ...(finalGuideSms
        ? {
            finalAttendanceGuideSms: finalGuideSms,
          }
        : {}),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  ).catch(() => {});

  return {
    matchId,
    attendance: payload,
    bothConfirmed,
    smsResult: counterpartResult,
    selfSmsResult: selfResult,
    finalGuideSms,
  };
}

export async function sendMissingArrivalAlert({
  viewerApplication,
  candidateApplication,
}) {
  await ensureAuth();

  if (!viewerApplication?.id || !candidateApplication?.id) {
    throw new Error("도착 확인 요청에 필요한 만남 정보를 확인할 수 없습니다.");
  }

  const matchId = viewerApplication?.currentProposal?.matchId || "";
  if (!matchId) throw new Error("매칭 정보를 찾지 못했습니다.");

  try {
    const functions = getFunctions(undefined, "asia-northeast3");
    const callable = httpsCallable(functions, "sendTwoWeeksMissingArrivalAlert");
    const result = await callable({
      matchId,
      reporterApplicationId: viewerApplication.id,
    });

    return result?.data || { status: "sent", sent: true };
  } catch (error) {
    console.error("[TwoWeeksProposal] missing arrival alert failed:", error);

    const message =
      error?.details?.message ||
      error?.message ||
      "상대방에게 안내하는 중 오류가 발생했습니다.";

    throw new Error(message.replace(/^FirebaseError:\s*/i, ""));
  }
}


export async function saveMeetingArrival({
  viewerApplication,
  candidateApplication,
  status = "arrived",
}) {
  await ensureAuth();

  if (!viewerApplication?.id || !candidateApplication?.id) {
    throw new Error("도착 확인을 저장할 매칭 정보를 확인할 수 없습니다.");
  }

  const matchId = viewerApplication?.currentProposal?.matchId || "";
  if (!matchId) throw new Error("매칭 정보를 찾지 못했습니다.");

  const arrivedAtClient = new Date().toISOString();
  const matchRef = doc(db, "twoweeksMatches", matchId);
  const matchSnap = await getDoc(matchRef);
  const matchData = matchSnap.exists() ? { id: matchSnap.id, ...matchSnap.data() } : {};
  assertMeetingDay(matchData);
  const preMeetingNotes = matchData?.preMeetingNotes || {};
  const myPreMeetingNote = preMeetingNotes?.[viewerApplication.id]?.note || "";
  const existingArrival = matchData?.meetingArrival || {};
  const existingMyArrival = existingArrival?.[viewerApplication.id] || null;

  if (existingMyArrival?.status === "arrived") {
    return {
      matchId,
      arrival: existingMyArrival,
      bothArrived:
        existingArrival?.[candidateApplication.id]?.status === "arrived",
      alreadyConfirmed: true,
    };
  }

  const payload = {
    applicationId: viewerApplication.id,
    displayName: getApplicationDisplayName(viewerApplication),
    status: status === "arrived" ? "arrived" : "arrived",
    preMeetingNoteSnapshot: truncateText(myPreMeetingNote, 120),
    arrivedAtClient,
    updatedAtClient: arrivedAtClient,
  };

  const nextArrival = {
    ...existingArrival,
    [viewerApplication.id]: payload,
  };

  const viewerArrived = nextArrival?.[viewerApplication.id]?.status === "arrived";
  const counterpartArrived = nextArrival?.[candidateApplication.id]?.status === "arrived";
  const bothArrived = viewerArrived && counterpartArrived;

  await setDoc(
    matchRef,
    {
      meetingArrival: {
        [viewerApplication.id]: payload,
      },
      arrivalStatus: bothArrived ? "both_arrived" : "waiting_counterpart",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await updateDoc(doc(db, "twoweeksApplications", viewerApplication.id), {
    "schedule.arrivalStatus": "arrived",
    "schedule.arrivedAt": serverTimestamp(),
    "schedule.arrivedAtClient": arrivedAtClient,
    updatedAt: serverTimestamp(),
  }).catch(() => {});

  let counterpartResult = { status: "skipped", reason: "NOT_SENT" };

  try {
    const functions = getFunctions(undefined, "asia-northeast3");
    const callable = httpsCallable(functions, "sendTwoWeeksArrivalConfirmation");
    const result = await callable({
      matchId,
      reporterApplicationId: viewerApplication.id,
    });
    counterpartResult = result?.data || { status: "sent", sent: true };
  } catch (error) {
    console.warn(
      "[TwoWeeksProposal] arrival confirmation sms skipped:",
      error?.code || error?.message || error
    );
    counterpartResult = {
      status: "failed",
      errorMessage: error?.message || String(error),
    };
  }

  return {
    matchId,
    arrival: payload,
    bothArrived,
    smsResult: counterpartResult,
  };
}

export async function saveMeetingProofPhoto({
  viewerApplication,
  candidateApplication,
  file,
  onProgress,
}) {
  await ensureAuth();

  if (!viewerApplication?.id || !candidateApplication?.id) {
    throw new Error("현장 인증을 저장할 매칭 정보를 확인할 수 없습니다.");
  }

  if (!file) {
    throw new Error("업로드할 현장 사진을 선택해주세요.");
  }

  if (!String(file.type || "").startsWith("image/")) {
    throw new Error("이미지 파일만 업로드할 수 있습니다.");
  }

  if (Number(file.size || 0) > 10 * 1024 * 1024) {
    throw new Error("현장 사진은 10MB 이하로 업로드해주세요.");
  }

  const matchId = viewerApplication?.currentProposal?.matchId || "";
  if (!matchId) throw new Error("매칭 정보를 찾지 못했습니다.");

  const matchRef = doc(db, "twoweeksMatches", matchId);
  const matchSnap = await getDoc(matchRef);
  const matchData = matchSnap.exists() ? { id: matchSnap.id, ...matchSnap.data() } : {};
  assertMeetingDay(matchData);

  const uploadedFile = await uploadMeetingProofFile({
    viewerApplication,
    matchId,
    file,
    onProgress,
  });

  const uploadedAtClient = new Date().toISOString();
  const proofPayload = {
    applicationId: viewerApplication.id,
    displayName: getApplicationDisplayName(viewerApplication),
    type: "seat_photo",
    purpose: "counterpart_location_and_no_show_evidence",
    photo: uploadedFile,
    privacyNotice: "확정된 상대방과 운영자가 확인할 수 있으며, 타인 얼굴 없이 본인 자리/음료/매장 일부만 촬영하도록 안내됨",
    uploadedAt: serverTimestamp(),
    uploadedAtClient,
  };

  await setDoc(
    matchRef,
    {
      meetingProofs: {
        [viewerApplication.id]: proofPayload,
      },
      noShowEvidenceStatus: "proof_uploaded",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await updateDoc(doc(db, "twoweeksApplications", viewerApplication.id), {
    "schedule.meetingProof": proofPayload,
    "schedule.meetingProofUploadedAt": serverTimestamp(),
    "schedule.meetingProofUploadedAtClient": uploadedAtClient,
    updatedAt: serverTimestamp(),
  }).catch(() => {});

  return {
    matchId,
    proof: proofPayload,
  };
}


export async function savePreMeetingNote({
  viewerApplication,
  candidateApplication,
  note = "",
}) {
  await ensureAuth();

  if (!viewerApplication?.id || !candidateApplication?.id) {
    throw new Error("만남 전 한마디를 저장할 매칭 정보를 확인할 수 없습니다.");
  }

  const matchId = viewerApplication?.currentProposal?.matchId || "";
  if (!matchId) throw new Error("매칭 정보를 찾지 못했습니다.");

  const cleanNote = String(note || "").trim().slice(0, 160);

  if (!cleanNote) {
    throw new Error("만남 전 한마디를 입력해주세요.");
  }

  const notePayload = {
    applicationId: viewerApplication.id,
    displayName: getApplicationDisplayName(viewerApplication),
    note: cleanNote,
    updatedAtClient: new Date().toISOString(),
  };

  const matchRef = doc(db, "twoweeksMatches", matchId);
  const matchSnap = await getDoc(matchRef);
  const matchData = matchSnap.exists() ? { id: matchSnap.id, ...matchSnap.data() } : {};
  const hadPreviousNote = Boolean(matchData?.preMeetingNotes?.[viewerApplication.id]?.note);

  await setDoc(
    matchRef,
    {
      preMeetingNotes: {
        [viewerApplication.id]: notePayload,
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await updateDoc(doc(db, "twoweeksApplications", viewerApplication.id), {
    "schedule.preMeetingNote": cleanNote,
    "schedule.preMeetingNoteUpdatedAt": serverTimestamp(),
    "schedule.preMeetingNoteUpdatedAtClient": notePayload.updatedAtClient,
    updatedAt: serverTimestamp(),
  }).catch(() => {});

  const counterpartResult = await sendEventSms(
    candidateApplication,
    hadPreviousNote ? "만남 전 한마디 수정" : "만남 전 한마디 안내",
    [
      `${notePayload.displayName}님: ${truncateText(cleanNote, 100)}`,
      "복장이나 대기 위치가 바뀐 경우일 수 있습니다.",
    ]
  );

  await setDoc(
    matchRef,
    {
      preMeetingNoteSms: {
        [viewerApplication.id]: counterpartResult,
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  ).catch(() => {});

  return {
    matchId,
    note: notePayload,
    smsResult: counterpartResult,
  };
}

function safeFileName(name = "file") {
  return String(name || "file").replace(/[\\/#?%*:|"<>]/g, "_");
}

function buildFileMeta(downloadURL, storagePath, file, extra = {}) {
  if (!file) return null;
  return {
    url: downloadURL,
    path: storagePath,
    name: file.name || "",
    type: file.type || "",
    size: file.size || 0,
    uploadedAtClient: new Date().toISOString(),
    ...extra,
  };
}

async function uploadProfileImageFileWithBlurredPreview({ application, file, index, onProgress }) {
  // 제안 단계부터 선명한 사진을 공개하므로 별도 블러 파일을 생성하지 않는다.
  return uploadRawProfilePhotoFile({
    application,
    file,
    index,
    onProgress,
  });
}

function uploadMeetingProofFile({ viewerApplication, matchId, file, onProgress }) {
  return new Promise((resolve, reject) => {
    const currentUser = auth.currentUser;
    const ownerUid = currentUser?.uid || viewerApplication?.uid || "anonymous";
    const storagePath = `twoweeksMatches/${matchId}/proofs/${viewerApplication.id}/${ownerUid}/proof_${Date.now()}_${safeFileName(file.name)}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type || "application/octet-stream",
    });

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = snapshot.totalBytes ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) : 0;
        onProgress?.(progress);
      },
      reject,
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onProgress?.(100);
          resolve(buildFileMeta(downloadURL, storagePath, file));
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

function uploadRawFile({ file, storagePath, onProgress }) {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type || "application/octet-stream",
    });

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = snapshot.totalBytes ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) : 0;
        onProgress?.(progress);
      },
      reject,
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onProgress?.(100);
          resolve(buildFileMeta(downloadURL, storagePath, file));
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

function uploadRawProfilePhotoFile({ application, file, index, onProgress }) {
  const currentUser = auth.currentUser;
  const ownerUid = currentUser?.uid || application?.uid || "anonymous";
  const storagePath = `twoweeksApplications/${application.id}/${ownerUid}/profileEdits/photos/edit_${Date.now()}_${index + 1}_${safeFileName(file.name)}`;

  return uploadRawFile({ file, storagePath, onProgress });
}

async function resolveProfilePhotos({ application, photos = [], onUploadProgress }) {
  const compactPhotos = Array.isArray(photos) ? photos.filter(Boolean).slice(0, TWOWEEKS_MAX_PROFILE_PHOTOS) : [];
  const newFileItems = compactPhotos.filter((item) => item?.source === "file" && item?.file);
  const progressMap = newFileItems.reduce((acc, item, index) => ({ ...acc, [index]: 0 }), {});

  const updateAverageProgress = (fileIndex) => (progress) => {
    if (!newFileItems.length) {
      onUploadProgress?.(100);
      return;
    }

    progressMap[fileIndex] = progress;
    const values = Object.values(progressMap);
    const average = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 100;
    onUploadProgress?.(average);
  };

  const resolved = [];
  let newFileIndex = 0;

  for (let index = 0; index < compactPhotos.length; index += 1) {
    const item = compactPhotos[index];

    if (item?.source === "existing" && item?.meta?.url) {
      resolved.push(item.meta);
      continue;
    }

    if (item?.source === "file" && item?.file) {
      const uploaded = await uploadProfileImageFileWithBlurredPreview({
        application,
        file: item.file,
        index,
        onProgress: updateAverageProgress(newFileIndex),
      });
      newFileIndex += 1;
      resolved.push(uploaded);
      continue;
    }

    resolved.push(null);
  }

  const finalPhotos = resolved.filter(Boolean).slice(0, TWOWEEKS_MAX_PROFILE_PHOTOS);
  onUploadProgress?.(100);

  return {
    representativePhoto: finalPhotos[0] || null,
    additionalPhotos: finalPhotos.slice(1),
  };
}

async function refreshActiveMatchCandidatePreviews(updatedApplication = {}) {
  if (!updatedApplication?.id) return;

  try {
    const matches = await getMatchesForApplication(updatedApplication.id);
    if (!matches.length) return;

    const inactiveStatuses = new Set([
      "declined",
      "rejected",
      "expired",
      "failed",
      "completed",
      "cancelled",
      "withdrawn",
      "rematched",
      "proposal_expired",
      "schedule_expired",
      "counterpart_expired",
    ]);

    const safePreview = sanitizeCandidateApplicationForViewer(updatedApplication, {
      photoRevealed: false,
      organizationVisible: false,
    });

    const refreshedAtClient = new Date().toISOString();
    const updateTasks = matches
      .filter((match) => match?.id && !inactiveStatuses.has(String(match?.status || "")))
      .map((match) => {
        const viewerApplicationId =
          match.maleApplicationId === updatedApplication.id
            ? match.femaleApplicationId
            : match.femaleApplicationId === updatedApplication.id
              ? match.maleApplicationId
              : "";

        if (!viewerApplicationId) return null;

        return updateDoc(doc(db, "twoweeksMatches", match.id), {
          [`candidatePreviews.${viewerApplicationId}`]: safePreview,
          "securePhotoPolicy.proposalStageUsesClearPhotos": true,
          "securePhotoPolicy.originalPhotoVisibleFromProposal": true,
          "securePhotoPolicy.previewRefreshedAtClient": refreshedAtClient,
          "securePhotoPolicy.previewVersion": "clear_v1",
          updatedAt: serverTimestamp(),
        });
      })
      .filter(Boolean);

    if (updateTasks.length) {
      const results = await Promise.allSettled(updateTasks);
      results.forEach((result) => {
        if (result.status === "rejected") {
          console.warn(
            "[TwoWeeksProposal] match candidate preview refresh skipped:",
            result.reason?.code || result.reason?.message || result.reason
          );
        }
      });
    }
  } catch (error) {
    // 프로필 저장 자체는 성공시킨다. 매칭 스냅샷 갱신 실패는 다음 매칭 생성 시 다시 반영된다.
    console.warn(
      "[TwoWeeksProposal] active match candidate preview refresh skipped:",
      error?.code || error?.message || error
    );
  }
}

export async function updateApplicationProfile({
  application,
  form,
  onUploadProgress,
}) {
  await ensureAuth();

  if (!application?.id) {
    throw new Error("수정할 신청 정보를 찾지 못했습니다.");
  }

  if (!isApplicationProfileEditable(application)) {
    throw new Error("매칭이 확정된 이후에는 프로필을 수정할 수 없습니다.");
  }

  const nickname = form.nickname?.trim() || "";
  const introduction = form.introduction?.trim() || "";
  const organizationName = form.organizationName?.trim() || "";
  const height = form.height ? Number(form.height) : null;

  if (!nickname || nickname.length < 2) {
    throw new Error("닉네임은 2자 이상 입력해주세요.");
  }

  if (!introduction) {
    throw new Error("1줄 자기소개를 입력해주세요.");
  }

  if (!Array.isArray(form.activityAreas) || form.activityAreas.length < 1) {
    throw new Error("활동 가능한 지역을 1개 이상 남겨주세요.");
  }

  if (!form.preferredArea) {
    throw new Error("가장 편한 지역을 선택해주세요.");
  }

  if (!Array.isArray(form.availableTimeSlots) || form.availableTimeSlots.length < 1) {
    throw new Error("가능한 시간대를 1개 이상 남겨주세요.");
  }

  if (height && (height < 130 || height > 230)) {
    throw new Error("키는 130~230cm 범위로 입력해주세요.");
  }

  if (!form.jobCategory) {
    throw new Error("직업군을 선택해주세요.");
  }

  if (form.jobCategory === "회사원" && !form.companyScale) {
    throw new Error("회사 유형을 선택해주세요.");
  }

  if (!organizationName) {
    throw new Error("회사명 또는 학교명을 입력해주세요.");
  }

  if (!form.marriagePlan) {
    throw new Error("결혼 의향을 선택해주세요.");
  }

  if (!form.childrenPlan) {
    throw new Error("자녀 계획을 선택해주세요.");
  }

  if (!form.religion) {
    throw new Error("현재 종교를 선택해주세요.");
  }

  if (!form.religionPreference) {
    throw new Error("상대방 종교에 대한 생각을 선택해주세요.");
  }

  if (!form.smoking) {
    throw new Error("흡연 여부를 선택해주세요.");
  }

  if (!form.smokingPreference) {
    throw new Error("상대방 흡연 허용 범위를 선택해주세요.");
  }

  if (!form.drinkingFrequency) {
    throw new Error("음주 빈도를 선택해주세요.");
  }

  const photoResult = await resolveProfilePhotos({
    application,
    photos: form.photos,
    onUploadProgress,
  });

  if (!photoResult.representativePhoto) {
    throw new Error("대표 사진 1장 이상은 유지해주세요.");
  }

  const nextBasic = {
    ...(application.basic || {}),
    nickname,
    activityAreas: Array.isArray(form.activityAreas) ? form.activityAreas : [],
    preferredArea: form.preferredArea || "",
    availableTimeSlots: normalizeTimeSlotLabels(form.availableTimeSlots),
    height,
    introduction,
  };

  const nextIdentity = {
    ...(application.identity || {}),
    jobCategory: form.jobCategory,
    companyScale: form.jobCategory === "회사원" ? form.companyScale || "" : "",
    organizationName,
    representativePhoto: photoResult.representativePhoto,
    additionalPhotos: photoResult.additionalPhotos,
  };

  const nextMatchingPreferences = {
    ...(application.matchingPreferences || {}),
    marriagePlan: form.marriagePlan,
    childrenPlan: form.childrenPlan,
    religion: form.religion,
    religionPreference: form.religionPreference,
    smoking: form.smoking,
    smokingPreference: form.smokingPreference,
    drinkingFrequency: form.drinkingFrequency,
    completed: true,
    updatedAtClient: new Date().toISOString(),
  };

  // Protected application fields must be updated by the owner-authorized server function.
  // A direct Firestore update silently conflicts with existing security rules.
  const callable = httpsCallable(getFunctions(undefined, "asia-northeast3"), "updateTwoWeeksProfile");
  const requestForm = {
    ...form,
    photos: [photoResult.representativePhoto, ...(photoResult.additionalPhotos || [])],
  };
  const response = await callable({ applicationId: application.id, profile: requestForm });
  const profileUpdateResult = response?.data || {};
  if (!profileUpdateResult.ok) throw new Error("프로필 저장 결과를 확인하지 못했어요.");

  const nextTraits = {
    ...(application.profileTraits || {}),
    mbti: form.mbti || "",
    interests: form.interests || [],
  };
  const nextFullIdentity = {
    ...nextIdentity,
    educationLevel: form.educationLevel || "",
    schoolName: (form.schoolName || "").trim(),
  };
  const range = form.preferredAgeMin && form.preferredAgeMax ? { min: Number(form.preferredAgeMin), max: Number(form.preferredAgeMax) } : null;
  const nextFullPreferences = {
    ...nextMatchingPreferences,
    preferredAgeRange: range,
    drinkingPreference: form.preferredDrinking || "",
    preferredStyles: form.preferredStyles || [],
    preferredJobCategories: form.preferredJobCategories || [],
    additionalPreference: (form.additionalPreference || "").trim(),
  };
  return {
    ...application,
    basic: nextBasic,
    identity: nextFullIdentity,
    profileTraits: nextTraits,
    matchingPreferences: nextFullPreferences,
    profileUpdateResult,
    reviewStatus: profileUpdateResult.reviewRequired ? "reviewing" : application.reviewStatus,
    nextRoundStatus: profileUpdateResult.reviewRequired ? "not_ready" : application.nextRoundStatus,
    matchingStatus: profileUpdateResult.reviewRequired ? "not_ready" : application.matchingStatus,
  };
}

export async function requestDepositRefund({ application, verifiedProfile, bankName, accountNumber, accountHolder }) {
  await ensureAuth();

  if (!application?.id) {
    throw new Error("신청 정보를 확인할 수 없습니다.");
  }

  try {
    const functions = getFunctions(undefined, "asia-northeast3");
    const callable = httpsCallable(functions, "requestTwoWeeksDepositRefund");
    const result = await callable({
      applicationId: application.id,
      bankName: String(bankName || "").trim(),
      accountNumber: String(accountNumber || "").trim(),
      accountHolder: String(accountHolder || "").trim(),
    });

    return result?.data || { ok: true };
  } catch (error) {
    console.error("[TwoWeeksProposal] deposit refund request failed:", error);
    throw new Error(error?.message?.replace(/^FirebaseError:\s*/i, "") || "예치금 반환 요청 중 오류가 발생했습니다.");
  }
}

export async function submitVerificationDocumentReplacement({ application, file, onUploadProgress }) {
  const currentUser = await ensureAuth();
  if (!currentUser || !application?.id || !file) throw new Error("제출할 직업 인증자료를 확인할 수 없습니다.");
  const storagePath = `twoweeksApplications/${application.id}/${currentUser.uid}/profileEdits/verification/verification_${Date.now()}_${safeFileName(file.name)}`;
  const verificationDocument = await uploadRawFile({ file, storagePath, onProgress: onUploadProgress });
  try {
    const functions = getFunctions(undefined, "asia-northeast3");
    const callable = httpsCallable(functions, "submitTwoWeeksVerificationDocument");
    const result = await callable({ applicationId: application.id, verificationDocument });
    return result?.data || { ok: true };
  } catch (error) {
    throw new Error(error?.message?.replace(/^FirebaseError:\s*/i, "") || "직업 인증자료 제출 중 오류가 발생했습니다.");
  }
}

export async function getVerificationDocumentStatus({ application }) {
  await ensureAuth();
  if (!application?.id) throw new Error("신청 정보를 확인할 수 없습니다.");
  const functions = getFunctions(undefined, "asia-northeast3");
  const callable = httpsCallable(functions, "getTwoWeeksVerificationDocumentStatus");
  const result = await callable({ applicationId: application.id });
  return result?.data || { ok: true, document: null, review: null };
}

export async function getWithdrawalPreview({ application }) {
  await ensureAuth();
  if (!application?.id) throw new Error("신청 정보를 확인할 수 없습니다.");
  const functions = getFunctions(undefined, "asia-northeast3");
  const callable = httpsCallable(functions, "getTwoWeeksWithdrawalPreview");
  const result = await callable({ applicationId: application.id });
  return result?.data || null;
}

export async function requestWithdrawal({ application, ...payload }) {
  await ensureAuth();
  if (!application?.id) throw new Error("탈퇴할 신청 정보를 확인할 수 없습니다.");
  const functions = getFunctions(undefined, "asia-northeast3");
  const callable = httpsCallable(functions, "requestTwoWeeksWithdrawal");
  const result = await callable({ applicationId: application.id, ...payload, confirmed: true });
  return result?.data || { ok: true };
}

export async function loadMutualContact({ viewerApplication, match }) {
  if (!viewerApplication?.id || !match?.id) return null;

  try {
    await ensureAuth();
    const functions = getFunctions(undefined, "asia-northeast3");
    const callable = httpsCallable(functions, "getTwoWeeksMutualContact");
    const result = await callable({
      viewerApplicationId: viewerApplication.id,
      matchId: match.id,
    });
    return result?.data?.opened ? result.data.contact || null : null;
  } catch (error) {
    console.warn("[TwoWeeksProposal] mutual contact load skipped:", error?.code || error?.message || error);
    return null;
  }
}

export async function ensureFeedbackAccess({ viewerApplication, match }) {
  if (!viewerApplication?.id || !match?.id) {
    throw new Error("피드백을 작성할 만남 정보를 확인할 수 없습니다.");
  }

  try {
    await ensureAuth();
    const functions = getFunctions(undefined, "asia-northeast3");
    const callable = httpsCallable(functions, "ensureTwoWeeksFeedbackAccess");
    const result = await callable({
      viewerApplicationId: viewerApplication.id,
      matchId: match.id,
    });

    return result?.data || null;
  } catch (error) {
    console.error("[TwoWeeksProposal] feedback access failed:", error);
    throw new Error(
      error?.message?.replace(/^FirebaseError:\s*/i, "") ||
        "피드백 화면을 여는 중 오류가 발생했습니다."
    );
  }
}

export async function ensureReviewAccess({ viewerApplication, match }) {
  if (!viewerApplication?.id || !match?.id) {
    throw new Error("후기를 작성할 만남 정보를 확인할 수 없습니다.");
  }

  try {
    await ensureAuth();
    const functions = getFunctions(undefined, "asia-northeast3");
    const callable = httpsCallable(functions, "ensureTwoWeeksReviewAccess");
    const result = await callable({
      viewerApplicationId: viewerApplication.id,
      matchId: match.id,
    });

    return result?.data || null;
  } catch (error) {
    console.error("[TwoWeeksProposal] review access failed:", error);
    throw new Error(
      error?.message?.replace(/^FirebaseError:\s*/i, "") ||
        "후기 화면을 여는 중 오류가 발생했습니다."
    );
  }
}

export async function cancelCurrentMatch({ viewerApplication, match, reason = "" }) {
  if (!viewerApplication?.id || !match?.id) {
    throw new Error("취소할 만남 정보를 확인할 수 없습니다.");
  }

  try {
    await ensureAuth();
    const functions = getFunctions(undefined, "asia-northeast3");
    const callable = httpsCallable(functions, "cancelTwoWeeksMatch");
    const result = await callable({
      viewerApplicationId: viewerApplication.id,
      matchId: match.id,
      reason: String(reason || "").trim(),
    });
    return result?.data || { ok: true };
  } catch (error) {
    console.error("[TwoWeeksProposal] match cancellation failed:", error);
    throw new Error(error?.message?.replace(/^FirebaseError:\s*/i, "") || "만남 취소 처리 중 오류가 발생했습니다.");
  }
}


export async function setMatchingAvailability({ viewerApplication, action = "resume" }) {
  if (!viewerApplication?.id) {
    throw new Error("매칭 상태를 변경할 신청 정보를 확인할 수 없습니다.");
  }

  try {
    await ensureAuth();
    const functions = getFunctions(undefined, "asia-northeast3");
    const callable = httpsCallable(functions, "setTwoWeeksMatchingAvailability");
    const result = await callable({
      applicationId: viewerApplication.id,
      action: action === "pause" ? "pause" : "resume",
    });
    return result?.data || { ok: true };
  } catch (error) {
    console.error("[TwoWeeksProposal] matching availability update failed:", error);
    throw new Error(error?.message?.replace(/^FirebaseError:\s*/i, "") || "매칭 상태 변경 중 오류가 발생했습니다.");
  }
}

// Lightweight past-introduction summaries only: no candidate identity/photos are returned.
// Existing participant-scoped Firestore rules apply to both queries.
export async function loadRecentIntroHistory(applicationId = "", excludeMatchId = "") {
  const id = String(applicationId || "").trim();
  if (!id) return [];
  const [male, female] = await Promise.allSettled([
    getDocs(query(collection(db, "twoweeksMatches"), where("maleApplicationId", "==", id))),
    getDocs(query(collection(db, "twoweeksMatches"), where("femaleApplicationId", "==", id))),
  ]);
  if (male.status === "rejected" && female.status === "rejected") {
    throw new Error("지난 소개 조회 권한을 확인하지 못했어요.");
  }
  const byId = new Map();
  [male, female].forEach((result) => {
    if (result.status !== "fulfilled") return;
    result.value.docs.forEach((row) => byId.set(row.id, { id: row.id, ...row.data() }));
  });
  return Array.from(byId.values())
    .filter((match) => match.id !== excludeMatchId)
    .map((match) => summaryPastMatch(match, id))
    .filter(Boolean)
    .sort((a, b) => b.dateMs - a.dateMs)
    .slice(0, 3);
}
