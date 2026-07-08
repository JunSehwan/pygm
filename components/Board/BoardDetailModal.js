import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  PiArrowLeft,
  PiBriefcaseDuotone,
  PiCheckCircleFill,
  PiCopyDuotone,
  PiInfoDuotone,
  PiPhoneCallDuotone,
  PiWarningCircleDuotone,
} from "react-icons/pi";
import Image from "next/image";
import ImageWithSkeleton from "components/Common/ImageWithSkeleton";
import ArenaBasicInfoList from "components/Arena/Detail/ArenaBasicInfoList";
import ArenaValueModal from "components/Arena/Detail/ArenaValueModal";
import {
  getPhotoList,
  getProfileSummary,
  isCompanyVerified,
  isIdentityVerified,
} from "components/Arena/Detail/arenaDetailUtils";
import { getDisplayName } from "lib/arena";
import { adaptLegacyProfileDoc } from "lib/profileLegacyAdapter";


const STYLE_TYPE_CODE_TO_INDEX = {
  SMRP: 1,
  SMRJ: 2,
  SMFP: 3,
  SMFJ: 4,
  SLRP: 5,
  SLRJ: 6,
  SLFP: 7,
  SLFJ: 8,
  TMRP: 9,
  TMRJ: 10,
  TMFP: 11,
  TMFJ: 12,
  TLRP: 13,
  TLRJ: 14,
  TLFP: 15,
  TLFJ: 16,
};

