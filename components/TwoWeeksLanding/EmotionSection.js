import { FiBell, FiCoffee, FiUser } from "react-icons/fi";
import MobileFrame from "./MobileFrame";

function QuietScene() {
  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-[32px] bg-[#edf2f5] p-6 md:min-h-[500px] md:rounded-[42px] md:p-10">
      <div className="absolute right-[-70px] top-[-70px] h-60 w-60 rounded-full bg-white/70" />
      <div className="absolute bottom-[-100px] left-[-60px] h-72 w-72 rounded-full bg-[#e6d8c8]" />
      <div className="relative mx-auto mt-7 max-w-[350px] rounded-[28px] bg-white p-5 shadow-[0_25px_70px_rgba(30,41,59,0.12)] md:mt-16 md:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-white">
            <FiBell aria-hidden="true" />
          </span>
          <div>
            <div className="text-xs font-bold text-slate-400">투윅스</div>
            <div className="mt-1 text-base font-black tracking-[-0.03em] text-slate-950">
              새로운 소개가 도착했어요
            </div>
          </div>
        </div>
        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-black text-slate-800">
            <FiUser className="text-[#d85b48]" aria-hidden="true" /> 한 사람의 프로필
          </div>
          <div className="mt-4 h-2 rounded-full bg-slate-200" />
          <div className="mt-2 h-2 w-2/3 rounded-full bg-slate-200" />
        </div>
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700">
          카페에서 약 60분
          <FiCoffee className="text-[#d85b48]" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

export default function EmotionSection() {
  return (
    <section className="border-b border-slate-100 bg-white py-16 md:py-28">
      <MobileFrame>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="text-xs font-black tracking-[0.08em] text-[#d85b48]">투윅스의 방식</p>
            <h2 className="mt-3 break-keep text-[34px] font-black leading-[1.16] tracking-[-0.055em] text-slate-950 md:text-6xl">
              주기적으로 찾아오는 
              <br />
              편안한 이성만남
            </h2>
            <div className="mt-7 space-y-5 break-keep text-base font-medium leading-8 text-slate-600 md:text-lg md:leading-9">
              <p>
                실제 만나지도 못하는 서비스에 돈을 낭비하기보다,
                <br />
                10분만 대화하는 부담스러운 단체미팅 자리보다,
                <br />
                <span className="block text-[#d85b48]">
                  투윅스에서 나와 맞는 한 사람과 카페에서 만나 이야기해보세요.
                </span>
              </p>
            </div>
            <p className="mt-8 border-l-4 border-solid border-[#d85b48] pl-5 text-xl font-black leading-8 tracking-[-0.035em] text-slate-950 md:text-2xl">
              만남에 가장 효과적인 방법을 선택하세요.
            </p>
          </div>
          <QuietScene />
        </div>
      </MobileFrame>
    </section>
  );
}
