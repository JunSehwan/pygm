import React, { useMemo } from "react";
import {
  PiBroadcastDuotone,
  PiCardsDuotone,
  PiChartLineUpDuotone,
  PiCoinsDuotone,
  PiGenderFemaleDuotone,
  PiGenderMaleDuotone,
  PiHeartDuotone,
  PiMegaphoneDuotone,
  PiUsersThreeDuotone,
} from "react-icons/pi";
import { toMillis } from "../adminUtils";

function safeNumber(value) {
  const next = Number(value || 0);
  return Number.isFinite(next) ? next : 0;
}

function isFemale(user = {}) {
  return user?.gender === "female" || user?.identity_gender === "female";
}

function isMale(user = {}) {
  return user?.gender === "male" || user?.identity_gender === "male";
}

function isApprovedUser(user = {}) {
  return (
    user?.reviewStatus === "approved" ||
    user?.datingReviewStatus === "approved" ||
    user?.approvalStatus === "approved" ||
    user?.status === "approved" ||
    user?.isApproved === true
  );
}

function isPendingUser(user = {}) {
  return (
    user?.reviewStatus === "pending" ||
    user?.datingReviewStatus === "pending" ||
    user?.approvalStatus === "pending" ||
    user?.status === "pending"
  );
}

function isPublishedCard(card = {}) {
  return (
    card?.isPublished === true ||
    card?.status === "approved" ||
    card?.status === "published"
  );
}

function isPendingCard(card = {}) {
  return card?.status === "pending" || card?.approvalStatus === "pending";
}

function isSuccessfulMatch(match = {}) {
  return ["matched", "success", "accepted"].includes(match?.status || "");
}

function isConfirmedPayment(payment = {}) {
  return ["confirmed", "completed", "charged", "done"].includes(
    payment?.status || ""
  );
}

function isWithin(ms, startMs, endMs) {
  if (!ms) return false;
  return ms >= startMs && ms < endMs;
}

function getStartOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getStartOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getStartOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatNumber(value) {
  return safeNumber(value).toLocaleString();
}

function formatMoney(value) {
  return `${safeNumber(value).toLocaleString()}원`;
}

function getCreatedMs(item = {}) {
  return toMillis(item?.createdAt || item?.created_at || item?.timestamp);
}

