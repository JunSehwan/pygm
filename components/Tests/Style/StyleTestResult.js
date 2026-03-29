import React, { useRef } from "react";
import {
  FiRefreshCcw,
  FiHeart,
  FiCheckCircle,
  FiShare2,
  FiUserPlus,
  FiMessageCircle,
  FiInstagram,
  FiFacebook,
} from "react-icons/fi";
import { typeMetaMap } from "data/tests/styleQuestions";
import { FaFacebookSquare } from "react-icons/fa";
import { RiKakaoTalkFill } from "react-icons/ri";


import {
  SiKakaotalk,
  SiFacebook,
  SiInstagram,
} from "react-icons/si";


function TypeMiniCard({ type, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[18px] border px-3 py-3 text-left transition ${active
        ? "border-pink-500 bg-pink-50"
        : "border-slate-200 bg-slate-50 shadow hover:border-pink-200"
        }`}
    >
      <div className="mb-2 overflow-hidden rounded-[12px] bg-white">
        <img
          src={type.image}
          alt={type.ko}
          className="h-[92px] w-full object-contain"
        />
      </div>
      <div className="text-[11px] font-black text-pink-500">{type.code}</div>
      <div className="mt-1 text-[18px] font-black text-slate-900">{type.ko}</div>
      <div className="mt-1 line-clamp-2 text-[12px] leading-5 text-slate-500">
        {type.oneLine}
      </div>
    </button>
  );
}

function AxisStrengthCard({ item }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
      <div className="text-[12px] font-bold text-slate-400">{item.label}</div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="text-[18px] font-black text-slate-900">
          {item.selectedLabel}
        </div>
        <div className="text-[11px] font-bold text-pink-500">
          {item.strengthText}
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-400">
          <span>{item.leftLabel}</span>
          <span>{item.rightLabel}</span>
        </div>

        <div className="relative flex h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-pink-300 to-pink-500 transition-all duration-500"
            style={{ width: `${item.leftPercent}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-slate-300 to-blue-400 transition-all duration-500"
            style={{ width: `${item.rightPercent}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[12px] font-bold">
          <span className="text-pink-500">
            {item.leftLabel} {item.leftPercent}%
          </span>
          <span className="text-blue-500">
            {item.rightLabel} {item.rightPercent}%
          </span>
        </div>
      </div>
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
}) {
  const activeType = typeMetaMap[activeExploreCode] || finalType.meta;

  const detailCardRef = useRef(null);

  const safeStrengths =
    activeType?.strengths?.length
      ? activeType.strengths
      : ["관계 지속력", "자기 스타일 유지", "상대와의 균형 감각"];

  const safeCaution =
    activeType?.caution || "강점이 잘 보이도록 표현 방식만 조금 더 다듬어보세요.";

  return (
    <div className="relative flex h-screen min-h-screen flex-col bg-white md:h-[760px] md:min-h-[760px]">
      <div className="px-5 pt-5 pb-4">
        <div className="inline-flex rounded-full bg-pink-50 px-3 py-1 text-[12px] font-bold text-pink-500">
          진단 결과
        </div>

        <h1 className="mt-4 text-[34px] font-black leading-[1.08] text-slate-900">
          {finalType.meta.ko}
        </h1>

        <p className="mt-2 text-[15px] font-semibold text-slate-500">
          {finalType.meta.en}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-[118px]">
        <div
          className={`rounded-md bg-gradient-to-br ${finalType.meta.color} p-[1px] shadow-[0_18px_40px_rgba(244,114,182,0.18)]`}
        >
          <div className="rounded-md bg-white px-5 py-5">
            <div className="flex items-center justify-between">
              <div className="inline-flex rounded-full bg-pink-50 px-3 py-1 text-[12px] font-black text-pink-500">
                {finalType.meta.code}
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-bold text-slate-600">
                대표 유형
              </div>
            </div>

            <div className="my-4 text-[18px] font-black leading-6 text-blue-900">
              <span className="whitespace-pre-line text-sm font-medium text-gray-500">
                당신의 연애타입은
              </span>
              <br />
              <span className="whitespace-pre-line">
                {finalType.meta.oneLine}</span>
            </div>
            <div className="mt-4 overflow-hidden rounded-[18px] bg-white">
              <img
                src={finalType.meta.image}
                alt={finalType.meta.ko}
                className="h-[220px] w-full object-contain sm:h-[250px]"
              />
            </div>
            <p className="mt-3 whitespace-pre-line text-[13px] leading-5 text-slate-600">
              {finalType.meta.summary}
            </p>

            {finalType.balanceBadges.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {finalType.balanceBadges.map((badge) => (
                  <div
                    key={badge}
                    className="rounded-full bg-amber-50 px-3 py-1 text-[12px] font-bold text-amber-700"
                  >
                    {badge}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-4 grid grid-rows-2 gap-2.5">
              <div className="rounded-[18px] bg-slate-50 px-3 py-3">
                <div className="text-[12px] font-bold text-slate-400">강점</div>
                <div className="mt-2 whitespace-pre-line text-[13px] font-semibold leading-5 text-slate-700">
                  {safeStrengths.map((item) => `• ${item}`).join("\n")}
                </div>
              </div>

              <div className="rounded-[18px] bg-amber-50 px-3 py-3">
                <div className="text-[12px] font-bold text-amber-700">주의 포인트</div>
                <div className="mt-2 whitespace-pre-line text-[13px] font-semibold leading-5 text-slate-700">
                  {safeCaution}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="my-4 p-2 bg-white shadow">
          <div className="py-2 font-bold">내 연애스타일을 공유해보세요.</div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onShare("system")}
              className="flex h-[50px] items-center justify-center gap-2 rounded-[16px] border border-slate-200 bg-white text-[14px] font-bold text-slate-700 shadow-[0_8px_18px_rgba(15,23,42,0.05)] transition hover:border-pink-200"
            >
              <FiShare2 className="text-[16px]" />
              테스트 공유
            </button>

            {!isLoggedIn ? (
              <button
                type="button"
                onClick={onSignup}
                className="flex h-[50px] items-center justify-center gap-2 rounded-[16px] border border-pink-200 bg-pink-50 text-[14px] font-bold text-pink-600 shadow-[0_8px_18px_rgba(236,72,153,0.08)] transition hover:bg-pink-100"
              >
                <FiUserPlus className="text-[16px]" />
                가입하고 결과저장
              </button>
            ) : (
              <div className="flex h-[50px] items-center justify-center rounded-[16px] border border-emerald-200 bg-emerald-50 text-[13px] font-bold text-emerald-600">
                결과는 저장됩니다.
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => onShare("kakao")}
              className="flex h-[44px] items-center justify-center gap-1 rounded-[14px] shadow hover:shadow-none bg-slate-100 hover:slate-200 text-[12px] font-bold text-slate-700"
            >
              <SiKakaotalk className="text-[16px] text-[#b9ae46]" />
              카카오
            </button>

            <button
              type="button"
              onClick={() => onShare("instagram")}
              className="flex h-[44px] items-center justify-center gap-1 rounded-[14px] shadow hover:shadow-none bg-slate-100 hover:slate-200 text-[12px] font-bold text-slate-700"
            >
              <SiInstagram className="text-[16px] text-[#E4405F]" />
              인스타
            </button>

            <button
              type="button"
              onClick={() => onShare("facebook")}
              className="flex h-[44px] items-center justify-center gap-1 rounded-[14px] shadow hover:shadow-none bg-slate-100 hover:slate-200 text-[12px] font-bold text-slate-700"
            >
              <SiFacebook className="text-[16px] text-[#1877F2]" />
              페이스북
            </button>

            <button
              type="button"
              onClick={() => onShare("sms")}
              className="flex h-[44px] items-center justify-center gap-1 rounded-[14px] shadow hover:shadow-none bg-slate-100 hover:slate-200 text-[12px] font-bold text-slate-700"
            >
              <FiMessageCircle className="text-[16px]" />
              문자
            </button>


          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {axisSummary.map((item) => (
            <AxisStrengthCard key={item.axis} item={item} />
          ))}
        </div>

        <div className="mt-4 rounded-[22px] bg-slate-50 px-4 py-4">
          <div className="flex items-center gap-2 text-[15px] font-black text-slate-800">
            <FiHeart className="text-pink-500" />
            잘 어울리는 유형
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2.5">
            {compatibleTypes.map((type) => (
              <div
                key={type.code}
                className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-white px-4 py-3"
              >
                <div className="mr-4">
                  <div className="text-[12px] font-black text-pink-500">{type.code}</div>
                  <div className="text-[16px] font-black text-slate-900">{type.ko}</div>
                  <div className="mt-1 text-[12px] text-slate-500">{type.oneLine}</div>
                </div>

                <FiCheckCircle className="text-[18px] text-pink-500" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-3 text-[15px] font-black text-slate-800">
            다른 유형도 살펴보기
          </div>

          <div
            ref={detailCardRef}
            className={`my-4 scroll-mt-4 rounded-md bg-gradient-to-br ${activeType.color} p-[1px]`}
          >
            <div className="rounded-md bg-white px-3 py-3">
              <div className="text-[12px] font-black text-pink-500">{activeType.code}</div>
              <div className="mt-1 text-[21px] font-black text-slate-900">
                {activeType.ko}
              </div>
              <div className="mt-1 text-[14px] font-semibold text-slate-500">
                {activeType.en}
              </div>
              <div className="mt-4 overflow-hidden rounded-[18px] bg-white">
                <img
                  src={activeType.image}
                  alt={activeType.ko}
                  className="h-[220px] w-full object-contain sm:h-[250px]"
                />
              </div>
              <p className="mt-3 whitespace-pre-line text-[14px] leading-6 text-slate-600">
                {activeType.summary}
              </p>

              <div className="mt-4 grid grid-rows-2 gap-2">
                <div className="rounded-[18px] bg-slate-50 px-3 py-3">
                  <div className="text-[12px] font-bold text-slate-400">강점</div>
                  <div className="mt-2 whitespace-pre-line text-[13px] font-semibold leading-5 text-slate-700">
                    {safeStrengths.map((item) => `• ${item}`).join("\n")}
                  </div>
                </div>

                <div className="rounded-[18px] bg-amber-50 px-3 py-3">
                  <div className="text-[12px] font-bold text-amber-700">주의 포인트</div>
                  <div className="mt-2 whitespace-pre-line text-[13px] font-semibold leading-5 text-amber-900">
                    {safeCaution}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {allTypes.map((type) => (
              <TypeMiniCard
                key={type.code}
                type={type}
                active={type.code === activeExploreCode}
                onClick={() => {
                  setActiveExploreCode(type.code);

                  setTimeout(() => {
                    detailCardRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }, 60);
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-[20]">
        <div className="grid grid-cols-[110px_1fr] border-t border-slate-200/70 bg-white/92 pt-3 backdrop-blur-xl">
          <button
            type="button"
            onClick={onRestart}
            className="flex h-[60px] items-center justify-center border-r border-slate-200 bg-slate-100 text-[16px] font-bold text-slate-700"
          >
            <FiRefreshCcw className="mr-2" />
            다시하기
          </button>

          <button
            type="button"
            onClick={onComplete}
            className="flex h-[60px] items-center justify-center bg-pink-500 text-[16px] sm:text-[18px] font-black text-white transition hover:bg-pink-600"
          >
            {isLoggedIn ? "완료" : "회원가입하고 이성찾기"}
          </button>
        </div>
      </div>
    </div>
  );
}