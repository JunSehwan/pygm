import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import LoadingPage from "components/Common/Loading";
import CardListContainer from "components/Cards/List/CardListContainer";
import BottomNavbar from "components/Common/BottomNavbar";

import { db } from "firebaseConfig";
import {
  setUser,
  userLoadingStart,
  userLoadingEnd,
  userLoadingEndwithNoone,
} from "slices/user";

import ProfileCompletePromptModal, {
  useProfileCompletePrompt,
} from "components/Common/ProfileCompletePromptModal";

import { isBlockedTargetUser } from "lib/userBlockRules";
import { isAdminMatchExposureBlocked } from "lib/arena";

const SHOW_PENDING_FOR_DEV = false;

function serializeTimestamp(value) {
  if (!value) return null;

  if (typeof value?.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (value?.seconds) {
    return new Date(value.seconds * 1000).toISOString();
  }

  return value;
}

function serializeStyleTest(styleTest = {}) {
  if (!styleTest || typeof styleTest !== "object") return {};

  return {
    ...styleTest,
    completedAt: serializeTimestamp(styleTest.completedAt),
  };
}

function buildCurrentUser(firebaseUser, docData = {}, userDocId) {
  return {
    userID: firebaseUser?.uid || userDocId || "",
    uid: firebaseUser?.uid || userDocId || "",
    username: docData.username || "",
    nickname: docData.nickname || "",
    name: docData.name || "",
    email: docData.email || firebaseUser?.email || "",
    birthday: docData.birthday || "",
    birth: docData.birth || "",
    birthDay: docData.birthDay || "",
    gender: docData.gender || "",
    phonenumber: docData.phonenumber || "",
    thumbimage: Array.isArray(docData.thumbimage)
      ? docData.thumbimage
      : docData.thumbimage
        ? [docData.thumbimage]
        : [],
    date_sleep: docData.date_sleep ?? false,
    withdraw: docData.withdraw ?? false,
    date_profile_finished: docData.date_profile_finished ?? false,
    date_pending: docData.date_pending ?? true,

    maritalStatus: docData.maritalStatus || docData.status || "",
    status: docData.status || "",
    mbti: docData.mbti || "",
    mbti_ei: docData.mbti_ei || "",
    mbti_sn: docData.mbti_sn || "",
    mbti_tf: docData.mbti_tf || "",
    mbti_jp: docData.mbti_jp || "",
    job: docData.job || "",
    education: docData.education || "",
    residence: docData.residence || {},
    workArea: docData.workArea || {},

    address_sido: docData.address_sido || "",
    address_sigugun: docData.address_sigugun || "",
    company_location_sido: docData.company_location_sido || "",
    company_location_sigugun: docData.company_location_sigugun || "",

    height: docData.height || "",
    religion: docData.religion || "",
    salary: docData.salary || "",

    profilePhotos: Array.isArray(docData.profilePhotos)
      ? docData.profilePhotos
      : [],
    charmingCardPhotoPublic: !!docData.charmingCardPhotoPublic,
    charmingCardAnsweredIds: Array.isArray(docData.charmingCardAnsweredIds)
      ? docData.charmingCardAnsweredIds
      : [],
    styleTest: serializeStyleTest(docData.styleTest || {}),

    hobby: docData.hobby || "",
    hobbyList: Array.isArray(docData.hobbyList) ? docData.hobbyList : [],
    opfriend: docData.opfriend || "",
    friendmeeting: docData.friendmeeting || "",
    longdistance: docData.longdistance || "",
    datecycle: docData.datecycle || "",
    dateromance: docData.dateromance || "",
    contact: docData.contact || "",
    contactcycle: docData.contactcycle || "",
    passwordshare: docData.passwordshare || "",
    wedding: docData.wedding || "",
    wedding_dating: docData.wedding_dating || "",

    drink: docData.drink || "",
    health: docData.health || "",
    hotplace: docData.hotplace || "",
    tour: docData.tour || "",
    tourlike: docData.tourlike || "",
    tourpurpose: docData.tourpurpose || "",
    hobbyshare: docData.hobbyshare || "",

    career_goal: docData.career_goal || "",
    living_weekend: docData.living_weekend || "",
    living_consume: docData.living_consume || "",
    living_pet: docData.living_pet || "",
    living_tatoo: docData.living_tatoo || "",
    living_smoke: docData.living_smoke || "",
    living_charming: docData.living_charming || "",

    religion_important: docData.religion_important || "",
    religion_visit: docData.religion_visit || "",
    religion_accept: docData.religion_accept || "",
    food_taste: docData.food_taste || "",
    food_like: docData.food_like || "",
    food_dislike: docData.food_dislike || "",
    food_vegetarian: docData.food_vegetarian || "",
    food_spicy: docData.food_spicy || "",
    food_diet: docData.food_diet || "",

    blockedUpdatedAt: serializeTimestamp(docData.blockedUpdatedAt),
  };
}

function mapCardDoc(docSnap) {
  const data = docSnap.data() || {};

  return {
    id: docSnap.id,
    category: data.category || "value",
    questionType: data.questionType || "text",
    title: data.title || "",
    body: data.body || "",
    guide: data.guide || "",
    options: Array.isArray(data.options) ? data.options : [],
    creatorUid: data.creatorUid || "",
    creatorNickname: data.creatorNickname || "",
    creatorGender: data.creatorGender || "",
    isPublished: data.isPublished ?? false,
    status: data.status || "",
    visibilityTarget: data.visibilityTarget || "",
    views: typeof data.views === "number" ? data.views : 0,
    interestedCount:
      typeof data.interestedCount === "number" ? data.interestedCount : 0,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
}

function mapAnswerDoc(docSnap) {
  const data = docSnap.data() || {};

  return {
    id: docSnap.id,
    cardId: data.cardId || "",
    answererUid: data.answererUid || "",
    answererGender: data.answererGender || "",
    answerText: data.answerText || "",
    selectedOptionIndexes: Array.isArray(data.selectedOptionIndexes)
      ? data.selectedOptionIndexes
      : [],
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
}

function isFemaleGender(gender = "") {
  return String(gender || "").toLowerCase() === "female";
}

export default function CardListPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const auth = getAuth();
  const { user, loading } = useSelector((state) => state.user);

  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [answeredCardIds, setAnsweredCardIds] = useState([]);
  const [femaleReviewItems, setFemaleReviewItems] = useState([]);
  const [femaleReactionByAnswerId, setFemaleReactionByAnswerId] = useState({});
  const [femaleReportedAnswererUids, setFemaleReportedAnswererUids] = useState([]);

  const {
    open: profilePromptOpen,
    close: closeProfilePrompt,
  } = useProfileCompletePrompt(user, {
    cooldownDays: 7,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      dispatch(userLoadingStart());

      if (!firebaseUser) {
        dispatch(userLoadingEndwithNoone());
        setCards([]);
        setCardsLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          dispatch(userLoadingEndwithNoone());
          setCards([]);
          setCardsLoading(false);
          return;
        }

        const currentUser = buildCurrentUser(
          firebaseUser,
          userSnap.data(),
          userSnap.id
        );

        dispatch(setUser(currentUser));
        dispatch(userLoadingEnd());
      } catch (error) {
        console.error("[cards/list] user load error:", error);
        dispatch(userLoadingEndwithNoone());
        setCards([]);
        setCardsLoading(false);
      }
    });

    return () => unsub();
  }, [auth, dispatch]);

  useEffect(() => {
    let mounted = true;

    async function loadCards() {
      if (!user?.userID) {
        setCards([]);
        setCardsLoading(false);
        return;
      }

      try {
        setCardsLoading(true);

        const cardsSnap = await getDocs(
          query(
            collection(db, "charmingCards"),
            where("isPublished", "==", true),
            orderBy("updatedAt", "desc")
          )
        );

        const visibleCards = cardsSnap.docs.map(mapCardDoc);

        const creatorIds = Array.from(
          new Set(visibleCards.map((item) => item.creatorUid).filter(Boolean))
        );

        const creatorDocs = await Promise.all(
          creatorIds.map(async (uid) => {
            const userSnap = await getDoc(doc(db, "users", uid));
            if (!userSnap.exists()) return null;
            return {
              uid,
              ...userSnap.data(),
            };
          })
        );

        const creatorMap = {};
        creatorDocs.forEach((item) => {
          if (!item?.uid) return;
          creatorMap[item.uid] = item;
        });

        const nextCards = visibleCards.filter((card) => {
          const creator = creatorMap[card.creatorUid];
          if (!creator) return false;
          if (isAdminMatchExposureBlocked(creator)) return false;
          return !isBlockedTargetUser(user, creator);
        });

        if (!mounted) return;
        setCards(nextCards);
      } catch (error) {
        console.error("[cards/list] cards load error:", error);
        if (!mounted) return;
        setCards([]);
      } finally {
        if (mounted) setCardsLoading(false);
      }
    }

    loadCards();

    return () => {
      mounted = false;
    };
  }, [user?.userID, user?.blockedUpdatedAt]);

  useEffect(() => {
    let mounted = true;

    async function loadAnsweredIds() {
      if (!user?.userID) {
        setAnsweredCardIds([]);
        return;
      }

      try {
        const q = query(
          collection(db, "charmingCardAnswers"),
          where("answererUid", "==", user.userID)
        );
        const snap = await getDocs(q);

        const ids = snap.docs
          .map((item) => item.data()?.cardId)
          .filter(Boolean);

        const merged = Array.from(
          new Set([...(user?.charmingCardAnsweredIds || []), ...ids])
        );

        if (!mounted) return;
        setAnsweredCardIds(merged);
      } catch (error) {
        console.error("[cards/list] answered load error:", error);
        if (!mounted) return;
        setAnsweredCardIds(user?.charmingCardAnsweredIds || []);
      }
    }

    loadAnsweredIds();

    return () => {
      mounted = false;
    };
  }, [user?.userID, user?.charmingCardAnsweredIds]);

  const isFemale = useMemo(() => isFemaleGender(user?.gender || ""), [user?.gender]);

  useEffect(() => {
    let mounted = true;

    async function loadFemaleReviewData() {
      if (!user?.userID || !isFemale) {
        setFemaleReviewItems([]);
        setFemaleReactionByAnswerId({});
        setFemaleReportedAnswererUids([]);
        return;
      }

      try {
        const myCards = (cards || []).filter((card) => card.creatorUid === user.userID);
        const myCardIds = myCards.map((item) => item.id);

        if (myCardIds.length === 0) {
          if (!mounted) return;
          setFemaleReviewItems([]);
          setFemaleReactionByAnswerId({});
          setFemaleReportedAnswererUids([]);
          return;
        }

        const myCardMap = {};
        myCards.forEach((card) => {
          myCardMap[card.id] = card;
        });

        const answersSnap = await getDocs(
          query(collection(db, "charmingCardAnswers"), orderBy("updatedAt", "desc"))
        );

        const rawAnswers = answersSnap.docs.map(mapAnswerDoc);
        const filteredAnswers = rawAnswers.filter((item) => {
          if (!item?.cardId || !myCardMap[item.cardId]) return false;
          if (!item?.answererUid) return false;
          return true;
        });

        const answerCountByCardId = {};
        filteredAnswers.forEach((item) => {
          answerCountByCardId[item.cardId] = (answerCountByCardId[item.cardId] || 0) + 1;
        });

        const myReactionsSnap = await getDocs(
          query(
            collection(db, "charmingCardAnswerReactions"),
            where("ownerUid", "==", user.userID)
          )
        );

        const nextReactionByAnswerId = {};
        myReactionsSnap.docs.forEach((item) => {
          const data = item.data() || {};
          if (!data?.answerId) return;
          nextReactionByAnswerId[data.answerId] = data.reactionType || "";
        });

        const myReportsSnap = await getDocs(
          query(collection(db, "charmingCardAnswerReports"), where("ownerUid", "==", user.userID))
        );

        const nextReportedAnswererUids = Array.from(
          new Set(
            myReportsSnap.docs
              .map((item) => {
                const data = item.data() || {};
                return data.reportedAnswererUid || data.answererUid || "";
              })
              .filter(Boolean)
          )
        );

        const allReactionsSnap = await getDocs(
          query(collection(db, "charmingCardAnswerReactions"), orderBy("updatedAt", "desc"))
        );

        const likeCountByCardId = {};
        allReactionsSnap.docs.forEach((item) => {
          const data = item.data() || {};
          if (data?.reactionType !== "like") return;
          if (!data?.cardId) return;
          likeCountByCardId[data.cardId] = (likeCountByCardId[data.cardId] || 0) + 1;
        });

        const answererIds = Array.from(
          new Set(filteredAnswers.map((item) => item.answererUid).filter(Boolean))
        );

        const answererDocs = await Promise.all(
          answererIds.map(async (uid) => {
            const userSnap = await getDoc(doc(db, "users", uid));
            if (!userSnap.exists()) return null;
            const data = userSnap.data() || {};

            return {
              uid,
              ...data,
              styleTest: serializeStyleTest(data.styleTest || {}),
            };
          })
        );

        const answererMap = {};
        answererDocs.forEach((item) => {
          if (!item?.uid) return;
          answererMap[item.uid] = item;
        });

        const nextItems = filteredAnswers
          .map((answer) => {
            const card = myCardMap[answer.cardId];
            const answerer = answererMap[answer.answererUid] || null;

            if (!card || !answerer) return null;
            if (isAdminMatchExposureBlocked(answerer)) return null;
            if (isBlockedTargetUser(user, answerer)) return null;

            return {
              id: answer.id,
              card,
              answer,
              answerer,
              stats: {
                viewCount: card.views || 0,
                answerCount: answerCountByCardId[card.id] || 0,
                likeCount:
                  typeof likeCountByCardId[card.id] === "number"
                    ? likeCountByCardId[card.id]
                    : card.interestedCount || 0,
              },
            };
          })
          .filter(Boolean);

        if (!mounted) return;
        setFemaleReviewItems(nextItems);
        setFemaleReactionByAnswerId(nextReactionByAnswerId);
        setFemaleReportedAnswererUids(nextReportedAnswererUids);
      } catch (error) {
        console.error("[cards/list] female review load error:", error);
        if (!mounted) return;
        setFemaleReviewItems([]);
        setFemaleReactionByAnswerId({});
        setFemaleReportedAnswererUids([]);
      }
    }

    loadFemaleReviewData();

    return () => {
      mounted = false;
    };
  }, [cards, isFemale, user?.userID]);

  const showNavbar = !!user?.userID;

  return (
    <>
      <Head>
        <title>차밍카드 리스트 | 차밍수프</title>
        <meta
          name="description"
          content="차밍카드를 둘러보고 답변하거나 흐름을 살펴보세요."
        />
      </Head>

      {loading || cardsLoading ? (
        <LoadingPage />
      ) : (
        <main className="min-h-screen bg-white md:bg-[#f6f7fb]">
          <div className="relative min-h-screen overflow-hidden">
            <div className="pointer-events-none absolute inset-0 hidden md:block">
              <div className="absolute left-1/2 top-[-80px] h-[260px] w-[260px] -translate-x-[260px] rounded-full bg-pink-200/35 blur-3xl" />
              <div className="absolute left-1/2 top-[120px] h-[280px] w-[280px] translate-x-[120px] rounded-full bg-violet-200/30 blur-3xl" />
              <div className="absolute left-1/2 bottom-[40px] h-[240px] w-[240px] -translate-x-[120px] rounded-full bg-rose-100/40 blur-3xl" />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-6">
              <section
                id="app-surface"
                className="relative flex h-[100dvh] w-full max-w-[390px] flex-col overflow-hidden bg-slate-50 md:h-[760px] md:max-w-[430px] md:rounded-[24px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]"
              >
                <div className="min-h-0 flex-1">
                  <CardListContainer
                    user={user}
                    cards={cards}
                    answeredCardIds={answeredCardIds}
                    showPendingForDev={SHOW_PENDING_FOR_DEV}
                    femaleReviewItems={femaleReviewItems}
                    femaleReactionByAnswerId={femaleReactionByAnswerId}
                    femaleReportedAnswererUids={femaleReportedAnswererUids}
                  />
                </div>

                {showNavbar ? (
                  <div className="shrink-0">
                    <BottomNavbar contained />
                  </div>
                ) : null}

                <ProfileCompletePromptModal
                  user={user}
                  open={profilePromptOpen}
                  onClose={closeProfilePrompt}
                  onMoveProfile={() => {
                    closeProfilePrompt();
                    router.push("/profile?tab=basic");
                  }}
                />
              </section>
            </div>
          </div>
        </main>
      )}
    </>
  );
}