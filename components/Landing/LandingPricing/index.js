import React from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiCheck,
  FiCreditCard,
  FiHeart,
  FiInfo,
  FiTrendingDown,
} from "react-icons/fi";

const priceRows = [
  {
    label: "차밍수프",
    intro: "이성소개 무료",
    matching: "매칭 시 8스푼",
    cost: "약 2,952원",
    highlight: true,
  },
  {
    label: "타 소개팅",
    intro: "1만원~",
    matching: "3~5만원",
    cost: "4~6만원",
  },
  {
    label: "소개팅앱",
    intro: "앱 다운로드",
    matching: "열람·좋아요·메시지 과금",
    cost: "1~5만원",
  },
  {
    label: "결혼정보회사",
    intro: "가입/소개비 발생",
    matching: "횟수제·기간제·성혼비 등",
    cost: "100만~1,500만원",
  },
];

const serviceNotes = [
  "이성소개와 프로필 확인은 무료로 시작",
  "서로 매칭이 성사될 때만 스푼 차감",
  "무응답·거절 등 미성사 시 구매 스푼 1회 복구",
];

const rowStyle = {
  display: "grid",
  gridTemplateColumns: "0.9fr 1fr 1.15fr 1fr",
};

function TableCell({ children, head, highlight, cost }) {
  return (
    <div
      className={`flex min-h-[56px] items-center justify-center break-keep border-r border-slate-100 px-1.5 py-2.5 text-center leading-[1.35] last:border-r-0 ${head
          ? "bg-slate-950 text-[11px] font-extrabold text-white"
          : highlight
            ? cost
              ? "bg-violet-600 text-[12px] font-black text-white"
              : "bg-[#f5f5f7]/80 text-[12px] font-extrabold text-violet-700"
            : "bg-white text-[11px] font-semibold text-slate-600"
        }`}
    >
      {children}
    </div>
  );
}

export default function LandingPricing() {
  return (
    <section className="px-4 pb-3 pt-5">
      <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_8px_28px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
        <div className="px-5 py-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f7] px-3 py-1 text-[12px] font-extrabold text-[#0071e3]">
            <FiCreditCard className="text-[14px]" />
            소개는 무료 · 매칭 시 차감
          </div>

          <h2 className="mt-3 break-keep text-[25px] font-extrabold leading-[1.24] text-slate-900">
            이성소개는 무료!
            <br />
            실제 매칭 시에만 차감돼요.
          </h2>

          <p className="mt-3 break-keep text-[15px] font-medium leading-[1.65] text-slate-600">
            차밍수프는 고액 가입비나 상시 월정액보다 부담을 낮추고, 실제 연결 가능성이 생긴 순간에만 비용이 발생하는 방식이에요.
          </p>

          <div className="mt-5 rounded-[24px] bg-[#f5f5f7] px-4 py-4 ring-1 ring-black/[0.04]">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#0071e3] shadow-sm">
                <FiTrendingDown className="text-[20px]" />
              </span>
              <div className="min-w-0">
                <p className="break-keep text-[13px] font-extrabold text-[#0071e3]">
                  현재 할인 기준
                </p>
                <p className="mt-0.5 break-keep text-[20px] font-black leading-[1.25] text-slate-950">
                  매칭 1회 약 2,952원
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <p className="text-[13px] font-bold text-slate-400 line-through">
                기존가 기준 약 6,320원
              </p>
              <p className="rounded-full bg-[#0071e3] px-2.5 py-1 text-[11px] font-extrabold text-white">
                할인 진행중
              </p>
            </div>

            <p className="mt-3 break-keep text-[12px] font-medium leading-[1.55] text-slate-500">
              100스푼 36,900원 할인가와 매칭 1회 8스푼 기준으로 환산한 금액이에요.
            </p>
          </div>

          <div className="mt-5 overflow-hidden rounded-[22px] border border-solid border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <div className="bg-slate-50 px-4 py-3">
              <p className="text-[14px] font-extrabold text-slate-900">
                서비스별 가격 비교
              </p>
              <p className="mt-1 break-keep text-[11px] font-medium leading-[1.45] text-slate-500">
                소개 비용과 매칭 비용이 어떻게 발생하는지 비교해보세요.
              </p>
            </div>

            <div>
              <div style={rowStyle}>
                <TableCell head>구분</TableCell>
                <TableCell head>소개 비용</TableCell>
                <TableCell head>매칭 구조</TableCell>
                <TableCell head>비용 부담</TableCell>
              </div>

              {priceRows.map((row) => (
                <div key={row.label} style={rowStyle} className="border-solid border-t border-slate-100">
                  <TableCell highlight={row.highlight}>{row.label}</TableCell>
                  <TableCell highlight={row.highlight}>{row.intro}</TableCell>
                  <TableCell highlight={row.highlight}>{row.matching}</TableCell>
                  <TableCell highlight={row.highlight} cost={row.highlight}>
                    {row.cost}
                  </TableCell>
                </div>
              ))}
            </div>
          </div>

          {/* <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 border-solid px-4 py-4">
            <p className="break-keep text-[14px] font-extrabold text-slate-900">
              결혼정보회사 비용은 왜 크게 보이나요?
            </p>
            <p className="mt-2 break-keep text-[12px] font-medium leading-[1.6] text-slate-600">
              일반·횟수제는 약 100만~300만원, VIP·기간제는 약 300만~700만원, 전체 가입비는 회원 등급·만남 횟수·성혼비 유무에 따라 약 200만~1,500만원까지 차이가 날 수 있어요.
            </p>
          </div> */}

          <div className="mt-4 space-y-2">
            {serviceNotes.map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f5f5f7] text-[#0071e3]">
                  <FiCheck className="text-[13px]" />
                </span>
                <p className="break-keep text-[13px] font-semibold leading-[1.5] text-slate-700">
                  {item}
                </p>
              </div>
            ))}
          </div>

          {/* <div className="mt-5 rounded-2xl border border-solid border-slate-200 bg-[#f5f5f7]/55 px-4 py-4">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#0071e3] shadow-sm">
                <FiHeart />
              </span>
              <div>
                <p className="break-keep text-[15px] font-extrabold text-slate-950">
                  현재 소수의 진지한 3040 회원과 함께 시작합니다.
                </p>
                <p className="mt-1 break-keep text-[12px] font-medium leading-[1.55] text-slate-600">
                  수도권 중심의 남녀 회원이 순차적으로 대기 중이며, 프로필 승인 후 매칭이 진행돼요.
                </p>
              </div>
            </div>
          </div> */}

          <p className="mt-4 flex gap-1.5 break-keep text-[11px] font-medium leading-[1.55] text-slate-400">
            <FiInfo className="mt-0.5 shrink-0" />
            비교 금액은 참고용이며, 타 서비스의 실제 비용은 업체·상품·회원 조건에 따라 달라질 수 있어요.
          </p>
          {/* <Link
            href="/store"
            className="mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0071e3] text-[15px] font-extrabold text-white shadow-[0_12px_24px_rgba(124,58,237,0.22)] transition hover:bg-[#0077ed]"
          >
            스푼 가격 보기
            <FiArrowRight className="text-[17px]" />
          </Link> */}
        </div>
      </div>
    </section>
  );
}
