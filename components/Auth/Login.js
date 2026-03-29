import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  PiArrowLeft,
  PiEnvelopeSimple,
  PiLockKey,
  PiWarningCircleFill,
  PiHeadset,
  PiSparkleDuotone,
  PiHeartStraightFill,
  PiCheckCircleFill,
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

export default function Login() {
  const router = useRouter();
  const emailInputRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  const canSubmit = useMemo(() => {
    return !!email.trim() && !!password.trim() && !loading;
  }, [email, password, loading]);

  const setField = useCallback((key, value) => {
    if (key === "email") setEmail(value);
    if (key === "password") setPassword(value);

    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSubmitError("");
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
      e.preventDefault();

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

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col bg-white">
        <header className="shrink-0 border-b border-zinc-200 bg-white px-5 pb-5 pt-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/")}
              style={{ cursor: "pointer" }}
              className="flex h-10 w-10 items-center justify-center rounded-md transition hover:bg-slate-100"
            >
              <PiArrowLeft className="text-[20px] text-zinc-800" />
            </button>

            <div>
              <div className="text-[20px] font-bold tracking-[-0.02em] text-zinc-900">
                로그인
              </div>
              <div className="mt-0.5 text-[13px] text-zinc-500">
                다시 돌아오신 걸 환영해요
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-md bg-gradient-to-br from-violet-600 via-violet-500 to-fuchsia-400 p-[1px]">
            <div className="relative rounded-md bg-gradient-to-br from-violet-600 via-violet-500 to-fuchsia-400 px-5 py-5 text-white">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-8 left-[-10px] h-24 w-24 rounded-full bg-pink-200/20 blur-2xl" />

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold text-white/95 backdrop-blur-sm">
                    <PiSparkleDuotone className="text-[14px]" />
                    CharmingSoup
                  </div>

                  <div className="mt-3 text-[22px] font-bold tracking-[-0.03em] leading-[1.3]">
                    다시 이어지는
                    <br />
                    당신의 연결
                  </div>

                  <p className="mt-3 break-keep text-[13px] leading-6 text-white/90">
                    가입한 이메일로 로그인하고
                    <br />
                    매칭과 프로필 흐름을 이어가보세요.
                  </p>
                </div>

                <div className="shrink-0 rounded-2xl bg-white/14 p-3 backdrop-blur-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12">
                    <PiHeartStraightFill className="text-[22px] text-white" />
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-md bg-white/12 px-3 py-2 backdrop-blur-sm">
                  <div className="text-[11px] font-medium text-white/75">프로필</div>
                  <div className="mt-1 text-[13px] font-semibold text-white">
                    나답게 소개
                  </div>
                </div>

                <div className="rounded-md bg-white/12 px-3 py-2 backdrop-blur-sm">
                  <div className="text-[11px] font-medium text-white/75">매칭</div>
                  <div className="mt-1 text-[13px] font-semibold text-white">
                    더 자연스럽게 연결
                  </div>
                </div>

                <div className="rounded-md bg-white/12 px-3 py-2 backdrop-blur-sm">
                  <div className="text-[11px] font-medium text-white/75">차밍카드</div>
                  <div className="mt-1 text-[13px] font-semibold text-white">
                    가치관부터 확인
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-5 pb-8 pt-6">
          <div className="rounded-md border border-violet-100 bg-violet-50 px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white">
                <PiCheckCircleFill className="text-[20px] text-violet-600" />
              </div>

              <div className="min-w-0">
                <div className="text-[16px] font-semibold text-zinc-900">
                  차밍수프 계정으로 로그인
                </div>
                <p className="mt-2 break-keep text-[14px] leading-6 text-zinc-600">
                  회원가입 때 사용한 이메일과 비밀번호로
                  <br />
                  바로 로그인할 수 있어요.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-[14px] font-semibold text-zinc-800">
                이메일
              </label>
              <div className="flex h-12 items-center gap-3 rounded-md border border-zinc-200 bg-white px-4 transition focus-within:border-violet-500">
                <PiEnvelopeSimple className="shrink-0 text-[18px] text-zinc-400" />
                <input
                  ref={emailInputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="가입한 이메일을 입력해주세요"
                  className="h-full w-full bg-transparent text-[15px] text-zinc-900 outline-none placeholder:text-zinc-400"
                />
              </div>
              {fieldErrors.email ? (
                <div className="mt-2 flex items-start gap-2 text-[13px] text-rose-500">
                  <PiWarningCircleFill className="mt-[1px] shrink-0 text-[15px]" />
                  <span>{fieldErrors.email}</span>
                </div>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-[14px] font-semibold text-zinc-800">
                비밀번호
              </label>
              <div className="flex h-12 items-center gap-3 rounded-md border border-zinc-200 bg-white px-4 transition focus-within:border-violet-500">
                <PiLockKey className="shrink-0 text-[18px] text-zinc-400" />
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder="비밀번호를 입력해주세요"
                  className="h-full w-full bg-transparent text-[15px] text-zinc-900 outline-none placeholder:text-zinc-400"
                />
              </div>
              {fieldErrors.password ? (
                <div className="mt-2 flex items-start gap-2 text-[13px] text-rose-500">
                  <PiWarningCircleFill className="mt-[1px] shrink-0 text-[15px]" />
                  <span>{fieldErrors.password}</span>
                </div>
              ) : null}
            </div>

            {submitError ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] leading-5 text-rose-600">
                {submitError}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              style={{ cursor: canSubmit ? "pointer" : "default" }}
              className="flex h-12 w-full items-center justify-center rounded-md bg-violet-600 text-[15px] font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <div className="mt-6 rounded-md border border-zinc-200 bg-white p-4">
            <div className="text-[14px] font-semibold text-zinc-900">
              도움이 필요하신가요?
            </div>

            <div className="mt-3 flex flex-col gap-3">
              <Link
                href="/password/forgot"
                className="text-[14px] font-medium text-violet-600"
              >
                비밀번호 찾기
              </Link>

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
                className="flex items-center gap-2 text-left text-[14px] font-medium text-zinc-600"
              >
                <PiHeadset className="text-[16px]" />
                가입 이메일이 기억나지 않나요? 고객센터로 문의하기
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-[14px] text-zinc-500">
            아직 계정이 없다면{" "}
            <Link href="/signup" className="font-semibold text-violet-600">
              회원가입
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}