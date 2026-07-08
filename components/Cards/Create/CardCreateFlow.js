import React, { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { auth, db } from "firebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { FiLock } from "react-icons/fi";

import LoadingPage from "components/Common/Loading";
import ConfirmModal from "components/ProfileSetup/ConfirmModal";

import {
  CARD_TYPE_OPTIONS,
  CARD_CATEGORY_OPTIONS,
  CARD_CATEGORY_LABEL_MAP,
  DEFAULT_FORM,
  EXAMPLE_TEXT,
  MAX_TITLE_LENGTH,
  MAX_BODY_LENGTH,
  MAX_GUIDE_LENGTH,
  MAX_OPTION_LENGTH,
  MAX_OPTIONS,
  MIN_OPTIONS,
} from "./constants";

import CardCreateHeader from "./CardCreateHeader";
import StepOneTypeCategory from "./StepOneTypeCategory";
import StepTwoQuestionForm from "./StepTwoQuestionForm";
import StepThreeOptionsForm from "./StepThreeOptionsForm";

import { AnimatePresence, motion } from "framer-motion";

export default function CardCreateFlow() {
  const router = useRouter();

  const isEditMode = router.query?.mode === "edit" && !!router.query?.cardId;
  const fromProfileCharming =
    router.query?.from === "profile" && router.query?.tab === "charming";

  const [bootLoading, setBootLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);

  const [step, setStep] = useState(1);
  const [openConfirm, setOpenConfirm] = useState(false);

  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});

  const [direction, setDirection] = useState(1);

  const titleRef = useRef(null);
  const bodyRef = useRef(null);
  const guideRef = useRef(null);

  const isLoggedIn = !!firebaseUser?.uid;
  const userGender = userDoc?.gender || "";
  const isFemale =
    userGender === "female" ||
    userGender === "여성" ||
    userGender === "woman";

  useEffect(() => {
    const unsubscribe = auth?.onAuthStateChanged?.(async (u) => {
      if (!u) {
        setFirebaseUser(null);
        setUserDoc(null);
        setBootLoading(false);
        router.replace(`/login?redirect=${encodeURIComponent("/cards/create")}`);
        return;
      }

      try {
        setFirebaseUser(u);
        const userRef = doc(db, "users", u.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserDoc(userSnap.data() || {});
        } else {
          setUserDoc(null);
        }
      } catch (error) {
        console.error("[CardCreateFlow] load user error:", error);
      } finally {
        setBootLoading(false);
      }
    });

    return () => unsubscribe && unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!router.isReady) return;
    if (!isEditMode) return;

    let mounted = true;

    async function loadEditCard() {
      try {
        const cardRef = doc(db, "charmingCards", router.query.cardId);
        const cardSnap = await getDoc(cardRef);

        if (!cardSnap.exists()) return;

        const data = cardSnap.data() || {};

        if (!mounted) return;

        setForm({
          questionType: data.questionType || "choice",
          category: data.category || "value",
          title: data.title || "",
          body: data.body || "",
          guide: data.guide || "",
          options:
            data.questionType === "choice"
              ? (Array.isArray(data.options) && data.options.length > 0
                ? data.options
                : ["", "", "", ""])
              : ["", "", "", ""],
        });

        setStep(1);
      } catch (error) {
        console.error("[CardCreateFlow] load edit card error:", error);
      }
    }

    loadEditCard();

    return () => {
      mounted = false;
    };
  }, [router.isReady, router.query.cardId, isEditMode]);

  const trimmedOptions = useMemo(() => {
    return form.options.map((item) => item.trim()).filter(Boolean);
  }, [form.options]);

  const updateForm = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [key]: "",
    }));
  };

  const handleOptionChange = (index, value) => {
    setForm((prev) => {
      const next = [...prev.options];
      next[index] = value;
      return {
        ...prev,
        options: next,
      };
    });

    setErrors((prev) => ({
      ...prev,
      [`option_${index}`]: "",
    }));
  };

  const handleAddOption = () => {
    setForm((prev) => {
      if (prev.options.length >= MAX_OPTIONS) return prev;
      return {
        ...prev,
        options: [...prev.options, ""],
      };
    });
  };

  const handleRemoveOption = () => {
    setForm((prev) => {
      if (prev.options.length <= MIN_OPTIONS) return prev;
      return {
        ...prev,
        options: prev.options.slice(0, -1),
      };
    });
  };

  const focusField = (ref) => {
    if (!ref?.current) return;
    ref.current.focus();
    ref.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const validateStep2 = () => {
    const nextErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = "질문 제목을 입력해주세요.";
    }

    if (!form.body.trim()) {
      nextErrors.body = "질문 내용을 입력해주세요.";
    } else if (form.body.trim().length < 20) {
      nextErrors.body = "질문 내용은 최소 20자 이상 작성해주세요.";
    }

    setErrors((prev) => ({
      ...prev,
      ...nextErrors,
    }));

    if (nextErrors.title) {
      focusField(titleRef);
      return false;
    }

    if (nextErrors.body) {
      focusField(bodyRef);
      return false;
    }

    return true;
  };

  const validateStep3 = () => {
    const nextErrors = {};
    let firstInvalidIndex = -1;

    form.options.forEach((item, index) => {
      if (!item.trim()) {
        nextErrors[`option_${index}`] = "보기를 입력해주세요.";
        if (firstInvalidIndex === -1) firstInvalidIndex = index;
      }
    });

    if (trimmedOptions.length < MIN_OPTIONS) {
      nextErrors.option_global = `보기는 최소 ${MIN_OPTIONS}개 이상 필요해요.`;
    }

    setErrors((prev) => ({
      ...prev,
      ...nextErrors,
    }));

    return Object.keys(nextErrors).length === 0;
  };

  const handleNextFromStep1 = () => {
    setDirection(1);
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    const valid = validateStep2();
    if (!valid) return;

    if (form.questionType === "choice") {
      setDirection(1);
      setStep(3);
      return;
    }

    setOpenConfirm(true);
  };

  const handleOpenConfirmFromStep3 = () => {
    const valid = validateStep3();
    if (!valid) return;

    setOpenConfirm(true);
  };

  const handleBack = () => {
    if (saving) return;

    if (step === 1 || isEditMode) {
      if (fromProfileCharming) {
        router.push("/profile?tab=charming");
        return;
      }

      router.back();
      return;
    }

    setDirection(-1);
    setStep((prev) => prev - 1);
  };

  const handleSave = async () => {
    if (!isLoggedIn || !firebaseUser?.uid) {
      router.replace(`/login?redirect=${encodeURIComponent("/cards/create")}`);
      return;
    }

    if (!isFemale) {
      return;
    }

    try {
      setSaving(true);

      const payload = {
        questionType: form.questionType,
        category: form.category,
        categoryLabel: CARD_CATEGORY_LABEL_MAP[form.category] || "",
        title: form.title.trim(),
        body: form.body.trim(),
        guide: form.guide.trim(),
        options: form.questionType === "choice" ? trimmedOptions : [],
        creatorUid: firebaseUser.uid,
        creatorGender: userGender || "",
        creatorNickname: userDoc?.nickname || "",
        creatorUsername: userDoc?.username || "",
        visibilityTarget: "male",
        status: isEditMode ? "pending_approval" : "pending_approval",
        isPublished: false,
        updatedAt: serverTimestamp(),
      };
      if (!isEditMode) {
        payload.answerCount = 0;
        payload.interestedCount = 0;
        payload.approvedAt = null;
        payload.createdAt = serverTimestamp();
      }
      if (isEditMode) {
        await setDoc(
          doc(db, "charmingCards", router.query.cardId),
          {
            ...payload,
            createdAt: payload.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        await addDoc(collection(db, "charmingCards"), payload);
      }

      setOpenConfirm(false);

      if (fromProfileCharming) {
        router.push("/profile?tab=charming");
        return;
      }

      router.push("/cards");
    } catch (error) {
      console.error("[CardCreateFlow] save error:", error);
      setErrors((prev) => ({
        ...prev,
        submit: "저장 중 오류가 발생했습니다. 다시 시도해주세요.",
      }));
    } finally {
      setSaving(false);
    }
  };

  if (bootLoading) {
    return <LoadingPage />;
  }

  if (!isLoggedIn) {
    return null;
  }

  if (!isFemale) {
    return (
      <>
        <Head>
          <title>차밍카드 제작하기 | 차밍수프</title>
        </Head>

        <div className="flex h-full min-h-0 flex-col bg-[#f7f7f9]">
          <CardCreateHeader
            title="차밍카드"
            onBack={() => router.push("/cards")}
            rightLabel="여성 회원 전용"
          />

          <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-charming-lavenderSoft text-charming-lavender">
              <FiLock className="text-[28px]" />
            </div>

            <h1 className="mt-5 text-[28px] font-semibold tracking-[-0.03em] text-charming-ink">
              차밍카드 제작은
              <br />
              여성 회원 전용이에요
            </h1>

            <p className="mt-3 text-[16px] leading-7 text-zinc-600">
              카드 작성은 여성 회원만 가능하고,
              <br />
              남성 회원은 배포된 카드에 답변하는 구조예요.
            </p>

            <button
              type="button"
              onClick={() => router.push("/cards")}
              className="mt-8 inline-flex h-[54px] items-center justify-center rounded-[14px] bg-charming-primary px-6 text-[16px] font-semibold text-white shadow-[0_10px_24px_rgba(255,77,94,0.22)]"
            >
              카드 홈으로 이동
            </button>
          </div>
        </div>
      </>
    );
  }

  const stepVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 36 : -36,
      opacity: 0,
      position: "absolute",
      width: "100%",
    }),
    center: {
      x: 0,
      opacity: 1,
      position: "relative",
      width: "100%",
    },
    exit: (direction) => ({
      x: direction > 0 ? -36 : 36,
      opacity: 0,
      position: "absolute",
      width: "100%",
    }),
  };

  return (
    <>
      <Head>
        <title>차밍카드 제작하기 | 차밍수프</title>
      </Head>

      <div className="flex h-full min-h-0 flex-col bg-[#f7f7f9]">
        <CardCreateHeader
          title="차밍카드 작성"
          onBack={handleBack}
          rightLabel="여성 회원 전용"
        />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-5">
          <div className="relative min-h-[520px]">
            <AnimatePresence custom={direction} mode="wait" initial={false}>
              <motion.div
                key={step}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { duration: 0.26, ease: [0.22, 1, 0.36, 1] },
                  opacity: { duration: 0.18, ease: "easeOut" },
                }}
              >
                {step === 1 ? (
                  <StepOneTypeCategory
                    form={form}
                    cardTypeOptions={CARD_TYPE_OPTIONS}
                    categoryOptions={CARD_CATEGORY_OPTIONS}
                    onChange={updateForm}
                  />
                ) : null}

                {step === 2 ? (
                  <StepTwoQuestionForm
                    form={form}
                    errors={errors}
                    refs={{
                      titleRef,
                      bodyRef,
                      guideRef,
                    }}
                    onChange={updateForm}
                    maxTitleLength={MAX_TITLE_LENGTH}
                    maxBodyLength={MAX_BODY_LENGTH}
                    maxGuideLength={MAX_GUIDE_LENGTH}
                    exampleText={EXAMPLE_TEXT}
                  />
                ) : null}

                {step === 3 ? (
                  <>
                    <StepThreeOptionsForm
                      options={form.options}
                      errors={errors}
                      minOptions={MIN_OPTIONS}
                      maxOptions={MAX_OPTIONS}
                      maxOptionLength={MAX_OPTION_LENGTH}
                      onChangeOption={handleOptionChange}
                      onAddOption={handleAddOption}
                      onRemoveOption={handleRemoveOption}
                    />

                    {errors.option_global ? (
                      <div className="mt-3 text-[13px] leading-5 text-red-500">
                        {errors.option_global}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>

          {errors.submit ? (
            <div className="mt-4 text-[13px] leading-5 text-red-500">
              {errors.submit}
            </div>
          ) : null}
        </div>

        <div className="sticky bottom-0 mt-auto border-t border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-[390px] md:max-w-[430px]">
            {step === 1 ? (
              <button
                type="button"
                onClick={handleNextFromStep1}
                className="h-[56px] w-full bg-black text-[16px] font-semibold text-white"
              >
                다음
              </button>
            ) : null}

            {step === 2 ? (
              <button
                type="button"
                onClick={handleNextFromStep2}
                className="h-[56px] w-full bg-black text-[16px] font-semibold text-white"
              >
                다음
              </button>
            ) : null}

            {step === 3 ? (
              <button
                type="button"
                onClick={handleOpenConfirmFromStep3}
                className="h-[56px] w-full bg-black text-[16px] font-semibold text-white"
              >
                작성 완료
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={openConfirm}
        title={"작성을 마치셨나요?"}
        desc={
          "수고하셨습니다!\n카드 내용 승인 후\n남성 회원들에게 배포됩니다.\n여성 프로필은 공개되지 않습니다."
        }
        cancelText="취소"
        confirmText={saving ? "저장중..." : "확인"}
        onCancel={() => {
          if (saving) return;
          setOpenConfirm(false);
        }}
        onConfirm={handleSave}
        confirmClassName="bg-charming-primary"
      />
    </>
  );
}