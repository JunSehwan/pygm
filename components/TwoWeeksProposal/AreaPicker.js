export default function AreaPicker({
  areas = [],
  selectedArea,
  onSelect,
  disabled = false,
}) {
  return (
    <section className="border border-solid border-slate-200 bg-white p-5 md:p-6">
      <div className="mb-4">
        <div className="text-lg font-bold text-slate-900">2. 지역 선택</div>
        <div className="mt-1 text-sm text-slate-500">
          만남 가능한 지역 중 1개를 선택해주세요.
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {areas.map((area) => {
          const selected = selectedArea === area;

          return (
            <button
              key={area}
              type="button"
              onClick={() => onSelect(area)}
              disabled={disabled}
              className={`min-w-[100px] border border-solid px-4 py-3 text-sm font-semibold transition ${selected
                  ? "border-blue-500 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              {area}
            </button>
          );
        })}
      </div>
    </section>
  );
}