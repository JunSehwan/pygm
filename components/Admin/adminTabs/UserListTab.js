import React, { useMemo } from "react";
import { FiSearch, FiUsers, FiEyeOff, FiGift, FiChevronRight } from "react-icons/fi";
import {
  formatDateTime,
  formatLocationValue,
  getUserApprovalState,
  getUserDisplayName,
  getUserGenderLabel,
  getUserMbti,
  getUserPrimaryImage,
  getUserThumbImages,
} from "../adminUtils";

export default function UserListTab({
  users = [],
  keyword = "",
  onKeywordChange,
  onOpenUserDetail,
}) {
  const filteredUsers = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) {
      return [...users].sort((a, b) => {
        const aTime = getSortTime(a);
        const bTime = getSortTime(b);
        return bTime - aTime;
      });
    }

    return [...users]
      .filter((user) => {
        const pool = [
          user?.id,
          user?.uid,
          user?.userId,
          user?.username,
          user?.nickname,
          user?.name,
          user?.email,
          user?.phonenumber,
          user?.phoneNumber,
          user?.company,
          user?.companyName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return pool.includes(q);
      })
      .sort((a, b) => {
        const aTime = getSortTime(a);
        const bTime = getSortTime(b);
        return bTime - aTime;
      });
  }, [users, keyword]);

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-slate-200 bg-white px-2 py-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600">
            <FiUsers className="text-[22px]" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-[24px] font-bold tracking-[-0.02em] text-slate-900">
              전체 회원 관리
            </h3>
            <p className="mt-2 break-keep text-[15px] leading-6 text-slate-500">
              특정 회원의 프로필 노출을 수동으로 막거나 열 수 있고,
              <br />
              스푼 지급도 상세 모달에서 바로 처리할 수 있어요.
            </p>
          </div>
        </div>

        <div className="mt-5 relative">
          <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400" />
          <input
            value={keyword}
            onChange={(e) => onKeywordChange?.(e.target.value)}
            placeholder="이름, 전화번호, 이메일, UID 검색"
            className="h-12 w-full rounded-md border border-slate-200 bg-white pl-12 pr-4 text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white px-2 py-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-[18px] font-bold text-slate-900">회원 리스트</h4>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[12px] font-semibold text-slate-700">
            {filteredUsers.length}명
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {filteredUsers.length === 0 ? (
            <Empty text="검색 조건에 맞는 회원이 없어요." />
          ) : (
            filteredUsers.map((user) => (
              <UserListCard
                key={user.id || user.uid || user.userId}
                user={user}
                onOpenUserDetail={onOpenUserDetail}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function UserListCard({ user, onOpenUserDetail }) {
  const primaryImage = getUserPrimaryImage(user);
  const thumbImages = getUserThumbImages(user);
  const approvalState = getUserApprovalState(user);
  const blocked = user?.adminMatchExposureBlocked === true;
  const mbti = getUserMbti(user);

  return (
    <div className="rounded-md border border-solid border-slate-200 bg-white px-1 py-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-md bg-slate-100">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={getUserDisplayName(user)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[12px] text-slate-400">
                이미지 없음
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <MiniBadge>{getUserGenderLabel(user)}</MiniBadge>

              {mbti && mbti !== "-" ? <MiniBadge tone="slate">{mbti}</MiniBadge> : null}

              <MiniBadge tone={blocked ? "rose" : "emerald"}>
                {blocked ? "노출 금지" : "노출 가능"}
              </MiniBadge>

              <MiniBadge tone={approvalState === "approved" ? "blue" : "violet"}>
                {getApprovalLabel(approvalState)}
              </MiniBadge>
            </div>

            <div className="mt-2 text-[22px] font-bold tracking-[-0.02em] text-slate-900">
              {getUserDisplayName(user)}
            </div>

            <div className="mt-1 break-all text-[14px] leading-6 text-slate-500">
              {user?.email || user?.username || user?.id}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-1">
          <InfoLine label="거주지" value={formatLocationValue(user?.residence)} />
          <InfoLine label="근무지" value={formatLocationValue(user?.workArea)} />
          <InfoLine label="연락처" value={user?.phonenumber || user?.phoneNumber || "-"} />
          <InfoLine label="가입일" value={formatDateTime(user?.createdAt || user?.timestamp)} />
          <InfoLine label="스푼" value={`${Number(user?.spoon || 0)}개`} />
          <InfoLine label="사진 수" value={`${thumbImages.length}장`} />
        </div>

        <div className="grid grid-cols-1 gap-1 sm:grid-cols-1">
          <StatusChip icon={FiEyeOff} text={blocked ? "매칭/노출 차단 중" : "매칭/노출 허용 중"} />
          <StatusChip icon={FiGift} text={`무료 ${Number(user?.spoon_free || 0)} / 유료 ${Number(user?.spoon_paid || 0)}`} />
          <StatusChip icon={FiUsers} text={approvalState === "approved" ? "가입 승인 완료" : getApprovalLabel(approvalState)} />
        </div>

        <button
          type="button"
          onClick={() => onOpenUserDetail?.(user)}
          style={{ cursor: "pointer" }}
          className="flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-[15px] font-semibold text-slate-800 transition hover:bg-slate-50"
        >
          상세 관리
          <FiChevronRight className="text-[16px]" />
        </button>
      </div>
    </div>
  );
}

function getSortTime(user) {
  const value =
    user?.createdAt?.seconds ||
    user?.updatedAt?.seconds ||
    user?.timestamp?.seconds ||
    0;

  if (typeof value === "number" && value > 0) return value * 1000;

  const dateValue =
    user?.createdAt?.toDate?.() ||
    user?.updatedAt?.toDate?.() ||
    user?.timestamp?.toDate?.();

  if (dateValue instanceof Date) return dateValue.getTime();

  return 0;
}

function getApprovalLabel(state) {
  if (state === "approved") return "승인 완료";
  if (state === "pending") return "심사 대기";
  if (state === "legacy") return "기존 가입자";
  return "상태 미확인";
}

function MiniBadge({ children, tone = "violet" }) {
  const toneClass =
    tone === "rose"
      ? "bg-rose-50 text-rose-700"
      : tone === "emerald"
        ? "bg-emerald-50 text-emerald-700"
        : tone === "blue"
          ? "bg-blue-50 text-blue-700"
          : tone === "slate"
            ? "bg-slate-100 text-slate-700"
            : "bg-violet-50 text-violet-700";

  return (
    <span className={`rounded-full px-2 py-1 text-[12px] font-semibold ${toneClass}`}>
      {children}
    </span>
  );
}

function StatusChip({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-1 rounded-md bg-slate-50 px-3 py-3">
      <Icon className="text-[15px] text-slate-500" />
      <div className="min-w-0 break-keep text-[13px] font-medium text-slate-700">
        {text}
      </div>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="flex items-center gap-1 rounded-md bg-slate-50 px-3 py-2">
      <div className="w-[62px] shrink-0 text-[13px] font-semibold text-slate-500">
        {label}
      </div>
      <div className="min-w-0 break-keep text-[14px] leading-6 text-slate-800">
        {value || "-"}
      </div>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-[14px] text-slate-500">
      {text}
    </div>
  );
}