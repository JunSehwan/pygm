const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const crypto = require("crypto");
const { isAdminUid } = require("./twoWeeksCallerAuth");
const { isParticipationEligible } = require("./twoWeeksDepositPolicy");

if (!admin.apps.length) admin.initializeApp();

const REGION = "asia-northeast3";
const SITE_URL = "https://charmingsoup.com/2weeks";
const SOURCE_VALUES = new Set([
  "instagram",
  "instagram_facebook",
  "facebook",
  "naver_cafe",
  "munto",
  "frip",
  "danggeun",
  "open_chat",
  "offline",
  "offline_qr",
  "search",
  "referral",
  "direct",
  "other",
]);
const SELF_REPORTED_VALUES = new Set([
  "instagram_facebook",
  "naver_cafe",
  "munto",
  "frip",
  "danggeun",
  "open_chat",
  "referral",
  "offline_qr",
  "search",
  "other",
]);

function clean(value = "", maxLength = 120) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function normalizeSource(value = "") {
  return clean(value, 40).toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

function normalizeCampaignCode(value = "") {
  return clean(value, 60).toUpperCase().replace(/[^A-Z0-9_-]/g, "");
}

function onlyDigits(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

function sha256(value = "") {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function toIso(value) {
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis()).toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "number") return new Date(value).toISOString();
  return "";
}

function timestampMs(value) {
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

async function assertAdmin(request) {
  const uid = clean(request.auth?.uid || "", 128);
  if (!uid) throw new HttpsError("unauthenticated", "관리자 로그인이 필요합니다.");
  if (!await isAdminUid(uid)) throw new HttpsError("permission-denied", "관리자 권한이 없습니다.");
  return uid;
}

async function getActiveCampaign(source, code) {
  const normalizedSource = normalizeSource(source);
  const normalizedCode = normalizeCampaignCode(code);
  if (!normalizedSource || !normalizedCode) return null;
  const snap = await admin.firestore().collection("twoweeksMarketingCampaigns").doc(normalizedCode).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  if (data.active === false || normalizeSource(data.source) !== normalizedSource) return null;
  return { id: snap.id, ...data, source: normalizedSource, code: normalizedCode };
}

function activeApplication(application = {}) {
  return application.isDummy !== true && application.testMode !== true &&
    application.status !== "withdrawn" && application.withdrawal?.status !== "completed";
}

async function findReferralCandidates(name, last4, excludedUid = "") {
  if (!name || !/^\d{4}$/.test(last4)) return [];
  const snap = await admin.firestore().collection("twoweeksApplications")
    .where("basic.name", "==", name).limit(30).get();

  return snap.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => {
    const phone = onlyDigits(item?.basic?.phoneNormalized || item?.basic?.phone || "");
    return activeApplication(item) && phone.endsWith(last4) && clean(item.uid, 128) !== excludedUid;
  });
}

async function resolveReferral(input = {}, excludedUid = "") {
  const name = clean(input.name || input.referrerName, 40);
  const last4 = onlyDigits(input.phoneLast4 || input.referrerPhoneLast4).slice(-4);
  const createdAt = admin.firestore.FieldValue.serverTimestamp();
  if (!name && !last4) {
    return {
      referredByUserId: null,
      referrerNameInput: "",
      referrerPhoneLast4Input: "",
      status: "none",
      createdAt,
    };
  }
  if (!name || !/^\d{4}$/.test(last4)) {
    return {
      referredByUserId: null,
      referrerNameInput: name,
      referrerPhoneLast4Input: last4,
      status: "needs_review",
      createdAt,
    };
  }

  const candidates = await findReferralCandidates(name, last4, excludedUid);
  return {
    referredByUserId: candidates.length === 1 ? clean(candidates[0].uid, 128) || null : null,
    referrerNameInput: name,
    referrerPhoneLast4Input: last4,
    status: candidates.length === 1 ? "verified" : candidates.length === 0 ? "not_found" : "needs_review",
    createdAt,
  };
}

async function resolveApplicationMarketingData(incoming = {}, ownerUid = "") {
  const input = incoming.marketingAttributionInput || {};
  const firstCampaign = await getActiveCampaign(input.firstSource, input.firstCampaign);
  const lastCampaign = await getActiveCampaign(input.lastSource, input.lastCampaign);
  const canonicalFirst = firstCampaign || null;
  const canonicalLast = lastCampaign || canonicalFirst;
  const selfReportedSource = SELF_REPORTED_VALUES.has(clean(incoming.selfReportedSourceInput?.source, 40))
    ? clean(incoming.selfReportedSourceInput.source, 40)
    : "";
  const selfReportedSourceDetail = selfReportedSource === "other"
    ? clean(incoming.selfReportedSourceInput?.detail, 100)
    : "";

  // Referral invite binding is validated server-side; no UID is trusted from the URL.
  const inviteCode = clean(incoming.referralInput?.inviteCode, 80);
  let resolvedInvite = null;
  if (inviteCode) {
    resolvedInvite = await require("./twoWeeksReferralProgram").resolveInviteCode(inviteCode, ownerUid);
  }
  const manualInput = incoming.referralInput || {};
  const hasManualInput = Boolean(clean(manualInput.name, 40) || clean(manualInput.phoneLast4, 10));
  let referral = resolvedInvite && !hasManualInput
    ? {
        referredByUserId: resolvedInvite.referrerUid,
        referrerNameInput: "",
        referrerPhoneLast4Input: "",
        status: "verified",
        source: "invite_link",
        inviteHash: resolvedInvite.codeHash,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }
    : await resolveReferral(manualInput, ownerUid);
  if (resolvedInvite && hasManualInput && referral.referredByUserId !== resolvedInvite.referrerUid) {
    // Conflicting manual and link referrals are never silently assigned.
    referral = { ...referral, referredByUserId: null, status: "needs_review", inviteHash: resolvedInvite.codeHash, source: "conflict" };
  } else if (resolvedInvite && hasManualInput && referral.referredByUserId === resolvedInvite.referrerUid) {
    referral = { ...referral, source: "invite_link", inviteHash: resolvedInvite.codeHash };
  }
  if (referral.status === "verified") {
    const snapshot = await admin.firestore().collection("twoweeksReferralEvents").where("active", "==", true).limit(20).get();
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
    const event = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(e => (!e.startAt || e.startAt <= today) && (!e.endAt || e.endAt >= today))
      .sort((a,b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))[0];
    if (event) referral = { ...referral, rewardEventSnapshot: { eventId: event.id, rewardName: event.rewardName || "", rewardDetails: event.rewardDetails || "", conditions: event.conditions || "", enrolledDate: today } };
  }
  return {
    marketingAttribution: {
      firstSource: canonicalFirst?.source || (referral.source === "invite_link" && referral.status === "verified" ? "referral" : "direct"),
      firstCampaign: canonicalFirst?.code || "",
      firstLandingAtClient: canonicalFirst ? clean(input.firstLandingAtClient, 80) : "",
      lastSource: canonicalLast?.source || canonicalFirst?.source || (referral.source === "invite_link" && referral.status === "verified" ? "referral" : "direct"),
      lastCampaign: canonicalLast?.code || canonicalFirst?.code || "",
      lastLandingAtClient: canonicalLast ? clean(input.lastLandingAtClient, 80) : "",
      registeredAt: admin.firestore.FieldValue.serverTimestamp(),
      validation: canonicalFirst ? "campaign_verified" : referral.source === "invite_link" && referral.status === "verified" ? "invite_link_verified" : "direct",
    },
    selfReportedSource,
    selfReportedSourceDetail,
    referral,
  };
}

const trackTwoWeeksCampaignVisit = onCall({ region: REGION }, async (request) => {
  const source = normalizeSource(request.data?.source);
  const campaign = normalizeCampaignCode(request.data?.campaign);
  const visitorId = clean(request.data?.visitorId, 100);
  const landingPath = clean(request.data?.landingPath || "/2weeks", 160);
  if (!/^[A-Za-z0-9_-]{12,100}$/.test(visitorId)) {
    throw new HttpsError("invalid-argument", "방문 식별정보가 올바르지 않습니다.");
  }

  const campaignData = await getActiveCampaign(source, campaign);
  if (!campaignData) return { ok: true, tracked: false, reason: "inactive_or_unknown_campaign" };

  const visitId = `${campaign}_${sha256(`${campaign}:${visitorId}`).slice(0, 32)}`;
  const ref = admin.firestore().collection("twoweeksCampaignVisits").doc(visitId);
  const existing = await ref.get();
  if (existing.exists) return { ok: true, tracked: false, duplicate: true };

  await ref.create({
    campaignCode: campaign,
    source,
    visitorHash: sha256(visitorId),
    landingPath,
    firstSeenAt: admin.firestore.FieldValue.serverTimestamp(),
  }).catch((error) => {
    if (String(error?.code || "").includes("already-exists") || Number(error?.code) === 6) return;
    throw error;
  });
  return { ok: true, tracked: true };
});

const createTwoWeeksMarketingCampaign = onCall({ region: REGION }, async (request) => {
  const adminUid = await assertAdmin(request);
  const source = normalizeSource(request.data?.source);
  const name = clean(request.data?.name, 80);
  const code = normalizeCampaignCode(request.data?.code);
  const note = clean(request.data?.note, 240);
  if (!SOURCE_VALUES.has(source) || source === "direct") {
    throw new HttpsError("invalid-argument", "채널을 다시 선택해주세요.");
  }
  if (!name) throw new HttpsError("invalid-argument", "캠페인명을 입력해주세요.");
  if (!/^[A-Z0-9][A-Z0-9_-]{2,59}$/.test(code)) {
    throw new HttpsError("invalid-argument", "캠페인 코드는 영문 대문자·숫자·_- 조합 3~60자로 입력해주세요.");
  }

  const ref = admin.firestore().collection("twoweeksMarketingCampaigns").doc(code);
  await admin.firestore().runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (snap.exists) throw new HttpsError("already-exists", "이미 사용 중인 캠페인 코드입니다.");
    transaction.create(ref, {
      source,
      name,
      code,
      note,
      active: true,
      url: `${SITE_URL}?source=${encodeURIComponent(source)}&campaign=${encodeURIComponent(code)}`,
      createdByUid: adminUid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  return { ok: true, code };
});

const setTwoWeeksMarketingCampaignStatus = onCall({ region: REGION }, async (request) => {
  const adminUid = await assertAdmin(request);
  const code = normalizeCampaignCode(request.data?.code);
  const active = request.data?.active === true;
  const ref = admin.firestore().collection("twoweeksMarketingCampaigns").doc(code);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "캠페인을 찾을 수 없습니다.");
  await ref.update({
    active,
    updatedByUid: adminUid,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { ok: true, code, active };
});

const setTwoWeeksReferralResolution = onCall({ region: REGION }, async (request) => {
  const adminUid = await assertAdmin(request);
  const applicationId = clean(request.data?.applicationId, 100);
  const referrerApplicationId = clean(request.data?.referrerApplicationId, 100);
  const clearResolution = request.data?.clear === true;
  const db = admin.firestore();
  const applicationRef = db.collection("twoweeksApplications").doc(applicationId);
  const applicationSnap = await applicationRef.get();
  if (!applicationSnap.exists) throw new HttpsError("not-found", "신규 가입회원 정보를 찾을 수 없습니다.");

  let referredByUserId = null;
  if (!clearResolution) {
    const candidateSnap = await db.collection("twoweeksApplications").doc(referrerApplicationId).get();
    if (!candidateSnap.exists || !activeApplication(candidateSnap.data() || {})) {
      throw new HttpsError("not-found", "연결할 추천회원 정보를 찾을 수 없습니다.");
    }
    referredByUserId = clean(candidateSnap.data()?.uid, 128);
    if (!referredByUserId) throw new HttpsError("failed-precondition", "추천회원 UID를 확인할 수 없습니다.");
  }

  const status = clearResolution ? "none" : "verified";
  const batch = db.batch();
  batch.update(applicationRef, {
    "referral.referredByUserId": referredByUserId,
    "referral.status": status,
    "referral.resolvedByAdmin": true,
    "referral.resolvedByUid": adminUid,
    "referral.resolvedAt": admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  batch.set(db.collection("twoweeksMarketingAuditLogs").doc(), {
    action: clearResolution ? "referral_cleared" : "referral_connected",
    applicationId,
    referrerApplicationId: clearResolution ? "" : referrerApplicationId,
    referredByUserId,
    adminUid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await batch.commit();
  return { ok: true, applicationId, status };
});

function isApproved(application = {}) {
  return application.reviewStatus === "approved" || ["approved", "proposed", "confirmed", "completed"].includes(application.status);
}

function meetingCompleted(match = {}) {
  return match.status === "completed" ||
    ["feedback_requested", "completed"].includes(match.meetingStatus) ||
    ["partial", "completed", "issue_reported", "reviewed", "timeout_processed"].includes(match.feedbackStatus);
}

function applicationCreatedMs(application = {}) {
  return timestampMs(application.submittedAt || application.createdAt || application.completedAtClient);
}

function publicCampaign(campaign = {}) {
  return {
    source: normalizeSource(campaign.source),
    name: clean(campaign.name, 80),
    code: normalizeCampaignCode(campaign.code || campaign.id),
    note: clean(campaign.note, 240),
    active: campaign.active !== false,
    url: clean(campaign.url, 500),
    createdAt: toIso(campaign.createdAt),
  };
}

const getTwoWeeksMarketingDashboard = onCall({ region: REGION, timeoutSeconds: 60 }, async (request) => {
  await assertAdmin(request);
  const period = ["7d", "30d", "all"].includes(request.data?.period) ? request.data.period : "all";
  const threshold = period === "7d" ? Date.now() - 7 * 86400000 : period === "30d" ? Date.now() - 30 * 86400000 : 0;
  const db = admin.firestore();
  const [campaignSnap, visitSnap, applicationSnap, matchSnap] = await Promise.all([
    db.collection("twoweeksMarketingCampaigns").get(),
    db.collection("twoweeksCampaignVisits").get(),
    db.collection("twoweeksApplications").get(),
    db.collection("twoweeksMatches").get(),
  ]);
  const campaigns = campaignSnap.docs.map((item) => ({ id: item.id, ...item.data() })).map(publicCampaign);
  const allApplications = applicationSnap.docs.map((item) => ({ id: item.id, ...item.data() }))
    .filter(activeApplication);
  const applications = allApplications.filter((item) => !threshold || applicationCreatedMs(item) >= threshold);
  const visits = visitSnap.docs.map((item) => ({ id: item.id, ...item.data() }))
    .filter((item) => !threshold || timestampMs(item.firstSeenAt) >= threshold);
  const matches = matchSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
  const matchesByApplicationId = new Map();
  matches.forEach((match) => {
    [match.maleApplicationId, match.femaleApplicationId].filter(Boolean).forEach((applicationId) => {
      const list = matchesByApplicationId.get(applicationId) || [];
      list.push(match);
      matchesByApplicationId.set(applicationId, list);
    });
  });

  const campaignStats = campaigns.map((campaign) => {
    const rows = applications.filter((item) => normalizeCampaignCode(item.marketingAttribution?.firstCampaign) === campaign.code);
    const approved = rows.filter(isApproved);
    const eligible = approved.filter((item) => isParticipationEligible(item.deposit || {}));
    const proposed = rows.filter((item) => (matchesByApplicationId.get(item.id) || []).length > 0 || Number(item.proposalCount || 0) > 0);
    const completed = rows.filter((item) => (matchesByApplicationId.get(item.id) || []).some(meetingCompleted));
    return {
      ...campaign,
      visits: visits.filter((item) => normalizeCampaignCode(item.campaignCode) === campaign.code).length,
      signups: rows.length,
      approved: approved.length,
      matchingEligible: eligible.length,
      proposed: proposed.length,
      completed: completed.length,
    };
  });

  const channelMap = new Map();
  applications.forEach((application) => {
    const source = normalizeSource(application.marketingAttribution?.firstSource) || "record_none";
    const current = channelMap.get(source) || { source, signups: 0, approved: 0, matchingEligible: 0, proposed: 0, completed: 0 };
    current.signups += 1;
    if (isApproved(application)) current.approved += 1;
    if (isApproved(application) && isParticipationEligible(application.deposit || {})) current.matchingEligible += 1;
    const applicationMatches = matchesByApplicationId.get(application.id) || [];
    if (applicationMatches.length || Number(application.proposalCount || 0) > 0) current.proposed += 1;
    if (applicationMatches.some(meetingCompleted)) current.completed += 1;
    channelMap.set(source, current);
  });
  visits.forEach((visit) => {
    const source = normalizeSource(visit.source) || "record_none";
    const current = channelMap.get(source) || { source, signups: 0, approved: 0, matchingEligible: 0, proposed: 0, completed: 0 };
    current.visits = Number(current.visits || 0) + 1;
    channelMap.set(source, current);
  });

  const applicationByUid = new Map(allApplications.map((item) => [clean(item.uid, 128), item]));
  const referralRows = [];
  for (const application of applications) {
    const referral = application.referral;
    if (!referral) continue;
    const verifiedReferrer = referral.referredByUserId ? applicationByUid.get(clean(referral.referredByUserId, 128)) : null;
    let candidates = [];
    if (["needs_review", "not_found"].includes(referral.status)) {
      const inputName = clean(referral.referrerNameInput, 40);
      const inputLast4 = onlyDigits(referral.referrerPhoneLast4Input).slice(-4);
      candidates = allApplications.filter((candidate) => {
        const candidatePhone = onlyDigits(candidate.basic?.phoneNormalized || candidate.basic?.phone || "");
        return inputName && /^\d{4}$/.test(inputLast4) &&
          clean(candidate.basic?.name, 40) === inputName && candidatePhone.endsWith(inputLast4) &&
          clean(candidate.uid, 128) !== clean(application.uid, 128);
      });
    }
    referralRows.push({
      applicationId: application.id,
      memberName: clean(application.basic?.name || application.basic?.nickname || "신규회원", 40),
      memberStatus: clean(application.reviewStatus || application.status || "", 40),
      createdAt: toIso(application.submittedAt || application.createdAt || application.completedAtClient),
      status: clean(referral.status || "none", 30),
      referrerNameInput: clean(referral.referrerNameInput, 40),
      referrerPhoneLast4Input: onlyDigits(referral.referrerPhoneLast4Input).slice(-4),
      verifiedReferrerName: clean(verifiedReferrer?.basic?.name || verifiedReferrer?.basic?.nickname || "", 40),
      candidates: candidates.map((candidate) => ({
        applicationId: candidate.id,
        name: clean(candidate.basic?.name || candidate.basic?.nickname || "회원", 40),
        phoneLast4: onlyDigits(candidate.basic?.phoneNormalized || candidate.basic?.phone || "").slice(-4),
      })),
    });
  }

  const totalVisits = visits.length;
  const totalSignups = applications.length;
  const campaignAttributedSignups = applications.filter((item) =>
    Boolean(normalizeCampaignCode(item.marketingAttribution?.firstCampaign))
  ).length;
  const referralPerformanceMap = new Map();
  applications.filter((item) => item.referral?.status === "verified" && item.referral?.referredByUserId).forEach((item) => {
    const referrerUid = clean(item.referral.referredByUserId, 128);
    const referrer = applicationByUid.get(referrerUid);
    const current = referralPerformanceMap.get(referrerUid) || {
      referrerUid,
      referrerName: clean(referrer?.basic?.name || referrer?.basic?.nickname || "회원", 40),
      signupCount: 0,
      approvedCount: 0,
      proposedCount: 0,
      completedCount: 0,
    };
    current.signupCount += 1;
    if (isApproved(item)) current.approvedCount += 1;
    const applicationMatches = matchesByApplicationId.get(item.id) || [];
    if (applicationMatches.length || Number(item.proposalCount || 0) > 0) current.proposedCount += 1;
    if (applicationMatches.some(meetingCompleted)) current.completedCount += 1;
    referralPerformanceMap.set(referrerUid, current);
  });
  return {
    ok: true,
    period,
    generatedAt: new Date().toISOString(),
    summary: {
      visits: totalVisits,
      signups: totalSignups,
      conversionRate: totalVisits ? Math.round((campaignAttributedSignups / totalVisits) * 1000) / 10 : 0,
      approved: applications.filter(isApproved).length,
      matchingEligible: applications.filter((item) => isApproved(item) && isParticipationEligible(item.deposit || {})).length,
      proposed: applications.filter((item) => (matchesByApplicationId.get(item.id) || []).length > 0 || Number(item.proposalCount || 0) > 0).length,
      completed: applications.filter((item) => (matchesByApplicationId.get(item.id) || []).some(meetingCompleted)).length,
    },
    campaigns: campaignStats,
    channels: Array.from(channelMap.values()).sort((a, b) => Number(b.signups || 0) - Number(a.signups || 0)),
    referrals: referralRows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    referralPerformance: Array.from(referralPerformanceMap.values())
      .sort((a, b) => b.signupCount - a.signupCount),
  };
});

module.exports = {
  trackTwoWeeksCampaignVisit,
  createTwoWeeksMarketingCampaign,
  setTwoWeeksMarketingCampaignStatus,
  setTwoWeeksReferralResolution,
  getTwoWeeksMarketingDashboard,
  resolveApplicationMarketingData,
  __test: {
    normalizeSource,
    normalizeCampaignCode,
    meetingCompleted,
  },
};