function getSafeBoardUser(user = {}) {
  if (!user || typeof user !== "object") return {};

  const uid = user?.userID || user?.uid || user?.id || "";
  const adapted = adaptLegacyProfileDoc(user, { uid }, uid);

  return {
    ...user,
    ...adapted,
  };
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") {
    try {
      return value.toDate();
    } catch (error) {
      return null;
    }
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(date) {
  const safeDate = toDate(date);
  if (!safeDate) return "";
  const month = safeDate.getMonth() + 1;
  const day = safeDate.getDate();
  const hour = safeDate.getHours();
  const minute = String(safeDate.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hour}:${minute}`;
}

function stripPhone(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function formatPhoneDisplay(value) {
  const digits = stripPhone(value);

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  return value || "";
}

function getMbti(user = {}) {
  const safeUser = getSafeBoardUser(user);
  const mbti = String(safeUser?.mbti || "").trim().toUpperCase();
  if (mbti.length === 4) return mbti;

  const legacy = `${safeUser?.mbti_ei || ""}${safeUser?.mbti_sn || ""}${safeUser?.mbti_tf || ""}${safeUser?.mbti_jp || ""}`
    .toUpperCase()
    .trim();

  return legacy.length === 4 ? legacy : "";
}

function getStyleCode(user = {}) {
  const safeUser = getSafeBoardUser(user);
  return String(safeUser?.styleTest?.typeCode || "").trim().toUpperCase();
}

function getStyleTitle(user = {}) {
  const safeUser = getSafeBoardUser(user);
  return String(safeUser?.styleTest?.typeTitle || "").trim();
}

function getStyleOneLine(user = {}) {
  const safeUser = getSafeBoardUser(user);
  return String(safeUser?.styleTest?.oneLine || "").trim();
}

function getStyleImage(user = {}) {
  const code = getStyleCode(user);
  const index = STYLE_TYPE_CODE_TO_INDEX[code];
  if (!index) return "";
  return `/image/tests/style/type_${index}.png`;
}

function getResidenceText(user = {}) {
  const safeUser = getSafeBoardUser(user);
  return [safeUser?.residence?.sido, safeUser?.residence?.sigugun]
    .filter(Boolean)
    .join(" ");
}

function getWorkAreaText(user = {}) {
  const safeUser = getSafeBoardUser(user);
  const sido = safeUser?.workArea?.sido || safeUser?.company_location_sido || "";
  const sigugun = safeUser?.workArea?.sigugun || safeUser?.company_location_sigugun || "";

  return [sido, sigugun].filter(Boolean).join(" ");
}

function getEducationText(user = {}) {
  const safeUser = getSafeBoardUser(user);
  const education = String(safeUser?.education || "").trim();
  const schoolName =
    safeUser?.educationPublic === true
      ? String(
        safeUser?.educationSchoolName ||
        safeUser?.schoolName ||
        safeUser?.school ||
        ""
      ).trim()
      : "";

  return [education, schoolName].filter(Boolean).join(" · ");
}

function getJobText(user = {}) {
  const safeUser = getSafeBoardUser(user);
  const job = String(safeUser?.job || "").trim();
  const companyName =
    safeUser?.companyVerified === true && safeUser?.companyNamePublic === true
      ? String(safeUser?.companyName || safeUser?.company || "").trim()
      : String(safeUser?.companyName || safeUser?.company || "").trim();

  return [job, companyName].filter(Boolean).join(" · ");
}

function getSalaryText(user = {}) {
  const safeUser = getSafeBoardUser(user);
  if (safeUser?.salaryPublic !== true) return "";
  return String(safeUser?.salary || "").trim();
}

function getReligionText(user = {}) {
  const safeUser = getSafeBoardUser(user);
  return String(safeUser?.religion || "").trim();
}

function getMaritalStatusText(user = {}) {
  const safeUser = getSafeBoardUser(user);
  return String(safeUser?.maritalStatus || "").trim();
}

function getHeightText(user = {}) {
  const safeUser = getSafeBoardUser(user);
  const h = String(safeUser?.height || "").trim();
  return h ? `${h}cm` : "";
}

function normalizeInterestText(user = {}) {
  const safeUser = getSafeBoardUser(user);
  const hobby = String(safeUser?.hobby || "").trim();
  if (hobby) {
    return hobby.replace(/\|/g, ", ");
  }

  if (Array.isArray(safeUser?.hobbyList) && safeUser.hobbyList.length) {
    return safeUser.hobbyList
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .join(", ");
  }

  if (Array.isArray(safeUser?.interest) && safeUser.interest.length) {
    return safeUser.interest
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .join(", ");
  }

  return "";
}

function VerificationTooltip({ label, tone = "emerald", icon: Icon }) {
  const [open, setOpen] = useState(false);

  const toneClass =
    tone === "sky"
      ? "border-sky-100 bg-sky-50 text-sky-600"
      : "border-emerald-100 bg-emerald-50 text-emerald-600";

  return (
    <div className="relative">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-9 w-9 items-center justify-center rounded-full border shadow-sm ${toneClass}`}
        style={{ cursor: "pointer" }}
      >
        <Icon className="text-[18px]" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            className="absolute right-0 top-11 z-20 whitespace-nowrap rounded-md bg-zinc-900 px-3 py-2 text-[12px] font-semibold text-white shadow-lg"
          >
            {label}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function VerifiedIcons({ user }) {
  const identity = isIdentityVerified(user || {});
  const company = isCompanyVerified(user || {});

  if (!identity && !company) return null;

  return (
    <div className="flex items-center gap-2">
      {identity ? (
        <VerificationTooltip
          label="본인인증 완료"
          tone="emerald"
          icon={PiCheckCircleFill}
        />
      ) : null}

      {company ? (
        <VerificationTooltip
          label="재직인증 완료"
          tone="sky"
          icon={PiBriefcaseDuotone}
        />
      ) : null}
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;

  return (
    <div className="rounded-[12px] bg-slate-50 px-4 py-3">
      <div className="text-[12px] font-semibold text-slate-400">{label}</div>
      <div className="mt-1 break-keep text-[14px] font-semibold leading-5 text-zinc-800">
        {value}
      </div>
    </div>
  );
}

function PhotoViewer({ photoList = [] }) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef(null);

  const safePhotos = photoList.length ? photoList : ["/image/profile/default.png"];

  useEffect(() => {
    setIndex(0);
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [photoList]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const nextIndex = Math.round(
      scrollRef.current.scrollLeft / scrollRef.current.clientWidth
    );
    setIndex(nextIndex);
  };

  const moveTo = (targetIndex) => {
    if (!scrollRef.current) return;

    const safeIndex = Math.max(0, Math.min(targetIndex, safePhotos.length - 1));
    scrollRef.current.scrollTo({
      left: scrollRef.current.clientWidth * safeIndex,
      behavior: "smooth",
    });
    setIndex(safeIndex);
  };

  return (
    <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto"
        style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
      >
        {safePhotos.map((photo, idx) => (
          <div
            key={`board-photo-${idx}`}
            className="relative h-[340px] min-w-full snap-center overflow-hidden bg-slate-100"
          >
            <ImageWithSkeleton
              src={photo}
              alt={`프로필 사진 ${idx + 1}`}
              fill
              className="h-full w-full"
              imageClassName="object-cover"
              fallbackSrc="/image/logo.png"
              unoptimized
              priority={idx === 0}
              sizes="(max-width: 768px) 100vw, 430px"
            />
          </div>
        ))}
      </div>

      {safePhotos.length > 1 ? (
        <>
          <div className="flex items-center justify-center gap-2 px-4 py-3">
            {safePhotos.map((_, idx) => (
              <button
                key={`photo-dot-${idx}`}
                type="button"
                onClick={() => moveTo(idx)}
                className={`h-2.5 w-2.5 rounded-full transition ${idx === index ? "bg-violet-500" : "bg-slate-200"
                  }`}
                style={{ cursor: "pointer" }}
              />
            ))}
          </div>

          <div className="overflow-x-auto px-4 pb-4">
            <div className="flex gap-2">
              {safePhotos.map((photo, idx) => (
                <button
                  key={`photo-thumb-${idx}`}
                  type="button"
                  onClick={() => moveTo(idx)}
                  className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-md border ${idx === index
                    ? "border-violet-400 ring-2 ring-violet-100"
                    : "border-slate-200"
                    }`}
                  style={{ cursor: "pointer" }}
                >
                  <ImageWithSkeleton
                    src={photo}
                    alt={`썸네일 ${idx + 1}`}
                    fill
                    className="h-full w-full"
                    imageClassName="object-cover"
                    fallbackSrc="/image/logo.png"
                    unoptimized
                    sizes="56px"
                  />
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function ActionButton({ children, onClick, strong = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 w-full items-center justify-center rounded-md text-[14px] font-bold transition ${strong
        ? "bg-violet-500 text-white hover:bg-violet-600"
        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
        }`}
      style={{ cursor: "pointer" }}
    >
      {children}
    </button>
  );
}

function StylePreviewModal({ open, user, onClose }) {
  const styleCode = getStyleCode(user || {});
  const styleTitle = getStyleTitle(user || {});
  const styleOneLine = getStyleOneLine(user || {});
  const styleImage = getStyleImage(user || {});
  const mbti = getMbti(user || {});

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 z-[70] bg-black/45"
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.985 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute inset-x-0 bottom-0 z-[80] mx-auto flex h-[76dvh] w-full max-w-[390px] flex-col overflow-hidden rounded-t-[22px] bg-white md:h-[620px] md:max-w-[430px]"
          >
            <header className="shrink-0 border-b border-slate-200 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="text-[18px] font-extrabold tracking-[-0.03em] text-zinc-900">
                  스타일 테스트
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-slate-100"
                  style={{ cursor: "pointer" }}
                >
                  <PiArrowLeft className="text-[20px]" />
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  {styleCode ? (
                    <div className="inline-flex h-8 items-center rounded-full bg-violet-50 px-3 text-[12px] font-semibold text-violet-700">
                      {styleCode}
                    </div>
                  ) : null}

                  {mbti ? (
                    <div className="inline-flex h-8 items-center rounded-full bg-slate-100 px-3 text-[12px] font-semibold text-slate-700">
                      {mbti}
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 text-[24px] font-extrabold tracking-[-0.03em] text-zinc-900">
                  {styleTitle || "스타일 결과 준비 중"}
                </div>

                {styleOneLine ? (
                  <div className="mt-2 break-keep text-[14px] leading-6 text-slate-600">
                    {styleOneLine}
                  </div>
                ) : null}

                {styleImage ? (
                  <div className="relative mt-4 h-[300px] w-full overflow-hidden rounded-[14px] border border-slate-200 bg-white">
                    <Image
                      src={styleImage}
                      alt={styleTitle || "스타일 테스트 이미지"}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="mt-4 rounded-[14px] border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-[13px] leading-6 text-slate-500">
                    스타일 결과 이미지를 아직 찾지 못했어요.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function ContactCard({ item, onOpenGuide }) {
  const contactStatus = item?.contactStatus || {};
  const contactVisible = !!contactStatus?.visible;
  const phoneRaw = stripPhone(contactStatus?.phone || "");
  const phoneDisplay = formatPhoneDisplay(contactStatus?.phone || "");

  const handleCopy = async () => {
    if (!phoneRaw) return;
    try {
      await navigator.clipboard.writeText(phoneRaw);
      alert("연락처를 복사했어요.");
    } catch (error) {
      console.error("[BoardDetailModal] clipboard error:", error);
      alert("복사에 실패했어요.");
    }
  };

  return (
    <div className="mt-4 rounded-[14px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[20px] font-extrabold tracking-[-0.03em] text-zinc-900">
            매칭 성공
          </div>
          <div className="mt-1 text-[12px] font-medium text-slate-500">
            {contactVisible
              ? `${contactStatus?.dDayLabel || "D-7"} · 7일 뒤 연락처는 비공개 처리됩니다`
              : "연락처 공개 기간 종료, 비공개 처리"}
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenGuide}
          className="inline-flex h-10 items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"
          style={{ cursor: "pointer" }}
        >
          <PiInfoDuotone className="text-[12px]" />
          매칭가이드
        </button>
      </div>

      <div className="mt-4 rounded-[14px] bg-violet-50 px-4 py-4">
        {contactVisible ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-violet-500">
                  연락처
                </div>
                <div className="mt-1 break-all text-[24px] font-extrabold tracking-[-0.03em] text-violet-700">
                  {phoneDisplay || "연락처 정보 없음"}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md bg-white px-3 text-[12px] font-semibold text-zinc-700 shadow-sm hover:bg-slate-50"
                style={{ cursor: "pointer" }}
              >
                <PiCopyDuotone className="text-[15px]" />
                복사하기
              </button>
            </div>

            <div className="mt-3 text-[12px] leading-5 text-slate-600">
              서로 동의 후 공개된 연락처예요.
              <br />
              연락 전 가벼운 인사로 시작해 주세요.
            </div>
          </>
        ) : (
          <div className="rounded-[12px] border border-slate-200 bg-white px-4 py-4 text-[13px] leading-6 text-slate-600">
            공개 기간이 지나 연락처가 비공개 처리되었어요.
            <br />
            프로필 정보는 계속 확인할 수 있어요.
          </div>
        )}
      </div>

      <div className="mt-4 rounded-[12px] bg-slate-100 px-4 py-4">
        <div className="text-[12px] leading-6 text-slate-700">
          • 매칭 완료 · 연락처 교환됨
          <br />
          • 공개 시각 :{" "}
          {formatDateTime(
            item?.rawData?.contactSharedAt ||
            item?.rawData?.acceptedAt ||
            item?.rawData?.createdAt
          ) || "-"}
          <br />
          • 연락 전 권장 : 24시간 내 첫 인사
        </div>

        <div className="mt-3 flex items-start gap-2 text-[12px] leading-5 text-slate-500">
          <PiWarningCircleDuotone className="mt-[1px] shrink-0 text-[15px]" />
          <div>
            개인정보는 본인 동의 없이 타인에게 공유하지 마세요.
            무단 공유에 따른 책임은 본인에게 있을 수 있어요.
          </div>
        </div>
      </div>
    </div>
  );
}

function PendingInfoCard({ title }) {
  return (
    <div className="mt-4 rounded-[14px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2 text-[18px] font-extrabold tracking-[-0.03em] text-zinc-900">
        <PiPhoneCallDuotone className="text-[18px] text-slate-400" />
        {title}
      </div>
      <div className="mt-2 break-keep text-[13px] leading-6 text-slate-500">
        아직 매칭이 확정되지 않아
        <br />
        연락처는 공개되지 않은 상태예요.
      </div>
    </div>
  );
}

export default function BoardDetailModal({
  open,
  item,
  viewer,
  onClose,
  onOpenGuide,
  onOpenReport,
}) {
  const [valueOpen, setValueOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);

  const otherUser = getSafeBoardUser(item?.otherUser || {});
  const summary = useMemo(() => getProfileSummary(otherUser), [otherUser]);
  const photoList = useMemo(() => getPhotoList(otherUser), [otherUser]);

  const mbti = getMbti(otherUser);
  const styleCode = getStyleCode(otherUser);
  const styleTitle = getStyleTitle(otherUser);
  const styleOneLine = getStyleOneLine(otherUser);

  useEffect(() => {
    if (!open) {
      setValueOpen(false);
      setStyleOpen(false);
    }
  }, [open]);

  return (
    <>
      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 z-40 bg-black/45"
            />

            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.985 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="absolute inset-x-0 bottom-0 z-50 mx-auto flex h-[92dvh] w-full max-w-[390px] flex-col overflow-hidden rounded-t-[22px] bg-[#f5f6fa] md:h-[720px] md:max-w-[430px]"
            >
              <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[24px] font-extrabold tracking-[-0.03em] text-zinc-900">
                    {item?.sectionType === "matched"
                      ? "매칭된 이성정보"
                      : getDisplayName(otherUser || {}) || "프로필 상세"}
                  </div>

                  <div className="flex items-center gap-2">
                    {item?.sectionType === "matched" ? (
                      <button
                        type="button"
                        onClick={onOpenReport}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-rose-500 hover:bg-rose-50"
                        style={{ cursor: "pointer" }}
                        aria-label="신고하기"
                        title="신고하기"
                      >
                        <PiWarningCircleDuotone className="text-[15px]" />
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-900 hover:bg-slate-100"
                      style={{ cursor: "pointer" }}
                    >
                      <PiArrowLeft className="text-[22px]" />
                    </button>
                  </div>
                </div>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4">
                <PhotoViewer photoList={photoList} />

                <div className="mt-4 rounded-[14px] border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="break-keep text-[26px] font-extrabold tracking-[-0.03em] text-zinc-900">
                        {summary?.name}
                      </div>
                      {summary?.birthYearShort ? (
                        <div className="mt-1 text-[13px] font-semibold text-slate-400">
                          {summary.birthYearShort}년생
                        </div>
                      ) : null}
                    </div>

                    <VerifiedIcons user={otherUser} />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {styleCode ? (
                      <div className="inline-flex h-8 items-center rounded-full bg-slate-100 px-3 text-[12px] font-semibold text-slate-700">
                        {styleCode}
                      </div>
                    ) : null}

                    {mbti ? (
                      <div className="inline-flex h-8 items-center rounded-full bg-violet-50 px-3 text-[12px] font-semibold text-violet-700">
                        {mbti}
                      </div>
                    ) : null}
                  </div>

                  {styleTitle || styleOneLine ? (
                    <div className="mt-3 rounded-[12px] bg-slate-50 px-4 py-3">
                      {styleTitle ? (
                        <div className="text-[14px] font-bold text-zinc-900">
                          {styleTitle}
                        </div>
                      ) : null}
                      {styleOneLine ? (
                        <div className="mt-1 break-keep text-[13px] leading-5 text-slate-600">
                          {styleOneLine}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <InfoRow label="직업" value={getJobText(otherUser)} />
                    <InfoRow label="학력" value={getEducationText(otherUser)} />
                    <InfoRow label="거주지" value={getResidenceText(otherUser)} />
                    <InfoRow label="근무지" value={getWorkAreaText(otherUser)} />
                    <InfoRow label="종교" value={getReligionText(otherUser)} />
                    <InfoRow label="혼인상태" value={getMaritalStatusText(otherUser)} />
                    <InfoRow label="키" value={getHeightText(otherUser)} />
                    <InfoRow label="연봉" value={getSalaryText(otherUser)} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <ActionButton strong onClick={() => setValueOpen(true)}>
                      가치관 분석
                    </ActionButton>
                    <ActionButton onClick={() => setStyleOpen(true)}>
                      스타일 테스트
                    </ActionButton>
                  </div>
                </div>

                <ArenaBasicInfoList user={otherUser} />

                {item?.sectionType === "matched" ? (
                  <ContactCard item={item} onOpenGuide={onOpenGuide} />
                ) : (
                  <PendingInfoCard
                    title={
                      item?.sectionType === "sent"
                        ? "호감 보낸 상태"
                        : "호감 받은 상태"
                    }
                  />
                )}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <ArenaValueModal
        open={valueOpen}
        onClose={() => setValueOpen(false)}
        user={otherUser}
      />

      <StylePreviewModal
        open={styleOpen}
        onClose={() => setStyleOpen(false)}
        user={otherUser}
      />
    </>
  );
}