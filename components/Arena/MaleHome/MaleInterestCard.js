import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  PiMapPinDuotone,
  PiClockCountdownDuotone,
  PiHourglassMediumDuotone,
  PiSparkleDuotone,
  PiGraduationCapDuotone,
  PiCheckCircleFill,
  PiBriefcaseDuotone,
} from "react-icons/pi";
import {
  getPhotoList,
  getProfileSummary,
  getAreaLabel,
  getMbtiLabel,
  isIdentityVerified,
  isCompanyVerified,
} from "components/Arena/Detail/arenaDetailUtils";

function getRemainLabel(expiresAt) {
  if (!expiresAt) return "72시간";
  const end =
    typeof expiresAt?.toDate === "function" ? expiresAt.toDate() : new Date(expiresAt);
  const diff = end.getTime() - Date.now();

  if (diff <= 0) return "응답시간 종료";

  const totalMinutes = Math.floor(diff / 1000 / 60);
  const hours = Math.floor(totalMinutes / 60);

  if (hours <= 0) return "1시간 미만 남음";
  return `${hours}시간 남음`;
}

function InfoChip({ icon: Icon, label }) {
  if (!label) return null;

  return (
    <div className="inline-flex h-8 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-[12px] font-semibold text-slate-700">
      <Icon className="text-[13px]" />
      <span className="truncate">{label}</span>
    </div>
  );
}

function VerifyChip({ type }) {
  if (type === "identity") {
    return (
      <div className="inline-flex h-7 items-center gap-1 rounded-full bg-emerald-50 px-2.5 text-[11px] font-semibold text-emerald-700">
        <PiCheckCircleFill className="text-[13px]" />
        본인인증
      </div>
    );
  }

  if (type === "company") {
    return (
      <div className="inline-flex h-7 items-center gap-1 rounded-full bg-sky-50 px-2.5 text-[11px] font-semibold text-sky-700">
        <PiBriefcaseDuotone className="text-[13px]" />
        재직인증
      </div>
    );
  }

  return null;
}

export default function MaleInterestCard({ item, onClick }) {
  const femaleUser = item?.femaleUser || {};
  const summary = getProfileSummary(femaleUser);
  const photoList = getPhotoList(femaleUser);
  const mainPhoto = photoList[0] || "/image/profile/default.png";

  const mbti = getMbtiLabel(femaleUser);
  const homeArea = getAreaLabel(femaleUser, "home");
  const education = summary?.education || femaleUser?.education || "";
  const verifiedIdentity = isIdentityVerified(femaleUser);
  const verifiedCompany = isCompanyVerified(femaleUser);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 10, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="w-full shrink-0 overflow-hidden rounded-[18px] border border-slate-200 bg-white text-left shadow-[0_10px_28px_rgba(15,23,42,0.08)]"
      style={{ cursor: "pointer" }}
    >
      <div className="relative h-[260px] w-full bg-slate-100">
        <Image
          src={mainPhoto}
          alt={summary?.name || "상대 프로필"}
          fill
          className="object-cover object-center"
          style={{ objectPosition: "center 100%" }}
          unoptimized
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 h-[96px] bg-gradient-to-b from-black/28 via-black/10 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[130px] bg-gradient-to-t from-black/60 via-black/15 to-transparent" />

        <div className="absolute right-3 top-3">
          <div className="inline-flex items-center gap-1 rounded-full bg-black/45 px-3 py-1.5 text-[12px] font-bold text-white backdrop-blur">
            <PiClockCountdownDuotone className="text-[14px]" />
            {getRemainLabel(item?.expiresAt)}
          </div>
        </div>

        <div className="absolute bottom-3 left-3 right-3">
          <div className="min-w-0">
            <div className="break-keep text-[24px] font-extrabold tracking-[-0.03em] text-white">
              {summary?.name || "상대 회원"}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-semibold text-white/85">
              {summary?.birthYearShort ? <span>{summary.birthYearShort}년생</span> : null}
              {mbti ? <span>· {mbti}</span> : null}
            </div>

            {summary?.job ? (
              <div className="mt-2 break-keep text-[14px] font-semibold text-white/90">
                {summary.job}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="flex flex-wrap gap-2">
          {mbti ? <InfoChip icon={PiSparkleDuotone} label={mbti} /> : null}
          {homeArea ? <InfoChip icon={PiMapPinDuotone} label={homeArea} /> : null}
          {education ? <InfoChip icon={PiGraduationCapDuotone} label={education} /> : null}
        </div>

        <div className="rounded-[14px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-slate-800">
                주요 정보
              </div>
              <div className="mt-1 break-keep text-[13px] leading-6 text-slate-600">
                눌러서 상세 프로필을 확인하고
                <br />
                72시간 안에 응답할 수 있어요.
              </div>
            </div>

            <div className="shrink-0 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700">
              상세 보기
            </div>
          </div>

          {(verifiedIdentity || verifiedCompany) ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {verifiedIdentity ? <VerifyChip type="identity" /> : null}
              {verifiedCompany ? <VerifyChip type="company" /> : null}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between rounded-[12px] border border-violet-100 bg-violet-50 px-3 py-2.5">
          <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-violet-700">
            <PiHourglassMediumDuotone className="text-[15px]" />
            승낙 대기중
          </div>

          <div className="text-[11px] font-semibold text-slate-500">
            72시간 내 응답 가능
          </div>
        </div>
      </div>
    </motion.button>
  );
}