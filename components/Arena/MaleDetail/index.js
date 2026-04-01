import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useRouter } from "next/router";
import { PiHeartDuotone, PiSparkleDuotone, PiWarningCircleDuotone } from "react-icons/pi";

import { db, sendLms } from "firebaseConfig";
import ArenaDetailHeader from "components/Arena/Detail/ArenaDetailHeader";
import ArenaProfileSummary from "components/Arena/Detail/ArenaProfileSummary";
import ArenaBasicInfoList from "components/Arena/Detail/ArenaBasicInfoList";
import ArenaValueModal from "components/Arena/Detail/ArenaValueModal";
import ArenaStyleModal from "components/Arena/Detail/ArenaStyleModal";
import ArenaReportModal from "components/Arena/Detail/ArenaReportModal";
import ArenaConfirmModal from "components/Arena/Detail/ArenaConfirmModal";
import MaleDetailPhotoCarousel from "./MaleDetailPhotoCarousel";
import MaleDetailActionBar from "./MaleDetailActionBar";
import {
  getPhotoList,
  getProfileSummary,
  isIdentityVerified,
  isCompanyVerified,
} from "components/Arena/Detail/arenaDetailUtils";
import { PiCheckCircleFill, PiBriefcaseDuotone } from "react-icons/pi";

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

const ACCEPT_COST = 8;

