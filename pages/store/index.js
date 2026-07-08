import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { doc, onSnapshot } from "firebase/firestore";
import {
  PiArrowLeft,
  PiCheckCircleFill,
  PiLightningDuotone,
  PiArrowRight,
} from "react-icons/pi";

import { auth, db } from "firebaseConfig";
import BottomNavbar from "components/Common/BottomNavbar";
import AuthRequiredModal from "components/Common/AuthRequiredModal";
import StoreHeroCard from "components/Store/StoreHeroCard";
import StoreBalanceCard from "components/Store/StoreBalanceCard";
import SpoonProductCard from "components/Store/SpoonProductCard";

const SPOON_PRODUCTS = [
  {
    id: "spoon-10",
    spoonAmount: 10,
    title: "스푼 10개",
    subLabel: "처음 가볍게 시작하기 좋아요",
    image: "/image/store/spoon/spoon_10.png",
    price: 4900,
    originalPrice: 9900,
    discountRate: 51,
    matchCountText: "약 1회 시도",
    badge: "",
  },
  {
    id: "spoon-30",
    spoonAmount: 30,
    title: "스푼 30개",
    subLabel: "가장 부담 적고 무난한 추천 구성",
    image: "/image/store/spoon/spoon_30.png",
    price: 12900,
    originalPrice: 27000,
    discountRate: 52,
    matchCountText: "약 3회 시도",
    badge: "추천",
  },
  {
    id: "spoon-50",
    spoonAmount: 50,
    title: "스푼 50개",
    subLabel: "여유 있게 둘러보고 싶은 분께",
    image: "/image/store/spoon/spoon_50.png",
    price: 19900,
    originalPrice: 41000,
    discountRate: 53,
    matchCountText: "약 6회 시도",
    badge: "",
  },
  {
    id: "spoon-100",
    spoonAmount: 100,
    title: "스푼 100개",
    subLabel: "자주 이용하는 분께 가장 유리해요",
    image: "/image/store/spoon/spoon_100.png",
    price: 36900,
    originalPrice: 79000,
    discountRate: 53,
    matchCountText: "약 12회 시도",
    badge: "혜택 큼",
  },
];

function formatPrice(value = 0) {
  return Number(value || 0).toLocaleString("ko-KR");
}

