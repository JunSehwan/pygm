import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
} from "firebase/firestore";
import {
  PiBroadcastDuotone,
  PiCardsDuotone,
  PiChartLineUpDuotone,
  PiCoinsDuotone,
  PiGenderFemaleDuotone,
  PiGenderMaleDuotone,
  PiHeartDuotone,
  PiLightningDuotone,
  PiSealCheckDuotone,
  PiUsersThreeDuotone,
} from "react-icons/pi";
import { auth, db } from "firebaseConfig";
import { toMillis } from "components/Admin/adminUtils";

function safeNumber(value) {
  const next = Number(value || 0);
  return Number.isFinite(next) ? next : 0;
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

function isWithin(ms, startMs, endMs) {
  if (!ms) return false;
  return ms >= startMs && ms < endMs;
}

function isFemale(user = {}) {
  return (
    user?.gender === "female" ||
    user?.identity_gender === "female" ||
    user?.sex === "female" ||
    user?.gender === "여성" ||
    user?.identity_gender === "여성"
  );
}

function isMale(user = {}) {
  return (
    user?.gender === "male" ||
    user?.identity_gender === "male" ||
    user?.sex === "male" ||
    user?.gender === "남성" ||
    user?.identity_gender === "남성"
  );
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
  return [
    "confirmed",
    "completed",
    "charged",
    "done",
    "approved",
    "paid_confirmed",
  ].includes(payment?.status || "");
}

function getPaymentAmount(payment = {}) {
  return (
    safeNumber(payment?.amount) ||
    safeNumber(payment?.price) ||
    safeNumber(payment?.totalAmount) ||
    safeNumber(payment?.depositAmount)
  );
}

function makeStats({ users, cards, payments, matches, interests, answers }) {
  const nowMs = Date.now();
  const todayStart = getStartOfToday();
  const weekStart = getStartOfWeek();
  const monthStart = getStartOfMonth();

  const totalUsers = users.length;
  const femaleUsers = users.filter(isFemale).length;
  const maleUsers = users.filter(isMale).length;
  const unknownGenderUsers = Math.max(totalUsers - femaleUsers - maleUsers, 0);

  const approvedUsers = users.filter(isApprovedUser).length;
  const pendingUsers = users.filter(isPendingUser).length;

  const todayUsers = users.filter((item) =>
    isWithin(getCreatedMs(item), todayStart, nowMs + 1)
  );
  const weekUsers = users.filter((item) =>
    isWithin(getCreatedMs(item), weekStart, nowMs + 1)
  );
  const monthUsers = users.filter((item) =>
    isWithin(getCreatedMs(item), monthStart, nowMs + 1)
  );

  const publishedCards = cards.filter(isPublishedCard);
  const pendingCards = cards.filter(isPendingCard);

  const totalCardViews = cards.reduce(
    (sum, item) => sum + safeNumber(item?.views),
    0
  );

  const totalCardInterested = cards.reduce(
    (sum, item) => sum + safeNumber(item?.interestedCount),
    0
  );

  const weekAnswers = answers.filter((item) =>
    isWithin(getCreatedMs(item), weekStart, nowMs + 1)
  );
  const monthAnswers = answers.filter((item) =>
    isWithin(getCreatedMs(item), monthStart, nowMs + 1)
  );

  const weekInterests = interests.filter((item) =>
    isWithin(getCreatedMs(item), weekStart, nowMs + 1)
  );
  const monthInterests = interests.filter((item) =>
    isWithin(getCreatedMs(item), monthStart, nowMs + 1)
  );

  const successfulMatches = matches.filter(isSuccessfulMatch);

  const weekMatches = successfulMatches.filter((item) =>
    isWithin(getCreatedMs(item), weekStart, nowMs + 1)
  );
  const monthMatches = successfulMatches.filter((item) =>
    isWithin(getCreatedMs(item), monthStart, nowMs + 1)
  );

  const confirmedPayments = payments.filter(isConfirmedPayment);

  const revenue = confirmedPayments.reduce(
    (sum, item) => sum + getPaymentAmount(item),
    0
  );

  const weekRevenue = confirmedPayments
    .filter((item) => isWithin(getCreatedMs(item), weekStart, nowMs + 1))
    .reduce((sum, item) => sum + getPaymentAmount(item), 0);

  const monthRevenue = confirmedPayments
    .filter((item) => isWithin(getCreatedMs(item), monthStart, nowMs + 1))
    .reduce((sum, item) => sum + getPaymentAmount(item), 0);

  const requestedRevenue = payments.reduce(
    (sum, item) => sum + getPaymentAmount(item),
    0
  );

  const femaleRatio =
    totalUsers > 0 ? Math.round((femaleUsers / totalUsers) * 100) : 0;

  const maleRatio =
    totalUsers > 0 ? Math.round((maleUsers / totalUsers) * 100) : 0;

  return {
    totalUsers,
    femaleUsers,
    maleUsers,
    unknownGenderUsers,
    approvedUsers,
    pendingUsers,

    todayUsers: todayUsers.length,
    weekUsers: weekUsers.length,
    monthUsers: monthUsers.length,

    todayFemaleUsers: todayUsers.filter(isFemale).length,
    todayMaleUsers: todayUsers.filter(isMale).length,
    weekFemaleUsers: weekUsers.filter(isFemale).length,
    weekMaleUsers: weekUsers.filter(isMale).length,
    monthFemaleUsers: monthUsers.filter(isFemale).length,
    monthMaleUsers: monthUsers.filter(isMale).length,

    totalCards: cards.length,
    publishedCards: publishedCards.length,
    pendingCards: pendingCards.length,
    totalCardViews,
    totalCardInterested,

    totalAnswers: answers.length,
    weekAnswers: weekAnswers.length,
    monthAnswers: monthAnswers.length,

    totalInterests: interests.length,
    weekInterests: weekInterests.length,
    monthInterests: monthInterests.length,

    totalMatches: successfulMatches.length,
    weekMatches: weekMatches.length,
    monthMatches: monthMatches.length,

    revenue,
    weekRevenue,
    monthRevenue,
    requestedRevenue,

    femaleRatio,
    maleRatio,
  };
}

function LoadingScreen() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-slate-100 text-slate-950">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-violet-600 text-white">
          <PiBroadcastDuotone className="text-[30px]" />
        </div>
        <div className="text-[22px] font-black tracking-[-0.04em]">
          차밍수프 대시보드 불러오는 중
        </div>
        <p className="mt-2 text-[14px] text-slate-500">
          관리자 권한과 데이터를 확인하고 있어요.
        </p>
      </div>
    </main>
  );
}

