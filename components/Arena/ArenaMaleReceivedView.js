import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
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
import {
  PiClockCountdownDuotone,
  PiHeartDuotone,
  PiLockKeyDuotone,
  PiPhoneDuotone,
  PiWarningCircleDuotone,
  PiXBold,
} from "react-icons/pi";

import { db, sendLms } from "firebaseConfig";
import {
  getAreaLabel,
  getMbtiLabel,
  getPhotoList,
  getRegisteredPhotoCount,
} from "components/Arena/Detail/arenaDetailUtils";
import {
  getDisplayName,
  getEducationLabel,
  getJobLabel,
  getUserDocId,
} from "lib/arena";

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
const RESPONSE_LIMIT_HOURS = 72;

function getExpireText(expiresAt) {
  if (!expiresAt) return "72시간";
  let date = null;

  if (typeof expiresAt?.toDate === "function") {
    date = expiresAt.toDate();
  } else if (expiresAt?.seconds) {
    date = new Date(expiresAt.seconds * 1000);
  } else {
    date = new Date(expiresAt);
  }

  if (!date || Number.isNaN(date.getTime())) return "72시간";

  const diff = date.getTime() - Date.now();
  if (diff <= 0) return "응답시간 종료";

  const totalMinutes = Math.floor(diff / 1000 / 60);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return `${hours}시간 남음`;
}

function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  confirmClassName = "bg-violet-600 text-white",
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 md:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.985 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[430px] rounded-t-2xl bg-white px-5 pb-6 pt-5 md:rounded-2xl"
      >
        <div className="text-[18px] font-bold text-slate-900">{title}</div>
        <div className="mt-2 whitespace-pre-line text-[14px] leading-6 text-slate-600">
          {description}
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className={`mt-5 flex h-[50px] w-full items-center justify-center rounded-md text-[15px] font-bold ${confirmClassName}`}
          style={{ cursor: "pointer" }}
        >
          {confirmLabel}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 flex h-[42px] w-full items-center justify-center rounded-md text-[14px] font-semibold text-slate-500"
          style={{ cursor: "pointer" }}
        >
          취소
        </button>
      </motion.div>
    </div>
  );
}

function MaleEmptyState({ onWriteCard, onMoveProfile }) {
  return (
    <div className="flex h-full flex-col px-5 pb-6 pt-5">
      <div className="rounded-[16px] border border-slate-200 bg-white px-5 py-6 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <div className="relative mx-auto h-[220px] w-[220px]">
          <Image
            src="/image/arena/arena_man_waiting.png"
            alt="호감 대기"
            fill
            className="object-contain"
            unoptimized
          />
        </div>

        <div className="mt-4">
          <div className="break-keep text-[20px] font-extrabold leading-[1.3] tracking-[-0.03em] text-zinc-900">
            여성분이 {nickname || "회원"}님에게
            <br />
            호감표시를 보낼 경우
            <br />
            카드가 발생합니다.
          </div>

          <div className="mt-5 break-keep text-[14px] leading-7 text-slate-600">
            호감표시가 올 경우,
            문자메시지로 안내드립니다.
            <br />
            카드에 대한 응답은 3일입니다.
            <br />
            3일내 응답이 없을 경우
            자동거절로 응답됩니다.
            <br />
            <br />
            남성에게 궁금한 부분에 대한
            차밍카드를 만들어서
            답변하는 남성의 프로필을 확인해보세요.
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-3 pt-5">
        <button
          type="button"
          onClick={onWriteCard}
          className="flex h-[56px] w-full items-center justify-center rounded-md bg-violet-500 text-[18px] font-bold text-white"
          style={{ cursor: "pointer" }}
        >
          차밍카드 작성하기
        </button>

        <button
          type="button"
          onClick={onMoveProfile}
          className="flex h-[56px] w-full items-center justify-center rounded-md bg-zinc-600 text-[18px] font-bold text-white"
          style={{ cursor: "pointer" }}
        >
          프로필 수정하기
        </button>
      </div>
    </div>
  );
}

