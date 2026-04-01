import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion";
import {
  PiHeartDuotone,
  PiLeafDuotone,
  PiClipboardTextDuotone,
  PiIdentificationBadgeDuotone,
  PiUserCircleDuotone,
  PiUserDuotone,
  PiShoppingBagOpenDuotone,
  PiInfoDuotone,
  PiHeadsetDuotone,
  PiGearSixDuotone,
  PiUsersThreeDuotone,
  PiFileTextDuotone,
  PiSignOutDuotone,
  PiTrashDuotone,
  PiCaretRightBold,
  PiArrowLeft,
  PiCaretDownBold,
  PiAtDuotone,
  PiLockKeyDuotone,
} from "react-icons/pi";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db, logOut } from "firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { signOut } from "slices/user";
import { getProfileCompletionDetail } from "lib/profileCompletion";
import AuthRequiredModal from "components/Common/AuthRequiredModal";
import { FiLogOut, FiX } from "react-icons/fi";

const NAV_ITEMS = [
  {
    key: "arena",
    label: "매칭아레나",
    href: "/arena",
    icon: PiHeartDuotone,
    needAuth: true,
  },
  {
    key: "cards",
    label: "차밍카드",
    href: "/cards/list",
    icon: PiLeafDuotone,
    needAuth: true,
  },
  {
    key: "tests",
    label: "테스트",
    href: "/tests/style",
    icon: PiClipboardTextDuotone,
    needAuth: false,
  },
  {
    key: "board",
    label: "매칭현황",
    href: "/board",
    icon: PiIdentificationBadgeDuotone,
    needAuth: true,
  },
  {
    key: "me",
    label: "내 정보",
    action: "menu",
    icon: PiUserCircleDuotone,
    needAuth: true,
  },
];

function maskEmail(email = "") {
  if (!email || !email.includes("@")) return "";
  const [local, domain] = email.split("@");
  if (!local) return email;

  if (local.length <= 2) {
    return `${local[0] || ""}*@${domain}`;
  }

  return `${local.slice(0, 2)}***@${domain}`;
}

function MenuRow({ icon, label, onClick, muted = false, rightNode = null, description = "" }) {
  const Icon = icon;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ cursor: "pointer" }}
      className="group flex w-full items-center justify-between border-b border-zinc-200 px-4 py-5 text-left transition"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Icon
          className={`shrink-0 text-[22px] transition ${muted
              ? "text-zinc-400 group-hover:text-zinc-500"
              : "text-zinc-500 group-hover:text-zinc-800"
            }`}
        />
        <div className="min-w-0">
          <div
            className={`break-keep text-[15px] font-semibold transition ${muted
                ? "text-zinc-400 group-hover:text-zinc-500"
                : "text-zinc-800 group-hover:text-zinc-950"
              }`}
          >
            {label}
          </div>
          {description ? (
            <div className="mt-1 break-keep text-[12px] leading-5 text-zinc-400">
              {description}
            </div>
          ) : null}
        </div>
      </div>

      {rightNode || (
        <PiCaretRightBold
          className={`shrink-0 text-[18px] transition ${muted
              ? "text-zinc-400 group-hover:text-zinc-500"
              : "text-zinc-400 group-hover:text-zinc-700"
            }`}
        />
      )}
    </button>
  );
}

function SubMenuRow({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ cursor: "pointer" }}
      className="flex  w-full items-center justify-between border-b border-zinc-100 bg-zinc-100 px-5 py-4 text-left transition hover:bg-zinc-200"
    >
      <span className="pl-8 text-[14px] font-medium text-zinc-700">{label}</span>
      <PiCaretRightBold className="text-[15px] text-zinc-400" />
    </button>
  );
}

function CenterConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "취소",
  onConfirm,
  onClose,
  loading = false,
}) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="absolute inset-0 z-[180] flex items-center justify-center bg-black/45 px-5 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-[348px] overflow-hidden rounded-md border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
            initial={{ opacity: 0, y: 14, scale: 0.965 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              style={{ cursor: "pointer" }}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-50 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
              aria-label="닫기"
            >
              <FiX className="text-[18px]" />
            </button>

            

            <div className="px-5 py-5">
              <div className="px-5 pb-5 pt-5">
                <div className="flex items-center gap-3">
                  {/* <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                    <FiLogOut className="text-[19px]" />
                  </div> */}

                  <div className="min-w-0 flex-1 pr-8">
                    <div className="break-keep text-[21px] font-bold tracking-[-0.03em] text-zinc-900">
                      {title}
                    </div>

                    <p className="mt-2 break-keep text-[14px] leading-6 text-zinc-500">
                      {description}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                style={{ cursor: loading ? "default" : "pointer" }}
                className="flex h-12 w-full items-center justify-center rounded-md bg-violet-600 text-[16px] font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
              >
                {loading ? "처리 중..." : confirmLabel}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{ cursor: loading ? "default" : "pointer" }}
                className="mt-3 flex h-11 w-full items-center justify-center rounded-md bg-transparent text-[15px] font-semibold text-zinc-500 transition hover:text-zinc-900 disabled:opacity-50"
              >
                {cancelLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function BottomSheetFrame({ children, onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        className="absolute inset-0 z-[160] bg-black/35"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
      >
        <div className="flex h-full items-end justify-center">
          <motion.div
            className="w-full rounded-t-[28px] bg-zinc-50 shadow-2xl"
            initial={{ y: 40, opacity: 0.96, scale: 0.995 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0.96, scale: 0.995 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function BottomNavbar({ contained = true }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const userState = useSelector((state) => state.user);
  const reduxUser = userState?.user ?? null;

  const [profileUser, setProfileUser] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingOpen, setSettingOpen] = useState(false);
  const [purchaseMenuOpen, setPurchaseMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [accountManageOpen, setAccountManageOpen] = useState(false);

  const [logoutLoading, setLogoutLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authRedirect, setAuthRedirect] = useState("/");

  const [authUid, setAuthUid] = useState(auth?.currentUser?.uid || null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthUid(firebaseUser?.uid || null);
    });

    return () => unsubscribe();
  }, []);

  const resolvedUid = useMemo(() => {
    return reduxUser?.userID || reduxUser?.uid || authUid || null;
  }, [reduxUser?.userID, reduxUser?.uid, authUid]);

  const isLoggedIn = !!resolvedUid;

  useEffect(() => {
    if (!resolvedUid) {
      setProfileUser((prev) => {
        if (!prev || Object.keys(prev).length === 0) return prev;
        return {};
      });
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "users", resolvedUid),
      (snap) => {
        if (!snap.exists()) {
          setProfileUser(reduxUser || {});
          return;
        }

        const data = snap.data() || {};
        setProfileUser({
          ...(reduxUser || {}),
          ...data,
          userID: resolvedUid,
          uid: resolvedUid,
        });
      },
      (error) => {
        console.error("[BottomNavbar] user snapshot error:", error);
        setProfileUser(reduxUser || {});
      }
    );

    return () => unsubscribe();
  }, [resolvedUid, reduxUser?.userID, reduxUser?.uid]);

  const rawCompletion = useMemo(() => {
    return getProfileCompletionDetail(profileUser || {});
  }, [profileUser]);

  const targetPercent = useMemo(() => {
    return Number(rawCompletion?.percent || 0);
  }, [rawCompletion?.percent]);

  const [displayPercent, setDisplayPercent] = useState(0);
  const motionPercent = useMotionValue(0);

  useEffect(() => {
    motionPercent.set(displayPercent);
    const controls = animate(motionPercent, targetPercent, {
      duration: 0.7,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayPercent(Math.round(latest));
      },
    });

    return () => controls.stop();
  }, [motionPercent, targetPercent]);

  const activeKey = useMemo(() => {
    const pathname = router.pathname;

    if (pathname.startsWith("/tests")) return "tests";
    if (pathname.startsWith("/cards")) return "cards";
    if (pathname.startsWith("/arena")) return "arena";
    if (pathname.startsWith("/board")) return "board";
    if (
      pathname.startsWith("/profile") ||
      pathname.startsWith("/store") ||
      pathname.startsWith("/about/spoon") ||
      pathname.startsWith("/setting") ||
      pathname.startsWith("/account/delete")
    ) {
      return "me";
    }

    return "";
  }, [router.pathname]);

  useEffect(() => {
    if (!menuOpen) {
      setSettingOpen(false);
      setPurchaseMenuOpen(false);
      setAccountManageOpen(false);
    }
  }, [menuOpen]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setSettingOpen(false);
    setPurchaseMenuOpen(false);
    setAccountManageOpen(false);
  }, []);

  const guardedNavigate = useCallback(
    (href, needAuth = false) => {
      if (needAuth && !isLoggedIn) {
        setAuthRedirect(href);
        setAuthModalOpen(true);
        return;
      }

      closeMenu();
      router.push(href);
    },
    [closeMenu, isLoggedIn, router]
  );

  const handleMenuOpen = useCallback(() => {
    if (!isLoggedIn) {
      setAuthRedirect("/profile");
      setAuthModalOpen(true);
      return;
    }

    setMenuOpen(true);
  }, [isLoggedIn]);

  const handleLogout = useCallback(async () => {
    try {
      setLogoutLoading(true);
      await logOut();
      dispatch(signOut({}));
      setLogoutOpen(false);
      closeMenu();
      router.push("/");
    } catch (error) {
      console.error("[BottomNavbar] logout error:", error);
    } finally {
      setLogoutLoading(false);
    }
  }, [closeMenu, dispatch, router]);


  if (!isLoggedIn && activeKey !== "tests") {
    return (
      <AuthRequiredModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        redirect={authRedirect}
      />
    );
  }

  return (
    <>
      <div
        className={`absolute inset-x-0 bottom-0 z-20 shrink-0 border-t border-zinc-200 bg-white shadow-[0_-10px_24px_rgba(15,23,42,0.08)]`}
      >
        <div className="grid h-[64px] grid-cols-5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeKey === item.key || (item.key === "me" && menuOpen);

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  if (item.action === "menu") {
                    handleMenuOpen();
                    return;
                  }

                  guardedNavigate(item.href, item.needAuth);
                }}
                style={{ cursor: "pointer" }}
                className="group flex flex-col items-center justify-center gap-1 transition"
              >
                <Icon
                  className={`text-[22px] transition ${isActive
                      ? "text-violet-600"
                      : "text-zinc-400 group-hover:text-zinc-800"
                    }`}
                />
                <span
                  className={`break-keep text-[11px] font-medium transition ${isActive
                      ? "text-violet-600"
                      : "text-zinc-400 group-hover:text-zinc-900"
                    }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {menuOpen && !settingOpen && (
        <BottomSheetFrame onClose={() => setMenuOpen(false)}>
          <div className="px-4 pt-4">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-zinc-300" />

            <div className="overflow-hidden rounded-md bg-gradient-to-r from-violet-500 via-fuchsia-400 to-amber-300 p-[1px]">
              <div className="flex items-start justify-between gap-3 rounded-md bg-white/10 px-4 py-4 text-white backdrop-blur">
                <div className="min-w-0">
                  <div className="break-keep text-[15px] font-semibold">
                    프로필 완성율 : {displayPercent}%
                  </div>
                  <div className="mt-1 break-keep text-[13px] leading-5 text-white/90">
                    프로필을 채울수록
                    <br />
                    매칭 흐름이 더 좋아져요.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => guardedNavigate("/profile", true)}
                  style={{ cursor: "pointer" }}
                  className="shrink-0 rounded-md bg-white px-3 py-2 text-[13px] font-semibold text-violet-600 shadow-sm transition hover:text-violet-700"
                >
                  프로필 수정
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 pb-6">
            <MenuRow
              icon={PiUserDuotone}
              label="내 프로필"
              onClick={() => guardedNavigate("/profile", true)}
            />

            <MenuRow
              icon={PiShoppingBagOpenDuotone}
              label="구매/결제"
              onClick={() => setPurchaseMenuOpen((prev) => !prev)}
              rightNode={
                <PiCaretDownBold
                  className={`shrink-0 text-[16px] text-zinc-400 transition ${purchaseMenuOpen ? "rotate-180" : ""
                    }`}
                />
              }
            />

            <AnimatePresence initial={false}>
              {purchaseMenuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <SubMenuRow
                    label="상점 구매"
                    onClick={() => guardedNavigate("/store", true)}
                  />
                  <SubMenuRow
                    label="결제현황"
                    onClick={() => guardedNavigate("/store/history", true)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <MenuRow
              icon={PiInfoDuotone}
              label="차밍스푼 사용 방법"
              onClick={() => guardedNavigate("/about/spoon", true)}
            />

            <MenuRow
              icon={PiHeadsetDuotone}
              label="고객센터"
              onClick={() => {
                closeMenu();
                window.open(
                  "https://open.kakao.com/o/sAJwMNCe",
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
            />

            <MenuRow
              icon={PiGearSixDuotone}
              label="계정 및 설정"
              // description="로그인 정보와 서비스 환경을 관리해요"
              onClick={() => setSettingOpen(true)}
            />
          </div>
        </BottomSheetFrame>
      )}

      {menuOpen && settingOpen && (
        <BottomSheetFrame onClose={() => setMenuOpen(false)}>
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-6">
            <button
              type="button"
              onClick={() => setSettingOpen(false)}
              style={{ cursor: "pointer" }}
              className="flex items-center gap-2 text-zinc-800 transition hover:text-zinc-950"
            >
              <PiArrowLeft className="text-[20px]" />
              <span className="text-[16px] font-bold">계정 및 설정</span>
            </button>

            <div className="w-8" />
          </div>

          {/* <div className="px-4 pt-4">
            <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
              <div className="text-[12px] font-semibold text-zinc-500">가입 이메일</div>
              <div className="mt-1 break-all text-[15px] font-semibold text-zinc-900">
                {maskEmail(profileUser?.email || auth?.currentUser?.email || "") || "이메일 정보 없음"}
              </div>
            </div>
          </div> */}

          <div className="mt-4 pb-6">
            <MenuRow
              icon={PiUsersThreeDuotone}
              label="지인 차단"
              onClick={() => guardedNavigate("/setting/block", true)}
            />

            

            <MenuRow
              icon={PiFileTextDuotone}
              label="이용약관 / 개인정보 처리방침"
              onClick={() => guardedNavigate("/about/service", true)}
            />
            <MenuRow
              icon={PiUserDuotone}
              label="계정 관리"
              onClick={() => setAccountManageOpen((prev) => !prev)}
              rightNode={
                <PiCaretDownBold
                  className={`shrink-0 text-[16px] text-zinc-400 transition ${accountManageOpen ? "rotate-180" : ""
                    }`}
                />
              }
            />

            <AnimatePresence initial={false}>
              {accountManageOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <SubMenuRow
                    label="비밀번호 변경"
                    onClick={() => guardedNavigate("/password/forgot", true)}
                  />
                  <SubMenuRow
                    label="로그아웃"
                    onClick={() => setLogoutOpen(true)}
                  />
                  <SubMenuRow
                    label="계정 삭제"
                    onClick={() => guardedNavigate("/account/delete", true)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </BottomSheetFrame>
      )}

      <CenterConfirmModal
        open={logoutOpen}
        title="로그아웃할까요?"
        description="현재 계정에서 로그아웃돼요."
        confirmLabel="로그아웃"
        onConfirm={handleLogout}
        onClose={() => setLogoutOpen(false)}
        loading={logoutLoading}
      />

      <AuthRequiredModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        redirect={authRedirect}
      />
    </>
  );
}