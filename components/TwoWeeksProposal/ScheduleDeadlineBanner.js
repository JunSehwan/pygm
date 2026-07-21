export default function ScheduleDeadlineBanner({
  remainingText,
  expired,
  reminderText,
}) {
  return (
    <div className="border border-solid border-blue-100 bg-gradient-to-br from-blue-50 to-slate-50 px-6 py-5 md:px-8 md:py-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold tracking-[0.2em] text-orange-500">
            SCHEDULE
          </span>

          <span
            className={`inline-flex items-center px-3 py-1 text-xs font-semibold border border-solid ${expired
                ? "border-red-200 bg-red-50 text-red-600"
                : "border-blue-200 bg-white text-blue-700"
              }`}
          >
            {expired ? "선택기한 종료" : "선택 진행중"}
          </span>
        </div>

        <div className="text-2xl font-bold text-slate-900">
          일정과 장소를 선택해주세요
        </div>

        <div className="text-sm leading-7 text-slate-600">
          만남 진행이 확정되었습니다. <br />
          <span className="font-semibold text-blue-700">
            기한 내 선택하지 않으면 이번 만남은 보류 의사로 간주됩니다.
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 border border-solid border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900">
            <span className="text-slate-500">남은 시간</span>
            <span>{remainingText}</span>
          </div>

          {reminderText ? (
            <div className="text-sm text-slate-500">{reminderText}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}