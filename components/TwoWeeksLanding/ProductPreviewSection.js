import { motion, useReducedMotion } from "framer-motion";
import {
  FiCalendar,
  FiCheck,
  FiCoffee,
  FiMapPin,
  FiMessageCircle,
  FiUser,
} from "react-icons/fi";
import MobileFrame from "./MobileFrame";
import MobileSwipeCarousel from "./MobileSwipeCarousel";

function PreviewShell({ title, step, children }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-solid border-slate-200 bg-white shadow-[0_22px_62px_rgba(15,23,32,0.10)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <div className="text-[10px] font-black tracking-[0.12em] text-[#d85b48]">{step}</div>
          <div className="mt-1 text-base font-black tracking-[-0.035em] text-slate-950">{title}</div>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-700">2W</span>
      </div>
      <div className="min-h-[430px] bg-[#f7f8fa] p-4 sm:p-5">{children}</div>
    </div>
  );
}

function ProposalPreview() {
  return (
    <PreviewShell title="한 사람의 프로필" step="PROPOSAL">
      <div className="rounded-[22px] bg-white p-4 shadow-sm">
        <div className="flex aspect-[16/9] items-center justify-center rounded-2xl bg-[#e9edf1]">
          <span className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-slate-300 text-3xl text-white">
            <FiUser aria-hidden="true" />
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-lg font-black tracking-[-0.04em] text-slate-950">프로필 정보</div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">운영자 확인</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-slate-600">
          {["나이 · 직업군", "활동지역", "가능한 일정", "기본 가치관"].map((label) => (
            <div key={label} className="rounded-xl bg-slate-50 px-3 py-3">{label}</div>
          ))}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black">
        <div className="rounded-xl border border-slate-200 bg-white py-3 text-center text-slate-600">이번 만남은 쉴게요</div>
        <div className="rounded-xl bg-slate-950 py-3 text-center text-white">진행할래요</div>
      </div>
    </PreviewShell>
  );
}

