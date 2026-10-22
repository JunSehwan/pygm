import { FiMapPin } from "react-icons/fi";
import MobileFrame from "./MobileFrame";
import { MEETING_TIMELINE_STEPS } from "./constants";

export default function MeetingDaySection() {
  return (
    <section className="border-b border-slate-200 bg-white text-slate-950">
      <MobileFrame className="py-20 md:py-32">
        <div className="max-w-3xl">
          <p className="text-xs font-black tracking-[0.08em] text-[#ff5b4d] md:text-sm">
            만남 당일
          </p>
          <h2 className="mt-5 break-keep text-[38px] font-black leading-[1.12] tracking-[-0.015em] md:text-6xl">
            만남 당일에는
            <br />
            이렇게 진행돼요.
          </h2>
          <p className="mt-5 max-w-2xl break-keep text-base font-medium leading-8 text-slate-600 md:text-lg">
            서로를 찾는 순간부터 만남 후 피드백까지, 필요한 안내를 화면과 문자로 전달합니다.
          </p>
        </div>

        <div className="mt-12 md:mt-16">
          {MEETING_TIMELINE_STEPS.map((item, index) => (
            <article
              key={`${item.time}-${item.title}`}
              className="relative grid grid-cols-[38px_1fr] gap-4 pb-8 last:pb-0 md:grid-cols-[46px_150px_1fr] md:gap-6"
            >
              <div className="relative flex justify-center">
                {index < MEETING_TIMELINE_STEPS.length - 1 ? (
                  <div className="absolute left-1/2 top-10 h-[calc(100%+2px)] w-px -translate-x-1/2 bg-slate-200" />
                ) : null}
                <div className="relative z-10 mt-1 flex h-9 w-9 items-center justify-center border-solid rounded-full border-2 border-[#ff5b4d] bg-white text-xs font-black text-[#ff5b4d] md:h-10 md:w-10">
                  {String(index + 1).padStart(2, "0")}
                </div>
              </div>

              <div className="hidden pt-3 md:block">
                <div className="text-sm font-black text-[#ff5b4d]">{item.time}</div>
              </div>

              <div className="rounded-[26px] border border-dashed border-slate-200 bg-white p-6 md:p-7">
                <div className="text-xs font-black text-[#ff5b4d] md:hidden">{item.time}</div>
                <h3 className="mt-1 break-keep text-xl font-black tracking-[-0.035em] md:mt-0 md:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-3 break-keep text-sm font-medium leading-7 text-slate-600 md:text-base md:leading-8">
                  {item.desc}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 flex gap-4 rounded-[26px] border border-rose-100 bg-[#fff8f6] p-6 md:p-7">
          <FiMapPin
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-2xl text-[#ff5b4d]"
          />
          <div>
            <h3 className="text-base font-black tracking-[-0.03em] text-slate-950 md:text-lg">
              서로 쉽게 찾기 위한 간단한 확인이에요.
            </h3>
            <p className="mt-2 break-keep text-sm font-medium leading-7 text-slate-600 md:text-base md:leading-8">
              얼굴을 다시 촬영하는 절차가 아닙니다. 카페의 자리나 음료처럼 현재 위치를 알 수 있는 사진과 짧은 한마디만 남기면 됩니다.
            </p>
          </div>
        </div>
      </MobileFrame>
    </section>
  );
}
