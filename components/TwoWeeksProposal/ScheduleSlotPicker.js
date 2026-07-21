export default function ScheduleSlotPicker({
  slots = [],
  selectedSlotId,
  onSelect,
}) {
  return (
    <section className="border border-solid border-slate-200 bg-white p-5 md:p-6">
      <div className="mb-4">
        <div className="text-lg font-bold text-slate-900">1. 일정 선택</div>
        <div className="mt-1 text-sm text-slate-500">
          가능한 일정 중 1개를 먼저 선택해주세요.
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {slots.map((slot) => {
          const selected = selectedSlotId === slot.id;

          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => onSelect(slot)}
              className={`w-full border border-solid px-5 py-5 text-left transition ${selected
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div
                    className={`text-lg font-bold ${selected ? "text-blue-700" : "text-slate-900"
                      }`}
                  >
                    {slot.label}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {slot.description || "선택 가능한 일정"}
                  </div>
                </div>

                {selected ? (
                  <span className="border border-solid border-blue-200 bg-white px-2 py-1 text-xs font-semibold text-blue-700">
                    선택됨
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}