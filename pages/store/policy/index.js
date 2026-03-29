import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  PiArrowLeft,
  PiCoinsDuotone,
  PiInfoDuotone,
  PiShieldCheckDuotone,
  PiReceiptDuotone,
} from "react-icons/pi";
import { useSelector } from "react-redux";

import { auth } from "firebaseConfig";
import BottomNavbar from "components/Common/BottomNavbar";
import AuthRequiredModal from "components/Common/AuthRequiredModal";

function PolicySection({ icon: Icon, title, children }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-violet-50 text-violet-600">
          <Icon className="text-[20px]" />
        </div>
        <div className="text-[16px] font-bold text-slate-900">{title}</div>
      </div>

      <div className="mt-3 space-y-2 break-keep text-[13px] leading-5 text-slate-600">
        {children}
      </div>
    </section>
  );
}

export default function StorePolicyPage() {
  const router = useRouter();
  const reduxUser = useSelector((state) => state.user?.user || null);
  const isLoggedIn = !!auth?.currentUser || !!reduxUser?.userID || !!reduxUser?.uid;

  return (
    <>
      <Head>
        <title>스푼 충전/환불 안내 | 차밍수프</title>
        <meta
          name="description"
          content="차밍수프 스푼 충전, 사용, 환불, 취소 정책 안내"
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
            <section className="relative flex h-[100dvh] w-full max-w-[390px] flex-col overflow-hidden bg-slate-50 md:h-[760px] md:max-w-[430px] md:rounded-[24px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
              <div className="shrink-0 bg-[linear-gradient(135deg,#6f6ff0_0%,#d84d57_42%,#d8dd81_100%)] px-4 pb-6 pt-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="text-[15px] font-bold">스푼 충전/환불 안내</div>

                  <button
                    type="button"
                    onClick={() => router.back()}
                    style={{ cursor: "pointer" }}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm"
                  >
                    <PiArrowLeft className="text-[22px]" />
                  </button>
                </div>

                <div className="mt-2 text-[24px] font-bold leading-tight">
                  스푼 이용정책,
                  <br />
                  미리 확인해주세요.
                </div>

                <div className="mt-3 break-keep text-[14px] leading-6 text-white/90">
                  구매, 사용, 환불, 서비스 장애 복구 기준을
                  <br />
                  한 번에 확인할 수 있어요.
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto px-4 py-4">
                  <div className="space-y-3 pb-4">
                    <PolicySection icon={PiCoinsDuotone} title="1. 스푼 충전 및 사용">
                      <p>스푼은 차밍수프 내 매칭 시도 및 일부 유료 기능 이용에 사용되는 디지털 이용권입니다.</p>
                      <p>매칭 1회 시도에는 스푼 8개가 차감됩니다.</p>
                      <p>구매가 정상 완료되면 결제 완료 화면 또는 계정 내 잔액에 즉시 반영되는 구조를 권장합니다.</p>
                    </PolicySection>

                    <PolicySection icon={PiInfoDuotone} title="2. 환불가능 기준">
                      <p>아래 경우에는 전액 환불 또는 동일 수량 복구가 가능하도록 운영하는 것이 좋습니다.</p>
                      <p>• 중복 결제 또는 시스템 중복 차감</p>
                      <p>• 결제 오류로 인해 상품이 정상 지급되지 않은 경우</p>
                      <p>• 서비스 장애, 운영 실수, 상대 계정 이상 등 회사 책임 사유로 정상적인 이용이 이루어지지 않은 경우</p>
                      <p>• 법령상 청약철회가 인정되는 경우</p>
                    </PolicySection>

                    <PolicySection icon={PiShieldCheckDuotone} title="3. 환불제한 기준">
                      <p>아래 경우에는 현금 환불보다 스푼 복구 제외 또는 운영 보상 기준으로 가는 편이 안전합니다.</p>
                      <p>• 사용자가 직접 매칭 시도를 진행한 이후 단순 변심으로 환불을 요청하는 경우</p>
                      <p>• 상대방의 거절, 응답 지연, 개인적인 불만족 등 서비스 하자가 아닌 사유</p>
                      <p>• 이미 사용된 스푼 또는 이미 개시된 디지털 서비스 이용분</p>
                      <p>• 약관 위반, 부정 이용, 계정 제재가 확인된 경우</p>
                    </PolicySection>

                    <PolicySection icon={PiReceiptDuotone} title="4. 추천 운영정책">
                      <p>단순 매칭 실패마다 자동 현금 환불을 해주기보다는, 회사 귀책 사유일 때만 스푼을 자동 복구하는 방식이 더 적절합니다.</p>
                      <p>상대방 거절이나 무응답까지 매번 환불하면 악용 가능성이 커지고, 서비스 이용권의 가치가 흐려질 수 있습니다.</p>
                      <p>대신 마케팅 차원에서 ‘특정 조건 충족 시 보너스 스푼 지급’ 정도는 별도 프로모션으로 운영할 수 있습니다.</p>
                    </PolicySection>

                    <PolicySection icon={PiInfoDuotone} title="5. 문의 및 처리">
                      <p>환불 및 복구 요청은 결제 일시, 결제수단, 계정 정보, 문제 상황을 함께 접수하도록 구성하는 것이 좋습니다.</p>
                      <p>처리 결과는 앱 알림 또는 이메일로 안내하고, 스푼 복구 내역과 환불 내역을 별도 로그로 남겨두는 것을 권장합니다.</p>
                    </PolicySection>
                  </div>
                </div>
              </div>

              {isLoggedIn ? (
                <div className="shrink-0 border-t border-slate-100 bg-white">
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
        redirect="/store/policy"
        title="로그인이 필요해요"
        description="이 정책 페이지는 로그인 후 확인할 수 있어요."
      />
    </>
  );
}