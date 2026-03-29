import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  PiArrowLeft,
  PiCalendarBlank,
  PiCheckCircleFill,
  PiEnvelopeSimple,
  PiEye,
  PiEyeSlash,
  PiLockKey,
  PiPhone,
  PiShieldCheckered,
  PiWarningCircleFill,
} from "react-icons/pi";
import { auth } from "firebaseConfig";

const APP_HOME_ROUTE = "/arena";

function onlyDigits(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

function formatPhoneInput(value = "") {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function formatBirthInput(value = "") {
  return onlyDigits(value).slice(0, 8);
}

function getPasswordChecks(password = "") {
  return {
    length: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    noSpace: !/\s/.test(password),
  };
}

function getErrorMessage(error) {
  const code = error?.code || "";
  const message = error?.message || "";
  const details = error?.details || "";

  const merged = `${code} ${message} ${details}`;

  if (
    merged.includes("functions/not-found") ||
    merged.includes("not-found")
  ) {
    return "입력한 정보와 일치하는 계정을 찾지 못했어요.";
  }

  if (
    merged.includes("functions/resource-exhausted") ||
    merged.includes("resource-exhausted")
  ) {
    return message.replace(/^.*resource-exhausted:?\s*/i, "") || "잠시 후 다시 시도해주세요.";
  }

  if (
    merged.includes("functions/deadline-exceeded") ||
    merged.includes("deadline-exceeded")
  ) {
    return message.replace(/^.*deadline-exceeded:?\s*/i, "") || "인증 시간이 만료되었어요.";
  }

  if (
    merged.includes("functions/invalid-argument") ||
    merged.includes("invalid-argument")
  ) {
    return message.replace(/^.*invalid-argument:?\s*/i, "") || "입력값을 다시 확인해주세요.";
  }

  if (
    merged.includes("functions/failed-precondition") ||
    merged.includes("failed-precondition")
  ) {
    return message.replace(/^.*failed-precondition:?\s*/i, "") || "먼저 인증을 완료해주세요.";
  }

  if (
    merged.includes("functions/permission-denied") ||
    merged.includes("permission-denied")
  ) {
    return message.replace(/^.*permission-denied:?\s*/i, "") || "권한이 유효하지 않아요.";
  }

  if (
    merged.includes("functions/internal") ||
    merged.includes("internal")
  ) {
    return "처리 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.";
  }

  return message || "처리 중 문제가 발생했어요. 다시 시도해주세요.";
}

function StepProgress({ step }) {
  const steps = [
    { number: 1, label: "정보 입력" },
    { number: 2, label: "문자 인증" },
    { number: 3, label: "비밀번호 변경" },
  ];

  return (
    <div className="px-4 pb-4 pt-3">
      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[12px] font-semibold text-violet-600">
            STEP {step} / 3
          </div>
          <div className="text-[12px] text-zinc-500">
            {steps[step - 1]?.label}
          </div>
        </div>

        <div className="pointer-events-none flex items-start">
          {steps.map((item, index) => {
            const isDone = step > item.number;
            const isActive = step === item.number;
            const isLast = index === steps.length - 1;

            return (
              <React.Fragment key={item.number}>
                <div className="flex min-w-0 flex-col items-center">
                  <div
                    className={[
                      "flex h-9 w-9 items-center justify-center rounded-full border text-[13px] font-bold transition",
                      isActive
                        ? "border-violet-600 bg-violet-600 text-white shadow-[0_0_0_4px_rgba(139,92,246,0.12)]"
                        : isDone
                          ? "border-violet-200 bg-violet-50 text-violet-700"
                          : "border-zinc-300 bg-white text-zinc-400",
                    ].join(" ")}
                  >
                    {isDone ? "✓" : item.number}
                  </div>

                  <div
                    className={[
                      "mt-2 whitespace-nowrap text-center text-[12px] font-medium",
                      isActive
                        ? "text-zinc-900"
                        : isDone
                          ? "text-violet-700"
                          : "text-zinc-400",
                    ].join(" ")}
                  >
                    {item.label}
                  </div>
                </div>

                {!isLast ? (
                  <div className="flex min-w-[28px] flex-1 items-center px-2 pt-4">
                    <div
                      className={[
                        "h-[2px] w-full rounded-full",
                        step > item.number ? "bg-violet-500" : "bg-zinc-200",
                      ].join(" ")}
                    />
                  </div>
                ) : null}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, desc, children }) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-4 py-3">
        <div className="text-[15px] font-semibold tracking-[-0.02em] text-zinc-900">
          {title}
        </div>
        {desc ? (
          <p className="mt-1 text-[12px] leading-5 text-zinc-500">{desc}</p>
        ) : null}
      </div>
      <div className="space-y-7 px-4 py-4">{children}</div>
    </section>
  );
}

function FieldBlock({ label, icon, children, hint }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="text-[15px] text-zinc-500">{icon}</div>
        <label className="text-[13px] font-medium text-zinc-700">{label}</label>
      </div>
      {children}
      {hint ? <p className="text-[12px] text-zinc-400">{hint}</p> : null}
    </div>
  );
}

function TextInput({
  type = "text",
  inputMode,
  maxLength,
  autoComplete,
  placeholder,
  value,
  onChange,
  className = "",
}) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      maxLength={maxLength}
      autoComplete={autoComplete}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={[
        "h-12 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 text-[15px] text-zinc-900 outline-none transition",
        "placeholder:text-zinc-400 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100",
        className,
      ].join(" ")}
    />
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  visible,
  onToggle,
}) {
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        autoComplete="new-password"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-12 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 pr-11 text-[15px] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
      />
      <button
        type="button"
        onClick={onToggle}
        style={{ cursor: "pointer" }}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-zinc-800"
      >
        {visible ? <PiEyeSlash className="text-[18px]" /> : <PiEye className="text-[18px]" />}
      </button>
    </div>
  );
}

