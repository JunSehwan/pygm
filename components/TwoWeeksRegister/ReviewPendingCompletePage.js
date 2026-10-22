import Link from "next/link";
import Image from "next/image";
import { FiCheck, FiChevronRight, FiClock, FiShield, FiMessageCircle } from "react-icons/fi";
import RegisterLayout from "./RegisterLayout";
import { TWOWEEKS_DASHBOARD_PATH } from "./constants";

const reviewStages = [
  { title: "신청 접수", description: "프로필이 정상적으로 접수되었어요.", kind: "done" },
  { title: "프로필 검토", description: "작성해주신 정보를 확인해요.", kind: "current" },
  { title: "검토 결과 안내", description: "검토 후 다음 진행을 문자로 알려드려요.", kind: "next" },
];

export default function ReviewPendingCompletePage() {
  return (
    <RegisterLayout>
      <main className="mx-auto w-full max-w-[720px] px-4 pb-12 pt-5 sm:px-5 md:pb-20 md:pt-8">
        <div className="mb-3 flex items-center justify-between text-xs font-bold text-slate-500 sm:text-sm">
          <span>5. 마무리</span>
          <span>5/5</span>
        </div>
        <div className="mb-7 h-1.5 overflow-hidden rounded-full bg-[#dce3ec]" aria-hidden="true">
          <div className="h-full w-full rounded-full bg-[#346bd1]" />
        </div>

        <section className="rounded-[26px] bg-white px-5 pb-7 pt-8 shadow-[0_16px_48px_rgba(30,50,80,0.05)] sm:px-8 md:px-12 md:pb-11 md:pt-12">
          <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#e8f0ff] text-[#2967c8]" aria-hidden="true">
            <FiCheck className="text-[27px]" strokeWidth={3} />
          </div>
          <p className="mt-7 text-sm font-extrabold text-[#326bcd]">신청 접수 완료</p>
          <h1 className="mt-2 break-keep text-[29px] font-black leading-[1.35] tracking-[-0.05em] text-[#122a46] sm:text-[35px] md:text-[40px]">
            프로필을 검토하고 있어요.
          </h1>
          <p className="mt-4 break-keep text-[15px] leading-7 text-[#687b91] sm:text-[16px]">
            신청해주신 프로필을 하나씩 확인하고 있어요.
            <span className="block">검토에는 약 2~3일이 걸릴 수 있어요.</span>
          </p>

          <div className="mt-7 flex items-center gap-3 rounded-2xl bg-[#eef4ff] p-3.5 sm:gap-4 sm:p-5">
            <Image
              src="/images/twoweeks/wicky/wicky-success.png"
              alt="안내 캐릭터 윅키"
              width={70}
              height={76}
              unoptimized
              className="tw-complete-wicky h-[76px] w-[70px] shrink-0 object-contain"
            />
            <p className="min-w-0 flex-1 break-keep text-[13px] font-semibold leading-[1.85] text-[#365f99] sm:text-[15px]">
              와, 소개 준비가 끝났어요!
              <span className="block">이제 좋은 인연을 찾는 일은</span>
              <span className="block">투윅스가 함께할게요.</span>
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-[#e5ebf3] px-4 py-1 sm:px-6">
            {reviewStages.map((item, index) => (
              <div key={item.title} className={`flex items-start gap-3 py-4 ${index ? "border-t border-[#e9edf3]" : ""}`}>
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                  item.kind === "done"
                    ? "bg-[#e6f3ee] text-[#238b61]"
                    : item.kind === "current"
                      ? "bg-[#326bcd] text-white"
                      : "bg-[#edf1f5] text-[#8b9aaa]"
                }`}>
                  {item.kind === "done" ? <FiCheck aria-hidden="true" /> : index + 1}
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-[#183452]">{item.title}</p>
                  <p className="mt-1 break-keep text-[13px] leading-[1.7] text-[#72839a]">{item.description}</p>
                </div>
                {item.kind === "current" && <FiClock aria-label="진행 예정" className="ml-auto mt-1 shrink-0 text-[#326bcd]" />}
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2.5 text-[13px] leading-[1.8] text-[#687b91]">
            <p className="flex items-start gap-2">
              <FiMessageCircle className="mt-1 shrink-0 text-[#718baa]" aria-hidden="true" />
              검토 결과와 이후 안내는 문자로 전해드릴게요.
            </p>
            <p className="flex items-start gap-2">
              <FiShield className="mt-1 shrink-0 text-[#718baa]" aria-hidden="true" />
              만남보증금은 지금 입금하지 않으셔도 돼요. 필요할 때 따로 안내드릴게요.
            </p>
          </div>

          <Link
            href={TWOWEEKS_DASHBOARD_PATH}
            className="mt-8 flex min-h-14 w-full items-center justify-center gap-2 rounded-[15px] bg-[#2569ce] px-5 py-4 text-[16px] font-extrabold text-white transition hover:bg-[#1754ae] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2569ce]"
          >
            내 신청현황 확인하기 <FiChevronRight className="text-lg" aria-hidden="true" />
          </Link>
          <p className="mt-3 text-center text-xs leading-5 text-[#8291a3]">
            신청현황은 휴대폰 문자 6자리 인증 후 확인할 수 있어요.
          </p>
        </section>
        <style jsx global>{`
          @keyframes tw-complete-float {
            0%, 100% { transform: translateY(0) rotate(-1deg); }
            50% { transform: translateY(-4px) rotate(1deg); }
          }
          .tw-complete-wicky { animation: tw-complete-float 3.2s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) {
            .tw-complete-wicky { animation: none; }
          }
        `}</style>
      </main>
    </RegisterLayout>
  );
}
