import { useMemo, useState } from "react";
import ScheduleDeadlineBanner from "./ScheduleDeadlineBanner";
import ScheduleSlotPicker from "./ScheduleSlotPicker";
import AreaPicker from "./AreaPicker";
import CafePicker from "./CafePicker";

function formatRemaining(deadline) {
  if (!deadline) return "기한 정보 없음";

  const now = Date.now();
  const end = new Date(deadline).getTime();
  const diff = end - now;

  if (diff <= 0) return "선택기한이 지났습니다.";

  const totalMinutes = Math.floor(diff / 1000 / 60);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}일 ${hours}시간`;
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분`;
}

export default function ScheduleCoordinationTab({
  deadline,
  scheduleSlots = [],
  areaOptions = [],
  cafeOptionsByArea = {},
  initialSelection,
  onSubmit,
  submitting = false,
}) {
  const [selectedSlot, setSelectedSlot] = useState(initialSelection?.slot || null);
  const [selectedArea, setSelectedArea] = useState(initialSelection?.area || "");
  const [selectedCafe, setSelectedCafe] = useState(initialSelection?.cafe || null);

  const remainingText = formatRemaining(deadline);
  const expired = remainingText === "선택기한이 지났습니다.";

  const cafes = useMemo(() => {
    if (!selectedArea) return [];
    return cafeOptionsByArea[selectedArea] || [];
  }, [selectedArea, cafeOptionsByArea]);

  const canSubmit = selectedSlot && selectedArea && selectedCafe && !expired && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;

    onSubmit?.({
      slot: selectedSlot,
      area: selectedArea,
      cafe: selectedCafe,
    });
  };

  return (
    <div className="space-y-5">
      <ScheduleDeadlineBanner
        remainingText={remainingText}
        expired={expired}
        reminderText="일정과 장소를 모두 선택해야 제출됩니다."
      />

      <ScheduleSlotPicker
        slots={scheduleSlots}
        selectedSlotId={selectedSlot?.id}
        onSelect={(slot) => setSelectedSlot(slot)}
      />

      <AreaPicker
        areas={areaOptions}
        selectedArea={selectedArea}
        onSelect={(area) => {
          setSelectedArea(area);
          setSelectedCafe(null);
        }}
        disabled={expired}
      />

      <CafePicker
        cafes={cafes}
        selectedCafeId={selectedCafe?.id}
        onSelect={(cafe) => setSelectedCafe(cafe)}
        disabled={expired}
      />

      <section className="border border-solid border-slate-200 bg-white p-5 md:p-6">
        <div className="mb-4 text-lg font-bold text-slate-900">선택 내용 확인</div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="border border-solid border-slate-200 bg-slate-50 px-4 py-4">
            <div className="text-xs font-semibold tracking-[0.16em] text-slate-400">
              일정
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">
              {selectedSlot?.label || "선택 전"}
            </div>
          </div>

          <div className="border border-solid border-slate-200 bg-slate-50 px-4 py-4">
            <div className="text-xs font-semibold tracking-[0.16em] text-slate-400">
              지역
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">
              {selectedArea || "선택 전"}
            </div>
          </div>

          <div className="border border-solid border-slate-200 bg-slate-50 px-4 py-4">
            <div className="text-xs font-semibold tracking-[0.16em] text-slate-400">
              카페
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">
              {selectedCafe?.name || "선택 전"}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`border border-solid px-5 py-3 text-sm font-semibold transition ${canSubmit
                ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
              }`}
          >
            {submitting ? "제출 중..." : "선택 완료하기"}
          </button>
        </div>
      </section>
    </div>
  );
}