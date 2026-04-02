import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  PiArrowRightBold,
  PiCheckCircleFill,
  PiLockKeyDuotone,
} from "react-icons/pi";

function formatDate(value) {
  if (!value) return "";

  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value?.seconds
        ? new Date(value.seconds * 1000)
        : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function maskAnswerText(text = "", visibleLength = 30) {
  const safe = String(text || "").trim();
  if (!safe) return "...";
  if (safe.length <= visibleLength) return `${safe}...`;
  return `${safe.slice(0, visibleLength)}...`;
}

function PublicAnswerCard({ item, blurred = false, onLockedClick }) {
  const content =
    item?.questionType === "choice"
      ? item?.selectedOptionText || item?.answerText || ""
      : item?.answerText || item?.selectedOptionText || "";

  return (
    <button
      type="button"
      onClick={blurred ? onLockedClick : undefined}
      style={{ cursor: blurred ? "pointer" : "default" }}
      className={`relative w-full rounded-md border border-slate-200 bg-white px-4 py-4 text-left ${blurred ? "cursor-pointer" : "cursor-default"
        }`}
    >
      <div className={blurred ? "pointer-events-none select-none blur-[6px]" : ""}>
        <div className="flex items-center justify-between gap-3">
          <div className="text-[13px] font-semibold text-violet-600">
            실제 답변
          </div>
          <div className="text-[12px] text-slate-400">
            {formatDate(item?.createdAt)}
          </div>
        </div>

        <div className="mt-3 break-keep text-[15px] leading-7 text-slate-800">
          {blurred ? maskAnswerText(content, 30) : content}
        </div>
      </div>

      {blurred ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-white/45">
          <div className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-slate-800 shadow-sm">
            회원가입 후 전체 보기
          </div>
        </div>
      ) : null}
    </button>
  );
}

function SignupGateModal({ open, onClose, slug }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[360px] rounded-md bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-50 text-violet-600">
          <PiLockKeyDuotone className="text-[22px]" />
        </div>

        <h3 className="mt-4 text-[22px] font-bold tracking-[-0.02em] text-slate-900">
          재미있는 답변이 더 있어요
        </h3>

        <p className="mt-3 break-keep text-[14px] leading-6 text-slate-600">
          차밍수프에서는 실제 사용자들의 반응과 생각을 더 많이 확인할 수 있어요.
          가입하고 전체 답변과 더 많은 차밍카드를 둘러보세요.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-2">
          <Link
            href={`/signup?redirect=${encodeURIComponent(`/topic/${slug}`)}`}
            className="flex h-12 items-center justify-center rounded-md bg-violet-600 text-[15px] font-semibold text-white transition hover:bg-violet-700"
          >
            회원가입하고 전체 보기
          </Link>

          <Link
            href={`/login?redirect=${encodeURIComponent(`/topic/${slug}`)}`}
            className="flex h-12 items-center justify-center rounded-md border border-slate-200 bg-white text-[15px] font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            로그인
          </Link>

          <button
            type="button"
            onClick={onClose}
            style={{ cursor: "pointer" }}
            className="mt-1 text-[13px] font-medium text-slate-500"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingBlock() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 md:bg-[#f6f7fb]">
      <div className="mx-auto max-w-[430px] rounded-md border border-slate-200 bg-white p-6">
        <div className="text-[15px] text-slate-600">불러오는 중...</div>
      </div>
    </main>
  );
}

