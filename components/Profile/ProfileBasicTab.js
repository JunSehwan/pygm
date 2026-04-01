import ImageWithSkeleton from "components/Common/ImageWithSkeleton";
import React, { useMemo } from "react";
import { FiEdit2, FiInfo, FiLock } from "react-icons/fi";
import { PiCameraDuotone, PiSparkleFill } from "react-icons/pi";

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

const GOD_BADGE_IMAGE = "/image/profile/badge/goldcard.png";
const EXPERT_BADGE_IMAGE = "/image/profile/badge/silvercard.png";
const CAREER_BADGE_IMAGE = "/image/profile/badge/silvercard.png";

function Badge({ label, imageSrc, fallbackIcon = "🏆", dark = false }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full px-2 py-1",
        dark ? "bg-[#3f3f46] text-white shadow" : "bg-yellow-50 text-slate-700 border border-slate-200 shadow"
      )}
    >
      <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white/90">
        {imageSrc ? (
          <img src={imageSrc} alt={label} className="h-7 w-7 object-contain" />
        ) : (
          <span className="text-[14px]">{fallbackIcon}</span>
        )}
      </div>
      <span className="text-[12px] text-yellow-900 font-bold">{label}</span>
    </div>
  );
}

function formatPhoneNumber(value) {
  const digits = String(value || "").replace(/[^0-9]/g, "");

  if (!digits) return "";

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }

  if (digits.length === 10) {
    if (digits.startsWith("02")) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
    }
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  return digits;
}

function getStyleCardData(user) {
  return {
    code: user?.styleTest?.typeCode || "",
    title: user?.styleTest?.typeTitle || "스타일 진단 전",
    oneLine:
      user?.styleTest?.oneLine ||
      "테스트를 완료하면 내 매력 타입과 분위기를 더 구체적으로 확인할 수 있어요.",
  };
}

