import React from "react";

export default function WelcomeExploreConfirmModal({
  open,
  onClose,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-[400px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="px-5 py-10">
          <h3 className="text-2xl font-black tracking-tight text-slate-800">
            다른 서비스 둘러보기
          </h3>

          <p className="mt-8 text-md leading-6 text-slate-600">
            매칭참여는 추후에 진행하시겠나요?
            <br />
            (추후, 내 프로필에서 정보입력 후,
            매칭참여 가능)
          </p>
        </div>

        <div className="grid grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            className="h-14 bg-slate-200 text-lg font-bold text-slate-800 transition hover:bg-slate-300"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-14 bg-rose-500 text-lg font-bold text-white transition hover:brightness-95"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}