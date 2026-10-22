import { FiCheck } from "react-icons/fi";
import MobileFrame from "./MobileFrame";
import MobileSwipeCarousel from "./MobileSwipeCarousel";
import { COMPARISON_ROWS } from "./constants";

const SERVICES = [
  {
    key: "twoweeks",
    name: "투윅스",
    summary: "한 사람과 실제 만남에 집중",
    featured: true,
  },
  {
    key: "groupMeeting",
    name: "직장인 단체미팅",
    summary: "여러 사람과 로테이션으로 짧게 대화",
  },
  {
    key: "datingApp",
    name: "소개팅앱",
    summary: "프로필 탐색과 채팅을 중심으로 연결",
  },
];

function ComparisonCard({ service }) {
  return (
    <article
      className={`relative h-full overflow-hidden rounded-[28px] border border-solid bg-white p-6 md:p-7 ${
        service.featured
          ? "border-[#ff5b4d] shadow-[0_22px_60px_rgba(255,91,77,0.13)]"
          : "border-slate-200"
      }`}
    >
      <div className="border-b border-slate-200 pb-6">
        <h3
          className={`text-2xl font-black tracking-[-0.04em] ${
            service.featured ? "text-[#e94f42]" : "text-slate-950"
          }`}
        >
          {service.name}
        </h3>
        <p className="mt-2 break-keep text-sm font-semibold leading-6 text-slate-500">
          {service.summary}
        </p>
      </div>

      <dl>
        {COMPARISON_ROWS.map((row) => (
          <div
            key={row.label}
            className="grid min-h-[98px] grid-cols-[82px_1fr] items-center gap-4 border-solid border-b border-slate-100 py-5 last:border-b-0"
          >
            <dt className="text-xs font-black text-slate-400">{row.label}</dt>
            <dd
              className={`flex break-keep text-sm font-bold leading-6 md:text-[15px] ${
                service.featured ? "text-slate-950" : "text-slate-600"
              }`}
            >
              {service.featured ? (
                <FiCheck
                  aria-hidden="true"
                  className="mr-2 mt-0.5 shrink-0 text-lg text-[#ff5b4d]"
                />
              ) : null}
              <span>{row[service.key]}</span>
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export default function CompareSection() {
  return (
    <section id="compare" className="border-b border-slate-200 bg-white text-slate-950">
      <MobileFrame className="py-16 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-black tracking-[0.08em] text-[#ff5b4d] md:text-sm">
            서비스 비교
          </p>
          <h2 className="mt-5 break-keep text-[38px] font-black leading-[1.12] tracking-[-0.055em] md:text-6xl">
            다양한 만남의 방식과
            <br />
            투윅스를 비교해보세요.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl break-keep text-base font-medium leading-8 text-slate-600 md:text-lg">
            부담은 줄이고, 한 사람과의 60분 만남에 집중합니다.
          </p>
        </div>

        <MobileSwipeCarousel
          label="소개팅 방식 비교"
          className="mt-10 lg:hidden"
        >
          {SERVICES.map((service) => (
            <ComparisonCard key={service.key} service={service} />
          ))}
        </MobileSwipeCarousel>

        <div className="mx-auto mt-16 hidden max-w-6xl gap-5 lg:grid lg:grid-cols-3 lg:items-stretch">
          {SERVICES.map((service) => (
            <ComparisonCard key={service.key} service={service} />
          ))}
        </div>

        <p className="mx-auto mt-5 max-w-3xl break-keep text-center text-xs font-medium leading-6 text-slate-500 md:mt-7 md:text-sm">
          * 서비스별 운영 방식과 비용은 상품·지역에 따라 달라질 수 있습니다. 투윅스는 현재 오픈 기간 동안 매칭비 없이 운영됩니다.
        </p>
      </MobileFrame>
    </section>
  );
}