function FemaleReceivedCard({
  viewer,
  item,
  selected,
  onClick,
}) {
  const femaleUser = item?.femaleUser || {};
  const interest = item?.interest || {};

  const nickname = getDisplayName(femaleUser);
  const jobLabel = getJobLabel(femaleUser);
  const education = getEducationLabel(femaleUser);
  const residence = getAreaLabel(femaleUser, "home");
  const workArea = getAreaLabel(femaleUser, "company");
  const mbti = getMbtiLabel(femaleUser);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[16px] border bg-white px-4 py-4 text-left shadow-[0_10px_28px_rgba(15,23,42,0.06)] ${selected ? "border-violet-300 ring-2 ring-violet-100" : "border-slate-200"
        }`}
      style={{ cursor: "pointer" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="break-keep text-[20px] font-extrabold tracking-[-0.03em] text-zinc-900">
            {nickname}
          </div>
          <div className="mt-1 break-keep text-[14px] font-semibold text-slate-600">
            {jobLabel}
          </div>
        </div>

        <div className="inline-flex shrink-0 items-center rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-[12px] font-bold text-violet-700">
          <PiClockCountdownDuotone className="mr-1 text-[15px]" />
          {getExpireText(interest?.expiresAt)}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {residence ? (
          <div className="inline-flex h-8 items-center rounded-full bg-slate-100 px-3 text-[12px] font-semibold text-slate-700">
            {residence}
          </div>
        ) : null}
        {mbti ? (
          <div className="inline-flex h-8 items-center rounded-full bg-slate-100 px-3 text-[12px] font-semibold text-slate-700">
            {mbti}
          </div>
        ) : null}
        {education ? (
          <div className="inline-flex h-8 items-center rounded-full bg-slate-100 px-3 text-[12px] font-semibold text-slate-700">
            {education}
          </div>
        ) : null}
      </div>

      <div className="mt-3 rounded-[12px] bg-slate-50 p-3 text-[13px] leading-6 text-slate-700">
        <div>거주지 · {residence || "비공개"}</div>
        <div className="mt-1">근무지 · {workArea || "비공개"}</div>
      </div>

      <div className="mt-3 text-[13px] font-semibold text-violet-700">
        여성회원이 먼저 호감을 보냈어요
      </div>
    </button>
  );
}

function ProtectedPhotoCarousel({ viewer, femaleUser }) {
  const photoList = useMemo(() => getPhotoList(femaleUser || {}), [femaleUser]);
  const myPhotoCount = useMemo(() => getRegisteredPhotoCount(viewer || {}), [viewer]);
  const visiblePhotoCount = useMemo(() => {
    if (!photoList.length) return 0;
    return Math.max(1, Math.min(photoList.length, myPhotoCount || 1));
  }, [photoList, myPhotoCount]);

  const [photoIndex, setPhotoIndex] = useState(0);
  const [captureBlocked, setCaptureBlocked] = useState(false);

  const touchStartXRef = useRef(0);

  useEffect(() => {
    setPhotoIndex(0);
  }, [femaleUser?.userID]);

  useEffect(() => {
    const preventContext = (e) => e.preventDefault();
    const preventDrag = (e) => e.preventDefault();

    const handleKeyDown = (e) => {
      const key = String(e.key || "").toLowerCase();

      if (key === "printscreen") {
        e.preventDefault();
        setCaptureBlocked(true);
        setTimeout(() => setCaptureBlocked(false), 1200);
      }

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && ["3", "4", "5", "s"].includes(key)) {
        e.preventDefault();
        setCaptureBlocked(true);
        setTimeout(() => setCaptureBlocked(false), 1200);
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        setCaptureBlocked(true);
      } else {
        setTimeout(() => setCaptureBlocked(false), 250);
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

  const lockedSlideVisible = photoList.length > visiblePhotoCount;
  const totalSlides = lockedSlideVisible ? visiblePhotoCount + 1 : visiblePhotoCount;
  const isLockedSlide = lockedSlideVisible && photoIndex === visiblePhotoCount;

  const movePrev = () => {
    if (totalSlides <= 1) return;
    setPhotoIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const moveNext = () => {
    if (totalSlides <= 1) return;
    setPhotoIndex((prev) => (prev + 1) % totalSlides);
  };

  return (
    <>
      <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
        <div
          className="relative aspect-[0.88] w-full overflow-hidden bg-slate-100"
          onTouchStart={(e) => {
            touchStartXRef.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            const endX = e.changedTouches[0].clientX;
            const diff = endX - touchStartXRef.current;
            if (Math.abs(diff) < 40) return;
            if (diff < 0) moveNext();
            else movePrev();
          }}
        >
          {!isLockedSlide ? (
            <>
              {photoList[photoIndex] ? (
                <Image
                  src={photoList[photoIndex]}
                  alt={`상대 사진 ${photoIndex + 1}`}
                  fill
                  className="select-none object-cover"
                  unoptimized
                  draggable={false}
                  priority={photoIndex === 0}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[14px] text-slate-400">
                  사진이 없어요
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-violet-600 shadow-sm">
                <PiLockKeyDuotone className="text-[32px]" />
              </div>

              <div className="mt-4 text-[18px] font-bold text-slate-800">
                더 많은 사진은 아직 잠겨 있어요
              </div>

              <div className="mt-2 break-keep text-[14px] leading-6 text-slate-600">
                내 사진을 더 등록하면
                <br />
                상대방 이미지를 더 확인할 수 있습니다.
              </div>

              <div className="mt-4 rounded-full bg-white/90 px-3 py-2 text-[12px] font-semibold text-slate-700">
                내 등록 사진 {myPhotoCount}장 기준 공개
              </div>
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-3">
            <div className="rounded-full bg-black/35 px-3 py-1.5 text-[12px] font-bold text-white backdrop-blur">
              {Math.min(photoIndex + 1, totalSlides)} / {totalSlides}
            </div>

            <div className="rounded-full bg-black/35 px-3 py-1.5 text-[12px] font-bold text-white backdrop-blur">
              좌우 스와이프
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 via-black/8 to-transparent px-4 pb-4 pt-10">
            <div className="inline-flex rounded-full bg-black/35 px-3 py-2 text-[12px] font-bold text-white backdrop-blur">
              캡처 및 저장 방지 기능 적용 중
            </div>
          </div>

          {totalSlides > 1 ? (
            <>
              <button
                type="button"
                onClick={movePrev}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-zinc-800 shadow-sm"
                style={{ cursor: "pointer" }}
              >
                ‹
              </button>

              <button
                type="button"
                onClick={moveNext}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-zinc-800 shadow-sm"
                style={{ cursor: "pointer" }}
              >
                ›
              </button>
            </>
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        {captureBlocked ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 px-6"
          >
            <div className="rounded-[18px] bg-white px-5 py-5 text-center shadow-xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <PiWarningCircleDuotone className="text-[30px]" />
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

export default function ArenaMaleReceivedView({
  viewer,
  receivedCards = [],
  onRefresh,
  onMoveCards,
  onMoveProfile,
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [doneOpen, setDoneOpen] = useState(false);
  const [doneMessage, setDoneMessage] = useState("");
  const [needSpoonOpen, setNeedSpoonOpen] = useState(false);

  const currentItem = receivedCards[selectedIndex] || null;
  const femaleUser = currentItem?.femaleUser || {};
  const interest = currentItem?.interest || {};

  useEffect(() => {
    if (!receivedCards.length) {
      setSelectedIndex(0);
      return;
    }
    if (selectedIndex > receivedCards.length - 1) {
      setSelectedIndex(receivedCards.length - 1);
    }
  }, [receivedCards, selectedIndex]);

  const handleAccept = async () => {
    try {
      const maleUid = getUserDocId(viewer);
      const femaleUid = getUserDocId(femaleUser);
      if (!maleUid || !femaleUid || !interest?.id) return;

      const meSnap = await getDoc(doc(db, "users", maleUid));
      const meData = meSnap.exists() ? meSnap.data() || {} : {};
      const spoonState = getSpoonState(meData);
      const currentSpoon = spoonState.total;

      if (currentSpoon < ACCEPT_COST) {
        setAcceptOpen(false);
        setNeedSpoonOpen(true);
        return;
      }

      const deductFree = Math.min(spoonState.free, ACCEPT_COST);
      const deductPaid = ACCEPT_COST - deductFree;

      await updateDoc(doc(db, "users", maleUid), {
        spoon: increment(-ACCEPT_COST),
        spoon_free: increment(-deductFree),
        spoon_paid: increment(-deductPaid),
      });

      await addDoc(collection(db, "spoonHistories"), {
        uid: maleUid,
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
        interestId: interest.id,
        createdAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, "arenaInterests", interest.id),
        {
          status: "accepted",
          respondedAt: serverTimestamp(),
          acceptedAt: serverTimestamp(),
          contactShared: true,
          contactSharedAt: serverTimestamp(),
          maleResponseCost: ACCEPT_COST,
        },
        { merge: true }
      );

      await setDoc(
        doc(db, "arenaMatches", interest.id),
        {
          interestId: interest.id,
          femaleUid,
          femaleNickname: getDisplayName(femaleUser),
          femalePhone: femaleUser?.phonenumber || "",
          maleUid,
          maleNickname: getDisplayName(viewer || {}),
          malePhone: viewer?.phonenumber || "",
          status: "matched",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await addDoc(collection(db, "notifications"), {
        type: "arena_like_accepted",
        targetUid: femaleUid,
        actorUid: maleUid,
        actorNickname: getDisplayName(viewer || {}),
        interestId: interest.id,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      if (femaleUser?.phonenumber) {
        const msg =
          `[차밍수프]\n` +
          `매칭이 성사됐습니다!\n` +
          `상대방 연락처를 확인해보세요.\n` +
          `https://charmingsoup.com/board`;

        await sendLms(femaleUser.phonenumber, msg, "차밍수프 연락처 공유", {
          forceLms: true,
        });
      }

      if (viewer?.phonenumber) {
        const msg =
          `[차밍수프]\n` +
          `호감 승낙이 완료되었습니다.\n` +
          `상대 연락처: ${femaleUser?.phonenumber || "-"}`;

        await sendLms(viewer.phonenumber, msg, "차밍수프 연락처 공유", {
          forceLms: true,
        });
      }

      setAcceptOpen(false);
      setDoneMessage("호감을 승낙했어요.\n양쪽 연락처가 공유되었습니다.");
      setDoneOpen(true);
      await onRefresh?.();
    } catch (error) {
      console.error("[arena/male] accept error:", error);
      alert("승낙 처리 중 문제가 발생했어요.");
    }
  };

  const handleReject = async () => {
    try {
      const maleUid = getUserDocId(viewer);
      const femaleUid = getUserDocId(femaleUser);
      if (!maleUid || !femaleUid || !interest?.id) return;

      await setDoc(
        doc(db, "arenaInterests", interest.id),
        {
          status: "rejected",
          respondedAt: serverTimestamp(),
          rejectedAt: serverTimestamp(),
          rejectedBy: maleUid,
        },
        { merge: true }
      );

      await addDoc(collection(db, "notifications"), {
        type: "arena_like_rejected",
        targetUid: femaleUid,
        actorUid: maleUid,
        actorNickname: getDisplayName(viewer || {}),
        interestId: interest.id,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      if (femaleUser?.phonenumber) {
        const msg =
          `[차밍수프]\n` +
          `안타깝지만 상대방이 호감표시를 거절했습니다.`;

        await sendLms(femaleUser.phonenumber, msg, "차밍수프 호감 거절", {
          forceLms: true,
        });
      }

      setRejectOpen(false);
      setDoneMessage("거절 처리했어요.\n상대에게 문자 안내가 발송됩니다.");
      setDoneOpen(true);
      await onRefresh?.();
    } catch (error) {
      console.error("[arena/male] reject error:", error);
      alert("거절 처리 중 문제가 발생했어요.");
    }
  };

  if (!receivedCards.length) {
    return (
      <>
        <MaleEmptyState
          onWriteCard={onMoveCards}
          onMoveProfile={onMoveProfile}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex h-full flex-col px-4 pb-5 pt-4">
        <div className="rounded-[14px] border border-violet-100 bg-violet-50 px-4 py-3 text-[13px] leading-6 text-violet-800">
          여성회원이 먼저 호감을 보낸 상태입니다.
          <br />
          응답 가능 시간은 {RESPONSE_LIMIT_HOURS}시간이며,
          승낙 시 남성도 스푼 8개가 사용됩니다.
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pb-3">
          <div className="space-y-4">
            {receivedCards.length > 1 ? (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {receivedCards.map((item, index) => (
                  <div key={item?.interest?.id || index} className="min-w-[270px] max-w-[270px] shrink-0">
                    <FemaleReceivedCard
                      viewer={viewer}
                      item={item}
                      selected={index === selectedIndex}
                      onClick={() => setSelectedIndex(index)}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            <ProtectedPhotoCarousel viewer={viewer} femaleUser={femaleUser} />

            <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="break-keep text-[22px] font-extrabold tracking-[-0.03em] text-zinc-900">
                    {getDisplayName(femaleUser)}
                  </div>
                  <div className="mt-1 break-keep text-[14px] font-semibold text-slate-600">
                    {getJobLabel(femaleUser)}
                  </div>
                </div>

                <div className="inline-flex shrink-0 items-center rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-[12px] font-bold text-violet-700">
                  <PiClockCountdownDuotone className="mr-1 text-[15px]" />
                  {getExpireText(interest?.expiresAt)}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-md bg-slate-50 px-3 py-3">
                  <div className="text-[11px] font-semibold text-slate-400">거주지</div>
                  <div className="mt-1 text-[14px] font-bold text-slate-700">
                    {getAreaLabel(femaleUser, "home") || "비공개"}
                  </div>
                </div>

                <div className="rounded-md bg-slate-50 px-3 py-3">
                  <div className="text-[11px] font-semibold text-slate-400">근무지</div>
                  <div className="mt-1 text-[14px] font-bold text-slate-700">
                    {getAreaLabel(femaleUser, "company") || "비공개"}
                  </div>
                </div>

                <div className="rounded-md bg-slate-50 px-3 py-3">
                  <div className="text-[11px] font-semibold text-slate-400">MBTI</div>
                  <div className="mt-1 text-[14px] font-bold text-slate-700">
                    {getMbtiLabel(femaleUser) || "미입력"}
                  </div>
                </div>

                <div className="rounded-md bg-slate-50 px-3 py-3">
                  <div className="text-[11px] font-semibold text-slate-400">학력</div>
                  <div className="mt-1 text-[14px] font-bold text-slate-700">
                    {getEducationLabel(femaleUser) || "미입력"}
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-[12px] border border-violet-100 bg-violet-50 px-3 py-3 text-[13px] leading-6 text-violet-800">
                승낙 시 양쪽 연락처가 공유됩니다.
                <br />
                여자 회원의 차밍카드 답변 조회 기능은 없습니다.
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white px-0 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRejectOpen(true)}
              className="flex h-[54px] items-center justify-center gap-2 rounded-md bg-zinc-700 text-[15px] font-bold text-white"
              style={{ cursor: "pointer" }}
            >
              <PiXBold className="text-[20px]" />
              거절하기
            </button>

            <button
              type="button"
              onClick={() => setAcceptOpen(true)}
              className="flex h-[54px] items-center justify-center gap-2 rounded-md bg-violet-600 text-[15px] font-bold text-white"
              style={{ cursor: "pointer" }}
            >
              <PiHeartDuotone className="text-[20px]" />
              승낙하기
            </button>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 text-[12px] text-slate-500">
            <PiPhoneDuotone className="text-[15px]" />
            승낙 시 연락처가 공유되고 스푼 8개가 차감돼요
          </div>
        </div>
      </div>

      <ConfirmModal
        open={acceptOpen}
        onClose={() => setAcceptOpen(false)}
        onConfirm={handleAccept}
        title="호감을 승낙할까요?"
        description={`승낙 시 스푼 8개가 사용됩니다.\n승낙하면 서로 연락처가 공유됩니다.`}
        confirmLabel="승낙하고 연락처 공유"
        confirmClassName="bg-violet-600 text-white"
      />

      <ConfirmModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleReject}
        title="호감을 거절할까요?"
        description={`거절 시 더이상 호감을 보낸\n상대방을 확인할 수 없습니다.`}
        confirmLabel="거절하기"
        confirmClassName="bg-zinc-700 text-white"
      />

      <ConfirmModal
        open={doneOpen}
        onClose={() => setDoneOpen(false)}
        onConfirm={() => setDoneOpen(false)}
        title="처리 완료"
        description={doneMessage}
        confirmLabel="확인"
        confirmClassName="bg-violet-600 text-white"
      />

      <ConfirmModal
        open={needSpoonOpen}
        onClose={() => setNeedSpoonOpen(false)}
        onConfirm={() => {
          setNeedSpoonOpen(false);
          window.location.href = "/store";
        }}
        title="스푼이 부족해요"
        description="호감을 승낙하려면 스푼 8개가 필요합니다."
        confirmLabel="스토어로 이동"
        confirmClassName="bg-violet-600 text-white"
      />
    </>
  );
}