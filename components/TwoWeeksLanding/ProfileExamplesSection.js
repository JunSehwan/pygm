import Image from "next/image";
import {
  FiBriefcase,
  FiCalendar,
  FiMapPin,
} from "react-icons/fi";
import MobileFrame from "./MobileFrame";
import MobileSwipeCarousel from "./MobileSwipeCarousel";
import { PROFILE_EXAMPLES } from "./constants";

function ProfileImage({ item }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-[#eef1f4]">
      <Image
        src={item.image}
        alt="신원을 식별할 수 없도록 가공된 프로필 이미지"
        fill
        sizes="(max-width: 767px) calc(100vw - 64px), 33vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/15 via-transparent to-white/5" />
      <span className="absolute bottom-3 left-3 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-[10px] font-black text-slate-600 shadow-sm backdrop-blur-md">
        개인정보 보호 가공
      </span>
    </div>
  );
}

function ProfileCard({ item }) {
  return (
    <article className="h-full rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_14px_38px_rgba(15,23,42,0.05)] md:p-5">
      <ProfileImage item={item} />
      <div className="px-1 pb-1 pt-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-black tracking-[-0.04em] text-slate-950">
            {item.age} · {item.job}
          </h3>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500">
            예시
          </span>
        </div>
        <div className="mt-4 space-y-2.5 text-sm font-bold text-slate-600">
          <p className="flex items-center gap-2">
            <FiBriefcase className="text-slate-400" aria-hidden="true" /> {item.job}
          </p>
          <p className="flex items-center gap-2">
            <FiMapPin className="text-slate-400" aria-hidden="true" /> {item.areas}
          </p>
          <p className="flex items-center gap-2">
            <FiCalendar className="text-slate-400" aria-hidden="true" /> {item.schedule}
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function ProfileExamplesSection() {
  return (
    <section className="border-b border-slate-100 bg-white py-16 md:py-28">
      <MobileFrame>
        <div className="max-w-3xl">
          <p className="text-xs font-black tracking-[0.08em] text-[#d85b48]">프로필에서 확인하는 정보</p>
          <h2 className="mt-3 break-keep text-[34px] font-black leading-[1.15] tracking-[-0.055em] text-slate-950 md:text-6xl">
            어떤 사람을 만나게 될까요?
          </h2>
          <p className="mt-5 break-keep text-base font-medium leading-8 text-slate-600 md:text-lg">
            만남 전에는 나이, 직업군, 활동지역, 가능한 일정과 기본 가치관을 확인합니다.
          </p>
        </div>

        <MobileSwipeCarousel label="프로필 정보 구성 예시" className="mt-9 md:hidden">
          {PROFILE_EXAMPLES.map((item) => (
            <ProfileCard key={`${item.age}-${item.job}`} item={item} />
          ))}
        </MobileSwipeCarousel>

        <div className="mt-14 hidden grid-cols-3 gap-6 md:grid">
          {PROFILE_EXAMPLES.map((item) => (
            <ProfileCard key={`${item.age}-${item.job}`} item={item} />
          ))}
        </div>

        <p className="mt-7 break-keep text-xs font-semibold leading-6 text-slate-500 md:text-sm">
          사진은 신원을 식별할 수 없도록 가공했으며, 나이·직업·지역·일정 등의 문구는 공개되는 정보 범위를 설명하기 위한 구성 예시입니다.
        </p>
      </MobileFrame>
    </section>
  );
}
