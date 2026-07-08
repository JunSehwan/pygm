import { serverTimestamp } from "firebase/firestore";
import {
  DEFAULT_ROUND_ID,
  DEFAULT_ROUND_LABEL,
  DUMMY_AREAS,
  DUMMY_INTROS,
  DUMMY_JOBS,
  DUMMY_NAMES,
  DUMMY_NICKNAMES,
  DUMMY_ORGS,
  DUMMY_TIMES,
  TEST_PHONE_FORMATTED,
  TEST_PHONE_NORMALIZED,
} from "./constants";

function pickItems(items, seed, minCount = 2, maxCount = 4) {
  const count = minCount + (seed % (maxCount - minCount + 1));
  const rotated = [...items.slice(seed % items.length), ...items.slice(0, seed % items.length)];
  return rotated.slice(0, count);
}

export function makeDummyApplication(seed, adminUid = "") {
  const gender = seed % 2 === 0 ? "male" : "female";
  const name = DUMMY_NAMES[seed % DUMMY_NAMES.length];
  const nickname = DUMMY_NICKNAMES[(seed * 3) % DUMMY_NICKNAMES.length];
  const birthYear = gender === "male" ? 1985 + (seed % 9) : 1988 + (seed % 9);
  const age = new Date().getFullYear() - birthYear + 1;
  const activityAreas = pickItems(DUMMY_AREAS, seed, 2, 4);
  const availableTimeSlots = pickItems(DUMMY_TIMES, seed + 1, 2, 4);
  const preferredArea = activityAreas[0] || "강남구";
  const jobCategory = DUMMY_JOBS[seed % DUMMY_JOBS.length];
  const organizationName = DUMMY_ORGS[(seed + 2) % DUMMY_ORGS.length];
  const batchKey = `dummy_${Date.now()}`;
  const photoSeed = `twoweeks-${gender}-${seed}-${Date.now()}`;

  return {
    applicantAuthProvider: "admin_dummy",
    roundId: DEFAULT_ROUND_ID,
    roundLabel: DEFAULT_ROUND_LABEL,
    schemaVersion: 2,
    source: "twoweeks_admin_dummy",
    uid: `${batchKey}_${seed}`,
    status: "applied",
    reviewStatus: "pending",
    matchingStatus: "not_started",
    proposalCount: 0,
    rematchingPriority: false,
    createdByAdminUid: adminUid,
    createdAt: serverTimestamp(),
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedAtClient: new Date().toISOString(),
    basic: {
      gender,
      name,
      nickname,
      birthYear,
      age,
      phone: TEST_PHONE_FORMATTED,
      phoneNormalized: TEST_PHONE_NORMALIZED,
      phoneVerified: true,
      phoneVerificationSkipped: false,
      maritalStatus: "single",
      activityAreas,
      preferredArea,
      availableTimeSlots,
      height: gender === "male" ? 171 + (seed % 12) : 158 + (seed % 10),
      introduction: DUMMY_INTROS[seed % DUMMY_INTROS.length],
    },
    identity: {
      jobCategory,
      organizationName,
      representativePhoto: {
        url: `https://picsum.photos/seed/${photoSeed}/480/620`,
        path: "",
        name: "dummy-profile.jpg",
        type: "image/jpeg",
        size: 0,
        dummy: true,
      },
      additionalPhotos: [],
      verificationDocument: {
        url: `https://picsum.photos/seed/${photoSeed}-doc/640/420`,
        path: "",
        name: "dummy-verification.jpg",
        type: "image/jpeg",
        size: 0,
        dummy: true,
      },
    },
    phoneIdentityVerification: {
      verified: true,
      provider: "ADMIN_DUMMY",
      phone: TEST_PHONE_NORMALIZED,
      name,
      gender,
      birth: `${birthYear}0101`,
      verifiedAtClient: new Date().toISOString(),
    },
    deposit: {
      amount: 20000,
      currency: "KRW",
      method: "manual_bank_transfer",
      bankName: "하나은행",
      accountNumber: "112-891138-99107",
      accountHolder: "전세환",
      status: seed % 3 === 0 ? "confirmed" : "pending",
    },
    consents: {
      privacy: true,
      profileContact: true,
      noShowDeposit: true,
      falseInfo: true,
      marketing: false,
      agreedAtClient: new Date().toISOString(),
    },
    disclosurePolicySnapshot: {
      proposalStage: "대표 사진 1장과 기본 정보 일부 공개",
      contactDisclosure: "바이트미팅 후 상호 연결 희망 시 공개",
      organizationDisclosure: "운영자 인증용, 상대방에게 공개하지 않음",
      identityDocumentDisclosure: "상대방에게 공개하지 않음",
    },
    policySnapshot: {
      purpose: "신청 진정성 확인 및 노쇼 방지",
      matchingFailedCarryOverDefault: true,
      matchingFailedRefundOnRequest: true,
      normalParticipationRefundOrCarryOver: true,
      noShowOrSameDayCancelNonRefundable: true,
    },
    adminMemo: "관리자 더미 신청자",
    dummyBatchKey: batchKey,
    isDummy: true,
  };
}
