import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  runTransaction,
  where,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, sendLms } from "firebaseConfig";
import { getFunctions, httpsCallable } from "firebase/functions";
import { makeDummyApplication } from "./dummyData";
import {
  getApplicationName,
  getApplicationSortValue,
  getBasic,
  getAdvisoryMatchingConflicts,
  getHardMatchingBlockers,
  getPairScore,
  getUnacknowledgedMatchingConflicts,
  getRoundId,
  getTimestampMs,
  getApplicationCompletionBlockReason,
  getMatchingAvailabilityBlockReason,
  hasMatchingEligibleProfilePhotos,
  getNoResponseReviewState,
  getSameCompanyConflict,
  isActiveApplication,
  isApplicationCompleted,
  isDepositConfirmed,
  isFullyApprovedApplication,
  isIdentityVerifiedApplication,
  isMatchAvailableApplication,
  normalizePhone,
  normalizeTimeSlotLabels,
} from "./utils";
import { TWOWEEKS_MIN_PROFILE_PHOTOS } from "../TwoWeeksShared/profilePhotoPolicy";
import { DEFAULT_ROUND_ID, DEFAULT_ROUND_LABEL } from "./constants";
import {
  TWOWEEKS_DEPOSIT_BANK,
  getDepositBalance,
  getDepositDeductionPolicy,
  getDepositPolicySnapshot,
  getDepositRequiredBalance,
  getDepositTopUpRequiredAmount,
  isDepositWaived,
  isDepositParticipationEligible,
  normalizeDepositAmount,
} from "../TwoWeeksShared/depositPolicy";
import { isMatchingRestricted } from "../TwoWeeksShared/sanctionPolicy";
import {
  TWOWEEKS_PROPOSAL_RESPONSE_DUE_HOURS,
  TWOWEEKS_SCHEDULE_STAGE_DUE_HOURS,
  TWOWEEKS_SCHEDULE_TOTAL_DUE_HOURS,
  addScheduleHoursClient,
  buildTwoWeeksSchedulePolicy,
  isValidTwoWeeksSchedulePolicy,
} from "../TwoWeeksShared/schedulePolicy";

const RESPONSE_DUE_DAYS = 2;
const DEFAULT_ADMIN_MATCHING_RATING = 3;
const INITIAL_MATCHING_STATUSES = new Set(["", "not_ready", "not_started"]);
const INITIAL_NEXT_ROUND_STATUSES = new Set(["", "not_ready", "pending", "ready", "queued"]);
const MATCHING_READINESS_PATCH_KEYS = new Set([
  "status",
  "reviewStatus",
  "matchingStatus",
  "nextRoundStatus",
  "deposit.status",
  "deposit.balance",
  "deposit.requiredBalance",
  "deposit.topUpRequiredAmount",
  "deposit.participationEligible",
]);

export async function manageMemberSanction({ applicationId, action, matchId = "", memo = "", eventKey = "" }) {
  const functions = getFunctions(undefined, "asia-northeast3");
  const callable = httpsCallable(functions, "manageTwoWeeksMemberSanction");
  const result = await callable({ applicationId, action, matchId, memo, eventKey });
  return result?.data || {};
}

export async function getMemberSanctionHistory(applicationId) {
  if (!applicationId) return [];
  const functions = getFunctions(undefined, "asia-northeast3");
  const callable = httpsCallable(functions, "getTwoWeeksSanctionHistory");
  const result = await callable({ applicationId });
  return Array.isArray(result?.data?.history) ? result.data.history : [];
}