function MetricCard({
  title,
  value,
  sub = "",
  icon: Icon,
  tone = "violet",
  big = false,
}) {
  const toneClass =
    tone === "rose"
      ? "bg-rose-50 text-rose-600"
      : tone === "blue"
        ? "bg-blue-50 text-blue-600"
        : tone === "emerald"
          ? "bg-emerald-50 text-emerald-600"
          : tone === "amber"
            ? "bg-amber-50 text-amber-600"
            : "bg-violet-50 text-violet-600";

  return (
    <div
      className={`rounded-md border border-slate-200 bg-white shadow-sm ${big ? "px-5 py-5" : "px-4 py-4"
        }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex shrink-0 items-center justify-center rounded-md ${toneClass} ${big ? "h-12 w-12" : "h-10 w-10"
            }`}
        >
          <Icon className={big ? "text-[24px]" : "text-[20px]"} />
        </div>

        <div className="min-w-0">
          <div className="text-[12px] font-semibold text-slate-500">
            {title}
          </div>
          <div
            className={`mt-1 font-black leading-none tracking-[-0.04em] text-slate-950 ${big ? "text-[34px]" : "text-[24px]"
              }`}
          >
            {value}
          </div>
          {sub ? (
            <div className="mt-2 break-keep text-[12px] font-medium leading-5 text-slate-500">
              {sub}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DashboardRow({ label, value, sub = "" }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-3">
      <div className="min-w-0">
        <div className="break-keep text-[13px] font-semibold text-slate-700">
          {label}
        </div>
        {sub ? (
          <div className="mt-0.5 break-keep text-[11px] leading-4 text-slate-500">
            {sub}
          </div>
        ) : null}
      </div>
      <div className="shrink-0 text-right text-[18px] font-black tracking-[-0.03em] text-slate-950">
        {value}
      </div>
    </div>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[16px] font-black tracking-[-0.03em] text-slate-950">
            {title}
          </div>
          {description ? (
            <p className="mt-1 break-keep text-[12px] leading-5 text-slate-500">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 space-y-2">{children}</div>
    </section>
  );
}

function MiniProgress({ label, value, max, rightLabel }) {
  const ratio = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[12px] font-semibold text-slate-600">
          {label}
        </span>
        <span className="text-[12px] font-bold text-slate-900">
          {rightLabel || `${formatNumber(value)} / ${formatNumber(max)}`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-violet-500"
          style={{ width: `${ratio}%` }}
        />
      </div>
    </div>
  );
}

export default function BroadcastDashboardTab({
  users = [],
  cards = [],
  payments = [],
  matches = [],
  interests = [],
  answers = [],
}) {
  const stats = useMemo(() => {
    const nowMs = Date.now();
    const todayStart = getStartOfToday();
    const weekStart = getStartOfWeek();
    const monthStart = getStartOfMonth();

    const totalUsers = users.length;
    const maleUsers = users.filter(isMale).length;
    const femaleUsers = users.filter(isFemale).length;
    const approvedUsers = users.filter(isApprovedUser).length;
    const pendingUsers = users.filter(isPendingUser).length;

    const todayUsers = users.filter((item) =>
      isWithin(getCreatedMs(item), todayStart, nowMs + 1)
    ).length;

    const weekUsers = users.filter((item) =>
      isWithin(getCreatedMs(item), weekStart, nowMs + 1)
    ).length;

    const monthUsers = users.filter((item) =>
      isWithin(getCreatedMs(item), monthStart, nowMs + 1)
    ).length;

    const publishedCards = cards.filter(isPublishedCard).length;
    const pendingCards = cards.filter(isPendingCard).length;

    const totalCardViews = cards.reduce(
      (sum, item) => sum + safeNumber(item?.views),
      0
    );

    const totalCardInterested = cards.reduce(
      (sum, item) => sum + safeNumber(item?.interestedCount),
      0
    );

    const successfulMatches = matches.filter(isSuccessfulMatch);
    const monthMatches = successfulMatches.filter((item) =>
      isWithin(getCreatedMs(item), monthStart, nowMs + 1)
    ).length;

    const confirmedPayments = payments.filter(isConfirmedPayment);
    const revenue = confirmedPayments.reduce(
      (sum, item) => sum + safeNumber(item?.amount),
      0
    );

    const requestedRevenue = payments.reduce(
      (sum, item) => sum + safeNumber(item?.amount),
      0
    );

    const monthConfirmedRevenue = confirmedPayments
      .filter((item) => isWithin(getCreatedMs(item), monthStart, nowMs + 1))
      .reduce((sum, item) => sum + safeNumber(item?.amount), 0);

    const monthAnswers = answers.filter((item) =>
      isWithin(getCreatedMs(item), monthStart, nowMs + 1)
    ).length;

    const monthInterests = interests.filter((item) =>
      isWithin(getCreatedMs(item), monthStart, nowMs + 1)
    ).length;

    return {
      totalUsers,
      maleUsers,
      femaleUsers,
      approvedUsers,
      pendingUsers,
      todayUsers,
      weekUsers,
      monthUsers,
      publishedCards,
      pendingCards,
      totalCards: cards.length,
      totalCardViews,
      totalCardInterested,
      totalAnswers: answers.length,
      monthAnswers,
      totalInterests: interests.length,
      monthInterests,
      totalMatches: successfulMatches.length,
      monthMatches,
      revenue,
      requestedRevenue,
      monthConfirmedRevenue,
      femaleRatio:
        totalUsers > 0 ? Math.round((femaleUsers / totalUsers) * 100) : 0,
      maleRatio:
        totalUsers > 0 ? Math.round((maleUsers / totalUsers) * 100) : 0,
    };
  }, [users, cards, payments, matches, interests, answers]);

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-900 bg-slate-950 px-5 py-5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.22)]">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-violet-200">
          <PiBroadcastDuotone className="text-[18px]" />
          방송용 한 화면 대시보드
        </div>

        <div className="mt-3 break-keep text-[25px] font-black leading-8 tracking-[-0.05em]">
          차밍수프는 지금,
          <br />
          사람을 모으는 중입니다.
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-md bg-white/10 px-3 py-3">
            <div className="text-[11px] font-semibold text-slate-300">
              총 가입자
            </div>
            <div className="mt-1 text-[24px] font-black">
              {formatNumber(stats.totalUsers)}
            </div>
          </div>

          <div className="rounded-md bg-white/10 px-3 py-3">
            <div className="text-[11px] font-semibold text-slate-300">
              이번 달 신규
            </div>
            <div className="mt-1 text-[24px] font-black">
              {formatNumber(stats.monthUsers)}
            </div>
          </div>

          <div className="rounded-md bg-white/10 px-3 py-3">
            <div className="text-[11px] font-semibold text-slate-300">
              매칭 성사
            </div>
            <div className="mt-1 text-[24px] font-black">
              {formatNumber(stats.totalMatches)}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          big
          title="총 가입자"
          value={`${formatNumber(stats.totalUsers)}명`}
          sub={`오늘 +${formatNumber(stats.todayUsers)}명 · 이번 주 +${formatNumber(
            stats.weekUsers
          )}명`}
          icon={PiUsersThreeDuotone}
          tone="violet"
        />

        <MetricCard
          big
          title="여성 가입자"
          value={`${formatNumber(stats.femaleUsers)}명`}
          sub={`전체 중 ${stats.femaleRatio}%`}
          icon={PiGenderFemaleDuotone}
          tone="rose"
        />

        <MetricCard
          big
          title="남성 가입자"
          value={`${formatNumber(stats.maleUsers)}명`}
          sub={`전체 중 ${stats.maleRatio}%`}
          icon={PiGenderMaleDuotone}
          tone="blue"
        />

        <MetricCard
          big
          title="총 수익"
          value={formatMoney(stats.revenue)}
          sub={`이번 달 확정 ${formatMoney(stats.monthConfirmedRevenue)}`}
          icon={PiCoinsDuotone}
          tone="emerald"
        />
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Section
          title="회원 상태"
          description="방송에서 현재 회원 규모와 심사 상황을 보여주는 영역이에요."
        >
          <DashboardRow label="승인 완료 회원" value={`${formatNumber(stats.approvedUsers)}명`} />
          <DashboardRow label="심사 대기 회원" value={`${formatNumber(stats.pendingUsers)}명`} />
          <DashboardRow label="오늘 신규 가입" value={`+${formatNumber(stats.todayUsers)}명`} />
          <DashboardRow label="이번 주 신규 가입" value={`+${formatNumber(stats.weekUsers)}명`} />
          <DashboardRow label="이번 달 신규 가입" value={`+${formatNumber(stats.monthUsers)}명`} />

          <div className="mt-4 space-y-4 rounded-md bg-slate-50 px-3 py-3">
            <MiniProgress
              label="여성 비중"
              value={stats.femaleUsers}
              max={Math.max(stats.totalUsers, 1)}
              rightLabel={`${stats.femaleRatio}%`}
            />
            <MiniProgress
              label="남성 비중"
              value={stats.maleUsers}
              max={Math.max(stats.totalUsers, 1)}
              rightLabel={`${stats.maleRatio}%`}
            />
          </div>
        </Section>

        <Section
          title="차밍카드 반응"
          description="외모보다 답변으로 매력을 보는 차밍수프 핵심 지표예요."
        >
          <DashboardRow label="전체 차밍카드" value={`${formatNumber(stats.totalCards)}개`} />
          <DashboardRow label="공개 차밍카드" value={`${formatNumber(stats.publishedCards)}개`} />
          <DashboardRow label="승인 대기 카드" value={`${formatNumber(stats.pendingCards)}개`} />
          <DashboardRow label="카드 조회 합계" value={`${formatNumber(stats.totalCardViews)}회`} />
          <DashboardRow label="카드 호감 합계" value={`${formatNumber(stats.totalCardInterested)}회`} />
          <DashboardRow label="답변 수집" value={`${formatNumber(stats.totalAnswers)}개`} />
          <DashboardRow label="이번 달 답변" value={`+${formatNumber(stats.monthAnswers)}개`} />
        </Section>

        <Section
          title="매칭 흐름"
          description="호감 발송부터 매칭 성사까지 실제 연결이 일어난 지표예요."
        >
          <DashboardRow label="호감 발송" value={`${formatNumber(stats.totalInterests)}건`} />
          <DashboardRow label="이번 달 호감 발송" value={`+${formatNumber(stats.monthInterests)}건`} />
          <DashboardRow label="매칭 성사" value={`${formatNumber(stats.totalMatches)}건`} />
          <DashboardRow label="이번 달 매칭 성사" value={`+${formatNumber(stats.monthMatches)}건`} />
        </Section>

        <Section
          title="사업 숫자"
          description="방송에서 성장기 느낌을 주기 좋은 현실 숫자예요."
        >
          <DashboardRow label="확정 수익" value={formatMoney(stats.revenue)} />
          <DashboardRow label="이번 달 확정 수익" value={formatMoney(stats.monthConfirmedRevenue)} />
          <DashboardRow
            label="입금 요청 총액"
            value={formatMoney(stats.requestedRevenue)}
            sub="입금 확인 전 요청 건까지 포함"
          />
          <DashboardRow
            label="다음 방송에서 볼 포인트"
            value="가입 전환"
            sub="방문자는 있는데 가입이 안 되는 이유를 계속 분석"
          />
        </Section>
      </div>

      <section className="rounded-md border border-violet-200 bg-violet-50 px-4 py-4">
        <div className="flex items-center gap-2 text-[15px] font-black text-violet-900">
          <PiMegaphoneDuotone className="text-[20px]" />
          방송 멘트용 요약
        </div>

        <p className="mt-3 break-keep text-[14px] leading-6 text-violet-900">
          현재 차밍수프 가입자는 <b>{formatNumber(stats.totalUsers)}명</b>,
          여성 가입자는 <b>{formatNumber(stats.femaleUsers)}명</b>,
          남성 가입자는 <b>{formatNumber(stats.maleUsers)}명</b>입니다.
          이번 달 신규 가입은 <b>{formatNumber(stats.monthUsers)}명</b>,
          매칭 성사는 <b>{formatNumber(stats.totalMatches)}건</b>입니다.
          아직 작은 서비스지만, 매주 이 숫자가 어떻게 바뀌는지 공개하면서
          서비스와 제 연애시장 생존기를 같이 실험해보겠습니다.
        </p>
      </section>
    </div>
  );
}