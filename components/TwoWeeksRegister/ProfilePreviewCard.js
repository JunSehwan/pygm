import { FiBriefcase, FiCalendar, FiClock, FiImage, FiMapPin, FiUser } from "react-icons/fi";
import { useObjectUrl } from "./FormControls";
import { formatFullAgeLabel, normalizeTimeSlotLabels } from "./helpers";

const GENDER_LABELS = {
  male: "남성",
  female: "여성",
};

function normalizeList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function compactList(values, { limit = 2, emptyLabel = "미입력", suffix = "" } = {}) {
  const list = normalizeList(values);
  if (!list.length) return emptyLabel;

  const visible = list.slice(0, limit).join(" · ");
  const rest = list.length - limit;
  const restLabel = rest > 0 ? ` 외 ${rest}${suffix}` : "";

  return `${visible}${restLabel}`;
}

function buildAreaValues(form) {
  const areas = normalizeList(form?.activityAreas);
  const preferredArea = String(form?.preferredArea || "").trim();

  if (!preferredArea) return areas;

  return [preferredArea, ...areas.filter((area) => area !== preferredArea)];
}

export default function ProfilePreviewCard({ form }) {
  const photoUrl = useObjectUrl(form?.representativePhoto);
  const photoCount = [form?.representativePhoto, ...(form?.additionalPhotos || [])].filter(Boolean).length;
  const genderLabel = GENDER_LABELS[form?.gender] || "성별 미입력";
  const ageLabel = formatFullAgeLabel({
    birth: form?.identityVerifiedData?.birth || "",
    birthYear: form?.birthYear || "",
  });
  const jobLabel = String(form?.jobCategory || "").trim() || "직업 미입력";
  const nickname = String(form?.nickname || "").trim();
  const introduction = String(form?.introduction || "").trim();
  const areaValues = buildAreaValues(form);
  const timeValues = normalizeTimeSlotLabels(form?.availableTimeSlots);
  const areaSummary = compactList(areaValues, { limit: 2, emptyLabel: "활동 지역 미입력", suffix: "곳" });
  const timeSummary = compactList(timeValues, { limit: 2, emptyLabel: "가능 시간 미입력", suffix: "개" });
  const heightLabel = form?.height ? `${form.height}cm` : "미입력";

  const rows = [
    { label: "직업", value: jobLabel, Icon: FiBriefcase },
    { label: "활동 지역", value: compactList(areaValues, { limit: 3, emptyLabel: "미입력", suffix: "곳" }), Icon: FiMapPin },
    { label: "가능 시간", value: compactList(timeValues, { limit: 3, emptyLabel: "미입력", suffix: "개" }), Icon: FiClock },
    { label: "키", value: heightLabel, Icon: FiUser },
  ];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_36px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold tracking-[-0.04em] text-slate-950">상대에게 보여질 기본 프로필</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">(종교, 음주 등 7가지 응답도 보여집니다.)</p>
        </div>
        <FiUser className="mt-1 shrink-0 text-slate-400" />
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="relative aspect-[4/5] bg-slate-100">
          {photoUrl ? (
            <img src={photoUrl} alt="대표 사진 미리보기" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
              <FiImage className="text-3xl" />
              <div className="mt-2 text-xs font-semibold">대표 사진을 등록해주세요</div>
            </div>
          )}
          <div className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">
            실제 프로필 미리보기
          </div>
          <div className="absolute right-3 top-3 rounded-full bg-black/65 px-3 py-1 text-xs font-bold text-white backdrop-blur">
            사진 {photoCount}장
          </div>
        </div>

        <div className="p-5">
          {nickname ? <div className="mb-1 text-sm font-bold text-slate-500">{nickname}</div> : null}
          <div className="text-xl font-bold leading-8 tracking-[-0.04em] text-slate-950">
            {genderLabel} / {ageLabel} / {jobLabel}
          </div>
          <div className="mt-1 break-keep text-sm font-bold leading-6 text-slate-950">
            {areaSummary} / {timeSummary}
          </div>

          <div className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
            {rows.map(({ label, value, Icon }) => (
              <div key={label} className="flex items-start gap-4 py-3 text-sm">
                <Icon className="mt-0.5 shrink-0 text-slate-400" />
                <div className="w-20 shrink-0 text-slate-500">{label}</div>
                <div className="min-w-0 break-keep font-bold leading-5 text-slate-950">{value}</div>
              </div>
            ))}
          </div>

          {introduction ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <FiCalendar />
                짧은 자기소개
              </div>
              <p className="mt-2 whitespace-pre-line break-keep text-sm font-semibold leading-6 text-slate-800">{introduction}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
