import {
  FiCalendar,
  FiCheck,
  FiCoffee,
  FiMapPin,
  FiMessageCircle,
  FiShield,
  FiUser,
} from "react-icons/fi";

function ScreenShell({ eyebrow, title, activeTab, children }) {
  const tabs = ["대상후보", "일정조율", "신청현황", "예치금"];

  return (
    <article className="h-full min-w-[286px] overflow-hidden rounded-[28px] border border-slate-200 bg-[#f0f2f5] shadow-[0_22px_70px_rgba(15,23,42,0.09)] sm:min-w-[340px] lg:min-w-0">
      <div className="bg-white px-4 pb-3 pt-4">
        <div className="text-[10px] font-black tracking-[0.14em] text-[#d85b48]">
          {eyebrow}
        </div>
        <div className="mt-1 text-lg font-black tracking-[-0.04em] text-slate-950">
          {title}
        </div>
        <div className="mt-4 flex gap-1 overflow-hidden rounded-xl bg-slate-100 p-1 text-[9px] font-black text-slate-500">
          {tabs.map((tab) => (
            <span
              key={tab}
              className={`flex-1 whitespace-nowrap rounded-lg px-1 py-2 text-center ${
                tab === activeTab ? "bg-[#1877f2] text-white shadow-sm" : ""
              }`}
            >
              {tab}
            </span>
          ))}
        </div>
      </div>
      <div className="min-h-[390px] p-4">{children}</div>
    </article>
  );
}

