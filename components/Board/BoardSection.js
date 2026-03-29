import React from "react";
import Image from "next/image";
import {
  PiHeartDuotone,
  PiLockKeyDuotone,
  PiPhoneDuotone,
} from "react-icons/pi";

function EmptyIllustration() {
  return (
    <div className="relative mx-auto h-20 w-20">
      <div className="absolute inset-0 rounded-full bg-violet-100" />
      <div className="absolute inset-[12px] flex items-center justify-center rounded-full bg-white shadow-sm">
        <PiHeartDuotone className="text-[28px] text-violet-500" />
      </div>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[16px] border border-slate-200 px-5 py-8 text-center">
      <EmptyIllustration />
      <div className="mt-4 break-keep text-[17px] font-bold tracking-[-0.02em] text-zinc-900">
        {title}
      </div>
      <div className="mt-2 whitespace-pre-line break-keep text-[13px] leading-6 text-slate-500">
        {description}
      </div>
    </div>
  );
}

function ContactStatusChip({ item }) {
  if (item?.sectionType !== "matched") return null;

  if (item?.contactStatus?.visible) {
    return (
      <div className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
        <PiPhoneDuotone className="text-[12px]" />
        {item?.contactStatus?.dDayLabel || "D-7"}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
      <PiLockKeyDuotone className="text-[12px]" />
      비공개
    </div>
  );
}

function normalizeInterestText(user = {}) {
  const hobby = String(user?.hobby || "").trim();
  if (hobby) {
    return hobby.replace(/\|/g, ", ");
  }

  if (Array.isArray(user?.hobbyList) && user.hobbyList.length) {
    return user.hobbyList
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .join(", ");
  }

  if (Array.isArray(user?.interest) && user.interest.length) {
    return user.interest
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .join(", ");
  }

  return "";
}

function getMbti(user = {}) {
  const mbti = String(user?.mbti || "").trim().toUpperCase();
  if (mbti.length === 4) return mbti;

  const legacy = `${user?.mbti_ei || ""}${user?.mbti_sn || ""}${user?.mbti_tf || ""}${user?.mbti_jp || ""}`
    .toUpperCase()
    .trim();

  return legacy.length === 4 ? legacy : "";
}

function getStyleTypeCode(user = {}) {
  const code = String(user?.styleTest?.typeCode || "").trim().toUpperCase();
  return code || "";
}

function getStyleTypeTitle(user = {}) {
  return String(user?.styleTest?.typeTitle || "").trim();
}

function getWorkAreaText(user = {}) {
  const sido =
    user?.workArea?.sido ||
    user?.company_location_sido ||
    "";
  const sigugun =
    user?.workArea?.sigugun ||
    user?.company_location_sigugun ||
    "";

  return [sido, sigugun].filter(Boolean).join(" ");
}

function getResidenceText(user = {}) {
  return [user?.residence?.sido, user?.residence?.sigugun]
    .filter(Boolean)
    .join(" ");
}

function getJobText(user = {}) {
  return String(user?.job || "").trim();
}

function getCardLine1(user = {}) {
  return [getJobText(user), getResidenceText(user),
    //  getWorkAreaText(user)
    ]
    .filter(Boolean)
    .join(" · ");
}

function getCardLine2(user = {}) {
  const interestText = normalizeInterestText(user);
  if (!interestText) return "";

  return interestText;
}

function MetaPill({ children, tone = "slate" }) {
  if (!children) return null;

  const toneClass =
    tone === "violet"
      ? "border-violet-100 bg-violet-50 text-violet-700"
      : "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <div
      className={`inline-flex h-7 items-center rounded-full border px-3 text-[12px] font-semibold ${toneClass}`}
    >
      {children}
    </div>
  );
}

function BoardProfileCard({ item, onClick }) {
  const user = item?.otherUser || {};
  const mbti = getMbti(user);
  const styleCode = getStyleTypeCode(user);
  const styleTitle = getStyleTypeTitle(user);

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className="w-[calc(100vw-56px)] max-w-full shrink-0 text-left"
      style={{ cursor: "pointer" }}
    >
      <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <div className="relative h-[232px] w-full bg-slate-100">
          <Image
            src={item?.image || "/image/logo.png"}
            alt={item?.name || "프로필"}
            fill
            className="object-cover object-center"
            style={{ objectPosition: "center 100%" }}
            unoptimized
          />

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent px-3 pb-3 pt-10">
            <div className="flex justify-end">
              <ContactStatusChip item={item} />
            </div>
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="break-keep text-[21px] font-extrabold tracking-[-0.03em] text-zinc-900">
            {item?.name}
            {item?.ageLabel ? `, ${item.ageLabel}` : ""}
          </div>

          {getCardLine1(user) ? (
            <div className="mt-1 break-keep text-[14px] font-semibold leading-5 text-slate-700">
              {getCardLine1(user)}
            </div>
          ) : null}

          {/* {getCardLine2(user) ? (
            <div className="mt-1 line-clamp-1 break-keep text-[13px] font-medium leading-5 text-slate-500">
              {getCardLine2(user)}
            </div>
          ) : null} */}

          <div className="mt-3 flex flex-wrap gap-2">
            {styleCode || styleTitle ? (
              <MetaPill>
                {styleCode || styleTitle}
              </MetaPill>
            ) : null}

            {mbti ? <MetaPill tone="violet">{mbti}</MetaPill> : null}
          </div>

          {item?.sectionType === "matched" && item?.contactStatus?.visible ? (
            <div className="mt-3 text-[12px] font-medium text-violet-600">
              7일 뒤 연락처는 비공개 처리돼요
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );
}

export default function BoardSection({
  title,
  items = [],
  emptyTitle,
  emptyDescription,
  onOpenItem,
}) {
  return (
    <section>
      <div className="mb-3 px-1 text-[17px] font-extrabold tracking-[-0.03em] text-zinc-900">
        {title}
      </div>

      {items.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-1">
          <div className="flex gap-3">
            {items.map((item) => (
              <BoardProfileCard
                key={item.id}
                item={item}
                onClick={onOpenItem}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}