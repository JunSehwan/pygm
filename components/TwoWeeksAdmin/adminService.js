import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
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
        .sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));

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

export async function updateTwoWeeksApplication(applicationId, patch) {
  if (!applicationId || !patch) return;
  await updateDoc(doc(db, "twoweeksApplications", applicationId), patch);
}

function getApplicationPhone(application = {}) {
  const basic = getBasic(application);
  return normalizePhone(basic.phoneNormalized || basic.phone || application?.phoneIdentityVerification?.phone);
}

function getDashboardUrl(application = {}) {
  return application?.dashboardAccess?.url || "";
}

function buildApprovalMessage(application = {}) {
  const basic = getBasic(application);
  const name = basic.name || basic.nickname || "신청자";
  const dashboardUrl = getDashboardUrl(application);

  return [
    "[투윅스] 신청이 승인되었습니다.",
    `${name}님, 투윅스 신청 정보 검토가 완료되었습니다.`,
    "",
    "매칭 진행을 위해 예치금 입금 확인이 필요합니다.",
    "입금 확인 후 이번 회차 매칭 후보 검토가 진행됩니다.",
    "",
    "예치금: 20,000원",
    "입금계좌: 하나은행 112-891138-99107",
    "예금주: 전세환",
    "",
    "정상 참여 시 예치금은 환급 또는 다음 회차 크레딧으로 처리됩니다.",
    "노쇼 또는 당일 취소 시에는 환급되지 않습니다.",
    dashboardUrl ? "" : null,
    dashboardUrl || null,
  ]
    .filter((line) => line !== null)
    .join(String.fromCharCode(10));
}

function buildIncompleteMessage(application = {}, reasonText = "") {
  const basic = getBasic(application);
  const name = basic.name || basic.nickname || "신청자";
  const dashboardUrl = getDashboardUrl(application);

  return [
    "[투윅스] 신청 정보 보완 안내",
    `${name}님, 신청 정보 확인 중 보완이 필요한 항목이 있습니다.`,
    reasonText || "프로필 사진, 직업/회사 정보, 인증자료를 다시 확인해주세요.",
    dashboardUrl ? "" : null,
    dashboardUrl || null,
  ]
    .filter((line) => line !== null)
    .join(String.fromCharCode(10));
}

async function approveApplicationRecord(application = {}, adminUid = "") {
  await updateDoc(doc(db, "twoweeksApplications", application.id), {
    status: "approved",
    reviewStatus: "approved",
    approvedAt: serverTimestamp(),
    approvedByUid: adminUid,
    updatedAt: serverTimestamp(),
  });
}

async function sendApprovalSms(application = {}) {
  const phone = getApplicationPhone(application);
  if (!phone) return null;

  return sendLms(phone, buildApprovalMessage(application), "투윅스 신청 승인 및 예치금 안내", {
    forceLms: true,
  });
}

export async function approveApplicationWithSms(application = {}, adminUid = "") {
  if (!application?.id) throw new Error("신청자 정보가 없습니다.");

  await approveApplicationRecord(application, adminUid);
  await sendApprovalSms(application);
}

export async function approveApplicationsWithSms(applications = [], adminUid = "") {
  const targets = applications.filter((item) => item?.id);
  const results = [];

  for (const application of targets) {
    await approveApplicationRecord(application, adminUid);
    await sendApprovalSms(application);
    results.push(application.id);
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

export async function sendIncompleteApplicationSms(application = {}, reasonText = "", adminUid = "") {
  if (!application?.id) throw new Error("신청자 정보가 없습니다.");

  await updateDoc(doc(db, "twoweeksApplications", application.id), {
    reviewStatus: "reviewing",
    infoUploadStatus: "incomplete",
    infoUploadGuideSentAt: serverTimestamp(),
    infoUploadGuideSentByUid: adminUid,
    infoUploadGuideReason: reasonText || "프로필 사진, 직업/회사 정보, 인증자료 확인 필요",
    updatedAt: serverTimestamp(),
  });

  const phone = getApplicationPhone(application);

  if (phone) {
    await sendLms(phone, buildIncompleteMessage(application, reasonText), "투윅스 신청 정보 보완", { forceLms: true });
  }
}

export async function confirmDepositApplications(applications = [], adminUid = "") {
  const targets = applications.filter((item) => item?.id);

  await Promise.all(
    targets.map((application) =>
      updateDoc(doc(db, "twoweeksApplications", application.id), {
        "deposit.status": "confirmed",
        "deposit.confirmedAt": serverTimestamp(),
        "deposit.confirmedByUid": adminUid,
        updatedAt: serverTimestamp(),
      })
    )
  );

  return targets.length;
}

export async function createTwoWeeksMatch({ male, female, score, adminUid = "" }) {
  if (!male?.id || !female?.id) return null;

  const roundId = getRoundId(male) || getRoundId(female);
  const matchId = `${roundId}_${male.id}_${female.id}`;
  const matchRef = doc(db, "twoweeksMatches", matchId);

  await setDoc(
    matchRef,
    {
      roundId,
      maleApplicationId: male.id,
      femaleApplicationId: female.id,
      maleName: getApplicationName(male),
      femaleName: getApplicationName(female),
      status: "proposed",
      scoreTotal: score?.total || 0,
      areaOverlap: score?.areaOverlap || [],
      timeOverlap: score?.timeOverlap || [],
      ageDiff: score?.ageDiff ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdByUid: adminUid,
    },
    { merge: true }
  );

  await updateDoc(doc(db, "twoweeksApplications", male.id), {
    matchingStatus: "proposed",
    currentProposal: {
      candidateApplicationId: female.id,
      matchId,
      status: "proposed",
      createdAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "twoweeksApplications", female.id), {
    matchingStatus: "proposed",
    currentProposal: {
      candidateApplicationId: male.id,
      matchId,
      status: "proposed",
      createdAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });

  return matchId;
}

export async function createBulkTwoWeeksMatches({ pairs = [], adminUid = "" }) {
  const results = [];

  for (const pair of pairs) {
    const matchId = await createTwoWeeksMatch({
      male: pair.male,
      female: pair.female,
      score: pair.score,
      adminUid,
    });

    if (matchId) results.push(matchId);
  }

  return results;
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