export default function MaleDetailScreen({
  viewer,
  targetUser,
  interest,
  loading,
  onDone,
}) {
  const router = useRouter();

  const [leaving, setLeaving] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const [valueModalOpen, setValueModalOpen] = useState(false);
  const [styleModalOpen, setStyleModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const [reportSubmitting, setReportSubmitting] = useState(false);

  const [acceptConfirmOpen, setAcceptConfirmOpen] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [doneOpen, setDoneOpen] = useState(false);
  const [needSpoonOpen, setNeedSpoonOpen] = useState(false);

  const [doneTitle, setDoneTitle] = useState("");
  const [doneDescription, setDoneDescription] = useState("");

  const [captureGuardOpen, setCaptureGuardOpen] = useState(false);

  const summary = useMemo(() => getProfileSummary(targetUser || {}), [targetUser]);
  const photoList = useMemo(() => getPhotoList(targetUser || {}), [targetUser]);

  useEffect(() => {
    const preventContext = (e) => e.preventDefault();
    const preventDrag = (e) => e.preventDefault();

    const handleKeyDown = (e) => {
      const key = String(e.key || "").toLowerCase();

      if (key === "printscreen") {
        e.preventDefault();
        setCaptureGuardOpen(true);
        setTimeout(() => setCaptureGuardOpen(false), 1200);
      }

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && ["3", "4", "5", "s"].includes(key)) {
        e.preventDefault();
        setCaptureGuardOpen(true);
        setTimeout(() => setCaptureGuardOpen(false), 1200);
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        setCaptureGuardOpen(true);
      } else {
        setTimeout(() => setCaptureGuardOpen(false), 250);
      }
    };

    document.addEventListener("contextmenu", preventContext);
    document.addEventListener("dragstart", preventDrag);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("contextmenu", preventContext);
      document.removeEventListener("dragstart", preventDrag);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const handleBack = () => {
    setLeaving(true);
    setTimeout(() => {
      router.back();
    }, 180);
  };

  const handleSubmitReport = async ({
    reasonKey,
    reasonTitle,
    reasonDescription,
    details,
  }) => {
    try {
      setReportSubmitting(true);

      await addDoc(collection(db, "arenaReports"), {
        reporterUid: viewer?.userID || "",
        reporterName: viewer?.nickname || viewer?.username || "",
        targetUid: targetUser?.userID || "",
        targetName: targetUser?.nickname || targetUser?.username || "",
        reasonKey,
        reasonTitle,
        reasonDescription,
        details: details || "",
        status: "submitted",
        createdAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, "users", targetUser?.userID || ""),
        {
          reportCount: increment(1),
          lastReportedAt: serverTimestamp(),
          reported: true,
        },
        { merge: true }
      );

      setReportModalOpen(false);
      alert("신고가 접수되었어요.");
    } catch (error) {
      console.error("[arena/maleDetail] report error:", error);
      alert("신고 접수 중 문제가 발생했어요.");
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleAccept = async () => {
    try {
      const myUid = viewer?.userID || "";
      const femaleUid = targetUser?.userID || "";
      const interestId = interest?.id || "";

      if (!myUid || !femaleUid || !interestId) return;

      const mySnap = await getDoc(doc(db, "users", myUid));
      const myData = mySnap.exists() ? mySnap.data() || {} : {};
      const spoonState = getSpoonState(myData);
      const currentSpoon = spoonState.total;

      if (currentSpoon < ACCEPT_COST) {
        setAcceptConfirmOpen(false);
        setNeedSpoonOpen(true);
        return;
      }

      const deductFree = Math.min(spoonState.free, ACCEPT_COST);
      const deductPaid = ACCEPT_COST - deductFree;

      await updateDoc(doc(db, "users", myUid), {
        spoon: increment(-ACCEPT_COST),
        spoon_free: increment(-deductFree),
        spoon_paid: increment(-deductPaid),
      });

      await addDoc(collection(db, "spoonHistories"), {
        uid: myUid,
        type: "arena_like_accept",
        amount: -ACCEPT_COST,
        balanceBefore: spoonState.total,
        balanceAfter: spoonState.total - ACCEPT_COST,
        spoonFreeBefore: spoonState.free,
        spoonFreeAfter: spoonState.free - deductFree,
        spoonPaidBefore: spoonState.paid,
        spoonPaidAfter: spoonState.paid - deductPaid,
        deductedFree: deductFree,
        deductedPaid: deductPaid,
        targetUid: femaleUid,
        interestId,
        createdAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, "arenaInterests", interestId),
        {
          status: "accepted",
          respondedAt: serverTimestamp(),
          acceptedAt: serverTimestamp(),
          contactShared: true,
          contactSharedAt: serverTimestamp(),
          maleResponseCost: ACCEPT_COST,
          malePhone: viewer?.phonenumber || "",
          femalePhone: targetUser?.phonenumber || "",
        },
        { merge: true }
      );

      await addDoc(collection(db, "arenaMatches"), {
        interestId,
        femaleUid,
        femaleNickname: targetUser?.nickname || targetUser?.username || "",
        femalePhone: targetUser?.phonenumber || "",
        maleUid: myUid,
        maleNickname: viewer?.nickname || viewer?.username || "",
        malePhone: viewer?.phonenumber || "",
        status: "matched",
        createdAt: serverTimestamp(),
      });

      if (targetUser?.phonenumber) {
        await sendLms(
          targetUser.phonenumber,
          `[차밍수프]\n매칭이 성사됐습니다!!\n상대방 연락처를 확인해보세요.\nhttps://charmingsoup.com/board`,
          "차밍수프 연락처 공유 안내",
          { forceLms: true }
        );
      }

      if (viewer?.phonenumber) {
        await sendLms(
          viewer.phonenumber,
          `[차밍수프]\n매칭이 성사됐습니다!!\n상대방 연락처를 확인해보세요.\nhttps://charmingsoup.com/board`,
          "차밍수프 연락처 공유 안내",
          { forceLms: true }
        );
      }

      setAcceptConfirmOpen(false);
      setDoneTitle("승낙 완료");
      setDoneDescription("호감을 승낙했어요.\n서로 연락처가 공유되었습니다.");
      setDoneOpen(true);
      await onDone?.();
    } catch (error) {
      console.error("[arena/maleDetail] accept error:", error);
      alert("승낙 처리 중 문제가 발생했어요.");
    }
  };

  const handleReject = async () => {
    try {
      const interestId = interest?.id || "";
      if (!interestId) return;

      await setDoc(
        doc(db, "arenaInterests", interestId),
        {
          status: "rejected",
          respondedAt: serverTimestamp(),
          rejectedAt: serverTimestamp(),
          rejectedBy: viewer?.userID || "",
        },
        { merge: true }
      );

      if (targetUser?.phonenumber) {
        await sendLms(
          targetUser.phonenumber,
          `[차밍수프]\n안타깝지만 상대방이 호감표시를 거절했습니다.`,
          "차밍수프 호감 거절 안내",
          { forceLms: true }
        );
      }

      setRejectConfirmOpen(false);
      setDoneTitle("거절 완료");
      setDoneDescription("호감을 거절했어요.\n상대에게 문자 안내가 발송됩니다.");
      setDoneOpen(true);
      await onDone?.();
    } catch (error) {
      console.error("[arena/maleDetail] reject error:", error);
      alert("거절 처리 중 문제가 발생했어요.");
    }
  };

  return (
    <>
      <main className="min-h-screen bg-white md:bg-[#f6f7fb]">
        <div className="relative min-h-screen overflow-hidden">
          <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
            <AnimatePresence mode="wait">
              <motion.section
                key="arena-male-detail-screen"
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
                      {/* <div className="rounded-[14px] border border-violet-100 bg-violet-50 px-4 py-3">
                        <div className="break-keep text-[13px] leading-6 text-slate-600">
                          여성회원이 먼저 호감을 보낸 상태예요.
                          <br />
                          승낙 시 남성도 스푼 8개가 차감되고,
                          <br />
                          서로 연락처가 공유됩니다.
                        </div>
                      </div> */}

                      <MaleDetailPhotoCarousel
                        viewer={viewer}
                        targetUser={targetUser}
                        photoList={photoList}
                        photoIndex={photoIndex}
                        setPhotoIndex={setPhotoIndex}
                      />

                      <ArenaProfileSummary
                        summary={summary}
                        valueMatchPercent={0}
                        onReport={() => setReportModalOpen(true)}
                        expiresAt={interest?.expiresAt}
                        badgeInfo={{}}
                      />

                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <button
                          type="button"
                          onClick={() => setValueModalOpen(true)}
                          className="flex h-[42px] items-center justify-center gap-2 rounded-md border border-slate-200 bg-pink-400 text-[14px] font-bold text-white shadow-[0_6px_18px_rgba(15,23,42,0.04)] hover:bg-pink-500"
                          style={{ cursor: "pointer" }}
                        >
                          가치관 확인
                        </button>

                        <button
                          type="button"
                          onClick={() => setStyleModalOpen(true)}
                          className="flex h-[42px] w-[46px] items-center justify-center rounded-md border border-slate-200 bg-pink-400 text-white shadow-[0_6px_18px_rgba(15,23,42,0.04)] hover:bg-pink-500"
                          style={{ cursor: "pointer" }}
                          title="스타일진단"
                        >
                          <PiSparkleDuotone className="text-[18px]" />
                        </button>
                      </div>

                      {(isIdentityVerified(targetUser) || isCompanyVerified(targetUser)) ? (
                        <div className="rounded-[14px] border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
                          <div className="text-[13px] font-bold text-slate-800">주요 정보</div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {isIdentityVerified(targetUser) ? (
                              <div className="inline-flex h-8 items-center gap-1.5 rounded-full bg-emerald-50 px-3 text-[12px] font-semibold text-emerald-700">
                                <PiCheckCircleFill className="text-[14px]" />
                                본인인증
                              </div>
                            ) : null}

                            {isCompanyVerified(targetUser) ? (
                              <div className="inline-flex h-8 items-center gap-1.5 rounded-full bg-sky-50 px-3 text-[12px] font-semibold text-sky-700">
                                <PiBriefcaseDuotone className="text-[14px]" />
                                재직인증
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : null}

                      <ArenaBasicInfoList summary={summary} />
                    </div>
                  )}
                </div>

                {targetUser ? (
                  <MaleDetailActionBar
                    onReject={() => setRejectConfirmOpen(true)}
                    onAccept={() => setAcceptConfirmOpen(true)}
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
              </motion.section>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <ArenaConfirmModal
        open={acceptConfirmOpen}
        onClose={() => setAcceptConfirmOpen(false)}
        icon={PiHeartDuotone}
        title="호감 승낙"
        description={`${summary?.name || "회원"}님과 연결하시겠습니까?\n\n현재 보유 스푼: ${Number(viewer?.spoon || 0)}개\n\n승낙 시 스푼 8개가 차감되고,\n서로 연락처가 공유됩니다.`}
        confirmText="승낙하기"
        cancelText="닫기"
        onConfirm={handleAccept}
      />

      <ArenaConfirmModal
        open={rejectConfirmOpen}
        onClose={() => setRejectConfirmOpen(false)}
        title="호감 거절"
        description={`거절 시 더이상 호감을 보낸\n상대방을 확인할 수 없습니다.`}
        confirmText="거절하기"
        cancelText="닫기"
        onConfirm={handleReject}
      />

      <ArenaConfirmModal
        open={needSpoonOpen}
        onClose={() => setNeedSpoonOpen(false)}
        title="스푼이 부족해요"
        description="호감을 승낙하려면 스푼 8개가 필요합니다."
        confirmText="스토어로 이동"
        cancelText="닫기"
        onConfirm={() => {
          setNeedSpoonOpen(false);
          router.push("/store");
        }}
      />

      <ArenaConfirmModal
        open={doneOpen}
        onClose={() => {
          setDoneOpen(false);
          router.push("/arena");
        }}
        title={doneTitle}
        description={doneDescription}
        confirmText="확인"
        cancelText="닫기"
        onConfirm={() => {
          setDoneOpen(false);
          router.push("/arena");
        }}
      />

      <AnimatePresence>
        {captureGuardOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 px-6"
          >
            <div className="rounded-2xl bg-white px-5 py-5 text-center shadow-xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <PiWarningCircleDuotone className="text-[32px]" />
              </div>
              <div className="mt-3 text-[17px] font-bold text-slate-900">
                화면 보호 중
              </div>
              <div className="mt-2 break-keep text-[14px] leading-6 text-slate-600">
                캡처 및 외부 저장을 어렵게 하기 위해
                <br />
                일시적으로 화면이 가려집니다.
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}