function hasOwn(object = {}, key = "") {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function buildApplicationPatchPreview(current = {}, patch = {}) {
  const next = { ...current };

  ["status", "reviewStatus", "matchingStatus", "nextRoundStatus"].forEach((key) => {
    if (hasOwn(patch, key)) next[key] = patch[key];
  });

  const deposit = { ...(current?.deposit || {}) };
  Object.entries(patch).forEach(([key, value]) => {
    if (!key.startsWith("deposit.")) return;
    deposit[key.slice("deposit.".length)] = value;
  });
  next.deposit = deposit;

  return next;
}

function shouldReconcileMatchingReadiness(patch = {}) {
  return Object.keys(patch).some((key) => MATCHING_READINESS_PATCH_KEYS.has(key));
}

function getMatchingPoolActivationPatch(current = {}, patch = {}) {
  const next = buildApplicationPatchPreview(current, patch);
  const currentMatchingStatus = String(current?.matchingStatus || "");
  const nextMatchingStatus = String(next?.matchingStatus || "");
  const currentNextRoundStatus = String(current?.nextRoundStatus || "");
  const nextRoundStatus = String(next?.nextRoundStatus || "");

  // 최초 승인 단계만 자동 전환한다. 진행 중·완료·거절·일시정지·탈퇴 상태는
  // 승인/입금 버튼을 다시 눌러도 임의로 매칭 대기로 되돌리지 않는다.
  if (!INITIAL_MATCHING_STATUSES.has(currentMatchingStatus)) return {};
  if (!INITIAL_MATCHING_STATUSES.has(nextMatchingStatus)) return {};
  if (!INITIAL_NEXT_ROUND_STATUSES.has(currentNextRoundStatus)) return {};
  if (!INITIAL_NEXT_ROUND_STATUSES.has(nextRoundStatus)) return {};
  if (current?.currentProposal?.candidateApplicationId) return {};

  if (!isActiveApplication(next)) return {};
  if (!isFullyApprovedApplication(next)) return {};
  if (!isIdentityVerifiedApplication(next)) return {};
  if (!hasMatchingEligibleProfilePhotos(next)) return {};
  if (!isDepositConfirmed(next)) return {};
  if (isMatchingRestricted(next)) return {};

  return {
    matchingStatus: "not_started",
    nextRoundStatus: "ready",
  };
}

function assertTwoWeeksIdentityVerified(application = {}) {
  if (!isIdentityVerifiedApplication(application)) {
    throw new Error("본인인증이 완료된 회원만 승인·예치금 확인·매칭 참여 처리가 가능합니다.");
  }
}

function assertTwoWeeksProfilePhotos(application = {}) {
  if (!hasMatchingEligibleProfilePhotos(application)) {
    throw new Error(`프로필 사진을 대표사진 포함 최소 ${TWOWEEKS_MIN_PROFILE_PHOTOS}장 등록한 회원만 승인·신청완료·매칭 처리할 수 있습니다. 정책 적용 전에 이미 승인된 1~2장 회원은 예외입니다.`);
  }
}

function normalizeAdminRating(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_ADMIN_MATCHING_RATING;
  return Math.min(5, Math.max(1, Math.round(numeric)));
}

function buildAdminMatchingMeta(meta = {}, identity = {}) {
  return {
    profileAppeal: normalizeAdminRating(meta.profileAppeal),
    conditionCompetitiveness: normalizeAdminRating(meta.conditionCompetitiveness),
    matchingReliability: normalizeAdminRating(meta.matchingReliability),
    companyScaleVerified: meta.companyScaleVerified || (identity.jobCategory === "회사원" ? identity.companyScale || "" : ""),
    companyScaleStatus: meta.companyScaleStatus || (identity.jobCategory === "회사원" && identity.companyScale ? "declared_default" : "not_applicable"),
    source: meta.source || "default_runtime",
    updatedAtClient: meta.updatedAtClient || "",
  };
}

function getProposalPhotoUrl(photo = {}) {
  return photo?.url || photo?.downloadURL || photo?.originalUrl || "";
}

function buildProposalVisiblePhoto(photo = {}) {
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

function buildCandidatePreviewForViewer(candidate = {}) {
  const basic = candidate.basic || {};
  const identity = candidate.identity || {};
  const matchingPreferences = candidate.matchingPreferences || basic.matchingPreferences || {};

  return {
    id: candidate.id,
    roundId: getRoundId(candidate),
    roundLabel: candidate.roundLabel || "",
    status: candidate.status || "",
    reviewStatus: candidate.reviewStatus || "",
    matchingStatus: candidate.matchingStatus || "",
    photoRevealStatus: "hidden",
    basic: {
      gender: basic.gender || "",
      nickname: basic.nickname || "",
      birthYear: basic.birthYear || null,
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
      organizationName: "",
      representativePhoto: buildProposalVisiblePhoto(identity.representativePhoto),
      additionalPhotos: Array.isArray(identity.additionalPhotos)
        ? identity.additionalPhotos.map(buildProposalVisiblePhoto).filter(Boolean)
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
      sanitizedForDashboard: true,
      source: "match_candidate_preview_clear_v1",
    },
  };
}

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

export function subscribeTwoWeeksAdminData({ onApplications, onResponses, onMatches, onDeclineReasons, onError }) {
  let latestApplications = [];
  let privateApplicationsByApplicationId = new Map();
  let adminMetaByApplicationId = new Map();
  let privateRefundsByApplicationId = new Map();
  let latestMatches = [];
  let privateFeedbackByMatchId = new Map();

  const emitApplications = () => {
    const rows = latestApplications.map((application) => {
      const privateApplication = privateApplicationsByApplicationId.get(application.id);
      const adminMetaDocument = adminMetaByApplicationId.get(application.id);
      const privateRefund = privateRefundsByApplicationId.get(application.id);
      const deposit = application.deposit || {};
      const refundRequest = deposit.refundRequest || {};
      const identity = application.identity || {};

      return {
        ...application,
        identity: privateApplication?.verificationDocument
          ? {
              ...identity,
              verificationDocument: privateApplication.verificationDocument,
            }
          : identity,
        // 내부등급은 완전한 관리자 전용 컬렉션에서만 합친다.
        // 기존 데이터가 아직 private 문서에 남아 있으면 migration 호환용 fallback으로만 읽는다.
        adminMatchingMeta: buildAdminMatchingMeta(
          adminMetaDocument?.adminMatchingMeta ||
            (privateApplication?.adminMatchingMeta?.reviewedByUid ? privateApplication.adminMatchingMeta : {}),
          identity
        ),
        deposit: privateRefund
          ? {
              ...deposit,
              refundRequest: {
                ...refundRequest,
                ...privateRefund,
                // 신청서의 진행상태가 화면 기준이며, 계좌 원문만 private 문서에서 합친다.
                status: refundRequest.status || privateRefund.status || "",
              },
            }
          : deposit,
      };
    });

    onApplications(rows);
  };

  const emitMatches = () => {
    onMatches(
      latestMatches.map((match) => {
        const privateFeedback = privateFeedbackByMatchId.get(match.id) || {};
        return {
          ...match,
          feedbacks: privateFeedback.feedbacks || match.feedbacks || {},
        };
      })
    );
  };

  const unsubApplications = onSnapshot(
    collection(db, "twoweeksApplications"),
    (snapshot) => {
      latestApplications = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => getApplicationSortValue(b) - getApplicationSortValue(a));

      emitApplications();
    },
    (error) => {
      console.error("[TwoWeeksAdmin] applications snapshot error:", error);
      onError?.({ source: "applications", code: error?.code || "unknown", message: error?.message || "조회 실패" });
    }
  );

  // 신원 인증자료도 일반 신청서에서 분리해 관리자 화면에서만 합쳐서 본다.
  const unsubPrivateApplications = onSnapshot(
    collection(db, "twoweeksApplicationPrivate"),
    (snapshot) => {
      privateApplicationsByApplicationId = new Map(
        snapshot.docs.map((item) => [item.id, { id: item.id, ...item.data() }])
      );
      emitApplications();
    },
    (error) => {
      console.error("[TwoWeeksAdmin] private application snapshot error:", error);
      onError?.({ source: "private application", code: error?.code || "unknown", message: error?.message || "조회 실패" });
      privateApplicationsByApplicationId = new Map();
      emitApplications();
    }
  );

  // 내부 매칭 평가는 인증자료와도 분리한 완전한 관리자 전용 컬렉션에서 읽는다.
  const unsubAdminMeta = onSnapshot(
    collection(db, "twoweeksApplicationAdminMeta"),
    (snapshot) => {
      adminMetaByApplicationId = new Map(
        snapshot.docs.map((item) => [item.id, { id: item.id, ...item.data() }])
      );
      emitApplications();
    },
    (error) => {
      console.error("[TwoWeeksAdmin] admin matching meta snapshot error:", error);
      onError?.({ source: "admin matching meta", code: error?.code || "unknown", message: error?.message || "조회 실패" });
      adminMetaByApplicationId = new Map();
      emitApplications();
    }
  );

  // 계좌번호/예금주는 일반 신청서에서 분리해 관리자 전용 컬렉션에서만 읽는다.
  const unsubPrivateRefunds = onSnapshot(
    collection(db, "twoweeksDepositRefundPrivate"),
    (snapshot) => {
      privateRefundsByApplicationId = new Map(
        snapshot.docs.map((item) => [item.id, { id: item.id, ...item.data() }])
      );
      emitApplications();
    },
    (error) => {
      console.error("[TwoWeeksAdmin] private refund snapshot error:", error);
      onError?.({ source: "private refund", code: error?.code || "unknown", message: error?.message || "조회 실패" });
      privateRefundsByApplicationId = new Map();
      emitApplications();
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
      onError?.({ source: "responses", code: error?.code || "unknown", message: error?.message || "조회 실패" });
    }
  );

  const unsubMatches = onSnapshot(
    collection(db, "twoweeksMatches"),
    (snapshot) => {
      latestMatches = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => getTimestampMs(b.updatedAt || b.createdAt) - getTimestampMs(a.updatedAt || a.createdAt));
      emitMatches();
    },
    (error) => {
      console.error("[TwoWeeksAdmin] matches snapshot error:", error);
      onError?.({ source: "matches", code: error?.code || "unknown", message: error?.message || "조회 실패" });
    }
  );

  const unsubPrivateFeedback = onSnapshot(
    collection(db, "twoweeksFeedbackPrivate"),
    (snapshot) => {
      privateFeedbackByMatchId = new Map(snapshot.docs.map((item) => [item.id, item.data() || {}]));
      emitMatches();
    },
    (error) => {
      console.error("[TwoWeeksAdmin] private feedback snapshot error:", error);
      onError?.({ source: "private feedback", code: error?.code || "unknown", message: error?.message || "조회 실패" });
      privateFeedbackByMatchId = new Map();
      emitMatches();
    }
  );

  const unsubDeclineReasons = onSnapshot(
    collection(db, "twoweeksProposalDeclineReasons"),
    (snapshot) => {
      const rows = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => getTimestampMs(b.updatedAt || b.createdAt) - getTimestampMs(a.updatedAt || a.createdAt));

      if (typeof onDeclineReasons === "function") onDeclineReasons(rows);
    },
    (error) => {
      console.error("[TwoWeeksAdmin] decline reasons snapshot error:", error);
      onError?.({ source: "decline reasons", code: error?.code || "unknown", message: error?.message || "조회 실패" });
      if (typeof onDeclineReasons === "function") onDeclineReasons([]);
    }
  );

  return () => {
    unsubApplications();
    unsubPrivateApplications();
    unsubAdminMeta();
    unsubPrivateRefunds();
    unsubResponses();
    unsubMatches();
    unsubPrivateFeedback();
    unsubDeclineReasons();
  };
}

export async function updateTwoWeeksAdminMatchingMeta(applicationId = "", payload = {}, adminUid = "") {
  if (!applicationId) throw new Error("신청자 정보가 없습니다.");

  const applicationSnap = await getDoc(doc(db, "twoweeksApplications", applicationId));
  if (!applicationSnap.exists()) throw new Error("신청자 정보를 찾을 수 없습니다.");

  const application = applicationSnap.data() || {};
  const identity = application.identity || {};
  const [adminMetaSnap, legacyPrivateSnap] = await Promise.all([
    getDoc(doc(db, "twoweeksApplicationAdminMeta", applicationId)),
    getDoc(doc(db, "twoweeksApplicationPrivate", applicationId)),
  ]);
  const adminMetaDoc = adminMetaSnap.exists() ? adminMetaSnap.data() || {} : {};
  const legacyPrivate = legacyPrivateSnap.exists() ? legacyPrivateSnap.data() || {} : {};
  const trustedLegacyMeta = legacyPrivate?.adminMatchingMeta?.reviewedByUid
    ? legacyPrivate.adminMatchingMeta
    : {};
  const currentMeta = buildAdminMatchingMeta(
    adminMetaDoc.adminMatchingMeta || trustedLegacyMeta,
    identity
  );

  const nextMeta = buildAdminMatchingMeta(
    {
      ...currentMeta,
      ...payload,
      source: "admin_review",
      companyScaleStatus:
        identity.jobCategory === "회사원"
          ? (payload.companyScaleVerified || currentMeta.companyScaleVerified)
            ? "verified_by_admin"
            : "needs_review"
          : "not_applicable",
      updatedAtClient: new Date().toISOString(),
    },
    identity
  );

  await setDoc(
    doc(db, "twoweeksApplicationAdminMeta", applicationId),
    {
      applicationId,
      ownerUid: application.ownerUid || application.uid || legacyPrivate.ownerUid || "",
      adminMatchingMeta: {
        ...nextMeta,
        reviewedByUid: adminUid || "",
        reviewedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
      createdAt: adminMetaSnap.exists()
        ? adminMetaDoc.createdAt || serverTimestamp()
        : serverTimestamp(),
    },
    { merge: true }
  );

  return nextMeta;
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

  const syncPrivateReview = async () => {
    const status = patch["verificationReview.status"];
    if (!status) return;
    await setDoc(doc(db, "twoweeksApplicationPrivate", applicationId), {
      verificationReview: {
        status,
        reviewedByUid: patch["verificationReview.reviewedByUid"] || "",
        reviewedAt: serverTimestamp(),
        reviewedAtClient: patch["verificationReview.reviewedAtClient"] || new Date().toISOString(),
      },
      updatedAt: serverTimestamp(),
    }, { merge: true });
  };

  if (patch["penaltyStats.lastAdminDecision"] === "returned_to_pool") {
    const applicationRef = doc(db, "twoweeksApplications", applicationId);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(applicationRef);
      if (!snapshot.exists()) throw new Error("신청 정보를 찾을 수 없습니다.");

      const current = { id: snapshot.id, ...snapshot.data() };
      if (!getNoResponseReviewState(current).isCurrentAdminReview) {
        throw new Error("최신 상태가 무응답 운영자 검토 정지가 아닙니다. 화면을 새로 확인해주세요.");
      }
      if (!isFullyApprovedApplication(current)) throw new Error("프로필 승인 상태를 먼저 확인해주세요.");
      if (!isIdentityVerifiedApplication(current)) throw new Error("본인인증을 먼저 완료해주세요.");
      if (!isDepositConfirmed(current)) throw new Error("예치금 잔액 또는 상태를 먼저 정상화해주세요.");

      const proposalStatus = String(current.currentProposal?.status || current.currentProposal?.response || "");
      const hasActiveProposal = Boolean(current.currentProposal?.candidateApplicationId) &&
        !["expired", "declined", "cancelled", "completed"].includes(proposalStatus);
      if (hasActiveProposal) throw new Error("진행 중인 매칭 제안이 있어 복귀할 수 없습니다.");

      transaction.update(applicationRef, patch);
    });
    return;
  }

  if (!shouldReconcileMatchingReadiness(patch)) {
    await updateDoc(doc(db, "twoweeksApplications", applicationId), patch);
    await syncPrivateReview();
    return;
  }

  const applicationRef = doc(db, "twoweeksApplications", applicationId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(applicationRef);
    if (!snapshot.exists()) throw new Error("신청 정보를 찾을 수 없습니다.");

    const current = { id: snapshot.id, ...snapshot.data() };
    const activationPatch = getMatchingPoolActivationPatch(current, patch);

    transaction.update(applicationRef, {
      ...patch,
      ...activationPatch,
    });
  });
  await syncPrivateReview();
}

