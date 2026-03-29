import React from "react";

export default function SignupCompleteModal({ open, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[360px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="px-5 py-5">
          <h3 className="text-[22px] font-black tracking-tight text-slate-900">
            축하합니다!
          </h3>
          <p className="mt-4 text-[15px] leading-7 text-slate-600">
            회원가입이 완료되었습니다.
            <br />
            이성과의 만남을 위해 프로필 정보를 입력해주세요.
          </p>
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className="flex h-14 w-full items-center justify-center bg-rose-500 text-lg font-extrabold text-white transition hover:opacity-95"
        >
          확인
        </button>
      </div>
    </div>
  );
}