import { FiBriefcase, FiCalendar, FiClock, FiImage, FiMapPin, FiUser } from "react-icons/fi";
import { PROFILE_EXAMPLE } from "./constants";
import { useObjectUrl } from "./FormControls";

const icons = [FiBriefcase, FiMapPin, FiCalendar, FiClock];

export default function ProfilePreviewCard({ form }) {
  const photoUrl = useObjectUrl(form?.representativePhoto);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_36px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-black tracking-[-0.04em] text-slate-950">상대에게 보여질 프로필 예시</h3>
        <FiUser className="text-slate-400" />
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="relative h-40 bg-slate-100">
          {photoUrl ? (
            <img src={photoUrl} alt="대표 사진 미리보기" className="h-full w-full object-cover blur-[5px] scale-105" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
              <FiImage className="text-3xl" />
              <div className="mt-2 text-xs font-semibold">대표 사진 흐림 예시</div>
            </div>
          )}
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-700 backdrop-blur">
            매칭 제안 시 흐림/일부 공개 예시
          </div>
        </div>

        <div className="p-5">
          <div className="text-xl font-black leading-8 tracking-[-0.04em] text-slate-950">{PROFILE_EXAMPLE.title}</div>
          <div className="mt-1 text-base font-bold text-slate-950">{PROFILE_EXAMPLE.subtitle}</div>

          <div className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
            {PROFILE_EXAMPLE.rows.map(([label, value], index) => {
              const Icon = icons[index];
              return (
                <div key={label} className="flex items-center gap-4 py-3 text-sm">
                  <Icon className="text-slate-400" />
                  <div className="w-24 text-slate-500">{label}</div>
                  <div className="font-bold text-slate-950">{value}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
