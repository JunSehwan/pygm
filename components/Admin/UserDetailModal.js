import React, { useEffect, useMemo, useState } from "react";
import { FiEyeOff, FiGift, FiUnlock, FiLock } from "react-icons/fi";
import {
  formatDateTime,
  formatLocationValue,
  getBirthdayLabel,
  getEducationLabel,
  getHobbyLabel,
  getReligionLabel,
  getSalaryLabel,
  getStyleTestLabel,
  getUserDisplayName,
  getUserGenderLabel,
  getUserMbti,
  getUserThumbImages,
  isLegacyAutoApprovalCandidate,
  isNewApprovalTarget,
} from "./adminUtils";

const APPROVAL_SPOON_OPTIONS = [0, 3, 5, 8, 10, 20, 30, 50];
const MANUAL_SPOON_OPTIONS = [1, 3, 5, 8, 10, 20, 30, 50, 100];

export default function UserDetailModal({
  open,
  user,
  onClose,
  onApprove,
  approving = false,
  onToggleExposure,
  togglingExposure = false,
  onGrantSpoons,
  grantingSpoons = false,
}) {
  const images = useMemo(() => getUserThumbImages(user), [user]);
  const [rewardValue, setRewardValue] = useState(8);
  const [manualSpoonValue, setManualSpoonValue] = useState(8);

  useEffect(() => {
    if (!open) return;
    setRewardValue(8);
    setManualSpoonValue(8);
  }, [open, user?.id]);

  if (!open || !user) return null;

  const exposureBlocked = user?.adminMatchExposureBlocked === true;

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/45 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-[860px] flex-col overflow-hidden rounded-md bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[24px] font-bold tracking-[-0.02em] text-slate-900">
                {getUserDisplayName(user)}
              </div>
              <div className="mt-1 break-all text-[13px] text-slate-500">
                UID: {user?.id}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{ cursor: "pointer" }}
              className="text-[14px] font-semibold text-slate-500 hover:text-slate-800"
            >
              닫기
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
            <section className="space-y-4">
              <Panel title="프로필 사진">
                {images.length ? (
                  <div className="grid grid-cols-2 gap-2">
                    {images.map((src, index) => (
                      <div
                        key={`${src}-${index}`}
                        className="aspect-[1/1] overflow-hidden rounded-md bg-slate-100"
                      >
                        <img
                          src={src}
                          alt={`${getUserDisplayName(user)}-${index}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyText text="등록된 프로필 사진이 없어요." />
                )}
              </Panel>

              <Panel title="심사 참고">
                <StatusLine
                  label="신규 심사 대상"
                  value={isNewApprovalTarget(user) ? "예" : "아니오"}
                />
                <StatusLine
                  label="기존 자동 승인 대상"
                  value={isLegacyAutoApprovalCandidate(user) ? "예" : "아니오"}
                />
                <StatusLine
                  label="승인 상태"
                  value={
                    user?.signupApproved === true
                      ? "승인 완료"
                      : user?.adminApprovalStatus || user?.pendingStatus || "미승인"
                  }
                />
                <StatusLine
                  label="가입일"
                  value={formatDateTime(user?.createdAt)}
                />
                <StatusLine
                  label="최근 수정"
                  value={formatDateTime(user?.updatedAt)}
                />
              </Panel>

              <Panel title="매칭 / 노출 제어">
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-800">
                    <FiEyeOff className="text-[16px]" />
                    현재 상태
                  </div>
                  <div
                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold ${exposureBlocked
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-700"
                      }`}
                  >
                    {exposureBlocked ? "프로필 노출 금지" : "프로필 노출 가능"}
                  </div>
                  <p className="mt-3 break-keep text-[13px] leading-5 text-slate-500">
                    이 설정은 관리자 기준 수동 제어용이에요.
                    <br />
                    추천/매칭/보드/카드 노출 필터에도 연결돼 있어야 실제로 숨겨집니다.
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => onToggleExposure?.(user, true)}
                    disabled={togglingExposure || exposureBlocked}
                    style={{ cursor: togglingExposure || exposureBlocked ? "default" : "pointer" }}
                    className="flex h-11 items-center justify-center gap-2 rounded-md bg-rose-500 px-4 text-[14px] font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
                  >
                    <FiLock className="text-[15px]" />
                    노출 금지
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleExposure?.(user, false)}
                    disabled={togglingExposure || !exposureBlocked}
                    style={{ cursor: togglingExposure || !exposureBlocked ? "default" : "pointer" }}
                    className="flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-[14px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <FiUnlock className="text-[15px]" />
                    노출 허용
                  </button>
                </div>
              </Panel>
            </section>

            <section className="space-y-4">
              <Panel title="기본 정보">
                <InfoGrid
                  items={[
                    ["이름", getUserDisplayName(user)],
                    ["성별", getUserGenderLabel(user)],
                    ["생년월일", getBirthdayLabel(user)],
                    ["연락처", user?.phonenumber || user?.phoneNumber || "-"],
                    ["이메일", user?.email || "-"],
                    ["MBTI", getUserMbti(user)],
                    ["키", user?.height ? `${user.height}cm` : "-"],
                    ["거주지", formatLocationValue(user?.residence)],
                    ["근무지", formatLocationValue(user?.workArea)],
                  ]}
                />
              </Panel>

              <Panel title="프로필 상세">
                <InfoGrid
                  items={[
                    ["학력", getEducationLabel(user)],
                    ["학교명", user?.educationSchoolName || user?.school || "-"],
                    ["학력 공개", user?.educationPublic === false ? "비공개" : "공개/기본"],
                    ["종교", getReligionLabel(user)],
                    ["결혼 상태", user?.maritalStatus || user?.status || "-"],
                    ["연봉", getSalaryLabel(user)],
                    ["직업", user?.job || user?.occupation || "-"],
                    ["회사명", user?.companyName || user?.company || "-"],
                    ["스타일진단", getStyleTestLabel(user)],
                    ["취미", getHobbyLabel(user)],
                  ]}
                />
              </Panel>

              <Panel title="인증 / 운영 참고">
                <InfoGrid
                  items={[
                    ["총 스푼", `${Number(user?.spoon || 0)}개`],
                    ["유료 스푼", `${Number(user?.spoon_paid || 0)}개`],
                    ["무료 스푼", `${Number(user?.spoon_free || 0)}개`],
                    ["본인인증", user?.verified ? "완료" : "미확인"],
                    ["재직인증", user?.companyVerified ? "완료" : "미확인"],
                    ["회사 이메일", user?.companyEmail || "-"],
                    ["pendingStatus", user?.pendingStatus || "-"],
                    ["adminApprovalStatus", user?.adminApprovalStatus || "-"],
                    ["signupApproved", user?.signupApproved === true ? "true" : "false"],
                  ]}
                />
              </Panel>

              <Panel title="자기소개 / 메모성 확인">
                <LongText value={user?.introduce || user?.intro || user?.aboutMe || "-"} />
              </Panel>

              {onApprove ? (
                <Panel title="가입 승인 이벤트 스푼">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-violet-700">
                    <FiGift className="text-[15px]" />
                    승인과 함께 지급할 스푼을 선택하세요
                  </div>

                  <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                    <select
                      value={rewardValue}
                      onChange={(e) => setRewardValue(Number(e.target.value))}
                      className="h-11 rounded-md border border-violet-200 bg-white px-3 text-[14px] text-slate-900 outline-none"
                    >
                      {APPROVAL_SPOON_OPTIONS.map((value) => (
                        <option key={value} value={value}>
                          {value === 0 ? "지급 안 함" : `${value}개 지급`}
                        </option>
                      ))}
                    </select>

                    <div className="flex h-11 items-center rounded-md bg-slate-50 px-3 text-[13px] font-semibold text-slate-700">
                      {rewardValue > 0 ? `+${rewardValue}` : "0"}
                    </div>
                  </div>
                </Panel>
              ) : null}

              <Panel title="수동 스푼 지급">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-violet-700">
                  <FiGift className="text-[15px]" />
                  기존 가입자 보정 / 운영 보상용 스푼 지급
                </div>

                <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                  <select
                    value={manualSpoonValue}
                    onChange={(e) => setManualSpoonValue(Number(e.target.value))}
                    className="h-11 rounded-md border border-violet-200 bg-white px-3 text-[14px] text-slate-900 outline-none"
                  >
                    {MANUAL_SPOON_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {`${value}개 지급`}
                      </option>
                    ))}
                  </select>

                  <div className="flex h-11 items-center rounded-md bg-slate-50 px-3 text-[13px] font-semibold text-slate-700">
                    +{manualSpoonValue}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onGrantSpoons?.(user, manualSpoonValue)}
                  disabled={grantingSpoons}
                  style={{ cursor: grantingSpoons ? "default" : "pointer" }}
                  className="mt-3 flex h-11 w-full items-center justify-center rounded-md bg-violet-600 px-4 text-[14px] font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                >
                  {grantingSpoons ? "지급 중..." : `스푼 ${manualSpoonValue}개 지급`}
                </button>
              </Panel>
            </section>
          </div>
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {onApprove ? (
              <button
                type="button"
                onClick={() => onApprove(rewardValue)}
                disabled={approving}
                style={{ cursor: approving ? "default" : "pointer" }}
                className="flex h-11 items-center justify-center rounded-md bg-emerald-600 px-5 text-[15px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {approving
                  ? "처리 중..."
                  : rewardValue > 0
                    ? `가입 승인 + ${rewardValue}개`
                    : "가입 승인"}
              </button>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              style={{ cursor: "pointer" }}
              className="flex h-11 items-center justify-center rounded-md bg-transparent px-5 text-[14px] font-semibold text-slate-500 transition hover:text-slate-800"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3 text-[16px] font-bold text-slate-900">
        {title}
      </div>
      <div className="px-2 py-4">{children}</div>
    </div>
  );
}

function InfoGrid({ items = [] }) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {items.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-1 rounded-md bg-slate-50 px-3 py-3">
          <div className="text-[12px] font-semibold text-slate-500">{label}</div>
          <div className="break-keep text-[14px] leading-6 text-slate-800">
            {value || "-"}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusLine({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-3">
      <div className="text-[13px] font-semibold text-slate-500">{label}</div>
      <div className="text-[13px] font-semibold text-slate-800">{value || "-"}</div>
    </div>
  );
}

function LongText({ value }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-3 text-[14px] leading-7 text-slate-800">
      {value || "-"}
    </div>
  );
}

function EmptyText({ text }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-4 text-[14px] text-slate-500">
      {text}
    </div>
  );
}