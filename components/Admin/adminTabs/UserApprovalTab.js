import React, { useMemo, useState } from "react";
import { FiSearch, FiCheckCircle, FiUser } from "react-icons/fi";
import {
  formatDateTime,
  formatLocationValue,
  getUserDisplayName,
  getUserGenderLabel,
  getUserMbti,
  getUserPrimaryImage,
  getUserThumbImages,
  isLegacyAutoApprovalCandidate,
  isNewApprovalTarget,
} from "../adminUtils";

export default function UserApprovalTab({
  users = [],
  onApproveUser,
  onBulkApproveLegacyUsers,
  onOpenUserDetail,
  approvingUserId = "",
  bulkApproving = false,
}) {
  const [keyword, setKeyword] = useState("");

  const filteredUsers = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return users;

    return users.filter((user) => {
      const pool = [
        user?.uid,
        user?.id,
        user?.username,
        user?.nickname,
        user?.name,
        user?.email,
        user?.phonenumber,
        user?.phoneNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return pool.includes(q);
    });
  }, [users, keyword]);

  const newTargets = useMemo(
    () => filteredUsers.filter((user) => isNewApprovalTarget(user)),
    [filteredUsers]
  );

  const legacyTargets = useMemo(
    () => filteredUsers.filter((user) => isLegacyAutoApprovalCandidate(user)),
    [filteredUsers]
  );

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600">
            <FiUser className="text-[22px]" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-[24px] font-bold tracking-[-0.02em] text-slate-900">
              회원가입 승인
            </h3>
            <p className="mt-2 break-keep text-[15px] leading-6 text-slate-500">
              신규 심사 대상은 직접 확인하고,
              <br />
              기존 가입자는 일괄 승인 처리할 수 있어요.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="이름, 전화번호, UID 검색"
              className="h-12 w-full rounded-md border border-slate-200 bg-white pl-12 pr-4 text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>

          <button
            type="button"
            onClick={onBulkApproveLegacyUsers}
            disabled={bulkApproving || legacyTargets.length === 0}
            style={{ cursor: bulkApproving || legacyTargets.length === 0 ? "default" : "pointer" }}
            className="flex h-12 items-center justify-center rounded-md bg-slate-700 px-5 text-[15px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            기존 가입자 일괄 승인 ({legacyTargets.length})
          </button>
        </div>
      </div>

      <Section title="신규 심사 대상" count={newTargets.length} tone="violet">
        {newTargets.length === 0 ? (
          <Empty text="현재 신규 심사 대상이 없어요." />
        ) : (
          newTargets.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              approving={approvingUserId === user.id}
              onApprove={() => onApproveUser(user)}
              onDetail={() => onOpenUserDetail?.(user)}
              tone="emerald"
            />
          ))
        )}
      </Section>

      <Section title="기존 가입자 자동 승인 대상" count={legacyTargets.length} tone="slate">
        <p className="mb-4 break-keep text-[14px] leading-6 text-slate-500">
          리모델링 이전 가입자이거나 심사 플로우 도입 전 유저예요.
          <br />
          보통 일괄 승인 버튼으로 처리하면 돼요.
        </p>

        {legacyTargets.length === 0 ? (
          <Empty text="현재 기존 가입자 자동 승인 대상이 없어요." />
        ) : (
          legacyTargets.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              approving={approvingUserId === user.id}
              onApprove={() => onApproveUser(user)}
              onDetail={() => onOpenUserDetail?.(user)}
              tone="slate"
            />
          ))
        )}
      </Section>
    </div>
  );
}

function Section({ title, count, tone, children }) {
  const badgeClass =
    tone === "violet"
      ? "bg-violet-50 text-violet-700"
      : "bg-slate-100 text-slate-700";

  return (
    <section className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center gap-2">
        <FiCheckCircle className={`text-[18px] ${tone === "violet" ? "text-violet-600" : "text-slate-500"}`} />
        <h4 className="text-[18px] font-bold text-slate-900">{title}</h4>
        <span className={`rounded-full px-2 py-1 text-[12px] font-semibold ${badgeClass}`}>
          {count}
        </span>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function UserCard({ user, onApprove, onDetail, approving = false, tone = "emerald" }) {
  const primaryImage = getUserPrimaryImage(user);
  const thumbImages = getUserThumbImages(user);
  const mbti = getUserMbti(user);

  const approveClass =
    tone === "slate"
      ? "bg-slate-700 hover:bg-slate-800"
      : "bg-emerald-600 hover:bg-emerald-700";

  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
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
              <span className="rounded-full bg-violet-50 px-2 py-1 text-[12px] font-semibold text-violet-700">
                {getUserGenderLabel(user)}
              </span>
              {mbti && mbti !== "-" ? (
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[12px] font-semibold text-slate-700">
                  {mbti}
                </span>
              ) : null}
            </div>

            <div className="mt-2 text-[22px] font-bold tracking-[-0.02em] text-slate-900">
              {getUserDisplayName(user)}
            </div>

            <div className="mt-1 break-all text-[14px] leading-6 text-slate-500">
              {user?.email || user?.username || user?.id}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <InfoLine label="거주지" value={formatLocationValue(user?.residence)} />
          <InfoLine label="근무지" value={formatLocationValue(user?.workArea)} />
          <InfoLine label="연락처" value={user?.phonenumber || user?.phoneNumber || "-"} />
          <InfoLine label="가입일" value={formatDateTime(user?.createdAt)} />
          <InfoLine label="사진 수" value={`${thumbImages.length}장`} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onDetail}
            style={{ cursor: "pointer" }}
            className="flex h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-[15px] font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            상세 보기
          </button>

          <button
            type="button"
            onClick={onApprove}
            disabled={approving}
            style={{ cursor: approving ? "default" : "pointer" }}
            className={`flex h-11 items-center justify-center rounded-md px-4 text-[15px] font-semibold text-white transition disabled:opacity-50 ${approveClass}`}
          >
            {approving ? "처리 중..." : "가입 승인"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-md bg-slate-50 px-3 py-3">
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