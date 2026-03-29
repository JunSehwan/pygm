import {
  addDoc,
  collection,
  doc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

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

  await setDoc(
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

  await createNotification(db, {
    targetUid: userId,
    type: "signup_approved",
    title: "가입 승인이 완료됐어요",
    body: "이제 서비스 이용을 계속 진행할 수 있어요.",
    href: "/welcome",
  });

  const phone = normalizePhone(item?.phonenumber || item?.phoneNumber || "");
  if (phone && typeof sendLms === "function") {
    await sendLms(
      phone,
      `[차밍수프]\n가입 승인이 완료됐어요.\n이제 서비스를 이용하실 수 있어요.`,
      "차밍수프 가입 승인",
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
  });

  if (card?.creatorUid) {
    await createNotification(db, {
      targetUid: card.creatorUid,
      type: "card_approved",
      title: "차밍카드가 승인됐어요",
      body: "작성한 카드가 공개 상태로 전환됐어요.",
      href: `/cards/${card.id}`,
    });

    const phone = normalizePhone(
      creatorUser?.phonenumber || creatorUser?.phoneNumber || ""
    );

    if (phone && typeof sendLms === "function") {
      await sendLms(
        phone,
        `[차밍수프]\n작성하신 차밍카드가 승인됐어요.\n지금 반응을 확인해보세요.`,
        "차밍카드 승인",
        { forceLms: true }
      );
    }
  }
}

export async function rejectCard({ db, card, adminUid }) {
  await updateDoc(doc(db, "charmingCards", card.id), {
    status: "rejected",
    adminApprovalStatus: "rejected",
    isPublished: false,
    rejectedAt: serverTimestamp(),
    rejectedBy: adminUid || "",
    updatedAt: serverTimestamp(),
  });

  if (card?.creatorUid) {
    await createNotification(db, {
      targetUid: card.creatorUid,
      type: "card_rejected",
      title: "차밍카드 검토 결과가 등록됐어요",
      body: "수정 후 다시 등록해주세요.",
      href: "/cards/list",
    });
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
        adminPenaltyStatus: "suspended",
        suspendedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  await createNotification(db, {
    targetUid,
    type: `report_${nextStatus}`,
    title: "운영 검토 결과가 반영됐어요",
    body:
      action === "warn"
        ? "주의 안내가 등록됐어요."
        : action === "suspend"
          ? "이용 제한이 적용됐어요."
          : action === "dismiss"
            ? "신고가 기각 처리됐어요."
            : "검토가 완료됐어요.",
    href: "/setting",
  });

  const foundUser = Array.isArray(users)
    ? users.find((item) => getUserDocId(item) === targetUid)
    : null;

  const phone = normalizePhone(
    foundUser?.phonenumber || foundUser?.phoneNumber || ""
  );

  if (phone && typeof sendLms === "function" && action !== "dismiss") {
    await sendLms(
      phone,
      `[차밍수프]\n운영정책 검토 결과가 반영됐어요.\n앱에서 자세한 내용을 확인해주세요.`,
      "차밍수프 운영 안내",
      { forceLms: true }
    );
  }
}

export async function confirmPayment({ db, item, adminUid, sendLms }) {
  if (!item?.uid) throw new Error("payment uid not found");

  const spoonAmount = Number(item?.spoonAmount || 0);
  if (!spoonAmount) throw new Error("spoon amount not found");

  await setDoc(
    doc(db, "users", item.uid),
    {
      spoon: increment(spoonAmount),
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
    createdAt: serverTimestamp(),
  });

  await createNotification(db, {
    targetUid: item.uid,
    type: "spoon_charge_completed",
    title: `스푼 ${spoonAmount}개가 충전됐어요`,
    body: "지금 바로 관심 보내기 또는 차밍카드를 확인해보세요.",
    href: "/store/history",
  });

  const phone = normalizePhone(item?.phoneNumber || item?.phonenumber || "");
  if (phone && typeof sendLms === "function") {
    await sendLms(
      phone,
      `[차밍수프]\n스푼 ${spoonAmount}개가 충전됐어요.\n지금 바로 관심 보내기와 차밍카드를 확인해보세요.`,
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
        "소개팅이나 첫 만남에서 분위기가 조금 어색해졌을 때 나는 보통 어떻게 하나요?",
        "대화 흐름이 잠깐 끊겼을 때 내 반응에 가장 가까운 것은 무엇인가요?",
        "낯선 자리에서 어색함이 느껴질 때 나는 어떤 편인가요?",
      ],
      guides: [
        "좋아 보이는 답보다 실제 내 모습에 가까운 답을 골라주세요.",
        "말주변보다 분위기를 대하는 태도가 궁금해요.",
        "첫인상에서 드러나는 자연스러운 스타일 기준으로 골라주세요.",
      ],
      options: [
        [
          "가벼운 농담으로 분위기를 푼다",
          "질문을 던지며 대화를 이어간다",
          "상대가 말할 때까지 천천히 기다린다",
          "나도 어색해서 말이 줄어드는 편이다",
        ],
        [
          "내가 먼저 화제를 꺼낸다",
          "상대 반응을 보며 자연스럽게 맞춘다",
          "편한 주제가 나올 때까지 기다린다",
          "표정과 리액션으로 분위기를 부드럽게 만든다",
        ],
      ],
      textBodies: [
        "어색한 분위기를 풀기 위해 내가 자주 쓰는 방법이 있다면 적어주세요.",
        "첫 만남에서 상대를 편하게 해주기 위해 내가 신경 쓰는 부분이 있다면 적어주세요.",
      ],
    },
    {
      key: "value",
      label: "가치관",
      titles: [
        "오래 만날 사람을 볼 때 중요한 건?",
        "관계가 오래가려면 가장 중요한 건?",
        "연애에서 결국 중요해지는 건?",
        "편안한 관계를 위해 꼭 필요한 건?",
      ],
      bodies: [
        "오래 만날 수 있는 사람인지 판단할 때 가장 중요하게 보는 기준은 무엇인가요?",
        "연애가 깊어질수록 더 중요하다고 느끼는 요소는 무엇인가요?",
        "처음보다 시간이 지날수록 중요해지는 기준은 무엇인가요?",
      ],
      guides: [
        "조건보다 실제 관계에서 중요하다고 느끼는 쪽에 가깝게 골라주세요.",
        "나를 포장하지 말고 진짜 기준으로 답해주세요.",
        "짧은 만남보다 오래 가는 관계 기준으로 골라주세요.",
      ],
      options: [
        [
          "대화가 잘 통하는지",
          "생활습관이 잘 맞는지",
          "책임감과 성실함",
          "감정 표현 방식이 잘 맞는지",
        ],
        [
          "가치관이 비슷한지",
          "함께 있을 때 편안한지",
          "배려와 예의가 있는지",
          "미래 방향이 비슷한지",
        ],
      ],
      textBodies: [
        "내가 오래 만날 수 있는 사람이라고 느끼는 기준을 적어주세요.",
        "관계가 깊어질수록 꼭 맞아야 한다고 생각하는 부분을 적어주세요.",
      ],
    },
    {
      key: "date",
      label: "연애",
      titles: [
        "호감이 생기면 나는?",
        "썸에서 마음이 생기기 시작하면 나는?",
        "상대가 마음에 들 때 내 스타일은?",
        "첫 만남 뒤 호감이 남으면 나는?",
      ],
      bodies: [
        "첫 만남 이후 호감이 생겼을 때 나는 보통 어떤 반응을 보이나요?",
        "상대가 마음에 들기 시작하면 나는 어떤 편인가요?",
        "소개팅 이후 관심이 생겼을 때 내 행동과 가장 가까운 것은 무엇인가요?",
      ],
      guides: [
        "용기 있어 보이는 답보다 실제 행동과 가까운 답을 골라주세요.",
        "마음이 생겼을 때의 솔직한 반응으로 답해주세요.",
        "나도 모르게 나오는 연애 스타일에 가깝게 골라주세요.",
      ],
      options: [
        [
          "먼저 연락한다",
          "상대 반응을 보고 조심스럽게 다가간다",
          "직접 표현은 잘 못하지만 티가 난다",
          "마음이 있어도 표현이 느린 편이다",
        ],
        [
          "티 나게 표현하는 편이다",
          "자연스럽게 대화 기회를 만든다",
          "상대가 편해질 때까지 기다린다",
          "호감이 있어도 확신 전엔 조심한다",
        ],
      ],
      textBodies: [
        "상대에게 호감이 생겼을 때 내가 보이는 신호가 있다면 적어주세요.",
        "마음이 생겼을 때 나는 보통 어떻게 표현하는지 적어주세요.",
      ],
    },
    {
      key: "lifestyle",
      label: "생활",
      titles: [
        "주말 데이트에서 더 끌리는 쪽은?",
        "편하게 가까워지기 좋은 데이트는?",
        "내가 좋아하는 데이트 분위기는?",
        "연애 초반 더 편한 데이트는?",
      ],
      bodies: [
        "주말 데이트를 한다면 어떤 분위기의 시간을 가장 좋아하나요?",
        "상대와 자연스럽게 가까워지기 좋은 데이트 코스는 어떤 쪽인가요?",
        "연애 초반에 가장 편하다고 느끼는 데이트 스타일은 무엇인가요?",
      ],
      guides: [
        "멋있어 보이는 답보다 실제로 편한 쪽을 골라주세요.",
        "나의 생활 리듬에 가까운 취향으로 골라주세요.",
        "현실적으로 가장 자주 선호할 답을 골라주세요.",
      ],
      options: [
        [
          "맛집/카페처럼 편한 코스",
          "전시/공연처럼 취향이 보이는 코스",
          "산책/드라이브처럼 여유 있는 코스",
          "집 근처에서 가볍게 보는 코스",
        ],
        [
          "조용히 대화할 수 있는 곳",
          "활동적인 체험이 있는 곳",
          "풍경 보며 걷는 코스",
          "짧고 부담 없는 만남",
        ],
      ],
      textBodies: [
        "내가 편하게 가까워질 수 있는 데이트 분위기를 적어주세요.",
        "연애 초반 가장 좋아하는 데이트 스타일을 적어주세요.",
      ],
    },
    {
      key: "marriage",
      label: "결혼관",
      titles: [
        "결혼 전에 꼭 맞아야 하는 건?",
        "결혼을 생각하면 가장 중요해지는 건?",
        "결혼 전 현실적으로 가장 크게 보는 건?",
        "결혼 전에 꼭 확인하고 싶은 건?",
      ],
      bodies: [
        "결혼을 생각할 때 현실적으로 가장 중요하다고 느끼는 요소는 무엇인가요?",
        "결혼 전 꼭 맞아야 한다고 생각하는 부분은 무엇인가요?",
        "연애와 다르게 결혼에서는 더 중요하다고 느끼는 기준은 무엇인가요?",
      ],
      guides: [
        "이상적인 답보다 현실적으로 가장 크게 보는 기준을 골라주세요.",
        "실제 결혼을 생각했을 때 중요도가 높은 쪽으로 골라주세요.",
        "현실적인 기준으로 답해주세요.",
      ],
      options: [
        [
          "경제관념과 소비 습관",
          "생활 방식과 집안일 감각",
          "대화와 갈등 해결 방식",
          "가족관계와 책임감",
        ],
        [
          "미래 계획이 비슷한지",
          "정서적으로 안정감을 주는지",
          "현실 감각이 맞는지",
          "함께 있을 때 편안한지",
        ],
      ],
      textBodies: [
        "결혼 전에 꼭 맞아야 한다고 생각하는 부분을 적어주세요.",
        "연애보다 결혼에서 더 중요하다고 느끼는 기준을 적어주세요.",
      ],
    },
  ];

  const category = categoryPool[seedIndex % categoryPool.length];
  const type = seedIndex % 3 === 0 ? "text" : "choice";

  const title = category.titles[seedIndex % category.titles.length];
  const body =
    type === "choice"
      ? category.bodies[seedIndex % category.bodies.length]
      : category.textBodies[seedIndex % category.textBodies.length];
  const guide = category.guides[seedIndex % category.guides.length];
  const options =
    type === "choice"
      ? [...category.options[seedIndex % category.options.length]]
      : [];

  return {
    id: `${Date.now()}-${seedIndex}-${Math.random().toString(36).slice(2, 8)}`,
    questionType: type,
    category: category.key,
    categoryLabel: category.label,
    title,
    body,
    guide,
    options,
    visibilityTarget: "male",
    source: "local",
  };
}

export function buildRecommendedDrafts({
  count = 2,
  existingCards = [],
  currentDrafts = [],
}) {
  const results = [];
  let seed = 0;
  let safety = 0;

  while (results.length < count && safety < 200) {
    safety += 1;
    const candidate = createRecommendedCardCandidate(seed);
    seed += 1;

    if (isDuplicateDraft(candidate, existingCards, [...currentDrafts, ...results])) {
      continue;
    }

    results.push(candidate);
  }

  return results;
}