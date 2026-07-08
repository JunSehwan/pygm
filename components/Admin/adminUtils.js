import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

export const SIGNUP_APPROVAL_FREE_SPOON = 8;
export const CHARMINGSOUP_URL = "https://charmingsoup.com";

function getSpoonSnapshot(user = {}) {
  const total = Math.max(Number(user?.spoon || 0), 0);
  const free = Math.max(Number(user?.spoon_free || 0), 0);
  const paid = Math.max(
    Number.isFinite(Number(user?.spoon_paid))
      ? Number(user?.spoon_paid || 0)
      : Math.max(total - free, 0),
    0
  );

  return {
    total,
    free,
    paid,
  };
}

function buildSmsMessage(lines = [], footerUrl = CHARMINGSOUP_URL) {
  const cleaned = lines
    .map((line) => String(line || "").trim())
    .filter(Boolean);

  return ["[차밍수프]", ...cleaned, footerUrl].filter(Boolean).join("\n");
}

export const USER_REJECTION_REASONS = [
  { code: "photo_face", label: "프로필 사진에 본인 얼굴 확인이 필요해요" },
  { code: "photo_rule", label: "프로필 사진이 기준에 맞지 않아요" },
  { code: "basic_info", label: "기본 정보 확인이 필요해요" },
  { code: "profile_text", label: "자기소개/입력 정보 보완이 필요해요" },
  { code: "auth_check", label: "인증 정보 확인이 필요해요" },
];

export const CARD_REJECTION_REASONS = [
  { code: "unclear", label: "질문 의도가 조금 더 분명하면 좋아요" },
  { code: "too_short", label: "내용이 조금 더 구체적이면 좋아요" },
  { code: "expression", label: "표현을 조금만 다듬어주세요" },
  { code: "policy", label: "운영 기준에 맞게 수정이 필요해요" },
  { code: "retry", label: "내용 보완 후 다시 등록해주세요" },
];

export const PROFILE_INCOMPLETE_SMS_REASONS = [
  { code: "profile_photo", label: "프로필 사진 3장" },
  { code: "basic_info", label: "기본정보" },
  { code: "survey", label: "성향/가치관 답변" },
  { code: "intro", label: "자기소개" },
  { code: "company", label: "회사/직업 정보" },
];

