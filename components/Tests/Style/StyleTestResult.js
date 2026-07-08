import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FiRefreshCcw,
  FiHeart,
  FiCheckCircle,
  FiShare2,
  FiUserPlus,
  FiMessageCircle,
} from "react-icons/fi";
import { SiKakaotalk, SiFacebook, SiInstagram } from "react-icons/si";
import { typeMetaMap } from "data/tests/styleQuestions";

const AXIS_CODE_META = {
  DT: {
    title: "다정 ↔ 무심",
    letters: {
      D: {
        label: "다정",
        short: "감정 표현과 애정 표현이 비교적 따뜻한 편",
      },
      T: {
        label: "무심",
        short: "표현은 적어도 행동과 안정감으로 보여주는 편",
      },
    },
  },
  SM: {
    title: "직진 ↔ 신중",
    letters: {
      S: {
        label: "직진",
        short: "호감이 생기면 비교적 빠르게 다가가는 편",
      },
      M: {
        label: "신중",
        short: "확신이 생길 때까지 천천히 보는 편",
      },
    },
  },
  LF: {
    title: "주도 ↔ 맞춤",
    letters: {
      L: {
        label: "주도",
        short: "관계 흐름과 방향을 비교적 이끄는 편",
      },
      F: {
        label: "맞춤",
        short: "상대 흐름을 보며 조율하고 맞춰가는 편",
      },
    },
  },
  RP: {
    title: "로맨틱 ↔ 현실",
    letters: {
      R: {
        label: "로맨틱",
        short: "설렘, 분위기, 감정의 결을 중요하게 보는 편",
      },
      P: {
        label: "현실",
        short: "신뢰, 안정, 생활 궁합을 더 중요하게 보는 편",
      },
    },
  },
};

function SectionTitle({ icon, title, right }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        {icon ? <div className="text-[16px] text-violet-500">{icon}</div> : null}
        <h3 className="text-[15px] font-bold text-slate-900">{title}</h3>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function TypeMiniCard({ type, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-md border p-3 text-left transition",
        active
          ? "border-violet-500 bg-violet-50 shadow-[0_10px_24px_rgba(139,92,246,0.10)]"
          : "border-slate-200 bg-white hover:border-violet-200 hover:bg-slate-50",
      ].join(" ")}
      style={{ cursor: "pointer" }}
    >
      <div className="mb-2 overflow-hidden rounded-md border border-slate-200 bg-white">
        <img
          src={type.image}
          alt={type.ko}
          className="h-[88px] w-full object-contain bg-white"
        />
      </div>

      <div className="text-[11px] font-bold text-violet-500">{type.code}</div>
      <div className="mt-1 break-keep text-[16px] font-bold leading-5 text-slate-900">
        {type.ko}
      </div>
      <div className="mt-1 break-keep text-[12px] leading-5 text-slate-500">
        {type.oneLine}
      </div>
    </button>
  );
}

function ExploreTopSelector({ allTypes, activeExploreCode, setActiveExploreCode }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-0 py-4">
      <SectionTitle
        title="다른 유형 선택"
        right={
          <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            16가지 유형
          </div>
        }
      />

      <p className="mt-2 break-keep text-[13px] leading-6 text-slate-500">
        궁금한 유형을 먼저 고르고, 아래에서 자세한 설명을 확인해보세요.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {allTypes.map((type) => (
          <TypeMiniCard
            key={type.code}
            type={type}
            active={type.code === activeExploreCode}
            onClick={() => setActiveExploreCode(type.code)}
          />
        ))}
      </div>
    </div>
  );
}

