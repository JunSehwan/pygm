const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const crypto = require("crypto");
const {
  isTwoWeeksTestPhone,
  normalizeTwoWeeksPhone,
} = require("./twoWeeksTestAuth");
const {
  TWOWEEKS_MAX_PROFILE_PHOTOS,
  TWOWEEKS_MIN_PROFILE_PHOTOS,
} = require("./twoWeeksProfilePhotoPolicy");
const { resolveApplicationMarketingData } = require("./twoWeeksMarketingAttribution");
const { buildInitialDeposit, normalizeGender } = require("./twoWeeksInitialDepositPolicy");

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = "asia-northeast3";

function onlyDigits(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

function compactText(value = "", maxLength = 160) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function compactTextList(value, maxItems = 3, maxLength = 40) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => compactText(item, maxLength)).filter(Boolean))).slice(0, maxItems);
}

function sha256(value = "") {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function formatKoreanPhone(value = "") {
  const digits = onlyDigits(value);
  if (/^01\d{9}$/.test(digits)) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (/^01\d{8}$/.test(digits)) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

function duplicateApplicationError() {
  return new HttpsError(
    "already-exists",
    "이미 가입된 연락처 또는 본인인증 정보가 있습니다. 새로 가입하지 말고 기존 신청현황에서 확인해주세요."
  );
}

async function findExistingApplicationByPhone(phone, excludeApplicationId = "") {
  const normalizedPhone = normalizeTwoWeeksPhone(phone);
  if (!normalizedPhone) return null;

  const db = admin.firestore();
  const queries = [
    db.collection("twoweeksApplications").where("basic.phoneNormalized", "==", normalizedPhone).limit(3),
    db.collection("twoweeksApplications").where("phoneIdentityVerification.phone", "==", normalizedPhone).limit(3),
    db.collection("twoweeksApplications").where("basic.phone", "==", formatKoreanPhone(normalizedPhone)).limit(3),
    db.collection("twoweeksApplications").where("basic.phone", "==", normalizedPhone).limit(3),
  ];

  for (const query of queries) {
    const snap = await query.get();
    const found = snap.docs.find((doc) => doc.id !== excludeApplicationId);
    if (found) return { id: found.id, data: found.data() || {} };
  }

  return null;
}

async function findExistingApplicationByCiHash(ciHash, excludeApplicationId = "") {
  const normalizedHash = String(ciHash || "").trim();
  if (!normalizedHash) return null;

  const snap = await admin
    .firestore()
    .collection("twoweeksIdentityVerifications")
    .where("ciHash", "==", normalizedHash)
    .limit(10)
    .get();

  for (const doc of snap.docs) {
    const data = doc.data() || {};
    const applicationId = String(data.applicationId || "").trim();
    if (applicationId && applicationId !== excludeApplicationId) {
      return { id: applicationId };
    }
  }

  return null;
}

async function assertNoDuplicateApplication({ verified, phone, applicationId = "" }) {
  if (verified?.isTestIdentity) return;

  const byPhone = await findExistingApplicationByPhone(phone, applicationId);
  if (byPhone) throw duplicateApplicationError();

  const byCi = await findExistingApplicationByCiHash(verified?.data?.ciHash || "", applicationId);
  if (byCi) throw new HttpsError(
    "already-exists",
    "동일한 본인인증 정보로 등록된 신청이 있습니다. 연락처를 변경한 이력이 있거나 신청현황에서 조회되지 않으면 고객센터에 문의해주세요."
  );

  // 신청서 번호만 수동 변경해도 등록 당시의 중복 방지 claim은 남아있을 수 있습니다.
  // 이 경우 파일 업로드 전에 감지하고, claim을 삭제하거나 재가입 허용으로 우회하지 않습니다.
  const refs = identityClaimRefs({ phone, ciHash: verified?.data?.ciHash || "" });
  const snaps = await Promise.all(refs.map((ref) => ref.get()));
  for (let index = 0; index < snaps.length; index += 1) {
    if (!snaps[index].exists) continue;
    const linkedApplicationId = String(snaps[index].data()?.applicationId || "").trim();
    if (!linkedApplicationId || linkedApplicationId === applicationId) continue;
    throw new HttpsError(
      "already-exists",
      index === 0
        ? "기존 신청 연락처 기록이 남아 있습니다. 번호 변경 이력이 있거나 신청현황에서 조회되지 않으면 고객센터에 문의해주세요."
        : "동일한 본인인증 정보로 등록된 신청이 있습니다. 연락처를 변경한 이력이 있거나 신청현황에서 조회되지 않으면 고객센터에 문의해주세요."
    );
  }
}

function identityClaimRefs({ phone, ciHash }) {
  const db = admin.firestore();
  const refs = [
    db.collection("twoweeksIdentityClaims").doc(`phone_${sha256(`phone:${onlyDigits(phone)}`)}`),
  ];

  if (ciHash) {
    refs.push(db.collection("twoweeksIdentityClaims").doc(`ci_${String(ciHash).trim()}`));
  }

  return refs;
}

function assertAuthenticated(request) {
  const uid = String(request.auth?.uid || "").trim();
  if (!uid) {
    throw new HttpsError("unauthenticated", "신청을 저장하기 위한 인증 세션이 없습니다. 페이지를 새로고침한 뒤 다시 시도해주세요.");
  }
  return uid;
}

function assertApplicationId(applicationId = "") {
  const value = String(applicationId || "").trim();
  if (!/^[A-Za-z0-9_-]{10,80}$/.test(value)) {
    throw new HttpsError("invalid-argument", "신청 식별정보가 올바르지 않습니다. 다시 시도해주세요.");
  }
  return value;
}

function assertOwnedStorageMeta(meta, prefix, label) {
  if (!meta || typeof meta !== "object") {
    throw new HttpsError("invalid-argument", `${label} 업로드 정보가 없습니다. 파일을 다시 선택해주세요.`);
  }

  const path = String(meta.path || "").trim();
  if (!path || !path.startsWith(prefix)) {
    throw new HttpsError("permission-denied", `${label} 업로드 경로를 확인하지 못했습니다. 다시 업로드해주세요.`);
  }

  return {
    ...meta,
    path,
    url: compactText(meta.url || "", 2048),
    name: compactText(meta.name || "", 255),
    type: compactText(meta.type || "", 120),
    size: Number(meta.size || 0),
  };
}

async function getVerifiedIdentity({ uid, verificationId, phone }) {
  const normalizedPhone = normalizeTwoWeeksPhone(phone);
  const normalizedVerificationId = String(verificationId || "").trim().slice(0, 120);
  const isTestIdentity = isTwoWeeksTestPhone(normalizedPhone);

  if (!normalizedPhone) {
    throw new HttpsError("invalid-argument", "본인인증 연락처를 확인하지 못했습니다.");
  }

  if (isTestIdentity) {
    return {
      isTestIdentity: true,
      verificationId: `test_${normalizedPhone}`,
      phone: normalizedPhone,
      name: "",
      birth: "",
      gender: "",
      carrier: "",
      ref: null,
      data: null,
    };
  }

  if (!normalizedVerificationId) {
    throw new HttpsError("failed-precondition", "본인인증 확인정보가 없습니다. 본인인증을 다시 진행해주세요.");
  }

  const ref = admin.firestore().collection("twoweeksIdentityVerifications").doc(normalizedVerificationId);
  const snap = await ref.get();

  if (!snap.exists) {
    throw new HttpsError("failed-precondition", "본인인증 확인정보가 만료되었거나 존재하지 않습니다. 본인인증을 다시 진행해주세요.");
  }

  const data = snap.data() || {};
  const expiresAtMs = data.expiresAt?.toMillis?.() || 0;

  if (data.verified !== true) {
    throw new HttpsError("failed-precondition", "본인인증 완료 상태를 확인하지 못했습니다. 다시 본인인증해주세요.");
  }

  if (String(data.ownerUid || "") !== uid) {
    throw new HttpsError("failed-precondition", "본인인증 당시의 로그인 세션과 현재 신청 세션이 달라졌습니다. 본인인증을 한 번만 다시 진행해주세요.");
  }

  if (normalizeTwoWeeksPhone(data.phone || "") !== normalizedPhone) {
    throw new HttpsError("failed-precondition", "본인인증한 연락처와 신청 연락처가 일치하지 않습니다. 다시 본인인증해주세요.");
  }

  if (!expiresAtMs || expiresAtMs <= Date.now()) {
    throw new HttpsError("deadline-exceeded", "본인인증 유효시간이 지났습니다. 본인인증을 다시 진행해주세요.");
  }

  return {
    isTestIdentity: false,
    verificationId: normalizedVerificationId,
    phone: normalizedPhone,
    name: compactText(data.name || "", 80),
    birth: onlyDigits(data.birth || "").slice(0, 8),
    gender: compactText(data.gender || "", 20),
    carrier: compactText(data.carrier || "", 40),
    ref,
    data,
  };
}

exports.validateTwoWeeksApplicationSubmission = onCall(
  { region: REGION },
  async (request) => {
    const uid = assertAuthenticated(request);
    const payload = request.data || {};

    const verified = await getVerifiedIdentity({
      uid,
      verificationId: payload.identityVerificationId,
      phone: payload.phone,
    });

    // 사진 업로드 전에 기존 가입 여부를 먼저 확인해 불필요한 업로드/중복 신청을 막는다.
    await assertNoDuplicateApplication({
      verified,
      phone: payload.phone,
    });

    return { ready: true };
  }
);

exports.finalizeTwoWeeksApplicationSubmission = onCall(
  { region: REGION },
  async (request) => {
    const uid = assertAuthenticated(request);
    const payload = request.data || {};
    const applicationId = assertApplicationId(payload.applicationId);
    const incoming = payload.application;

    if (!incoming || typeof incoming !== "object") {
      throw new HttpsError("invalid-argument", "신청 정보가 없습니다.");
    }

    let basic = incoming.basic && typeof incoming.basic === "object" ? incoming.basic : {};
    // 필수 약관 동의는 화면 검증과 별도로 서버에서도 확인합니다.
    // 마케팅은 명시적으로 true일 때만 동의로 기록하며, 선택하지 않아도 가입됩니다.
    const incomingConsents = incoming.consents && typeof incoming.consents === "object" ? incoming.consents : {};
    const requiredConsentKeys = ["privacy", "profileContact", "noShowDeposit", "falseInfo"];
    if (!requiredConsentKeys.every((key) => incomingConsents[key] === true)) {
      throw new HttpsError("failed-precondition", "필수 약관에 동의한 뒤 신청해주세요.");
    }

    // 회원가입 화면의 필수 입력값을 서버에서도 재검증합니다.
    const height = Number(basic.height);
    const schoolName = compactText(incoming.identity?.schoolName || "", 80);
    if (!Number.isInteger(height) || height < 100 || height > 250) {
      throw new HttpsError("invalid-argument", "키를 정확하게 입력해주세요.");
    }
    if (!schoolName) {
      throw new HttpsError("invalid-argument", "학교명을 입력해주세요.");
    }

    const identityInput = incoming.phoneIdentityVerification && typeof incoming.phoneIdentityVerification === "object"
      ? incoming.phoneIdentityVerification
      : {};
    const phone = normalizeTwoWeeksPhone(basic.phoneNormalized || basic.phone || identityInput.phone || "");
    const isTestIdentity = isTwoWeeksTestPhone(phone);

    if (String(incoming.uid || "") !== uid) {
      throw new HttpsError("permission-denied", "신청자 인증정보가 일치하지 않습니다. 다시 시도해주세요.");
    }

    if (
      !isTestIdentity &&
      (basic.phoneVerified !== true || basic.phoneVerificationSkipped === true || identityInput.verified !== true)
    ) {
      throw new HttpsError("failed-precondition", "본인인증 완료 상태를 확인하지 못했습니다. 다시 본인인증해주세요.");
    }

    const verified = await getVerifiedIdentity({
      uid,
      verificationId: identityInput.verificationId,
      phone,
    });

    // 성별·성명·생년월일은 본인인증 서버 기록을 기준으로 저장합니다.
    // 클라이언트 값과 예치금 정책에 서로 다른 성별이 반영되지 않게 합니다.
    const verifiedGender = normalizeGender(verified.isTestIdentity ? basic.gender : verified.gender);
    const birth = verified.isTestIdentity ? onlyDigits(basic.birthDate || identityInput.birth || "").slice(0, 8) : verified.birth;
    if (!["male", "female"].includes(verifiedGender) || !/^\d{8}$/.test(birth)) {
      throw new HttpsError("invalid-argument", "본인인증 성별과 생년월일을 확인해주세요.");
    }
    const birthYear = Number(birth.slice(0, 4));
    const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).replace(/-/g, "");
    const age = Number(today.slice(0, 4)) - birthYear - (today.slice(4) < birth.slice(4) ? 1 : 0);
    if (age < 18 || age > 100) throw new HttpsError("invalid-argument", "성인 신청자의 생년월일을 확인해주세요.");
    basic = { ...basic, gender: verifiedGender, name: verified.name || compactText(basic.name, 80), birthYear, birthDate: birth, age, ageType: "full_age" };

    // preflight를 우회하거나 동시에 두 창에서 가입하더라도 서버 최종 저장 단계에서 다시 차단한다.
    await assertNoDuplicateApplication({
      verified,
      phone,
      applicationId,
    });

    const photosPrefix = `twoweeksApplications/${applicationId}/${uid}/photos/`;
    const verificationPrefix = `twoweeksApplications/${applicationId}/${uid}/verification/`;
    const identityBlock = incoming.identity && typeof incoming.identity === "object" ? incoming.identity : {};
    const matchingInput = incoming.matchingPreferences && typeof incoming.matchingPreferences === "object" ? incoming.matchingPreferences : {};
    const traitsInput = incoming.profileTraits && typeof incoming.profileTraits === "object" ? incoming.profileTraits : {};
    const representativePhoto = assertOwnedStorageMeta(identityBlock.representativePhoto, photosPrefix, "대표사진");
    const additionalPhotos = Array.isArray(identityBlock.additionalPhotos)
      ? identityBlock.additionalPhotos.map((item, index) => assertOwnedStorageMeta(item, photosPrefix, `추가사진 ${index + 1}`))
      : [];
    const profilePhotoCount = 1 + additionalPhotos.length;

    if (profilePhotoCount < TWOWEEKS_MIN_PROFILE_PHOTOS) {
      throw new HttpsError(
        "failed-precondition",
        `프로필 사진은 대표사진 포함 최소 ${TWOWEEKS_MIN_PROFILE_PHOTOS}장을 등록해주세요.`
      );
    }
    if (profilePhotoCount > TWOWEEKS_MAX_PROFILE_PHOTOS) {
      throw new HttpsError(
        "invalid-argument",
        `프로필 사진은 최대 ${TWOWEEKS_MAX_PROFILE_PHOTOS}장까지 등록할 수 있습니다.`
      );
    }
    const verificationDocument = assertOwnedStorageMeta(payload.verificationDocument, verificationPrefix, "인증자료");

    const applicationRef = admin.firestore().collection("twoweeksApplications").doc(applicationId);
    const privateRef = admin.firestore().collection("twoweeksApplicationPrivate").doc(applicationId);

    const existing = await applicationRef.get();
    if (existing.exists) {
      const existingData = existing.data() || {};
      if (String(existingData.uid || "") === uid) {
        return {
          ok: true,
          applicationId,
          alreadyFinalized: true,
          firestoreProjectId: String(process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || ""),
          gender: String(existingData?.basic?.gender || ""),
          depositPolicy: String(existingData?.deposit?.policy || (existingData?.deposit?.status === "waived" ? "waived" : "required")),
        };
      }
      throw new HttpsError("already-exists", "이미 사용 중인 신청 식별정보입니다. 다시 시도해주세요.");
    }

    if (!verified.isTestIdentity && verified.data?.applicationId && verified.data.applicationId !== applicationId) {
      throw new HttpsError("already-exists", "이 본인인증 정보로 이미 다른 신청이 생성되었습니다. 기존 신청현황을 확인해주세요.");
    }

    const safeDashboardAccess = {
      method: "sms_otp",
      revoked: false,
      tokenStoredPrivately: false,
      createdAtClient: compactText(incoming.dashboardAccess?.createdAtClient || new Date().toISOString(), 80),
      sessionTtlDays: 7,
      note: "신청현황 조회는 휴대폰 인증번호 6자리를 사용합니다.",
    };

    const depositInput = incoming.deposit && typeof incoming.deposit === "object" ? incoming.deposit : {};
    const safeDeposit = buildInitialDeposit({
      // 일반 회원은 서버가 확인한 본인인증 성별을 우선 사용해 클라이언트 조작으로
      // 면제 정책을 받을 수 없게 한다. 테스트 번호만 입력 폼 성별을 사용한다.
      gender: verified.isTestIdentity ? basic.gender : (verified.gender || basic.gender),
      roundId: incoming.roundId,
      incoming: depositInput,
    });
    // 향후 별도 입금을 요청하기 전에는 신규 회원에게 입금을 재촉하지 않습니다.
    // 기존 status / balance 필드는 유지하여 승인·매칭 제한 정책과 호환합니다.
    safeDeposit.requestStage = safeDeposit.policy === "waived" ? "not_applicable" : "later";
    safeDeposit.requestedAtClient = null;
    safeDeposit.policyAppliedAt = admin.firestore.FieldValue.serverTimestamp();

    const serverIdentity = {
      verified: true,
      provider: verified.isTestIdentity ? "TEST_OTP" : "PORTONE",
      phone: verified.phone,
      name: verified.name || compactText(identityInput.name || "", 80),
      birth: verified.birth || onlyDigits(identityInput.birth || "").slice(0, 8),
      gender: verified.gender || compactText(identityInput.gender || "", 20),
      carrier: verified.carrier || compactText(identityInput.carrier || "", 40),
      verificationId: verified.verificationId,
      source: "twoweeks_register",
      verifiedAtClient: compactText(identityInput.verifiedAtClient || new Date().toISOString(), 80),
    };

    // 마케팅 정보와 추천인 검증은 가입 핵심 데이터와 분리한다.
    // 잘못된 캠페인은 direct로, 확인되지 않은 추천인은 검토 상태로 저장해 가입을 막지 않는다.
    let resolvedMarketing;
    try {
      resolvedMarketing = await resolveApplicationMarketingData(incoming, uid);
    } catch (error) {
      console.error("[TwoWeeks] marketing attribution resolution failed:", error);
      resolvedMarketing = {
        marketingAttribution: {
          firstSource: "direct",
          firstCampaign: "",
          firstLandingAtClient: "",
          lastSource: "direct",
          lastCampaign: "",
          lastLandingAtClient: "",
          registeredAt: admin.firestore.FieldValue.serverTimestamp(),
          validation: "fallback_direct",
        },
        selfReportedSource: "",
        selfReportedSourceDetail: "",
        referral: {
          referredByUserId: null,
          referrerNameInput: compactText(incoming.referralInput?.name || "", 40),
          referrerPhoneLast4Input: onlyDigits(incoming.referralInput?.phoneLast4 || "").slice(-4),
          status: incoming.referralInput?.name || incoming.referralInput?.phoneLast4 ? "needs_review" : "none",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      };
    }

    const applicationData = {
      schemaVersion: 4,
      source: "twoweeks_mvp_web",
      roundId: compactText(incoming.roundId, 80),
      roundLabel: compactText(incoming.roundLabel, 80),
      applicantAuthProvider: compactText(incoming.applicantAuthProvider, 40),
      inquiryLinkClicked: false,
      completedAtClient: compactText(incoming.completedAtClient, 80),
      disclosurePolicySnapshot: {
        proposalStage: `등록한 프로필 사진(최소 ${TWOWEEKS_MIN_PROFILE_PHOTOS}장)과 기본 정보 일부 공개`,
        profilePhotoMinimum: TWOWEEKS_MIN_PROFILE_PHOTOS,
        profilePhotoMaximum: TWOWEEKS_MAX_PROFILE_PHOTOS,
        contactDisclosure: "소개팅 후 상호 연결 희망 시 공개",
        identityDocumentDisclosure: "상대방에게 공개하지 않음",
        organizationDisclosure: "후보 제안 단계 비공개, 양쪽 만남 진행 의사 확인 후 공개",
      },
      ...resolvedMarketing,
      testMode: verified.isTestIdentity,
      uid,
      status: "applied",
      reviewStatus: "pending",
      matchingStatus: "not_ready",
      proposalCount: 0,
      rematchingPriority: false,
      completionSmsStatus: "pending",
      dashboardAccess: safeDashboardAccess,
      basic: {
        ...basic,
        phoneNormalized: verified.phone,
        phoneVerified: true,
        phoneVerificationSkipped: false,
      },
      phoneIdentityVerification: serverIdentity,
      identity: {
        ...identityBlock,
        educationLevel: compactText(identityBlock.educationLevel || "", 40),
        schoolName: compactText(identityBlock.schoolName || "", 80),
        representativePhoto,
        additionalPhotos,
        verificationDocument: null,
        verificationDocumentStoredPrivately: true,
      },
      matchingPreferences: {
        ...matchingInput,
        preferredAgeRange: matchingInput.preferredAgeRange && Number(matchingInput.preferredAgeRange.min) >= 18 && Number(matchingInput.preferredAgeRange.max) <= 80 && Number(matchingInput.preferredAgeRange.min) <= Number(matchingInput.preferredAgeRange.max)
          ? { min: Number(matchingInput.preferredAgeRange.min), max: Number(matchingInput.preferredAgeRange.max) }
          : null,
        preferredDrinking: compactText(matchingInput.preferredDrinking || "", 40),
        preferredStyles: compactTextList(matchingInput.preferredStyles, 3, 40),
        preferredJobCategories: compactTextList(matchingInput.preferredJobCategories, 2, 40),
        additionalPreference: compactText(matchingInput.additionalPreference || "", 300),
      },
      profileTraits: {
        mbti: compactText(traitsInput.mbti || "", 10),
        interests: compactTextList(traitsInput.interests, 3, 40),
      },
      // 기존 관리자/마케팅 시스템이 읽는 5개 동의값은 그대로 유지합니다.
      consents: {
        privacy: true,
        profileContact: true,
        noShowDeposit: true,
        falseInfo: true,
        marketing: incomingConsents.marketing === true,
        agreedAtClient: compactText(incomingConsents.agreedAtClient || "", 80),
        agreedAtServer: admin.firestore.FieldValue.serverTimestamp(),
      },
      deposit: safeDeposit,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // 클라이언트가 관리자 전용 필드를 섞어 보내더라도 공개 신청서에는 저장하지 않는다.
    delete applicationData.adminMatchingMeta;
    delete applicationData.internalGrade;
    delete applicationData.internalScore;
    delete applicationData.marketingAttributionInput;
    delete applicationData.selfReportedSourceInput;
    delete applicationData.referralInput;

    const privateData = {
      applicationId,
      ownerUid: uid,
      verificationDocument,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const claimRefs = verified.isTestIdentity
      ? []
      : identityClaimRefs({
          phone: verified.phone,
          ciHash: verified.data?.ciHash || "",
        });

    await admin.firestore().runTransaction(async (transaction) => {
      const applicationSnap = await transaction.get(applicationRef);
      if (applicationSnap.exists) {
        const existingData = applicationSnap.data() || {};
        if (String(existingData.uid || "") === uid) {
          return;
        }
        throw new HttpsError("already-exists", "이미 사용 중인 신청 식별정보입니다. 다시 시도해주세요.");
      }

      // 동일 번호/CI로 두 브라우저에서 동시에 가입을 눌러도 claim 문서가 최종 중복 생성을 막는다.
      for (const claimRef of claimRefs) {
        const claimSnap = await transaction.get(claimRef);
        if (claimSnap.exists && String(claimSnap.data()?.applicationId || "") !== applicationId) {
          throw duplicateApplicationError();
        }
      }

      transaction.set(applicationRef, applicationData);
      transaction.set(privateRef, privateData);

      if (verified.ref) {
        transaction.set(
          verified.ref,
          {
            applicationId,
            consumedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      for (const claimRef of claimRefs) {
        transaction.set(claimRef, {
          applicationId,
          ownerUid: uid,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    return {
      ok: true,
      applicationId,
      alreadyFinalized: false,
      firestoreProjectId: String(process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || ""),
      referralStatus: resolvedMarketing.referral?.status || "none",
      gender: String(basic.gender || ""),
      depositPolicy: safeDeposit.policy,
    };
  }
);
