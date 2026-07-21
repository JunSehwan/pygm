function openMap(url) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function CafePicker({
  cafes = [],
  selectedCafeId,
  onSelect,
  disabled = false,
}) {
  return (
    <section className="border border-solid border-slate-200 bg-white p-5 md:p-6">
      <div className="mb-4">
        <div className="text-lg font-bold text-slate-900">3. 카페 선택</div>
        <div className="mt-1 text-sm text-slate-500">
          지역을 선택하면 해당 지역의 추천 카페가 보입니다.
        </div>
      </div>

      {cafes.length === 0 ? (
        <div className="border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
          먼저 지역을 선택해주세요.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cafes.map((cafe) => {
            const selected = selectedCafeId === cafe.id;

            return (
              <div
                key={cafe.id}
                className={`border border-solid p-4 transition ${selected
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-white"
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div
                      className={`text-base font-bold ${selected ? "text-blue-700" : "text-slate-900"
                        }`}
                    >
                      {cafe.name}
                    </div>

                    {cafe.badge ? (
                      <div className="mt-2 inline-flex border border-solid border-orange-200 bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-600">
                        {cafe.badge}
                      </div>
                    ) : null}
                  </div>

                  {selected ? (
                    <span className="border border-solid border-blue-200 bg-white px-2 py-1 text-xs font-semibold text-blue-700">
                      선택됨
                    </span>
                  ) : null}
                </div>

                {cafe.address ? (
                  <div className="mt-3 text-sm text-slate-600">{cafe.address}</div>
                ) : null}

                {cafe.description ? (
                  <div className="mt-2 text-sm leading-6 text-slate-500">
                    {cafe.description}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onSelect(cafe)}
                    disabled={disabled}
                    className={`border border-solid px-4 py-2 text-sm font-semibold transition ${selected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    {selected ? "선택한 카페" : "이 카페 선택"}
                  </button>

                  <button
                    type="button"
                    onClick={() => openMap(cafe.mapUrl)}
                    className="border border-solid border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    네이버지도 보기
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}