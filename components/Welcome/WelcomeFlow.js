import React, { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";

import WelcomeSlideCard from "./WelcomeSlideCard";
import WelcomeExploreConfirmModal from "./WelcomeExploreConfirmModal";

export default function WelcomeFlow() {
  const router = useRouter();

  // ✅ 이미지 경로는 네 프로젝트 public/image 기준으로 맞춰놔.
  // 아래 4개 파일명만 실제 파일명으로 바꿔주면 됨.
  const slides = useMemo(
    () => [
      {
        step: 1,
        title: "이성의 결을 보는 소개팅,\n이렇게 진행돼요",
        body:"",
          // "차밍수프의 매칭은 ‘아무나 추천’이 아니라,\n실제 선택으로 진행돼요.\n회원님의 정보와 차밍카드를 바탕으로\n가치관·성향·대화 결이 맞는 만남이 연결됩니다.",
        description:
          "내 매력을 보여줄수록 더 잘 맞는 상대에게\n노출될 가능성이 올라가요.\n(입력 정보가 많을수록 매칭 확률은 상승합니다.)",
        image: "/image/landing/section0.png",
      },
      {
        step: 2,
        title: "STEP 1. 프로필 작성",
        body: "",
        // "차밍수프의 매칭은 ‘아무나 추천’이 아니라,\n실제 선택으로 진행돼요.\n회원님의 정보와 차밍카드를 바탕으로\n가치관·성향·대화 결이 맞는 만남이 연결됩니다.",
        description:
          "상대방에게 어필하기 위해 나 자신을 알려주세요.\n매력적인 당신, \n간단프로필 작성으로 기다린 인연을 만나보세요!",
        image: "/image/landing/section1.png",
      },
      {
        step: 3,
        title: "STEP 2. 여성의 PICK!",
        body: "",
        description:
          "여성은 남성의 프로필을 확인하거나, 차밍카드를 보고\n남성에게 호감을 표시할 수 있습니다.\n이 과정에서 여성 프로필은\n바로 공개되지 않으니 안심하셔도 됩니다!",
        image: "/image/landing/section2.png",
      },
      {
        step: 4,
        title: "STEP 3. 호감표시 전달",
        body: "",
        description:
          "여성이 Pick하면, 남성분에게 안내드립니다.\n따라서, 다른 소개앱처럼 무의미한 이성추천이\n아니라 실제 관심 기반 요청만 전달돼요.",
        image: "/image/landing/section3.png",
      },
      {
        step: 5,
        title: "STEP 4. 남성 수락 시 매칭 성사",
        body: "",
        description:
          "남성이 수락하면 매칭이 성사되고 연락처가 교환됩니다.\n매칭권은 실제 매칭이 성사된 경우에만 소모되오니,\n불필요한 비용소모를 최소화 해드립니다.",
        image: "/image/landing/section4.png",
      },
    ],
    []
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  // 확인 모달 상태
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRoute, setPendingRoute] = useState("");

  const currentSlide = slides[currentIndex];

  const openConfirmForRoute = (path) => {
    setPendingRoute(path);
    setConfirmOpen(true);
  };

  const handleConfirmMove = () => {
    const target = pendingRoute;
    setConfirmOpen(false);
    setPendingRoute("");
    if (target) router.push(target);
  };

  const handleCloseConfirm = () => {
    setConfirmOpen(false);
    setPendingRoute("");
  };

  const goNext = () => {
    if (currentIndex >= slides.length - 1) return;
    setDirection(1);
    setCurrentIndex((prev) => prev + 1);
  };

  const goPrev = () => {
    if (currentIndex <= 0) return;
    setDirection(-1);
    setCurrentIndex((prev) => prev - 1);
  };

  const handleFinish = () => {
    router.push("/profile/setup");
  };

  const variants = {
    enter: (dir) => ({
      x: dir > 0 ? 40 : -40,
      opacity: 0,
      scale: 0.985,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { duration: 0.28, ease: "easeOut" },
        opacity: { duration: 0.22, ease: "easeOut" },
        scale: { duration: 0.22, ease: "easeOut" },
      },
    },
    exit: (dir) => ({
      x: dir > 0 ? -40 : 40,
      opacity: 0,
      scale: 0.985,
      transition: {
        x: { duration: 0.22, ease: "easeIn" },
        opacity: { duration: 0.18, ease: "easeIn" },
        scale: { duration: 0.18, ease: "easeIn" },
      },
    }),
  };

  return (
    <>
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full"
          >
            <WelcomeSlideCard
              slide={currentSlide}
              currentIndex={currentIndex}
              total={slides.length}
              onClickExploreCards={() => openConfirmForRoute("/cards/list")}
              onClickTests={() => openConfirmForRoute("/tests/style")}
              onPrev={goPrev}
              onNext={goNext}
              onFinish={handleFinish}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <WelcomeExploreConfirmModal
        open={confirmOpen}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmMove}
      />
    </>
  );
}