function InfoCard({ label, value, muted, locked, onClick, helperRight, subText }) {
  const clickable = !locked && typeof onClick === "function";

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={
        clickable
          ? (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick();
            }
          }
          : undefined
      }
      className={cn(
        "w-full rounded-md bg-white px-4 py-3 text-left shadow-[0_1px_6px_rgba(15,23,42,0.04)]",
        clickable ? "cursor-pointer" : "",
        clickable ? "transition active:scale-[0.998]" : ""
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-[#6e7ee8]">{label}</div>
          <div
            className={cn(
              "mt-1 text-[16px] font-medium",
              muted ? "text-slate-400" : "text-slate-700"
            )}
          >
            {value || "미작성"}
          </div>

          {subText ? (
            <div className="mt-1 text-[12px] text-slate-400">{subText}</div>
          ) : null}
        </div>

        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {helperRight || null}
          {locked ? (
            <FiLock className="text-[18px] text-slate-400" />
          ) : (
            <FiEdit2 className="text-[16px] text-[#6e7ee8]" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfileBasicTab({
  user,
  basicFields,
  badgeInfo,
  onOpenField,
  onOpenCompanyModal,
  onOpenPhotoModal,
  onIdentityVerify,
}) {
  const styleCard = useMemo(() => getStyleCardData(user), [user]);

  const badgeNodes = useMemo(() => {
    const arr = [];

    if (user?.identityVerified) {
      arr.push(
        <Badge
          key="identity"
          label="본인인증"
          dark
          fallbackIcon="✓"
        />
      );
    }

    if (badgeInfo?.top1) {
      arr.push(
        <Badge
          key="god"
          label="연애의신"
          imageSrc={GOD_BADGE_IMAGE}
          fallbackIcon="🏆"
        />
      );
    }

    if (badgeInfo?.top5) {
      arr.push(
        <Badge
          key="expert"
          label="연애고수"
          imageSrc={EXPERT_BADGE_IMAGE}
          fallbackIcon="🎖"
        />
      );
    }

    return arr;
  }, [badgeInfo?.top1, badgeInfo?.top5, user?.identityVerified]);

  return (
    <div className="space-y-3 px-3 pb-8 pt-4">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="text-[18px] font-bold text-slate-800">필수정보</div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {badgeNodes}
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[13px] font-bold text-[#6e7ee8]">프로필사진</div>

          <button
            type="button"
            onClick={onOpenPhotoModal}
            className="group inline-flex items-center gap-2 rounded-full border border-violet-200 bg-gradient-to-b from-violet-50 to-indigo-50 px-4 py-2 text-sm font-bold text-violet-700 shadow-[0_8px_20px_rgba(139,92,246,0.14)] transition hover:-translate-y-[1px] hover:border-violet-300 hover:from-violet-100 hover:to-indigo-100 hover:shadow-[0_12px_28px_rgba(139,92,246,0.20)] active:translate-y-0 active:scale-[0.98]"
            style={{ cursor: "pointer" }}
          >
            <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-violet-100">
              <PiCameraDuotone className="text-[14px] text-violet-600" />
              <PiSparkleFill className="absolute -right-0.5 -top-0.5 text-[10px] text-pink-400" />
            </span>

            <span className="tracking-[-0.01em] text-xs">사진수정</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenPhotoModal}
          className="w-full"
        >
          <div className="grid grid-cols-2 gap-2">
            {[0, 1].map((index) => {
              const item = user?.profilePhotos?.[index];
              const url = item?.url || "";
              return (
                <div
                  key={index}
                  className="relative h-[120px] overflow-hidden rounded-md bg-slate-200"
                >
                  {url ? (
                    <ImageWithSkeleton
                      src={url}
                      alt={`프로필 사진 ${index + 1}`}
                      fill
                      className="h-full w-full"
                      imageClassName="object-cover"
                      fallbackSrc="/image/logo.png"
                      unoptimized
                      sizes="(max-width: 768px) 50vw, 220px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <FiInfo className="text-[26px]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2">
            {[2, 3, 4].map((index) => {
              const item = user?.profilePhotos?.[index];
              const url = item?.url || "";
              return (
                <div
                  key={index}
                  className="relative h-[88px] overflow-hidden rounded-md bg-slate-200"
                >
                  {url ? (
                    <ImageWithSkeleton
                      src={url}
                      alt={`프로필 사진 ${index + 1}`}
                      fill
                      className="h-full w-full"
                      imageClassName="object-cover"
                      fallbackSrc="/image/logo.png"
                      unoptimized
                      sizes="120px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <FiInfo className="text-[20px]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </button>
      </div>

      <div className="space-y-3">
        {basicFields.slice(0, 11).map((field) => (
          <InfoCard
            key={field.key}
            label={field.label}
            value={field.key === "phonenumber" ? formatPhoneNumber(field.value) : field.value}
            muted={!field.value}
            locked={field.locked}
            subText={field.subText}
            helperRight={
              field.key === "companyVerified" ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCompanyModal();
                  }}
                  className="rounded-full bg-[#eef2ff] px-3 py-1.5 text-[11px] font-medium text-[#3655ff]"
                >
                  회사인증
                </button>
              ) : field.key === "phonenumber" ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onIdentityVerify();
                  }}
                  className="rounded-full bg-[#eef2ff] px-3 py-1.5 text-[11px] font-medium text-[#3655ff]"
                >
                  연락처 인증
                </button>
              ) : null
            }
            onClick={() => onOpenField(field)}
          />
        ))}
      </div>

      <div className="px-1 pt-2 text-[18px] font-bold text-slate-800">부가정보</div>

      <div className="space-y-3">
        <div className="overflow-hidden rounded-md border border-violet-200 bg-white shadow-[0_1px_6px_rgba(15,23,42,0.04)]">
          <div className="bg-gradient-to-r from-violet-50 via-fuchsia-50 to-pink-50 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-violet-600">
                  스타일 진단
                </div>
                <div className="mt-3 text-[20px] font-black tracking-[-0.03em] text-slate-900">
                  {styleCard.code || "진단 전"}
                </div>
                <div className="mt-1 text-[15px] font-semibold text-slate-700">
                  {styleCard.title}
                </div>
                <p className="mt-2 max-w-[220px] text-[13px] leading-5 text-slate-500">
                  {styleCard.oneLine}
                </p>
              </div>

              <button
                type="button"
                onClick={() => (window.location.href = "/tests/style")}
                className="rounded-full bg-[#6e7ee8] px-3 py-2 text-[12px] font-bold text-white shadow-sm"
              >
                테스트
              </button>
            </div>
          </div>
        </div>

        {basicFields.slice(11).map((field) => (
          <InfoCard
            key={field.key}
            label={field.label}
            value={field.value}
            muted={!field.value}
            locked={field.locked}
            onClick={() => onOpenField(field)}
          />
        ))}
      </div>
    </div>
  );
}