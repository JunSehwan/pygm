import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  FiCheckCircle,
  FiHelpCircle,
  FiLock,
  FiShield,
  FiUserCheck,
  FiX,
} from "react-icons/fi";
import { PiArrowLeft } from "react-icons/pi";
import { AnimatePresence, motion } from "framer-motion";

const cutePart1 = [
  "설렘",
  "두근",
  "심쿵",
  "달달",
  "말랑",
  "몽글",
  "반짝",
  "폭신",
  "소곤",
  "콩닥",
];

const cutePart2 = [
  "토끼",
  "고양",
  "여우",
  "곰돌",
  "햄찌",
  "병아",
  "고래",
  "하트",
  "별빛",
  "솜사탕",
];

function generateCuteNickname() {
  const p1 = cutePart1[Math.floor(Math.random() * cutePart1.length)];
  const p2 = cutePart2[Math.floor(Math.random() * cutePart2.length)];
  const base = `${p1}${p2}`;

  let num = "";
  if (base.length >= 6) num = String(Math.floor(Math.random() * 900) + 100);
  else num = String(Math.floor(Math.random() * 9000) + 1000);

  let nickname = `${base}${num}`;
  if (nickname.length > 10) nickname = `${p1}${p2.slice(0, 1)}${num}`;

  return nickname.slice(0, 10);
}

function genderLabel(gender) {
  if (gender === "male") return "남성";
  if (gender === "female") return "여성";
  return "";
}

function birthLabel(birth = "") {
  const onlyNum = String(birth || "").replace(/[^0-9]/g, "");
  if (onlyNum.length !== 8) return "";
  return `${onlyNum.slice(0, 4)}.${onlyNum.slice(4, 6)}.${onlyNum.slice(
    6,
    8
  )}`;
}

