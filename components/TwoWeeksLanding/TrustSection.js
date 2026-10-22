import {
  FiEye,
  FiLock,
  FiShield,
} from "react-icons/fi";
import MobileFrame from "./MobileFrame";

export default function TrustSection() {
  return (
    <section id="trust" className="border-b border-slate-200 bg-[#fff8f6] text-slate-950">
      <MobileFrame className="py-20 md:py-32">
        <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white px-4 py-2 text-xs font-black text-[#e94f42] shadow-sm">
              <FiShield aria-hidden="true" /> 운영자가 직접 검토합니다
            </div>
            <h2 className="mt-6 break-keep text-[38px] font-black leading-[1.12] tracking-[-0.055em] md:text-6xl">
              어떤 사람인지,
              <br />
              <span className="text-slate-500">확인 기준부터 공개합니다.</span>
            </h2>
            <p className="mt-6 max-w-xl break-keep text-base font-medium leading-8 text-slate-600 md:text-lg md:leading-9">
              조건 계산은 시스템이 돕고, 신원과 제출 자료는 운영자가 직접 확인합니다.
            </p>
          </div>

          <div className="grid gap-4">
            <article className="rounded-[26px] border border-rose-100 bg-white p-6 shadow-[0_18px_50px_rgba(124,45,18,0.06)] md:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff0ec] text-[#ff5b4d]">
                  <FiShield aria-hidden="true" />
                </span>
                <h3 className="text-xl font-black tracking-[-0.04em] md:text-2xl">운영자가 확인하는 정보</h3>
              </div>
              <p className="mt-5 break-keep text-base font-semibold leading-8 text-slate-700">
                본인인증 결과 · 직업 인증자료 · 프로필 사진 3장 이상과 기본 정보
              </p>
            </article>

            <article className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] md:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <FiEye aria-hidden="true" />
                </span>
                <h3 className="text-xl font-black tracking-[-0.04em] md:text-2xl">상대에게 공개되는 정보</h3>
              </div>
              <p className="mt-5 break-keep text-base font-semibold leading-8 text-slate-700">
                등록한 프로필 사진 · 나이 · 직업군 · 키 · 활동지역 · 가능한 시간 · 자기소개 · 매칭 이유
              </p>
              <p className="mt-5 flex gap-2 break-keep border-t border-slate-100 pt-5 text-xs font-semibold leading-6 text-slate-500 md:text-sm">
                <FiLock className="mt-1 shrink-0 text-[#ff5b4d]" aria-hidden="true" />
                인증자료와 연락처는 공개하지 않으며, 프로필을 본 뒤 만남 여부를 직접 결정합니다.
              </p>
            </article>
          </div>
        </div>
      </MobileFrame>
    </section>
  );
}
