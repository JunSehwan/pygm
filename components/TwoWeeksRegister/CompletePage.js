import { useRouter } from "next/router";
import Link from "next/link";
import { FiCheck, FiChevronRight, FiCreditCard, FiMessageCircle, FiUser } from "react-icons/fi";
import RegisterLayout from "./RegisterLayout";
import DepositPolicyCard from "./DepositPolicyCard";
import ProgressBar from "./ProgressBar";
import { KAKAO_INQUIRY_URL, TWOWEEKS_DASHBOARD_PATH } from "./constants";
import { markInquiryClicked } from "./twoweeksApplicationService";

function StatusRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-white/10 py-5 last:border-b-0">
      <div className="flex items-center gap-4 text-zinc-300">
        <span className="text-xl text-zinc-400">{icon}</span>
        <span className="text-base font-semibold">{label}</span>
      </div>
      <div className="text-right text-base font-semibold text-white">{value}</div>
    </div>
  );
}

export default function TwoWeeksCompletePage() {
  const router = useRouter();
  const applicationId = router.query.applicationId ? String(router.query.applicationId) : "";
  const dashboardToken = router.query.token ? String(router.query.token) : "";
  const dashboardHref =
    applicationId && dashboardToken
      ? `${TWOWEEKS_DASHBOARD_PATH}?aid=${encodeURIComponent(applicationId)}&token=${encodeURIComponent(dashboardToken)}`
      : TWOWEEKS_DASHBOARD_PATH;
  const gender = router.query.gender ? String(router.query.gender) : "";
  const depositPolicy = router.query.depositPolicy ? String(router.query.depositPolicy) : "";
  const isFemaleWaived = gender === "female" && depositPolicy === "waived";

  const handleKakaoClick = async () => {
    try {
      await markInquiryClicked(applicationId);
    } catch (error) {
      console.error("[TwoWeeksCompletePage] inquiry click update error:", error);
    }
    window.open(KAKAO_INQUIRY_URL, "_blank", "noopener,noreferrer");
  };

  if (router.isReady && isFemaleWaived) {
    return (
      <RegisterLayout>
        <main className="min-h-[calc(100svh-68px)] bg-white px-5 py-10 text-slate-950 md:min-h-[calc(100vh-78px)] md:py-16">
          <div className="mx-auto w-full max-w-[760px]">
            <ProgressBar step={4} />

            <section className="mt-9 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl text-blue-700">
                <FiCheck />
              </div>
              <h1 className="mt-7 break-keep text-[38px] font-black leading-tight tracking-[-0.06em] md:text-[52px]">
                가입이 완료되었습니다 :)
              </h1>
              <p className="mt-6 break-keep text-[16px] font-semibold leading-8 text-slate-600 md:text-[18px]">
                작성해주신 프로필을 확인한 뒤<br />
                잘 맞을 가능성이 있는 회원을 찾아 안내드릴게요.
              </p>

              <div className="mt-7 rounded-2xl bg-slate-50 p-5 text-[14px] font-semibold leading-7 text-slate-600 md:p-6 md:text-[15px]">
                추가로 원하는 남성의 스타일이나 중요하게 생각하는 조건이 있으시면
                1:1 상담을 통해 편하게 말씀해주세요.
                <br />
                별도로 원하시는 조건이 없으시면 현재 작성해주신 프로필을 기준으로 진행됩니다.
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleKakaoClick}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-[#173b73] px-5 text-[15px] font-black text-white transition hover:bg-[#102e5d]"
                >
                  원하는 스타일 상담하기 <FiChevronRight />
                </button>
                <Link
                  href={dashboardHref}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-[15px] font-black text-slate-900 transition hover:border-slate-900"
                >
                  신청현황 확인하기 <FiChevronRight />
                </Link>
              </div>

              <p className="mt-7 break-keep border-t border-slate-100 pt-5 text-[12px] font-semibold leading-5 text-slate-400">
                서로의 시간을 보호하기 위해 확정된 바이트소개팅의 당일 취소·무단 불참이 반복될 경우 이후 매칭이 제한될 수 있습니다.
              </p>
            </section>
          </div>
        </main>
      </RegisterLayout>
    );
  }

  return (
    <RegisterLayout dark>
      <main className="relative min-h-[calc(100svh-68px)] overflow-hidden bg-black text-white md:min-h-[calc(100vh-78px)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_70%,rgba(255,255,255,0.08),transparent_22%),radial-gradient(circle_at_80%_20%,rgba(255,115,22,0.12),transparent_20%)]" />
        <div className="pointer-events-none absolute bottom-[-80px] left-[4%] hidden opacity-[0.035] md:block">
          <img
            src="/logo/2weeks_logo_white.png"
            alt=""
            className="w-[420px] object-contain"
            draggable={false}
          />
        </div>

        <div className="relative mx-auto grid min-h-[calc(100svh-68px)] w-full max-w-[1320px] gap-10 px-5 py-10 md:min-h-[calc(100vh-78px)] md:grid-cols-[1fr_0.95fr] md:px-8 md:py-16 lg:items-center">
          <section className="flex flex-col justify-center">
            <ProgressBar step={4} dark />

            <div className="mt-10 flex h-16 w-16 items-center justify-center rounded-full border border-white/50 text-3xl md:h-20 md:w-20">
              <FiCheck />
            </div>

            <h1 className="mt-8 text-[42px] font-black leading-tight tracking-[-0.065em] md:text-[58px]">
              신청이 완료되었습니다
            </h1>

            <p className="mt-7 max-w-[560px] break-keep text-md leading-9 text-zinc-400 md:text-lg">
              신청 완료 문자에 포함된 개인 링크로 신청 현황을 확인할 수 있습니다.<br/>
              입금 후 프로필에 문제가 없으면 신청 완료 문자로 안내드립니다.<br/>
              인원모집 후, 매칭이 시작될 때 별도로 문자 안내드립니다.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row md:max-w-[560px]">
              <Link
                href={dashboardHref}
                className="inline-flex h-14 flex-1 items-center justify-center gap-3 rounded-xl bg-white px-5 text-base font-black text-black transition hover:bg-zinc-100 md:h-16"
              >
                신청 현황 바로 확인 <FiChevronRight />
              </Link>
              <button
                type="button"
                onClick={handleKakaoClick}
                className="inline-flex h-14 flex-1 items-center justify-center gap-3 rounded-xl border border-white/15 px-5 text-base font-bold text-white transition hover:border-white md:h-16"
              >
                카카오톡 문의하기 <FiChevronRight />
              </button>
            </div>
          </section>

          <aside className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8">
            <div className="divide-y divide-white/10">
              <StatusRow icon={<FiUser />} label="상태" value="신청 완료" />
              <StatusRow icon={<FiMessageCircle />} label="신청 완료 문자" value="개인 조회 링크 포함" />
              <StatusRow icon={<FiCreditCard />} label="예치금 확인" value="입금 확인 전" />
              <StatusRow icon={<FiMessageCircle />} label="문의" value="카카오톡 채널 가능" />
            </div>

            <div className="mt-6">
              <DepositPolicyCard dark />
            </div>
          </aside>
        </div>
      </main>
    </RegisterLayout>
  );
}
