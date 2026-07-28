import { signInAnonymously } from "firebase/auth";
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
import { auth, db, storage, sendLms } from "firebaseConfig";
import { TWOWEEKS_ROUND_ID } from "./constants";
import {
  scoreCandidate,
  formatPhone,
  getApplicationTimeValue,
  isApplicationProfileEditable,
  normalizePhone,
} from "./helpers";
import { isTwoWeeksTestPhone, TWOWEEKS_TEST_CODE } from "../TwoWeeksShared/testAuth";

async function ensureAuth() {
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

function addDaysClient(days = 2) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function getSiteOrigin() {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SERVICE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "";

  if (configuredOrigin) return configuredOrigin.replace(/\/$/, "");

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

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

  if (status === "confirmed" || scheduleStatus === "confirmed" || match?.finalMeeting || photoRevealStatus === "revealed") {
    return 7000;
  }

  if (status === "mutualAccepted" || ["waiting_counterpart", "needs_final_choice", "place_pending", "ready"].includes(scheduleStatus)) {
    return 6000;
  }

  if (status === "proposed" || match?.proposalStatus === "proposed") {
    return 5000;
  }

  if (["declined", "failed", "expired", "cancelled", "canceled"].includes(status)) {
    return 0;
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

  let candidate = allApplications.find((item) => item.id === candidateApplicationId) || null;

  if (!candidate) {
    try {
      const candidateSnap = await getDoc(doc(db, "twoweeksApplications", candidateApplicationId));
      if (candidateSnap.exists()) candidate = mapDoc(candidateSnap);
    } catch (error) {
      console.warn("[TwoWeeksProposal] matched candidate load failed:", error?.code || error?.message || error);
    }
  }

  if (!candidate) return null;

  const viewerResponse = await getResponseDoc(viewerApplication.id, candidate.id);
  const counterpartResponse = await getResponseDoc(candidate.id, viewerApplication.id);
  const scheduleStatus = String(match?.scheduleStatus || match?.schedule?.status || "");
  const bothAccepted =
    viewerResponse?.response === "accepted" ||
    counterpartResponse?.response === "accepted" ||
    match?.status === "mutualAccepted" ||
    match?.status === "confirmed" ||
    scheduleStatus === "confirmed" ||
    Boolean(match?.finalMeeting);

  return {
    candidate,
    score: scoreCandidate(viewerApplication, candidate),
    source: "match_lookup",
    matchId: match.id,
    match,
    schedule: match?.schedule || {},
    finalMeeting: match?.finalMeeting || match?.schedule?.finalMeeting || null,
    photoRevealStatus: match?.photoRevealStatus || "",
    viewerResponse,
    counterpartResponse,
    bothAccepted,
  };
}

async function loadLatestMatchForApplication(viewerApplication = {}, allApplications = []) {
  if (!viewerApplication?.id) return null;

  const matches = await getMatchesForApplication(viewerApplication.id);
  const match = pickBestDashboardMatch(matches);

  return loadMatchCandidateFromMatch(viewerApplication, match, allApplications);
}

function getStoredDashboardToken(application = {}) {
  return (
    application?.dashboardAccess?.token ||
    application?.access?.dashboardToken ||
    application?.dashboardToken ||
    ""
  );
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

  let candidate = allApplications.find((item) => item.id === candidateApplicationId) || null;

  if (!candidate) {
    try {
      const candidateSnap = await getDoc(doc(db, "twoweeksApplications", candidateApplicationId));
      if (candidateSnap.exists()) {
        candidate = mapDoc(candidateSnap);
      }
    } catch (error) {
      console.warn("[TwoWeeksProposal] current proposal candidate load failed:", error);
    }
  }

  if (!candidate) return null;

  const currentProposalMatchId = viewerApplication?.currentProposal?.matchId || "";
  let match = await getMatchDoc(currentProposalMatchId);

  // 신청자 문서의 currentProposal.matchId가 비어 있거나 오래된 경우,
  // 실제 twoweeksMatches 이력에서 같은 남녀 조합의 최신 매칭을 다시 찾는다.
  if (!match || (!match?.schedule && !match?.finalMeeting && !match?.status)) {
    const pairMatch = await findBestMatchByPair(viewerApplication.id, candidate.id);
    if (pairMatch) match = pairMatch;
  }

  const viewerResponse = await getResponseDoc(viewerApplication.id, candidate.id);
  const counterpartResponse = await getResponseDoc(candidate.id, viewerApplication.id);
  const scheduleStatus = String(match?.scheduleStatus || match?.schedule?.status || "");
  const bothAccepted =
    viewerResponse?.response === "accepted" ||
    counterpartResponse?.response === "accepted" ||
    match?.status === "mutualAccepted" ||
    match?.status === "confirmed" ||
    scheduleStatus === "confirmed" ||
    Boolean(match?.finalMeeting);

  return {
    candidate,
    score: scoreCandidate(viewerApplication, candidate),
    source: "admin_current_proposal",
    matchId: match?.id || currentProposalMatchId,
    match,
    schedule: match?.schedule || {},
    finalMeeting: match?.finalMeeting || match?.schedule?.finalMeeting || null,
    photoRevealStatus: match?.photoRevealStatus || "",
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

  const roundId = freshViewerApplication.roundId || TWOWEEKS_ROUND_ID;

  const roundQuery = query(
    collection(db, "twoweeksApplications"),
    where("roundId", "==", roundId)
  );

  const roundSnap = await getDocs(roundQuery);
  const allApplications = roundSnap.docs.map(mapDoc);

  // 고객 화면에는 운영자가 실제로 제안한 후보만 보여준다.
  // 단, 신청자 currentProposal가 일부 누락/초기화된 경우에는 match 문서 이력에서 최신 진행 매칭을 복구한다.
  const currentProposalMatch = await loadCurrentProposalCandidate(freshViewerApplication, allApplications);
  const latestMatch = currentProposalMatch || (await loadLatestMatchForApplication(freshViewerApplication, allApplications));

  return {
    viewerApplication: freshViewerApplication,
    allApplications,
    bestMatch: latestMatch,
  };
}


async function getApplicationsByPhone(phoneNormalized) {
  const phoneFormatted = formatPhone(phoneNormalized);
  const results = new Map();

  const addResults = (snap) => {
    snap.docs.forEach((docSnap) => results.set(docSnap.id, mapDoc(docSnap)));
  };

  const safeQuery = async (fieldPath, value) => {
    if (!value) return;

    try {
      const snap = await getDocs(
        query(collection(db, "twoweeksApplications"), where(fieldPath, "==", value))
      );
      addResults(snap);
    } catch (error) {
      console.warn(`[TwoWeeksProposal] lookup skipped: ${fieldPath}`, error?.code || error?.message || error);
    }
  };

  const values = Array.from(new Set([phoneNormalized, phoneFormatted].filter(Boolean)));
  const fieldPaths = [
    "basic.phoneNormalized",
    "basic.phone",
    "phoneNormalized",
    "phone",
    "phonenumber",
    "tel",
    "identity.phone",
    "phoneIdentityVerification.phone",
  ];

  for (const fieldPath of fieldPaths) {
    for (const value of values) {
      await safeQuery(fieldPath, value);
    }
  }

  if (!results.size) {
    try {
      const roundSnap = await getDocs(
        query(collection(db, "twoweeksApplications"), where("roundId", "==", TWOWEEKS_ROUND_ID))
      );

      roundSnap.docs
        .map(mapDoc)
        .filter((application) => {
          const candidates = [
            application?.basic?.phoneNormalized,
            application?.basic?.phone,
            application?.phoneNormalized,
            application?.phone,
            application?.phonenumber,
            application?.tel,
            application?.identity?.phone,
            application?.phoneIdentityVerification?.phone,
          ];

          return candidates.some((value) => normalizePhone(value) === phoneNormalized);
        })
        .forEach((application) => results.set(application.id, application));
    } catch (error) {
      console.warn("[TwoWeeksProposal] fallback lookup failed:", error?.code || error?.message || error);
      if (isPermissionLikeError(error)) throw toConsumerError(error);
    }
  }

  return Array.from(results.values());
}

function createLookupCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function buildLookupCodeMessage(code) {
  return [
    `[투윅스] 신청현황 인증번호: ${code}`,
    "5분 안에 입력해주세요.",
  ].join(String.fromCharCode(10));
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
    await ensureAuth();

    const applications = await getApplicationsByPhone(phoneNormalized);

    if (!applications.length) {
      return {
        ok: false,
        code: "APPLICATION_NOT_FOUND",
        message: "신청내역이 없습니다.",
      };
    }

    const selectedApplication = pickDashboardApplication(applications);

    if (isTwoWeeksTestPhone(phoneNormalized)) {
      return {
        ok: true,
        phoneNormalized,
        applicationId: selectedApplication?.id || "",
        code: TWOWEEKS_TEST_CODE,
        expiresAt: Date.now() + 30 * 60 * 1000,
        sentAtClient: new Date().toISOString(),
      };
    }

    const lookupCode = createLookupCode();

    await sendLms(
      phoneNormalized,
      buildLookupCodeMessage(lookupCode),
      "투윅스 신청현황 인증번호",
      { forceLms: false }
    );

    return {
      ok: true,
      phoneNormalized,
      applicationId: selectedApplication?.id || "",
      code: lookupCode,
      expiresAt: Date.now() + 5 * 60 * 1000,
      sentAtClient: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[TwoWeeksProposal] lookup code failed:", error?.code || error?.message || error);

    if (isPermissionLikeError(error)) {
      return {
        ok: false,
        code: "AUTH_UNAVAILABLE",
        message: "잠시 후 다시 시도해주세요.",
      };
    }

    return {
      ok: false,
      code: "SMS_OR_LOOKUP_FAILED",
      message: error?.message || "잠시 후 다시 시도해주세요.",
    };
  }
}

export async function loadApplicationByAccessToken({ applicationId, token }) {
  await ensureAuth();

  const cleanApplicationId = String(applicationId || "").trim();
  const cleanToken = String(token || "").trim();

  if (!cleanApplicationId || !cleanToken) {
    throw new Error("신청현황 링크 정보가 올바르지 않습니다.");
  }

  const applicationRef = doc(db, "twoweeksApplications", cleanApplicationId);
  const snap = await getDoc(applicationRef);

  if (!snap.exists()) {
    throw new Error("신청 정보를 찾지 못했습니다.");
  }

  const viewerApplication = mapDoc(snap);
  const storedToken = getStoredDashboardToken(viewerApplication);

  if (!storedToken || storedToken !== cleanToken || isDashboardAccessRevoked(viewerApplication)) {
    throw new Error("신청현황 링크가 만료되었거나 올바르지 않습니다. 문자로 받은 최신 링크를 다시 확인해주세요.");
  }

  await updateDoc(applicationRef, {
    "dashboardAccess.lastOpenedAt": serverTimestamp(),
    "dashboardAccess.lastOpenedAtClient": new Date().toISOString(),
    updatedAt: serverTimestamp(),
  }).catch((error) => {
    console.warn("[TwoWeeksProposal] dashboard access touch failed:", error);
  });

  return loadRoundAndBestMatch(viewerApplication);
}

export async function loadApplicationByVerifiedPhone(phone, options = {}) {
  await ensureAuth();

  const phoneNormalized = normalizePhone(phone);

  if (!phoneNormalized) {
    throw new Error("본인인증된 연락처를 확인할 수 없습니다.");
  }

  let applications = [];

  try {
    applications = await getApplicationsByPhone(phoneNormalized);
  } catch (error) {
    throw toConsumerError(error);
  }

  if (!applications.length) {
    return {
      viewerApplication: null,
      allApplications: [],
      bestMatch: null,
    };
  }

  const viewerApplication = pickDashboardApplication(applications, options.preferredApplicationId);

  return loadRoundAndBestMatch(viewerApplication);
}


export async function saveProposalResponse({
  viewerApplication,
  candidateApplication,
  response,
}) {
  await ensureAuth();

  if (!viewerApplication?.id || !candidateApplication?.id) {
    throw new Error("응답을 저장할 매칭 후보 정보가 없습니다.");
  }

  if (!["accepted", "declined"].includes(response)) {
    throw new Error("응답값이 올바르지 않습니다.");
  }

  const responseId = `${viewerApplication.id}_${candidateApplication.id}`;
  const responseRef = doc(db, "twoweeksProposalResponses", responseId);
  const matchId = viewerApplication?.currentProposal?.matchId || "";
  const responseDueAtClient = viewerApplication?.currentProposal?.responseDueAtClient || addDaysClient(RESPONSE_DUE_DAYS);

  await setDoc(
    responseRef,
    {
      roundId: viewerApplication.roundId || TWOWEEKS_ROUND_ID,
      matchId,
      viewerApplicationId: viewerApplication.id,
      candidateApplicationId: candidateApplication.id,
      viewerUid: viewerApplication.uid || "",
      candidateUid: candidateApplication.uid || "",
      viewerGender: viewerApplication.basic?.gender || "",
      candidateGender: candidateApplication.basic?.gender || "",
      response,
      status: response,
      responseDueDays: RESPONSE_DUE_DAYS,
      responseDueAtClient,
      respondedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      policySnapshot: {
        proposalResponseDueDays: RESPONSE_DUE_DAYS,
        scheduleSelectionDueDays: SCHEDULE_DUE_DAYS,
        contactOpenAfterMutualConnection: true,
        proposalStageContactPrivate: true,
        photoBlurredAtProposalStage: true,
        photoRevealAfterScheduleConfirmed: true,
      },
    },
    { merge: true }
  );

  await updateDoc(doc(db, "twoweeksApplications", viewerApplication.id), {
    "currentProposal.candidateApplicationId": candidateApplication.id,
    "currentProposal.matchId": matchId,
    "currentProposal.response": response,
    "currentProposal.respondedAt": serverTimestamp(),
    "currentProposal.respondedAtClient": new Date().toISOString(),
    matchingStatus: response === "accepted" ? "accepted" : "declined",
    updatedAt: serverTimestamp(),
  });

  const counterpartResponse = await getResponseDoc(candidateApplication.id, viewerApplication.id);
  const bothAccepted = response === "accepted" && counterpartResponse?.response === "accepted";

  if (matchId) {
    if (response === "declined") {
      await setDoc(
        doc(db, "twoweeksMatches", matchId),
        {
          status: "declined",
          declinedByApplicationId: viewerApplication.id,
          declinedAt: serverTimestamp(),
          declinedAtClient: new Date().toISOString(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch((error) => {
        console.warn("[TwoWeeksProposal] match decline update failed:", error);
      });
    }

    if (bothAccepted) {
      const existingMatch = await getMatchDoc(matchId);
      const alreadyOpenedSchedule = Boolean(existingMatch?.scheduleStatus && existingMatch.scheduleStatus !== "not_started");
      const scheduleDueAtClient = existingMatch?.schedule?.dueAtClient || addDaysClient(SCHEDULE_DUE_DAYS);
      const matchRef = doc(db, "twoweeksMatches", matchId);

      if (!alreadyOpenedSchedule) {
        await setDoc(
          matchRef,
          {
            status: "mutualAccepted",
            scheduleStatus: "ready",
            schedule: {
              status: "ready",
              dueDays: SCHEDULE_DUE_DAYS,
              dueAtClient: scheduleDueAtClient,
              openedAt: serverTimestamp(),
              openedAtClient: new Date().toISOString(),
              firstSelectorApplicationId: "",
              firstChoices: [],
              finalChoice: null,
            },
            photoRevealStatus: "hidden",
            mutualAcceptedAt: serverTimestamp(),
            mutualAcceptedAtClient: new Date().toISOString(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch((error) => {
          console.warn("[TwoWeeksProposal] mutual accepted match update failed:", error);
        });
      } else {
        await setDoc(
          matchRef,
          {
            status: existingMatch?.status === "confirmed" ? "confirmed" : "mutualAccepted",
            mutualAcceptedAtClient: existingMatch?.mutualAcceptedAtClient || new Date().toISOString(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch((error) => {
          console.warn("[TwoWeeksProposal] mutual accepted touch failed:", error);
        });
      }

      await updateDoc(doc(db, "twoweeksApplications", viewerApplication.id), {
        matchingStatus: "mutualAccepted",
        "currentProposal.mutualAcceptedAt": serverTimestamp(),
        "currentProposal.mutualAcceptedAtClient": new Date().toISOString(),
        updatedAt: serverTimestamp(),
      }).catch(() => {});

      if (!alreadyOpenedSchedule) {
        await sendEventSms(viewerApplication, "일정조율 시작", [
          "상대도 만남 진행 의사를 선택했습니다.",
          "2일 내 일시와 장소를 선택해주세요.",
          "먼저 선택한 사람은 일시 3개와 장소 3개를 제안합니다.",
        ]);

        await sendEventSms(candidateApplication, "일정조율 시작", [
          "상대도 만남 진행 의사를 선택했습니다.",
          "2일 내 일시와 장소를 선택해주세요.",
          "먼저 선택한 사람은 일시 3개와 장소 3개를 제안합니다.",
        ]);
      }
    }
  }

  return {
    responseId,
    bothAccepted,
    matchId,
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
  const preMeetingNotes = matchData?.preMeetingNotes || {};
  const myPreMeetingNote = preMeetingNotes?.[viewerApplication.id]?.note || "";

  const payload = {
    applicationId: viewerApplication.id,
    displayName: getApplicationDisplayName(viewerApplication),
    status: status === "arrived" ? "arrived" : "arrived",
    preMeetingNoteSnapshot: truncateText(myPreMeetingNote, 120),
    arrivedAtClient,
    updatedAtClient: arrivedAtClient,
  };

  const existingArrival = matchData?.meetingArrival || {};
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

  const dashboardUrl = getDashboardUrl(candidateApplication);
  const noteLine = myPreMeetingNote
    ? `상대 한마디: ${truncateText(myPreMeetingNote, 80)}`
    : "상대 한마디는 아직 없습니다.";

  const counterpartResult = await sendEventSms(candidateApplication, "상대방 도착 안내", [
    "상대방이 미팅 장소에 도착하였음을 전달드립니다.",
    noteLine,
  ]);

  const selfResult = await sendEventSms(viewerApplication, "도착 안내 완료", [
    "상대방에게 도착 안내를 보냈습니다.",
    "복장이나 위치가 바뀌면 만남 전 한마디를 수정해주세요.",
  ]);

  await setDoc(
    matchRef,
    {
      meetingArrivalSms: {
        [viewerApplication.id]: {
          self: selfResult,
          counterpart: counterpartResult,
          sentAtClient: new Date().toISOString(),
        },
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  ).catch(() => {});

  return {
    matchId,
    arrival: payload,
    bothArrived,
    smsResult: counterpartResult,
    selfSmsResult: selfResult,
  };
}

export async function saveMeetingProofPhoto({
  viewerApplication,
  candidateApplication,
  file,
  note = "",
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
    purpose: "arrival_or_no_show_evidence",
    photo: uploadedFile,
    note: String(note || "").trim().slice(0, 300),
    privacyNotice: "상대방 얼굴 촬영 없이 본인 자리/음료/매장 일부만 촬영하도록 안내됨",
    uploadedAt: serverTimestamp(),
    uploadedAtClient,
  };

  const matchRef = doc(db, "twoweeksMatches", matchId);

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

function buildFileMeta(downloadURL, storagePath, file) {
  if (!file) return null;
  return {
    url: downloadURL,
    path: storagePath,
    name: file.name || "",
    type: file.type || "",
    size: file.size || 0,
    uploadedAtClient: new Date().toISOString(),
  };
}

function uploadMeetingProofFile({ viewerApplication, matchId, file, onProgress }) {
  return new Promise((resolve, reject) => {
    const currentUser = auth.currentUser;
    const ownerUid = viewerApplication?.uid || currentUser?.uid || "anonymous";
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

function uploadPhotoFile({ application, file, index, onProgress }) {
  return new Promise((resolve, reject) => {
    const currentUser = auth.currentUser;
    const ownerUid = application?.uid || currentUser?.uid || "anonymous";
    const storagePath = `twoweeksApplications/${application.id}/${ownerUid}/profileEdits/photos/edit_${Date.now()}_${index + 1}_${safeFileName(file.name)}`;
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

async function resolveProfilePhotos({ application, photos = [], onUploadProgress }) {
  const compactPhotos = Array.isArray(photos) ? photos.filter(Boolean).slice(0, 4) : [];
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
      const uploaded = await uploadPhotoFile({
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

  const finalPhotos = resolved.filter(Boolean).slice(0, 4);
  onUploadProgress?.(100);

  return {
    representativePhoto: finalPhotos[0] || null,
    additionalPhotos: finalPhotos.slice(1),
  };
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

  if (!organizationName) {
    throw new Error("회사명 또는 학교명을 입력해주세요.");
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
    availableTimeSlots: Array.isArray(form.availableTimeSlots) ? form.availableTimeSlots : [],
    height,
    introduction,
  };

  const nextIdentity = {
    ...(application.identity || {}),
    jobCategory: form.jobCategory,
    organizationName,
    representativePhoto: photoResult.representativePhoto,
    additionalPhotos: photoResult.additionalPhotos,
  };

  const applicationRef = doc(db, "twoweeksApplications", application.id);

  await updateDoc(applicationRef, {
    "basic.nickname": nextBasic.nickname,
    "basic.activityAreas": nextBasic.activityAreas,
    "basic.preferredArea": nextBasic.preferredArea,
    "basic.availableTimeSlots": nextBasic.availableTimeSlots,
    "basic.height": nextBasic.height,
    "basic.introduction": nextBasic.introduction,
    "identity.jobCategory": nextIdentity.jobCategory,
    "identity.organizationName": nextIdentity.organizationName,
    "identity.representativePhoto": nextIdentity.representativePhoto,
    "identity.additionalPhotos": nextIdentity.additionalPhotos,
    "profileEdit.lastEditedAt": serverTimestamp(),
    "profileEdit.lastEditedAtClient": new Date().toISOString(),
    "profileEdit.editCount": increment(1),
    "profileEdit.editableUntil": "matching_confirmed",
    updatedAt: serverTimestamp(),
  });

  return {
    ...application,
    basic: nextBasic,
    identity: nextIdentity,
    profileEdit: {
      ...(application.profileEdit || {}),
      lastEditedAtClient: new Date().toISOString(),
      editableUntil: "matching_confirmed",
    },
  };
}
