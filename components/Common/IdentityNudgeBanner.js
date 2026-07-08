import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { FiShield, FiX } from "react-icons/fi";

function isIdentityVerified(user = {}) {
  return Boolean(
    user?.identityVerified === true ||
      user?.phone_verified === true ||
      user?.phone_verified === "true" ||
      user?.phoneVerified === true ||
      user?.telVerified === true ||
      user?.identityVerifiedAt ||
      user?.phone_verified_at ||
      user?.identityVerification?.verifiedAt
  );
}

function getUserKey(user = {}) {
  return user?.userID || user?.uid || user?.id || "guest";
}

export default function IdentityNudgeBanner({
  user,
  compact = false,
  className = "",
}) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  const storageKey = useMemo(() => {
    return `charmingsoup_identity_nudge_dismissed_${getUserKey(user)}`;
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(storageKey);
      const dismissedAt = Number(raw || 0);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      setDismissed(!!dismissedAt && Date.now() - dismissedAt < sevenDays);
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  if (!user || isIdentityVerified(user) || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);

    try {
      window.localStorage.setItem(storageKey, String(Date.now()));
    } catch {
      // localStorage 사용 불가 환경에서는 화면에서만 숨김
    }
  };

  return (
    <div className={`px-4 ${className}`}>
      <div className="relative rounded-md border border-violet-100 bg-white px-4 py-3 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="본인인증 안내 닫기"
          style={{ cursor: "pointer" }}
        >
          <FiX className="text-[15px]" />
        </button>

        <div className="flex gap-3 pr-7">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
            <FiShield className="text-[18px]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="break-keep text-[13px] font-extrabold leading-5 text-zinc-900">
              본인인증을 하면 프로필에 인증마크가 표시돼요.
            </div>

            <div className="mt-1 break-keep text-[12px] font-medium leading-5 text-slate-500">
              지금도 둘러볼 수 있지만, 진지한 매칭에서는 인증된 프로필이 더 신뢰를 얻어요.
            </div>

            {!compact ? (
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="mt-3 h-9 rounded-md bg-violet-600 px-3 text-[12px] font-extrabold text-white hover:bg-violet-700"
                style={{ cursor: "pointer" }}
              >
                본인인증 하러가기
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
