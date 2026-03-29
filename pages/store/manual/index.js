import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import {
  PiArrowLeft,
  PiCheckCircleFill,
  PiCopyDuotone,
  PiPhoneDuotone,
  PiUserDuotone,
} from "react-icons/pi";

import { auth, db, sendLms } from "firebaseConfig";
import BottomNavbar from "components/Common/BottomNavbar";
import AuthRequiredModal from "components/Common/AuthRequiredModal";

const ADMIN_PHONE = "01075781252";

const BANK_INFO = {
  bank: "하나은행",
  accountNumber: "112-891138-99107",
  accountHolder: "전세환",
};

const SPOON_PRODUCTS = [
  {
    id: "spoon-10",
    spoonAmount: 10,
    title: "스푼 10개",
    price: 4900,
    image: "/image/store/spoon/spoon_10.png",
  },
  {
    id: "spoon-30",
    spoonAmount: 30,
    title: "스푼 30개",
    price: 12900,
    image: "/image/store/spoon/spoon_30.png",
  },
  {
    id: "spoon-50",
    spoonAmount: 50,
    title: "스푼 50개",
    price: 19900,
    image: "/image/store/spoon/spoon_50.png",
  },
  {
    id: "spoon-100",
    spoonAmount: 100,
    title: "스푼 100개",
    price: 36900,
    image: "/image/store/spoon/spoon_100.png",
  },
];

function formatPrice(value = 0) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function normalizePhone(phone = "") {
  return String(phone).replace(/[^0-9]/g, "");
}

