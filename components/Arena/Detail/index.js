import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
  collection,
  increment,
  arrayUnion,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
} from "firebase/firestore";
import { useRouter } from "next/router";
import {
  PiMagnifyingGlass,
  PiSparkleDuotone,
  PiHeartDuotone,
  PiXBold,
} from "react-icons/pi";

import { db, sendLms } from "firebaseConfig";
import ArenaDetailHeader from "./ArenaDetailHeader";
import ArenaPhotoCarousel from "./ArenaPhotoCarousel";
import ArenaProfileSummary from "./ArenaProfileSummary";
import ArenaBasicInfoList from "./ArenaBasicInfoList";
import ArenaActionBar from "./ArenaActionBar";
import ArenaValueModal from "./ArenaValueModal";
import ArenaStyleModal from "./ArenaStyleModal";
import ArenaReportModal from "./ArenaReportModal";
import ArenaCharmingCardModal from "./ArenaCharmingCardModal";
import ArenaConfirmModal from "./ArenaConfirmModal";
import {
  getPhotoList,
  getRegisteredPhotoCount,
  getProfileSummary,
  isIdentityVerified,
  isCompanyVerified,
} from "./arenaDetailUtils";
import { getUserDocId } from "lib/arena";

function getSpoonState(user = {}) {
  const total = Math.max(Number(user?.spoon || 0), 0);
  const free = Math.max(Number(user?.spoon_free || 0), 0);
  const paid = Math.max(
    Number.isFinite(Number(user?.spoon_paid))
      ? Number(user?.spoon_paid || 0)
      : Math.max(total - free, 0),
    0
  );

  return { total, free, paid };
}


const LIKE_COST = 8;