export default function StorePage() {
  const router = useRouter();
  const reduxUser = useSelector((state) => state.user?.user || null);

  const [authChecked, setAuthChecked] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [spoonCount, setSpoonCount] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(SPOON_PRODUCTS[1]);

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

    const unsubscribe = onSnapshot(doc(db, "users", resolvedUid), (snap) => {
      if (!snap.exists()) {
        setSpoonCount(0);
        return;
      }

      const data = snap.data() || {};
      setSpoonCount(Number(data?.spoon || 0));
    });

    return () => unsubscribe && unsubscribe();
  }, [resolvedUid]);

  const nickname = useMemo(() => {
    return reduxUser?.nickname || reduxUser?.username || "회원";
  }, [reduxUser]);

  const handleManualDeposit = () => {
    router.push(`/store/manual?productId=${selectedProduct?.id || ""}`);
  };

  if (!authChecked && !reduxUser?.userID && !reduxUser?.uid) {
    return <div className="min-h-screen bg-white md:bg-[#f6f7fb]" />;
  }

  return (
    <>
      <Head>
        <title>스푼 상점 | 차밍수프</title>
        <meta
          name="description"
          content="차밍수프 스푼 상점에서 보유 스푼과 상품을 확인하고 입금 신청을 진행하세요."
        />
      </Head>

      <main className="min-h-screen bg-white md:bg-[#f6f7fb]">
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 hidden md:block">
            <div className="absolute left-1/2 top-[-90px] h-[260px] w-[260px] -translate-x-[280px] rounded-full bg-violet-200/30 blur-3xl" />
            <div className="absolute left-1/2 top-[120px] h-[280px] w-[280px] translate-x-[150px] rounded-full bg-sky-100/35 blur-3xl" />
            <div className="absolute left-1/2 bottom-[20px] h-[220px] w-[220px] -translate-x-[60px] rounded-full bg-pink-100/25 blur-3xl" />
          </div>

          <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
            <section className="relative flex h-[100dvh] w-full max-w-[420px] flex-col overflow-hidden bg-slate-50 md:h-[760px] md:max-w-[430px] md:rounded-[24px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
              <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
                <div className="text-[16px] font-bold text-slate-900">
                  스푼 상점
                </div>

                <button
                  type="button"
                  onClick={() => router.back()}
                  style={{ cursor: "pointer" }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:text-slate-900"
                >
                  <PiArrowLeft className="text-[22px]" />
                </button>
              </header>

              <div className="min-h-0 flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto px-4 pb-4 pt-4">
                  <div className="space-y-4">
                    <StoreHeroCard />

                    <StoreBalanceCard
                      spoonCount={spoonCount}
                      onPolicyClick={() => router.push("/store/policy")}
                    />

                    <section className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[15px] font-bold text-slate-900">
                            지금은 간편 입금으로 충전해요
                          </div>
                          <div className="mt-1 text-[12px] leading-5 text-slate-500">
                            신청 후, 안내된 계좌로 입금시 스푼이 충전됩니다.
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => router.push("/store/policy")}
                          style={{ cursor: "pointer" }}
                          className="inline-flex items-center gap-1 text-[12px] font-semibold text-violet-600"
                        >
                          정책 보기
                          <PiArrowRight className="text-[14px]" />
                        </button>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="rounded-md bg-slate-50 px-3 py-3 text-[12px] leading-5 text-slate-600">
                          매칭 1회 시도에 스푼 8개가 사용돼요.
                        </div>
                        <div className="rounded-md bg-slate-50 px-3 py-3 text-[12px] leading-5 text-slate-600">
                          구매 스푼은 상대 거절 또는 무응답일 때 1회 복구돼요.
                        </div>
                        <div className="rounded-md bg-slate-50 px-3 py-3 text-[12px] leading-5 text-slate-600">
                          이벤트나 무료 지급 스푼은 복구 없이 소진돼요.
                        </div>
                      </div>
                    </section>

                    <section className="space-y-3">
                      <div className="flex items-end justify-between gap-3 px-1">
                        <div>
                          <div className="text-[17px] font-bold text-slate-900">
                            스푼 상품
                          </div>
                          <div className="mt-1 text-[12px] leading-5 text-slate-500">
                            {nickname}님에게는 30개 구성이 가장 무난해요.
                          </div>
                        </div>
                      </div>

                      {SPOON_PRODUCTS.map((item) => (
                        <SpoonProductCard
                          key={item.id}
                          item={item}
                          selected={selectedProduct?.id === item.id}
                          onClick={() => setSelectedProduct(item)}
                        />
                      ))}
                    </section>

                    <section className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
                      <div className="text-[14px] font-bold text-slate-900">
                        충전 안내
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="rounded-md bg-slate-50 px-3 py-3 text-[12px] leading-5 text-slate-600">
                          하나은행 / 예금주 전세환 / 112-891138-99107
                        </div>
                        <div className="rounded-md bg-slate-50 px-3 py-3 text-[12px] leading-5 text-slate-600">
                          입금 확인 후 순차적으로 스푼을 충전해드려요.
                        </div>
                        <div className="rounded-md bg-slate-50 px-3 py-3 text-[12px] leading-5 text-slate-600">
                          신청 완료 후 문자로도 입금 안내를 보내드려요.
                        </div>
                      </div>
                    </section>

                    {/* <div className="h-4" /> */}
                  </div>
                </div>
              </div>

              {isLoggedIn ? (
                <div className="shrink-0 border-t border-slate-200 bg-white">
                  <div className="px-4 pb-3 pt-3">
                    <div className="rounded-md border border-violet-100 bg-violet-50 px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-600">
                            <PiLightningDuotone className="text-[14px]" />
                            선택한 상품
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="break-keep text-[15px] font-bold text-slate-900">
                              {selectedProduct?.title}
                            </div>
                            <PiCheckCircleFill className="text-[16px] text-violet-600" />
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[11px] font-medium text-slate-500">
                            입금금액
                          </div>
                          <div className="text-[18px] font-black tracking-[-0.02em] text-slate-900">
                            {formatPrice(selectedProduct?.price || 0)}원
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleManualDeposit}
                      style={{ cursor: "pointer" }}
                      className="mt-3 flex h-12 w-full items-center justify-center rounded-md bg-violet-600 text-[15px] font-bold text-white transition hover:bg-violet-700"
                    >
                      입금 신청하기
                    </button>
                  </div>

                  <div className="shrink-0 border-t border-slate-100 bg-white">
                    <BottomNavbar contained />
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </main>

      <AuthRequiredModal
        open={!isLoggedIn}
        onClose={() => router.push("/")}
        redirect="/store"
        title="로그인이 필요해요"
        description="스푼 상점은 로그인 후 이용할 수 있어요."
      />
    </>
  );
}