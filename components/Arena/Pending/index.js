import React, { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import { FiArrowLeft, FiChevronRight, FiClock, FiFileText, FiMessageCircle, FiUser } from "react-icons/fi";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, sendLms } from "firebaseConfig";
import { Badge } from "flowbite-react";

const REVIEW_PHONE = "01075781252";

function AnimatedCheckingText() {
  const dots = ["", ".", "..", "..."];

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-[12px] font-bold text-amber-700">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
      </span>

      <span className="flex items-center">
        검증중
        <span className="ml-0.5 inline-flex w-[18px] justify-start">
          {dots.map((dot, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0.2 }}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: index * 0.18,
              }}
              className={index === 0 ? "absolute opacity-0" : ""}
            >
              {index === 0 ? "" : "."}
            </motion.span>
          ))}
        </span>
      </span>
    </div>
  );
}

function ActionCard({ icon, title, desc, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[18px] border border-slate-200 bg-white px-2 py-3.5 text-left shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition hover:-translate-y-[1px] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] active:scale-[0.99]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[20px] text-sky-600">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-bold tracking-[-0.02em] text-blue-600">
          {title}
        </div>
        <div className="mt-1 line-clamp-2 text-[13px] leading-5 text-slate-500">
          {desc}
        </div>
      </div>

      <FiChevronRight className="shrink-0 text-[22px] text-slate-400" />
    </button>
  );
}

export default function PendingReviewPage({ user }) {
  const router = useRouter();
  const notifyOnceRef = useRef(false);

  const uid = user?.userID || user?.uid;
  const displayName = user?.nickname || user?.username || "회원";
  const mainPhoto =
    user?.profilePhotos?.[0]?.url ||
    user?.thumbimage ||
    "";

  const summaryLine = useMemo(() => {
    const region = [user?.address_sido, user?.address_sigugun].filter(Boolean).join(" ");
    const job = user?.job || "";
    return [region, job].filter(Boolean).join(" · ");
  }, [user]);

  useEffect(() => {
    if (!uid || notifyOnceRef.current) return;

    const alreadySent = !!user?.pendingReviewAlertSentAt;
    if (alreadySent) return;

    notifyOnceRef.current = true;

    const sendAdminReviewAlert = async () => {
      try {
        const msg =
          `[차밍수프] 신규 프로필 심사 요청\n` +
          `닉네임: ${displayName}\n` +
          `연락처: ${user?.phonenumber || "-"}\n` +
          `UID: ${uid}\n` +
          `확인 경로: /arena/pending 진입 완료`;

        await sendLms(REVIEW_PHONE, msg, "차밍수프 신규 심사 요청");

        await setDoc(
          doc(db, "users", uid),
          {
            pendingReviewAlertSentAt: serverTimestamp(),
            pendingStatus: "reviewing",
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error("[PendingReviewPage] admin review alert error:", error);
      }
    };

    sendAdminReviewAlert();
  }, [displayName, uid, user]);

  const handleMoveTests = () => {
    router.push("/tests/style");
  };

  const handleMoveCharmingCard = () => {
    router.push("/cards/list");
  };

  const handleMoveProfile = () => {
    router.push("/profile");
  };

  return (
    <>
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 2200,
          style: {
            borderRadius: "14px",
            background: "rgba(30,41,59,0.96)",
            color: "#fff",
            fontSize: "12px",
            lineHeight: "1.45",
            padding: "10px 14px",
            boxShadow: "0 10px 30px rgba(15,23,42,0.22)",
            backdropFilter: "blur(6px)",
            textAlign: "center",
          },
        }}
      />

      <div className="relative flex h-full min-h-0 w-full flex-col bg-white">
        <div className="px-5 pt-4 pb-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
          >
            <FiArrowLeft className="text-[22px]" />
          </button>

          <div className="flex items-start gap-3">
            <div className="relative h-[74px] w-[74px] shrink-0 overflow-hidden rounded-md bg-slate-100 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
              {mainPhoto ? (
                <Image
                  src={mainPhoto}
                  alt="대표 프로필 사진"
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#fff1ef] to-[#ffe5e7] text-[#ff5a5f]">
                  <FiUser className="text-[28px]" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 pt-1">
              <div className="text-[13px] font-bold text-slate-500">
                {displayName}님의
              </div>
              <h1 className="mt-1 text-2xl font-black leading-[1.08] text-slate-900">
                프로필을 심사중입니다.
              </h1>
              <div className="rounded-full py-1 text-[12px] font-semibold text-slate-600">
                (평균 1~2일 이내소요)
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <AnimatedCheckingText />

            {/* <div className="rounded-full bg-slate-100 px-3 py-1.5 text-[12px] font-semibold text-slate-600">
              평균 2~3일 이내
            </div> */}
          </div>

          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-2 py-2">
            <div className="flex items-start gap-2">
              {/* <FiClock className="mt-[2px] shrink-0 text-[16px] text-[#ff5a5f]" /> */}
              <div className="text-[13px] leading-4 text-slate-600">
                심사가 완료되면 문자로 안내드려요.
                <br />
                주말 및 공휴일 포함 시 기간이 조금 더 길어질 수 있어요.<br />
                심사승인시 바로 이성탐색이 시작됩니다.
              </div>
            </div>

            {/* {summaryLine ? (
              <div className="mt-1 border-t border-slate-200 pt-3 text-[12px] font-medium text-slate-500">
                {summaryLine}
              </div>
            ) : null} */}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden px-5 pb-[calc(20px+env(safe-area-inset-bottom))]">
          <div className="grid h-full grid-rows-[auto_1fr] gap-3">
            <div className="rounded-md px-2 py-2 flex justify-between bg-slate-50">
              <div className="">
                <div className="text-left text-sm font-bold leading-5 text-slate-600">
                  여성이 남성에게 호감표시를 한 후,
                  <br />
                  남성이 호감에 응답합니다.
                </div>
                <div className="mt-1 text-left text-xs leading-4 text-slate-500">
                  가짜 여성데이터를 방지하고
                  <br />
                  호감표시 남발을 방지하기 위한 구조입니다.
                </div>
              </div>
              <Badge className="rounded-full px-2 mb-0.5 text-xs min-w-fit text-center" color="pink">
                참고사항</Badge>
            </div>

            <div className="grid content-start gap-2.5">
              <ActionCard
                icon={<FiFileText />}
                title="16가지 연애스타일 진단"
                desc="내 연애스타일을 확인하고 나와 더 잘 맞는 이성을 만나보세요."
                onClick={handleMoveTests}
              />

              <ActionCard
                icon={<FiMessageCircle />}
                title="차밍카드로 매칭률 높이기"
                desc="연애가치관에 대한 다양한 의견을 살펴볼 수 있습니다. 본인의 의견을 작성하면서 매칭률을 높여보세요."
                onClick={handleMoveCharmingCard}
              />

              <ActionCard
                icon={<FiUser />}
                title="프로필 추가정보 입력"
                desc="추가 정보를 채울수록 신뢰도와 추천 정확도가 더 올라갑니다."
                onClick={handleMoveProfile}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}