function NotFoundBlock() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 md:bg-[#f6f7fb]">
      <div className="mx-auto max-w-[430px] rounded-md border border-slate-200 bg-white p-6">
        <h1 className="text-[24px] font-bold text-slate-900">
          공개된 차밍카드를 찾을 수 없어요
        </h1>
        <p className="mt-3 break-keep text-[14px] leading-6 text-slate-600">
          삭제되었거나 비공개로 전환된 카드일 수 있어요.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-2">
          <Link
            href="/"
            className="flex h-11 items-center justify-center rounded-md bg-violet-600 text-[14px] font-semibold text-white"
          >
            홈으로 가기
          </Link>
          <Link
            href="/signup"
            className="flex h-11 items-center justify-center rounded-md border border-slate-200 bg-white text-[14px] font-semibold text-slate-800"
          >
            회원가입
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function PublicTeaserPage({
  slug,
  loading,
  found,
  card,
  answers,
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const teaserCount = Number(card?.teaserAnswerCount || 2);

  const visibleAnswers = useMemo(() => {
    if (!Array.isArray(answers)) return [];
    return answers.slice(0, teaserCount);
  }, [answers, teaserCount]);

  const blurredAnswers = useMemo(() => {
    if (!Array.isArray(answers)) return [];
    return answers.slice(teaserCount);
  }, [answers, teaserCount]);

  if (loading) {
    return <LoadingBlock />;
  }

  if (!found || !card) {
    return <NotFoundBlock />;
  }

  return (
    <>
      <main className="min-h-screen bg-slate-50 md:bg-[#f6f7fb]">
        <div className="relative min-h-screen overflow-hidden">
          <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
            <section className="relative flex min-h-[100dvh] w-full max-w-[430px] flex-col bg-slate-50 md:min-h-[760px] md:rounded-[24px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
              <header className="border-b border-slate-200 bg-white px-4 pb-5 pt-5">
                <div className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-[12px] font-semibold text-violet-700">
                  검색 유입용 공개 차밍카드
                </div>

                <h1 className="mt-4 break-keep text-[30px] font-bold leading-[1.2] tracking-[-0.03em] text-slate-900">
                  {card?.seoTitle || card?.title}
                </h1>

                <p className="mt-4 break-keep text-[15px] leading-7 text-slate-600">
                  {card?.guide || card?.body || card?.seoDescription || ""}
                </p>

                <div className="mt-5 rounded-md bg-[linear-gradient(135deg,#eef2ff_0%,#ffffff_100%)] px-4 py-4">
                  <div className="text-[13px] font-semibold text-violet-700">
                    차밍카드 질문
                  </div>
                  <div className="mt-2 break-keep text-[18px] font-bold leading-8 text-slate-900">
                    {card?.title}
                  </div>
                </div>
              </header>

              <div className="flex-1 px-4 py-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-[20px] font-bold text-slate-900">
                    실제 답변 미리보기
                  </h2>
                  <div className="text-[12px] text-slate-500">
                    일부만 공개돼요
                  </div>
                </div>

                <div className="space-y-3">
                  {visibleAnswers.map((item) => (
                    <PublicAnswerCard key={item.id} item={item} />
                  ))}

                  {blurredAnswers.map((item) => (
                    <PublicAnswerCard
                      key={item.id}
                      item={item}
                      blurred
                      onLockedClick={() => setModalOpen(true)}
                    />
                  ))}
                </div>

                <div className="mt-6 rounded-md border border-violet-100 bg-white px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                      <PiCheckCircleFill className="text-[18px]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[16px] font-bold text-slate-900">
                        차밍수프에서는 이런 답변을 더 볼 수 있어요
                      </div>
                      <p className="mt-2 break-keep text-[14px] leading-6 text-slate-600">
                        소개팅, 썸, 연락, 결혼, 가치관에 대한 실제 반응을 보고
                        티키타카가 맞는 사람을 더 입체적으로 확인할 수 있어요.
                      </p>

                      <div className="mt-4 grid grid-cols-1 gap-2">
                        <Link
                          href={`/signup?redirect=${encodeURIComponent(`/topic/${slug}`)}`}
                          className="flex h-11 items-center justify-center rounded-md bg-violet-600 text-[14px] font-semibold text-white transition hover:bg-violet-700"
                        >
                          회원가입하고 더 보기
                        </Link>

                        <Link
                          href="/tests/style"
                          className="flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-[14px] font-semibold text-slate-800 transition hover:bg-slate-50"
                        >
                          연애스타일 진단 보기
                          <PiArrowRightBold className="text-[14px]" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <SignupGateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        slug={slug}
      />
    </>
  );
}