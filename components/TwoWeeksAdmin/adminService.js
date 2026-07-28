import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, sendLms } from "firebaseConfig";
import { makeDummyApplication } from "./dummyData";
import {
  getApplicationName,
  getApplicationSortValue,
  getBasic,
  getRoundId,
  getTimestampMs,
  normalizePhone,
} from "./utils";
import { DEFAULT_ROUND_ID, DEFAULT_ROUND_LABEL } from "./constants";

const RESPONSE_DUE_DAYS = 2;
const SCHEDULE_DUE_DAYS = 2;

const DEFAULT_CAFE_CANDIDATES = [
  ["강남구", "알베르 강남역", "신논현/강남", "강남역권 대형 카페 · 접근성 좋음", "알베르 강남역"],
  ["강남구", "어퍼앤언더 강남역", "강남/신논현", "디저트 카페 · 데이트/대화 무드", "어퍼앤언더 강남역"],
  ["강남구", "셀렉티드 닉스 강남역", "강남역", "강남 시내뷰 · 분위기형 카페", "셀렉티드 닉스 강남역"],
  ["서초구", "아펜즈커피 서초교대점", "교대", "1,2층 넓은 공간 · 교대역 접근성", "아펜즈커피 서초교대점"],
  ["서초구", "빈브라더스 파미에스테이션", "고속터미널", "파미에스테이션 내 접근성 · 좌석 안정", "빈브라더스 파미에스테이션"],
  ["서초구", "스타벅스 파미에파크R점", "고속터미널", "상징성 있는 대형 매장 · 위치 찾기 쉬움", "스타벅스 파미에파크R점"],
  ["동작구", "낙타날다", "사당", "사당역권 카페 · 모임/대화 후보", "낙타날다 사당"],
  ["동작구", "카페 라르고", "사당", "1,2층 카페 · 조용한 대화 후보", "카페 라르고 사당"],
  ["동작구", "스타벅스 이수역13번출구점", "이수", "이수역 접근성 · 위치 설명 쉬움", "스타벅스 이수역13번출구점"],
  ["관악구", "팀홀튼 서울대입구역점", "서울대입구", "공간 넓은 편 · 서울대입구역 접근성", "팀홀튼 서울대입구역점"],
  ["관악구", "스타벅스 서울대입구역8번출구점", "서울대입구", "넓은 매장 후보 · 위치 찾기 쉬움", "스타벅스 서울대입구역8번출구점"],
  ["관악구", "카페 버터럼 서울대입구역", "서울대입구", "데이트 무드 · 디저트/카이막 후보", "카페 버터럼 서울대입구역"],
  ["영등포구", "테디뵈르하우스 더현대서울점", "여의도", "더현대서울 내 위치 · 찾기 쉬움", "테디뵈르하우스 더현대서울점"],
  ["영등포구", "킵댓 여의도점", "여의도", "여의도 로스터리 카페 · 데이트 후보", "킵댓 여의도점"],
  ["영등포구", "커피빈 현대자동차여의도점", "여의도", "체인형 안정성 · 여의도 접근성", "커피빈 현대자동차여의도점"],
].map(([area, name, station, reason, mapQuery], index) => ({
  area,
  name,
  station,
  reason,
  mapQuery,
  mapUrl: `https://map.naver.com/p/search/${encodeURIComponent(mapQuery)}`,
  status: "active",
  verificationStatus: "needs_check",
  sortOrder: index + 1,
}));

export function subscribeTwoWeeksAdminData({ onApplications, onResponses, onMatches }) {
  const unsubApplications = onSnapshot(
    collection(db, "twoweeksApplications"),
    (snapshot) => {
      const rows = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => getApplicationSortValue(b) - getApplicationSortValue(a));

      onApplications(rows);
    },
    (error) => {
      console.error("[TwoWeeksAdmin] applications snapshot error:", error);
    }
  );

  const unsubResponses = onSnapshot(
    collection(db, "twoweeksProposalResponses"),
    (snapshot) => {
      const rows = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => getTimestampMs(b.respondedAt || b.createdAt) - getTimestampMs(a.respondedAt || a.createdAt));

      onResponses(rows);
    },
    (error) => {
      console.error("[TwoWeeksAdmin] responses snapshot error:", error);
    }
  );

  const unsubMatches = onSnapshot(
    collection(db, "twoweeksMatches"),
    (snapshot) => {
      const rows = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => getTimestampMs(b.updatedAt || b.createdAt) - getTimestampMs(a.updatedAt || a.createdAt));

      onMatches(rows);
    },
    (error) => {
      console.error("[TwoWeeksAdmin] matches snapshot error:", error);
    }
  );

  return () => {
    unsubApplications();
    unsubResponses();
    unsubMatches();
  };
}