function AccessDenied() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-slate-100 px-6 text-slate-950">
      <section className="w-full max-w-[520px] rounded-md border border-rose-200 bg-white px-6 py-6 shadow-sm">
        <div className="text-[24px] font-black tracking-[-0.04em] text-rose-600">
          관리자 권한이 필요해요
        </div>
        <p className="mt-3 break-keep text-[14px] leading-6 text-slate-600">
          현재 로그인한 계정은 관리자 대시보드 조회 권한이 없어요.
          `/admin` 페이지와 동일하게 adminConfig/access 문서의 allowedUids
          또는 superAdmins 기준으로 확인합니다.
        </p>

        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="mt-5 rounded-md bg-slate-950 px-4 py-2 text-[14px] font-bold text-white active:scale-[0.98]"
        >
          관리자 페이지로 이동
        </button>
      </section>
    </main>
  );
}

function TopMetric({ title, value, sub, icon: Icon, tone = "violet" }) {
  const toneClass =
    tone === "rose"
      ? "bg-rose-50 text-rose-600"
      : tone === "blue"
        ? "bg-blue-50 text-blue-600"
        : tone === "emerald"
          ? "bg-emerald-50 text-emerald-600"
          : "bg-violet-50 text-violet-600";

  return (
    <div className="rounded-md border border-slate-200 bg-white px-5 py-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-md ${toneClass}`}
        >
          <Icon className="text-[28px]" />
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-bold text-slate-500">
          LIVE
        </div>
      </div>

      <div className="mt-5 text-[14px] font-bold text-slate-500">{title}</div>
      <div className="mt-2 text-[52px] font-black leading-none tracking-[-0.07em] text-slate-950">
        {value}
      </div>
      {sub ? (
        <div className="mt-3 break-keep text-[14px] font-semibold leading-5 text-slate-500">
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function SmallMetric({ title, value, sub, icon: Icon }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600">
          <Icon className="text-[22px]" />
        </div>
        <div className="min-w-0">
          <div className="text-[12px] font-bold text-slate-500">{title}</div>
          <div className="mt-1 text-[26px] font-black leading-none tracking-[-0.05em] text-slate-950">
            {value}
          </div>
          {sub ? (
            <div className="mt-2 break-keep text-[11px] font-medium leading-4 text-slate-500">
              {sub}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function RatioBar({ label, value, max, percent, tone = "violet" }) {
  const width = Math.min(100, Math.max(0, percent || 0));

  const barClass =
    tone === "rose"
      ? "bg-rose-500"
      : tone === "blue"
        ? "bg-blue-500"
        : "bg-violet-500";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[13px]">
        <span className="font-bold text-slate-700">{label}</span>
        <span className="font-black text-slate-950">
          {formatNumber(value)}명 · {width}%
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${width}%` }}
        />
      </div>

      <div className="mt-1 text-[11px] text-slate-400">
        전체 {formatNumber(max)}명 기준
      </div>
    </div>
  );
}

function Panel({ title, sub, children }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white px-5 py-5 shadow-sm">
      <div className="mb-4">
        <div className="text-[18px] font-black tracking-[-0.04em] text-slate-950">
          {title}
        </div>
        {sub ? (
          <p className="mt-1 break-keep text-[12px] leading-5 text-slate-500">
            {sub}
          </p>
        ) : null}
      </div>

      {children}
    </section>
  );
}

function LineItem({ label, value, sub }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-slate-50 px-4 py-3">
      <div className="min-w-0">
        <div className="text-[13px] font-bold text-slate-700">{label}</div>
        {sub ? (
          <div className="mt-0.5 break-keep text-[11px] leading-4 text-slate-500">
            {sub}
          </div>
        ) : null}
      </div>

      <div className="shrink-0 text-right text-[22px] font-black tracking-[-0.05em] text-slate-950">
        {value}
      </div>
    </div>
  );
}

export default function AdminBroadcastPage() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);

  const [users, setUsers] = useState([]);
  const [cards, setCards] = useState([]);
  const [payments, setPayments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [interests, setInterests] = useState([]);
  const [answers, setAnswers] = useState([]);

  const clearDashboardData = () => {
    setUsers([]);
    setCards([]);
    setPayments([]);
    setMatches([]);
    setInterests([]);
    setAnswers([]);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user || null);

      if (!user?.uid) {
        setIsAdmin(false);
        clearDashboardData();
        return;
      }

      try {
        const accessSnap = await getDoc(doc(db, "adminConfig", "access"));
        const accessData = accessSnap.data() || {};

        const allowedUids = Array.isArray(accessData.allowedUids)
          ? accessData.allowedUids.map((item) => String(item).trim())
          : [];

        const superAdmins = Array.isArray(accessData.superAdmins)
          ? accessData.superAdmins.map((item) => String(item).trim())
          : [];

        const currentUid = String(user.uid || "").trim();
        const nextIsAdmin =
          allowedUids.includes(currentUid) || superAdmins.includes(currentUid);

        setIsAdmin(nextIsAdmin);

        if (!nextIsAdmin) {
          clearDashboardData();
        }
      } catch (error) {
        console.error("[admin/broadcast] access load error:", error);
        setIsAdmin(false);
        clearDashboardData();
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin !== true) return;

    const unsubUsers = onSnapshot(
      query(collection(db, "users")),
      (snapshot) => {
        setUsers(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      },
      (error) => {
        console.error("[admin/broadcast] users snapshot error:", error);
      }
    );

    const unsubCards = onSnapshot(
      query(collection(db, "charmingCards")),
      (snapshot) => {
        setCards(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      },
      (error) => {
        console.error("[admin/broadcast] charmingCards snapshot error:", error);
      }
    );

    const unsubPayments = onSnapshot(
      query(collection(db, "spoonDepositRequests")),
      (snapshot) => {
        setPayments(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
        );
      },
      (error) => {
        console.error(
          "[admin/broadcast] spoonDepositRequests snapshot error:",
          error
        );
      }
    );

    const unsubMatches = onSnapshot(
      query(collection(db, "arenaMatches")),
      (snapshot) => {
        setMatches(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
        );
      },
      (error) => {
        console.error("[admin/broadcast] arenaMatches snapshot error:", error);
      }
    );

    const unsubInterests = onSnapshot(
      query(collection(db, "arenaInterests")),
      (snapshot) => {
        setInterests(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
        );
      },
      (error) => {
        console.error("[admin/broadcast] arenaInterests snapshot error:", error);
      }
    );

    const unsubAnswers = onSnapshot(
      query(collection(db, "charmingCardAnswers")),
      (snapshot) => {
        setAnswers(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
        );
      },
      (error) => {
        console.error(
          "[admin/broadcast] charmingCardAnswers snapshot error:",
          error
        );
      }
    );

    return () => {
      unsubUsers();
      unsubCards();
      unsubPayments();
      unsubMatches();
      unsubInterests();
      unsubAnswers();
    };
  }, [isAdmin]);

  const stats = useMemo(
    () =>
      makeStats({
        users,
        cards,
        payments,
        matches,
        interests,
        answers,
      }),
    [users, cards, payments, matches, interests, answers]
  );

  if (isAdmin === null) {
    return (
      <>
        <Head>
          <title>차밍수프 대시보드 | 관리자</title>
        </Head>
        <LoadingScreen />
      </>
    );
  }

  if (isAdmin !== true) {
    return (
      <>
        <Head>
          <title>차밍수프 대시보드 | 관리자</title>
        </Head>
        <AccessDenied />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>차밍수프 대시보드 | 관리자</title>
        <meta
          name="description"
          content="차밍수프 방송 및 관리자 확인용 대시보드"
        />
      </Head>

      <main className="min-h-screen w-full bg-slate-100 text-slate-950">
        <div className="mx-auto w-full max-w-[1600px] px-6 py-6">
          <header className="mb-5 flex min-h-[78px] items-center justify-between gap-4 rounded-md bg-slate-950 px-6 py-4 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-violet-600">
                <PiBroadcastDuotone className="text-[30px]" />
              </div>

              <div>
                <div className="text-[13px] font-bold text-violet-200">
                  CHARMING SOUP ADMIN
                </div>
                <div className="mt-0.5 text-[28px] font-black leading-none tracking-[-0.06em]">
                  차밍수프 대시보드
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[12px] font-bold text-slate-400">
                관리자 접속 중
              </div>
              {/* <div className="mt-1 max-w-[260px] truncate text-[13px] font-semibold text-slate-200">
                {firebaseUser?.email || firebaseUser?.uid || "admin"}
              </div> */}
            </div>
          </header>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <TopMetric
              title="총 가입자"
              value={`${formatNumber(stats.totalUsers)}`}
              sub={`오늘 +${formatNumber(stats.todayUsers)}명 · 이번 주 +${formatNumber(
                stats.weekUsers
              )}명 · 이번 달 +${formatNumber(stats.monthUsers)}명`}
              icon={PiUsersThreeDuotone}
              tone="violet"
            />

            <TopMetric
              title="여성 가입자"
              value={`${formatNumber(stats.femaleUsers)}`}
              sub={`이번 주 +${formatNumber(
                stats.weekFemaleUsers
              )}명 · 이번 달 +${formatNumber(
                stats.monthFemaleUsers
              )}명 · 전체 ${stats.femaleRatio}%`}
              icon={PiGenderFemaleDuotone}
              tone="rose"
            />

            <TopMetric
              title="매칭 성사"
              value={`${formatNumber(stats.totalMatches)}`}
              sub={`이번 주 +${formatNumber(stats.weekMatches)}건 · 이번 달 +${formatNumber(
                stats.monthMatches
              )}건`}
              icon={PiHeartDuotone}
              tone="blue"
            />

            <TopMetric
              title="확정 수익"
              value={formatMoney(stats.revenue)}
              sub={`이번 주 ${formatMoney(stats.weekRevenue)} · 이번 달 ${formatMoney(
                stats.monthRevenue
              )}`}
              icon={PiCoinsDuotone}
              tone="emerald"
            />
          </section>

          <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="space-y-5">
              <Panel
                title="가입자 상세"
                sub="이번 주와 이번 달 가입자 흐름을 분리해서 확인합니다."
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-1">
                  <LineItem
                    label="오늘 신규 가입"
                    value={`+${formatNumber(stats.todayUsers)}명`}
                    sub={`여성 +${formatNumber(
                      stats.todayFemaleUsers
                    )}명 · 남성 +${formatNumber(stats.todayMaleUsers)}명`}
                  />
                  <LineItem
                    label="이번 주 신규 가입"
                    value={`+${formatNumber(stats.weekUsers)}명`}
                    sub={`여성 +${formatNumber(
                      stats.weekFemaleUsers
                    )}명 · 남성 +${formatNumber(stats.weekMaleUsers)}명`}
                  />
                  <LineItem
                    label="이번 달 신규 가입"
                    value={`+${formatNumber(stats.monthUsers)}명`}
                    sub={`여성 +${formatNumber(
                      stats.monthFemaleUsers
                    )}명 · 남성 +${formatNumber(stats.monthMaleUsers)}명`}
                  />
                  <LineItem
                    label="승인 완료 회원"
                    value={`${formatNumber(stats.approvedUsers)}명`}
                  />
                  <LineItem
                    label="심사 대기 회원"
                    value={`${formatNumber(stats.pendingUsers)}명`}
                  />
                  <LineItem
                    label="성별 미입력/기타"
                    value={`${formatNumber(stats.unknownGenderUsers)}명`}
                  />
                </div>

                <div className="mt-5 space-y-5 rounded-md bg-slate-50 px-4 py-4">
                  <RatioBar
                    label="여성 비중"
                    value={stats.femaleUsers}
                    max={Math.max(stats.totalUsers, 1)}
                    percent={stats.femaleRatio}
                    tone="rose"
                  />
                  <RatioBar
                    label="남성 비중"
                    value={stats.maleUsers}
                    max={Math.max(stats.totalUsers, 1)}
                    percent={stats.maleRatio}
                    tone="blue"
                  />
                </div>
              </Panel>

              <Panel title="사업 숫자" sub="결제 요청과 확정 수익을 나눠서 봅니다.">
                <div className="space-y-3">
                  <LineItem
                    label="확정 수익"
                    value={formatMoney(stats.revenue)}
                  />
                  <LineItem
                    label="이번 주 확정 수익"
                    value={formatMoney(stats.weekRevenue)}
                  />
                  <LineItem
                    label="이번 달 확정 수익"
                    value={formatMoney(stats.monthRevenue)}
                  />
                  <LineItem
                    label="입금 요청 총액"
                    value={formatMoney(stats.requestedRevenue)}
                    sub="확정 전 요청 건까지 포함"
                  />
                </div>
              </Panel>
            </div>

            <div className="space-y-5">
              <Panel
                title="차밍카드 반응"
                sub="질문 조회, 답변, 호감 반응을 확인합니다."
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <SmallMetric
                    title="전체 카드"
                    value={`${formatNumber(stats.totalCards)}개`}
                    sub={`공개 ${formatNumber(
                      stats.publishedCards
                    )}개 · 대기 ${formatNumber(stats.pendingCards)}개`}
                    icon={PiCardsDuotone}
                  />
                  <SmallMetric
                    title="카드 조회"
                    value={`${formatNumber(stats.totalCardViews)}회`}
                    sub="질문을 본 전체 횟수"
                    icon={PiChartLineUpDuotone}
                  />
                  <SmallMetric
                    title="답변 수집"
                    value={`${formatNumber(stats.totalAnswers)}개`}
                    sub={`이번 주 +${formatNumber(
                      stats.weekAnswers
                    )}개 · 이번 달 +${formatNumber(stats.monthAnswers)}개`}
                    icon={PiSealCheckDuotone}
                  />
                  <SmallMetric
                    title="카드 호감"
                    value={`${formatNumber(stats.totalCardInterested)}회`}
                    sub="답변 기반 관심 반응"
                    icon={PiHeartDuotone}
                  />
                </div>

                <div className="mt-4 space-y-3">
                  <LineItem
                    label="이번 주 답변"
                    value={`+${formatNumber(stats.weekAnswers)}개`}
                  />
                  <LineItem
                    label="이번 달 답변"
                    value={`+${formatNumber(stats.monthAnswers)}개`}
                  />
                  <LineItem
                    label="승인 대기 차밍카드"
                    value={`${formatNumber(stats.pendingCards)}개`}
                  />
                </div>
              </Panel>
            </div>

            <div className="space-y-5">
              <Panel
                title="매칭 흐름"
                sub="호감 발송부터 매칭 성사까지의 흐름입니다."
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-1">
                  <SmallMetric
                    title="호감 발송"
                    value={`${formatNumber(stats.totalInterests)}건`}
                    sub={`이번 주 +${formatNumber(
                      stats.weekInterests
                    )}건 · 이번 달 +${formatNumber(stats.monthInterests)}건`}
                    icon={PiLightningDuotone}
                  />
                  <SmallMetric
                    title="매칭 성사"
                    value={`${formatNumber(stats.totalMatches)}건`}
                    sub={`이번 주 +${formatNumber(
                      stats.weekMatches
                    )}건 · 이번 달 +${formatNumber(stats.monthMatches)}건`}
                    icon={PiHeartDuotone}
                  />
                </div>

                <div className="mt-4 space-y-3">
                  <LineItem
                    label="이번 주 호감 발송"
                    value={`+${formatNumber(stats.weekInterests)}건`}
                  />
                  <LineItem
                    label="이번 달 호감 발송"
                    value={`+${formatNumber(stats.monthInterests)}건`}
                  />
                  <LineItem
                    label="이번 주 매칭 성사"
                    value={`+${formatNumber(stats.weekMatches)}건`}
                  />
                  <LineItem
                    label="이번 달 매칭 성사"
                    value={`+${formatNumber(stats.monthMatches)}건`}
                  />
                </div>
              </Panel>

              <Panel title="전체 요약" sub="방송이나 내부 점검 때 바로 읽기 좋은 숫자입니다.">
                <div className="space-y-3">
                  <LineItem
                    label="총 가입자"
                    value={`${formatNumber(stats.totalUsers)}명`}
                    sub={`여성 ${formatNumber(
                      stats.femaleUsers
                    )}명 · 남성 ${formatNumber(stats.maleUsers)}명`}
                  />
                  <LineItem
                    label="이번 달 신규"
                    value={`+${formatNumber(stats.monthUsers)}명`}
                    sub={`여성 +${formatNumber(
                      stats.monthFemaleUsers
                    )}명 · 남성 +${formatNumber(stats.monthMaleUsers)}명`}
                  />
                  <LineItem
                    label="이번 달 핵심 활동"
                    value={`${formatNumber(stats.monthInterests)}건`}
                    sub={`호감 발송 ${formatNumber(
                      stats.monthInterests
                    )}건 · 답변 ${formatNumber(stats.monthAnswers)}개`}
                  />
                </div>
              </Panel>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}