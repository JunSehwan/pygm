import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiChevronRight, FiArrowLeft } from "react-icons/fi";
import { getFunctions, httpsCallable } from "firebase/functions";

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

function Overlay({ children, open }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/40 px-4 pb-4 md:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-[390px] overflow-hidden rounded-md bg-white shadow-2xl"
            initial={{ opacity: 0, y: 14, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.99 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Header({ title, onBack }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
      <div className="text-[22px] font-bold tracking-[-0.03em] text-slate-900">
        {title}
      </div>
      <button
        type="button"
        onClick={onBack}
        className="text-slate-700"
      >
        <FiArrowLeft className="text-[24px]" />
      </button>
    </div>
  );
}

function CardButton({ title, desc, buttonText, onClick }) {
  return (
    <div className="rounded-md bg-slate-100 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[16px] font-bold text-slate-800">{title}</div>
          {desc ? (
            <p className="mt-1 whitespace-pre-line text-[13px] leading-5 text-slate-500">
              {desc}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClick}
          className="shrink-0 rounded-md bg-[#6e7ee8] px-4 py-2 text-[15px] font-bold text-white"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

function Toast({ open, message }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="pointer-events-none fixed left-1/2 top-6 z-[12000] -translate-x-1/2"
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <div className="rounded-full border border-black/10 bg-black px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.28)]">
            {message}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function CodeInputRow({ code, setCode, disabled }) {
  const refs = useRef([]);

  useEffect(() => {
    if (refs.current[0]) {
      refs.current[0].focus();
    }
  }, []);

  const handleChange = (index, rawValue) => {
    const onlyNum = String(rawValue || "").replace(/[^0-9]/g, "").slice(-1);

    setCode((prev) => {
      const next = [...prev];
      next[index] = onlyNum;
      return next;
    });

    if (onlyNum && refs.current[index + 1]) {
      refs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && refs.current[index - 1]) {
      refs.current[index - 1].focus();
    }
  };

  return (
    <div className="mt-10 flex items-center justify-between gap-2">
      {code.map((item, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          value={item}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          maxLength={1}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          disabled={disabled}
          className="h-12 w-10 border-b-2 border-slate-800 bg-transparent text-center text-[24px] font-bold text-slate-900 outline-none"
        />
      ))}
    </div>
  );
}

export default function CompanyVerificationFlowModal({
  open,
  currentCompanyEmail = "",
  onClose,
  onComplete,
}) {
  const functions = getFunctions(undefined, "asia-northeast3");

  const [step, setStep] = useState("method");
  const [email, setEmail] = useState(currentCompanyEmail || "");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifiedCompanyName, setVerifiedCompanyName] = useState("");
  const [toast, setToast] = useState({ open: false, message: "" });
  const [verificationToken, setVerificationToken] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep("method");
    setEmail(currentCompanyEmail || "");
    setCode(["", "", "", "", "", ""]);
    setVerifiedCompanyName("");
    setVerificationToken("");
  }, [open, currentCompanyEmail]);

  useEffect(() => {
    if (!toast.open) return;
    const timer = setTimeout(() => {
      setToast({ open: false, message: "" });
    }, 1800);
    return () => clearTimeout(timer);
  }, [toast]);

  const joinedCode = useMemo(() => code.join(""), [code]);

  const handleSendCode = async (targetEmail, toastMessage = "") => {
    try {
      setSending(true);

      const callable = httpsCallable(functions, "sendCompanyVerificationCode");
      const result = await callable({ email: targetEmail });

      const token = result?.data?.verificationToken || "";
      if (!token) {
        throw new Error("verificationToken이 반환되지 않았습니다.");
      }

      setVerificationToken(token);

      if (toastMessage) {
        setToast({
          open: true,
          message: toastMessage,
        });
      }
    } catch (error) {
      console.error("[CompanyVerification] send error full:", error);
      window.alert("인증번호 전송 중 오류가 발생했습니다.");
      throw error;
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    try {
      if (joinedCode.length !== 6) {
        window.alert("인증번호 6자리를 입력해주세요.");
        return;
      }

      setVerifying(true);

      const callable = httpsCallable(functions, "verifyCompanyVerificationCode");
      const result = await callable({
        email,
        code: joinedCode,
        verificationToken,
      });
      const companyNameGuess = result?.data?.companyNameGuess || "";
      setVerifiedCompanyName(companyNameGuess);
      setStep("done");
      if (!verificationToken) {
        window.alert("인증번호를 먼저 받아주세요.");
        return;
      }
    } catch (error) {
      console.error("[CompanyVerification] verify error:", error);

      const message =
        error?.message?.includes("만료")
          ? "인증번호 유효시간이 만료되었습니다. 다시 받아주세요."
          : error?.message?.includes("올바르지")
            ? "인증번호가 올바르지 않습니다."
            : "인증 확인 중 오류가 발생했습니다.";

      window.alert(message);
    } finally {
      setVerifying(false);
    }
  };

  const renderContent = () => {
    if (step === "method") {
      return (
        <>
          <Header title="회사 인증" onBack={onClose} />
          <div className="space-y-4 px-5 py-5">
            <div>
              <div className="text-[20px] font-bold leading-8 text-slate-800">
                회사를 인증하고
                <br />
                더 많은 호감을 받으세요.
              </div>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-slate-600">
                내 프로필에 신뢰를 더해보세요.
                {"\n"}회사 이메일은 인증 목적으로만 사용됩니다.
              </p>
            </div>

            <CardButton
              title="회사 메일"
              // desc="미인증"
              buttonText="인증하기"
              onClick={() => setStep("email")}
            />

            {/* <CardButton
              title="재직증명서 등 증빙첨부"
              desc="직장인: 재직증명서 또는 명함
프리랜서: 사업소득원천징수영수증 또는 소득금액증명 등 증빙서류
대학생: 대학원 재학증명서 등"
              buttonText="인증하기"
              onClick={() => window.alert("이 버전에서는 회사 이메일 인증만 먼저 연결했습니다.")}
            /> */}
          </div>
        </>
      );
    }

    if (step === "email") {
      return (
        <>
          <Header title="회사 인증" onBack={() => setStep("method")} />
          <div className="px-5 py-5">
            <div className="text-[20px] font-bold leading-8 text-slate-800">
              재직중인 회사 이메일 주소를 입력해주세요.
            </div>

            <div className="mt-6 rounded-md bg-slate-100 px-4 py-4">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="회사 이메일 주소입력"
                autoFocus
                className="h-10 w-full bg-transparent text-[16px] text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="mt-28 flex justify-end">
              <button
                type="button"
                disabled={!email.includes("@") || sending}
                onClick={async () => {
                  await handleSendCode(email);
                  setCode(["", "", "", "", "", ""]);
                  setStep("code");
                }}
                className="rounded-md bg-[#6e7ee8] px-6 py-4 text-[16px] font-bold text-white disabled:opacity-50"
              >
                {sending ? "전송중..." : "인증번호 받기"}
              </button>
            </div>
          </div>
        </>
      );
    }

    if (step === "code") {
      return (
        <>
          <Header title="회사 인증" onBack={() => setStep("email")} />
          <div className="px-5 py-5">
            <div className="text-[20px] font-bold leading-8 text-slate-800">
              이메일로 인증번호를 확인해주세요.
            </div>

            <div className="mt-2 break-all text-[18px] font-bold text-[#2444ff] underline">
              {email}
            </div>

            <p className="mt-4 whitespace-pre-line text-[15px] leading-6 text-slate-500">
              이메일은 평균 15초 이내에 도착해요.
              {"\n"}혹시 모르니 스팸함도 확인해주시기 바랍니다.
            </p>

            <CodeInputRow
              code={code}
              setCode={setCode}
              disabled={verifying}
            />

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep("help")}
                className="text-[15px] font-semibold text-[#2444ff] underline"
              >
                인증이메일을 못 받으셨나요?
              </button>

              <button
                type="button"
                disabled={joinedCode.length !== 6 || verifying}
                onClick={handleVerify}
                className="rounded-md bg-[#6e7ee8] px-6 py-4 text-[16px] font-bold text-white disabled:opacity-50"
              >
                {verifying ? "확인중..." : "인증 완료"}
              </button>
            </div>
          </div>
        </>
      );
    }

    if (step === "help") {
      return (
        <>
          <Header title="메일을 못 받으셨나요?" onBack={() => setStep("code")} />
          <div className="px-5 py-5">
            <div className="break-all text-[18px] font-bold text-[#2444ff] underline">
              {email}
            </div>

            <p className="mt-5 text-[20px] font-bold text-slate-700">
              아래 방법 중 하나를 시도 해 보세요.
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                className="flex h-[56px] w-full items-center rounded-md bg-slate-100 px-4 text-left text-[16px] font-bold text-slate-700"
              >
                스팸함 확인
              </button>

              <button
                type="button"
                onClick={async () => {
                  await handleSendCode(email, "인증번호를 다시 보냈습니다.");
                  setCode(["", "", "", "", "", ""]);
                  setStep("code");
                }}
                className="flex h-[56px] w-full items-center justify-between rounded-md bg-slate-100 px-4 text-left text-[16px] font-bold text-slate-500"
              >
                인증번호 다시받기
                <FiChevronRight className="text-[22px]" />
              </button>

              <button
                type="button"
                onClick={() =>
                  window.open("https://open.kakao.com/o/sAJwMNCe", "_blank")
                }
                className="flex h-[56px] w-full items-center justify-between rounded-md bg-slate-100 px-4 text-left text-[16px] font-bold text-slate-500"
              >
                채팅 문의하기
                <FiChevronRight className="text-[22px]" />
              </button>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <Header title="인증 완료" onBack={onClose} />
        <div className="px-5 py-5">
          <div className="text-[20px] font-bold leading-8 text-slate-800">
            인증이 완료되었습니다.
            <br />
            내 프로필의 신뢰가 한층 상승했습니다!
          </div>

          <p className="mt-4 text-[15px] leading-6 text-slate-500">
            회사 이메일은 인증 목적으로만 사용됩니다.
          </p>

          <div className="mt-6 flex items-center gap-3 rounded-md bg-slate-50 px-4 py-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-[28px] text-white">
              ✓
            </div>
            <button
              type="button"
              onClick={() => {
                if (!verifiedCompanyName) return;
                setToast({
                  open: true,
                  message: `${verifiedCompanyName} 자동입력`,
                });
              }}
              className="flex-1 rounded-md bg-[#6e7ee8] px-4 py-4 text-[16px] font-bold text-white"
            >
              회사명 자동입력
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onComplete({
              companyEmail: email,
              companyVerified: true,
              companyNameGuess: verifiedCompanyName,
            });
            onClose();
          }}
          className="h-[58px] w-full bg-black text-[18px] font-bold text-white"
        >
          확인
        </button>
      </>
    );
  };

  return (
    <>
      <Toast open={toast.open} message={toast.message} />
      <Overlay open={open}>{renderContent()}</Overlay>
    </>
  );
}