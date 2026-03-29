import React, { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

function calcAge(birthday) {
  if (!birthday) return null;

  const onlyNum = String(birthday).replace(/[^0-9]/g, "");
  if (onlyNum.length < 8) return null;

  const year = Number(onlyNum.slice(0, 4));
  const month = Number(onlyNum.slice(4, 6));
  const day = Number(onlyNum.slice(6, 8));

  if (!year || !month || !day) return null;

  const today = new Date();
  let age = today.getFullYear() - year;
  const hasNotHadBirthday =
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day);

  if (hasNotHadBirthday) age -= 1;
  return age > 0 ? age : null;
}

function getProfileImage(profile) {
  if (profile?.thumbimage) return profile.thumbimage;
  if (Array.isArray(profile?.profilePhotos) && profile.profilePhotos[0]) {
    return profile.profilePhotos[0]?.url || profile.profilePhotos[0];
  }
  return "/image/profile/default_profile.png";
}

function getStyleTestTitle(profile) {
  return profile?.styleTest?.typeTitle || "정보 없음";
}

function getStyleTestCode(profile) {
  return profile?.styleTest?.typeCode || "";
}

function getStyleTestOneLine(profile) {
  return profile?.styleTest?.oneLine || "정보 없음";
}

function getStyleTestImage(profile) {
  const code = profile?.styleTest?.typeCode || "";

  const imageMap = {
    DSLR: "/image/tests/style/type_1.png",
    DMLR: "/image/tests/style/type_2.png",
    DSFR: "/image/tests/style/type_3.png",
    DMFR: "/image/tests/style/type_4.png",
    TSLR: "/image/tests/style/type_5.png",
    TMLR: "/image/tests/style/type_6.png",
    TSFR: "/image/tests/style/type_7.png",
    TMFR: "/image/tests/style/type_8.png",
    DSLP: "/image/tests/style/type_9.png",
    DMLP: "/image/tests/style/type_10.png",
    DSFP: "/image/tests/style/type_11.png",
    DMFP: "/image/tests/style/type_12.png",
    TSLP: "/image/tests/style/type_13.png",
    TMLP: "/image/tests/style/type_14.png",
    TSFP: "/image/tests/style/type_15.png",
    TMFP: "/image/tests/style/type_16.png",
  };

  return imageMap[code] || null;
}

export default function UsageQuotaModal({
  open,
  profile,
  onClose,
  onDetail,
}) {
  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const age = useMemo(() => calcAge(profile?.birthday), [profile?.birthday]);
  const profileImage = useMemo(() => getProfileImage(profile), [profile]);
  const styleTestTitle = useMemo(() => getStyleTestTitle(profile), [profile]);
  const styleTestCode = useMemo(() => getStyleTestCode(profile), [profile]);
  const styleTestOneLine = useMemo(() => getStyleTestOneLine(profile), [profile]);
  const styleTestImage = useMemo(() => getStyleTestImage(profile), [profile]);

  const locationText = [profile?.address_sido, profile?.address_sigugun]
    .filter(Boolean)
    .join(" ");

  const topSubText = [age ? `${age}세` : "", locationText, styleTestCode || ""]
    .filter(Boolean)
    .join(", ");

  const infoRows = [
    {
      label: "직업",
      value: profile?.job || "정보 없음",
    },
    {
      label: "학력",
      value: profile?.education || "정보 없음",
    },
  ];

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="w-full max-w-[380px]">
            <motion.div
              className="overflow-hidden rounded-2xl bg-white shadow-2xl"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <div className="border-solid border-b border-slate-200 px-6 py-6">
                <div className="flex items-center gap-3">
                  <img
                    src={profileImage}
                    alt="프로필"
                    className="h-14 w-14 rounded-full object-cover"
                  />

                  <div className="min-w-0">
                    <div className="text-[18px] font-semibold text-slate-900">
                      {profile?.username || profile?.nickname || "프로필"}
                    </div>
                    <div className="mt-1 text-[14px] text-slate-500">
                      {topSubText || "기본 정보"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-6">
                <div className="space-y-3">
                  {infoRows.map((item) => (
                    <div
                      key={item.label}
                      className="text-[15px] leading-6 text-slate-700"
                    >
                      <span className="font-semibold text-slate-800">
                        {item.label}
                      </span>
                      <span className="mx-1 text-slate-400">:</span>
                      <span>{item.value}</span>
                    </div>
                  ))}

                  <div className="pt-1">
                    <div className="rounded-md border border-violet-200 bg-violet-50 px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white">
                          {styleTestImage ? (
                            <img
                              src={styleTestImage}
                              alt={styleTestTitle}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="text-[12px] font-semibold text-slate-400">
                              NO IMG
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {styleTestCode ? (
                              <span className="rounded-md border border-violet-200 bg-white px-2 py-1 text-[11px] font-semibold text-violet-600">
                                {styleTestCode}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-2 text-[16px] font-semibold text-slate-900">
                            {styleTestTitle}
                          </div>

                          <div className="mt-1 text-[13px] leading-5 text-slate-600">
                            {styleTestOneLine}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onDetail}
                  className="mt-5 h-12 w-full rounded-md bg-[#ff4338] text-[17px] font-semibold text-white"
                >
                  상세 프로필 바로가기
                </button>
              </div>
            </motion.div>

            <motion.button
              type="button"
              onClick={onClose}
              className="mt-3 w-full bg-transparent text-center text-[16px] font-medium text-white/95"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18, ease: "easeOut", delay: 0.03 }}
            >
              취소
            </motion.button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}