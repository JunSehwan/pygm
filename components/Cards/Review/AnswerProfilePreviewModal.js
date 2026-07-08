import React, { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

function calcAgeFromBirthdayMap(birthday) {
  if (!birthday) return null;

  if (typeof birthday === "object" && birthday.year) {
    const year = Number(birthday.year);
    const month = Number(birthday.month || 1);
    const day = Number(birthday.day || 1);

    const today = new Date();
    let age = today.getFullYear() - year;
    const hasNotHadBirthday =
      today.getMonth() + 1 < month ||
      (today.getMonth() + 1 === month && today.getDate() < day);

    if (hasNotHadBirthday) age -= 1;
    return age > 0 ? age : null;
  }

  const onlyNum = String(birthday).replace(/[^0-9]/g, "");
  if (onlyNum.length < 4) return null;

  const year = Number(onlyNum.slice(0, 4));
  const month = Number(onlyNum.slice(4, 6) || "1");
  const day = Number(onlyNum.slice(6, 8) || "1");

  const today = new Date();
  let age = today.getFullYear() - year;
  const hasNotHadBirthday =
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day);

  if (hasNotHadBirthday) age -= 1;
  return age > 0 ? age : null;
}

function getProfileImage(profile) {
  
  if (Array.isArray(profile?.profilePhotos)) {
    const firstValid = profile.profilePhotos.find((item) => {
      if (!item) return false;
      if (typeof item === "string") return !!item;
      return !!item.url;
    });
    
    if (typeof firstValid === "string") return firstValid;
    if (firstValid?.url) return firstValid.url;
  }
  
  if (profile?.thumbimage) return profile.thumbimage;
  return "/image/profile/default_profile.png";
}

function getStyleImage(typeCode) {
  if (!typeCode) return null;

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

  return imageMap[typeCode] || null;
}

export default function AnswerProfilePreviewModal({
  open,
  profile,
  answer,
  onClose,
  onDetail,
  remainingProfileDetailCount = 0,
  canOpenDetail = false,
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

  const mergedProfile = useMemo(() => {
    return {
      nickname:
        profile?.nickname ||
        answer?.answererNickname ||
        "프로필",
      username: "",
      birthday: profile?.birthday || "",
      mbti: profile?.mbti || "",
      job: profile?.job || "",
      education: profile?.education || "",
      address_sido: profile?.address_sido || profile?.residence?.sido || "",
      address_sigugun:
        profile?.address_sigugun || profile?.residence?.sigugun || "",
      thumbimage: profile?.thumbimage || "",
      profilePhotos: Array.isArray(profile?.profilePhotos)
        ? profile.profilePhotos
        : [],
      styleTest: profile?.styleTest || {},
    };
  }, [profile, answer]);

  const age = useMemo(
    () => calcAgeFromBirthdayMap(mergedProfile?.birthday),
    [mergedProfile?.birthday]
  );

  const profileImage = useMemo(() => getProfileImage(mergedProfile), [mergedProfile]);

  const styleTypeCode = mergedProfile?.styleTest?.typeCode || "";
  const styleTypeTitle = mergedProfile?.styleTest?.typeTitle || "";
  const styleOneLine = mergedProfile?.styleTest?.oneLine || "";
  const styleImage = useMemo(() => getStyleImage(styleTypeCode), [styleTypeCode]);

  const locationText = [
    mergedProfile?.address_sido,
    mergedProfile?.address_sigugun,
  ]
    .filter(Boolean)
    .join(" ");

  const topSubText = [age ? `${age}세` : "", locationText]
    .filter(Boolean)
    .join(", ");

  const infoRows = [
    { label: "직업", value: mergedProfile?.job || "정보 없음" },
    { label: "학력", value: mergedProfile?.education || "정보 없음" },
    { label: "MBTI", value: mergedProfile?.mbti || "정보 없음" },
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
          <div className="w-full max-w-[340px]">
            <motion.div
              className="overflow-hidden rounded-[28px] bg-white shadow-2xl"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-3">
                  <img
                    src={profileImage}
                    alt="프로필"
                    className="h-14 w-14 rounded-full object-cover"
                  />

                  <div className="min-w-0">
                    <div className="text-[18px] font-semibold text-slate-900">
                      {mergedProfile?.nickname || "프로필"}
                    </div>
                    <div className="mt-1 text-[14px] text-slate-500">
                      {topSubText || "기본 정보"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4">
                {styleTypeCode ? (
                  <div className="mb-4 rounded-md border border-slate-200 bg-white p-3">
                    <div className="flex items-center gap-3">
                      {styleImage ? (
                        <img
                          src={styleImage}
                          alt={styleTypeCode}
                          className="h-16 w-16 rounded-md object-contain"
                        />
                      ) : null}

                      <div className="min-w-0">
                        <div className="mt-1 text-[16px] font-semibold text-slate-900">
                          {styleTypeTitle || styleTypeCode}
                        </div>
                        {styleOneLine ? (
                          <div className="mt-1 text-[13px] leading-5 text-slate-500">
                            {styleOneLine}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-3">
                  <div className="text-[13px] font-semibold text-amber-800">
                    프로필 상세열람은 하루 1회만 가능해요
                  </div>
                  <div className="mt-1 text-[13px] text-amber-700">
                    오늘 남은 횟수 {remainingProfileDetailCount}회
                  </div>
                  {!canOpenDetail ? (
                    <div className="mt-1 text-[12px] text-amber-700">
                      오늘은 더 이상 프로필 상세열람이 불가합니다.
                    </div>
                  ) : null}
                </div>

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

                  {!profile ? (
                    <div className="pt-1 text-[13px] leading-5 text-slate-400">
                      일부 프로필 정보는 아직 불러오지 못했어요.
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={canOpenDetail ? onDetail : onClose}
                  disabled={!canOpenDetail}
                  className={
                    canOpenDetail
                      ? "mt-5 h-12 w-full rounded-md bg-[#ff4338] text-[16px] font-semibold text-white"
                      : "mt-5 h-12 w-full rounded-md bg-slate-300 text-[16px] font-semibold text-white"
                  }
                >
                  상세히 보기
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