export function toMillis(value) {
  if (!value) return 0;
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function formatDateTime(value) {
  const ms = toMillis(value);
  if (!ms) return "-";
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

export function formatLocationValue(value) {
  if (!value) return "-";
  if (typeof value === "string") return value;

  if (typeof value === "object") {
    const sido = value.sido || value.sidoName || value.company_location_sido || "";
    const sigugun =
      value.sigugun ||
      value.sigungu ||
      value.sigugunName ||
      value.company_location_sigugun ||
      "";
    const label = [sido, sigugun].filter(Boolean).join(" ");
    if (label) return label;
  }

  return "-";
}

export function getUserDocId(user = {}) {
  return user?.id || user?.uid || user?.userId || "";
}

export function getDisplayName(user = {}) {
  return (
    user?.nickname ||
    user?.username ||
    user?.name ||
    user?.identity_name ||
    "이름 없음"
  );
}

export function getUserDisplayName(user = {}) {
  return getDisplayName(user);
}

export function getUserGenderLabel(user = {}) {
  const gender = user?.gender || user?.identity_gender || "";
  if (gender === "male") return "남성";
  if (gender === "female") return "여성";
  return gender || "-";
}

export function getUserMbti(user = {}) {
  if (user?.mbti) return user.mbti;

  const ei = user?.mbti_ei || "";
  const sn = user?.mbti_sn || "";
  const tf = user?.mbti_tf || "";
  const jp = user?.mbti_jp || "";
  const joined = `${ei}${sn}${tf}${jp}`.trim();

  return joined || "-";
}

export function getBirthdayLabel(user = {}) {
  if (user?.birthday && typeof user.birthday === "object") {
    const { year, month, day } = user.birthday;
    if (year && month && day) return `${year}.${month}.${day}`;
    if (year) return `${year}년생`;
  }

  if (user?.identity_birth) return user.identity_birth;
  return "-";
}

export function getEducationLabel(user = {}) {
  return (
    user?.educationSchoolName ||
    user?.schoolName ||
    user?.school ||
    user?.education ||
    "-"
  );
}

export function getReligionLabel(user = {}) {
  return user?.religion || "-";
}

export function getSalaryLabel(user = {}) {
  return user?.salary || user?.annual || "-";
}

export function getStyleTestLabel(user = {}) {
  if (user?.styleTest?.typeTitle && user?.styleTest?.oneLine) {
    return `${user.styleTest.typeTitle} · ${user.styleTest.oneLine}`;
  }
  if (user?.styleTest?.typeTitle) return user.styleTest.typeTitle;
  if (user?.styleTest?.oneLine) return user.styleTest.oneLine;
  if (user?.styleTest?.axisLetters) return user.styleTest.axisLetters;
  return getUserMbti(user);
}

export function getHobbyLabel(user = {}) {
  if (Array.isArray(user?.hobbyList)) {
    const filtered = user.hobbyList.filter(Boolean);
    if (filtered.length) return filtered.join(", ");
  }

  if (typeof user?.hobby === "string" && user.hobby.trim()) {
    return user.hobby
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean)
      .join(", ");
  }

  if (typeof user?.interest === "string" && user.interest.trim()) {
    return user.interest
      .split(/[|,/]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .join(", ");
  }

  return "-";
}

export function getJobLabel(user = {}) {
  return (
    user?.duty ||
    user?.occupation ||
    user?.jobTitle ||
    user?.workTitle ||
    user?.jobName ||
    user?.companyName ||
    user?.company ||
    user?.job ||
    "-"
  );
}

export function getCompanyLabel(user = {}) {
  return user?.companyName || user?.company || "-";
}

export function getUserThumbImages(user = {}) {
  const result = [];

  if (Array.isArray(user?.profilePhotos)) {
    user.profilePhotos.forEach((item) => {
      if (typeof item === "string" && item.trim()) {
        result.push(item);
        return;
      }

      if (item && typeof item === "object") {
        if (typeof item.url === "string" && item.url.trim()) {
          result.push(item.url);
          return;
        }
        if (typeof item.path === "string" && item.path.trim()) {
          result.push(item.path);
        }
      }
    });
  }

  if (Array.isArray(user?.thumbimage)) {
    user.thumbimage.forEach((item) => {
      if (typeof item === "string" && item.trim()) {
        result.push(item);
      }
    });
  }

  if (typeof user?.thumbimage === "string" && user.thumbimage.trim()) {
    result.push(user.thumbimage);
  }

  if (typeof user?.image === "string" && user.image.trim()) {
    result.push(user.image);
  }

  if (typeof user?.photoURL === "string" && user.photoURL.trim()) {
    result.push(user.photoURL);
  }

  return [...new Set(result.filter(Boolean))];
}

export function getUserPrimaryImage(user = {}) {
  const images = getUserThumbImages(user);
  return images.length ? images[0] : "";
}

export function normalizeQuestionType(value) {
  if (!value) return "text";
  if (value === "multiple") return "choice";
  if (value === "subjective") return "text";
  if (value === "choice") return "choice";
  if (value === "text") return "text";
  return value;
}

export function getQuestionTypeLabel(value) {
  const type = normalizeQuestionType(value);
  if (type === "choice") return "선택형";
  if (type === "text") return "주관식";
  return "기타";
}

export function getCardApprovalState(card = {}) {
  if (!card) return "pending";

  if (
    card?.adminApprovalStatus === "approved" ||
    card?.status === "approved" ||
    (card?.isPublished === true && card?.status !== "rejected")
  ) {
    return "approved";
  }

  if (
    card?.adminApprovalStatus === "rejected" ||
    card?.status === "rejected"
  ) {
    return "rejected";
  }

  return "pending";
}

export function isPendingCard(card = {}) {
  return getCardApprovalState(card) === "pending";
}

export function isNewApprovalTarget(user = {}) {
  if (!user || user?.withdraw === true) return false;

  const alreadyApproved =
    user?.signupApproved === true ||
    user?.adminApprovalStatus === "approved";

  if (alreadyApproved) return false;

  return user?.pendingStatus === "reviewing";
}

export function isLegacyAutoApprovalCandidate(user = {}) {
  if (!user || user?.withdraw === true) return false;

  const alreadyApproved =
    user?.signupApproved === true ||
    user?.adminApprovalStatus === "approved";

  if (alreadyApproved) return false;

  if (user?.pendingStatus === "reviewing") return false;

  const hasLegacyShape =
    Array.isArray(user?.thumbimage) ||
    typeof user?.school_open === "boolean" ||
    typeof user?.company_open === "boolean" ||
    !!user?.mbti_ei ||
    !!user?.mbti_sn ||
    !!user?.mbti_tf ||
    !!user?.mbti_jp;

  return hasLegacyShape;
}

export function isProfileReviewTarget(user = {}) {
  if (!user || user?.withdraw === true) return false;

  const alreadyApproved =
    user?.signupApproved === true ||
    user?.adminApprovalStatus === "approved";

  if (!alreadyApproved) return false;

  const hasReviewRequest =
    user?.date_pending === true ||
    user?.reviewStatus === "pending" ||
    user?.pendingStatus === "reviewing";

  const alreadyReviewApproved =
    user?.reviewStatus === "approved" &&
    user?.pendingStatus === "approved" &&
    user?.date_pending !== true;

  return hasReviewRequest && !alreadyReviewApproved;
}

export function getUserApprovalState(user = {}) {
  if (isProfileReviewTarget(user)) return "profileReview";
  if (isNewApprovalTarget(user)) return "pending";
  if (isLegacyAutoApprovalCandidate(user)) return "legacy";
  if (
    user?.signupApproved === true ||
    user?.adminApprovalStatus === "approved"
  ) {
    return "approved";
  }
  return "none";
}

export function getReasonLabelByCode(list = [], code = "") {
  const found = list.find((item) => item.code === code);
  return found?.label || "";
}

function normalizePhone(phone = "") {
  return String(phone).replace(/[^0-9]/g, "");
}

async function createNotification(db, payload) {
  await addDoc(collection(db, "notifications"), {
    ...payload,
    isRead: false,
    createdAt: serverTimestamp(),
  });
}

export async function approveUser({
  db,
  item,
  adminUid,
  sendLms,
  bonusSpoons = SIGNUP_APPROVAL_FREE_SPOON,
}) {
  const userId = getUserDocId(item);
  if (!userId) throw new Error("user id not found");

  const spoonReward = Math.max(Number(bonusSpoons || 0), 0);
  const spoonState = getSpoonSnapshot(item);

  await setDoc(
    doc(db, "users", userId),
    {
      signupApproved: true,
      adminApprovalStatus: "approved",
      pendingStatus: "approved",
      reviewStatus: "approved",
      date_pending: false,
      date_profile_finished: true,
      profile_setup_required_done: true,
      profile_photo_required_done: true,
      approvedAt: serverTimestamp(),
      approvedBy: adminUid || "",
      updatedAt: serverTimestamp(),
      spoon: spoonState.total + spoonReward,
      spoon_free: spoonState.free + spoonReward,
      spoon_paid: spoonState.paid,
      rejectReasonCode: "",
      rejectReasonText: "",
    },
    { merge: true }
  );

  if (spoonReward > 0) {
    await addDoc(collection(db, "spoonHistories"), {
      uid: userId,
      type: "signup_approval_free_grant",
      amount: spoonReward,
      balanceBefore: spoonState.total,
      balanceAfter: spoonState.total + spoonReward,
      spoonFreeBefore: spoonState.free,
      spoonFreeAfter: spoonState.free + spoonReward,
      spoonPaidBefore: spoonState.paid,
      spoonPaidAfter: spoonState.paid,
      grantedBy: adminUid || "",
      title: "가입 승인 이벤트 스푼 지급",
      createdAt: serverTimestamp(),
    });
  }

  await createNotification(db, {
    targetUid: userId,
    type: "signup_approved",
    title: "가입 승인이 완료됐어요",
    body:
      spoonReward > 0
        ? `이벤트 스푼 ${spoonReward}개가 지급됐어요.`
        : "이제 차밍수프 매칭을 이용할 수 있어요.",
    href: "/welcome",
  });

  const phone = normalizePhone(item?.phonenumber || item?.phoneNumber || "");
  if (phone && typeof sendLms === "function") {
    const gender = item?.gender || item?.identity_gender || "";
    const isFemale = gender === "female" || gender === "여성" || gender === "여자";
    const isMale = gender === "male" || gender === "남성" || gender === "남자";
    const targetUrl = isFemale
      ? `${CHARMINGSOUP_URL}/arena`
      : isMale
        ? `${CHARMINGSOUP_URL}/cards/list`
        : `${CHARMINGSOUP_URL}/welcome`;

    const actionLines = isFemale
      ? [
          "오늘 추천 프로필을 확인해보세요.",
          "마음이 가는 분에게 호감을 보내볼 수 있어요.",
        ]
      : isMale
        ? [
            "차밍카드를 작성하면 나를 더 잘 보여줄 수 있어요.",
            "답변이 많을수록 매칭 가능성이 높아져요.",
          ]
        : ["이제 차밍수프 매칭을 이용할 수 있어요."];

    await sendLms(
      phone,
      buildSmsMessage(
        [
          "가입 승인이 완료됐어요.",
          spoonReward > 0 ? `이벤트 스푼 ${spoonReward}개 지급 완료` : "",
          ...actionLines,
        ],
        targetUrl
      ),
      "차밍수프 가입 승인",
      { forceLms: true }
    );
  }
}

export async function approveProfileReview({ db, item, adminUid }) {
  const userId = getUserDocId(item);
  if (!userId) throw new Error("user id not found");

  await setDoc(
    doc(db, "users", userId),
    {
      // 기존 가입 승인은 유지하고, 재심사 대기 상태만 해제합니다.
      signupApproved: true,
      adminApprovalStatus: "approved",
      reviewStatus: "approved",
      pendingStatus: "approved",
      date_pending: false,
      date_profile_finished: true,
      profile_setup_required_done: true,
      profile_photo_required_done: true,
      reviewApprovedAt: serverTimestamp(),
      reviewApprovedBy: adminUid || "",
      reviewApprovalNotified: false,
      updatedAt: serverTimestamp(),
      rejectReasonCode: "",
      rejectReasonText: "",
    },
    { merge: true }
  );
}

export async function bulkApproveProfileReviews({ db, users, adminUid }) {
  if (!Array.isArray(users) || users.length === 0) return 0;

  const targets = users.filter((user) => {
    const userId = getUserDocId(user);
    return userId && isProfileReviewTarget(user);
  });

  if (targets.length === 0) return 0;

  const chunkSize = 450;
  let total = 0;

  for (let i = 0; i < targets.length; i += chunkSize) {
    const chunk = targets.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    chunk.forEach((user) => {
      const userId = getUserDocId(user);
      if (!userId) return;

      batch.set(
        doc(db, "users", userId),
        {
          // 기존 승인회원 재심사 대기자는 문자 없이 조용히 승인 처리합니다.
          signupApproved: true,
          adminApprovalStatus: "approved",
          reviewStatus: "approved",
          pendingStatus: "approved",
          date_pending: false,
          date_profile_finished: true,
          profile_setup_required_done: true,
          profile_photo_required_done: true,
          reviewApprovedAt: serverTimestamp(),
          reviewApprovedBy: adminUid || "",
          reviewApprovalNotified: false,
          updatedAt: serverTimestamp(),
          rejectReasonCode: "",
          rejectReasonText: "",
        },
        { merge: true }
      );
      total += 1;
    });

    await batch.commit();
  }

  return total;
}

export async function rejectUser({
  db,
  item,
  adminUid,
  sendLms,
  reasonCode = "",
  reasonText = "",
}) {
  const userId = getUserDocId(item);
  if (!userId) throw new Error("user id not found");
  if (!reasonCode || !reasonText) throw new Error("reject reason not found");

  await setDoc(
    doc(db, "users", userId),
    {
      signupApproved: false,
      adminApprovalStatus: "rejected",
      pendingStatus: "rejected",
      rejectedAt: serverTimestamp(),
      rejectedBy: adminUid || "",
      updatedAt: serverTimestamp(),
      rejectReasonCode: reasonCode,
      rejectReasonText: reasonText,
    },
    { merge: true }
  );

  await createNotification(db, {
    targetUid: userId,
    type: "signup_rejected",
    title: "가입 검토 결과가 등록됐어요",
    body: `${reasonText}`,
    href: "/profile/setup",
  });

  const phone = normalizePhone(item?.phonenumber || item?.phoneNumber || "");
  if (phone && typeof sendLms === "function") {
    await sendLms(
      phone,
      buildSmsMessage(
        [
          "매칭 품질을 위해 프로필 보완이 필요해요.",
          reasonText,
          "수정해주시면 다시 검토할게요.",
        ],
        `${CHARMINGSOUP_URL}/profile/setup`
      ),
      "차밍수프 프로필 보완 요청",
      { forceLms: true }
    );
  }
}

export async function sendProfileIncompleteSms({
  db,
  item,
  adminUid,
  sendLms,
  reasonCode = "profile_photo",
  reasonText = "",
}) {
  const userId = getUserDocId(item);
  if (!userId) throw new Error("user id not found");

  const selectedReason =
    reasonText ||
    getReasonLabelByCode(PROFILE_INCOMPLETE_SMS_REASONS, reasonCode) ||
    "필수 프로필 정보";

  const phone = normalizePhone(item?.phonenumber || item?.phoneNumber || "");
  if (!phone) throw new Error("phone number not found");
  if (typeof sendLms !== "function") throw new Error("sendLms function not found");

  await sendLms(
    phone,
    buildSmsMessage(
      [
        "아직 매칭 이용 전 보완이 필요해요.",
        `${selectedReason}만 추가 작성하면 매칭서비스 이용이 가능합니다.`,
        "진행 중 불편한 점이 있다면 이 문자에 회신해주세요.",
      ],
      `${CHARMINGSOUP_URL}/profile`
    ),
    "차밍수프 매칭 이용 안내",
    { forceLms: true }
  );

  await setDoc(
    doc(db, "users", userId),
    {
      profileIncompleteSmsSentAt: serverTimestamp(),
      profileIncompleteSmsReasonCode: reasonCode || "",
      profileIncompleteSmsReasonText: selectedReason,
      profileIncompleteSmsSentBy: adminUid || "",
      profileIncompleteSmsSentCount: increment(1),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await createNotification(db, {
    targetUid: userId,
    type: "profile_incomplete_guide",
    title: "매칭 이용 전 프로필 보완이 필요해요",
    body: `${selectedReason}만 추가 작성하면 매칭서비스 이용이 가능합니다.`,
    href: "/profile",
  });
}

export async function bulkApproveLegacyUsers({ db, users, adminUid }) {
  if (!Array.isArray(users) || users.length === 0) return 0;

  const batch = writeBatch(db);
  let count = 0;

  users.forEach((user) => {
    const userId = getUserDocId(user);
    if (!userId) return;

    batch.set(
      doc(db, "users", userId),
      {
        signupApproved: true,
        adminApprovalStatus: "approved",
        pendingStatus: "approved",
        reviewStatus: "approved",
        date_pending: false,
        date_profile_finished: true,
        profile_setup_required_done: true,
        profile_photo_required_done: true,
        approvedAt: serverTimestamp(),
        approvedBy: adminUid || "",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    count += 1;
  });

  if (count > 0) {
    await batch.commit();
  }

  return count;
}

export async function approveCard({ db, card, adminUid, sendLms, creatorUser }) {
  await updateDoc(doc(db, "charmingCards", card.id), {
    status: "approved",
    adminApprovalStatus: "approved",
    isPublished: true,
    approvedAt: serverTimestamp(),
    approvedBy: adminUid || "",
    updatedAt: serverTimestamp(),
    rejectReasonCode: "",
    rejectReasonText: "",
  });

  if (card?.creatorUid) {
    await createNotification(db, {
      targetUid: card.creatorUid,
      type: "card_approved",
      title: "차밍카드가 승인됐어요",
      body: "작성한 카드가 공개됐어요.",
      href: `/cards/${card.id}`,
    });

    const phone = normalizePhone(
      creatorUser?.phonenumber || creatorUser?.phoneNumber || ""
    );

    if (phone && typeof sendLms === "function") {
      await sendLms(
        phone,
        buildSmsMessage(
          [
            "차밍카드가 승인되어 노출이 시작됐어요.",
            "답변이 많을수록 매칭 가능성이 높아져요.",
          ],
          `${CHARMINGSOUP_URL}/cards/list`
        ),
        "차밍카드 승인",
        { forceLms: true }
      );
    }
  }
}

export async function rejectCard({
  db,
  card,
  adminUid,
  sendLms,
  creatorUser,
  reasonCode = "",
  reasonText = "",
}) {
  if (!reasonCode || !reasonText) throw new Error("reject reason not found");

  await updateDoc(doc(db, "charmingCards", card.id), {
    status: "rejected",
    adminApprovalStatus: "rejected",
    isPublished: false,
    rejectedAt: serverTimestamp(),
    rejectedBy: adminUid || "",
    updatedAt: serverTimestamp(),
    rejectReasonCode: reasonCode,
    rejectReasonText: reasonText,
  });

  if (card?.creatorUid) {
    await createNotification(db, {
      targetUid: card.creatorUid,
      type: "card_rejected",
      title: "차밍카드 검토 결과가 등록됐어요",
      body: reasonText,
      href: "/cards/list",
    });

    const phone = normalizePhone(
      creatorUser?.phonenumber || creatorUser?.phoneNumber || ""
    );

    if (phone && typeof sendLms === "function") {
      await sendLms(
        phone,
        buildSmsMessage(["차밍카드 검토 결과", reasonText, "수정 후 다시 등록해주세요."]),
        "차밍카드 검토",
        { forceLms: true }
      );
    }
  }
}

export async function saveGeneratedCards({ db, cards, adminUid }) {
  if (!Array.isArray(cards) || cards.length === 0) return;

  for (const item of cards) {
    await addDoc(collection(db, "charmingCards"), {
      title: item.title || "",
      body: item.body || item.guide || "",
      guide: item.guide || "",
      category: item.category || "sense",
      categoryLabel: item.categoryLabel || "센스",
      questionType: normalizeQuestionType(item.questionType || "choice"),
      options: Array.isArray(item.options) ? item.options.filter(Boolean) : [],
      creatorUid: adminUid || "",
      creatorNickname: "관리자",
      creatorGender: "admin",
      creatorUsername: "관리자",
      interestedCount: 0,
      answerCount: 0,
      views: 0,
      visibilityTarget: item.visibilityTarget || "male",
      status: "approved",
      adminApprovalStatus: "approved",
      isPublished: true,
      approvedAt: serverTimestamp(),
      approvedBy: adminUid || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function resolveReportAction({
  db,
  report,
  adminUid,
  action,
  users,
  sendLms,
}) {
  const collectionName =
    report?.sourceType === "card_answer"
      ? "charmingCardAnswerReports"
      : "arenaReports";

  const nextStatus =
    action === "warn"
      ? "warned"
      : action === "suspend"
        ? "suspended"
        : action === "dismiss"
          ? "dismissed"
          : "reviewed";

  await updateDoc(doc(db, collectionName, report.id), {
    status: nextStatus,
    reviewedAt: serverTimestamp(),
    reviewedBy: adminUid || "",
    updatedAt: serverTimestamp(),
  });

  const targetUid =
    report?.targetUid || report?.reportedAnswererUid || report?.answererUid || "";

  if (!targetUid) return;

  if (action === "warn") {
    await setDoc(
      doc(db, "users", targetUid),
      {
        adminWarningCount: increment(1),
        lastWarnedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  if (action === "suspend") {
    await setDoc(
      doc(db, "users", targetUid),
      {
        suspended: true,
        suspendedAt: serverTimestamp(),
        suspendedBy: adminUid || "",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  const targetUser = Array.isArray(users)
    ? users.find((user) => getUserDocId(user) === targetUid)
    : null;

  if (action === "suspend") {
    await createNotification(db, {
      targetUid,
      type: "report_reviewed",
      title: "이용 제한 안내",
      body: "운영팀 검토 결과 이용이 제한되었어요.",
      href: "/setting/block",
    });

    const phone = normalizePhone(
      targetUser?.phonenumber || targetUser?.phoneNumber || ""
    );

    if (phone && typeof sendLms === "function") {
      await sendLms(
        phone,
        buildSmsMessage(["운영팀 검토 결과", "이용이 제한되었어요."]),
        "차밍수프 이용 제한 안내",
        { forceLms: true }
      );
    }
  }
}

export async function confirmPayment({ db, item, adminUid, sendLms }) {
  if (!item?.uid) throw new Error("payment uid not found");

  const spoonAmount = Number(item?.spoonAmount || 0);
  if (!spoonAmount) throw new Error("spoon amount not found");

  const userRef = doc(db, "users", item.uid);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.exists() ? userSnap.data() || {} : {};
  const spoonState = getSpoonSnapshot(userData);

  await setDoc(
    userRef,
    {
      spoon: spoonState.total + spoonAmount,
      spoon_paid: spoonState.paid + spoonAmount,
      spoon_free: spoonState.free,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await updateDoc(doc(db, "spoonDepositRequests", item.id), {
    status: "credited",
    creditedAt: serverTimestamp(),
    creditedBy: adminUid || "",
    updatedAt: serverTimestamp(),
  });

  await addDoc(collection(db, "spoonHistories"), {
    uid: item.uid,
    amount: spoonAmount,
    type: "admin_manual_charge",
    requestId: item.id,
    title: "운영자 수동 충전",
    description: `${spoonAmount}개 충전`,
    balanceBefore: spoonState.total,
    balanceAfter: spoonState.total + spoonAmount,
    spoonFreeBefore: spoonState.free,
    spoonFreeAfter: spoonState.free,
    spoonPaidBefore: spoonState.paid,
    spoonPaidAfter: spoonState.paid + spoonAmount,
    createdAt: serverTimestamp(),
  });

  await createNotification(db, {
    targetUid: item.uid,
    type: "spoon_charge_completed",
    title: `스푼 ${spoonAmount}개가 충전됐어요`,
    body: "스토어에서 결제 내역을 확인해보세요.",
    href: "/store/history",
  });

  const phone = normalizePhone(item?.phoneNumber || item?.phonenumber || "");
  if (phone && typeof sendLms === "function") {
    await sendLms(
      phone,
      buildSmsMessage([`스푼 ${spoonAmount}개 충전 완료`]),
      "차밍수프 충전 완료",
      { forceLms: true }
    );
  }
}

export function normalizeCardText(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w가-힣]/g, " ")
    .trim();
}

function normalizeCompactText(value = "") {
  return normalizeCardText(value).replace(/\s+/g, "");
}

function simpleHash(value = "") {
  let hash = 0;
  const text = String(value || "");
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickByHash(list = [], seed = "") {
  if (!Array.isArray(list) || !list.length) return "";
  const index = simpleHash(seed) % list.length;
  return list[index];
}

function shuffleBySeed(list = [], seed = "") {
  const cloned = Array.isArray(list) ? [...list] : [];
  return cloned.sort((a, b) => {
    const aHash = simpleHash(
      `${seed}-${a?.topicKey || a?.key || JSON.stringify(a)}`
    );
    const bHash = simpleHash(
      `${seed}-${b?.topicKey || b?.key || JSON.stringify(b)}`
    );
    return aHash - bHash;
  });
}

function makeTopicKeySignature(candidate = {}) {
  return String(candidate?.topicKey || "").trim().toLowerCase();
}

function makeOptionSignature(options = []) {
  return (Array.isArray(options) ? options : [])
    .map((item) => normalizeCompactText(item))
    .filter(Boolean)
    .join("|");
}

function extractCoreKeywordSignature(candidate = {}) {
  const source = `${candidate?.title || ""} ${candidate?.body || ""} ${candidate?.guide || ""}`;
  const normalized = normalizeCardText(source);
  const tokens = normalized
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter(
      (item) =>
        item.length >= 2 &&
        ![
          "나는",
          "당신은",
          "상대가",
          "연애",
          "소개팅",
          "상황",
          "가장",
          "무엇",
          "어떻게",
          "가까운",
          "선택지",
          "골라보세요",
          "답해주세요",
          "생각해요",
        ].includes(item)
    );

  return [...new Set(tokens)].sort().slice(0, 8).join("|");
}

function isSemanticallyClose(candidate = {}, compare = {}) {
  const candidateTopic = makeTopicKeySignature(candidate);
  const compareTopic = makeTopicKeySignature(compare);

  if (candidateTopic && compareTopic && candidateTopic === compareTopic) {
    return true;
  }

  const candidateTitle = normalizeCompactText(candidate?.title || "");
  const compareTitle = normalizeCompactText(compare?.title || "");
  const candidateBody = normalizeCompactText(
    candidate?.body || candidate?.guide || ""
  );
  const compareBody = normalizeCompactText(
    compare?.body || compare?.guide || ""
  );

  if (candidateTitle && compareTitle && candidateTitle === compareTitle)
    return true;
  if (candidateBody && compareBody && candidateBody === compareBody) return true;

  if (
    candidateTitle &&
    compareTitle &&
    (candidateTitle.includes(compareTitle) ||
      compareTitle.includes(candidateTitle))
  ) {
    return true;
  }

  const candidateKeywordSig = extractCoreKeywordSignature(candidate);
  const compareKeywordSig = extractCoreKeywordSignature(compare);

  if (
    candidateKeywordSig &&
    compareKeywordSig &&
    candidateKeywordSig === compareKeywordSig
  ) {
    return true;
  }

  const candidateOptionSig = makeOptionSignature(candidate?.options || []);
  const compareOptionSig = makeOptionSignature(compare?.options || []);

  if (
    candidateOptionSig &&
    compareOptionSig &&
    candidateOptionSig === compareOptionSig
  ) {
    return true;
  }

  return false;
}

export function isDuplicateDraft(
  candidate = {},
  existingCards = [],
  currentDrafts = []
) {
  const compareList = [...existingCards, ...currentDrafts];
  return compareList.some((item) => isSemanticallyClose(candidate, item));
}

const CARD_CATEGORY_LABEL_MAP = {
  sense: "센스",
  value: "가치관",
  date: "연애",
  lifestyle: "생활",
  marriage: "결혼관",
};

const TOPIC_BUCKET_PRIORITY = [
  "first_impression",
  "texting",
  "flirting",
  "sns",
  "dating_manners",
  "boundaries",
  "conflict",
  "money",
  "family",
  "marriage",
  "self_awareness",
  "greenflag_redflag",
  "lifestyle",
  "career",
  "long_distance",
  "apology",
];

const RECOMMENDED_CARD_BLUEPRINTS = [
  {
    topicKey: "photo_gap_first_meeting",
    topicBucket: "first_impression",
    category: "sense",
    categoryLabel: "센스",
    angleKeys: ["honest_reaction", "manners_first", "curiosity_first"],
    titles: [
      "소개팅 상대가 사진과 꽤 다를 때 내 반응은?",
      "첫 만남에서 사진과 분위기가 다르면 나는?",
      "프로필과 실제 느낌이 많이 다를 때 나는?",
    ],
    bodies: [
      "첫 만남에서 기대한 이미지와 실제 분위기가 꽤 다를 때, 내 태도와 가장 가까운 선택지를 골라보세요.",
      "상대의 실물이 예상과 달랐을 때 내가 실제로 보일 반응에 가까운 답을 골라주세요.",
    ],
    guides: [
      "예의보다 솔직함, 혹은 솔직함보다 예의를 중요하게 보는지 드러나는 질문이에요.",
      "좋아 보이는 답보다 실제 내 반응에 가깝게 골라주세요.",
    ],
    choiceOptions: [
      [
        "일단 끝까지 예의 있게 대화한다",
        "실망해도 티는 안 내고 거리 둔다",
        "오히려 대화가 괜찮으면 다시 본다",
        "그 자리에서 감정이 확 식는다",
      ],
      [
        "사진은 사진이고 실제 대화가 더 중요하다",
        "예상과 다르면 몰입이 잘 안 된다",
        "표정관리하며 자연스럽게 본다",
        "호감 여부를 금방 정리하는 편이다",
      ],
    ],
  },
  {
    topicKey: "reply_delay_early_stage",
    topicBucket: "texting",
    category: "date",
    categoryLabel: "연애",
    angleKeys: ["trust", "anxiety", "boundary"],
    titles: [
      "썸 초반 답장이 5~6시간씩 느리면 나는?",
      "호감 있는 사람이 답이 너무 느릴 때 내 반응은?",
      "연락 텀이 긴 썸, 어디까지 괜찮은 편일까?",
    ],
    bodies: [
      "썸이나 연애 초반에 연락 텀이 예상보다 길 때, 내 실제 반응에 가까운 선택지를 골라보세요.",
      "상대가 답장을 늦게 할 때 내가 해석하는 방식과 가장 비슷한 답을 선택해주세요.",
    ],
    guides: [
      "연락 민감도와 감정 조절 스타일이 드러나는 질문이에요.",
      "스스로 쿨해 보이려 하지 말고 실제 내 스타일대로 골라주세요.",
    ],
    choiceOptions: [
      [
        "바쁠 수도 있으니 기다리는 편이다",
        "신경 쓰이지만 먼저 티는 안 낸다",
        "관심이 적은 신호라고 느낀다",
        "그 순간부터 마음이 빠르게 식는다",
      ],
      [
        "한두 번은 괜찮다",
        "자주 반복되면 감점이다",
        "연락보다 실제 행동을 본다",
        "초반부터 안 맞는다고 판단한다",
      ],
    ],
  },
  {
    topicKey: "insta_opposite_sex_comments",
    topicBucket: "sns",
    category: "value",
    categoryLabel: "가치관",
    angleKeys: ["sns_boundary", "jealousy", "trust"],
    titles: [
      "연인이 이성친구와 인스타 댓글을 자주 주고받으면 나는?",
      "썸 상대의 SNS 이성친구 흔적, 어디까지 괜찮을까?",
      "인스타에서 이성친구와 너무 편해 보이는 상대를 보면?",
    ],
    bodies: [
      "SNS에서 이성친구와의 거리감이 가깝게 느껴질 때, 내 반응과 가장 가까운 선택지를 골라보세요.",
      "연애 상대의 SNS 경계선에 대한 내 기준을 보여주는 질문이에요.",
    ],
    guides: [
      "질투심보다 경계선 감각이 어떤지 드러나는 질문이에요.",
      "내가 실제로 불편해하는 선을 떠올리며 답해주세요.",
    ],
    choiceOptions: [
      [
        "SNS는 SNS라 크게 신경 안 쓴다",
        "조금 거슬리지만 넘길 수 있다",
        "상대와 한 번은 기준을 맞춰보고 싶다",
        "그런 부분은 초반부터 꽤 크게 본다",
      ],
      [
        "이성친구 자체보다 태도가 더 중요하다",
        "공개적으로 친한 티가 많으면 불편하다",
        "내가 예민한 편인지 먼저 생각한다",
        "연애 중이면 선을 더 분명히 지켜야 한다",
      ],
    ],
  },
  {
    topicKey: "paying_on_first_date",
    topicBucket: "dating_manners",
    category: "sense",
    categoryLabel: "센스",
    angleKeys: ["manners", "initiative", "practicality"],
    titles: [
      "첫 만남에서 계산 타이밍이 어색할 때 나는?",
      "소개팅 자리 계산 앞에서 내 태도는?",
      "첫 데이트 계산 순간에 더 호감 가는 건?",
    ],
    bodies: [
      "소개팅이나 첫 데이트에서 계산 순간이 왔을 때, 내가 실제로 보일 태도에 가까운 답을 골라보세요.",
      "돈의 크기보다 분위기와 태도를 어떻게 다루는지 보는 질문이에요.",
    ],
    guides: [
      "정답을 고르기보다 내 매너 감각에 가까운 답을 골라주세요.",
      "실제 소개팅 상황처럼 떠올리면서 답해주세요.",
    ],
    choiceOptions: [
      [
        "자연스럽게 먼저 계산하려는 편이다",
        "상대 반응을 보고 조율하는 편이다",
        "서로 부담 없게 나누는 게 좋다",
        "계산보다 그 순간의 말투와 태도가 더 중요하다",
      ],
      [
        "먼저 움직이는 사람이 센스 있어 보인다",
        "굳이 티 안 나게 맞추는 게 좋다",
        "너무 당연하게 받는 태도는 감점이다",
        "돈보다 배려가 느껴지는지가 중요하다",
      ],
    ],
  },
  {
    topicKey: "affection_speed_early",
    topicBucket: "flirting",
    category: "date",
    categoryLabel: "연애",
    angleKeys: ["romance", "pace", "pressure"],
    titles: [
      "연애 초반 애정표현이 빠른 사람, 나는?",
      "호감 표현이 너무 빠른 상대를 보면?",
      "썸 초반부터 달달한 사람, 설렘 vs 부담?",
    ],
    bodies: [
      "연애 초반에 애정 표현 속도가 빠른 사람을 만났을 때 내 반응과 가장 가까운 선택지를 골라보세요.",
      "로맨틱함을 좋아하는지, 속도감을 더 중요하게 보는지 드러나는 질문이에요.",
    ],
    guides: [
      "상대가 적극적일 때 내가 실제로 편한 속도를 떠올려주세요.",
      "설레는 답보다 현실적인 내 반응에 가깝게 골라주세요.",
    ],
    choiceOptions: [
      [
        "오히려 표현이 확실해서 좋다",
        "기분은 좋지만 속도는 조금 조절됐으면 한다",
        "부담스러워서 경계심이 생긴다",
        "말보다 행동과 시간이 더 필요하다",
      ],
      [
        "표현 많은 사람에게 끌리는 편이다",
        "초반엔 적당한 온도가 좋다",
        "너무 빠르면 진정성이 의심된다",
        "상대보다 내 리듬이 더 중요하다",
      ],
    ],
  },
  {
    topicKey: "late_arrival_manners",
    topicBucket: "dating_manners",
    category: "sense",
    categoryLabel: "센스",
    angleKeys: ["punctuality", "grace", "trust"],
    titles: [
      "소개팅 상대가 약속 시간에 늦었을 때 나는?",
      "첫 만남부터 지각한 상대, 내 기준은?",
      "약속에 늦은 사람을 보면 가장 먼저 드는 생각은?",
    ],
    bodies: [
      "첫 만남이나 중요한 약속에서 상대가 늦었을 때, 내 실제 판단 기준에 가까운 선택지를 골라보세요.",
      "시간 개념, 예의, 배려를 어디까지 중요하게 보는지 드러나는 질문이에요.",
    ],
    guides: [
      "내가 예민하게 보는 부분인지, 넘길 수 있는 부분인지 떠올리며 답해주세요.",
      "상황에 따른 예외보다는 내 기본 성향을 기준으로 골라주세요.",
    ],
    choiceOptions: [
      [
        "사과와 태도가 괜찮으면 넘길 수 있다",
        "첫 만남부터 늦으면 기본적으로 감점이다",
        "이유보다 이후 대화를 더 본다",
        "시간 약속은 신뢰와 직결된다고 본다",
      ],
      [
        "한 번은 괜찮지만 반복되면 어렵다",
        "늦을 수는 있지만 미리 말하는 게 중요하다",
        "약속 초반의 인상을 꽤 크게 보는 편이다",
        "사소해 보여도 잘 안 넘어간다",
      ],
    ],
  },
  {
    topicKey: "ex_talk_early_stage",
    topicBucket: "boundaries",
    category: "value",
    categoryLabel: "가치관",
    angleKeys: ["past", "boundaries", "maturity"],
    titles: [
      "썸 초반 전애인 얘기, 어디까지 괜찮을까?",
      "소개팅에서 전연애 얘기가 나오면 나는?",
      "초반부터 전애인 이야기하는 사람을 보면?",
    ],
    bodies: [
      "만난 지 얼마 안 된 사람이 전연애 이야기를 꺼낼 때, 내 반응과 가장 가까운 선택지를 골라보세요.",
      "과거 연애를 다루는 방식에서 감정 정리와 경계선 감각이 드러나는 질문이에요.",
    ],
    guides: [
      "쿨해 보이는 답보다 실제로 내가 편한 선을 기준으로 골라주세요.",
      "초반 대화에서 어떤 화제가 부담되는지 떠올려보세요.",
    ],
    choiceOptions: [
      [
        "가볍게 지나가는 정도면 괜찮다",
        "상황 설명이 필요할 때만 가능하다",
        "초반엔 굳이 안 꺼냈으면 좋겠다",
        "전애인 얘기가 많으면 바로 거리감이 생긴다",
      ],
      [
        "과거보다 현재 태도가 중요하다",
        "말하는 방식에 따라 다르다",
        "감정이 남아 보이면 부담스럽다",
        "초반엔 그 자체로 감점이다",
      ],
    ],
  },
  {
    topicKey: "marriage_timeline_pressure",
    topicBucket: "marriage",
    category: "marriage",
    categoryLabel: "결혼관",
    angleKeys: ["timeline", "pressure", "seriousness"],
    titles: [
      "연애 시작 전부터 결혼 타이밍을 강하게 말하는 사람, 나는?",
      "결혼 생각이 너무 빠른 상대를 보면?",
      "관계 초반부터 미래 계획을 구체적으로 말하는 사람은?",
    ],
    bodies: [
      "장기적인 관계나 결혼 이야기가 초반부터 강하게 나올 때, 내 반응에 가까운 선택지를 골라보세요.",
      "진지함과 부담감 사이에서 내가 어떤 균형을 보는지 드러나는 질문이에요.",
    ],
    guides: [
      "결혼 자체에 대한 찬반보다, 속도와 방식에 대한 내 기준으로 답해주세요.",
      "현실적인 내 감각에 가까운 답을 골라주세요.",
    ],
    choiceOptions: [
      [
        "오히려 목적이 분명해서 좋다",
        "진지한 건 좋은데 조금 빠르게 느껴진다",
        "상대의 불안이 느껴지면 부담스럽다",
        "관계가 쌓이기 전엔 그런 얘기가 어렵다",
      ],
      [
        "결혼관은 초반에도 중요한 정보다",
        "타이밍보다 말하는 태도가 중요하다",
        "너무 빠르면 마음이 닫히는 편이다",
        "천천히 맞춰가야 한다고 본다",
      ],
    ],
  },
  {
    topicKey: "friend_like_but_not_dateable",
    topicBucket: "self_awareness",
    category: "date",
    categoryLabel: "연애",
    angleKeys: ["attraction", "chemistry", "friendzone"],
    titles: [
      "좋은 사람인데 연애감은 안 오는 사람, 이유는 뭘까?",
      "친구로는 좋은데 연애상대로는 안 끌리는 사람을 보면?",
      "괜찮은데 설레지는 않는 사람, 나는 어떻게 판단할까?",
    ],
    bodies: [
      "사람은 괜찮은데 연애 감정이 잘 안 생기는 경우, 내 생각과 가까운 선택지를 골라보세요.",
      "호감과 설렘의 차이를 어떻게 보는지 드러나는 질문이에요.",
    ],
    guides: [
      "상대 비난보다 내 감정 기준을 떠올리며 답해주세요.",
      "현실적으로 내가 자주 느끼는 기준으로 골라주세요.",
    ],
    choiceOptions: [
      [
        "대화는 편한데 긴장감이 없으면 어렵다",
        "좋은 사람과 설레는 사람은 다를 수 있다",
        "시간이 지나면 감정이 생기기도 한다",
        "처음부터 안 끌리면 거의 안 바뀐다",
      ],
      [
        "연애는 결국 감정의 문제라고 본다",
        "좋은 사람인 건 알지만 결은 안 맞을 수 있다",
        "설렘보다 편안함이 더 중요하다",
        "친구 느낌이 강하면 선을 긋는 편이다",
      ],
    ],
  },
  {
    topicKey: "argument_resolution_style",
    topicBucket: "conflict",
    category: "lifestyle",
    categoryLabel: "생활",
    angleKeys: ["conflict", "communication", "repair"],
    titles: [
      "서운한 일이 생겼을 때 내 갈등 해결 스타일은?",
      "다툼 직후 내가 원하는 관계 회복 방식은?",
      "갈등이 생기면 나는 바로 푸는 편일까, 시간을 두는 편일까?",
    ],
    bodies: [
      "연애 중 서운함이나 갈등이 생겼을 때, 내가 실제로 원하는 해결 방식과 가까운 선택지를 골라보세요.",
      "감정 회복 속도와 대화 방식이 드러나는 현실 질문이에요.",
    ],
    guides: [
      "좋은 답보다 실제 내 갈등 습관에 가깝게 골라주세요.",
      "내가 편한 회복 방식을 기준으로 답해주세요.",
    ],
    choiceOptions: [
      [
        "그날 바로 풀어야 마음이 편하다",
        "조금 식힌 뒤 차분하게 말하는 게 좋다",
        "문제보다 말투가 더 중요하다",
        "상대가 먼저 정리돼야 대화가 된다",
      ],
      [
        "빠른 화해가 중요하다",
        "시간을 두는 게 오히려 낫다",
        "감정보다 해결 방식이 중요하다",
        "갈등 때 사람 본성이 드러난다고 생각한다",
      ],
    ],
  },
  {
    topicKey: "money_spending_style_date",
    topicBucket: "money",
    category: "lifestyle",
    categoryLabel: "생활",
    angleKeys: ["money", "consumption", "compatibility"],
    titles: [
      "연애할 때 돈 쓰는 방식이 다른 사람과 나는?",
      "소비 성향이 너무 다른 연인을 만나면?",
      "데이트 비용보다 더 중요한 건 뭐라고 생각할까?",
    ],
    bodies: [
      "돈의 많고 적음보다 소비 감각이 다를 때, 내 반응과 가장 가까운 선택지를 골라보세요.",
      "생활 감각과 경제관이 맞는지에 대한 기준을 보여주는 질문이에요.",
    ],
    guides: [
      "합리적이어 보이는 답보다 실제 내 기준대로 골라주세요.",
      "가치 소비, 절약, 분위기 중 무엇을 더 보는지 떠올려보세요.",
    ],
    choiceOptions: [
      [
        "돈보다 태도와 배려가 더 중요하다",
        "소비 기준이 너무 다르면 오래 어렵다",
        "대화로 맞출 수 있으면 괜찮다",
        "돈 쓰는 감각은 연애에서 꽤 큰 부분이다",
      ],
      [
        "비슷한 소비 감각이 중요하다",
        "서로 다르면 조율 능력이 더 중요하다",
        "과시 소비는 크게 감점이다",
        "지나친 절약도 피곤할 수 있다",
      ],
    ],
  },
  {
    topicKey: "family_tone_importance",
    topicBucket: "family",
    category: "marriage",
    categoryLabel: "결혼관",
    angleKeys: ["family", "values", "future"],
    titles: [
      "상대의 가족 분위기, 연애에서 어디까지 중요할까?",
      "가족 이야기를 들을 때 내가 크게 보는 포인트는?",
      "결혼을 생각하면 가족 분위기가 신경 쓰이는 편일까?",
    ],
    bodies: [
      "연애나 결혼을 생각할 때 상대의 가족 분위기를 어디까지 중요하게 보는지 골라보세요.",
      "가족관과 미래 관계 감각이 드러나는 질문이에요.",
    ],
    guides: [
      "민감한 주제인 만큼 실제 내 기준에 가깝게 골라주세요.",
      "좋고 나쁨보다 중요도에 대한 내 판단으로 답해주세요.",
    ],
    choiceOptions: [
      [
        "본인만 괜찮으면 크게 상관없다",
        "가족 분위기도 꽤 중요하게 본다",
        "가족보다 그 얘기를 하는 태도가 더 중요하다",
        "결혼까지 생각하면 무시하기 어렵다",
      ],
      [
        "현재의 관계가 더 중요하다",
        "가족관은 생활 전반과 연결된다고 본다",
        "선입견 없이 보려고 한다",
        "가족 문제를 대하는 태도가 핵심이다",
      ],
    ],
  },
  {
    topicKey: "social_energy_difference",
    topicBucket: "lifestyle",
    category: "lifestyle",
    categoryLabel: "생활",
    angleKeys: ["extrovert_introvert", "energy", "balance"],
    titles: [
      "사람 많이 만나는 스타일의 연인을 만나면 나는?",
      "모임 많은 사람과 연애, 어디까지 괜찮을까?",
      "연애할 때 혼자만의 시간 vs 함께 어울리는 시간, 내 기준은?",
    ],
    bodies: [
      "사회적 에너지와 혼자만의 시간에 대한 내 기준을 보여주는 질문이에요.",
      "연인의 생활 반경과 에너지 소비 방식이 다를 때 내 반응에 가까운 답을 골라보세요.",
    ],
    guides: [
      "내향/외향보다 실제 생활 리듬 기준으로 골라주세요.",
      "내가 연애에서 피곤해지는 포인트를 떠올리며 답해주세요.",
    ],
    choiceOptions: [
      [
        "활동적인 사람에게 오히려 끌리는 편이다",
        "모임이 많아도 균형만 맞으면 괜찮다",
        "둘만의 시간이 적으면 서운하다",
        "너무 바깥 중심이면 오래 어렵다",
      ],
      [
        "혼자만의 시간이 꼭 필요하다",
        "같이 어울리는 시간도 중요하다",
        "리듬이 다르면 조율력이 중요하다",
        "생활 패턴 차이를 꽤 크게 보는 편이다",
      ],
    ],
  },
  {
    topicKey: "greenflag_small_detail",
    topicBucket: "greenflag_redflag",
    category: "sense",
    categoryLabel: "센스",
    angleKeys: ["detail", "care", "impression"],
    titles: [
      "사소한데 유독 호감 가는 디테일은?",
      "소개팅에서 ‘이 사람 괜찮다’ 싶게 만드는 작은 포인트는?",
      "대단하진 않은데 유독 설레는 배려 포인트는?",
    ],
    bodies: [
      "큰 이벤트보다 작지만 인상 깊은 배려에 대한 내 기준을 골라보세요.",
      "사소한 디테일에서 호감을 느끼는 포인트가 드러나는 질문이에요.",
    ],
    guides: [
      "현실에서 진짜 기분 좋았던 순간을 떠올리며 답해주세요.",
      "좋아 보이는 답보다 실제로 내가 반응하는 포인트를 골라주세요.",
    ],
    choiceOptions: [
      [
        "말을 예쁘게 받아주는 태도",
        "내가 한 말을 기억하는 디테일",
        "사소한 불편을 먼저 캐치하는 센스",
        "과하지 않게 챙겨주는 자연스러움",
      ],
      [
        "표정과 리액션이 따뜻한 사람",
        "배려가 티 안 나게 느껴지는 사람",
        "나를 편하게 만드는 질문 센스",
        "부담 없이 다정한 사람",
      ],
    ],
  },
  {
    topicKey: "redflag_vibe_first_date",
    topicBucket: "greenflag_redflag",
    category: "sense",
    categoryLabel: "센스",
    angleKeys: ["redflag", "vibe", "self_awareness"],
    titles: [
      "첫 만남에서 바로 감점되는 분위기는?",
      "소개팅에서 ‘아 이건 좀’ 싶어지는 순간은?",
      "겉으론 괜찮은데 유독 쎄하게 느껴지는 포인트는?",
    ],
    bodies: [
      "크게 잘못한 건 아닌데 왠지 감점되는 순간에 대한 내 기준을 골라보세요.",
      "말투, 태도, 분위기에서 느끼는 미묘한 레드플래그 감각이 드러나는 질문이에요.",
    ],
    guides: [
      "예민함보다 실제로 내가 꺼리는 포인트를 기준으로 골라주세요.",
      "연애 상대를 볼 때 은근히 크게 작용하는 기준을 떠올려보세요.",
    ],
    choiceOptions: [
      [
        "말은 괜찮은데 상대를 평가하듯 보는 느낌",
        "사소한 사람을 대하는 태도가 차가운 느낌",
        "과하게 자기 얘기만 하는 흐름",
        "센 척하는 말투와 반응",
      ],
      [
        "유머가 아니라 무례함에 가까운 말",
        "관심보다 계산적인 질문이 많을 때",
        "초반부터 선 넘는 친밀감",
        "묘하게 상대를 깎아내리는 태도",
      ],
    ],
  },
  {
    topicKey: "long_distance_relationship_view",
    topicBucket: "long_distance",
    category: "date",
    categoryLabel: "연애",
    angleKeys: ["distance", "trust", "effort"],
    titles: [
      "장거리 연애, 내 기준에서는 가능할까?",
      "좋은 사람이라도 장거리면 고민되는 편일까?",
      "물리적 거리보다 더 중요한 건 뭐라고 생각할까?",
    ],
    bodies: [
      "거리 자체보다 관계를 유지하는 방식에 대한 내 기준을 골라보세요.",
      "장거리 가능 여부를 통해 안정감, 노력, 현실감각이 드러나는 질문이에요.",
    ],
    guides: [
      "막연한 이상보다 실제 내 생활 패턴 기준으로 답해주세요.",
      "좋은 사람을 만났다고 가정했을 때의 현실적 반응을 떠올려보세요.",
    ],
    choiceOptions: [
      [
        "좋은 사람이면 거리 정도는 감수할 수 있다",
        "초반엔 어렵지만 확신이 생기면 가능하다",
        "거리보다 연락과 약속 이행이 더 중요하다",
        "나는 장거리는 현실적으로 어렵다",
      ],
      [
        "거리보다 노력의 균형이 중요하다",
        "만나는 빈도가 너무 낮으면 힘들다",
        "장거리는 감정 관리가 어렵다고 본다",
        "현실적으로 내 생활과 맞지 않는다",
      ],
    ],
  },
  {
    topicKey: "apology_style_importance",
    topicBucket: "apology",
    category: "value",
    categoryLabel: "가치관",
    angleKeys: ["maturity", "conflict", "accountability"],
    titles: [
      "사과할 때 가장 중요하게 보는 건?",
      "연애에서 사과 방식이 별로면 나는?",
      "미안하다는 말보다 더 중요하게 보는 태도는?",
    ],
    bodies: [
      "갈등 이후 사과를 받을 때 내가 중요하게 보는 기준과 가까운 선택지를 골라보세요.",
      "책임감, 공감 능력, 감정 회복 방식이 드러나는 질문이에요.",
    ],
    guides: [
      "말의 길이보다 진정성과 태도에 대한 내 기준을 떠올려보세요.",
      "내가 실제로 용서할 수 있는 사과의 조건을 기준으로 골라주세요.",
    ],
    choiceOptions: [
      [
        "빠르게 인정하고 바로 사과하는 태도",
        "내 감정을 이해하려는 공감",
        "말보다 이후 행동이 달라지는 것",
        "핑계 없이 책임지는 태도",
      ],
      [
        "사과의 타이밍이 중요하다",
        "말보다 태도와 표정이 중요하다",
        "같은 실수를 반복하지 않는 게 중요하다",
        "진심이 느껴지지 않으면 더 멀어진다",
      ],
    ],
  },
  {
    topicKey: "career_priority_relationship",
    topicBucket: "career",
    category: "marriage",
    categoryLabel: "결혼관",
    angleKeys: ["career", "balance", "future"],
    titles: [
      "일이 정말 중요한 사람과의 연애, 내 기준은?",
      "커리어 우선인 연인을 만나면 나는?",
      "연애보다 일이 먼저인 사람, 어디까지 이해 가능할까?",
    ],
    bodies: [
      "일과 연애의 우선순위가 분명한 사람을 만났을 때, 내 실제 기준과 가까운 선택지를 골라보세요.",
      "현실감과 관계 우선순위에 대한 가치관이 드러나는 질문이에요.",
    ],
    guides: [
      "이상적인 연애보다 실제 내가 버틸 수 있는 균형을 떠올려주세요.",
      "상대 비난보다 내 우선순위 기준을 중심으로 골라주세요.",
    ],
    choiceOptions: [
      [
        "일이 중요한 건 이해하지만 소통은 필요하다",
        "바쁜 건 괜찮지만 항상 후순위면 어렵다",
        "서로 목표가 분명하면 괜찮다",
        "연애보다 일이 먼저인 사람은 나와 안 맞는다",
      ],
      [
        "시간보다 태도가 더 중요하다",
        "일 중심인 사람에게도 배려는 필요하다",
        "성장기라면 어느 정도 감수할 수 있다",
        "나는 관계 우선순위를 꽤 중요하게 본다",
      ],
    ],
  },
  {
    topicKey: "flirting_line_public_private",
    topicBucket: "flirting",
    category: "date",
    categoryLabel: "연애",
    angleKeys: ["flirting", "public", "boundary"],
    titles: [
      "썸탈 때 공개적인 표현 vs 사적인 표현, 나는 어디에 더 끌릴까?",
      "호감 표현이 사람들 앞에서 티 나는 사람을 보면?",
      "플러팅이 자연스러운 사람, 내 기준에서는?",
    ],
    bodies: [
      "호감 표현 방식에 대한 내 취향과 경계선을 보여주는 질문이에요.",
      "공개적인 표현과 사적인 표현 중 내가 더 편하게 느끼는 방식을 골라보세요.",
    ],
    guides: [
      "로맨틱함의 정도보다 내가 편한 방식이 무엇인지 떠올려주세요.",
      "남들 앞과 둘만 있을 때의 차이에 대한 내 반응을 생각해보세요.",
    ],
    choiceOptions: [
      [
        "사적인 순간에 표현이 깊은 사람이 좋다",
        "사람들 앞에서도 자연스럽게 표현하는 게 좋다",
        "표현 방식보다 진정성이 더 중요하다",
        "너무 티 나는 플러팅은 부담스럽다",
      ],
      [
        "은근한 표현이 더 설렌다",
        "분명한 표현이 헷갈리지 않아 좋다",
        "내가 편한 속도와 결이 중요하다",
        "연애 초반엔 과한 표현이 어렵다",
      ],
    ],
  },
  {
    topicKey: "self_awareness_partner_standard",
    topicBucket: "self_awareness",
    category: "value",
    categoryLabel: "가치관",
    angleKeys: ["self_awareness", "standards", "realism"],
    titles: [
      "이상형 기준이 높아도 괜찮은 걸까, 나는 어떻게 생각할까?",
      "연애 기준이 높은 사람을 보면 드는 생각은?",
      "자기 객관화와 이상형 기준, 내 생각에 더 가까운 건?",
    ],
    bodies: [
      "연애 기준과 현실 감각에 대한 내 생각을 보여주는 질문이에요.",
      "기준이 높은 것 자체보다, 그것을 바라보는 내 태도와 가장 가까운 답을 골라보세요.",
    ],
    guides: [
      "남을 평가하기보다 내 현실감각 기준을 떠올리며 답해주세요.",
      "친구와 이 주제로 대화한다면 어떤 쪽에 가까운지 생각해보세요.",
    ],
    choiceOptions: [
      [
        "기준이 높은 건 자유지만 나도 그만큼 갖춰야 한다고 본다",
        "기준은 높을 수 있지만 현실감각도 중요하다",
        "사람마다 우선순위가 다르니 존중하는 편이다",
        "기준보다 스스로 어떤 사람인지 아는 게 더 중요하다",
      ],
      [
        "이상형은 있어도 유연해야 한다",
        "현실적인 자기 객관화가 중요하다",
        "기준 높은 사람보다 태도를 먼저 본다",
        "조건보다 사람 보는 눈이 중요하다고 본다",
      ],
    ],
  },
  {
    topicKey: "texting_tone_vs_frequency",
    topicBucket: "texting",
    category: "date",
    categoryLabel: "연애",
    angleKeys: ["texting", "tone", "frequency"],
    titles: [
      "연락은 자주 없더라도 말투가 좋으면 괜찮을까?",
      "연락 빈도보다 더 크게 느껴지는 건?",
      "문자 횟수 vs 말투의 온도, 내 기준에 더 중요한 건?",
    ],
    bodies: [
      "연애에서 연락의 양과 질 중 무엇을 더 중요하게 느끼는지 골라보세요.",
      "연락 습관을 볼 때 내가 더 크게 반응하는 포인트를 드러내는 질문이에요.",
    ],
    guides: [
      "자주 연락하는지보다 어떤 연락에 마음이 움직이는지 떠올려보세요.",
      "실제 내 연애 스타일에 가까운 기준으로 골라주세요.",
    ],
    choiceOptions: [
      [
        "횟수보다 말투와 온도가 더 중요하다",
        "말투가 좋아도 연락이 너무 없으면 어렵다",
        "둘 다 적당히 맞아야 한다",
        "연락보다 실제 만남에서 느껴지는 게 더 중요하다",
      ],
      [
        "짧아도 다정한 연락이 좋다",
        "꾸준한 빈도가 안정감을 준다",
        "말투와 배려가 핵심이다",
        "너무 뜨문뜨문이면 결국 힘들다",
      ],
    ],
  },
];

function countUsedBuckets(list = []) {
  const bucketCountMap = {};

  (Array.isArray(list) ? list : []).forEach((item) => {
    const bucket = String(item?.topicBucket || "").trim();
    if (!bucket) return;
    bucketCountMap[bucket] = (bucketCountMap[bucket] || 0) + 1;
  });

  return bucketCountMap;
}

function getLeastUsedBuckets(existingCards = [], currentDrafts = []) {
  const usage = countUsedBuckets([...existingCards, ...currentDrafts]);

  return TOPIC_BUCKET_PRIORITY.slice().sort((a, b) => {
    const aCount = usage[a] || 0;
    const bCount = usage[b] || 0;
    if (aCount === bCount) {
      return TOPIC_BUCKET_PRIORITY.indexOf(a) - TOPIC_BUCKET_PRIORITY.indexOf(b);
    }
    return aCount - bCount;
  });
}

export function createRecommendedCardCandidate(
  seedIndex = 0,
  {
    existingCards = [],
    currentDrafts = [],
    excludedTopicKeys = [],
    categoryHint = "",
    preferredTopicBuckets = [],
  } = {}
) {
  const usedTopicKeys = new Set(
    [...existingCards, ...currentDrafts]
      .map((item) => String(item?.topicKey || "").trim().toLowerCase())
      .filter(Boolean)
  );

  const hardBlockedTopics = new Set(
    [...excludedTopicKeys, ...usedTopicKeys]
      .map((item) => String(item || "").trim().toLowerCase())
      .filter(Boolean)
  );

  const preferredBucketSet = new Set(
    (Array.isArray(preferredTopicBuckets) ? preferredTopicBuckets : [])
      .map((item) => String(item || "").trim())
      .filter(Boolean)
  );

  const hintFiltered = RECOMMENDED_CARD_BLUEPRINTS.filter((item) => {
    if (hardBlockedTopics.has(String(item.topicKey).toLowerCase())) return false;
    if (categoryHint && item.category !== categoryHint) return false;
    if (preferredBucketSet.size && !preferredBucketSet.has(item.topicBucket)) return false;
    return true;
  });

  const fallbackFiltered = RECOMMENDED_CARD_BLUEPRINTS.filter((item) => {
    if (hardBlockedTopics.has(String(item.topicKey).toLowerCase())) return false;
    if (preferredBucketSet.size && !preferredBucketSet.has(item.topicBucket)) return false;
    return true;
  });

  const pool = hintFiltered.length
    ? hintFiltered
    : fallbackFiltered.length
      ? fallbackFiltered
      : RECOMMENDED_CARD_BLUEPRINTS;

  const shuffledPool = shuffleBySeed(pool, `pool-${seedIndex}`);
  const picked = shuffledPool[0];

  const questionType =
    simpleHash(`${picked.topicKey}-${seedIndex}-type`) % 100 < 35 ? "text" : "choice";

  const title = pickByHash(picked.titles, `${picked.topicKey}-${seedIndex}-title`);
  const body = pickByHash(picked.bodies, `${picked.topicKey}-${seedIndex}-body`);
  const guide = pickByHash(picked.guides, `${picked.topicKey}-${seedIndex}-guide`);
  const angleKey =
    pickByHash(picked.angleKeys, `${picked.topicKey}-${seedIndex}-angle`) || "default";

  const optionSet =
    pickByHash(picked.choiceOptions, `${picked.topicKey}-${seedIndex}-options`) || [];

  return {
    id: `recommended-${picked.topicKey}-${seedIndex}-${Date.now()}`,
    title,
    body,
    guide,
    category: picked.category,
    categoryLabel:
      CARD_CATEGORY_LABEL_MAP[picked.category] || picked.categoryLabel || "기타",
    questionType,
    options: questionType === "choice" ? optionSet : [],
    source: "local",
    visibilityTarget: "male",
    topicKey: picked.topicKey,
    topicBucket: picked.topicBucket || "",
    angleKey,
    viralWhy: "댓글 논쟁이 붙기 쉬운 현실 연애 질문",
    targetReaction: "여성은 판단 포인트가 뚜렷하고, 남성은 자기 스타일이 드러남",
  };
}

function buildSeedJump(seedIndex = 0) {
  return (simpleHash(`jump-${seedIndex}`) % 97) + 13;
}

export function buildRecommendedDrafts({
  count = 2,
  existingCards = [],
  currentDrafts = [],
  seedStart = 0,
  categoryHint = "",
  excludedTopicKeys = [],
} = {}) {
  const results = [];
  let seedIndex = seedStart;
  let guard = 0;
  const localExcluded = new Set(excludedTopicKeys);

  while (results.length < count && guard < 500) {
    const leastUsedBuckets = getLeastUsedBuckets(existingCards, [
      ...currentDrafts,
      ...results,
    ]);

    const preferredTopicBuckets = leastUsedBuckets.slice(0, 4);

    const candidate = createRecommendedCardCandidate(seedIndex, {
      existingCards,
      currentDrafts: [...currentDrafts, ...results],
      excludedTopicKeys: [...localExcluded],
      categoryHint,
      preferredTopicBuckets,
    });

    const compareDrafts = [...currentDrafts, ...results];
    const usedBuckets = countUsedBuckets(compareDrafts);
    const candidateBucket = String(candidate?.topicBucket || "").trim();

    const isBucketOverused =
      candidateBucket &&
      typeof usedBuckets[candidateBucket] === "number" &&
      usedBuckets[candidateBucket] >= 2;

    if (
      !isBucketOverused &&
      !isDuplicateDraft(candidate, existingCards, compareDrafts)
    ) {
      results.push(candidate);
      if (candidate?.topicKey) {
        localExcluded.add(candidate.topicKey);
      }
    }

    seedIndex += buildSeedJump(seedIndex);
    guard += 1;
  }

  return results;
}