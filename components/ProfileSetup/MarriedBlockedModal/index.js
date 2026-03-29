import React from "react";

export default function MarriedBlockedModal({ open, onPickDivorced, onPickSingle }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-[390px] overflow-hidden rounded-[22px] bg-white shadow-2xl">
        <div className="px-6 pt-7 pb-6">
          <h2 className="text-[28px] font-black leading-tight text-slate-900">
            기혼자는
            <br />
            가입이 불가합니다.
          </h2>

          <p className="mt-5 whitespace-pre-line text-[13px] leading-6 text-slate-600">
            법적으로 미혼인 상태의 분만{"\n"}
            이용이 가능합니다.{"\n"}
            기혼 상태임에도 불구하고 가입을 시도하거나{"\n"}
            서비스를 이용하는 경우, 강제 탈퇴 조치가 이루어지며,{"\n"}
            이로 인해 발생하는 법적 책임이 귀속될 수 있음을{"\n"}
            명확히 알려드립니다.{"\n\n"}
            기혼자의 경우 가입을 중단해주시기 바랍니다.
          </p>

          {/* 링크형 선택지 */}
          <div className="mt-6 space-y-3">
            <button
              type="button"
              className="w-full py-2 text-center text-[13px] font-bold text-rose-500"
              onClick={() => {
                // 기혼 상태로 유지 + 닫지 않음(계속 경고 유지) 또는 닫기 선택
              }}
            >
              기혼입니다. 가입 제한
            </button>

            <button
              type="button"
              className="w-full py-2 text-center text-[13px] font-bold text-slate-700"
              onClick={onPickDivorced}
            >
              돌싱입니다. 가입 계속
            </button>
          </div>
        </div>

        {/* 하단 큰 버튼 */}
        <button
          type="button"
          onClick={onPickSingle}
          className="flex h-14 w-full py-2 items-center justify-center bg-[#0b63ce] text-[15px] font-extrabold text-white"
        >
          미혼입니다. 가입 계속
        </button>
      </div>
    </div>
  );
}