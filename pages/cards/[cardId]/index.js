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
import { FiArrowLeft } from "react-icons/fi";

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
import { adaptLegacyProfileDoc } from "lib/profileLegacyAdapter";

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
    date_pending: docData.date_pending ?? false,

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
      typeof data.selectedOptionIndex === "number"
        ? data.selectedOptionIndex
        : typeof data.selectedIndex === "number"
          ? data.selectedIndex
          : null,
    selectedOptionIndexes: Array.isArray(data.selectedOptionIndexes)
      ? data.selectedOptionIndexes
      : Array.isArray(data.selectedIndexes)
        ? data.selectedIndexes
        : typeof data.selectedOptionIndex === "number"
          ? [data.selectedOptionIndex]
          : typeof data.selectedIndex === "number"
            ? [data.selectedIndex]
            : [],
    selectedOptionText: data.selectedOptionText || data.selectedText || "",
    questionType: data.questionType || "",
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

function isFemaleGender(gender = "") {
  return (
    gender === "female" ||
    gender === "여성" ||
    gender === "woman" ||
    gender === "F"
  );
}

function isMaleGender(gender = "") {
  return (
    gender === "male" ||
    gender === "남성" ||
    gender === "man" ||
    gender === "M"
  );
}

function MyAnswerReadOnlyPage({ card, myAnswer }) {
  const isChoice = card?.questionType === "choice";

  const selectedIndexes = Array.isArray(myAnswer?.selectedOptionIndexes)
    ? myAnswer.selectedOptionIndexes
    : Array.isArray(myAnswer?.selectedIndexes)
      ? myAnswer.selectedIndexes
      : typeof myAnswer?.selectedOptionIndex === "number"
        ? [myAnswer.selectedOptionIndex]
        : typeof myAnswer?.selectedIndex === "number"
          ? [myAnswer.selectedIndex]
          : [];

  const selectedOptionText =
    myAnswer?.selectedOptionText ||
    selectedIndexes
      .map((index) => card?.options?.[index] || "")
      .filter(Boolean)
      .join(", ");

  const answerText = !isChoice ? myAnswer?.answerText || "" : "";

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50">
      <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-4">
        <div className="text-[20px] font-extrabold tracking-[-0.03em] text-zinc-900">
          내가 작성한 답변
        </div>
        <div className="mt-1 text-[13px] leading-5 text-slate-500">
          예전에 작성했던 차밍카드 답변을 다시 확인할 수 있어요.
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
          <div className="text-[12px] font-semibold text-violet-700">
            차밍카드 질문
          </div>

          <div className="mt-2 text-[20px] font-bold leading-8 tracking-[-0.03em] text-slate-900">
            {card?.title || "질문 제목"}
          </div>

          {!!card?.guide && (
            <div className="mt-3 rounded-md bg-slate-50 px-3 py-3 text-[13px] leading-5 text-slate-500">
              {card.guide}
            </div>
          )}

          {isChoice ? (
            <div className="mt-4 rounded-md border border-violet-100 bg-violet-50 px-4 py-4">
              <div className="text-[12px] font-semibold text-violet-700">
                내가 선택한 답변
              </div>

              <div className="mt-3 space-y-2">
                {(Array.isArray(card?.options) ? card.options : []).map((option, index) => {
                  const selected = selectedIndexes.includes(index);

                  return (
                    <div
                      key={`${index}-${option}`}
                      className={[
                        "flex items-center justify-between rounded-md border border-solid px-3 py-3 text-[14px] transition",
                        selected
                          ? "border-violet-300 bg-white text-violet-700"
                          : "border-slate-200 bg-white text-slate-500",
                      ].join(" ")}
                    >
                      <div className="break-keep leading-5">{option}</div>

                      {selected ? (
                        <div className="ml-3 shrink-0 rounded-full bg-violet-600 px-2 py-1 text-[11px] font-semibold text-white">
                          선택함
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {!!selectedOptionText && (
                <div className="mt-4 rounded-md px-3 py-3 text-[13px] leading-5 text-violet-600 bg-yellow-100 shadow">
                  <span className="font-semibold text-slate-800">선택 결과:</span>{" "}
                  {selectedOptionText}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-md border border-violet-100 bg-violet-50 px-4 py-4">
              <div className="text-[12px] font-semibold text-violet-700">
                내가 작성한 답변
              </div>
              <div className="mt-2 whitespace-pre-line break-keep text-[15px] leading-7 text-slate-700">
                {answerText || "답변 내용이 없어요."}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CardReviewIndexPage() {
  const router = useRouter();
  const { cardId, answerId, from, mode } = router.query;
  const dispatch = useDispatch();
  const auth = getAuth();

  const { user, loading } = useSelector((state) => state.user);

  const [pageLoading, setPageLoading] = useState(true);
  const [cardsById, setCardsById] = useState({});
  const [answers, setAnswers] = useState([]);
  const [answererMap, setAnswererMap] = useState({});
  const [reactedAnswerIds, setReactedAnswerIds] = useState([]);

  const [myModeCard, setMyModeCard] = useState(null);
  const [myAnswer, setMyAnswer] = useState(null);
  const [myModeLoading, setMyModeLoading] = useState(false);

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

  const isFemale = useMemo(() => isFemaleGender(user?.gender || ""), [user?.gender]);
  const isMale = useMemo(() => isMaleGender(user?.gender || ""), [user?.gender]);
  const isMineMode = mode === "mine";

  useEffect(() => {
    let mounted = true;

    async function loadFeed() {
      if (!user?.userID || isMineMode) {
        if (isMineMode && mounted) setPageLoading(false);
        return;
      }

      try {
        setPageLoading(true);

        const cardsSnap = await getDocs(
          query(collection(db, "charmingCards"), orderBy("updatedAt", "desc"))
        );

        const rawCards = cardsSnap.docs.map(mapCardDoc);

        const creatorIds = Array.from(
          new Set(rawCards.map((item) => item.creatorUid).filter(Boolean))
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

        const visibleCards = rawCards.filter((card) => {
          const creator = creatorMap[card.creatorUid];
          if (!creator) return false;
          if (isAdminMatchExposureBlocked(creator)) return false;
          return !isBlockedTargetUser(user, creator);
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
            const adapted = adaptLegacyProfileDoc(data, { uid }, uid);

            return {
              uid,
              ...adapted,
              ...data,
              styleTest: serializeStyleTest(data.styleTest || {}),
              residence: adapted.residence,
              workArea: adapted.workArea,
              address_sido: adapted.address_sido,
              address_sigugun: adapted.address_sigugun,
              company_location_sido: adapted.company_location_sido,
              company_location_sigugun: adapted.company_location_sigugun,
              mbti: adapted.mbti || data.mbti || "",
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
  }, [user?.userID, user, isMineMode]);

  useEffect(() => {
    let mounted = true;

    async function loadMyMode() {
      if (!user?.userID || !isMineMode || !isMale || !cardId) {
        setMyModeCard(null);
        setMyAnswer(null);
        return;
      }

      try {
        setMyModeLoading(true);

        const cardSnap = await getDoc(doc(db, "charmingCards", String(cardId)));

        if (!cardSnap.exists()) {
          if (!mounted) return;
          setMyModeCard(null);
          setMyAnswer(null);
          return;
        }

        const card = mapCardDoc(cardSnap);

        const answerSnap = await getDocs(
          query(
            collection(db, "charmingCardAnswers"),
            where("cardId", "==", String(cardId)),
            where("answererUid", "==", user.userID)
          )
        );

        if (!mounted) return;

        setMyModeCard(card);

        if (answerSnap.empty) {
          setMyAnswer(null);
          return;
        }

        const myAnswerDoc = answerSnap.docs[0];
        setMyAnswer(mapAnswerDoc(myAnswerDoc));
      } catch (error) {
        console.error("[cards/[cardId]] load my mode error:", error);
        if (!mounted) return;
        setMyModeCard(null);
        setMyAnswer(null);
      } finally {
        if (mounted) setMyModeLoading(false);
      }
    }

    loadMyMode();

    return () => {
      mounted = false;
    };
  }, [user?.userID, isMineMode, isMale, cardId]);

  if (loading || pageLoading || myModeLoading) {
    return <LoadingPage />;
  }

  if (isMineMode && isMale) {
    return (
      <>
        <Head>
          <title>내 차밍카드 답변 보기 | 차밍수프</title>
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
                className="relative flex h-[100dvh] max-h-[100dvh] w-full max-w-[420px] flex-col overflow-hidden bg-slate-50 md:h-[760px] md:max-h-[760px] md:max-w-[430px] md:rounded-[24px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]"
              >
                <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
                  <button
                    type="button"
                    onClick={() => router.push("/cards/list")}
                    className="inline-flex items-center gap-2 rounded-md px-1 py-2 text-[14px] font-medium text-slate-600 hover:bg-slate-100"
                    style={{ cursor: "pointer" }}
                  >
                    <FiArrowLeft className="text-[16px]" />
                    리스트로 돌아가기
                  </button>
                </div>

                {myModeCard && myAnswer ? (
                  <MyAnswerReadOnlyPage card={myModeCard} myAnswer={myAnswer} />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center">
                    <div className="rounded-md border border-slate-200 bg-white px-5 py-8 shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
                      <div className="text-[18px] font-bold text-slate-900">
                        아직 내 답변을 찾지 못했어요
                      </div>
                      <div className="mt-2 text-[14px] leading-6 text-slate-500">
                        답변 데이터가 없거나 카드 정보가 맞지 않을 수 있어요.
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push("/cards/list")}
                        className="mt-4 inline-flex h-[44px] items-center justify-center rounded-md bg-violet-600 px-4 text-[14px] font-semibold text-white hover:bg-violet-700"
                        style={{ cursor: "pointer" }}
                      >
                        카드 리스트로 이동
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>
      </>
    );
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
              className="relative flex h-[100dvh] max-h-[100dvh] w-full max-w-[420px] flex-col overflow-hidden bg-slate-50 md:h-[760px] md:max-h-[760px] md:max-w-[430px] md:rounded-[24px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]"
            >
              <CardAnswerReviewPage
                initialCardId={typeof cardId === "string" ? cardId : ""}
                initialAnswerId={typeof answerId === "string" ? answerId : ""}
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