export function subscribeTwoWeeksRounds(onRounds) {
  return onSnapshot(
    collection(db, "twoweeksRounds"),
    (snapshot) => {
      const rows = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => {
          const aValue = getTimestampMs(a.meetingStartAtClient || a.applyOpenAtClient || a.createdAt);
          const bValue = getTimestampMs(b.meetingStartAtClient || b.applyOpenAtClient || b.createdAt);
          return bValue - aValue;
        });

      onRounds(rows);
    },
    (error) => {
      console.error("[TwoWeeksAdmin] rounds snapshot error:", error);
    }
  );
}

export async function seedDefaultTwoWeeksRound(adminUid = "") {
  const nowClient = new Date().toISOString();
  const roundRef = doc(db, "twoweeksRounds", DEFAULT_ROUND_ID);

  await setDoc(
    roundRef,
    {
      label: DEFAULT_ROUND_LABEL,
      status: "open",
      memo: "기본 MVP 운영 회차",
      createdByUid: adminUid,
      createdAt: serverTimestamp(),
      createdAtClient: nowClient,
      updatedAt: serverTimestamp(),
      updatedAtClient: nowClient,
    },
    { merge: true }
  );

  return DEFAULT_ROUND_ID;
}

export async function createTwoWeeksRound({ payload = {}, adminUid = "" }) {
  const label = String(payload.label || "").trim();
  if (!label) throw new Error("회차명을 입력해주세요.");

  const nowClient = new Date().toISOString();
  const docRef = await addDoc(collection(db, "twoweeksRounds"), {
    label,
    status: payload.status || "draft",
    applyOpenAtClient: payload.applyOpenAtClient || "",
    applyCloseAtClient: payload.applyCloseAtClient || "",
    proposalStartAtClient: payload.proposalStartAtClient || "",
    scheduleDueAtClient: payload.scheduleDueAtClient || "",
    meetingStartAtClient: payload.meetingStartAtClient || "",
    meetingEndAtClient: payload.meetingEndAtClient || "",
    memo: String(payload.memo || "").trim(),
    createdByUid: adminUid,
    createdAt: serverTimestamp(),
    createdAtClient: nowClient,
    updatedAt: serverTimestamp(),
    updatedAtClient: nowClient,
  });

  return docRef.id;
}

export async function updateTwoWeeksRound(roundId = "", patch = {}, adminUid = "") {
  if (!roundId) throw new Error("수정할 회차 정보가 없습니다.");

  const cleanPatch = { ...patch };
  delete cleanPatch.id;

  await updateDoc(doc(db, "twoweeksRounds", roundId), {
    ...cleanPatch,
    updatedByUid: adminUid,
    updatedAt: serverTimestamp(),
    updatedAtClient: new Date().toISOString(),
  });
}

export async function updateTwoWeeksApplication(applicationId, patch) {
  if (!applicationId || !patch) return;
  await updateDoc(doc(db, "twoweeksApplications", applicationId), patch);
}

export function subscribeCafeCandidates(onCafes) {
  return onSnapshot(
    collection(db, "twoweeksCafeCandidates"),
    (snapshot) => {
      const rows = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => {
          const areaCompare = String(a.area || "").localeCompare(String(b.area || ""), "ko");
          if (areaCompare) return areaCompare;

          const sortCompare = Number(a.sortOrder || 999) - Number(b.sortOrder || 999);
          if (sortCompare) return sortCompare;

          return String(a.name || "").localeCompare(String(b.name || ""), "ko");
        });

      onCafes(rows);
    },
    (error) => {
      console.error("[TwoWeeksAdmin] cafes snapshot error:", error);
    }
  );
}

export async function seedDefaultCafeCandidates(adminUid = "") {
  const snap = await getDocs(collection(db, "twoweeksCafeCandidates"));
  const existingKeys = new Set(
    snap.docs.map((item) => {
      const data = item.data() || {};
      return `${data.area || ""}__${data.name || ""}`;
    })
  );

  let created = 0;
  const nowClient = new Date().toISOString();

  for (const cafe of DEFAULT_CAFE_CANDIDATES) {
    const key = `${cafe.area}__${cafe.name}`;
    if (existingKeys.has(key)) continue;

    await addDoc(collection(db, "twoweeksCafeCandidates"), {
      ...cafe,
      createdAt: serverTimestamp(),
      createdAtClient: nowClient,
      createdByUid: adminUid,
      updatedAt: serverTimestamp(),
    });
    created += 1;
  }

  return { created };
}