export default function ArenaDetailScreen({
  viewer,
  targetUser,
  badgeInfo,
  offer,
  loading,
  isLoggedIn,
  valueMatchPercent,
  onRequireAuth,
}) {
  const router = useRouter();

  const [leaving, setLeaving] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const [valueModalOpen, setValueModalOpen] = useState(false);
  const [styleModalOpen, setStyleModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [charmingCardModalOpen, setCharmingCardModalOpen] = useState(false);

  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [charmingCardLoading, setCharmingCardLoading] = useState(false);
  const [charmingCardItems, setCharmingCardItems] = useState([]);

  const [likeConfirmOpen, setLikeConfirmOpen] = useState(false);
  const [likeDoneOpen, setLikeDoneOpen] = useState(false);
  const [passConfirmOpen, setPassConfirmOpen] = useState(false);
  const [passDoneOpen, setPassDoneOpen] = useState(false);
  const [needSpoonOpen, setNeedSpoonOpen] = useState(false);

  const [actedState, setActedState] = useState("");

  const [latestSpoon, setLatestSpoon] = useState(Number(viewer?.spoon || 0));
  const [latestSpoonLoading, setLatestSpoonLoading] = useState(false);

  const summary = useMemo(() => getProfileSummary(targetUser || {}), [targetUser]);
  const photoList = useMemo(() => getPhotoList(targetUser || {}), [targetUser]);
  const viewerPhotoCount = useMemo(
    () => getRegisteredPhotoCount(viewer || {}),
    [viewer]
  );

  const visiblePhotoCount = useMemo(() => {
    if (!photoList.length) return 0;
    return Math.max(1, Math.min(photoList.length, viewerPhotoCount || 1));
  }, [photoList, viewerPhotoCount]);

  useEffect(() => {
    if (photoIndex > Math.max(0, visiblePhotoCount - 1)) {
      setPhotoIndex(0);
    }
  }, [photoIndex, visiblePhotoCount]);

  useEffect(() => {
    setLatestSpoon(Number(viewer?.spoon || 0));
  }, [viewer?.spoon]);

  useEffect(() => {
    let mounted = true;

    async function checkActedState() {
      try {
        const myUid = getUserDocId(viewer);
        const targetUid = getUserDocId(targetUser);

        if (!myUid || !targetUid) {
          if (mounted) setActedState("");
          return;
        }

        const likeSnap = await getDoc(
          doc(db, "arenaInterests", `${myUid}_${targetUid}`)
        );
        if (likeSnap.exists()) {
          if (mounted) setActedState("liked");
          return;
        }

        const rejectSnap = await getDoc(
          doc(db, "arenaRejects", `${myUid}_${targetUid}`)
        );
        if (rejectSnap.exists()) {
          if (mounted) setActedState("passed");
          return;
        }

        if (mounted) setActedState("");
      } catch (error) {
        console.error("[arena/detail] actedState check error:", error);
        if (mounted) setActedState("");
      }
    }

    checkActedState();

    return () => {
      mounted = false;
    };
  }, [viewer, targetUser]);

  useEffect(() => {
    let mounted = true;

    async function loadLatestSpoon() {
      try {
        if (!likeConfirmOpen) return;

        const myUid = getUserDocId(viewer);
        if (!myUid) {
          if (mounted) setLatestSpoon(0);
          return;
        }

        setLatestSpoonLoading(true);

        const meSnap = await getDoc(doc(db, "users", myUid));
        if (!mounted) return;

        if (meSnap.exists()) {
          const meData = meSnap.data() || {};
          setLatestSpoon(Number(meData?.spoon || 0));
        } else {
          setLatestSpoon(0);
        }
      } catch (error) {
        console.error("[arena/detail] latest spoon load error:", error);
        if (mounted) setLatestSpoon(Number(viewer?.spoon || 0));
      } finally {
        if (mounted) setLatestSpoonLoading(false);
      }
    }

    loadLatestSpoon();

    return () => {
      mounted = false;
    };
  }, [likeConfirmOpen, viewer]);

  const handleBack = () => {
    setLeaving(true);
    setTimeout(() => {
      router.back();
    }, 180);
  };

  const openLikeFlow = () => {
    if (!isLoggedIn) {
      onRequireAuth();
      return;
    }
    if (actedState) return;
    setLikeConfirmOpen(true);
  };

  const openPassFlow = () => {
    if (!isLoggedIn) {
      onRequireAuth();
      return;
    }
    if (actedState) return;
    setPassConfirmOpen(true);
  };

  const handleLater = () => {
    router.push("/arena");
  };

  const handleLikeConfirm = async () => {
    try {
      const myUid = getUserDocId(viewer);
      const targetUid = getUserDocId(targetUser);

      if (!myUid || !targetUid) return;

      const meSnap = await getDoc(doc(db, "users", myUid));
      const meData = meSnap.exists() ? meSnap.data() || {} : {};
      const spoonState = getSpoonState(meData);
      const currentSpoon = spoonState.total;

      setLatestSpoon(currentSpoon);

      if (currentSpoon < LIKE_COST) {
        setLikeConfirmOpen(false);
        setNeedSpoonOpen(true);
        return;
      }

      const deductFree = Math.min(spoonState.free, LIKE_COST);
      const deductPaid = LIKE_COST - deductFree;

      await updateDoc(doc(db, "users", myUid), {
        spoon: increment(-LIKE_COST),
        spoon_free: increment(-deductFree),
        spoon_paid: increment(-deductPaid),
      });

      await addDoc(collection(db, "spoonHistories"), {
        uid: myUid,
        type: "arena_like_send",
        amount: -LIKE_COST,
        balanceBefore: spoonState.total,
        balanceAfter: spoonState.total - LIKE_COST,
        spoonFreeBefore: spoonState.free,
        spoonFreeAfter: spoonState.free - deductFree,
        spoonPaidBefore: spoonState.paid,
        spoonPaidAfter: spoonState.paid - deductPaid,
        deductedFree: deductFree,
        deductedPaid: deductPaid,
        targetUid,
        createdAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, "arenaInterests", `${myUid}_${targetUid}`),
        {
          femaleUid: myUid,
          femaleNickname: viewer?.nickname || viewer?.username || "",
          femalePhone: viewer?.phonenumber || "",
          maleUid: targetUid,
          maleNickname: targetUser?.nickname || targetUser?.username || "",
          malePhone: targetUser?.phonenumber || "",
          status: "sent",
          spoonCost: LIKE_COST,
          createdAt: serverTimestamp(),
          expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
          respondedAt: null,
          refundProcessedAt: null,
        },
        { merge: true }
      );

      await addDoc(collection(db, "notifications"), {
        type: "arena_like_arrived",
        targetUid,
        actorUid: myUid,
        actorNickname: viewer?.nickname || viewer?.username || "",
        isRead: false,
        createdAt: serverTimestamp(),
      });

      if (targetUser?.phonenumber) {
        const msg =
          "[차밍수프]\n" +
          "새로운 호감 표시가 도착했습니다.\n" +
          // "지금 매칭아레나에서 확인해보세요.\n" +
          "https://charmingsoup.com/arena";

        await sendLms(targetUser.phonenumber, msg, "차밍수프 호감 도착", {
          forceLms: true,
        });
      }

      setLatestSpoon(currentSpoon - LIKE_COST);
      setLikeConfirmOpen(false);
      setActedState("liked");
      setLikeDoneOpen(true);
    } catch (error) {
      console.error("[arena/detail] like error:", error);
      alert("호감 보내기 중 문제가 발생했어요.");
    }
  };

  const handlePassConfirm = async () => {
    try {
      const myUid = getUserDocId(viewer);
      const targetUid = getUserDocId(targetUser);

      if (!myUid || !targetUid) return;

      await setDoc(
        doc(db, "arenaRejects", `${myUid}_${targetUid}`),
        {
          femaleUid: myUid,
          maleUid: targetUid,
          status: "passed",
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      await updateDoc(doc(db, "users", myUid), {
        arenaBlockedMaleUids: arrayUnion(targetUid),
      });

      await setDoc(
        doc(db, "arenaOffers", myUid),
        {
          femaleUid: myUid,
          maleUid: "",
          status: "passed",
          passedMaleUid: targetUid,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setPassConfirmOpen(false);
      setActedState("passed");
      setPassDoneOpen(true);
    } catch (error) {
      console.error("[arena/detail] pass error:", error);
      alert("패스 처리 중 문제가 발생했어요.");
    }
  };

  const handleOpenReport = () => {
    if (!isLoggedIn) {
      onRequireAuth();
      return;
    }
    setReportModalOpen(true);
  };

  const handleSubmitReport = async ({
    reasonKey,
    reasonTitle,
    reasonDescription,
    details,
  }) => {
    try {
      setReportSubmitting(true);

      const reporterUid = getUserDocId(viewer);
      const targetUid = getUserDocId(targetUser);

      await addDoc(collection(db, "arenaReports"), {
        reporterUid: reporterUid || "",
        reporterName: viewer?.nickname || viewer?.username || "",
        targetUid: targetUid || "",
        targetName: targetUser?.nickname || targetUser?.username || "",
        reasonKey,
        reasonTitle,
        reasonDescription,
        details: details || "",
        status: "submitted",
        createdAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, "users", targetUid),
        {
          reportCount: increment(1),
          lastReportedAt: serverTimestamp(),
          reported: true,
          reportReasonKeys: arrayUnion(reasonKey),
          reportReasonTitles: arrayUnion(reasonTitle),
        },
        { merge: true }
      );

      setReportModalOpen(false);
      alert("신고가 접수되었어요.");
    } catch (error) {
      console.error("[arena/detail] report error:", error);
      alert("신고 접수 중 문제가 발생했어요.");
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleOpenCharmingCards = async () => {
    try {
      if (!targetUser?.userID) return;

      setCharmingCardLoading(true);
      setCharmingCardModalOpen(true);

      const answersQ = query(
        collection(db, "charmingCardAnswers"),
        where("answererUid", "==", targetUser.userID),
        orderBy("createdAt", "desc")
      );

      const answersSnap = await getDocs(answersQ);
      const answers = answersSnap.docs.map((snap) => ({
        id: snap.id,
        ...snap.data(),
      }));

      const cardIds = [
        ...new Set(answers.map((item) => item.cardId).filter(Boolean)),
      ];
      const cardMap = {};

      await Promise.all(
        cardIds.map(async (cardId) => {
          const cardSnap = await getDoc(doc(db, "charmingCards", cardId));
          if (cardSnap.exists()) {
            cardMap[cardId] = {
              id: cardSnap.id,
              ...cardSnap.data(),
            };
          }
        })
      );

      const merged = answers
        .map((answer) => {
          const card = cardMap[answer.cardId];
          if (!card) return null;

          return {
            id: answer.id,
            cardId: answer.cardId,
            title: card.title || "",
            guide: card.guide || card.content || "",
            subGuide: card.subGuide || "",
            categoryTag: card.categoryTag || card.category || "",
            questionType: card.questionType || "text",
            options: Array.isArray(card.options) ? card.options : [],
            answerText: answer.answerText || "",
            selectedOptionIndex:
              typeof answer.selectedOptionIndex === "number"
                ? answer.selectedOptionIndex
                : null,
            selectedOptionText: answer.selectedOptionText || "",
            viewCount: card.viewCount || 0,
            answerCount: card.answerCount || 0,
            interestedCount: card.interestedCount || 0,
            createdAt: answer.createdAt || null,
          };
        })
        .filter(Boolean);

      setCharmingCardItems(merged);
    } catch (error) {
      console.error("[arena/detail] charming cards load error:", error);
      setCharmingCardItems([]);
    } finally {
      setCharmingCardLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white md:bg-[#f6f7fb]">
      <div className="relative min-h-screen overflow-hidden">
        <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
          <AnimatePresence mode="wait">
            <motion.section
              key="arena-detail-screen"
              initial={{ x: 48, opacity: 0 }}
              animate={{ x: leaving ? -36 : 0, opacity: leaving ? 0 : 1 }}
              exit={{ x: -36, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative flex h-[100dvh] w-full max-w-[390px] flex-col overflow-hidden bg-slate-50 md:h-[760px] md:max-w-[430px] md:rounded-[18px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]"
            >
              <ArenaDetailHeader onBack={handleBack} />

              <div className="min-h-0 flex-1 overflow-y-auto bg-[#fbfbfd] px-4 pb-5 pt-4">
                {loading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-[14px] font-medium text-slate-500">
                      불러오는 중...
                    </div>
                  </div>
                ) : !targetUser ? (
                  <div className="flex h-full items-center justify-center px-5 text-center text-[14px] text-slate-500">
                    소개 정보를 찾을 수 없어요.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ArenaPhotoCarousel
                      photoList={photoList}
                      visiblePhotoCount={visiblePhotoCount}
                      photoIndex={photoIndex}
                      onChangeIndex={setPhotoIndex}
                      isIdentityVerified={isIdentityVerified(targetUser)}
                      isCompanyVerified={isCompanyVerified(targetUser)}
                      badgeInfo={badgeInfo}
                      expiresAt={offer?.expiresAt}
                    />

                        <ArenaProfileSummary
                          summary={summary}
                          valueMatchPercent={valueMatchPercent}
                          onReport={handleOpenReport}
                          expiresAt={offer?.expiresAt}
                          badgeInfo={badgeInfo}
                        />

                    <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <button
                        type="button"
                        onClick={() => setValueModalOpen(true)}
                        className="flex h-[42px] bg-violet-400 hover:bg-violet-500 items-center justify-center gap-2 rounded-md border border-slate-200 text-[14px] font-bold text-white shadow-[0_6px_18px_rgba(15,23,42,0.04)]"
                        style={{ cursor: "pointer" }}
                      >
                        가치관
                        <PiMagnifyingGlass className="text-[16px]" />
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenCharmingCards}
                        className="flex h-[42px] bg-violet-400 hover:bg-violet-500 items-center justify-center gap-2 rounded-md border border-slate-200 text-[14px] font-bold text-white shadow-[0_6px_18px_rgba(15,23,42,0.04)]"
                        style={{ cursor: "pointer" }}
                      >
                        차밍카드
                        <PiMagnifyingGlass className="text-[16px]" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setStyleModalOpen(true)}
                        className="flex h-[42px] bg-violet-400 hover:bg-violet-500 w-[46px] items-center justify-center rounded-md border border-slate-200 text-white shadow-[0_6px_18px_rgba(15,23,42,0.04)]"
                        style={{ cursor: "pointer" }}
                        title="스타일진단"
                      >
                        <PiSparkleDuotone className="text-[18px]" />
                      </button>
                    </div>

                    <ArenaBasicInfoList summary={summary} />
                  </div>
                )}
              </div>

              {targetUser && !actedState ? (
                <ArenaActionBar
                  onNextLater={handleLater}
                  onReject={openPassFlow}
                  onLike={openLikeFlow}
                />
              ) : null}

              <ArenaValueModal
                open={valueModalOpen}
                onClose={() => setValueModalOpen(false)}
                user={targetUser}
              />

              <ArenaStyleModal
                open={styleModalOpen}
                onClose={() => setStyleModalOpen(false)}
                user={targetUser}
              />

              <ArenaReportModal
                open={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                onSubmit={handleSubmitReport}
                submitting={reportSubmitting}
                targetName={summary?.name || ""}
              />

              <ArenaCharmingCardModal
                open={charmingCardModalOpen}
                onClose={() => setCharmingCardModalOpen(false)}
                items={charmingCardItems}
                loading={charmingCardLoading}
              />

              <ArenaConfirmModal
                open={likeConfirmOpen}
                onClose={() => setLikeConfirmOpen(false)}
                icon={PiHeartDuotone}
                title="호감표시"
                description={`${summary?.name || "회원"}님에게\n호감표시를 하시겠습니까?\n\n호감을 보낼 경우,\n스푼이 8개 차감됩니다.\n(상대가 내 호감에 호응할 경우 연락처가 교환됩니다.)\n\n내 보유스푼 수 : ${latestSpoonLoading ? "확인 중..." : `${Number(latestSpoon || 0)}개`
                  }`}
                confirmText="호감 보내기"
                cancelText="취소"
                confirmClassName="bg-[#ff4b3e] text-white"
                onConfirm={handleLikeConfirm}
              />

              <ArenaConfirmModal
                open={likeDoneOpen}
                onClose={() => {
                  setLikeDoneOpen(false);
                  router.push("/arena");
                }}
                title="호감표시를 전송했습니다."
                description={
                  "상대방의 응답을 기다립니다.\n3일 내 응답이 없거나 거절할 경우,\n스푼은 반환됩니다."
                }
                confirmText="확인"
                confirmClassName="bg-[#ff4b3e] text-white"
                onConfirm={() => {
                  setLikeDoneOpen(false);
                  router.push("/arena");
                }}
                singleButton
              />

              <ArenaConfirmModal
                open={passConfirmOpen}
                onClose={() => setPassConfirmOpen(false)}
                icon={PiXBold}
                title="패스하기"
                description={`${summary?.name || "회원"}님을\n패스하시겠습니까?\n\n패스를 하신다면\n다시는 상대방의 프로필을\n볼 수 없습니다.`}
                confirmText="패스하기"
                cancelText="취소"
                confirmClassName="bg-zinc-600 text-white"
                onConfirm={handlePassConfirm}
              />

              <ArenaConfirmModal
                open={passDoneOpen}
                onClose={() => {
                  setPassDoneOpen(false);
                  router.push("/arena");
                }}
                title="상대방의 호응에 미응답하였습니다."
                description={"미응답 시, 프로필 노출에 제한이 갈 수 있습니다."}
                confirmText="확인"
                confirmClassName="bg-zinc-600 text-white"
                onConfirm={() => {
                  setPassDoneOpen(false);
                  router.push("/arena");
                }}
                singleButton
              />

              <ArenaConfirmModal
                open={needSpoonOpen}
                onClose={() => setNeedSpoonOpen(false)}
                title="스푼 8개가 필요합니다."
                description={"호감 표시를 보내려면 스푼 8개가 필요해요."}
                confirmText="바로 구매하기"
                cancelText="다음에 구매하기"
                confirmClassName="bg-violet-600 text-white"
                onConfirm={() => {
                  setNeedSpoonOpen(false);
                  router.push("/store");
                }}
              />
            </motion.section>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}