function marketingCallable(name) {
  return httpsCallable(getFunctions(undefined, "asia-northeast3"), name);
}

export async function getTwoWeeksMarketingDashboard(period = "all") {
  const result = await marketingCallable("getTwoWeeksMarketingDashboard")({ period });
  return result?.data || { summary: {}, campaigns: [], channels: [], referrals: [], referralPerformance: [] };
}

export async function createTwoWeeksMarketingCampaign(payload = {}) {
  const result = await marketingCallable("createTwoWeeksMarketingCampaign")(payload);
  return result?.data || { ok: true };
}

export async function setTwoWeeksMarketingCampaignStatus(code, active) {
  const result = await marketingCallable("setTwoWeeksMarketingCampaignStatus")({ code, active });
  return result?.data || { ok: true };
}

export async function setTwoWeeksReferralResolution({ applicationId, referrerApplicationId = "", clear = false }) {
  const result = await marketingCallable("setTwoWeeksReferralResolution")({
    applicationId,
    referrerApplicationId,
    clear,
  });
  return result?.data || { ok: true };
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

function makeDepositHistoryEntry({ type = "", amount = 0, balanceAfter = 0, reason = "", matchId = "", adminUid = "", note = "" } = {}) {
  const nowClient = new Date().toISOString();
  return {
    id: `${type || "deposit"}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    amount: Number(amount || 0),
    balanceAfter: Number(balanceAfter || 0),
    reason,
    matchId,
    note,
    adminUid,
    createdAtClient: nowClient,
  };
}

function resolveDepositAmount(application = {}, amountOverride = null) {
  const hasOverride = amountOverride !== null && amountOverride !== undefined && amountOverride !== "";
  const fallback = getDepositRequiredBalance(application?.deposit || {});
  const amount = normalizeDepositAmount(hasOverride ? amountOverride : fallback, fallback);

  if (amount < 0 || amount > 1000000) {
    throw new Error("예치금은 0원 이상 1,000,000원 이하로 입력해주세요.");
  }

  return amount;
}

function buildDepositConfirmationPatch(application = {}, adminUid = "", amountOverride = null) {
  const deposit = application?.deposit || {};
  const requiredBalance = resolveDepositAmount(application, amountOverride);
  const previousRequiredBalance = getDepositRequiredBalance(deposit);
  const previousBalance = getDepositBalance(deposit);
  const waived = requiredBalance === 0;
  const wasConfirmed = ["confirmed", "waived"].includes(String(deposit.status || ""));
  const nowClient = new Date().toISOString();
  const patch = {
    "deposit.policy": waived ? "waived" : "required",
    "deposit.status": waived ? "waived" : "confirmed",
    "deposit.waived": waived,
    "deposit.amount": requiredBalance,
    "deposit.balance": requiredBalance,
    "deposit.requiredBalance": requiredBalance,
    "deposit.topUpRequiredAmount": 0,
    "deposit.totalDeposited": waived ? Number(deposit.totalDeposited || 0) : Math.max(Number(deposit.totalDeposited || 0), requiredBalance),
    "deposit.totalDeducted": Number(deposit.totalDeducted || 0),
    "deposit.participationEligible": true,
    "deposit.policySnapshot": getDepositPolicySnapshot(requiredBalance),
    "deposit.confirmedAt": waived ? deleteField() : serverTimestamp(),
    "deposit.confirmedAtClient": nowClient,
    "deposit.confirmedByUid": waived ? deleteField() : adminUid,
    "deposit.waivedAt": waived ? serverTimestamp() : deleteField(),
    "deposit.waivedAtClient": waived ? nowClient : deleteField(),
    "deposit.waivedByUid": waived ? adminUid : deleteField(),
    "deposit.waiverReason": waived ? "관리자 설정" : deleteField(),
    updatedAt: serverTimestamp(),
  };

  if (!wasConfirmed) {
    patch["deposit.history"] = arrayUnion(makeDepositHistoryEntry({
      type: waived ? "deposit_waiver" : "initial_deposit",
      amount: requiredBalance,
      balanceAfter: requiredBalance,
      reason: waived ? "admin_deposit_waiver" : "initial_deposit_confirmed",
      adminUid,
      note: waived ? "관리자 예치금 면제" : "최초 예치금 입금 확인",
    }));
  } else if (previousRequiredBalance !== requiredBalance || previousBalance !== requiredBalance) {
    patch["deposit.history"] = arrayUnion(makeDepositHistoryEntry({
      type: "required_balance_adjustment",
      amount: requiredBalance - previousRequiredBalance,
      balanceAfter: requiredBalance,
      reason: "admin_required_balance_adjustment",
      adminUid,
      note: `관리자 기준 예치금 변경 (${previousRequiredBalance.toLocaleString()}원 → ${requiredBalance.toLocaleString()}원)`,
    }));
  }

  return { patch, requiredBalance };
}

function buildDepositTopUpMessage(application = {}, requiredAmount = 0) {
  const basic = getBasic(application);
  const name = basic.name || basic.nickname || "신청자";
  const deposit = application?.deposit || {};
  const requiredBalance = getDepositRequiredBalance(deposit);
  const balance = getDepositBalance(deposit);
  const dashboardUrl = getDashboardUrl(application);

  return [
    "[투윅스] 예치금 추가 예치 안내",
    `${name}님, 현재 예치금 잔액은 ${balance.toLocaleString()}원입니다.`,
    `다음 매칭 참여를 위해 ${Number(requiredAmount || 0).toLocaleString()}원을 추가 예치해주세요.`,
    "",
    `기준 예치금: ${requiredBalance.toLocaleString()}원`,
    `입금계좌: ${TWOWEEKS_DEPOSIT_BANK.bankName} ${TWOWEEKS_DEPOSIT_BANK.accountNumber} ${TWOWEEKS_DEPOSIT_BANK.accountHolder}`,
    "",
    "추가 예치금 입금 확인 전에는 다음 매칭이 진행되지 않습니다.",
    "",
    "예치금 현황 확인:",
    dashboardUrl,
  ].join(String.fromCharCode(10));
}

function buildInitialDepositReminderMessage(application = {}, requiredAmount = 0) {
  const basic = getBasic(application);
  const name = basic.name || basic.nickname || "신청자";
  const deposit = application?.deposit || {};
  const requiredBalance = getDepositRequiredBalance(deposit);
  const balance = getDepositBalance(deposit);
  const dashboardUrl = getDashboardUrl(application);

  return [
    deposit.requestStage === "later" ? "[투윅스] 만남보증금 안내" : "[투윅스] 예치금 입금 재안내",
    `${name}님, 프로필 검토가 완료되어 만남보증금 입금을 안내드립니다.`,
    `매칭 참여를 위해 예치금 잔액 ${requiredBalance.toLocaleString()}원이 충족되어야 합니다.`,
    "",
    `현재 확인 잔액: ${balance.toLocaleString()}원`,
    `입금 필요액: ${Number(requiredAmount || 0).toLocaleString()}원`,
    `입금계좌: ${TWOWEEKS_DEPOSIT_BANK.bankName} ${TWOWEEKS_DEPOSIT_BANK.accountNumber} ${TWOWEEKS_DEPOSIT_BANK.accountHolder}`,
    "",
    "입금 확인 전에는 매칭 대상에 포함되지 않습니다.",
    "",
    "신청 현황 확인:",
    dashboardUrl,
  ].join(String.fromCharCode(10));
}

function buildDepositTopUpConfirmedMessage(application = {}, amount = 0) {
  const basic = getBasic(application);
  const name = basic.name || basic.nickname || "신청자";
  const dashboardUrl = getDashboardUrl(application);
  const requiredBalance = getDepositRequiredBalance(application?.deposit || {});

  return [
    "[투윅스] 추가 예치금 확인 완료",
    `${name}님, 추가 예치금 ${Number(amount || 0).toLocaleString()}원 입금이 확인되었습니다.`,
    `현재 예치금 잔액은 ${requiredBalance.toLocaleString()}원이며 다음 매칭 참여가 가능합니다.`,
    "",
    "예치금 현황 확인:",
    dashboardUrl,
  ].join(String.fromCharCode(10));
}

function buildNoShowDepositDeductionMessage(application = {}, deductionAmount = null, topUpRequiredAmount = null) {
  const basic = getBasic(application);
  const name = basic.name || basic.nickname || "신청자";
  const deposit = application?.deposit || {};
  const requiredBalance = getDepositRequiredBalance(deposit);
  const safeDeductionAmount = deductionAmount !== null && Number.isFinite(Number(deductionAmount))
    ? Number(deductionAmount)
    : requiredBalance;
  const balance = Math.max(0, getDepositBalance(deposit) - safeDeductionAmount);
  const safeTopUpRequiredAmount = topUpRequiredAmount !== null && Number.isFinite(Number(topUpRequiredAmount))
    ? Number(topUpRequiredAmount)
    : Math.max(0, requiredBalance - balance);
  const dashboardUrl = getDashboardUrl(application);

  return [
    "[투윅스] 노쇼 확정 및 예치금 차감 안내",
    `${name}님, 운영자 확인 결과 해당 만남이 노쇼로 확정되었습니다.`,
    `예치금 ${safeDeductionAmount.toLocaleString()}원이 차감되어 현재 잔액은 ${balance.toLocaleString()}원입니다.`,
    `다음 매칭 참여를 위해 ${safeTopUpRequiredAmount.toLocaleString()}원의 추가 예치가 필요합니다.`,
    "",
    `입금계좌: ${TWOWEEKS_DEPOSIT_BANK.bankName} ${TWOWEEKS_DEPOSIT_BANK.accountNumber} ${TWOWEEKS_DEPOSIT_BANK.accountHolder}`,
    "추가 예치금 입금 확인 전에는 다음 매칭이 진행되지 않습니다.",
    "",
    "예치금 현황 확인:",
    dashboardUrl,
  ].join(String.fromCharCode(10));
}

async function sendDepositMessage(application = {}, message = "", subject = "투윅스 예치금 안내") {
  const phone = getApplicationPhone(application);
  if (!phone) return { status: "skipped", reason: "NO_PHONE" };

  try {
    await sendLms(phone, message, subject, { forceLms: true });
    return { status: "sent", phoneLast4: phone.slice(-4), sentAtClient: new Date().toISOString() };
  } catch (error) {
    console.error("[TwoWeeksAdmin] deposit sms failed:", error);
    return {
      status: "failed",
      phoneLast4: phone.slice(-4),
      reason: "SMS_SEND_FAILED",
      failedAtClient: new Date().toISOString(),
    };
  }
}

export async function sendDepositTopUpReminderSms(application = {}, adminUid = "") {
  if (!application?.id) throw new Error("신청자 정보를 확인할 수 없습니다.");

  const snap = await getDoc(doc(db, "twoweeksApplications", application.id));
  const freshApplication = snap.exists() ? { id: snap.id, ...snap.data() } : application;
  const requiredAmount = getDepositTopUpRequiredAmount(freshApplication.deposit || {});

  if (requiredAmount <= 0) {
    throw new Error("현재 추가 예치가 필요한 회원이 아닙니다.");
  }

  const sms = await sendDepositMessage(
    freshApplication,
    buildDepositTopUpMessage(freshApplication, requiredAmount),
    "투윅스 추가 예치 안내"
  );

  await updateDoc(doc(db, "twoweeksApplications", application.id), {
    "deposit.topUpReminderSms": sms,
    "deposit.topUpReminderSentAt": serverTimestamp(),
    "deposit.topUpReminderSentAtClient": new Date().toISOString(),
    "deposit.topUpReminderSentByUid": adminUid,
    updatedAt: serverTimestamp(),
  }).catch(() => {});

  return { requiredAmount, sms };
}

export async function sendInitialDepositReminderSms(application = {}, adminUid = "") {
  if (!application?.id) throw new Error("신청자 정보를 확인할 수 없습니다.");

  const ref = doc(db, "twoweeksApplications", application.id);
  const snap = await getDoc(ref);
  const freshApplication = snap.exists() ? { id: snap.id, ...snap.data() } : application;
  const deposit = freshApplication.deposit || {};
  const depositStatus = String(deposit.status || "");

  if (!isActiveApplication(freshApplication) || !isFullyApprovedApplication(freshApplication)) {
    throw new Error("프로필 승인 완료 회원에게만 예치금 재안내를 보낼 수 있습니다.");
  }
  if (!isIdentityVerifiedApplication(freshApplication)) {
    throw new Error("본인인증 완료 회원에게만 예치금 재안내를 보낼 수 있습니다.");
  }
  if (!hasMatchingEligibleProfilePhotos(freshApplication)) {
    throw new Error(`프로필 사진 최소 ${TWOWEEKS_MIN_PROFILE_PHOTOS}장 보완 후 예치금 재안내를 보낼 수 있습니다. 기존 승인 1~2장 회원은 예외입니다.`);
  }
  if (["refund_requested", "refunded", "withdrawn_no_balance"].includes(depositStatus)) {
    throw new Error("탈퇴 또는 예치금 반환 처리 중인 회원에게는 재안내를 보낼 수 없습니다.");
  }
  if (depositStatus === "topup_required" || deposit.noShowResolution === "deducted_top_up_required") {
    throw new Error("이 회원은 최초 예치가 아니라 추가 예치 안내 대상입니다.");
  }

  const requiredBalance = getDepositRequiredBalance(deposit);
  const balance = getDepositBalance(deposit);
  const requiredAmount = Math.max(0, requiredBalance - balance);
  if (["confirmed", "waived"].includes(depositStatus) || requiredAmount <= 0) {
    throw new Error("이미 기준 예치금이 충족된 회원입니다.");
  }

  const sms = await sendDepositMessage(
    freshApplication,
    buildInitialDepositReminderMessage(freshApplication, requiredAmount),
    "투윅스 예치금 재안내"
  );
  const nowClient = new Date().toISOString();
  const sent = sms.status === "sent";
  const patch = {
    "deposit.initialReminderAttemptCount": increment(1),
    "deposit.initialReminderLastSms": sms,
    "deposit.initialReminderLastAttemptAt": serverTimestamp(),
    "deposit.initialReminderLastAttemptAtClient": nowClient,
    "deposit.initialReminderLastAttemptByUid": adminUid,
    updatedAt: serverTimestamp(),
  };

  if (sent) {
    // 신규 가입자가 처음 안내 문자를 받은 순간부터 입금 요청 상태로 전환
    patch["deposit.requestStage"] = "requested";
    patch["deposit.requestedAtClient"] = deposit.requestedAtClient || nowClient;
    patch["deposit.initialReminderSentCount"] = increment(1);
    patch["deposit.initialReminderLastSentAt"] = serverTimestamp();
    patch["deposit.initialReminderLastSentAtClient"] = nowClient;
    patch["deposit.initialReminderLastSentByUid"] = adminUid;
  }

  await updateDoc(ref, patch);

  return {
    requiredAmount,
    requiredBalance,
    reminderCount: Number(deposit.initialReminderSentCount || 0) + (sent ? 1 : 0),
    sms,
  };
}

export async function confirmDepositTopUp(application = {}, adminUid = "") {
  if (!application?.id) throw new Error("신청자 정보를 확인할 수 없습니다.");

  const ref = doc(db, "twoweeksApplications", application.id);
  const snap = await getDoc(ref);
  const freshApplication = snap.exists() ? { id: snap.id, ...snap.data() } : application;
  const profilePhotosReady = hasMatchingEligibleProfilePhotos(freshApplication);
  const deposit = freshApplication.deposit || {};
  const requiredBalance = getDepositRequiredBalance(deposit);
  const balance = getDepositBalance(deposit);
  const requiredAmount = Math.max(0, requiredBalance - balance);

  if (requiredAmount <= 0) {
    throw new Error("추가 예치가 필요한 금액이 없습니다.");
  }

  const nowClient = new Date().toISOString();
  const inferredPreviouslyDeposited = Math.max(
    Number(deposit.totalDeposited || 0),
    balance + Number(deposit.totalDeducted || 0),
    deposit.status === "confirmed" ? requiredBalance : 0
  );
  const totalDeposited = inferredPreviouslyDeposited + requiredAmount;
  const history = makeDepositHistoryEntry({
    type: "top_up",
    amount: requiredAmount,
    balanceAfter: requiredBalance,
    reason: "next_matching_top_up",
    adminUid,
    note: "다음 매칭 참여를 위한 추가 예치금 입금 확인",
  });

  await updateDoc(ref, {
    "deposit.status": "confirmed",
    "deposit.balance": requiredBalance,
    "deposit.requiredBalance": requiredBalance,
    "deposit.topUpRequiredAmount": 0,
    "deposit.totalDeposited": totalDeposited,
    "deposit.participationEligible": true,
    "deposit.lastTopUpAmount": requiredAmount,
    "deposit.lastTopUpConfirmedAt": serverTimestamp(),
    "deposit.lastTopUpConfirmedAtClient": nowClient,
    "deposit.lastTopUpConfirmedByUid": adminUid,
    "deposit.noShowResolution": "top_up_completed",
    "deposit.history": arrayUnion(history),
    matchingStatus: profilePhotosReady ? "not_started" : "not_ready",
    nextRoundStatus: profilePhotosReady ? "ready" : "not_ready",
    scheduleStatus: "not_started",
    meetingStatus: "not_started",
    photoRevealStatus: "hidden",
    currentProposal: deleteField(),
    schedule: deleteField(),
    "penaltyStats.reviewStatus": "cleared_after_top_up",
    updatedAt: serverTimestamp(),
  });

  const nextApplication = {
    ...freshApplication,
    deposit: {
      ...deposit,
      status: "confirmed",
      balance: requiredBalance,
      topUpRequiredAmount: 0,
    },
  };
  const sms = await sendDepositMessage(
    nextApplication,
    buildDepositTopUpConfirmedMessage(nextApplication, requiredAmount),
    "투윅스 추가 예치 확인"
  );

  await updateDoc(ref, {
    "deposit.topUpConfirmedSms": sms,
    updatedAt: serverTimestamp(),
  }).catch(() => {});

  return { requiredAmount, balance: requiredBalance, sms };
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

function buildApprovalMessage(application = {}, amountOverride = null) {
  const basic = getBasic(application);
  const name = basic.name || basic.nickname || "신청자";
  const dashboardUrl = getDashboardUrl(application);
  const requiredBalance = resolveDepositAmount(application, amountOverride);
  const policy = getDepositDeductionPolicy(requiredBalance);

  // 가입 심사 승인과 실제 수납 요청은 별도 단계입니다.
  if (requiredBalance > 0 && application?.deposit?.requestStage === "later") {
    return [
      "[투윅스] 프로필 검토 완료 안내",
      `${name}님, 작성하신 프로필 검토가 완료되었습니다.`,
      "만남보증금은 필요한 시점에 별도로 안내드릴게요. 아직 입금하지 않으셔도 됩니다.",
      "",
      "신청현황 확인:",
      dashboardUrl,
      "휴대폰 번호로 인증번호 6자리를 받아 조회해주세요.",
    ].join(String.fromCharCode(10));
  }

  if (requiredBalance === 0) {
    return [
      "[투윅스] 신청이 승인되었습니다.",
      `${name}님, 안녕하세요. 투윅스입니다.`,
      "프로필 검토와 예치금 면제 처리가 완료되어 매칭 가능 상태로 등록되었습니다.",
      "",
      "프로필 검토 후 매칭 가능 순서에 따라 안내드리고 있습니다.",
      "적합한 매칭이 가능한 경우 순차적으로 안내드리겠습니다.",
      "",
      "신청현황 확인:",
      dashboardUrl,
    ].join(String.fromCharCode(10));
  }

  return [
    "[투윅스] 신청이 승인되었습니다.",
    `${name}님, 투윅스 신청 검토가 완료되었습니다.`,
    "",
    "매칭 진행을 위해 예치금 입금 확인이 필요합니다.",
    `예치금: ${requiredBalance.toLocaleString()}원`,
    "입금계좌: 하나은행 112-891138-99107 전세환",
    "",
    "정상 참여 시 예치금은 반환받거나 다음 회차 예치금으로 유지할 수 있습니다.",
    `양쪽 수락 후 취소 시점에 따라 ${policy.afterMutualAcceptBeforeScheduleConfirmed.amount.toLocaleString()}원·${policy.afterScheduleConfirmedUntilDayBefore.amount.toLocaleString()}원·${policy.sameDayCancel.amount.toLocaleString()}원이 차감되며, 당일 취소와 노쇼는 설정된 예치금 전액이 차감됩니다.`,
    "차감 후 부족분은 다음 매칭 전 추가 예치가 필요합니다.",
    "",
    "프로필 검토 후 매칭 가능 순서에 따라 안내드리고 있습니다.",
    "적합한 매칭이 가능한 경우 순차적으로 안내드리겠습니다.",
    "",
    "신청현황 확인:",
    dashboardUrl,
  ].join(String.fromCharCode(10));
}

function buildApplicationCompletedMessage(application = {}, requiredBalance = null) {
  const basic = getBasic(application);
  const name = basic.name || basic.nickname || "신청자";
  const dashboardUrl = getDashboardUrl(application);

  const amount = requiredBalance === null
    ? getDepositRequiredBalance(application?.deposit || {})
    : Number(requiredBalance);
  const depositLine = amount === 0
    ? `${name}님, 프로필 검토와 예치금 면제 처리가 완료되었습니다.`
    : `${name}님, 예치금 ${amount.toLocaleString()}원 입금 확인과 프로필 검토가 완료되었습니다.`;

  return [
    "[투윅스] 신청이 완료되었습니다.",
    depositLine,
    "",
    "이제 매칭 가능 상태로 등록되었습니다.",
    "프로필 검토 후 매칭 가능 순서에 따라 안내드리고 있습니다.",
    "적합한 매칭이 가능한 경우 순차적으로 안내드리겠습니다.",
    "",
    "신청현황 확인:",
    dashboardUrl,
  ].join(String.fromCharCode(10));
}

async function completeApplicationRecord(application = {}, adminUid = "", amountOverride = null) {
  if (!application?.id) return null;
  assertTwoWeeksIdentityVerified(application);
  assertTwoWeeksProfilePhotos(application);

  const nowClient = new Date().toISOString();
  const depositConfirmation = buildDepositConfirmationPatch(application, adminUid, amountOverride);
  const patch = {
    status: "approved",
    reviewStatus: "approved",
    approvedAt: serverTimestamp(),
    approvedAtClient: nowClient,
    approvedByUid: adminUid,
    ...depositConfirmation.patch,
    applicationCompletedAt: serverTimestamp(),
    applicationCompletedAtClient: nowClient,
    applicationCompletedByUid: adminUid,
    updatedAt: serverTimestamp(),
  };

  await updateTwoWeeksApplication(application.id, patch);

  return application.id;
}

async function sendApplicationCompletedSms(application = {}, requiredBalance = null) {
  const phone = getApplicationPhone(application);

  if (!phone) {
    return {
      status: "skipped",
      reason: "NO_PHONE",
    };
  }

  try {
    await sendLms(phone, buildApplicationCompletedMessage(application, requiredBalance), "투윅스 신청 완료", {
      forceLms: true,
    });

    return {
      status: "sent",
      phoneLast4: phone.slice(-4),
      sentAtClient: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[TwoWeeksAdmin] application complete sms failed:", error);

    return {
      status: "failed",
      phoneLast4: phone.slice(-4),
      reason: "SMS_SEND_FAILED",
      failedAtClient: new Date().toISOString(),
    };
  }
}

export async function completeApplicationWithSms(application = {}, adminUid = "", amountOverride = null) {
  if (!application?.id) return null;

  if (isApplicationCompleted(application)) {
    return {
      applicationId: application.id,
      skipped: true,
      reason: "이미 신청완료",
      sms: {
        status: "skipped",
        reason: "ALREADY_COMPLETED",
      },
    };
  }

  const requiredBalance = resolveDepositAmount(application, amountOverride);
  await completeApplicationRecord(application, adminUid, requiredBalance);
  const sms = await sendApplicationCompletedSms(application, requiredBalance);

  await updateDoc(doc(db, "twoweeksApplications", application.id), {
    applicationCompletedSms: sms,
    applicationCompletedSmsUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    applicationId: application.id,
    skipped: false,
    sms,
  };
}

export async function completeApplicationsWithSms(applications = [], adminUid = "") {
  const targets = applications.filter((item) => item?.id);
  const completed = [];
  const skipped = [];
  const failed = [];

  for (const application of targets) {
    const blockedReason = getApplicationCompletionBlockReason(application);

    if (blockedReason) {
      skipped.push({
        applicationId: application.id,
        name: getApplicationName(application),
        reason: blockedReason,
      });
      continue;
    }

    try {
      const result = await completeApplicationWithSms(application, adminUid);
      if (result?.skipped) {
        skipped.push({
          applicationId: application.id,
          name: getApplicationName(application),
          reason: result.reason || "처리 제외",
        });
      } else if (result) {
        completed.push(result);
      }
    } catch (error) {
      failed.push({
        applicationId: application.id,
        name: getApplicationName(application),
        reason: error?.message || "신청완료 처리 실패",
      });
    }
  }

  return {
    completed,
    skipped,
    failed,
  };
}

export async function completeApplicationsWithoutSms(applications = [], adminUid = "") {
  const targets = applications.filter((item) => item?.id);
  const completed = [];
  const skipped = [];
  const failed = [];

  for (const application of targets) {
    const blockedReason = getApplicationCompletionBlockReason(application);

    if (blockedReason) {
      skipped.push({
        applicationId: application.id,
        name: getApplicationName(application),
        reason: blockedReason,
      });
      continue;
    }

    try {
      await completeApplicationRecord(application, adminUid);
      completed.push(application.id);
    } catch (error) {
      failed.push({
        applicationId: application.id,
        name: getApplicationName(application),
        reason: error?.message || "신청완료 처리 실패",
      });
    }
  }

  return {
    completed,
    skipped,
    failed,
  };
}

function buildIncompleteMessage(application = {}, reasonText = "") {
  const basic = getBasic(application);
  const name = basic.name || basic.nickname || "신청자";
  const dashboardUrl = getDashboardUrl(application);

  const reason = String(reasonText || "").trim().replace(/\s+/g, " ").slice(0, 500);

  return [
    "[투윅스] 신청 정보 보완이 필요합니다.",
    `${name}님, 안녕하세요. 투윅스입니다.`,
    "프로필 검토 중 보완이 필요한 항목이 확인되었습니다.",
    "",
    reason || `프로필 사진 최소 ${TWOWEEKS_MIN_PROFILE_PHOTOS}장, 직업/회사 정보, 인증자료 등을 확인한 뒤 다시 제출해주세요.`,
    "",
    "신청현황 확인:",
    dashboardUrl,
  ].join(String.fromCharCode(10));
}

async function approveApplicationRecord(application = {}, adminUid = "", amountOverride = null) {
  if (!application?.id) return null;
  assertTwoWeeksIdentityVerified(application);
  assertTwoWeeksProfilePhotos(application);

  const requiredBalance = resolveDepositAmount(application, amountOverride);
  const balance = getDepositBalance(application?.deposit || {});
  const waiverPatch = requiredBalance === 0
    ? buildDepositConfirmationPatch(application, adminUid, 0).patch
    : {};

  await updateTwoWeeksApplication(application.id, {
    status: "approved",
    reviewStatus: "approved",
    approvedAt: serverTimestamp(),
    approvedAtClient: new Date().toISOString(),
    approvedByUid: adminUid,
    "deposit.amount": requiredBalance,
    "deposit.requiredBalance": requiredBalance,
    "deposit.topUpRequiredAmount": Math.max(0, requiredBalance - balance),
    "deposit.policySnapshot": getDepositPolicySnapshot(requiredBalance),
    ...waiverPatch,
    updatedAt: serverTimestamp(),
  });

  return application.id;
}

async function sendApprovalSms(application = {}, amountOverride = null) {
  const phone = getApplicationPhone(application);

  if (!phone) {
    return {
      status: "skipped",
      reason: "NO_PHONE",
    };
  }

  try {
    await sendLms(phone, buildApprovalMessage(application, amountOverride), "투윅스 신청 승인", {
      forceLms: true,
    });

    return {
      status: "sent",
      phoneLast4: phone.slice(-4),
      sentAtClient: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[TwoWeeksAdmin] approval sms failed:", error);

    return {
      status: "failed",
      phoneLast4: phone.slice(-4),
      reason: "SMS_SEND_FAILED",
      failedAtClient: new Date().toISOString(),
    };
  }
}

export async function approveApplicationWithSms(application = {}, adminUid = "", amountOverride = null) {
  if (!application?.id) return null;

  await approveApplicationRecord(application, adminUid, amountOverride);
  const sms = await sendApprovalSms(application, amountOverride);

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

export async function sendIncompleteApplicationSms(application = {}, reasonText = "", adminUid = "") {
  if (!application?.id) return null;

  const phone = getApplicationPhone(application);

  if (!phone) {
    return {
      status: "skipped",
      reason: "NO_PHONE",
    };
  }

  try {
    const cleanReason = String(reasonText || "").trim().replace(/\s+/g, " ").slice(0, 500);
    await sendLms(phone, buildIncompleteMessage(application, cleanReason), "투윅스 정보 보완", {
      forceLms: true,
    });

    const result = {
      status: "sent",
      phoneLast4: phone.slice(-4),
      sentAtClient: new Date().toISOString(),
    };

    await updateDoc(doc(db, "twoweeksApplications", application.id), {
      reviewStatus: "incomplete",
      incompleteSms: result,
      incompleteReason: cleanReason,
      incompleteRequestedByUid: adminUid,
      incompleteRequestedAtClient: result.sentAtClient,
      incompleteSmsUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return result;
  } catch (error) {
    console.error("[TwoWeeksAdmin] incomplete sms failed:", error);

    const result = {
      status: "failed",
      phoneLast4: phone.slice(-4),
      reason: "SMS_SEND_FAILED",
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

export async function confirmDepositApplications(applications = [], adminUid = "", amountOverride = null) {
  const targets = applications.filter((item) => item?.id);
  targets.forEach(assertTwoWeeksIdentityVerified);

  await Promise.all(
    targets.map((application) => {
      const { patch } = buildDepositConfirmationPatch(application, adminUid, amountOverride);
      return updateTwoWeeksApplication(application.id, patch);
    })
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
      phoneLast4: phone.slice(-4),
      sentAtClient: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[TwoWeeksAdmin] proposal sms failed:", error);

    return {
      status: "failed",
      phoneLast4: phone.slice(-4),
      reason: "SMS_SEND_FAILED",
      failedAtClient: new Date().toISOString(),
    };
  }
}

function buildCurrentProposal(candidateApplicationId, matchId, timing = {}) {
  return {
    candidateApplicationId,
    matchId,
    status: "proposed",
    response: "pending",
    responseDueDays: RESPONSE_DUE_DAYS,
    responseDueHours: TWOWEEKS_PROPOSAL_RESPONSE_DUE_HOURS,
    responseDueAtClient: timing.responseDueAtClient,
    createdAt: serverTimestamp(),
    createdAtClient: timing.createdAtClient,
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

export async function createTwoWeeksMatch({
  male,
  female,
  acknowledgedConflictCodes = [],
  adminUid = "",
}) {
  if (!male?.id || !female?.id) return null;

  // 화면의 후보 목록이 열린 뒤 상태나 회사 정보가 수정되거나 직접 호출되는 경우에도
  // 최신 신청서를 다시 읽어 참여 자격과 동일 회사 여부를 최종 확인한다.
  const [latestMaleSnap, latestFemaleSnap] = await Promise.all([
    getDoc(doc(db, "twoweeksApplications", male.id)),
    getDoc(doc(db, "twoweeksApplications", female.id)),
  ]);

  if (!latestMaleSnap.exists() || !latestFemaleSnap.exists()) {
    throw new Error("신청자 정보를 찾을 수 없습니다. 목록을 새로고침한 뒤 다시 시도해주세요.");
  }

  const latestMale = { id: latestMaleSnap.id, ...latestMaleSnap.data() };
  const latestFemale = { id: latestFemaleSnap.id, ...latestFemaleSnap.data() };
  const maleBlockReason = getMatchingAvailabilityBlockReason(latestMale);
  const femaleBlockReason = getMatchingAvailabilityBlockReason(latestFemale);

  if (!isMatchAvailableApplication(latestMale) || !isMatchAvailableApplication(latestFemale)) {
    const blocked = [
      maleBlockReason ? `${getApplicationName(latestMale)}: ${maleBlockReason}` : "",
      femaleBlockReason ? `${getApplicationName(latestFemale)}: ${femaleBlockReason}` : "",
    ].filter(Boolean);

    throw new Error(`현재 매칭 가능한 상태가 아닙니다. ${blocked.join(" / ")}`);
  }

  const sameCompany = getSameCompanyConflict(latestMale, latestFemale);

  if (sameCompany.blocked) {
    throw new Error(`동일 회사(${sameCompany.leftName}) 신청자끼리는 매칭할 수 없습니다.`);
  }

  if (getRoundId(latestMale) !== getRoundId(latestFemale)) {
    throw new Error("서로 다른 회차의 신청자는 매칭할 수 없습니다. 두 회원의 회차를 먼저 확인해주세요.");
  }

  male = latestMale;
  female = latestFemale;

  const latestScore = getPairScore(male, female);

  if (!latestScore.complete) {
    throw new Error("매칭 적합도 필수정보가 모두 입력된 신청자만 매칭할 수 있습니다.");
  }

  const hardBlockers = getHardMatchingBlockers(latestScore);

  if (hardBlockers.length) {
    throw new Error(`매칭할 수 없는 조합입니다: ${hardBlockers.map((item) => item.label).join(" · ")}`);
  }

  const latestConflicts = getAdvisoryMatchingConflicts(latestScore);
  const unacknowledgedConflicts = getUnacknowledgedMatchingConflicts(
    latestScore,
    acknowledgedConflictCodes
  );

  if (unacknowledgedConflicts.length) {
    throw new Error(
      `최신 핵심 조건 충돌 확인이 필요합니다: ${unacknowledgedConflicts
        .map((item) => item.label)
        .join(" · ")}. 목록을 새로고침한 뒤 충돌 내용을 확인해주세요.`
    );
  }

  // 내부 평가/추천 보정값은 관리자 런타임에서만 사용하고 공개 매칭 문서에는 저장하지 않는다.
  const {
    rankingScore: _rankingScore,
    internalAdjustment: _internalAdjustment,
    adminRanking: _adminRanking,
    ...publicScore
  } = latestScore;

  if (await hasExistingPairMatch(male.id, female.id)) {
    throw new Error("이미 같은 상대와 매칭 이력이 있습니다. 중복 매칭은 생성할 수 없습니다.");
  }

  const roundId = getRoundId(male) || getRoundId(female);
  const matchId = `${roundId}_${male.id}_${female.id}`;
  const matchRef = doc(db, "twoweeksMatches", matchId);
  const createdAtClient = new Date().toISOString();
  const responseDueAtClient = addScheduleHoursClient(
    TWOWEEKS_PROPOSAL_RESPONSE_DUE_HOURS,
    createdAtClient
  );
  const schedulePolicy = buildTwoWeeksSchedulePolicy(createdAtClient);

  const matchPayload = {
      roundId,
      maleApplicationId: male.id,
      femaleApplicationId: female.id,
      maleName: getApplicationName(male),
      femaleName: getApplicationName(female),
      candidatePreviews: {
        [male.id]: buildCandidatePreviewForViewer(female),
        [female.id]: buildCandidatePreviewForViewer(male),
      },
      securePhotoPolicy: {
        proposalStageUsesClearPhotos: true,
        originalPhotoVisibleFromProposal: true,
        previewVersion: "clear_v1",
        createdAtClient,
      },
      status: "proposed",
      proposalStatus: "proposed",
      scheduleStatus: "not_started",
      responseDueDays: RESPONSE_DUE_DAYS,
      responseDueHours: TWOWEEKS_PROPOSAL_RESPONSE_DUE_HOURS,
      responseDueAtClient,
      schedulePolicy,
      scoreTotal: publicScore?.total || 0,
      areaOverlap: publicScore?.areaOverlap || [],
      timeOverlap: publicScore?.timeOverlap || [],
      ageDiff: publicScore?.ageDiff ?? null,
      matchingCompatibility: publicScore || null,
      publicMatchingReasons: publicScore?.reasons || [],
      publicMatchingReasonVersion: publicScore?.reasonVersion || "public_v2",
      compatibilityConflictReview: {
        status: latestConflicts.length ? "admin_confirmed" : "not_required",
        conflictCodes: latestConflicts.map((item) => item.code),
        conflictLabels: latestConflicts.map((item) => item.label),
        reviewedByUid: latestConflicts.length ? adminUid : "",
        reviewedAtClient: latestConflicts.length ? createdAtClient : "",
      },
      policySnapshot: {
        proposalResponseDueDays: RESPONSE_DUE_DAYS,
        proposalResponseDueHours: TWOWEEKS_PROPOSAL_RESPONSE_DUE_HOURS,
        scheduleSelectionDueHours: TWOWEEKS_SCHEDULE_TOTAL_DUE_HOURS,
        firstScheduleSelectionDueHours: TWOWEEKS_SCHEDULE_STAGE_DUE_HOURS,
        counterpartScheduleSelectionDueHours: TWOWEEKS_SCHEDULE_STAGE_DUE_HOURS,
        meetingWeekRule: schedulePolicy.meetingWeekRule,
        meetingTimeZone: schedulePolicy.timeZone,
        firstSelectorWins: true,
        photoRevealAfterScheduleConfirmed: false,
      },
      createdAt: serverTimestamp(),
      createdAtClient,
      updatedAt: serverTimestamp(),
      createdByUid: adminUid,
  };

  const maleRef = doc(db, "twoweeksApplications", male.id);
  const femaleRef = doc(db, "twoweeksApplications", female.id);

  // 마지막 저장 순간에 매칭 문서와 양쪽 신청서를 다시 확인한다. 두 관리자가
  // 동시에 같은 회원을 선택해도 한 건만 성공하도록 원자적으로 잠근다.
  await runTransaction(db, async (transaction) => {
    const [matchSnap, maleSnap, femaleSnap] = await Promise.all([
      transaction.get(matchRef),
      transaction.get(maleRef),
      transaction.get(femaleRef),
    ]);

    if (matchSnap.exists()) {
      throw new Error("이미 생성된 매칭입니다. 화면을 새로고침해주세요.");
    }
    if (!maleSnap.exists() || !femaleSnap.exists()) {
      throw new Error("신청자 정보를 다시 확인할 수 없습니다.");
    }

    const transactionMale = { id: maleSnap.id, ...maleSnap.data() };
    const transactionFemale = { id: femaleSnap.id, ...femaleSnap.data() };
    if (!isMatchAvailableApplication(transactionMale) || !isMatchAvailableApplication(transactionFemale)) {
      throw new Error("다른 작업에서 회원 상태가 변경되었습니다. 목록을 새로고침해주세요.");
    }
    if (getRoundId(transactionMale) !== roundId || getRoundId(transactionFemale) !== roundId) {
      throw new Error("회원의 회차가 변경되었습니다. 목록을 새로고침해주세요.");
    }
    if (getSameCompanyConflict(transactionMale, transactionFemale).blocked) {
      throw new Error("동일 회사 신청자끼리는 매칭할 수 없습니다.");
    }

    transaction.set(matchRef, matchPayload);
    transaction.update(maleRef, {
      matchingStatus: "proposed",
      currentProposal: buildCurrentProposal(female.id, matchId, {
        createdAtClient,
        responseDueAtClient,
      }),
      updatedAt: serverTimestamp(),
    });
    transaction.update(femaleRef, {
      matchingStatus: "proposed",
      currentProposal: buildCurrentProposal(male.id, matchId, {
        createdAtClient,
        responseDueAtClient,
      }),
      updatedAt: serverTimestamp(),
    });
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
  if (!applicationId) throw new Error("매칭 상태를 처리할 신청자 정보가 없습니다.");

  const matchId = typeof match === "string" ? match : match?.id || "";
  const nowClient = new Date().toISOString();
  const isReady = mode === "ready";
  const currentApplication = await getApplicationById(applicationId);
  if (isReady && !hasMatchingEligibleProfilePhotos(currentApplication || {})) {
    throw new Error(`다음 매칭을 준비하려면 프로필 사진이 최소 ${TWOWEEKS_MIN_PROFILE_PHOTOS}장 필요합니다. 기존 승인 1~2장 회원은 예외입니다.`);
  }
  const lastMutualContactMatchId = String(currentApplication?.lastMutualContactMatchId || "");
  const lastClosedContactMatchId = String(currentApplication?.lastClosedContactMatchId || "");
  const contactWasOpen =
    isReady &&
    (String(currentApplication?.contactOpenStatus || "") === "mutual_open" ||
      String(currentApplication?.nextRoundStatus || "") === "contact_connected");
  const contactMatchId =
    lastMutualContactMatchId ||
    lastClosedContactMatchId ||
    (contactWasOpen ? currentApplication?.lastCompletedMatchId || matchId : "");
  const hadMutualConnection = isReady && Boolean(contactMatchId);

  const applicationPatch = isReady
    ? {
        matchingStatus: "not_started",
        currentProposal: deleteField(),
        schedule: deleteField(),
        scheduleStatus: "not_started",
        meetingStatus: "not_started",
        photoRevealStatus: "hidden",
        nextRoundStatus: "ready",
        matchingAvailability: "active",
        matchingPauseReason: deleteField(),
        ...(hadMutualConnection ? { lastMutualContactMatchId: contactMatchId } : {}),
        ...(contactWasOpen
          ? {
              contactOpenStatus: "hidden",
              lastClosedContactMatchId: contactMatchId || matchId || "",
              contactClosedAt: serverTimestamp(),
              contactClosedAtClient: nowClient,
            }
          : {}),
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
        nextRoundStatus: "user_paused",
        matchingAvailability: "paused",
        matchingPauseReason: "admin_override",
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
            status: isReady ? "queued" : "user_paused",
            processedByUid: adminUid,
            processedAt: serverTimestamp(),
            processedAtClient: nowClient,
          },
        },
        ...(hadMutualConnection && contactMatchId === matchId
          ? {
              connectionOutcome: {
                status: "mutual_connected",
                mutualContactConsent: true,
                determinedAt: serverTimestamp(),
                determinedAtClient: nowClient,
                source: "admin_next_round_backfill",
              },
            }
          : {}),
        ...(contactWasOpen && contactMatchId === matchId
          ? {
              contactVisibilityByApplicationId: {
                [applicationId]: {
                  status: "hidden",
                  reason: "admin_ready_next_matching",
                  closedAt: serverTimestamp(),
                  closedAtClient: nowClient,
                },
              },
            }
          : {}),
        nextRoundProcessedAt: serverTimestamp(),
        nextRoundProcessedAtClient: nowClient,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  if (hadMutualConnection && contactMatchId !== matchId) {
    await setDoc(
      doc(db, "twoweeksMatches", contactMatchId),
      {
        connectionOutcome: {
          status: "mutual_connected",
          mutualContactConsent: true,
          determinedAt: serverTimestamp(),
          determinedAtClient: nowClient,
          source: "admin_next_round_backfill",
        },
        ...(contactWasOpen
          ? {
              contactVisibilityByApplicationId: {
                [applicationId]: {
                  status: "hidden",
                  reason: "admin_ready_next_matching",
                  closedAt: serverTimestamp(),
                  closedAtClient: nowClient,
                },
              },
            }
          : {}),
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
    "현재 단계 기한인 24시간 내 선택해주세요.",
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
      phoneLast4: phone.slice(-4),
      sentAtClient: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[TwoWeeksAdmin] schedule reminder sms failed:", error);

    return {
      applicationId: application.id,
      status: "failed",
      phoneLast4: phone.slice(-4),
      reason: "SMS_SEND_FAILED",
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
      phoneLast4: phone.slice(-4),
      sentAtClient: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[TwoWeeksAdmin] final meeting sms failed:", error);

    return {
      status: "failed",
      phoneLast4: phone.slice(-4),
      reason: "SMS_SEND_FAILED",
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

  if (
    isValidTwoWeeksSchedulePolicy(match?.schedulePolicy) &&
    !match.schedulePolicy.allowedTimeOptionIds.includes(finalTimeChoice.id)
  ) {
    throw new Error("고정된 다음 주말 후보에 포함되지 않은 일정입니다. 매칭 정보를 다시 확인해주세요.");
  }

  const meetingStartMs = Date.parse(String(finalTimeChoice?.startAtClient || ""));
  if (!Number.isNaN(meetingStartMs) && meetingStartMs <= Date.now()) {
    throw new Error("이미 지난 일시는 확정할 수 없습니다. 새 일정 후보를 안내해주세요.");
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
        finalTimeChoice,
        finalPlaceChoice,
        finalChoice,
        selectedChoice: finalChoice,
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
  requireDepositAfterNoShow = false,
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
    matchingAvailability: "active",
    matchingPauseReason: deleteField(),
    lastCompletedMatchId: match.id,
    updatedAt: serverTimestamp(),
  };

  const moveToNextMatchingOrTopUp = async (applicationId, extraReadyPatch = {}) => {
    if (!applicationId) return;
    const applicationRef = doc(db, "twoweeksApplications", applicationId);
    const applicationSnap = await getDoc(applicationRef).catch(() => null);
    if (!applicationSnap?.exists()) return;
    const application = { id: applicationSnap.id, ...applicationSnap.data() };
    const deposit = application.deposit || {};
    const eligible = isDepositParticipationEligible(deposit);

    if (eligible && hasMatchingEligibleProfilePhotos(application)) {
      await updateDoc(applicationRef, { ...clearToReadyPatch, ...extraReadyPatch }).catch(() => {});
      return;
    }

    if (eligible) {
      await updateDoc(applicationRef, {
        ...clearToReadyPatch,
        ...extraReadyPatch,
        matchingStatus: "not_ready",
        nextRoundStatus: "not_ready",
        matchingAvailability: "paused",
        matchingPauseReason: "profile_photos_required",
      }).catch(() => {});
      return;
    }

    await updateDoc(applicationRef, {
      matchingStatus: "paused",
      currentProposal: deleteField(),
      schedule: deleteField(),
      scheduleStatus: "not_started",
      meetingStatus: "not_started",
      photoRevealStatus: "hidden",
      nextRoundStatus: "top_up_required",
      matchingAvailability: "paused",
      matchingPauseReason: "top_up_required",
      lastCompletedMatchId: match.id,
      updatedAt: serverTimestamp(),
    }).catch(() => {});
  };

  if (cleanStatus === "no_show_confirmed" || cleanStatus === "self_no_show_confirmed") {
    if (finalAccusedId) {
      const accusedRef = doc(db, "twoweeksApplications", finalAccusedId);
      const accusedSnap = await getDoc(accusedRef).catch(() => null);
      const accusedApplication = accusedSnap?.exists()
        ? { id: accusedSnap.id, ...accusedSnap.data() }
        : { id: finalAccusedId };
      const currentDeposit = accusedApplication.deposit || {};
      const depositWaived = isDepositWaived(currentDeposit);
      const alreadyDeductedForMatch =
        currentDeposit.noShowMatchId === match.id &&
        ["deducted_top_up_required", "top_up_completed"].includes(currentDeposit.noShowResolution);
      const requiredBalance = getDepositRequiredBalance(currentDeposit);
      const currentBalance = getDepositBalance(currentDeposit);
      const deductionAmount = Math.min(
        currentBalance,
        getDepositDeductionPolicy(currentDeposit).noShow.amount
      );
      const nextBalance = Math.max(0, currentBalance - deductionAmount);
      const topUpRequiredAmount = Math.max(0, requiredBalance - nextBalance);
      const totalDeducted = Number(currentDeposit.totalDeducted || 0) + deductionAmount;
      const history = makeDepositHistoryEntry({
        type: "deduction",
        amount: deductionAmount,
        balanceAfter: nextBalance,
        reason: "no_show_confirmed",
        matchId: match.id,
        adminUid,
        note: "관리자 노쇼 확정에 따른 예치금 전액 차감",
      });

      if (!alreadyDeductedForMatch && !depositWaived) {
        await updateDoc(accusedRef, {
        matchingStatus: "paused",
        nextRoundStatus: "top_up_required",
        matchingAvailability: "paused",
        matchingPauseReason: "top_up_required",
        currentProposal: deleteField(),
        schedule: deleteField(),
        scheduleStatus: "not_started",
        meetingStatus: "not_started",
        photoRevealStatus: "hidden",
        "deposit.status": "topup_required",
        "deposit.balance": nextBalance,
        "deposit.requiredBalance": requiredBalance,
        "deposit.topUpRequiredAmount": topUpRequiredAmount,
        "deposit.totalDeducted": totalDeducted,
        "deposit.participationEligible": false,
        "deposit.noShowResolution": "deducted_top_up_required",
        "deposit.noShowMatchId": match.id,
        "deposit.lastDeductionAmount": deductionAmount,
        "deposit.lastDeductionReason": "no_show_confirmed",
        "deposit.lastDeductedAt": serverTimestamp(),
        "deposit.lastDeductedAtClient": nowClient,
        "deposit.lastDeductedByUid": adminUid,
        "deposit.history": arrayUnion(history),
        "penaltyStats.noShowCount": increment(1),
        "penaltyStats.totalIssueCount": increment(1),
        "penaltyStats.lastPenaltyReason": cleanStatus,
        "penaltyStats.lastPenaltyAt": serverTimestamp(),
        "penaltyStats.lastPenaltyAtClient": nowClient,
        "penaltyStats.reviewStatus": "top_up_required",
        updatedAt: serverTimestamp(),
        });

        const sms = await sendDepositMessage(
          accusedApplication,
          buildNoShowDepositDeductionMessage(accusedApplication, deductionAmount, topUpRequiredAmount),
          "투윅스 노쇼 예치금 차감"
        );

        await updateDoc(accusedRef, {
          "deposit.noShowDeductionSms": sms,
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }

      if (depositWaived) {
        await updateDoc(accusedRef, {
          matchingStatus: "paused",
          nextRoundStatus: "sanction_restricted",
          matchingAvailability: "paused",
          matchingPauseReason: "sanction_restricted",
          currentProposal: deleteField(),
          schedule: deleteField(),
          scheduleStatus: "not_started",
          meetingStatus: "not_started",
          photoRevealStatus: "hidden",
          "deposit.policy": "waived",
          "deposit.status": "waived",
          "deposit.waived": true,
          "deposit.participationEligible": true,
          "penaltyStats.lastPenaltyReason": cleanStatus,
          "penaltyStats.lastPenaltyAt": serverTimestamp(),
          "penaltyStats.lastPenaltyAtClient": nowClient,
          updatedAt: serverTimestamp(),
        });
      }

      await manageMemberSanction({
        applicationId: finalAccusedId,
        action: "record_no_show",
        matchId: match.id,
        memo,
        eventKey: `no_show_${match.id}`,
      });

      if (depositWaived && requireDepositAfterNoShow) {
        await manageMemberSanction({
          applicationId: finalAccusedId,
          action: "require_deposit",
          matchId: match.id,
          memo: memo || "노쇼 확정 후 예치금 필수 전환",
          eventKey: `require_deposit_${match.id}`,
        });
      }
    }

    const innocentApplicationId = getCounterpartIdFromMatch(match, finalAccusedId);
    if (innocentApplicationId) {
      await moveToNextMatchingOrTopUp(innocentApplicationId, {
        nextRoundStatus: "priority_review",
        "penaltyStats.lastNoPenaltyReason": "counterpart_no_show_confirmed",
        "penaltyStats.lastNoPenaltyAtClient": nowClient,
      });
    }
  }

  if (cleanStatus === "no_show_dismissed" || cleanStatus === "no_penalty_rematch") {
    const participantIds = [match.maleApplicationId, match.femaleApplicationId].filter(Boolean);
    await Promise.all(participantIds.map((applicationId) => moveToNextMatchingOrTopUp(applicationId)));
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


export async function completeDepositRefund(application) {
  if (!application?.id) throw new Error("신청 정보를 확인할 수 없습니다.");

  try {
    const functions = getFunctions(undefined, "asia-northeast3");
    const callable = httpsCallable(functions, "completeTwoWeeksDepositRefund");
    const result = await callable({ applicationId: application.id });
    return result?.data || { ok: true };
  } catch (error) {
    console.error("[TwoWeeksAdmin] deposit refund complete callable failed:", error);
    throw new Error(error?.message?.replace(/^FirebaseError:\s*/i, "") || "예치금 반환 완료 처리 중 오류가 발생했습니다.");
  }
}


export function subscribeTwoWeeksMarketingStories({ onReviews, onStories }) {
  const unsubReviews = onSnapshot(
    collection(db, "twoweeksReviews"),
    (snapshot) => onReviews?.(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    (error) => { console.error("[TwoWeeksAdmin] review subscription error:", error); onReviews?.([]); }
  );
  const unsubStories = onSnapshot(
    collection(db, "twoweeksSuccessStories"),
    (snapshot) => onStories?.(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    (error) => { console.error("[TwoWeeksAdmin] success story subscription error:", error); onStories?.([]); }
  );
  return () => { unsubReviews(); unsubStories(); };
}

export async function moderateTwoWeeksMarketingContent({ type, contentId, action, publicContent = "" }) {
  const functions = getFunctions(undefined, "asia-northeast3");
  const callable = httpsCallable(functions, "moderateTwoWeeksMarketingContent");
  const result = await callable({ type, contentId, action, publicContent });
  return result?.data || { ok: true };
}