export async function createCafeCandidate(payload = {}, adminUid = "") {
  const name = String(payload.name || "").trim();
  const area = String(payload.area || "").trim();

  if (!name || !area) throw new Error("지역과 카페명을 입력해주세요.");

  const mapQuery = String(payload.mapQuery || `${name}`).trim();
  const nowClient = new Date().toISOString();

  const docRef = await addDoc(collection(db, "twoweeksCafeCandidates"), {
    area,
    name,
    station: String(payload.station || "").trim(),
    reason: String(payload.reason || "").trim(),
    mapQuery,
    mapUrl: String(payload.mapUrl || `https://map.naver.com/p/search/${encodeURIComponent(mapQuery)}`).trim(),
    status: payload.status || "active",
    verificationStatus: payload.verificationStatus || "needs_check",
    sortOrder: Number(payload.sortOrder || 999),
    createdAt: serverTimestamp(),
    createdAtClient: nowClient,
    createdByUid: adminUid,
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateCafeCandidate(cafeId = "", patch = {}, adminUid = "") {
  if (!cafeId) throw new Error("수정할 카페 정보가 없습니다.");

  const { id, ...restPatch } = patch || {};
  const cleanPatch = {
    ...restPatch,
    updatedAt: serverTimestamp(),
    updatedAtClient: new Date().toISOString(),
    updatedByUid: adminUid,
  };

  if (typeof cleanPatch.name === "string") cleanPatch.name = cleanPatch.name.trim();
  if (typeof cleanPatch.area === "string") cleanPatch.area = cleanPatch.area.trim();
  if (typeof cleanPatch.station === "string") cleanPatch.station = cleanPatch.station.trim();
  if (typeof cleanPatch.reason === "string") cleanPatch.reason = cleanPatch.reason.trim();
  if (typeof cleanPatch.mapQuery === "string") cleanPatch.mapQuery = cleanPatch.mapQuery.trim();

  if (cleanPatch.lastVerifiedAt instanceof Date) {
    cleanPatch.lastVerifiedAtClient = cleanPatch.lastVerifiedAt.toISOString();
    delete cleanPatch.lastVerifiedAt;
  }

  if (typeof cleanPatch.mapQuery === "string" && cleanPatch.mapQuery && !cleanPatch.mapUrl) {
    cleanPatch.mapUrl = `https://map.naver.com/p/search/${encodeURIComponent(cleanPatch.mapQuery)}`;
  }

  await updateDoc(doc(db, "twoweeksCafeCandidates", cafeId), cleanPatch);
}

export async function deleteCafeCandidate(cafeId = "") {
  if (!cafeId) throw new Error("삭제할 카페 정보가 없습니다.");
  await deleteDoc(doc(db, "twoweeksCafeCandidates", cafeId));
}

export async function markAllCafeCandidatesNeedCheck(adminUid = "") {
  const snap = await getDocs(collection(db, "twoweeksCafeCandidates"));
  const nowClient = new Date().toISOString();

  await Promise.all(
    snap.docs.map((item) =>
      updateDoc(item.ref, {
        verificationStatus: "needs_check",
        lastBulkCheckRequestedAt: serverTimestamp(),
        lastBulkCheckRequestedAtClient: nowClient,
        lastBulkCheckRequestedByUid: adminUid,
        updatedAt: serverTimestamp(),
      })
    )
  );

  return { count: snap.docs.length };
}

function addDaysClient(days = 2) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function getApplicationPhone(application = {}) {
  const basic = getBasic(application);
  return normalizePhone(basic.phoneNormalized || basic.phone || application?.phoneIdentityVerification?.phone);
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

function buildApprovalMessage(application = {}) {
  const basic = getBasic(application);
  const name = basic.name || basic.nickname || "신청자";
  const dashboardUrl = getDashboardUrl(application);

  return [
    "[투윅스] 신청이 승인되었습니다.",
    `${name}님, 투윅스 신청 검토가 완료되었습니다.`,
    "",
    "매칭 진행을 위해 예치금 입금 확인이 필요합니다.",
    "예치금: 20,000원",
    "입금계좌: 하나은행 112-891138-99107 전세환",
    "",
    "정상 참여 시 예치금은 환급 또는 다음 회차 크레딧으로 처리됩니다.",
    "노쇼 또는 당일 취소 시 환급이 제한될 수 있습니다.",
    "",
    "신청현황 확인:",
    dashboardUrl,
  ].join(String.fromCharCode(10));
}

function buildIncompleteMessage(application = {}) {
  const basic = getBasic(application);
  const name = basic.name || basic.nickname || "신청자";
  const dashboardUrl = getDashboardUrl(application);

  return [
    "[투윅스] 신청 정보 보완이 필요합니다.",
    `${name}님, 프로필 검토 중 확인이 필요한 항목이 있습니다.`,
    "",
    "사진, 직업/회사 정보, 인증자료 등을 확인한 뒤 다시 제출해주세요.",
    "",
    "신청현황 확인:",
    dashboardUrl,
  ].join(String.fromCharCode(10));
}

async function approveApplicationRecord(application = {}, adminUid = "") {
  if (!application?.id) return null;

  await updateDoc(doc(db, "twoweeksApplications", application.id), {
    status: "approved",
    reviewStatus: "approved",
    approvedAt: serverTimestamp(),
    approvedAtClient: new Date().toISOString(),
    approvedByUid: adminUid,
    updatedAt: serverTimestamp(),
  });

  return application.id;
}

async function sendApprovalSms(application = {}) {
  const phone = getApplicationPhone(application);

  if (!phone) {
    return {
      status: "skipped",
      reason: "NO_PHONE",
    };
  }

  try {
    await sendLms(phone, buildApprovalMessage(application), "투윅스 신청 승인", {
      forceLms: true,
    });

    return {
      status: "sent",
      phone,
      sentAtClient: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[TwoWeeksAdmin] approval sms failed:", error);

    return {
      status: "failed",
      phone,
      errorMessage: error?.message || String(error),
      failedAtClient: new Date().toISOString(),
    };
  }
}

export async function approveApplicationWithSms(application = {}, adminUid = "") {
  if (!application?.id) return null;

  await approveApplicationRecord(application, adminUid);
  const sms = await sendApprovalSms(application);

  await updateDoc(doc(db, "twoweeksApplications", application.id), {
    approvalSms: sms,
    approvalSmsUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    applicationId: application.id,
    sms,
  };
}

export async function approveApplicationsWithSms(applications = [], adminUid = "") {
  const targets = applications.filter((item) => item?.id);
  const results = [];

  for (const application of targets) {
    const result = await approveApplicationWithSms(application, adminUid);
    if (result) results.push(result);
  }

  return results;
}

export async function approveApplicationsWithoutSms(applications = [], adminUid = "") {
  const targets = applications.filter((item) => item?.id);
  const results = [];

  for (const application of targets) {
    await approveApplicationRecord(application, adminUid);
    results.push(application.id);
  }

  return results;
}

export async function sendIncompleteApplicationSms(application = {}) {
  if (!application?.id) return null;

  const phone = getApplicationPhone(application);

  if (!phone) {
    return {
      status: "skipped",
      reason: "NO_PHONE",
    };
  }

  try {
    await sendLms(phone, buildIncompleteMessage(application), "투윅스 정보 보완", {
      forceLms: true,
    });

    const result = {
      status: "sent",
      phone,
      sentAtClient: new Date().toISOString(),
    };

    await updateDoc(doc(db, "twoweeksApplications", application.id), {
      reviewStatus: "incomplete",
      incompleteSms: result,
      incompleteSmsUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return result;
  } catch (error) {
    console.error("[TwoWeeksAdmin] incomplete sms failed:", error);

    const result = {
      status: "failed",
      phone,
      errorMessage: error?.message || String(error),
      failedAtClient: new Date().toISOString(),
    };

    await updateDoc(doc(db, "twoweeksApplications", application.id), {
      incompleteSms: result,
      incompleteSmsUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch(() => {});

    return result;
  }
}

export async function confirmDepositApplications(applications = [], adminUid = "") {
  const targets = applications.filter((item) => item?.id);

  await Promise.all(
    targets.map((application) =>
      updateDoc(doc(db, "twoweeksApplications", application.id), {
        "deposit.status": "confirmed",
        "deposit.confirmedAt": serverTimestamp(),
        "deposit.confirmedAtClient": new Date().toISOString(),
        "deposit.confirmedByUid": adminUid,
        matchingStatus: "not_started",
        updatedAt: serverTimestamp(),
      })
    )
  );

  return targets.length;
}

function getProposalDashboardUrl(application = {}) {
  return getDashboardUrl(application);
}

function buildProposalMessage(application = {}, candidate = {}) {
  const basic = getBasic(application);
  const candidateBasic = getBasic(candidate);
  const name = basic.name || basic.nickname || "신청자";
  const dashboardUrl = getProposalDashboardUrl(application);

  return [
    "[투윅스] 이번 회차 후보가 도착했습니다.",
    `${name}님, 확인 가능한 매칭 후보가 준비되었습니다.`,
    "",
    "신청현황 페이지에서 대상후보 탭을 확인한 뒤 2일 내 응답해주세요.",
    "양쪽 모두 만남 진행 의사가 확인되면 일정/지역 조율 단계가 열립니다.",
    "",
    candidateBasic.age ? `후보 정보: ${candidateBasic.age}세 / ${candidate?.identity?.jobCategory || "직장인"}` : null,
    "",
    "신청현황 확인:",
    dashboardUrl,
  ]
    .filter((line) => line !== null)
    .join(String.fromCharCode(10));
}

async function sendProposalSms(application = {}, candidate = {}) {
  const phone = getApplicationPhone(application);

  if (!phone) {
    return {
      status: "skipped",
      reason: "NO_PHONE",
    };
  }

  try {
    await sendLms(phone, buildProposalMessage(application, candidate), "투윅스 후보 제안", {
      forceLms: true,
    });

    return {
      status: "sent",
      phone,
      sentAtClient: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[TwoWeeksAdmin] proposal sms failed:", error);

    return {
      status: "failed",
      phone,
      errorMessage: error?.message || String(error),
      failedAtClient: new Date().toISOString(),
    };
  }
}

function buildCurrentProposal(candidateApplicationId, matchId) {
  const responseDueAtClient = addDaysClient(RESPONSE_DUE_DAYS);

  return {
    candidateApplicationId,
    matchId,
    status: "proposed",
    response: "pending",
    responseDueDays: RESPONSE_DUE_DAYS,
    responseDueAtClient,
    createdAt: serverTimestamp(),
    createdAtClient: new Date().toISOString(),
  };
}

async function hasExistingPairMatch(maleId = "", femaleId = "") {
  if (!maleId || !femaleId) return false;

  const snap = await getDocs(
    query(
      collection(db, "twoweeksMatches"),
      where("maleApplicationId", "==", maleId),
      where("femaleApplicationId", "==", femaleId)
    )
  );

  return !snap.empty;
}

export async function createTwoWeeksMatch({ male, female, score, adminUid = "" }) {
  if (!male?.id || !female?.id) return null;

  if (await hasExistingPairMatch(male.id, female.id)) {
    throw new Error("이미 같은 상대와 매칭 이력이 있습니다. 중복 매칭은 생성할 수 없습니다.");
  }

  const roundId = getRoundId(male) || getRoundId(female);
  const matchId = `${roundId}_${male.id}_${female.id}`;
  const matchRef = doc(db, "twoweeksMatches", matchId);
  const responseDueAtClient = addDaysClient(RESPONSE_DUE_DAYS);

  await setDoc(
    matchRef,
    {
      roundId,
      maleApplicationId: male.id,
      femaleApplicationId: female.id,
      maleName: getApplicationName(male),
      femaleName: getApplicationName(female),
      status: "proposed",
      proposalStatus: "proposed",
      scheduleStatus: "not_started",
      responseDueDays: RESPONSE_DUE_DAYS,
      responseDueAtClient,
      scoreTotal: score?.total || 0,
      areaOverlap: score?.areaOverlap || [],
      timeOverlap: score?.timeOverlap || [],
      ageDiff: score?.ageDiff ?? null,
      policySnapshot: {
        proposalResponseDueDays: RESPONSE_DUE_DAYS,
        scheduleSelectionDueDays: SCHEDULE_DUE_DAYS,
        firstSelectorWins: true,
        photoRevealAfterScheduleConfirmed: true,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdByUid: adminUid,
    },
    { merge: true }
  );

  await updateDoc(doc(db, "twoweeksApplications", male.id), {
    matchingStatus: "proposed",
    currentProposal: buildCurrentProposal(female.id, matchId),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "twoweeksApplications", female.id), {
    matchingStatus: "proposed",
    currentProposal: buildCurrentProposal(male.id, matchId),
    updatedAt: serverTimestamp(),
  });

  const smsResults = {
    male: await sendProposalSms(male, female),
    female: await sendProposalSms(female, male),
  };

  await setDoc(
    matchRef,
    {
      proposalSms: smsResults,
      proposalSmsUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await updateDoc(doc(db, "twoweeksApplications", male.id), {
    "currentProposal.notificationStatus": smsResults.male.status,
    "currentProposal.notificationUpdatedAt": serverTimestamp(),
    updatedAt: serverTimestamp(),
  }).catch((error) => {
    console.warn("[TwoWeeksAdmin] male proposal sms status update failed:", error);
  });

  await updateDoc(doc(db, "twoweeksApplications", female.id), {
    "currentProposal.notificationStatus": smsResults.female.status,
    "currentProposal.notificationUpdatedAt": serverTimestamp(),
    updatedAt: serverTimestamp(),
  }).catch((error) => {
    console.warn("[TwoWeeksAdmin] female proposal sms status update failed:", error);
  });

  return {
    matchId,
    smsResults,
  };
}

export async function createBulkTwoWeeksMatches({ pairs = [], adminUid = "" }) {
  const results = [];

  for (const pair of pairs) {
    const result = await createTwoWeeksMatch({
      male: pair.male,
      female: pair.female,
      score: pair.score,
      adminUid,
    });

    if (result?.matchId) results.push(result);
  }

  return results;
}

export async function prepareNextRoundApplication({
  applicationId = "",
  match = null,
  mode = "ready",
  adminUid = "",
}) {
  if (!applicationId) throw new Error("다음 회차 처리할 신청자 정보가 없습니다.");

  const matchId = typeof match === "string" ? match : match?.id || "";
  const nowClient = new Date().toISOString();
  const isReady = mode === "ready";

  const applicationPatch = isReady
    ? {
        matchingStatus: "not_started",
        currentProposal: deleteField(),
        schedule: deleteField(),
        scheduleStatus: "not_started",
        meetingStatus: "not_started",
        photoRevealStatus: "hidden",
        nextRoundStatus: "ready",
        lastCompletedMatchId: matchId || "",
        lastCompletedAt: serverTimestamp(),
        lastCompletedAtClient: nowClient,
        updatedAt: serverTimestamp(),
      }
    : {
        matchingStatus: "paused",
        currentProposal: deleteField(),
        schedule: deleteField(),
        scheduleStatus: "paused",
        meetingStatus: "paused",
        photoRevealStatus: "hidden",
        nextRoundStatus: "paused",
        lastCompletedMatchId: matchId || "",
        pausedAt: serverTimestamp(),
        pausedAtClient: nowClient,
        updatedAt: serverTimestamp(),
      };

  await updateDoc(doc(db, "twoweeksApplications", applicationId), applicationPatch);

  if (matchId) {
    await setDoc(
      doc(db, "twoweeksMatches", matchId),
      {
        nextRoundRequests: {
          [applicationId]: {
            applicationId,
            matchId,
            status: isReady ? "queued" : "paused",
            processedByUid: adminUid,
            processedAt: serverTimestamp(),
            processedAtClient: nowClient,
          },
        },
        nextRoundProcessedAt: serverTimestamp(),
        nextRoundProcessedAtClient: nowClient,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  return {
    applicationId,
    matchId,
    status: isReady ? "queued" : "paused",
  };
}

async function getApplicationById(applicationId) {
  if (!applicationId) return null;

  const snap = await getDoc(doc(db, "twoweeksApplications", applicationId));
  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data(),
  };
}

function formatMeetingLine(finalMeeting = {}) {
  const dateLabel = finalMeeting.dateLabel || finalMeeting.displayLabel || "";
  const timeLabel = finalMeeting.timeLabel || "";
  const area = finalMeeting.area || "";
  return [dateLabel, timeLabel, area].filter(Boolean).join(" · ") || "-";
}

function buildFinalMeetingMessage(application = {}, finalMeeting = {}) {
  const basic = getBasic(application);
  const name = basic.name || basic.nickname || "신청자";
  const dashboardUrl = getDashboardUrl(application);

  return [
    "[투윅스] 만남 확정 안내",
    "",
    `일정: ${formatMeetingLine(finalMeeting)}`,
    finalMeeting.placeName ? `장소: ${finalMeeting.placeName}` : null,
    finalMeeting.address ? `주소: ${finalMeeting.address}` : null,
    finalMeeting.mapUrl ? `지도: ${finalMeeting.mapUrl}` : null,
    "",
    "사진과 자세한 안내는 신청현황에서 확인해주세요.",
    "",
    "신청현황:",
    dashboardUrl,
  ]
    .filter((line) => line !== null)
    .join(String.fromCharCode(10));
}


function buildScheduleReminderMessage(application = {}, match = {}) {
  const basic = getBasic(application);
  const name = basic.name || basic.nickname || "신청자";
  const dashboardUrl = getDashboardUrl(application);
  const schedule = match?.schedule || {};
  const status = match?.scheduleStatus || schedule.status || "";

  const actionLine =
    status === "waiting_counterpart" || status === "needs_final_choice"
      ? "상대가 선택한 일정 후보 중 가능한 일정 1개를 선택해주세요."
      : "일정조율 탭에서 가능한 일정/지역 후보를 선택해주세요.";

  return [
    "[투윅스] 일정 선택 안내",
    "",
    actionLine,
    "2일 내 선택해주세요.",
    "",
    "신청현황:",
    dashboardUrl,
  ].join(String.fromCharCode(10));
}

async function sendScheduleReminderToApplication(application = {}, match = {}) {
  const phone = getApplicationPhone(application);

  if (!phone) {
    return {
      applicationId: application?.id || "",
      status: "skipped",
      reason: "NO_PHONE",
    };
  }

  try {
    await sendLms(phone, buildScheduleReminderMessage(application, match), "투윅스 일정 선택 안내", {
      forceLms: true,
    });

    return {
      applicationId: application.id,
      status: "sent",
      phone,
      sentAtClient: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[TwoWeeksAdmin] schedule reminder sms failed:", error);

    return {
      applicationId: application.id,
      status: "failed",
      phone,
      errorMessage: error?.message || String(error),
      failedAtClient: new Date().toISOString(),
    };
  }
}

export async function sendScheduleReminderSms({ match, adminUid = "" }) {
  if (!match?.id) throw new Error("리마인드할 매칭 정보가 없습니다.");

  const schedule = match.schedule || {};
  const status = match.scheduleStatus || schedule.status || "";
  const targetIds = [];

  if (["ready", "needs_first_choice", "mutualAccepted"].includes(status) || match.status === "mutualAccepted") {
    if (match.maleApplicationId) targetIds.push(match.maleApplicationId);
    if (match.femaleApplicationId) targetIds.push(match.femaleApplicationId);
  }

  if (["waiting_counterpart", "needs_final_choice"].includes(status)) {
    const counterpartId =
      schedule.counterpartApplicationId ||
      [match.maleApplicationId, match.femaleApplicationId].find((id) => id && id !== schedule.firstSelectorApplicationId);

    if (counterpartId) targetIds.push(counterpartId);
  }

  const uniqueTargetIds = Array.from(new Set(targetIds.filter(Boolean)));

  if (!uniqueTargetIds.length) {
    throw new Error("현재 상태에서는 리마인드 문자를 보낼 대상이 없습니다.");
  }

  const applications = await Promise.all(uniqueTargetIds.map((id) => getApplicationById(id)));
  const results = [];

  for (const application of applications.filter(Boolean)) {
    results.push(await sendScheduleReminderToApplication(application, match));
  }

  await setDoc(
    doc(db, "twoweeksMatches", match.id),
    {
      "schedule.lastReminderAt": serverTimestamp(),
      "schedule.lastReminderAtClient": new Date().toISOString(),
      "schedule.lastReminderByUid": adminUid,
      "schedule.reminderCount": Number(schedule.reminderCount || 0) + 1,
      "schedule.lastReminderResults": results,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return results;
}

async function sendFinalMeetingSms(application = {}, finalMeeting = {}) {
  const phone = getApplicationPhone(application);

  if (!phone) {
    return {
      status: "skipped",
      reason: "NO_PHONE",
    };
  }

  try {
    await sendLms(phone, buildFinalMeetingMessage(application, finalMeeting), "투윅스 만남 확정", {
      forceLms: true,
    });

    return {
      status: "sent",
      phone,
      sentAtClient: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[TwoWeeksAdmin] final meeting sms failed:", error);

    return {
      status: "failed",
      phone,
      errorMessage: error?.message || String(error),
      failedAtClient: new Date().toISOString(),
    };
  }
}

export async function confirmMeetingSchedule({ match, place = {}, adminUid = "" }) {
  if (!match?.id) throw new Error("확정할 매칭 정보가 없습니다.");

  const finalChoice = match?.schedule?.finalChoice || match?.schedule?.selectedChoice || {};
  const finalTimeChoice = match?.schedule?.finalTimeChoice || finalChoice?.timeChoice || finalChoice || {};
  const finalPlaceChoice = match?.schedule?.finalPlaceChoice || finalChoice?.placeChoice || finalChoice || {};

  if (!finalTimeChoice?.id && !finalTimeChoice?.startAtClient) {
    throw new Error("상대가 선택한 일시가 아직 없습니다.");
  }

  if (!(finalPlaceChoice?.placeId || finalPlaceChoice?.cafeId || finalPlaceChoice?.cafeName)) {
    throw new Error("상대가 선택한 장소가 아직 없습니다.");
  }

  const placeName = String(place.placeName || finalPlaceChoice.cafeName || "").trim();
  if (!placeName) throw new Error("장소명을 입력해주세요.");

  const finalMeeting = {
    ...finalChoice,
    ...finalTimeChoice,
    ...finalPlaceChoice,
    timeChoice: finalTimeChoice,
    placeChoice: finalPlaceChoice,
    finalTimeChoice,
    finalPlaceChoice,
    placeName,
    address: String(place.address || finalPlaceChoice.address || "").trim(),
    mapUrl: String(place.mapUrl || finalPlaceChoice.cafeMapUrl || "").trim(),
    memo: String(place.memo || "").trim(),
    confirmedAtClient: new Date().toISOString(),
    confirmedByUid: adminUid,
  };

  const male = await getApplicationById(match.maleApplicationId);
  const female = await getApplicationById(match.femaleApplicationId);

  const matchRef = doc(db, "twoweeksMatches", match.id);

  await setDoc(
    matchRef,
    {
      status: "confirmed",
      scheduleStatus: "confirmed",
      photoRevealStatus: "revealed",
      finalMeeting,
      schedule: {
        status: "confirmed",
        finalMeeting,
        confirmedAt: serverTimestamp(),
        confirmedAtClient: finalMeeting.confirmedAtClient,
      },
      updatedAt: serverTimestamp(),
      confirmedByUid: adminUid,
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

  await Promise.all(
    [male, female]
      .filter((item) => item?.id)
      .map((application) => updateDoc(doc(db, "twoweeksApplications", application.id), applicationPatch))
  );

  const smsResults = {
    male: male ? await sendFinalMeetingSms(male, finalMeeting) : { status: "skipped", reason: "NO_MALE_APPLICATION" },
    female: female ? await sendFinalMeetingSms(female, finalMeeting) : { status: "skipped", reason: "NO_FEMALE_APPLICATION" },
  };

  await setDoc(
    matchRef,
    {
      finalMeetingSms: smsResults,
      finalMeetingSmsUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return {
    matchId: match.id,
    finalMeeting,
    smsResults,
  };
}

function getCounterpartIdFromMatch(match = {}, applicationId = "") {
  if (!applicationId) return "";
  if (applicationId === match.maleApplicationId) return match.femaleApplicationId || "";
  if (applicationId === match.femaleApplicationId) return match.maleApplicationId || "";
  return "";
}

export async function resolveNoShowReview({
  match = {},
  reporterApplicationId = "",
  accusedApplicationId = "",
  status = "evidence_requested",
  memo = "",
  adminUid = "",
}) {
  if (!match?.id) throw new Error("검토할 만남 정보가 없습니다.");
  if (!reporterApplicationId) throw new Error("신고자 정보를 확인할 수 없습니다.");

  const cleanStatus = String(status || "evidence_requested");
  const finalAccusedId =
    accusedApplicationId ||
    (cleanStatus === "self_no_show_confirmed" ? reporterApplicationId : getCounterpartIdFromMatch(match, reporterApplicationId));
  const nowClient = new Date().toISOString();
  const reviewPayload = {
    reporterApplicationId,
    accusedApplicationId: finalAccusedId || "",
    status: cleanStatus,
    memo: String(memo || "").trim().slice(0, 500),
    reviewedByUid: adminUid,
    reviewedAt: serverTimestamp(),
    reviewedAtClient: nowClient,
  };

  await setDoc(
    doc(db, "twoweeksMatches", match.id),
    {
      noShowReview: {
        [reporterApplicationId]: reviewPayload,
      },
      noShowReviewStatus: cleanStatus,
      feedbackStatus: cleanStatus === "evidence_requested" ? "issue_reported" : "reviewed",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  const clearToReadyPatch = {
    matchingStatus: "not_started",
    currentProposal: deleteField(),
    schedule: deleteField(),
    scheduleStatus: "not_started",
    meetingStatus: "not_started",
    photoRevealStatus: "hidden",
    nextRoundStatus: "ready",
    lastCompletedMatchId: match.id,
    updatedAt: serverTimestamp(),
  };

  if (cleanStatus === "no_show_confirmed" || cleanStatus === "self_no_show_confirmed") {
    if (finalAccusedId) {
      await updateDoc(doc(db, "twoweeksApplications", finalAccusedId), {
        matchingStatus: "paused",
        nextRoundStatus: "admin_review",
        "deposit.noShowResolution": "forfeit_review",
        "deposit.noShowMatchId": match.id,
        "penaltyStats.noShowCount": increment(1),
        "penaltyStats.totalIssueCount": increment(1),
        "penaltyStats.lastPenaltyReason": cleanStatus,
        "penaltyStats.lastPenaltyAt": serverTimestamp(),
        "penaltyStats.lastPenaltyAtClient": nowClient,
        "penaltyStats.reviewStatus": "admin_review",
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    }

    if (reporterApplicationId && reporterApplicationId !== finalAccusedId) {
      await updateDoc(doc(db, "twoweeksApplications", reporterApplicationId), {
        ...clearToReadyPatch,
        nextRoundStatus: "priority_review",
        "penaltyStats.lastNoPenaltyReason": "counterpart_no_show_confirmed",
        "penaltyStats.lastNoPenaltyAtClient": nowClient,
      }).catch(() => {});
    }
  }

  if (cleanStatus === "no_penalty_rematch") {
    await updateDoc(doc(db, "twoweeksApplications", reporterApplicationId), clearToReadyPatch).catch(() => {});
  }

  return reviewPayload;
}

export async function createDummyApplications({ count = 5, existingCount = 0, adminUid = "" }) {
  const writes = [];

  for (let i = 0; i < count; i += 1) {
    writes.push(addDoc(collection(db, "twoweeksApplications"), makeDummyApplication(existingCount + i + 1, adminUid)));
  }

  await Promise.all(writes);
}

export async function deleteDummyApplications(applications = []) {
  const dummyApplications = applications.filter((item) => item?.isDummy === true || item?.source === "twoweeks_admin_dummy");

  await Promise.all(
    dummyApplications.map((item) => deleteDoc(doc(db, "twoweeksApplications", item.id)))
  );

  return dummyApplications.length;
}
