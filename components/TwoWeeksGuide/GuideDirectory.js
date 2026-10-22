import { useMemo, useState } from "react";
import {
  FiCalendar,
  FiChevronDown,
  FiCoffee,
  FiEdit3,
  FiHeart,
  FiLock,
  FiMessageCircle,
  FiSearch,
  FiShield,
  FiUser,
  FiX,
} from "react-icons/fi";
import { GUIDE_CATEGORIES } from "./guideData";

const CATEGORY_ICONS = {
  heart: FiHeart,
  edit: FiEdit3,
  user: FiUser,
  calendar: FiCalendar,
  coffee: FiCoffee,
  message: FiMessageCircle,
  shield: FiShield,
  lock: FiLock,
};

function getSearchText(category, article) {
  return [
    category.title,
    category.summary,
    article.title,
    article.lead,
    ...(article.items || []),
    article.note || "",
  ]
    .join(" ")
    .toLocaleLowerCase("ko-KR");
}

function Article({ article, forceOpen = false }) {
  return (
    <details
      id={article.id}
      open={forceOpen || undefined}
      className="group scroll-mt-28 rounded-[22px] border border-slate-200 bg-white px-5 py-1 shadow-[0_12px_34px_rgba(15,23,42,0.035)] md:px-6"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left marker:content-none">
        <span className="break-keep text-base font-black tracking-[-0.035em] text-slate-950 md:text-lg">
          {article.title}
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition group-open:rotate-180 group-open:bg-slate-950 group-open:text-white">
          <FiChevronDown aria-hidden="true" />
        </span>
      </summary>
      <div className="border-t border-slate-100 pb-6 pt-5">
        <p className="break-keep text-sm font-semibold leading-7 text-slate-700 md:text-[15px] md:leading-8">
          {article.lead}
        </p>
        {article.items?.length ? (
          <ul className="mt-4 space-y-2.5">
            {article.items.map((item) => (
              <li key={item} className="flex gap-2.5 break-keep text-sm font-medium leading-6 text-slate-600">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#d85b48]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {article.note ? (
          <div className="mt-5 rounded-2xl bg-[#fff8f6] px-4 py-3 text-xs font-bold leading-6 text-[#8e3a2e] md:text-sm">
            {article.note}
          </div>
        ) : null}
      </div>
    </details>
  );
}

export default function GuideDirectory({ supportUrl }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");

  const matches = useMemo(() => {
    if (!normalizedQuery) return [];

    return GUIDE_CATEGORIES.flatMap((category) =>
      category.articles
        .filter((article) => getSearchText(category, article).includes(normalizedQuery))
        .map((article) => ({ category, article }))
    );
  }, [normalizedQuery]);

  return (
    <section id="guide" className="bg-white py-16 md:py-24">
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black tracking-[0.1em] text-[#d85b48]">투윅스 이용안내</p>
          <h2 className="mt-3 break-keep text-[32px] font-black leading-[1.18] tracking-[-0.055em] text-slate-950 md:text-5xl">
            무엇이 궁금하신가요?
          </h2>
          <p className="mt-4 break-keep text-base font-medium leading-8 text-slate-600 md:text-lg">
            검색하거나 아래 주제를 선택하면 실제 진행 순서와 기준을 확인할 수 있습니다.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-3xl">
          <label htmlFor="twoweeks-guide-search" className="sr-only">
            투윅스 이용안내 검색
          </label>
          <div className="relative">
            <FiSearch
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-xl text-slate-400"
              aria-hidden="true"
            />
            <input
              id="twoweeks-guide-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="예: 사진, 일정, 연락처, 예치금, 탈퇴"
              className="h-16 w-full rounded-2xl border border-slate-300 bg-white pl-14 pr-14 text-base font-bold text-slate-950 shadow-[0_16px_50px_rgba(15,23,42,0.08)] outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-[#d85b48] focus:ring-4 focus:ring-[#d85b48]/10"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="검색어 지우기"
                className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                <FiX aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>

        {!normalizedQuery ? (
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {GUIDE_CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category.icon] || FiHeart;
              return (
                <a
                  key={category.id}
                  href={`#guide-${category.id}`}
                  className="group rounded-[22px] border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-[#d85b48]/40 hover:shadow-[0_18px_48px_rgba(15,23,42,0.08)]"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff0ec] text-lg text-[#d85b48] transition group-hover:bg-[#d85b48] group-hover:text-white">
                    <Icon aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-lg font-black tracking-[-0.04em] text-slate-950">
                    {category.title}
                  </h3>
                  <p className="mt-2 break-keep text-sm font-medium leading-6 text-slate-600">
                    {category.summary}
                  </p>
                  <div className="mt-4 text-xs font-black text-[#d85b48]">
                    안내 {category.articles.length}개 보기
                  </div>
                </a>
              );
            })}
          </div>
        ) : null}

        {normalizedQuery ? (
          <div className="mx-auto mt-12 max-w-4xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h3 className="text-xl font-black tracking-[-0.04em] text-slate-950">
                검색 결과 {matches.length}개
              </h3>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-sm font-black text-[#d85b48] underline underline-offset-4"
              >
                전체 안내 보기
              </button>
            </div>
            {matches.length ? (
              <div className="space-y-3">
                {matches.map(({ category, article }) => (
                  <div key={article.id}>
                    <div className="mb-2 px-1 text-[11px] font-black tracking-[0.08em] text-slate-400">
                      {category.title}
                    </div>
                    <Article article={article} forceOpen />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                <div className="text-xl font-black tracking-[-0.04em] text-slate-950">
                  일치하는 안내를 찾지 못했어요.
                </div>
                <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
                  다른 단어로 검색하거나 운영자에게 편하게 문의해주세요.
                </p>
                <a
                  href={supportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-black text-white"
                >
                  카카오톡으로 문의하기
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-20 space-y-20">
            {GUIDE_CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category.icon] || FiHeart;
              return (
                <section
                  key={category.id}
                  id={`guide-${category.id}`}
                  className="scroll-mt-28"
                  aria-labelledby={`guide-title-${category.id}`}
                >
                  <div className="grid gap-7 lg:grid-cols-[0.34fr_0.66fr] lg:gap-14">
                    <div className="lg:sticky lg:top-28 lg:self-start">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0ec] text-xl text-[#d85b48]">
                        <Icon aria-hidden="true" />
                      </span>
                      <h3
                        id={`guide-title-${category.id}`}
                        className="mt-5 text-2xl font-black tracking-[-0.05em] text-slate-950 md:text-3xl"
                      >
                        {category.title}
                      </h3>
                      <p className="mt-3 max-w-sm break-keep text-sm font-medium leading-7 text-slate-600">
                        {category.summary}
                      </p>
                    </div>
                    <div className="space-y-3">
                      {category.articles.map((article) => (
                        <Article key={article.id} article={article} />
                      ))}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