function PasswordRule({ ok, label }) {
  return (
    <div
      className={[
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium",
        ok ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500",
      ].join(" ")}
    >
      <PiCheckCircleFill className={`text-[12px] ${ok ? "opacity-100" : "opacity-40"}`} />
      <span>{label}</span>
    </div>
  );
}

export default function PasswordResetPhonePage() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [birth, setBirth] = useState("");
  const [phone, setPhone] = useState("");

  const [requestId, setRequestId] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");

  const [code, setCode] = useState("");
  const [remainSec, setRemainSec] = useState(0);

  const [newPassword, setNewPassword] = useState("");
  const [newPasswordCheck, setNewPasswordCheck] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordCheck, setShowPasswordCheck] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [completing, setCompleting] = useState(false);

  const [verificationToken, setVerificationToken] = useState("");

  useEffect(() => {
    if (remainSec <= 0) return;

    const timer = setInterval(() => {
      setRemainSec((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainSec]);

  const passwordChecks = useMemo(() => getPasswordChecks(newPassword), [newPassword]);

  const stepOneValid = useMemo(() => {
    return (
      email.trim() &&
      onlyDigits(birth).length === 8 &&
      onlyDigits(phone).length >= 10
    );
  }, [email, birth, phone]);

  const stepTwoValid = useMemo(() => {
    return code.trim().length === 6;
  }, [code]);

  const stepThreeValid = useMemo(() => {
    const passwordOk =
      passwordChecks.length &&
      passwordChecks.hasLetter &&
      passwordChecks.hasNumber &&
      passwordChecks.noSpace;

    return passwordOk && !!newPasswordCheck && newPassword === newPasswordCheck;
  }, [newPassword, newPasswordCheck, passwordChecks]);

  const handleSendCode = async () => {
    const emailValue = email.trim();
    const birthValue = onlyDigits(birth);
    const phoneValue = onlyDigits(phone);

    if (!emailValue) {
      setError("이메일을 입력해주세요.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setError("이메일 형식을 다시 확인해주세요.");
      return;
    }

    if (birthValue.length !== 8) {
      setError("생년월일 8자리를 입력해주세요.");
      return;
    }

    if (phoneValue.length < 10) {
      setError("휴대폰 번호를 다시 확인해주세요.");
      return;
    }

    try {
      setSendingCode(true);
      setError("");
      setSuccess("");

      const functions = getFunctions(undefined, "asia-northeast3");
      const callable = httpsCallable(functions, "sendPasswordResetCodeByPhone");

      const result = await callable({
        email: emailValue.toLowerCase(),
        birth: birthValue,
        phone: phoneValue,
      });

      const data = result?.data || {};

      setRequestId(data.requestId || "");
      setMaskedPhone(data.maskedPhone || "");
      setRemainSec(data.expiresInSec || 180);
      setCode("");
      setStep(2);
      setSuccess("인증번호를 보냈어요.");
    } catch (e) {
      console.error("[PasswordResetPhonePage] send code error:", e);
      setError(getErrorMessage(e));
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!requestId) {
      setError("인증 요청 정보가 없어요. 처음부터 다시 진행해주세요.");
      return;
    }

    if (!stepTwoValid) {
      setError("인증번호 6자리를 입력해주세요.");
      return;
    }

    try {
      setVerifyingCode(true);
      setError("");
      setSuccess("");

      const functions = getFunctions(undefined, "asia-northeast3");
      const callable = httpsCallable(functions, "verifyPasswordResetCodeByPhone");

      const result = await callable({
        requestId,
        code: code.trim(),
      });

      const data = result?.data || {};

      setVerificationToken(data.verificationToken || "");
      setStep(3);
      setSuccess("본인 확인이 완료되었어요.");
    } catch (e) {
      console.error("[PasswordResetPhonePage] verify code error:", e);
      setError(getErrorMessage(e));
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleComplete = async () => {
    if (!requestId || !verificationToken) {
      setError("인증이 만료되었어요. 다시 진행해주세요.");
      return;
    }

    const passwordOk =
      passwordChecks.length &&
      passwordChecks.hasLetter &&
      passwordChecks.hasNumber &&
      passwordChecks.noSpace;

    if (!passwordOk) {
      setError("비밀번호 조건을 다시 확인해주세요.");
      return;
    }

    if (newPassword !== newPasswordCheck) {
      setError("새 비밀번호 확인이 일치하지 않아요.");
      return;
    }

    try {
      setCompleting(true);
      setError("");
      setSuccess("");

      const functions = getFunctions(undefined, "asia-northeast3");
      const callable = httpsCallable(functions, "completePasswordResetByPhone");

      await callable({
        requestId,
        verificationToken,
        newPassword,
      });

      setSuccess("비밀번호가 재설정되었어요.");

      const isLoggedIn = !!auth?.currentUser?.uid;

      setTimeout(() => {
        if (isLoggedIn) {
          router.replace(APP_HOME_ROUTE);
        } else {
          router.replace("/login");
        }
      }, 900);
    } catch (e) {
      console.error("[PasswordResetPhonePage] complete error:", e);
      setError(getErrorMessage(e));
    } finally {
      setCompleting(false);
    }
  };

  const bottomButtonLabel =
    step === 1
      ? sendingCode
        ? "인증번호 보내는 중..."
        : "인증번호 받기"
      : step === 2
        ? verifyingCode
          ? "확인 중..."
          : "확인"
        : completing
          ? "변경 중..."
          : "완료";

  const bottomButtonDisabled =
    step === 1
      ? !stepOneValid || sendingCode
      : step === 2
        ? !stepTwoValid || verifyingCode
        : !stepThreeValid || completing;

  const handleBottomAction = () => {
    if (step === 1) return handleSendCode();
    if (step === 2) return handleVerifyCode();
    return handleComplete();
  };

  return (
    <div className="min-h-screen bg-zinc-100 md:flex md:items-center md:justify-center md:p-6">
      <div className="flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-white md:h-[860px] md:min-h-0 md:rounded-[24px] md:border md:border-zinc-200 md:shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
        <header className="shrink-0 border-b border-zinc-200 bg-white">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (step > 1) {
                    setStep((prev) => Math.max(1, prev - 1));
                    setError("");
                    setSuccess("");
                    return;
                  }
                  router.back();
                }}
                style={{ cursor: "pointer" }}
                className="flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-slate-100"
              >
                <PiArrowLeft className="text-[19px] text-zinc-800" />
              </button>

              <h1 className="text-[18px] font-bold tracking-[-0.02em] text-zinc-900">
                비밀번호 재설정
              </h1>
            </div>
          </div>

          <StepProgress step={step} />
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-zinc-50 px-4 py-4 pb-[68px]">
          {step === 1 ? (
            <div className="space-y-3">
              <SectionCard
                title="본인 확인"
                desc="가입한 정보와 휴대폰 인증으로 계정을 확인한 뒤 새 비밀번호를 설정해요."
              >
                <FieldBlock
                  label="이메일"
                  icon={<PiEnvelopeSimple />}
                >
                  <TextInput
                    type="email"
                    autoComplete="email"
                    name="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                      setSuccess("");
                    }}
                    placeholder="가입한 이메일을 입력해주세요"
                  />
                </FieldBlock>

                <FieldBlock
                  label="생년월일"
                  icon={<PiCalendarBlank />}
                >
                  <TextInput
                    type="text"
                    inputMode="numeric"
                    autoComplete="bday"
                    name="birthday"
                    maxLength={8}
                    value={birth}
                    onChange={(e) => {
                      setBirth(formatBirthInput(e.target.value));
                      setError("");
                      setSuccess("");
                    }}
                    placeholder="예: 19900101"
                  />
                </FieldBlock>

                <FieldBlock
                  label="휴대폰 번호"
                  icon={<PiPhone />}
                >
                  <TextInput
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    name="phone"
                    maxLength={13}
                    value={formatPhoneInput(phone)}
                    onChange={(e) => {
                      setPhone(onlyDigits(e.target.value).slice(0, 11));
                      setError("");
                      setSuccess("");
                    }}
                    placeholder="휴대폰 번호를 입력해주세요"
                  />
                </FieldBlock>
              </SectionCard>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <SectionCard
                title="문자 인증"
                desc={`${maskedPhone || "등록된 휴대폰"}로 보낸 인증번호 6자리를 입력해주세요.`}
              >
                <FieldBlock
                  label="인증번호"
                  icon={<PiShieldCheckered />}
                  hint={
                    remainSec > 0
                      ? `남은 시간 ${String(Math.floor(remainSec / 60)).padStart(2, "0")}:${String(remainSec % 60).padStart(2, "0")}`
                      : "인증번호 시간이 만료되었어요"
                  }
                >
                  <div className="flex items-center gap-2">
                    <TextInput
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={onlyDigits(code).slice(0, 6)}
                      onChange={(e) => {
                        setCode(onlyDigits(e.target.value).slice(0, 6));
                        setError("");
                        setSuccess("");
                      }}
                      placeholder="6자리 인증번호 입력"
                      className="flex-1"
                    />

                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={sendingCode}
                      style={{ cursor: sendingCode ? "default" : "pointer" }}
                      className="h-12 shrink-0 rounded-md border border-zinc-300 bg-white px-3 text-[13px] font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
                    >
                      재요청
                    </button>
                  </div>
                </FieldBlock>
              </SectionCard>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3">
              <SectionCard
                title="새 비밀번호 설정"
                desc="영문과 숫자를 포함한 새 비밀번호로 변경해주세요."
              >
                <FieldBlock
                  label="계정"
                  icon={<PiEnvelopeSimple />}
                >
                  <div className="flex h-12 items-center rounded-md border border-zinc-300 bg-zinc-100 px-3 text-[14px] font-medium text-zinc-700">
                    {email || "-"}
                  </div>
                </FieldBlock>

                <FieldBlock
                  label="새 비밀번호"
                  icon={<PiLockKey />}
                >
                  <PasswordInput
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError("");
                      setSuccess("");
                    }}
                    placeholder="새 비밀번호를 입력해주세요"
                    visible={showPassword}
                    onToggle={() => setShowPassword((prev) => !prev)}
                  />

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <PasswordRule ok={passwordChecks.length} label="8자 이상" />
                    <PasswordRule ok={passwordChecks.hasLetter} label="영문 포함" />
                    <PasswordRule ok={passwordChecks.hasNumber} label="숫자 포함" />
                    <PasswordRule ok={passwordChecks.noSpace} label="공백 없음" />
                  </div>
                </FieldBlock>

                <FieldBlock
                  label="새 비밀번호 확인"
                  icon={<PiLockKey />}
                >
                  <PasswordInput
                    value={newPasswordCheck}
                    onChange={(e) => {
                      setNewPasswordCheck(e.target.value);
                      setError("");
                      setSuccess("");
                    }}
                    placeholder="새 비밀번호를 다시 입력해주세요"
                    visible={showPasswordCheck}
                    onToggle={() => setShowPasswordCheck((prev) => !prev)}
                  />

                  {newPasswordCheck ? (
                    <div
                      className={`rounded-md px-3 py-2 text-[12px] font-medium ${newPassword === newPasswordCheck
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-500"
                        }`}
                    >
                      {newPassword === newPasswordCheck
                        ? "새 비밀번호가 일치해요."
                        : "새 비밀번호 확인이 일치하지 않아요."}
                    </div>
                  ) : null}
                </FieldBlock>
              </SectionCard>
            </div>
          ) : null}

          {error ? (
            <div className="mt-3 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-600">
              <PiWarningCircleFill className="mt-[1px] shrink-0 text-[15px]" />
              <span>{error}</span>
            </div>
          ) : null}

          {success ? (
            <div className="mt-3 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[13px] text-emerald-700">
              <PiCheckCircleFill className="mt-[1px] shrink-0 text-[15px]" />
              <span>{success}</span>
            </div>
          ) : null}
        </main>

        <div className="shrink-0 border-t border-zinc-200 bg-white px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          <button
            type="button"
            onClick={handleBottomAction}
            disabled={bottomButtonDisabled}
            style={{ cursor: bottomButtonDisabled ? "default" : "pointer" }}
            className="flex h-12 w-full items-center justify-center rounded-md bg-violet-600 text-[15px] font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
          >
            {bottomButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}