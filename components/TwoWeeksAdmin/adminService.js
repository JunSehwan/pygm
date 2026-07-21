import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
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

const RESPONSE_DUE_DAYS = 2;
const SCHEDULE_DUE_DAYS = 2;

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

export async function updateTwoWeeksApplication(applicationId, patch) {
  if (!applicationId || !patch) return;
  await updateDoc(doc(db, "twoweeksApplications", applicationId), patch);
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

export async function createTwoWeeksMatch({ male, female, score, adminUid = "" }) {
  if (!male?.id || !female?.id) return null;

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
    "[투윅스] 만남의 일정과 장소가 확정되었습니다.",
    `${name}님, 이번 만남의 일정과 장소가 확정되었습니다.`,
    "",
    `일정: ${formatMeetingLine(finalMeeting)}`,
    finalMeeting.placeName ? `장소: ${finalMeeting.placeName}` : null,
    finalMeeting.address ? `주소: ${finalMeeting.address}` : null,
    finalMeeting.mapUrl ? `지도: ${finalMeeting.mapUrl}` : null,
    "",
    finalMeeting.memo || "사진과 상세 안내는 신청현황에서 확인해주세요.",
    "",
    "신청현황 확인:",
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
    `${name}님, 만남 진행이 확인되었습니다.`,
    "",
    actionLine,
    "일정 선택은 2일 내 진행 기준입니다.",
    "",
    "신청현황 확인:",
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
