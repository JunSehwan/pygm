import React from "react";
import Image from "next/image";
import {
  PiBellRingingFill,
  PiCheckCircleFill,
  PiSparkleFill,
  PiHeartStraightFill,
} from "react-icons/pi";

function StatusBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[12px] font-semibold text-violet-700">
      <PiBellRingingFill className="text-[13px]" />
      <span>호감 도착 대기 중</span>
    </div>
  );
}

function PointRow({ children }) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-slate-50 px-3 py-3">
      <PiCheckCircleFill className="mt-[1px] shrink-0 text-[16px] text-violet-500" />
      <div className="break-keep text-[13px] leading-5 text-slate-600">{children}</div>
    </div>
  );
}

function MiniActionCard({ title, desc }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
      <div className="text-[13px] font-bold text-slate-900">{title}</div>
      <div className="mt-1 break-keep text-[12px] leading-5 text-slate-500">{desc}</div>
    </div>
  );
}

export default function MaleEmptyState({
  nickname,
  onMoveCards,
  onMoveProfile,
}) {
  return (
    <div className="flex h-full flex-col px-5 pb-2 pt-5">
      <div className="rounded-[16px] border border-slate-200 bg-white px-5 py-5 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <div className="flex justify-center">
          <StatusBadge />
        </div>

        <div className="mt-4 rounded-[14px] border border-violet-100 bg-[linear-gradient(180deg,#faf7ff_0%,#ffffff_100%)] px-4 py-5">
          <div className="relative mx-auto flex w-full max-w-[240px] items-center justify-center">
            <div className="absolute left-1/2 top-1/2 h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-100 blur-2xl opacity-80" />

            <div className="absolute left-[18px] top-[12px] rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-violet-600 shadow-sm ring-1 ring-violet-100">
              누군가 보고 있을지도 몰라요
            </div>

            <div className="absolute right-[14px] top-[22px] flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-500 shadow-sm ring-1 ring-rose-100">
              <PiHeartStraightFill className="text-[14px]" />
            </div>

            <div className="relative h-[190px] w-[190px]">
              <Image
                src="/image/arena/arena_girl_waiting.png"
                alt="호감 대기"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>

          <div className="mt-3 text-center">
            <div className="break-keep text-[22px] font-extrabold leading-[1.32] tracking-[-0.03em] text-zinc-900">
              아직 도착한 호감은 없지만
              <br />
              기다릴수록 가능성은 열려 있어요
            </div>

            <div className="mt-3 break-keep text-[14px] leading-6 text-slate-500">
              여성회원이 {nickname || "회원"}님에게 호감표시를 보내면
              <br />
              바로 확인할 수 있도록 안내해드릴게요.
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-violet-100 bg-violet-50 px-4 py-4">
          <div className="flex items-center gap-2">
            <PiSparkleFill className="text-[14px] text-violet-500" />
            <div className="text-[13px] font-bold text-violet-700">
              기다리는 동안 이렇게 해보세요
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2">
            <MiniActionCard
              title="차밍카드 답변 늘리기"
              desc="진실된 답변이 많을수록 여성회원에게 더 매력적으로 보일 수 있어요."
            />
            <MiniActionCard
              title="프로필 보완하기"
              desc="사진, 소개, 가치관 정보를 다듬으면 관심을 받을 확률이 올라가요."
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <PointRow>호감표시가 도착하면 문자메시지로 안내드려요.</PointRow>
          <PointRow>
            카드 응답 가능 시간은 <span className="font-semibold text-slate-800">3일</span>이에요.
          </PointRow>
          <PointRow>3일 내 응답이 없으면 자동으로 거절 처리돼요.</PointRow>
        </div>

        {/* <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="break-keep text-[13px] leading-5 text-slate-600">
            
            <span className="font-semibold text-slate-800"> 차밍카드 답변과 프로필 보완</span>
            으로 <br/>여성회원 대상 노출을 더 높일 수 있어요.
          </div>
        </div> */}
      </div>

      <div className="mt-auto flex flex-row items-center gap-2 py-4">
        <button
          type="button"
          onClick={onMoveCards}
          className="flex h-[48px] w-full items-center justify-center rounded-md bg-violet-600 text-[16px] font-bold text-white transition hover:bg-violet-700"
          style={{ cursor: "pointer" }}
        >
          차밍카드 둘러보기
        </button>

        <button
          type="button"
          onClick={onMoveProfile}
          className="flex h-[48px] w-full items-center justify-center rounded-md bg-zinc-800 text-[16px] font-bold text-white transition hover:bg-zinc-900"
          style={{ cursor: "pointer" }}
        >
          프로필 보완하기
        </button>
      </div>
    </div>
  );
}