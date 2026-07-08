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

  const handleKakaoClick = async () => {
    try {
      await markInquiryClicked(applicationId);
    } catch (error) {
      console.error("[TwoWeeksCompletePage] inquiry click update error:", error);
    }
    window.open(KAKAO_INQUIRY_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <RegisterLayout dark>
      <main className="relative min-h-[calc(100svh-68px)] overflow-hidden bg-black text-white md:min-h-[calc(100vh-78px)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_70%,rgba(255,255,255,0.08),transparent_22%),radial-gradient(circle_at_80%_20%,rgba(255,115,22,0.12),transparent_20%)]" />
        <div className="pointer-events-none absolute bottom-[-120px] left-[6%] text-[220px] font-black tracking-[-0.12em] text-white/[0.035] md:text-[300px]">
          2W
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

            <p className="mt-7 max-w-[560px] break-keep text-lg leading-9 text-zinc-400 md:text-xl">
              투윅스 베타는 소수 인원으로 운영되며,
              신청 완료 문자에 포함된 개인 링크로 신청 현황을 바로 확인할 수 있습니다.
              예치금 입금 확인 및 매칭 가능 여부는 개별 안내드립니다.
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
              <StatusRow icon={<FiUser />} label="상태" value="applied" />
              <StatusRow icon={<FiMessageCircle />} label="신청 완료 문자" value="개인 조회 링크 포함" />
              <StatusRow icon={<FiCreditCard />} label="예치금 확인" value="대기중 또는 입금 확인 전" />
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
