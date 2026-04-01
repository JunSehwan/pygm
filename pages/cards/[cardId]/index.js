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
import CardAnswerReviewPage from "components/Cards/Review/CardAnswerReviewPage";

import { db } from "firebaseConfig";
import {
  setUser,
  userLoadingStart,
  userLoadingEnd,
  userLoadingEndwithNoone,
} from "slices/user";

import { isBlockedTargetUser } from "lib/userBlockRules";
import { isAdminMatchExposureBlocked } from "lib/arena";

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
    username: docData.username || "",
    nickname: docData.nickname || "",
    email: docData.email || firebaseUser?.email || "",
    birthday: docData.birthday || "",
    gender: docData.gender || "",
    phonenumber: docData.phonenumber || "",
    thumbimage: docData.thumbimage || "",
    date_sleep: docData.date_sleep ?? false,
    withdraw: docData.withdraw ?? false,
    date_profile_finished: docData.date_profile_finished ?? false,
    date_pending: docData.date_pending ?? true,

    maritalStatus: docData.maritalStatus || "",
    job: docData.job || "",
    education: docData.education || "",

    address_sido: docData.address_sido || "",
    address_sigugun: docData.address_sigugun || "",

    profilePhotos: Array.isArray(docData.profilePhotos) ? docData.profilePhotos : [],
    charmingCardPhotoPublic: !!docData.charmingCardPhotoPublic,
    styleTest: serializeStyleTest(docData.styleTest || {}),
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
    views: data.views || 0,
    answerCount: data.answerCount || 0,
    interestedCount: data.interestedCount || 0,
    creatorGender: data.creatorGender || "",
    creatorNickname: data.creatorNickname || "",
    creatorUid: data.creatorUid || "",
    creatorUsername: data.creatorUsername || "",
    visibilityTarget: data.visibilityTarget || "",
    isPublished: !!data.isPublished,
    status: data.status || "",
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

