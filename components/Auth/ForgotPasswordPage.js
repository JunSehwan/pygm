import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  PiArrowLeft,
  PiEnvelopeSimple,
  PiWarningCircleFill,
  PiCheckCircleFill,
  PiLockKeyDuotone,
  PiHeadset,
} from "react-icons/pi";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "firebaseConfig";

function isValidEmail(email = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const canSubmit = useMemo(() => {
    return isValidEmail(email) && !sending;
  }, [email, sending]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }

    if (!isValidEmail(email.trim())) {
      setError("이메일 형식이 올바르지 않아요.");
      return;
    }

    try {
      setSending(true);
      setError("");
      setSent(false);

      auth.languageCode = "ko";
      await sendPasswordResetEmail(auth, email.trim());

      setSent(true);
    } catch (err) {
      console.error("[ForgotPasswordPage] send reset error:", err);

      if (err?.code === "auth/user-not-found" || err?.code === "auth/invalid-email") {
        setError("가입된 이메일인지 다시 확인해주세요.");
      } else if (err?.code === "auth/too-many-requests") {
        setError("시도가 많아요. 잠시 후 다시 시도해주세요.");
      } else {
        setError("재설정 메일 발송 중 문제가 발생했어요.");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col bg-white">
        <header className="shrink-0 border-b border-zinc-200 bg-white px-5 pb-5 pt-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              style={{ cursor: "pointer" }}
              className="flex h-10 w-10 items-center justify-center rounded-md transition hover:bg-slate-100"
            >
              <PiArrowLeft className="text-[20px] text-zinc-800" />
            </button>

            <div>
              <div className="text-[20px] font-bold tracking-[-0.02em] text-zinc-900">
                비밀번호 찾기
              </div>
              <div className="mt-0.5 text-[13px] text-zinc-500">
                가입 이메일로 재설정 링크를 보내드려요
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-md bg-gradient-to-br from-violet-600 via-violet-500 to-fuchsia-400 p-[1px]">
            <div className="rounded-md bg-gradient-to-br from-violet-600 via-violet-500 to-fuchsia-400 px-5 py-5 text-white">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                  <PiLockKeyDuotone className="text-[22px] text-white" />
                </div>

                <div className="min-w-0">
                  <div className="text-[21px] font-bold tracking-[-0.03em] leading-[1.3]">
                    비밀번호가
                    <br />
                    기억나지 않나요?
                  </div>
                  <p className="mt-2 break-keep text-[13px] leading-6 text-white/90">
                    가입한 이메일을 입력하면
                    <br />
                    비밀번호를 다시 설정할 수 있어요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-5 pb-8 pt-6">
          <div className="rounded-md border border-violet-100 bg-violet-50 px-4 py-4">
            <div className="text-[15px] font-semibold text-zinc-900">
              가입한 이메일을 입력해주세요
            </div>
            <p className="mt-2 break-keep text-[14px] leading-6 text-zinc-600">
              메일 안의 링크를 눌러
              <br />
              새 비밀번호를 설정할 수 있어요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6">
            <label className="mb-2 block text-[14px] font-semibold text-zinc-800">
              이메일
            </label>

            <div className="flex h-12 items-center gap-3 rounded-md border border-zinc-200 bg-white px-4 focus-within:border-violet-500">
              <PiEnvelopeSimple className="shrink-0 text-[18px] text-zinc-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                  setSent(false);
                }}
                placeholder="가입한 이메일을 입력해주세요"
                className="h-full w-full bg-transparent text-[15px] text-zinc-900 outline-none placeholder:text-zinc-400"
              />
            </div>

            {error ? (
              <div className="mt-2 flex items-start gap-2 text-[13px] text-rose-500">
                <PiWarningCircleFill className="mt-[1px] shrink-0 text-[15px]" />
                <span>{error}</span>
              </div>
            ) : null}

            {sent ? (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
                <PiCheckCircleFill className="mt-[1px] shrink-0 text-[15px]" />
                <span>
                  재설정 메일을 보냈어요.
                  <br />
                  받은 편지함과 스팸함을 확인해주세요.
                </span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              style={{ cursor: canSubmit ? "pointer" : "default" }}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-md bg-violet-600 text-[15px] font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
            >
              {sending ? "발송 중..." : "재설정 메일 보내기"}
            </button>
          </form>

          <div className="mt-6 rounded-md border border-zinc-200 bg-white p-4">
            <div className="text-[14px] font-semibold text-zinc-900">
              이메일이 기억나지 않나요?
            </div>

            <button
              type="button"
              onClick={() =>
                window.open(
                  "https://open.kakao.com/o/sAJwMNCe",
                  "_blank",
                  "noopener,noreferrer"
                )
              }
              style={{ cursor: "pointer" }}
              className="mt-3 flex items-center gap-2 text-left text-[14px] font-medium text-zinc-600"
            >
              <PiHeadset className="text-[16px]" />
              고객센터로 문의하기
            </button>
          </div>

          <div className="mt-6 text-center text-[14px] text-zinc-500">
            다시 로그인하러 가기{" "}
            <Link href="/login" className="font-semibold text-violet-600">
              로그인
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}