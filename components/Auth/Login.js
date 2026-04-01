import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  PiArrowCounterClockwiseBold,
  PiEnvelopeSimple,
  PiEye,
  PiEyeSlash,
  PiLockKey,
  PiWarningCircleFill,
} from "react-icons/pi";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "firebaseConfig";

function getErrorMessage(errorCode = "") {
  switch (errorCode) {
    case "auth/invalid-email":
      return "이메일 형식이 올바르지 않아요.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "이메일 또는 비밀번호가 맞지 않아요.";
    case "auth/too-many-requests":
      return "시도가 많아요. 잠시 후 다시 시도해주세요.";
    default:
      return "로그인 중 문제가 발생했어요. 다시 시도해주세요.";
  }
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function UnderlineInput({
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  inputRef,
  onKeyDown,
  autoComplete,
  leftIcon,
  rightSlot,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="relative flex items-center">
        {leftIcon ? (
          <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
            {leftIcon}
          </div>
        ) : null}

        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={cn(
            "h-[52px] w-full appearance-none rounded-none border-0 border-b bg-transparent text-[15px] text-slate-900 outline-none ring-0 shadow-none transition placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:shadow-none",
            leftIcon ? "pl-10" : "pl-0",
            rightSlot ? "pr-10" : "pr-0",
            error
              ? "border-rose-300"
              : focused
                ? "border-violet-400"
                : "border-slate-200"
          )}
          style={{
            WebkitAppearance: "none",
            MozAppearance: "none",
            boxShadow: "none",
            borderTop: "0",
            borderLeft: "0",
            borderRight: "0",
            borderRadius: "0",
          }}
        />

        {rightSlot ? (
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
            {rightSlot}
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="flex items-start gap-1.5 text-[12px] text-rose-500">
          <PiWarningCircleFill className="mt-[1px] shrink-0 text-[14px]" />
          <span>{error}</span>
        </div>
      ) : null}
    </div>
  );
}

export default function Login() {
  const router = useRouter();

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const canSubmit = useMemo(() => {
    return !!email.trim() && !!password.trim() && !loading;
  }, [email, password, loading]);

  const clearFieldError = useCallback((field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const validate = useCallback(() => {
    const nextErrors = {};

    if (!email.trim()) nextErrors.email = "이메일을 입력해주세요.";
    if (!password.trim()) nextErrors.password = "비밀번호를 입력해주세요.";

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [email, password]);

  const handleSubmit = useCallback(
    async (e) => {
      if (e) e.preventDefault();

      if (!validate()) return;

      try {
        setLoading(true);
        setSubmitError("");

        await signInWithEmailAndPassword(auth, email.trim(), password);
        router.replace("/arena");
      } catch (error) {
        console.error("[Login] sign in error:", error);
        setSubmitError(getErrorMessage(error?.code));
      } finally {
        setLoading(false);
      }
    },
    [email, password, router, validate]
  );

  const handleEmailChange = useCallback(
    (e) => {
      setEmail(e.target.value);
      clearFieldError("email");
      setSubmitError("");
    },
    [clearFieldError]
  );

  const handlePasswordChange = useCallback(
    (e) => {
      setPassword(e.target.value);
      clearFieldError("password");
      setSubmitError("");
    },
    [clearFieldError]
  );

  const handleEmailKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      passwordInputRef.current?.focus();
    }
  }, []);

  const handlePasswordKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <style jsx global>{`
  input,
  textarea,
  select {
    outline: none !important;
    box-shadow: none !important;
    background-color: transparent !important;
  }

  input:focus,
  textarea:focus,
  select:focus {
    outline: none !important;
    box-shadow: none !important;
    background-color: transparent !important;
  }

input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-text-fill-color: #0f172a !important;
  -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
  box-shadow: 0 0 0 1000px #ffffff inset !important;
  caret-color: #0f172a !important;
  border-top: 0 !important;
  border-left: 0 !important;
  border-right: 0 !important;
}
`}</style>

      <header className="shrink-0 px-6 pb-2 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-black tracking-[-0.04em] text-slate-900">
            로그인
          </h1>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-1 rounded-full px-2 py-2 text-[14px] font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            style={{ cursor: "pointer" }}
          >
            <PiArrowCounterClockwiseBold className="text-[15px]" />
            뒤로가기
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 pt-2">
        <div className="mx-auto flex h-full w-full max-w-[340px] flex-col">
          <div className="flex flex-col items-center py-12">
            <div className="relative flex h-[122px] w-[122px] items-center justify-center overflow-hidden rounded-[24px] bg-white">
              <Image
                src="/logo/logo.png"
                alt="차밍수프 로고"
                fill
                className="object-contain p-2"
                unoptimized
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <UnderlineInput
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="이메일"
              error={fieldErrors.email}
              inputRef={emailInputRef}
              onKeyDown={handleEmailKeyDown}
              autoComplete="email"
              leftIcon={<PiEnvelopeSimple className="text-[18px]" />}
            />

            <UnderlineInput
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={handlePasswordChange}
              placeholder="비밀번호"
              error={fieldErrors.password}
              inputRef={passwordInputRef}
              onKeyDown={handlePasswordKeyDown}
              autoComplete="current-password"
              leftIcon={<PiLockKey className="text-[18px]" />}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:text-slate-600"
                  style={{ cursor: "pointer" }}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPassword ? (
                    <PiEyeSlash className="text-[18px]" />
                  ) : (
                    <PiEye className="text-[18px]" />
                  )}
                </button>
              }
            />

            {submitError ? (
              <div className="rounded-[14px] bg-rose-50 px-4 py-3 text-[12px] leading-5 text-rose-600 ring-1 ring-rose-100">
                {submitError}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-3 flex h-[48px] w-full items-center justify-center rounded-full bg-violet-600 text-[16px] font-bold text-white transition hover:bg-violet-700 disabled:opacity-50"
              style={{ cursor: canSubmit ? "pointer" : "default" }}
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <div className="mt-12 space-y-5 text-center">
            <Link
              href="/password/forgot"
              className="block text-[14px] font-medium text-slate-400 transition hover:text-violet-600"
            >
              비밀번호를 잃어버리셨나요? 비밀번호 재설정
            </Link>

            <Link
              href="/signup"
              className="block text-[14px] font-medium text-slate-400 transition hover:text-violet-600"
            >
              아직 회원가입을 안하셨어요? 회원가입
            </Link>
          </div>

          <div className="flex-1" />
        </div>
      </div>
    </div>
  );
}