export default function StoreManualPage() {
  const router = useRouter();
  const reduxUser = useSelector((state) => state.user?.user || null);

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [depositorName, setDepositorName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [agreeGuide, setAgreeGuide] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [requestId, setRequestId] = useState("");

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

  const selectedProduct = useMemo(() => {
    const found = SPOON_PRODUCTS.find(
      (item) => item.id === router.query.productId
    );
    return found || SPOON_PRODUCTS[1];
  }, [router.query.productId]);

  useEffect(() => {
    if (!reduxUser) return;

    setDepositorName(
      reduxUser?.name || reduxUser?.username || reduxUser?.nickname || ""
    );
    setPhoneNumber(reduxUser?.phoneNumber || reduxUser?.phone || "");
  }, [reduxUser]);

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("계좌번호를 복사했어요.");
    } catch (error) {
      alert("복사에 실패했어요.");
    }
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) return;
    if (!depositorName.trim()) {
      alert("입금자명을 입력해주세요.");
      return;
    }
    if (!phoneNumber.trim()) {
      alert("연락처를 입력해주세요.");
      return;
    }
    if (!agreeGuide) {
      alert("안내 내용을 확인해주세요.");
      return;
    }

    try {
      setSubmitting(true);

      const normalizedPhone = normalizePhone(phoneNumber);

      const payload = {
        uid: resolvedUid,
        productId: selectedProduct.id,
        productTitle: selectedProduct.title,
        spoonAmount: selectedProduct.spoonAmount,
        amount: selectedProduct.price,
        depositorName: depositorName.trim(),
        phoneNumber: normalizedPhone,
        status: "requested",
        accountBank: BANK_INFO.bank,
        accountNumber: BANK_INFO.accountNumber,
        accountHolder: BANK_INFO.accountHolder,
        source: "manual_bank_transfer",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "spoonDepositRequests"), payload);
      setRequestId(docRef.id);

      const userMsg = `[차밍수프]
스푼 충전 신청이 완료됐어요.

상품: ${selectedProduct.title}
금액: ${formatPrice(selectedProduct.price)}원

입금계좌
${BANK_INFO.bank} ${BANK_INFO.accountNumber}
예금주 ${BANK_INFO.accountHolder}

입금자명: ${depositorName.trim()}
입금 확인 후 순차적으로 충전해드릴게요.`;

      const adminMsg = `[차밍수프]
새 스푼 충전 신청

상품: ${selectedProduct.title}
금액: ${formatPrice(selectedProduct.price)}원
입금자명: ${depositorName.trim()}
연락처: ${normalizedPhone}
신청번호: ${docRef.id}`;

      try {
        if (normalizedPhone) {
          await sendLms(normalizedPhone, userMsg, "차밍수프 입금 안내");
        }
      } catch (smsError) {
        console.error("user sendLms error:", smsError);
      }

      try {
        await sendLms(ADMIN_PHONE, adminMsg, "차밍수프 충전 신청");
      } catch (adminSmsError) {
        console.error("admin sendLms error:", adminSmsError);
      }

      setDone(true);
    } catch (error) {
      console.error("[store/manual] submit error:", error);
      alert("신청 저장 중 오류가 발생했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!authChecked && !reduxUser?.userID && !reduxUser?.uid) {
    return <div className="min-h-screen bg-white md:bg-[#f6f7fb]" />;
  }

  return (
    <>
      <Head>
        <title>입금 신청 | 차밍수프</title>
      </Head>

      <main className="min-h-screen bg-white md:bg-[#f6f7fb]">
        <div className="relative min-h-screen overflow-hidden">
          <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
            <section className="relative flex h-[100dvh] w-full max-w-[390px] flex-col overflow-hidden bg-slate-50 md:h-[760px] md:max-w-[430px] md:rounded-[24px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
              <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
                <div className="text-[16px] font-bold text-slate-900">
                  입금 신청
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
                        <div className="text-[21px] font-black leading-[1.25] tracking-[-0.03em] text-slate-900">
                          원하는 스푼을 선택했고,
                          <br />
                          이제 입금만 하면 돼요
                        </div>
                        <div className="mt-2 text-[13px] leading-6 text-slate-600">
                          신청이 완료되면 문자로도 입금 안내를 보내드릴게요.
                        </div>
                      </div>
                    </section>

                    <section className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-50">
                          <Image
                            src={selectedProduct.image}
                            alt={selectedProduct.title}
                            width={48}
                            height={48}
                            unoptimized
                            className="object-contain"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-[17px] font-bold text-slate-900">
                            {selectedProduct.title}
                          </div>
                          <div className="mt-1 text-[12px] text-slate-500">
                            스푼 {selectedProduct.spoonAmount}개 충전
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[12px] text-slate-500">입금금액</div>
                          <div className="mt-1 text-[19px] font-black tracking-[-0.03em] text-slate-900">
                            {formatPrice(selectedProduct.price)}원
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
                      <div className="text-[14px] font-bold text-slate-900">
                        입금 계좌 안내
                      </div>

                      <div className="mt-4 rounded-md bg-violet-50 px-3 py-3">
                        <div className="text-[12px] text-slate-500">은행</div>
                        <div className="mt-1 text-[15px] font-bold text-slate-900">
                          {BANK_INFO.bank}
                        </div>

                        <div className="mt-3 text-[12px] text-slate-500">계좌번호</div>
                        <div className="mt-1 flex items-center justify-between gap-3">
                          <div className="text-[16px] font-bold text-slate-900">
                            {BANK_INFO.accountNumber}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(BANK_INFO.accountNumber)}
                            style={{ cursor: "pointer" }}
                            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-[12px] font-semibold text-violet-600"
                          >
                            <PiCopyDuotone className="text-[14px]" />
                            복사
                          </button>
                        </div>

                        <div className="mt-3 text-[12px] text-slate-500">예금주</div>
                        <div className="mt-1 text-[15px] font-bold text-slate-900">
                          {BANK_INFO.accountHolder}
                        </div>
                      </div>
                    </section>

                    {!done ? (
                      <section className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
                        <div className="text-[14px] font-bold text-slate-900">
                          신청 정보 입력
                        </div>

                        <div className="mt-4 space-y-3">
                          <div>
                            <label className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-slate-700">
                              <PiUserDuotone className="text-[15px]" />
                              입금자명
                            </label>
                            <input
                              value={depositorName}
                              onChange={(e) => setDepositorName(e.target.value)}
                              placeholder="입금자명을 입력해주세요"
                              className="h-12 w-full rounded-md border border-slate-200 bg-white px-3 text-[14px] text-slate-900 outline-none focus:border-violet-400"
                            />
                          </div>

                          <div>
                            <label className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-slate-700">
                              <PiPhoneDuotone className="text-[15px]" />
                              연락처
                            </label>
                            <input
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              placeholder="01012345678"
                              inputMode="numeric"
                              className="h-12 w-full rounded-md border border-slate-200 bg-white px-3 text-[14px] text-slate-900 outline-none focus:border-violet-400"
                            />
                          </div>
                        </div>

                        <label className="mt-4 flex cursor-pointer items-start gap-2">
                          <input
                            type="checkbox"
                            checked={agreeGuide}
                            onChange={(e) => setAgreeGuide(e.target.checked)}
                            className="mt-1"
                          />
                          <span className="text-[12px] leading-5 text-slate-600">
                            신청 후 위 계좌로 입금하며, <br/>입금 확인 후 순차적으로 충전되는 점을 확인했어요.
                          </span>
                        </label>
                      </section>
                    ) : (
                      <section className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
                        <div className="flex items-center gap-2 text-violet-600">
                          <PiCheckCircleFill className="text-[18px]" />
                          <div className="text-[15px] font-bold">
                            입금 신청이 완료됐어요
                          </div>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="rounded-md bg-slate-50 px-3 py-3 text-[12px] leading-5 text-slate-600">
                            신청번호: {requestId}
                          </div>
                          <div className="rounded-md bg-slate-50 px-3 py-3 text-[12px] leading-5 text-slate-600">
                            입력한 연락처로 입금 안내 문자를 보내드렸어요.
                          </div>
                          <div className="rounded-md bg-slate-50 px-3 py-3 text-[12px] leading-5 text-slate-600">
                            하나은행 112-891138-99107 / 예금주 전세환 으로 입금해주세요.
                          </div>
                        </div>
                      </section>
                    )}

                    <section className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
                      <div className="text-[14px] font-bold text-slate-900">
                        안내 사항
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="rounded-md bg-slate-50 px-3 py-3 text-[12px] leading-5 text-slate-600">
                          매칭 1회 시도에는 스푼 8개가 사용돼요.
                        </div>
                        <div className="rounded-md bg-slate-50 px-3 py-3 text-[12px] leading-5 text-slate-600">
                          구매 스푼은 상대 거절 또는 무응답일 때 1회 복구돼요.
                        </div>
                        <div className="rounded-md bg-slate-50 px-3 py-3 text-[12px] leading-5 text-slate-600">
                          이벤트나 무료 지급 스푼은 복구 없이 소진돼요.
                        </div>
                      </div>
                    </section>

                    <div className="h-4" />
                  </div>
                </div>
              </div>

              {isLoggedIn ? (
                <div className="shrink-0 border-t border-slate-200 bg-white">
                  <div className="px-4 pb-3 pt-3">
                    {!done ? (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        style={{ cursor: submitting ? "default" : "pointer" }}
                        className="flex h-12 w-full items-center justify-center rounded-md bg-violet-600 text-[15px] font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
                      >
                        {submitting ? "신청 저장 중..." : "입금 신청 완료하기"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => router.push("/store")}
                        style={{ cursor: "pointer" }}
                        className="flex h-12 w-full items-center justify-center rounded-md bg-violet-600 text-[15px] font-bold text-white transition hover:bg-violet-700"
                      >
                        상점으로 돌아가기
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-100 bg-white">
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
        redirect="/store/manual"
        title="로그인이 필요해요"
        description="입금 신청은 로그인 후 진행할 수 있어요."
      />
    </>
  );
}