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
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import LoadingPage from "components/Common/Loading";
import CardAnswerTextPage from "components/Cards/Answer/CardAnswerTextPage";
import CardAnswerChoicePage from "components/Cards/Answer/CardAnswerChoicePage";

import { db } from "firebaseConfig";
import {
  setUser,
  userLoadingStart,
  userLoadingEnd,
  userLoadingEndwithNoone,
} from "slices/user";
import { isBlockedTargetUser } from "lib/userBlockRules";

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
    mbti: docData.mbti || "",
    job: docData.job || "",
    education: docData.education || "",
    residence: docData.residence || {},
    workArea: docData.workArea || {},

    address_sido: docData.address_sido || "",
    address_sigugun: docData.address_sigugun || "",
    company_location_sido: docData.company_location_sido || "",
    company_location_sigugun: docData.company_location_sigugun || "",

    profilePhotos: Array.isArray(docData.profilePhotos) ? docData.profilePhotos : [],
    charmingCardPhotoPublic: !!docData.charmingCardPhotoPublic,
    charmingCardAnsweredIds: Array.isArray(docData.charmingCardAnsweredIds)
      ? docData.charmingCardAnsweredIds
      : [],
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

function categoryLabel(category) {
  const map = {
    value: "가치관",
    dating: "연애상황",
    care: "배려/공감",
    sense: "센스",
    life: "생활습관",
    marriage: "결혼관",
  };
  return map[category] || "카테고리";
}

export default function CardAnswerPage() {
  const router = useRouter();
  const { cardId } = router.query;
  const dispatch = useDispatch();
  const auth = getAuth();

  const { user, loading } = useSelector((state) => state.user);

  const [pageLoading, setPageLoading] = useState(true);
  const [card, setCard] = useState(null);
  const [cardOrder, setCardOrder] = useState(null);
  const [alreadyAnswered, setAlreadyAnswered] = useState(false);
  const [previousAnswer, setPreviousAnswer] = useState(null);
  const [blockedCard, setBlockedCard] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      dispatch(userLoadingStart());

      if (!firebaseUser) {
        dispatch(userLoadingEndwithNoone());
        router.replace(`/login?redirect=${encodeURIComponent(router.asPath || "/cards/list")}`);
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
        console.error("[cards/[cardId]/answer] user load error:", e);
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

    async function loadCard() {
      if (!cardId || !user?.userID) return;

      try {
        setPageLoading(true);

        const cardRef = doc(db, "charmingCards", cardId);
        const cardSnap = await getDoc(cardRef);

        if (!cardSnap.exists()) {
          if (!mounted) return;
          setCard(null);
          setPageLoading(false);
          return;
        }

        const cardData = mapCardDoc(cardSnap);

        const creatorUid = cardData?.creatorUid || "";
        if (!creatorUid) {
          if (!mounted) return;
          setCard(null);
          setPageLoading(false);
          return;
        }

        const creatorSnap = await getDoc(doc(db, "users", creatorUid));
        if (!creatorSnap.exists()) {
          if (!mounted) return;
          setCard(null);
          setPageLoading(false);
          return;
        }

        const creatorUser = {
          userID: creatorSnap.id,
          ...creatorSnap.data(),
        };

        if (isBlockedTargetUser(user, creatorUser)) {
          router.replace("/cards/list");
          return;
        }

        const answerQuery = query(
          collection(db, "charmingCardAnswers"),
          where("cardId", "==", cardId),
          where("answererUid", "==", user.userID)
        );
        const answerSnap = await getDocs(answerQuery);
        const answerDoc = answerSnap.empty
          ? null
          : {
            id: answerSnap.docs[0].id,
            ...(answerSnap.docs[0].data() || {}),
          };

        const orderQuery = query(collection(db, "charmingCards"), orderBy("createdAt", "asc"));
        const orderSnap = await getDocs(orderQuery);
        const orderedIds = orderSnap.docs.map((item) => item.id);
        const foundIndex = orderedIds.findIndex((id) => id === cardId);
        const nextOrder = foundIndex >= 0 ? foundIndex + 1 : null;

        if (!mounted) return;
        setCard(cardData);
        setAlreadyAnswered(!answerSnap.empty);
        setPreviousAnswer(answerDoc);
        setCardOrder(nextOrder);
      } catch (error) {
        console.error("[cards/[cardId]/answer] load card error:", error);
        if (!mounted) return;
        setCard(null);
      } finally {
        if (mounted) setPageLoading(false);
      }
    }

    loadCard();

    return () => {
      mounted = false;
    };
  }, [cardId, user?.userID]);

  useEffect(() => {
    if (!card?.id) return;

    const sessionKey = `viewed_charming_card_${card.id}`;

    if (typeof window !== "undefined") {
      const alreadyViewed = sessionStorage.getItem(sessionKey);
      if (alreadyViewed) return;
    }

    const increaseView = async () => {
      try {
        await updateDoc(doc(db, "charmingCards", card.id), {
          views: increment(1),
          updatedAt: serverTimestamp(),
        });

        if (typeof window !== "undefined") {
          sessionStorage.setItem(sessionKey, "1");
        }

        setCard((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            views: (prev.views || 0) + 1,
          };
        });
      } catch (error) {
        console.error("[cards/[cardId]/answer] view increment error:", error);
      }
    };

    increaseView();
  }, [card?.id]);

  const isMale = useMemo(() => {
    const gender = user?.gender || "";
    return (
      gender === "male" ||
      gender === "남성" ||
      gender === "man" ||
      gender === "M"
    );
  }, [user?.gender]);

  if (loading || pageLoading) {
    return <LoadingPage />;
  }

  if (blockedCard) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center">
        <div>
          <div className="text-[20px] font-semibold text-slate-800">
            차단한 대상의 카드예요
          </div>
          <button
            type="button"
            onClick={() => router.push("/cards/list")}
            className="mt-4 rounded-md bg-[#7c6cff] px-4 py-3 text-white"
          >
            리스트로 이동
          </button>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center">
        <div>
          <div className="text-[20px] font-semibold text-slate-800">
            카드를 찾을 수 없어요
          </div>
          <button
            type="button"
            onClick={() => router.push("/cards/list")}
            className="mt-4 rounded-md bg-[#7c6cff] px-4 py-3 text-white"
          >
            리스트로 이동
          </button>
        </div>
      </div>
    );
  }

  if (!isMale) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center">
        <div>
          <div className="text-[20px] font-semibold text-slate-800">
            남성 회원 답변용 화면입니다
          </div>
          <button
            type="button"
            onClick={() => router.push("/cards/list")}
            className="mt-4 rounded-md bg-[#7c6cff] px-4 py-3 text-white"
          >
            리스트로 이동
          </button>
        </div>
      </div>
    );
  }

  const sharedProps = {
    card,
    cardOrder,
    categoryLabel: categoryLabel(card.category),
    alreadyAnswered,
    previousAnswer,
    user,
  };

  return (
    <>
      <Head>
        <title>차밍카드 답변하기 | 차밍수프</title>
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
              {card.questionType === "choice" ? (
                <CardAnswerChoicePage {...sharedProps} />
              ) : (
                <CardAnswerTextPage {...sharedProps} />
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}