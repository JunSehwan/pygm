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

export const SIGNUP_APPROVAL_FREE_SPOON = 10;
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

function buildSmsMessage(lines = []) {
  const cleaned = lines
    .map((line) => String(line || "").trim())
    .filter(Boolean);

  return ["[차밍수프]", ...cleaned, CHARMINGSOUP_URL].join("\n");
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
  return user?.education || user?.school || user?.schoolName || "-";
}

export function getReligionLabel(user = {}) {
  return user?.religion || "-";
}

export function getSalaryLabel(user = {}) {
  return user?.salary || "-";
}

export function getStyleTestLabel(user = {}) {
  if (user?.styleTest?.typeTitle && user?.styleTest?.oneLine) {
    return `${user.styleTest.typeTitle} · ${user.styleTest.oneLine}`;
  }
  if (user?.styleTest?.typeTitle) return user.styleTest.typeTitle;
  if (user?.styleTest?.oneLine) return user.styleTest.oneLine;
  return "-";
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

  return "-";
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

export function getUserApprovalState(user = {}) {
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

export async function approveUser({ db, item, adminUid, sendLms }) {
  const userId = getUserDocId(item);
  if (!userId) throw new Error("user id not found");

  const spoonReward = SIGNUP_APPROVAL_FREE_SPOON;
  const spoonState = getSpoonSnapshot(item);

  await setDoc(
    doc(db, "users", userId),
    {
      signupApproved: true,
      adminApprovalStatus: "approved",
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
    title: "가입 승인 무료 스푼 지급",
    createdAt: serverTimestamp(),
  });

  await createNotification(db, {
    targetUid: userId,
    type: "signup_approved",
    title: "가입 승인이 완료됐어요",
    body: `무료 스푼 ${spoonReward}개가 지급됐어요.`,
    href: "/welcome",
  });

  const phone = normalizePhone(item?.phonenumber || item?.phoneNumber || "");
  if (phone && typeof sendLms === "function") {
    await sendLms(
      phone,
      buildSmsMessage([
        "가입 승인이 완료됐어요.",
        `무료 스푼 ${spoonReward}개 지급`,
      ]),
      "차밍수프 가입 승인",
      { forceLms: true }
    );
  }
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
      buildSmsMessage(["가입 검토 결과", reasonText, "수정 후 다시 등록해주세요."]),
      "차밍수프 가입 검토",
      { forceLms: true }
    );
  }
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
        buildSmsMessage(["차밍카드가 승인됐어요."]),
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
  return String(value)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\w가-힣]/g, "")
    .trim();
}

export function isDuplicateDraft(candidate = {}, existingCards = [], currentDrafts = []) {
  const titleKey = normalizeCardText(candidate.title || "");
  const bodyKey = normalizeCardText(candidate.body || candidate.guide || "");
  const compareList = [...existingCards, ...currentDrafts];

  return compareList.some((item) => {
    const itemTitle = normalizeCardText(item.title || "");
    const itemBody = normalizeCardText(item.body || item.guide || "");

    if (titleKey && itemTitle && titleKey === itemTitle) return true;
    if (bodyKey && itemBody && bodyKey === itemBody) return true;
    if (titleKey && itemTitle && (titleKey.includes(itemTitle) || itemTitle.includes(titleKey))) {
      return true;
    }
    return false;
  });
}