function ProposalScreen() {
  return (
    <ScreenShell eyebrow="PROPOSAL" title="한 사람의 프로필" activeTab="대상후보">
      <div className="rounded-[22px] bg-white p-4 shadow-sm">
        <div className="flex aspect-[16/9] items-center justify-center rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100">
          <span className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-slate-300 text-3xl text-white shadow-sm">
            <FiUser aria-hidden="true" />
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-base font-black text-slate-950">소개받은 상대</div>
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700">
            운영자 확인
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600">
          {["나이 · 직업군", "활동지역", "가능한 일정", "기본 가치관"].map((label) => (
            <div key={label} className="rounded-xl bg-slate-50 px-3 py-2.5">
              {label}
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl bg-[#fff8f6] px-3 py-2.5 text-[10px] font-bold leading-5 text-[#9f3f31]">
          생활권과 가능한 시간이 잘 맞아 제안드렸어요.
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-black">
        <div className="rounded-xl border border-slate-200 bg-white py-3 text-center text-slate-600">
          이번 만남은 쉴게요
        </div>
        <div className="rounded-xl bg-slate-950 py-3 text-center text-white">
          진행할래요
        </div>
      </div>
    </ScreenShell>
  );
}

function ScheduleScreen() {
  return (
    <ScreenShell eyebrow="SCHEDULE" title="일시와 카페 선택" activeTab="일정조율">
      <div className="rounded-[22px] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-black text-slate-950">
          <FiCalendar className="text-[#1877f2]" aria-hidden="true" /> 가능한 일시
        </div>
        <div className="mt-3 space-y-2 text-[10px] font-bold">
          {["금요일 19:30", "토요일 14:00", "일요일 19:00"].map((slot, index) => (
            <div
              key={slot}
              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${
                index < 2
                  ? "border-blue-200 bg-blue-50 text-blue-800"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              {slot}
              {index < 2 ? <FiCheck aria-hidden="true" /> : null}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 rounded-[22px] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-black text-slate-950">
          <FiMapPin className="text-[#d85b48]" aria-hidden="true" /> 카페 후보
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eee2d7] text-slate-700">
            <FiCoffee aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[10px] font-black text-slate-900">역에서 가까운 카페</div>
            <div className="mt-1 text-[9px] font-semibold text-slate-500">조용한 좌석 · 도보 5분</div>
          </div>
          <span className="rounded-full bg-slate-950 px-2.5 py-1.5 text-[9px] font-black text-white">
            선택
          </span>
        </div>
      </div>
    </ScreenShell>
  );
}

function MeetingScreen() {
  return (
    <ScreenShell eyebrow="MEETING" title="만남 확정 안내" activeTab="일정조율">
      <div className="rounded-[22px] border border-emerald-100 bg-emerald-50 p-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
          <FiCheck aria-hidden="true" />
        </span>
        <div className="mt-3 text-sm font-black text-emerald-900">만남이 확정됐어요</div>
        <div className="mt-2 text-[10px] font-bold leading-5 text-emerald-800">
          토요일 14:00 · 선택한 카페
        </div>
      </div>
      <div className="mt-3 rounded-[22px] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-black text-slate-950">
          <FiMessageCircle className="text-[#d85b48]" aria-hidden="true" /> 만남 전 한마디
        </div>
        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-[10px] font-bold leading-5 text-slate-600">
          베이지색 자켓을 입고 창가 쪽에 있을게요.
        </div>
      </div>
      <div className="mt-3 rounded-[22px] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-black text-slate-950">
          <FiCheck className="text-[#1877f2]" aria-hidden="true" /> 현장 도착 확인
        </div>
        <div className="mt-2 text-[10px] font-semibold leading-5 text-slate-500">
          약속 당일 자리 사진을 올리면 서로를 찾고 참석 여부를 확인할 수 있어요.
        </div>
      </div>
    </ScreenShell>
  );
}

function DepositScreen() {
  return (
    <ScreenShell eyebrow="DEPOSIT" title="내 예치금 현황" activeTab="예치금">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-[9px] font-bold text-slate-500">현재 잔액</div>
          <div className="mt-2 text-xl font-black tracking-[-0.04em] text-slate-950">30,000원</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-[9px] font-bold text-slate-500">누적 차감</div>
          <div className="mt-2 text-xl font-black tracking-[-0.04em] text-rose-600">0원</div>
        </div>
      </div>
      <div className="mt-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2 text-xs font-black text-emerald-900">
          <FiShield aria-hidden="true" /> 다음 매칭 참여 가능
        </div>
        <div className="mt-2 text-[10px] font-semibold leading-5 text-emerald-800">
          회원별 기준 예치금이 충족되어 있습니다.
        </div>
      </div>
      <div className="mt-3 rounded-[22px] bg-white p-4 shadow-sm">
        <div className="text-xs font-black text-slate-950">예치금 반환</div>
        <div className="mt-2 text-[10px] font-semibold leading-5 text-slate-500">
          진행 중인 만남이 없을 때 반환 계좌를 입력해 요청할 수 있습니다.
        </div>
        <div className="mt-3 inline-flex rounded-xl border border-slate-300 px-3 py-2 text-[9px] font-black text-slate-700">
          반환 기준 확인
        </div>
      </div>
    </ScreenShell>
  );
}

export default function GuideScreenExamples() {
  return (
    <section id="screens" className="border-y border-slate-100 bg-[#f7f8fa] py-16 md:py-24">
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-black tracking-[0.1em] text-[#d85b48]">화면으로 미리 보기</p>
          <h2 className="mt-3 break-keep text-[32px] font-black leading-[1.18] tracking-[-0.055em] text-slate-950 md:text-5xl">
            신청현황에서 순서대로 안내합니다.
          </h2>
          <p className="mt-4 break-keep text-base font-medium leading-8 text-slate-600 md:text-lg">
            제안 확인부터 일정·카페 선택, 당일 안내와 예치금 확인까지 각각의 탭에서 필요한 행동만 보여드립니다.
          </p>
        </div>

        <div className="-mx-5 mt-9 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:-mx-8 md:px-8 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          <div className="snap-start"><ProposalScreen /></div>
          <div className="snap-start"><ScheduleScreen /></div>
          <div className="snap-start"><MeetingScreen /></div>
          <div className="snap-start"><DepositScreen /></div>
        </div>

        <p className="mt-4 text-xs font-semibold leading-6 text-slate-500">
          개인정보 없이 실제 기능 흐름을 재구성한 화면 예시이며, 진행 상태에 따라 보이는 내용은 달라질 수 있습니다.
        </p>
      </div>
    </section>
  );
}