function mapAnswerDoc(docSnap) {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    cardId: data.cardId || "",
    answererUid: data.answererUid || "",
    answererUsername: data.answererUsername || "",
    answererNickname: data.answererNickname || "",
    answererGender: data.answererGender || "",
    answerText: data.answerText || "",
    selectedOptionIndex:
      typeof data.selectedOptionIndex === "number" ? data.selectedOptionIndex : null,
    selectedOptionText: data.selectedOptionText || "",
    questionType: data.questionType || "text",
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

export default function CardReviewIndexPage() {
  const router = useRouter();
  const { cardId } = router.query;
  const dispatch = useDispatch();
  const auth = getAuth();

  const { user, loading } = useSelector((state) => state.user);

  const [pageLoading, setPageLoading] = useState(true);
  const [cardsById, setCardsById] = useState({});
  const [answers, setAnswers] = useState([]);
  const [answererMap, setAnswererMap] = useState({});
  const [reactedAnswerIds, setReactedAnswerIds] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      dispatch(userLoadingStart());

      if (!firebaseUser) {
        dispatch(userLoadingEndwithNoone());
        router.replace(`/login?redirect=${encodeURIComponent(router.asPath || "/cards")}`);
        return;
      }

      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          dispatch(userLoadingEndwithNoone());
          router.replace("/login");
          return;
        }

        const currentUser = buildCurrentUser(firebaseUser, userSnap.data(), userSnap.id);
        dispatch(setUser(currentUser));
        dispatch(userLoadingEnd());
      } catch (e) {
        console.error("[cards/[cardId]] user load error:", e);
        dispatch(userLoadingEndwithNoone());
      }
    });

    return () => unsub();
  }, [auth, dispatch, router]);

  useEffect(() => {
    if (!user?.userID) return;

    const unsubDoc = onSnapshot(doc(db, "users", user.userID), (snap) => {
      if (!snap.exists()) return;

      const docData = snap.data();
      const currentUser = buildCurrentUser(
        { uid: snap.id, email: docData.email },
        docData,
        snap.id
      );
      dispatch(setUser(currentUser));
      dispatch(userLoadingEnd());
    });

    return () => unsubDoc();
  }, [dispatch, user?.userID]);

  useEffect(() => {
    let mounted = true;

    async function loadFeed() {
      if (!user?.userID) return;

      try {
        setPageLoading(true);

        const cardsSnap = await getDocs(
          query(collection(db, "charmingCards"), orderBy("updatedAt", "desc"))
        );

        const rawCards = cardsSnap.docs.map(mapCardDoc);

        const visibleCards = rawCards.filter((card) => {
          return card.visibilityTarget === "male" && card.creatorGender === "female";
        });

        const nextCardsById = {};
        visibleCards.forEach((item) => {
          nextCardsById[item.id] = item;
        });

        const answersSnap = await getDocs(
          query(collection(db, "charmingCardAnswers"), orderBy("updatedAt", "desc"))
        );

        const rawAnswers = answersSnap.docs.map(mapAnswerDoc);

        const filteredAnswers = rawAnswers.filter((answer) => {
          const relatedCard = nextCardsById[answer.cardId];
          if (!relatedCard) return false;
          if (!answer.answererUid) return false;
          return true;
        });

        const reactionsSnap = await getDocs(
          query(
            collection(db, "charmingCardAnswerReactions"),
            where("ownerUid", "==", user.userID)
          )
        );

        const reactedIds = reactionsSnap.docs
          .map((item) => item.data()?.answerId)
          .filter(Boolean);

        const uniqueAnswererIds = Array.from(
          new Set(filteredAnswers.map((item) => item.answererUid).filter(Boolean))
        );

        const userDocs = await Promise.all(
          uniqueAnswererIds.map(async (uid) => {
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

        const nextAnswererMap = {};
        userDocs.forEach((item) => {
          if (!item?.uid) return;
          nextAnswererMap[item.uid] = item;
        });

        const visibleAnswers = filteredAnswers.filter((answer) => {
          const answerer = nextAnswererMap[answer.answererUid];
          if (!answerer) return false;
          if (isAdminMatchExposureBlocked(answerer)) return false;
          return !isBlockedTargetUser(user, answerer);
        });

        if (!mounted) return;
        setCardsById(nextCardsById);
        setAnswers(visibleAnswers);
        setAnswererMap(nextAnswererMap);
        setReactedAnswerIds(reactedIds);
      } catch (error) {
        console.error("[cards/[cardId]] load feed error:", error);
        if (!mounted) return;
        setCardsById({});
        setAnswers([]);
        setAnswererMap({});
        setReactedAnswerIds([]);
      } finally {
        if (mounted) setPageLoading(false);
      }
    }

    loadFeed();

    return () => {
      mounted = false;
    };
  }, [user?.userID, user]);

  const isFemale = useMemo(() => {
    const gender = user?.gender || "";
    return (
      gender === "female" ||
      gender === "여성" ||
      gender === "woman" ||
      gender === "F"
    );
  }, [user?.gender]);

  if (loading || pageLoading) {
    return <LoadingPage />;
  }

  if (!isFemale) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center">
        <div>
          <div className="text-[20px] font-semibold text-slate-800">
            여성 회원 전용 답변 확인 화면입니다
          </div>
          <button
            type="button"
            onClick={() => router.push("/cards")}
            className="mt-4 rounded-md bg-[#7c6cff] px-4 py-3 text-white"
          >
            카드 홈으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>차밍카드 답변 보기 | 차밍수프</title>
      </Head>

      <main className="min-h-screen bg-white md:bg-[#f6f7fb]">
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 hidden md:block">
            <div className="absolute left-1/2 top-[-80px] h-[260px] w-[260px] -translate-x-[260px] rounded-full bg-pink-200/35 blur-3xl" />
            <div className="absolute left-1/2 top-[120px] h-[280px] w-[280px] translate-x-[120px] rounded-full bg-violet-200/30 blur-3xl" />
          </div>

          <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
            <section
              id="app-surface"
              className="relative w-full max-w-[390px] overflow-hidden bg-slate-50 md:max-w-[430px] md:rounded-[24px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]"
            >
              <CardAnswerReviewPage
                initialCardId={typeof cardId === "string" ? cardId : ""}
                ownerUid={user?.userID || ""}
                cardsById={cardsById}
                answers={answers}
                answererMap={answererMap}
                reactedAnswerIds={reactedAnswerIds}
              />
            </section>
          </div>
        </div>
      </main>
    </>
  );
}