function AxisStrengthCard({ item }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
      <div className="text-[12px] font-semibold text-slate-400">{item.label}</div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="break-keep text-[17px] font-bold leading-6 text-slate-900">
          {item.selectedLabel}
        </div>
        <div className="shrink-0 text-[11px] font-semibold text-violet-500">
          {item.strengthText}
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-400">
          <span>{item.leftLabel}</span>
          <span>{item.rightLabel}</span>
        </div>

        <div className="relative flex h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-violet-300 to-violet-500 transition-all duration-500"
            style={{ width: `${item.leftPercent}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-slate-300 to-slate-400 transition-all duration-500"
            style={{ width: `${item.rightPercent}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[12px] font-semibold">
          <span className="text-violet-600">
            {item.leftLabel} {item.leftPercent}%
          </span>
          <span className="text-slate-500">
            {item.rightLabel} {item.rightPercent}%
          </span>
        </div>
      </div>
    </div>
  );
}

function ResultSummaryCard({ finalType }) {
  return (
    <div
      className={`rounded-md bg-gradient-to-br ${finalType.meta.color} p-[1px] shadow-[0_18px_40px_rgba(139,92,246,0.12)]`}
    >
      <div className="rounded-md bg-white px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-[12px] font-bold text-violet-600">
            {finalType.meta.code}
          </div>

          <div className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-semibold text-slate-600">
            대표 유형
          </div>
        </div>

        <div className="mt-4">
          <div className="text-[13px] font-medium text-slate-500">
            당신의 스타일은
          </div>

          <div className="mt-2 break-keep text-[24px] font-bold leading-8 text-slate-900">
            {finalType.meta.ko}
          </div>

          <div className="mt-2 break-keep text-[14px] leading-7 text-slate-600">
            {finalType.meta.oneLine}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-md border border-slate-200 bg-white">
          <img
            src={finalType.meta.image}
            alt={finalType.meta.ko}
            className="h-[220px] w-full object-contain bg-white sm:h-[250px]"
          />
        </div>

        <p className="mt-4 break-keep whitespace-normal text-[14px] leading-7 text-slate-600">
          {finalType.meta.summary}
        </p>

        {finalType.balanceBadges.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {finalType.balanceBadges.map((badge) => (
              <div
                key={badge}
                className="rounded-full bg-amber-50 px-3 py-1 text-[12px] font-semibold text-amber-700"
              >
                {badge}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TypeCodeMeaningCard({ finalType }) {
  const letterRows = [
    {
      axis: "DT",
      letter: finalType?.axisLetters?.DT || "",
    },
    {
      axis: "SM",
      letter: finalType?.axisLetters?.SM || "",
    },
    {
      axis: "LF",
      letter: finalType?.axisLetters?.LF || "",
    },
    {
      axis: "RP",
      letter: finalType?.axisLetters?.RP || "",
    },
  ].map((item) => {
    const axisMeta = AXIS_CODE_META[item.axis];
    const letterMeta = axisMeta?.letters?.[item.letter] || {
      label: item.letter,
      short: "",
    };

    return {
      ...item,
      axisTitle: axisMeta?.title || "",
      label: letterMeta.label,
      short: letterMeta.short,
    };
  });

  const fullMeaning = letterRows
    .map((row) => row.label)
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="rounded-md border border-violet-200 bg-violet-50 px-4 py-4">
      <SectionTitle
        title="유형 코드 해석"
      // right={
      //   <div className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
      //     {finalType.meta.code} 읽는 법
      //   </div>
      // }
      />

      <div className="mt-3 rounded-md border border-violet-200 bg-white px-4 py-3">
        <div className="text-[12px] font-semibold text-slate-400">내 코드</div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {finalType.meta.code.split("").map((letter, index) => (
            <div
              key={`${letter}-${index}`}
              className="inline-flex h-10 min-w-[40px] items-center justify-center rounded-md bg-violet-600 px-3 text-[18px] font-bold text-white shadow-sm"
            >
              {letter}
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-md border border-violet-100 bg-violet-50 px-4 py-3">
          <div className="text-[12px] font-semibold text-violet-500">전체 해석</div>
          <div className="mt-1 break-keep text-[17px] font-bold leading-6 text-slate-900">
            {fullMeaning}
          </div>
          <p className="mt-2 break-keep text-[13px] leading-6 text-slate-600">
            즉, <span className="font-semibold text-violet-600">{finalType.meta.code}</span>는{" "}
            <span className="font-semibold text-slate-900">{fullMeaning}</span> 쪽 성향이
            조합된 연애 스타일을 뜻해요.
          </p>
        </div>

        <p className="mt-3 break-keep text-[13px] leading-6 text-slate-600">
          알파벳은 각 성향 축에서 당신이 조금 더 가까운 방향을 뜻해요.
          <br />
          좋고 나쁨이 아니라 연애 스타일의 방향과 결을 보여주는 코드예요.
        </p>
      </div>

      <div className="mt-3 space-y-2.5">
        {letterRows.map((row) => (
          <div
            key={row.axis}
            className="rounded-md border border-slate-200 bg-white px-4 py-3"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-violet-100 text-[18px] font-bold text-violet-700">
                {row.letter}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[16px] font-bold text-slate-900">
                    {row.label}
                  </span>
                  <span className="text-[12px] font-semibold text-slate-400">
                    {row.axisTitle}
                  </span>
                </div>

                <p className="mt-1 break-keep text-[13px] leading-6 text-slate-600">
                  {row.short}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StrengthAndCautionCard({ strengths, caution }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
        <div className="text-[12px] font-semibold text-slate-400">강점</div>
        <div className="mt-3 space-y-2">
          {strengths.map((item) => (
            <div
              key={item}
              className="flex items-start gap-2 text-[14px] leading-6 text-slate-700"
            >
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
              <span className="break-keep">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-4">
        <div className="text-[12px] font-semibold text-amber-700">주의 포인트</div>
        <div className="mt-3 break-keep text-[14px] leading-7 text-amber-900">
          {caution}
        </div>
      </div>
    </div>
  );
}

function normalizeTypeDistribution(typeDistribution = [], finalTypeCode = "") {
  const safeList = Array.isArray(typeDistribution) ? typeDistribution : [];
  const totalCount = safeList.reduce(
    (sum, item) => sum + (Number(item.count) > 0 ? Number(item.count) : 0),
    0
  );

  const normalized = safeList.map((item) => {
    const count = Number(item.count) > 0 ? Number(item.count) : 0;
    const percent =
      typeof item.percent === "number"
        ? item.percent
        : totalCount > 0
          ? Number(((count / totalCount) * 100).toFixed(1))
          : 0;

    return {
      ...item,
      count,
      percent,
      isMine: item.code === finalTypeCode,
    };
  });

  return {
    totalCount,
    items: normalized.sort((a, b) => {
      if (a.code === finalTypeCode) return -1;
      if (b.code === finalTypeCode) return 1;
      return b.percent - a.percent;
    }),
  };
}

function buildChartItems(items = [], finalTypeCode = "") {
  const palette = [
    "#8B5CF6",
    "#A78BFA",
    "#C4B5FD",
    "#DDD6FE",
    "#7C3AED",
    "#6D28D9",
    "#64748B",
    "#94A3B8",
    "#CBD5E1",
    "#475569",
    "#8B5CF6",
    "#A78BFA",
    "#C4B5FD",
    "#64748B",
    "#94A3B8",
    "#CBD5E1",
  ];

  let cursor = 0;

  return items.map((item, index) => {
    const safePercent = Number(item.percent) > 0 ? Number(item.percent) : 0;
    const start = cursor;
    const end = cursor + safePercent;
    cursor = end;

    return {
      ...item,
      start,
      end,
      color:
        item.code === finalTypeCode
          ? "#7C3AED"
          : palette[index % palette.length],
    };
  });
}

function TypeDistributionCard({ finalType, typeDistribution }) {
  const { totalCount, items } = useMemo(
    () => normalizeTypeDistribution(typeDistribution, finalType.meta.code),
    [typeDistribution, finalType.meta.code]
  );

  const visibleItems = useMemo(() => {
    const filtered = items.filter((item) => item.count > 0);
    if (!filtered.length) return items.slice(0, 1);
    return filtered;
  }, [items]);

  const chartItems = useMemo(
    () => buildChartItems(visibleItems, finalType.meta.code),
    [visibleItems, finalType.meta.code]
  );

  const myTypeItem =
    chartItems.find((item) => item.code === finalType.meta.code) || null;

  const topItems = chartItems
    .slice()
    .sort((a, b) => {
      if (a.code === finalType.meta.code) return -1;
      if (b.code === finalType.meta.code) return 1;
      return b.percent - a.percent;
    })
    .slice(0, 6);

  const donutBackground = chartItems.length
    ? `conic-gradient(${chartItems
      .map((item) => `${item.color} ${item.start}% ${item.end}%`)
      .join(", ")})`
    : "conic-gradient(#E2E8F0 0% 100%)";

  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
      <SectionTitle
        title="전체 테스트 결과 분포"
        right={
          <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            총 {totalCount}명
          </div>
        }
      />

      <p className="mt-2 break-keep text-[13px] leading-6 text-slate-500">
        지금까지 완료된 테스트 결과 기준으로 유형 비중을 한눈에 볼 수 있어요.
      </p>

      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-5">
        <div className="flex flex-col items-center">
          <div
            className="relative h-[220px] w-[220px] rounded-full"
            style={{ background: donutBackground }}
          >
            <div className="absolute left-1/2 top-1/2 flex h-[132px] w-[132px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
              <div className="text-[11px] font-medium text-slate-400">내 유형</div>
              <div className="mt-1 text-[14px] font-bold text-violet-600">
                {finalType.meta.code}
              </div>
              <div className="mt-1 break-keep px-2 text-[15px] font-bold leading-5 text-slate-900">
                {finalType.meta.ko}
              </div>
              <div className="mt-1 text-[13px] font-semibold text-slate-500">
                {myTypeItem ? `${myTypeItem.percent}%` : "0%"}
              </div>
            </div>
          </div>

          <div className="mt-5 w-full rounded-md border border-violet-200 bg-violet-50 px-4 py-3">
            <div className="text-[12px] font-medium text-violet-600">내 유형 비중</div>
            <div className="mt-1 break-keep text-[16px] font-bold leading-6 text-slate-900">
              {finalType.meta.ko}
            </div>
            <div className="mt-1 text-[13px] leading-6 text-slate-600">
              전체 테스트 완료 결과 중{" "}
              <span className="font-bold text-violet-600">
                {myTypeItem ? `${myTypeItem.percent}%` : "0%"}
              </span>
              가 이 유형이에요.
            </div>
          </div>

          <div className="mt-4 w-full space-y-2">
            {topItems.map((item) => (
              <div
                key={item.code}
                className={[
                  "flex items-center justify-between rounded-md border px-3 py-2.5",
                  item.code === finalType.meta.code
                    ? "border-violet-200 bg-white"
                    : "border-slate-200 bg-white",
                ].join(" ")}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-slate-900">
                        {item.code}
                      </span>
                      {item.code === finalType.meta.code ? (
                        <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                          내 결과
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-0.5 break-keep text-[13px] font-semibold leading-5 text-slate-700">
                      {item.ko}
                    </div>

                    <div className="mt-0.5 truncate text-[11px] text-slate-400">
                      {item.oneLine}
                    </div>
                  </div>
                </div>

                <div className="ml-3 shrink-0 text-right">
                  <div className="text-[14px] font-bold text-slate-900">
                    {item.percent}%
                  </div>
                  <div className="text-[11px] text-slate-400">{item.count}명</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareCard({ isLoggedIn, onShare, onSignup }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
      <SectionTitle
        icon={<FiShare2 />}
        title="결과 공유"
        right={
          <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            친구에게 보내기
          </div>
        }
      />

      <p className="mt-2 break-keep text-[13px] leading-6 text-slate-500">
        내 결과를 공유하고 친구도 테스트해보게 해보세요.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onShare("system")}
          className="flex h-[48px] items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-[14px] font-semibold text-slate-700 transition hover:bg-slate-50"
          style={{ cursor: "pointer" }}
        >
          <FiShare2 className="text-[16px]" />
          테스트 공유
        </button>

        {!isLoggedIn ? (
          <button
            type="button"
            onClick={onSignup}
            className="flex h-[48px] items-center justify-center gap-2 rounded-md border border-violet-200 bg-violet-50 text-[14px] font-semibold text-violet-600 transition hover:bg-violet-100"
            style={{ cursor: "pointer" }}
          >
            <FiUserPlus className="text-[16px]" />
            가입하고 저장
          </button>
        ) : (
          <div className="flex h-[48px] items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-[13px] font-semibold text-emerald-600">
            결과가 저장되었어요
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => onShare("kakao")}
          className="flex h-[42px] items-center justify-center gap-1 rounded-md bg-slate-100 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-200"
          style={{ cursor: "pointer" }}
        >
          <SiKakaotalk className="text-[15px] text-[#b9ae46]" />
          카카오
        </button>

        <button
          type="button"
          onClick={() => onShare("instagram")}
          className="flex h-[42px] items-center justify-center gap-1 rounded-md bg-slate-100 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-200"
          style={{ cursor: "pointer" }}
        >
          <SiInstagram className="text-[15px] text-[#E4405F]" />
          인스타
        </button>

        <button
          type="button"
          onClick={() => onShare("facebook")}
          className="flex h-[42px] items-center justify-center gap-1 rounded-md bg-slate-100 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-200"
          style={{ cursor: "pointer" }}
        >
          <SiFacebook className="text-[15px] text-[#1877F2]" />
          페이스북
        </button>

        <button
          type="button"
          onClick={() => onShare("sms")}
          className="flex h-[42px] items-center justify-center gap-1 rounded-md bg-slate-100 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-200"
          style={{ cursor: "pointer" }}
        >
          <FiMessageCircle className="text-[15px]" />
          문자
        </button>
      </div>
    </div>
  );
}

function CompatibleTypesCard({ compatibleTypes }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
      <SectionTitle
        icon={<FiHeart />}
        title="잘 어울리는 유형"
        right={
          <div className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
            추천 조합
          </div>
        }
      />

      <div className="mt-3 grid grid-cols-1 gap-2.5">
        {compatibleTypes.map((type) => (
          <div
            key={type.code}
            className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3"
          >
            <div className="mr-4 min-w-0 flex-1">
              <div className="text-[11px] font-bold text-violet-500">{type.code}</div>
              <div className="mt-0.5 break-keep text-[16px] font-bold leading-5 text-slate-900">
                {type.ko}
              </div>
              <div className="mt-1 break-keep text-[12px] leading-5 text-slate-500">
                {type.oneLine}
              </div>
            </div>

            <FiCheckCircle className="shrink-0 text-[17px] text-violet-500" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ExploreDetailCard({ activeType }) {
  const strengths =
    activeType?.strengths?.length
      ? activeType.strengths
      : ["관계 지속력", "자기 스타일 유지", "상대와의 균형 감각"];

  const caution =
    activeType?.caution || "강점이 잘 보이도록 표현 방식을 조금 더 다듬어보세요.";

  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-[12px] font-bold text-violet-600">
          {activeType.code}
        </div>

        <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
          유형 설명
        </div>
      </div>

      <div className="mt-3 break-keep text-[21px] font-bold leading-8 text-slate-900">
        {activeType.ko}
      </div>
      <div className="mt-1 break-keep text-[14px] leading-6 text-slate-500">
        {activeType.en}
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-slate-200 bg-white">
        <img
          src={activeType.image}
          alt={activeType.ko}
          className="h-[220px] w-full object-contain bg-white sm:h-[250px]"
        />
      </div>

      <p className="mt-4 break-keep whitespace-normal text-[14px] leading-7 text-slate-600">
        {activeType.summary}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="text-[12px] font-semibold text-slate-400">강점</div>
          <div className="mt-3 space-y-2">
            {strengths.map((item) => (
              <div
                key={item}
                className="flex items-start gap-2 text-[14px] leading-6 text-slate-700"
              >
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                <span className="break-keep">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-4">
          <div className="text-[12px] font-semibold text-amber-700">주의 포인트</div>
          <div className="mt-3 break-keep text-[14px] leading-7 text-amber-900">
            {caution}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultBottomActionBar({ isLoggedIn, onRestart, onComplete }) {
  return (
    <div className="mt-4">
      <div className="grid grid-cols-[110px_1fr] overflow-hidden rounded-md border border-slate-200 bg-white">
        <button
          type="button"
          onClick={onRestart}
          className="flex h-[48px] items-center justify-center gap-2 border-r border-slate-200 bg-slate-100 text-[15px] font-semibold text-slate-700 transition hover:bg-slate-200"
          style={{ cursor: "pointer" }}
        >
          <FiRefreshCcw className="text-[15px]" />
          다시하기
        </button>

        <button
          type="button"
          onClick={onComplete}
          className="flex h-[48px] items-center justify-center bg-gray-600 px-3 text-[16px] font-bold text-white transition hover:bg-gray-700 sm:text-[17px]"
          style={{ cursor: "pointer" }}
        >
          {isLoggedIn ? "완료" : "회원가입하고 이성찾기"}
        </button>
      </div>

      <div className="h-[12px] md:h-0" />
    </div>
  );
}

export default function StyleTestResult({
  finalType,
  axisSummary,
  compatibleTypes,
  allTypes,
  activeExploreCode,
  setActiveExploreCode,
  onRestart,
  onComplete,
  onShare,
  onSignup,
  isLoggedIn,
  typeDistribution = [],
}) {
  const [activeTab, setActiveTab] = useState("result");
  const contentScrollRef = useRef(null);
  const exploreDetailRef = useRef(null);

  const activeType = useMemo(() => {
    return typeMetaMap[activeExploreCode] || finalType.meta;
  }, [activeExploreCode, finalType.meta]);

  const safeStrengths =
    finalType.meta?.strengths?.length
      ? finalType.meta.strengths
      : ["관계 지속력", "자기 스타일 유지", "상대와의 균형 감각"];

  const safeCaution =
    finalType.meta?.caution ||
    "강점이 잘 보이도록 표현 방식만 조금 더 다듬어보세요.";

  useEffect(() => {
    if (!contentScrollRef.current) return;
    contentScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "explore") return;
    if (!exploreDetailRef.current || !contentScrollRef.current) return;

    const timer = setTimeout(() => {
      const container = contentScrollRef.current;
      const detailRect = exploreDetailRef.current.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const nextTop =
        detailRect.top - containerRect.top + container.scrollTop - 12;

      container.scrollTo({
        top: Math.max(nextTop, 0),
        behavior: "smooth",
      });
    }, 80);

    return () => clearTimeout(timer);
  }, [activeExploreCode, activeTab]);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="sticky top-0 z-[15] shrink-0 border-b border-slate-200 bg-white px-5 pb-4 pt-[max(16px,env(safe-area-inset-top))]">
        <div className="text-[18px] font-semibold tracking-[-0.02em] text-slate-900">
          테스트 결과
        </div>

        <p className="mt-1 break-keep text-[13px] leading-5 text-slate-500">
          나의 연애 스타일 결과를 확인해보세요.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("result")}
            className={[
              "h-10 rounded-md text-[14px] font-semibold transition",
              activeTab === "result"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800",
            ].join(" ")}
            style={{ cursor: "pointer" }}
          >
            내 결과
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("explore")}
            className={[
              "h-10 rounded-md text-[14px] font-semibold transition",
              activeTab === "explore"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800",
            ].join(" ")}
            style={{ cursor: "pointer" }}
          >
            다른 유형 보기
          </button>
        </div>
      </div>

      <div
        ref={contentScrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-2 pt-4 pb-4"
      >
        {activeTab === "result" ? (
          <div className="space-y-4">
            <ResultSummaryCard finalType={finalType} />
            <TypeCodeMeaningCard finalType={finalType} />
            <StrengthAndCautionCard
              strengths={safeStrengths}
              caution={safeCaution}
            />
            <div className="grid grid-cols-2 gap-2.5">
              {axisSummary.map((item) => (
                <AxisStrengthCard key={item.axis} item={item} />
              ))}
            </div>
            <CompatibleTypesCard compatibleTypes={compatibleTypes} />
            <TypeDistributionCard
              finalType={finalType}
              typeDistribution={typeDistribution}
            />
            <div className="w-full border-b h-[12px] mb-[24px] border-solid border-slate-200" />
            <ShareCard
              isLoggedIn={isLoggedIn}
              onShare={onShare}
              onSignup={onSignup}
            />
            <div className="w-full border-b h-[12px] mb-[24px] border-solid border-slate-200" />
            <ResultBottomActionBar
              isLoggedIn={isLoggedIn}
              onRestart={onRestart}
              onComplete={onComplete}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <ExploreTopSelector
              allTypes={allTypes}
              activeExploreCode={activeExploreCode}
              setActiveExploreCode={setActiveExploreCode}
            />
            <div ref={exploreDetailRef}>
              <ExploreDetailCard activeType={activeType} />
            </div>
            <ResultBottomActionBar
              isLoggedIn={isLoggedIn}
              onRestart={onRestart}
              onComplete={onComplete}
            />
          </div>
        )}
      </div>
    </div>
  );
}