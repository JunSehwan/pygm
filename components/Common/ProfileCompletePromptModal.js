import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiArrowLeft, FiChevronRight } from "react-icons/fi";
import { getProfileCompletionDetail, getProfilePreviewImage } from "lib/profileCompletion";

const STORAGE_KEY_PREFIX = "profile_complete_prompt_last_shown_v3";
const SESSION_KEY_PREFIX = "profile_complete_prompt_session_v3";
const DEFAULT_COOLDOWN_DAYS = 7;

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

function CompletionMiniRow({ title, done, total, percent, strong = false }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md px-3 py-3",
        strong ? "bg-violet-50" : "bg-slate-50"
      )}
    >
      <div className="min-w-0">
        <div
          className={cn(
            "text-[14px] font-semibold",
            strong ? "text-violet-700" : "text-slate-700"
          )}
        >
          {title}
        </div>
        <div className="mt-0.5 text-[11px] text-slate-400">
          {done}/{total}
        </div>
      </div>

      <div
        className={cn(
          "shrink-0 text-[15px] font-bold",
          strong ? "text-violet-600" : "text-slate-700"
        )}
      >
        {percent}%
      </div>
    </div>
  );
}

export default function ProfileCompletePromptModal({
  user,
  open,
  onClose,
  onMoveProfile,
}) {
  const profileInfo = useMemo(() => getProfileCompletionDetail(user || {}), [user]);
  const imageSrc = useMemo(() => getProfilePreviewImage(user || {}), [user]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[14000] bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="mx-auto flex h-full w-full max-w-[430px] items-end justify-center px-3 pb-3">
          <motion.div
            className="w-full overflow-hidden rounded-t-[22px] rounded-b-md bg-white shadow-2xl"
            initial={{ opacity: 0, y: 80, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-200 px-5 pb-4 pt-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[24px] font-bold tracking-[-0.03em] text-slate-900">
                  매칭률을 높여 볼까요?
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-700"
                >
                  <FiArrowLeft className="text-[24px]" />
                </button>
              </div>
            </div>

            <div className="max-h-[78vh] overflow-y-auto px-5 py-5">
              <div className="mb-5 text-center">
                <div className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full bg-slate-100">
                  <img
                    src={imageSrc}
                    alt="프로필"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="text-[21px] font-bold leading-[1.35] tracking-[-0.03em] text-slate-900">
                  조금만 더
                  <br />
                  나를 표현해볼까요?❤️
                </div>

                <div className="mt-3 text-[14px] leading-6 text-slate-500">
                  프로필을 더 채우면
                  <br />
                  더 다양한 연결 기회를 얻을 수 있어요.
                </div>
              </div>

              <div className="mb-4 rounded-md bg-slate-50 px-4 py-4 text-center">
                <div className="text-[12px] font-semibold text-slate-500">
                  전체 프로필 완성도
                </div>
                <div className="mt-1 text-[28px] font-black tracking-[-0.03em] text-violet-600">
                  {profileInfo.percent}%
                </div>
              </div>

              <div className="space-y-2">
                <CompletionMiniRow
                  title={profileInfo.basic.title}
                  done={profileInfo.basic.done}
                  total={profileInfo.basic.total}
                  percent={profileInfo.basic.percent}
                  strong
                />

                {profileInfo.surveySections.map((section) => (
                  <CompletionMiniRow
                    key={section.key}
                    title={section.title}
                    done={section.done}
                    total={section.total}
                    percent={section.percent}
                  />
                ))}
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={onMoveProfile}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-violet-500 text-[16px] font-bold text-white"
                >
                  프로필 작성
                  <FiChevronRight className="text-[18px]" />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full text-center text-[15px] font-medium text-slate-400"
                >
                  다음에 하기
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function useProfileCompletePrompt(user, options = {}) {
  const cooldownDays = options.cooldownDays || DEFAULT_COOLDOWN_DAYS;
  const [open, setOpen] = useState(false);

  const profileInfo = useMemo(() => getProfileCompletionDetail(user || {}), [user]);
  const uid = user?.userID || user?.uid || "";

  useEffect(() => {
    if (!uid) return;
    if (profileInfo.percent >= 100) return;

    const sessionKey = `${SESSION_KEY_PREFIX}_${uid}`;
    const storageKey = `${STORAGE_KEY_PREFIX}_${uid}`;

    const alreadyShownThisSession = sessionStorage.getItem(sessionKey);
    const lastShownAt = localStorage.getItem(storageKey);

    const now = Date.now();
    const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
    const longTimePassed = !lastShownAt || now - Number(lastShownAt) > cooldownMs;

    if (!alreadyShownThisSession || longTimePassed) {
      setOpen(true);
      sessionStorage.setItem(sessionKey, "1");
      localStorage.setItem(storageKey, String(now));
    }
  }, [uid, profileInfo.percent, cooldownDays]);

  const close = () => setOpen(false);
  const forceOpen = () => setOpen(true);

  return {
    open,
    close,
    forceOpen,
    profileInfo,
  };
}