import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import {
  PiArrowLeft,
  PiCheckCircleDuotone,
  PiClockCountdownDuotone,
  PiCoinsDuotone,
  PiReceiptDuotone,
} from "react-icons/pi";

import { auth, db } from "firebaseConfig";
import BottomNavbar from "components/Common/BottomNavbar";
import AuthRequiredModal from "components/Common/AuthRequiredModal";

function formatPrice(value = 0) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function formatDate(dateValue) {
  if (!dateValue) return "-";

  try {
    if (dateValue?.seconds) {
      return new Date(dateValue.seconds * 1000).toLocaleString("ko-KR");
    }

    return new Date(dateValue).toLocaleString("ko-KR");
  } catch (error) {
    return "-";
  }
}

function getStatusMeta(status) {
  switch (status) {
    case "credited":
      return {
        label: "지급완료",
        chipClass: "bg-emerald-50 text-emerald-600",
      };
    case "paid":
      return {
        label: "결제완료",
        chipClass: "bg-sky-50 text-sky-600",
      };
    case "requested":
    default:
      return {
        label: "신청",
        chipClass: "bg-slate-100 text-slate-600",
      };
  }
}

function HistoryCard({ item }) {
  const statusMeta = getStatusMeta(item?.status);

  return (
    <section className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[15px] font-bold text-slate-900">
            {item?.productTitle || "스푼 충전 신청"}
          </div>
          <div className="mt-1 text-[12px] text-slate-500">
            신청일시 {formatDate(item?.createdAt)}
          </div>
        </div>

        <div
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusMeta.chipClass}`}
        >
          {statusMeta.label}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-md bg-slate-50 px-3 py-3">
          <div className="text-[11px] text-slate-500">신청 금액</div>
          <div className="mt-1 text-[14px] font-bold text-slate-900">
            {formatPrice(item?.amount || 0)}원
          </div>
        </div>

        <div className="rounded-md bg-slate-50 px-3 py-3">
          <div className="text-[11px] text-slate-500">스푼 수량</div>
          <div className="mt-1 text-[14px] font-bold text-slate-900">
            {item?.spoonAmount || 0}개
          </div>
        </div>

        <div className="rounded-md bg-slate-50 px-3 py-3">
          <div className="text-[11px] text-slate-500">입금자명</div>
          <div className="mt-1 text-[14px] font-bold text-slate-900">
            {item?.depositorName || "-"}
          </div>
        </div>

        <div className="rounded-md bg-slate-50 px-3 py-3">
          <div className="text-[11px] text-slate-500">연락처</div>
          <div className="mt-1 text-[14px] font-bold text-slate-900">
            {item?.phoneNumber || "-"}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function StoreHistoryPage() {
  const router = useRouter();
  const reduxUser = useSelector((state) => state.user?.user || null);

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user || null);
      setAuthChecked(true);
    });

    return () => unsubscribe && unsubscribe();
  }, []);

  const resolvedUid = useMemo(() => {
    return firebaseUser?.uid || reduxUser?.userID || reduxUser?.uid || null;
  }, [firebaseUser?.uid, reduxUser?.userID, reduxUser?.uid]);

  const isLoggedIn = !!resolvedUid;

  useEffect(() => {
    if (!resolvedUid) return;

    const q = query(
      collection(db, "spoonDepositRequests"),
      where("uid", "==", resolvedUid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        list.sort((a, b) => {
          const aSec = a?.createdAt?.seconds || 0;
          const bSec = b?.createdAt?.seconds || 0;
          return bSec - aSec;
        });

        setItems(list);
      },
      (error) => {
        console.error("[store/history] snapshot error:", error);
        setItems([]);
      }
    );

    return () => unsubscribe && unsubscribe();
  }, [resolvedUid]);

  const requestedCount = items.filter((item) => (item?.status || "requested") === "requested").length;
  const paidCount = items.filter((item) => item?.status === "paid").length;
  const creditedCount = items.filter((item) => item?.status === "credited").length;

  if (!authChecked && !reduxUser?.userID && !reduxUser?.uid) {
    return <div className="min-h-screen bg-white md:bg-[#f6f7fb]" />;
  }

  return (
    <>
      <Head>
        <title>결제현황 | 차밍수프</title>
      </Head>

      <main className="min-h-screen bg-white md:bg-[#f6f7fb]">
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 hidden md:block">
            <div className="absolute left-1/2 top-[-90px] h-[260px] w-[260px] -translate-x-[280px] rounded-full bg-violet-200/30 blur-3xl" />
            <div className="absolute left-1/2 top-[120px] h-[280px] w-[280px] translate-x-[150px] rounded-full bg-sky-100/35 blur-3xl" />
          </div>

          <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
            <section className="relative flex h-[100dvh] w-full max-w-[390px] flex-col overflow-hidden bg-slate-50 md:h-[760px] md:max-w-[430px] md:rounded-[24px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
              <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
                <div className="text-[16px] font-bold text-slate-900">
                  결제현황
                </div>

                <button
                  type="button"
                  onClick={() => router.back()}
                  style={{ cursor: "pointer" }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700"
                >
                  <PiArrowLeft className="text-[22px]" />
                </button>
              </header>

              <div className="min-h-0 flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto px-4 pb-4 pt-4">
                  <div className="space-y-4">
                    <section className="overflow-hidden rounded-md border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7f5ff_100%)] shadow-sm">
                      <div className="px-4 py-4">
                        <div className="text-[22px] font-black leading-[1.25] tracking-[-0.03em] text-slate-900">
                          내가 신청한
                          <br />
                          충전 내역을 확인해보세요
                        </div>
                        <div className="mt-2 text-[13px] leading-6 text-slate-600">
                          신청 상태와 지급 완료 여부를 한 번에 볼 수 있어요.
                        </div>
                      </div>
                    </section>

                    <section className="grid grid-cols-3 gap-2">
                      <div className="rounded-md border border-slate-200 bg-white px-3 py-3 shadow-sm">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <PiClockCountdownDuotone className="text-[14px]" />
                          신청
                        </div>
                        <div className="mt-2 text-[20px] font-black text-slate-900">
                          {requestedCount}
                        </div>
                      </div>

                      <div className="rounded-md border border-slate-200 bg-white px-3 py-3 shadow-sm">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-sky-600">
                          <PiReceiptDuotone className="text-[14px]" />
                          결제완료
                        </div>
                        <div className="mt-2 text-[20px] font-black text-slate-900">
                          {paidCount}
                        </div>
                      </div>

                      <div className="rounded-md border border-slate-200 bg-white px-3 py-3 shadow-sm">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <PiCheckCircleDuotone className="text-[14px]" />
                          지급완료
                        </div>
                        <div className="mt-2 text-[20px] font-black text-slate-900">
                          {creditedCount}
                        </div>
                      </div>
                    </section>

                    <section className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <PiCoinsDuotone className="text-[18px] text-violet-600" />
                        <div className="text-[14px] font-bold text-slate-900">
                          상태 안내
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="rounded-md bg-slate-50 px-3 py-3 text-[12px] leading-5 text-slate-600">
                          신청 : 충전 신청이 저장된 상태
                        </div>
                        <div className="rounded-md bg-slate-50 px-3 py-3 text-[12px] leading-5 text-slate-600">
                          결제완료 : 입금 확인이 끝난 상태
                        </div>
                        <div className="rounded-md bg-slate-50 px-3 py-3 text-[12px] leading-5 text-slate-600">
                          지급완료 : 스푼 지급까지 완료된 상태
                        </div>
                      </div>
                    </section>

                    {items.length === 0 ? (
                      <section className="rounded-md border border-slate-200 bg-white px-4 py-8 text-center shadow-sm">
                        <div className="text-[15px] font-bold text-slate-900">
                          아직 신청한 내역이 없어요
                        </div>
                        <div className="mt-2 text-[13px] leading-5 text-slate-500">
                          상점에서 스푼을 선택하고
                          <br />
                          입금 신청을 먼저 진행해보세요.
                        </div>
                        <button
                          type="button"
                          onClick={() => router.push("/store")}
                          style={{ cursor: "pointer" }}
                          className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-violet-600 px-4 text-[14px] font-bold text-white"
                        >
                          상점 보러가기
                        </button>
                      </section>
                    ) : (
                      <div className="space-y-3">
                        {items.map((item) => (
                          <HistoryCard key={item.id} item={item} />
                        ))}
                      </div>
                    )}

                    <div className="h-4" />
                  </div>
                </div>
              </div>

              {isLoggedIn ? (
                <div className="border-t border-slate-100 bg-white">
                  <BottomNavbar contained />
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </main>

      <AuthRequiredModal
        open={!isLoggedIn}
        onClose={() => router.push("/")}
        redirect="/store/history"
        title="로그인이 필요해요"
        description="결제현황은 로그인 후 확인할 수 있어요."
      />
    </>
  );
}