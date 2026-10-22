import { FiArrowRight, FiX } from "react-icons/fi";

export default function DashboardConfirmModal({ open, onClose, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10010] flex items-center justify-center bg-[#0f2338]/45 px-5 backdrop-blur-[2px]">
      <div className="w-full max-w-[360px] rounded-[22px] border border-[#dce6f3] bg-white p-5 shadow-[0_24px_60px_rgba(15,42,67,0.2)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black tracking-[0.08em] text-[#3f73d8]">신청현황 조회</p>
            <h3 className="mt-2 break-keep text-[22px] font-black leading-[1.35] tracking-[-0.04em] text-[#102a43]">
              이미 신청하셨다면<br />
              신청현황으로 이동할까요?
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d8e0ea] bg-white text-[#526a82] transition hover:border-[#9db8de] hover:text-[#1d5dc2]"
          >
            <FiX />
          </button>
        </div>

        <p className="mt-4 break-keep text-sm font-medium leading-6 text-[#63788f]">
          기존에 등록한 신청서가 있다면, 인증 후 현재 진행상황을 바로 확인할 수 있어요.
        </p>

        <div className="mt-5 rounded-[16px] bg-[#f5f8fe] px-4 py-3 text-left text-xs leading-5 text-[#6c8095]">
          휴대폰 문자로 받은 <span className="font-bold text-[#355a89]">6자리 인증번호</span>를 입력해 조회해요.
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-[12px] border border-[#d6dee7] bg-white text-sm font-bold text-[#536a80] transition hover:bg-[#f7f9fc]"
          >
            계속 작성하기
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-[#1769d2] px-4 text-sm font-extrabold text-white transition hover:bg-[#1259b5]"
          >
            현황 보러 가기 <FiArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}