function isValidBirth(value = "") {
  const onlyNum = String(value || "").replace(/[^0-9]/g, "");
  if (onlyNum.length !== 8) return false;

  const year = Number(onlyNum.slice(0, 4));
  const month = Number(onlyNum.slice(4, 6));
  const day = Number(onlyNum.slice(6, 8));

  if (!year || !month || !day) return false;
  if (year < 1940 || year > new Date().getFullYear()) return false;
  if (month < 1 || month > 12) return false;

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function emailCheck(email = "") {
  return /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i.test(
    email
  );
}

function FieldErrorText({ children }) {
  if (!children) return null;

  return (
    <p className="mt-2 break-keep text-[12px] font-semibold leading-5 text-rose-500">
      {children}
    </p>
  );
}

function FloatingField({
  inputRef,
  label,
  value,
  onChange,
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
  type = "text",
  readOnly = false,
  disabled = false,
  maxLength,
  inputMode,
  autoComplete,
  enterKeyHint,
  error = false,
}) {
  return (
    <label
      className={`relative flex h-[58px] w-full items-center rounded-md border bg-white transition-all duration-150 ${error
          ? "border-rose-400 bg-rose-50/70 shadow-[0_0_0_3px_rgba(244,63,94,0.08)]"
          : "border-zinc-200 shadow-[0_1px_0_rgba(24,24,27,0.03)] focus-within:border-violet-500 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(124,58,237,0.10)]"
        } ${readOnly || disabled ? "bg-zinc-50 text-zinc-500" : ""}`}
    >
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        readOnly={readOnly}
        disabled={disabled}
        maxLength={maxLength}
        inputMode={inputMode}
        autoComplete={autoComplete}
        enterKeyHint={enterKeyHint}
        placeholder=" "
        className={`peer h-full w-full rounded-md border-1 border-gray-200 bg-transparent px-4 pb-[7px] pt-[22px] text-[16px] font-bold text-zinc-900 outline-none placeholder:text-transparent focus:outline-none focus:ring-0 ${readOnly || disabled ? "cursor-default text-zinc-500" : ""
          }`}
      />

      <span
        className={`pointer-events-none absolute left-4 origin-left transition-all duration-150
        top-1/2 -translate-y-1/2 text-[14px] font-semibold text-zinc-400
        peer-focus:top-[9px] peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-extrabold peer-focus:text-violet-600
        peer-[:not(:placeholder-shown)]:top-[9px] peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-extrabold peer-[:not(:placeholder-shown)]:text-violet-600`}
      >
        {label}
      </span>
    </label>
  );
}

function IdentityProcessingOverlay({ message }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          className="absolute inset-0 z-[60] flex items-center justify-center bg-white/82 px-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
        >
          <motion.div
            className="w-full max-w-[320px] rounded-2xl border border-violet-100 bg-white p-5 text-center shadow-[0_18px_50px_rgba(15,23,42,0.14)]"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-violet-50">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
            </div>

            <p className="mt-4 whitespace-pre-line break-keep text-[15px] font-extrabold leading-6 text-zinc-900">
              {message}
            </p>

            <p className="mt-2 break-keep text-[12px] font-semibold leading-5 text-zinc-400">
              처리 중에는 다른 버튼을 누르지 말고 기다려주세요.
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function IdentitySummary({ identityVerifiedData }) {
  return (
    <div className="rounded-md bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
      <div className="flex items-center gap-1.5">
        <FiCheckCircle className="text-[15px] text-emerald-600" />
        <p className="text-[13px] font-bold text-emerald-700">
          본인인증이 완료되었어요
        </p>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {identityVerifiedData?.name ? (
          <p className="text-[12px] text-emerald-800">
            이름 · {identityVerifiedData.name}
          </p>
        ) : null}

        {identityVerifiedData?.phone ? (
          <p className="text-[12px] text-emerald-800">
            연락처 · {identityVerifiedData.phone}
          </p>
        ) : null}

        {identityVerifiedData?.gender ? (
          <p className="text-[12px] text-emerald-800">
            성별 · {genderLabel(identityVerifiedData.gender)}
          </p>
        ) : null}

        {identityVerifiedData?.birth ? (
          <p className="text-[12px] text-emerald-800">
            생년월일 · {birthLabel(identityVerifiedData.birth)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SafetyInfoSheet({ open, onClose }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 px-4 pb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.div
            className="w-full max-w-[390px] rounded-2xl bg-white p-5 shadow-2xl"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-extrabold text-violet-600">
                  안내
                </p>
                <h2 className="mt-1 text-[18px] font-extrabold tracking-[-0.04em] text-zinc-900">
                  안전한 매칭을 위해
                  <br />
                  필요한 정보만 확인해요.
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-600"
                aria-label="안내 닫기"
              >
                <FiX className="text-[18px]" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex gap-2 rounded-md bg-zinc-50 px-3 py-3">
                <FiShield className="mt-0.5 shrink-0 text-[16px] text-violet-600" />
                <p className="break-keep text-[13px] font-medium leading-5 text-zinc-600">
                  본인인증은 중복가입과 허위 프로필 방지용이에요.
                </p>
              </div>

              <div className="flex gap-2 rounded-md bg-zinc-50 px-3 py-3">
                <FiLock className="mt-0.5 shrink-0 text-[16px] text-violet-600" />
                <p className="break-keep text-[13px] font-medium leading-5 text-zinc-600">
                  연락처는 예) 01012345678요.
                </p>
              </div>

              <div className="flex gap-2 rounded-md bg-zinc-50 px-3 py-3">
                <FiUserCheck className="mt-0.5 shrink-0 text-[16px] text-violet-600" />
                <p className="break-keep text-[13px] font-medium leading-5 text-zinc-600">
                  프로필은 승인 후 서비스 기준에 따라 노출돼요.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-4 h-12 w-full rounded-md bg-violet-600 text-[15px] font-extrabold text-white"
            >
              확인했어요
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function SignupFormCard({
  form,
  errors,
  loading,
  canSubmit,
  phoneVerified,
  phoneVerifyLoading,
  phoneVerifyError,
  identityProcessingMessage,
  identityVerifiedData,
  isPasswordMatch,
  onFieldChange,
  onPhoneVerify,
  onSkipIdentity,
  onSubmit,
}) {
  const router = useRouter();
  const passwordCheckRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [stepError, setStepError] = useState("");
  const [showSafetyInfo, setShowSafetyInfo] = useState(false);

  const isTelLocked = phoneVerified;
  const isNameLocked = phoneVerified && !!identityVerifiedData?.name;
  const isBirthLocked = phoneVerified && !!identityVerifiedData?.birth;
  const hasVerifiedGender = phoneVerified && !!identityVerifiedData?.gender;
  const isComposingRef = useRef(false);
  const displayGender = hasVerifiedGender
    ? identityVerifiedData.gender
    : form.gender;

  const displayBirth = isBirthLocked ? identityVerifiedData.birth : form.birth;

  const hasIdentitySummary =
    phoneVerified &&
    (identityVerifiedData?.name ||
      identityVerifiedData?.phone ||
      identityVerifiedData?.gender ||
      identityVerifiedData?.birth);

  const identityReady = useMemo(() => {
    return (
      phoneVerified &&
      !!identityVerifiedData?.verified &&
      !!(identityVerifiedData?.name || form.username?.trim()) &&
      !!displayGender &&
      isValidBirth(displayBirth)
    );
  }, [
    phoneVerified,
    identityVerifiedData,
    form.username,
    displayGender,
    displayBirth,
  ]);

  const needsIdentityExtra = useMemo(() => {
    return (
      phoneVerified &&
      !!identityVerifiedData?.verified &&
      (!displayGender || !isValidBirth(displayBirth))
    );
  }, [phoneVerified, identityVerifiedData, displayGender, displayBirth]);

  const emailReady = useMemo(() => {
    return !!form.email && emailCheck(form.email);
  }, [form.email]);

  const passwordReady = useMemo(() => {
    return (
      !!form.password &&
      form.password.length >= 8 &&
      !!form.passwordCheck &&
      isPasswordMatch
    );
  }, [form.password, form.passwordCheck, isPasswordMatch]);

  const nicknameReady = useMemo(() => {
    return !!form.nickname?.trim() && form.nickname.trim().length <= 10;
  }, [form.nickname]);

  const currentFieldError = useMemo(() => {
    if (currentStep === 0) return errors.username || "";
    if (currentStep === 1) return errors.tel || errors.telVerify || phoneVerifyError || "";
    if (currentStep === 2) return errors.birth || errors.gender || "";
    if (currentStep === 3) return errors.email || "";
    if (currentStep === 4) return errors.passwordLength || errors.passwordMatch || "";
    if (currentStep === 5) return errors.nickname || "";
    return "";
  }, [currentStep, errors, phoneVerifyError]);

  const phoneStepError = errors.tel || errors.telVerify || phoneVerifyError || "";

  useEffect(() => {
    if (!phoneVerified || !identityVerifiedData?.verified) return;
    if (currentStep !== 1) return;

    const timer = window.setTimeout(() => {
      setStepError("");
      setCurrentStep(needsIdentityExtra ? 2 : 3);
    }, 550);

    return () => window.clearTimeout(timer);
  }, [phoneVerified, identityVerifiedData, needsIdentityExtra, currentStep]);

  useEffect(() => {
    if (!identityReady) return;

    if (currentStep <= 1) {
      setStepError("");
      setCurrentStep(3);
    }
  }, [identityReady, currentStep]);

  useEffect(() => {
    if (!errors || !Object.keys(errors).length) return;

    // 부모 validateForm 에러가 내려오면 해당 단계로만 이동시킴.
    // 실제 에러 문구는 각 입력칸 아래 FieldErrorText에서만 보여줌.
    // 이렇게 해야 같은 에러가 stepError 박스와 중복 출력되지 않음.
    if (errors.username) {
      setCurrentStep(0);
      return;
    }

    if (errors.tel || errors.telVerify) {
      setCurrentStep(1);
      return;
    }

    if (errors.birth || errors.gender) {
      setCurrentStep(2);
      return;
    }

    if (errors.email) {
      setCurrentStep(3);
      return;
    }

    if (errors.passwordLength || errors.passwordMatch) {
      setCurrentStep(4);
      return;
    }

    if (errors.nickname) {
      setCurrentStep(5);
    }
  }, [errors]);

  const stepMeta = useMemo(() => {
    if (currentStep === 0) {
      return {
        eyebrow: "가입 시작",
        title: "이름을 알려주세요.",
        description: "실명을 기재해주시기 바랍니다.",
      };
    }

    if (currentStep === 1) {
      return {
        eyebrow: "선택 인증",
        title: "본인인증을 해주세요.",
        description: "인증하면 프로필에 인증마크가 표시되고, 가입 후에도 진행할 수 있어요."
      };
    }

    if (currentStep === 2) {
      return {
        eyebrow: phoneVerified ? "추가 확인" : "매칭 기본정보",
        title: phoneVerified
          ? "확인되지 않은 정보를\n입력해주세요."
          : "생년월일과 성별을\n입력해주세요.",
        description: phoneVerified
          ? "본인인증 결과에서 누락된 정보만 보완해요."
          : "나이와 성별은 매칭 조건에 필요해요. 본인인증은 나중에 할 수 있어요.",
      };
    }

    if (currentStep === 3) {
      return {
        eyebrow: "계정 만들기",
        title: "이메일을 입력해주세요.",
        description: "로그인과 안내를 받을 때 사용해요.",
      };
    }

    if (currentStep === 4) {
      return {
        eyebrow: "계정 만들기",
        title: "비밀번호를 만들어주세요.",
        description: "8자 이상으로 입력해주세요.",
      };
    }

    return {
      eyebrow: "마지막 단계",
      title: "닉네임을 정해주세요.",
      description: "프로필에 먼저 보여질 이름이에요.",
    };
  }, [currentStep, phoneVerified]);

  const goBackStep = () => {
    setStepError("");

    if (currentStep === 0) {
      router.back();
      return;
    }

    if (currentStep === 3 && identityReady) {
      setCurrentStep(1);
      return;
    }

    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleSkipIdentity = () => {
    setStepError("");
    setCurrentStep(2);

    if (typeof onSkipIdentity === "function") {
      onSkipIdentity();
    }
  };

  const goNext = () => {
    setStepError("");

    if (currentStep === 0) {
      if (!form.username?.trim()) {
        setStepError("이름을 입력해주세요.");
        return;
      }

      setCurrentStep(1);
      return;
    }

    if (currentStep === 1) {
      if (!form.tel) {
        setStepError("연락처를 입력해주세요.");
        return;
      }

      if (!phoneVerified || !identityVerifiedData?.verified) {
        onPhoneVerify();
        return;
      }

      setCurrentStep(needsIdentityExtra ? 2 : 3);
      return;
    }

    if (currentStep === 2) {
      if (!displayGender) {
        setStepError("성별 정보를 확인해주세요.");
        return;
      }

      if (!isValidBirth(displayBirth)) {
        setStepError("생년월일 8자리를 정확히 입력해주세요.");
        return;
      }

      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      if (!form.email) {
        setStepError("이메일을 입력해주세요.");
        return;
      }

      if (!emailCheck(form.email)) {
        setStepError("이메일 형식이 올바르지 않습니다.");
        return;
      }

      setCurrentStep(4);
      return;
    }

    if (currentStep === 4) {
      if (!form.password || form.password.length < 8) {
        setStepError("비밀번호를 8자 이상 입력해주세요.");
        return;
      }

      if (!form.passwordCheck) {
        setStepError("비밀번호 확인을 입력해주세요.");
        return;
      }

      if (!isPasswordMatch) {
        setStepError("비밀번호가 일치하지 않습니다.");
        return;
      }

      setCurrentStep(5);
    }
  };

  const handleEnterNext = (e, action) => {
    if (e.key !== "Enter") return;

    const isImeComposing =
      isComposingRef.current ||
      e.nativeEvent?.isComposing ||
      e.keyCode === 229 ||
      e.nativeEvent?.keyCode === 229;

    if (isImeComposing) return;

    e.preventDefault();

    if (typeof action === "function") {
      action();
    }
  };

  const handleGenerateNickname = () => {
    onFieldChange("nickname", generateCuteNickname());
    setStepError("");
  };

  const handleFormSubmit = (e) => {
    if (currentStep < 5) {
      e.preventDefault();
      goNext();
      return;
    }

    if (!nicknameReady) {
      e.preventDefault();
      setStepError("닉네임을 입력해주세요.");
      return;
    }

    onSubmit(e);
  };

  const primaryButtonText = useMemo(() => {
    if (currentStep === 0) return "다음";

    if (currentStep === 1) {
      if (phoneVerifyLoading) return "본인인증 확인 중...";
      if (!phoneVerified) return "본인인증하고 계속";
      return "다음";
    }

    if (currentStep === 2) return "다음";
    if (currentStep === 3) return "다음";
    if (currentStep === 4) return "다음";
    if (loading) return "가입 처리 중...";

    return "차밍수프 시작하기";
  }, [currentStep, phoneVerifyLoading, phoneVerified, loading]);

  const primaryDisabled =
    loading || phoneVerifyLoading || (currentStep === 5 && !nicknameReady);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
      <SafetyInfoSheet
        open={showSafetyInfo}
        onClose={() => setShowSafetyInfo(false)}
      />
      <IdentityProcessingOverlay message={identityProcessingMessage} />
      <header className="shrink-0 bg-white px-5 pb-3 pt-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBackStep}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition hover:bg-slate-100"
            aria-label="뒤로가기"
          >
            <PiArrowLeft className="text-[20px] text-zinc-800" />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="text-[13px] font-extrabold text-gray-500/50">
              {stepMeta.eyebrow}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowSafetyInfo(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-50 text-zinc-500 ring-1 ring-zinc-100 transition hover:bg-zinc-100"
            aria-label="가입 안내 보기"
          >
            <FiHelpCircle className="text-[18px]" />
          </button>
        </div>
      </header>

      <form onSubmit={handleFormSubmit} className="flex min-h-0 flex-1 flex-col">
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-5 pb-5 pt-5">
          <div className="mb-6">
            <h1 className="whitespace-pre-line break-keep text-[25px] font-extrabold leading-[1.18] tracking-[-0.045em] text-zinc-950">
              {stepMeta.title}
            </h1>

            <p className="mt-2 break-keep text-[13px] font-medium leading-5 text-zinc-500">
              {stepMeta.description}
            </p>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {currentStep === 0 ? (
              <motion.section
                key="name-step"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <FloatingField
                  label="이름"
                  value={form.username}
                  onChange={(e) => {
                    if (isNameLocked) return;
                    onFieldChange("username", e.target.value);
                    setStepError("");
                  }}
                  onCompositionStart={() => {
                    isComposingRef.current = true;
                  }}
                  onCompositionEnd={() => {
                    isComposingRef.current = false;
                  }}
                  onKeyDown={(e) => handleEnterNext(e, goNext)}
                  readOnly={isNameLocked}
                  autoComplete="name"
                  enterKeyHint="next"
                  error={!!errors.username}
                />

                {errors.username ? (
                  <FieldErrorText>{errors.username}</FieldErrorText>
                ) : null}

                <p className="mt-3 break-keep text-[12px] font-medium leading-5 text-zinc-400">
                  실명은 본인인증 확인용으로만 사용돼요.
                </p>
              </motion.section>
            ) : null}

            {currentStep === 1 ? (
              <motion.section
                key="phone-step"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-3"
              >
                <FloatingField
                  label="휴대전화 번호"
                  value={form.tel}
                  onChange={(e) => {
                    if (isTelLocked) return;
                    onFieldChange("tel", e.target.value.replace(/[^0-9]/g, ""));
                    setStepError("");
                  }}
                  onCompositionStart={() => {
                    isComposingRef.current = true;
                  }}
                  onCompositionEnd={() => {
                    isComposingRef.current = false;
                  }}
                  onKeyDown={(e) => handleEnterNext(e, goNext)}
                  readOnly={isTelLocked}
                  inputMode="numeric"
                  maxLength={11}
                  autoComplete="tel"
                  enterKeyHint="done"
                  error={!!errors.tel || !!errors.telVerify}
                />

                {phoneStepError ? (
                  <FieldErrorText>{phoneStepError}</FieldErrorText>
                ) : null}

                {hasIdentitySummary ? (
                  <IdentitySummary identityVerifiedData={identityVerifiedData} />
                ) : null}

                <p className="break-keep text-[12px] font-medium leading-5 text-zinc-400">
                  번호는 중복가입 방지와 본인 확인에만 사용돼요.
                </p>
              </motion.section>
            ) : null}

            {currentStep === 2 ? (
              <motion.section
                key="extra-step"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-3"
              >
                <FloatingField
                  label="생년월일 8자리"
                  value={displayBirth}
                  onChange={(e) => {
                    if (isBirthLocked) return;
                    onFieldChange("birth", e.target.value.replace(/[^0-9]/g, ""));
                    setStepError("");
                  }}
                  onCompositionStart={() => {
                    isComposingRef.current = true;
                  }}
                  onCompositionEnd={() => {
                    isComposingRef.current = false;
                  }}
                  onKeyDown={(e) => handleEnterNext(e, goNext)}
                  readOnly={isBirthLocked}
                  inputMode="numeric"
                  maxLength={8}
                  enterKeyHint="next"
                  error={!!errors.birth}
                />

                {errors.birth ? (
                  <FieldErrorText>{errors.birth}</FieldErrorText>
                ) : null}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (hasVerifiedGender) return;
                      onFieldChange("gender", "male");
                      setStepError("");
                    }}
                    disabled={hasVerifiedGender}
                    className={`h-12 rounded-md text-[14px] font-extrabold transition ring-1 ${displayGender === "male"
                      ? "bg-violet-600 text-white ring-violet-600"
                      : "bg-zinc-50 text-zinc-600 ring-zinc-200 hover:bg-zinc-100"
                      }`}
                  >
                    남성
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (hasVerifiedGender) return;
                      onFieldChange("gender", "female");
                      setStepError("");
                    }}
                    disabled={hasVerifiedGender}
                    className={`h-12 rounded-md text-[14px] font-extrabold transition ring-1 ${displayGender === "female"
                      ? "bg-violet-600 text-white ring-violet-600"
                      : "bg-zinc-50 text-zinc-600 ring-zinc-200 hover:bg-zinc-100"
                      }`}
                  >
                    여성
                  </button>
                </div>

                {errors.gender ? (
                  <FieldErrorText>{errors.gender}</FieldErrorText>
                ) : null}
              </motion.section>
            ) : null}

            {currentStep === 3 ? (
              <motion.section
                key="email-step"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <FloatingField
                  label="이메일"
                  value={form.email}
                  onChange={(e) => {
                    onFieldChange("email", e.target.value);
                    setStepError("");
                  }}
                  onCompositionStart={() => {
                    isComposingRef.current = true;
                  }}
                  onCompositionEnd={() => {
                    isComposingRef.current = false;
                  }}
                  onKeyDown={(e) => handleEnterNext(e, goNext)}
                  type="email"
                  autoComplete="email"
                  enterKeyHint="next"
                  error={!!errors.email}
                />

                {errors.email ? (
                  <FieldErrorText>{errors.email}</FieldErrorText>
                ) : null}

                {form.email && emailReady && !errors.email ? (
                  <p className="mt-2 text-[12px] font-medium text-emerald-600">
                    사용할 수 있는 형식이에요.
                  </p>
                ) : null}
              </motion.section>
            ) : null}

            {currentStep === 4 ? (
              <motion.section
                key="password-step"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-3"
              >
                <FloatingField
                  label="비밀번호"
                  value={form.password}
                  onChange={(e) => {
                    onFieldChange("password", e.target.value);
                    setStepError("");
                  }}
                  onKeyDown={(e) =>
                    handleEnterNext(e, () => {
                      passwordCheckRef.current?.focus();
                    })
                  }
                  onCompositionStart={() => {
                    isComposingRef.current = true;
                  }}
                  onCompositionEnd={() => {
                    isComposingRef.current = false;
                  }}
                  type="password"
                  autoComplete="new-password"
                  enterKeyHint="next"
                  error={!!errors.passwordLength}
                />

                <FloatingField
                  inputRef={passwordCheckRef}
                  label="비밀번호 확인"
                  value={form.passwordCheck}
                  onChange={(e) => {
                    onFieldChange("passwordCheck", e.target.value);
                    setStepError("");
                  }}
                  onCompositionStart={() => {
                    isComposingRef.current = true;
                  }}
                  onCompositionEnd={() => {
                    isComposingRef.current = false;
                  }}
                  onKeyDown={(e) => handleEnterNext(e, goNext)}
                  type="password"
                  autoComplete="new-password"
                  enterKeyHint="next"
                  error={!!errors.passwordMatch}
                />

                {errors.passwordLength ? (
                  <FieldErrorText>{errors.passwordLength}</FieldErrorText>
                ) : null}

                {errors.passwordMatch ? (
                  <FieldErrorText>{errors.passwordMatch}</FieldErrorText>
                ) : null}

                {form.passwordCheck ? (
                  <p
                    className={`text-[12px] font-semibold ${passwordReady ? "text-emerald-600" : "text-rose-500"
                      }`}
                  >
                    {passwordReady
                      ? "비밀번호가 일치해요."
                      : "비밀번호가 일치하지 않아요."}
                  </p>
                ) : (
                  <p className="text-[12px] font-medium text-zinc-400">
                    8자 이상 입력해주세요.
                  </p>
                )}
              </motion.section>
            ) : null}

            {currentStep === 5 ? (
              <motion.section
                key="nickname-step"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-4"
              >
                <div className="flex gap-2">
                  <div className="min-w-0 flex-1">
                    <FloatingField
                      label="닉네임"
                      value={form.nickname}
                      onChange={(e) => {
                        onFieldChange("nickname", e.target.value);
                        setStepError("");
                      }}
                      onCompositionStart={() => {
                        isComposingRef.current = true;
                      }}
                      onCompositionEnd={() => {
                        isComposingRef.current = false;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (e.nativeEvent?.isComposing) return;
                          e.preventDefault();
                        }
                      }}
                      maxLength={10}
                      enterKeyHint="done"
                      error={!!errors.nickname}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateNickname}
                    className="h-[56px] shrink-0 rounded-md bg-zinc-100 px-4 text-[13px] font-extrabold text-zinc-700 ring-1 ring-zinc-200 transition hover:bg-zinc-200"
                  >
                    자동생성
                  </button>
                </div>

                {errors.nickname ? (
                  <FieldErrorText>{errors.nickname}</FieldErrorText>
                ) : null}

                <div className="px-4 py-3">
                  <p className="break-keep text-[12px] leading-5 text-zinc-500">
                    가입을 완료하면{" "}
                    <Link
                      href="/about/service"
                      className="font-semibold text-violet-500 underline underline-offset-2"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      서비스 약관
                    </Link>{" "}
                    및{" "}
                    <Link
                      href="/about/privacy"
                      className="font-semibold text-violet-500 underline underline-offset-2"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      개인정보 처리방침
                    </Link>
                    에 동의한 것으로 간주합니다.
                  </p>
                </div>
              </motion.section>
            ) : null}
          </AnimatePresence>

          {stepError && stepError !== currentFieldError ? (
            <div className="mt-4 rounded-md bg-rose-50 px-3 py-2 ring-1 ring-rose-100">
              <p className="break-keep text-[12px] font-semibold leading-5 text-rose-600">
                {stepError}
              </p>
            </div>
          ) : null}
        </main>

        <footer className="shrink-0 border-t border-zinc-100 bg-white px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-3">
          {currentStep === 1 && !phoneVerified ? (
            <button
              type="button"
              onClick={handleSkipIdentity}
              disabled={loading || phoneVerifyLoading}
              className="mb-3 flex h-10 w-full items-center justify-center rounded-md bg-transparent text-[13px] font-extrabold text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-800 disabled:text-zinc-300"
              style={{ cursor: loading || phoneVerifyLoading ? "default" : "pointer" }}
            >
              다음에 본인인증 할게요
            </button>
          ) : null}

          {currentStep === 5 ? (
            <p className="mb-5 text-center text-[14px] text-zinc-500">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="font-semibold text-violet-600">
                로그인
              </Link>
            </p>
          ) : null}

          <button
            type="submit"
            disabled={primaryDisabled}
            style={{ cursor: primaryDisabled ? "default" : "pointer" }}
            className={`flex h-14 w-full items-center justify-center rounded-md text-md font-extrabold transition ${primaryDisabled
              ? "bg-zinc-200 text-zinc-400"
              : "bg-violet-600 text-white shadow-[0_12px_24px_rgba(124,58,237,0.20)] hover:bg-violet-700"
              }`}
          >
            {primaryButtonText}
          </button>
        </footer>
      </form>
    </div>
  );
}