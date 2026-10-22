import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FiChevronRight } from "react-icons/fi";
import { TWOWEEKS_DASHBOARD_PATH } from "./constants";
import DashboardConfirmModal from "./DashboardConfirmModal";

export default function RegisterHeader() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);
  const goDashboard = async () => {
    closeModal();
    try {
      const moved = await router.push(TWOWEEKS_DASHBOARD_PATH);
      if (moved === false && typeof window !== "undefined") window.location.assign(TWOWEEKS_DASHBOARD_PATH);
    } catch (error) {
      if (typeof window !== "undefined") window.location.assign(TWOWEEKS_DASHBOARD_PATH);
    }
  };

  return (
    <>
      <header className="fixed left-0 top-0 z-40 w-full border-b border-[#e3e8ef] bg-white/96 text-[#102a43] backdrop-blur">
        <div className="mx-auto flex h-[64px] w-full max-w-[720px] items-center justify-between px-4 sm:px-5 md:h-[72px] md:px-6">
          <Link href="/2weeks" className="flex min-w-0 items-center gap-2.5" aria-label="2WEEKS 홈">
            <img
              src="/logo/2weeks_logo.png"
              alt="2WEEKS"
              className="h-8 w-8 shrink-0 object-contain md:h-9 md:w-9"
              draggable={false}
            />
            <span className="truncate text-sm font-extrabold tracking-[-0.02em] text-[#164f9c] md:text-[15px]">
              내 소개 준비하기
            </span>
          </Link>

          <button
            type="button"
            onClick={openModal}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-[#d7e0eb] bg-white px-2.5 text-[11px] font-bold text-[#4d657e] transition hover:border-[#7fa8dc] hover:text-[#164f9c] md:h-9 md:px-3 md:text-xs"
          >
            신청현황 조회
            <FiChevronRight className="text-[13px]" />
          </button>
        </div>
      </header>

      <DashboardConfirmModal open={modalOpen} onClose={closeModal} onConfirm={goDashboard} />
    </>
  );
}