function SchedulePreview() {
  return (
    <PreviewShell title="일정과 카페 선택" step="SCHEDULE">
      <div className="rounded-[22px] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-black text-slate-950">
          <FiCalendar className="text-[#d85b48]" aria-hidden="true" /> 가능한 일정
        </div>
        <div className="mt-4 space-y-2">
          {["금요일 19:30", "토요일 14:00", "일요일 19:00"].map((slot, index) => (
            <div
              key={slot}
              className={`flex items-center justify-between rounded-xl border px-3 py-3 text-xs font-bold ${
                index === 1
                  ? "border-[#d85b48] bg-[#fff8f6] text-slate-950"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              {slot}
              {index === 1 ? <FiCheck className="text-[#d85b48]" aria-hidden="true" /> : null}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 rounded-[22px] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-black text-slate-950">
          <FiMapPin className="text-[#d85b48]" aria-hidden="true" /> 추천 카페
        </div>
        <div className="mt-3 grid grid-cols-[52px_1fr_auto] items-center gap-3 rounded-xl bg-slate-50 p-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8ded2] text-slate-700">
            <FiCoffee aria-hidden="true" />
          </span>
          <div>
            <div className="text-xs font-black text-slate-900">역에서 가까운 카페</div>
            <div className="mt-1 text-[10px] font-semibold text-slate-500">조용한 좌석 · 도보 5분</div>
          </div>
          <span className="rounded-full bg-slate-950 px-2.5 py-1.5 text-[10px] font-black text-white">선택</span>
        </div>
      </div>
    </PreviewShell>
  );
}

function MeetingPreview() {
  return (
    <PreviewShell title="만남 전후 안내" step="MEETING">
      <div className="rounded-[22px] border border-emerald-100 bg-emerald-50 p-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
          <FiCheck aria-hidden="true" />
        </span>
        <div className="mt-3 text-sm font-black text-emerald-900">만남이 확정됐어요</div>
        <p className="mt-1.5 text-xs font-semibold leading-5 text-emerald-800">선택한 일정과 카페를 한 화면에서 확인합니다.</p>
      </div>

      <div className="mt-3 rounded-[22px] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-black text-slate-950">
          <FiMessageCircle className="text-[#d85b48]" aria-hidden="true" /> 만남 전 한마디
        </div>
        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-600">
          베이지색 자켓을 입고 창가 쪽에 있을게요.
        </div>
      </div>

      <div className="mt-3 rounded-[22px] bg-white p-4 shadow-sm">
        <div className="text-sm font-black text-slate-950">만남은 어떠셨나요?</div>
        <p className="mt-1.5 text-[11px] font-semibold leading-5 text-slate-500">재만남과 연락처 공개 여부를 각각 선택합니다.</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-black">
          <div className="rounded-xl border border-slate-200 py-3 text-center text-slate-600">이번 만남으로 충분해요</div>
          <div className="rounded-xl bg-slate-950 py-3 text-center text-white">다시 만나고 싶어요</div>
        </div>
      </div>
    </PreviewShell>
  );
}

const PREVIEWS = [
  {
    title: "프로필을 보고 선택",
    desc: "상대의 기본 정보를 확인한 뒤 내가 만나고 싶을 때만 진행합니다.",
    Component: ProposalPreview,
  },
  {
    title: "일정과 카페를 한 번에",
    desc: "겹치는 시간을 고르고 두 사람이 편한 카페를 선택합니다.",
    Component: SchedulePreview,
  },
  {
    title: "만남 전후까지 안내",
    desc: "한마디 전달부터 피드백과 연락처 공개 선택까지 이어집니다.",
    Component: MeetingPreview,
  },
];

function PreviewCard({ item, index, reduceMotion }) {
  const { title, desc, Component } = item;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: 0.6, delay: reduceMotion ? 0 : index * 0.06 }}
      className="h-full"
    >
      <Component />
      <div className="px-1 pt-5">
        <h3 className="text-xl font-black tracking-[-0.04em] text-slate-950">{title}</h3>
        <p className="mt-2 break-keep text-sm font-medium leading-7 text-slate-600">{desc}</p>
      </div>
    </motion.article>
  );
}

export default function ProductPreviewSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="screen" className="border-b border-slate-100 bg-[#f7f8fa] py-16 md:py-28">
      <MobileFrame>
        <div className="max-w-3xl">
          <p className="text-xs font-black tracking-[0.08em] text-[#d85b48]">투윅스 이용 화면</p>
          <h2 className="mt-3 break-keep text-[34px] font-black leading-[1.15] tracking-[-0.055em] text-slate-950 md:text-6xl">
            매칭부터 약속 확정까지,
            <br />
            오프라인 중심 만남구조
          </h2>
          <p className="mt-5 max-w-2xl break-keep text-base font-medium leading-8 text-slate-600 md:text-lg">
            상대 제안부터 약속 장소와 일정 선택, 만남 전 한마디와 피드백까지 투윅스 안에서 안내합니다.
          </p>
        </div>

        <MobileSwipeCarousel label="투윅스 이용 화면 예시" className="mt-9 lg:hidden">
          {PREVIEWS.map((item, index) => (
            <PreviewCard key={item.title} item={item} index={index} reduceMotion={reduceMotion} />
          ))}
        </MobileSwipeCarousel>

        <div className="mt-14 hidden grid-cols-3 gap-6 lg:grid">
          {PREVIEWS.map((item, index) => (
            <PreviewCard key={item.title} item={item} index={index} reduceMotion={reduceMotion} />
          ))}
        </div>

        {/* <p className="mt-7 text-xs font-semibold leading-6 text-slate-500">
          실제 기능 흐름을 바탕으로 개인정보 없이 정리한 화면 예시입니다.
        </p> */}
      </MobileFrame>
    </section>
  );
}