export function createRecommendedCardCandidate(seedIndex = 0) {
  const categoryPool = [
    {
      key: "sense",
      label: "센스",
      titles: [
        "첫 만남이 어색할 때 나는?",
        "소개팅 자리에서 정적이 생기면 나는?",
        "상대가 긴장한 것 같을 때 내 반응은?",
        "처음 만난 사람과 어색할 때 나는?",
      ],
      bodies: [
        "소개팅이나 첫 만남에서 분위기가 조금 어색할 때, 내가 보통 먼저 하는 행동에 가장 가까운 선택지를 골라보세요.",
        "낯선 사람과 만났을 때 내가 분위기를 풀어가는 방식에 가장 가까운 답을 골라보세요.",
        "서로 아직 어색한 순간에 내가 자연스럽게 꺼내는 반응과 가장 비슷한 선택지를 골라보세요.",
      ],
      guides: [
        "가볍게 생각하고 가장 평소와 가까운 답을 골라주세요.",
        "실제 소개팅 상황을 떠올리며 답해주세요.",
      ],
      options: [
        ["가벼운 농담으로 분위기를 푼다", "상대가 편해질 때까지 질문을 이어간다", "잠깐 쉬어가는 화제를 꺼낸다", "상대 반응을 보며 천천히 맞춘다"],
        ["내 얘기부터 조금 꺼낸다", "상대가 말하기 쉬운 질문을 한다", "먹는 것·취미 같은 편한 주제로 돌린다", "굳이 무리하지 않고 자연스럽게 둔다"],
      ],
    },
    {
      key: "value",
      label: "가치관",
      titles: [
        "연애에서 내가 더 중요하게 보는 건?",
        "상대를 볼 때 가장 먼저 보는 기준은?",
        "호감이 커지는 순간은 언제일까?",
      ],
      bodies: [
        "연애할 때 내가 가장 중요하게 생각하는 기준에 가까운 선택지를 골라보세요.",
        "좋아하는 사람이 생길 때 내 기준과 가장 가까운 답을 선택해주세요.",
      ],
      guides: [
        "정답은 없어요. 가장 솔직한 답을 선택해주세요.",
        "이상적인 모습보다 실제 내 기준으로 골라주세요.",
      ],
      options: [
        ["대화가 편한 사람", "배려가 느껴지는 사람", "생활 리듬이 잘 맞는 사람", "미래 방향이 비슷한 사람"],
        ["센스 있는 말투", "따뜻한 태도", "꾸준한 연락", "책임감 있는 모습"],
      ],
    },
    {
      key: "date",
      label: "연애",
      titles: [
        "연락 텀에 대한 내 스타일은?",
        "데이트 직후 내가 더 호감 느끼는 건?",
        "호감 표현을 받으면 나는?",
      ],
      bodies: [
        "연애 초반 연락 스타일에 대해 내 성향과 가까운 답을 골라보세요.",
        "상대와 만난 뒤 어떤 행동에서 더 호감을 느끼는지 골라보세요.",
      ],
      guides: [
        "평소 내 연애 습관에 가깝게 답해주세요.",
        "좋아 보이는 답보다 실제 내 스타일을 골라주세요.",
      ],
      options: [
        ["자주 짧게 연락하는 게 좋다", "하루 한두 번 깊게 연락하는 게 좋다", "상황 맞춰 자연스럽게 연락하면 된다", "연락보다 실제 만남이 더 중요하다"],
        ["집 도착했냐고 챙겨줄 때", "다음 만남을 먼저 이야기할 때", "오늘 즐거웠다고 표현할 때", "부담 없이 자연스럽게 대할 때"],
      ],
    },
    {
      key: "lifestyle",
      label: "생활",
      titles: [
        "주말을 보내는 내 방식은?",
        "생활 패턴이 잘 맞는다는 건?",
        "연애할 때 중요한 생활 요소는?",
      ],
      bodies: [
        "내 생활 패턴과 가장 가까운 선택지를 골라보세요.",
        "상대와 잘 맞는다고 느끼는 생활 요소를 골라보세요.",
      ],
      guides: [
        "평소 생활 리듬을 떠올리며 답해주세요.",
        "지금 내 생활 기준으로 선택해주세요.",
      ],
      options: [
        ["집에서 쉬는 시간이 꼭 필요하다", "밖에 나가야 에너지가 난다", "그날 기분 따라 유동적이다", "사람 만나며 보내는 걸 좋아한다"],
        ["수면 패턴", "식습관", "정리정돈 습관", "돈 쓰는 방식"],
      ],
    },
    {
      key: "marriage",
      label: "결혼관",
      titles: [
        "결혼을 생각할 때 가장 중요한 건?",
        "오래 가는 관계에 필요하다고 보는 건?",
        "현실적인 만남에서 중요한 요소는?",
      ],
      bodies: [
        "결혼이나 장기적인 관계를 생각할 때 가장 중요하게 보는 기준을 골라보세요.",
        "현실적인 관계에서 꼭 필요하다고 느끼는 요소를 골라보세요.",
      ],
      guides: [
        "가볍게 떠오르는 기준보다 실제로 중요하게 느끼는 걸 골라주세요.",
        "이상형보다 현실적인 기준으로 답해주세요.",
      ],
      options: [
        ["대화와 정서적 안정감", "생활 습관의 조화", "경제관의 유사함", "서로에 대한 책임감"],
        ["서로 존중하는 태도", "갈등을 푸는 방식", "가족관의 유사함", "미래 계획의 방향성"],
      ],
    },
  ];

  const pickedCategory = categoryPool[seedIndex % categoryPool.length];
  const title = pickedCategory.titles[seedIndex % pickedCategory.titles.length];
  const body = pickedCategory.bodies[seedIndex % pickedCategory.bodies.length];
  const guide = pickedCategory.guides[seedIndex % pickedCategory.guides.length];
  const optionSet = pickedCategory.options[seedIndex % pickedCategory.options.length];

  const questionType = seedIndex % 3 === 0 ? "text" : "choice";

  return {
    id: `recommended-${pickedCategory.key}-${seedIndex}-${Date.now()}`,
    title,
    body,
    guide,
    category: pickedCategory.key,
    categoryLabel: pickedCategory.label,
    questionType,
    options: questionType === "choice" ? optionSet : [],
    source: "local",
    visibilityTarget: "male",
  };
}

export function buildRecommendedDrafts({
  count = 2,
  existingCards = [],
  currentDrafts = [],
  seedStart = 0,
} = {}) {
  const results = [];
  let seedIndex = seedStart;
  let guard = 0;

  while (results.length < count && guard < 200) {
    const candidate = createRecommendedCardCandidate(seedIndex);
    const compareDrafts = [...currentDrafts, ...results];

    if (!isDuplicateDraft(candidate, existingCards, compareDrafts)) {
      results.push(candidate);
    }

    seedIndex += 1;
    guard += 1;
  }

  return results;
}