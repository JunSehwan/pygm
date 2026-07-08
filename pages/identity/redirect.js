import { useEffect } from "react";
import { useRouter } from "next/router";
import {
  clearPendingIdentityVerification,
  getPendingIdentityVerification,
  setIdentityVerificationRedirectResult,
  verifyIdentityResultWithServer,
} from "lib/identityVerificationClient";

export default function IdentityVerificationRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const pending = getPendingIdentityVerification() || {};

    const returnUrl = pending?.returnUrl || "/signup";
    const source = pending?.source || "";

    const identityVerificationId =
      router.query?.identityVerificationId ||
      router.query?.id ||
      router.query?.identity_verification_id ||
      pending?.identityVerificationId ||
      "";

    const code = router.query?.code || "";
    const message = router.query?.message || "";

    (async () => {
      try {
        if (code) {
          setIdentityVerificationRedirectResult({
            source,
            verified: false,
            code,
            message: String(message || "본인인증이 취소되었거나 실패했습니다."),
          });

          clearPendingIdentityVerification();
          router.replace(returnUrl);
          return;
        }

        if (!identityVerificationId) {
          setIdentityVerificationRedirectResult({
            source,
            verified: false,
            message: "identityVerificationId를 받지 못했습니다.",
          });

          clearPendingIdentityVerification();
          router.replace(returnUrl);
          return;
        }

        const verified = await verifyIdentityResultWithServer({
          identityVerificationId,
          requestedPhone: pending?.requestedPhone || "",
          requestedCarrier: pending?.requestedCarrier || "",
        });

        setIdentityVerificationRedirectResult({
          source,
          ...(verified || {}),
        });
      } catch (error) {
        console.error("[identity/redirect] error:", error);

        setIdentityVerificationRedirectResult({
          source,
          verified: false,
          message:
            error?.message || "본인인증 결과 처리 중 오류가 발생했습니다.",
        });
      } finally {
        clearPendingIdentityVerification();
        router.replace(returnUrl);
      }
    })();
  }, [router, router.isReady]);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-white px-5">
      <div className="w-full max-w-[360px] rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="text-[18px] font-bold text-slate-900">
          본인인증 처리 중
        </div>
        <p className="mt-2 break-keep text-[14px] leading-6 text-slate-500">
          인증 결과를 확인한 뒤 이전 화면으로 돌아갑니다.
        </p>
      </div>
    </main>
  );
}