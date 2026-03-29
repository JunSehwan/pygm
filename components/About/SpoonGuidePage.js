import React from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import {
  PiCoinsDuotone,
  PiHandHeartDuotone,
  PiArrowClockwiseDuotone,
  PiQuestionDuotone,
  PiLightningDuotone,
  PiChatCenteredDotsDuotone,
  PiCheckCircleFill,
  PiSparkleDuotone,
} from "react-icons/pi";

import AboutFrame from "./AboutFrame";

function SectionCard({ icon: Icon, title, children }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-violet-50 text-violet-600">
          <Icon className="text-[20px]" />
        </div>
        <div className="text-[15px] font-bold text-slate-900">{title}</div>
      </div>

      <div className="mt-3 space-y-2 break-keep text-[13px] leading-5 text-slate-600">
        {children}
      </div>
    </section>
  );
}

function InfoRow({ title, desc }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-[12px] font-semibold text-slate-800">{title}</div>
      <div className="mt-1 break-keep text-[13px] leading-5 text-slate-500">
        {desc}
      </div>
    </div>
  );
}

export default function SpoonGuidePage() {
  const router = useRouter();

  return (
    <AboutFrame
      activeTab="spoon"
      title="차밍스푼 안내"
      description={
        "차밍스푼은 차밍수프에서 호감 표현과 일부 기능 이용에 사용하는 포인트입니다. " +
        "사용, 차감, 복구 기준을 한 페이지에서 확인할 수 있습니다."
      }
      hero={
        <section className="overflow-hidden rounded-md border border-violet-100 bg-[linear-gradient(135deg,#faf5ff_0%,#ffffff_55%,#eef2ff_100%)] px-4 py-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative h-[76px] w-[76px] shrink-0">
              <Image
                src="/image/store/spoon/gold_spoon.png"
                alt="차밍스푼"
                fill
                className="object-contain"
                priority
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-100">
                <PiSparkleDuotone className="text-[13px]" />
                Charming Spoon
              </div>

              <div className="mt-2 break-keep text-[18px] font-bold leading-6 text-slate-900">
                스푼으로
                <br />
                호감을 보낼 수 있습니다
              </div>

              <div className="mt-2 break-keep text-[12px] leading-5 text-slate-500">
                매칭 1회 시도에 스푼 8개가 차감됩니다.
              </div>
            </div>
          </div>
        </section>
      }
    >
      <div className="space-y-2">
        <InfoRow
          title="사용 기준"
          desc="호감 보내기 1회에 스푼 8개가 차감됩니다."
        />
        <InfoRow
          title="복구 기준"
          desc="구매한 스푼은 거절 또는 무응답으로 종료되면 1회 복구됩니다."
        />
      </div>

      <SectionCard icon={PiCoinsDuotone} title="차밍스푼이란?">
        <p>
          차밍스푼은 차밍수프에서 상대에게 호감을 보내고 연결을 시도할 때
          사용하는 포인트입니다.
        </p>
        <p>
          프로필 조회와 실제 매칭 시도는 구분되며, 스푼은 매칭 시도 단계에서
          사용됩니다.
        </p>
      </SectionCard>

      <SectionCard icon={PiLightningDuotone} title="이용 순서">
        <div className="space-y-2">
          {[
            "스푼을 충전합니다.",
            "프로필과 차밍카드를 확인합니다.",
            "원하는 상대에게 호감을 보냅니다.",
            "결과에 따라 매칭이 진행되거나 종료됩니다.",
          ].map((item, index) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-md bg-slate-50 px-3 py-3"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-600 text-[11px] font-bold text-white">
                {index + 1}
              </div>
              <div className="pt-[2px] text-[13px] leading-5 text-slate-700">
                {item}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={PiHandHeartDuotone} title="차감 방식">
        <p>
          스푼은 호감 보내기와 동시에 차감됩니다.
        </p>
        <p>
          단순 조회나 둘러보기 단계에서는 차감되지 않습니다.
        </p>
      </SectionCard>

      <SectionCard icon={PiArrowClockwiseDuotone} title="복구 방식">
        <div className="space-y-2">
          <div className="flex items-start gap-2 rounded-md bg-violet-50 px-3 py-3">
            <PiCheckCircleFill className="mt-0.5 shrink-0 text-[15px] text-violet-600" />
            <div className="text-[13px] leading-5 text-slate-700">
              구매한 스푼은 상대가 거절하거나 응답 없이 종료되면 1회 복구됩니다.
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-md bg-slate-50 px-3 py-3">
            <PiCheckCircleFill className="mt-0.5 shrink-0 text-[15px] text-slate-400" />
            <div className="text-[13px] leading-5 text-slate-700">
              무료 지급 스푼과 이벤트 스푼은 복구되지 않습니다.
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={PiQuestionDuotone} title="확인할 내용">
        <p>
          보유 스푼 수, 차감 내역, 복구 여부는 서비스 내 표시 기준에 따라
          확인할 수 있습니다.
        </p>
        <p>
          스푼 정책은 운영 기준 변경 시 함께 갱신됩니다.
        </p>
      </SectionCard>

      <SectionCard icon={PiChatCenteredDotsDuotone} title="관련 페이지">
        <div className="mt-1 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => router.push("/store")}
            style={{ cursor: "pointer" }}
            className="inline-flex items-center justify-center rounded-md bg-violet-600 px-4 py-3 text-[13px] font-semibold text-white transition hover:bg-violet-700"
          >
            스푼 상점으로 이동
          </button>

          <button
            type="button"
            onClick={() => router.push("/store/policy")}
            style={{ cursor: "pointer" }}
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-3 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            충전 및 환불 정책 보기
          </button>
        </div>
      </SectionCard>
    </AboutFrame>
  );
}