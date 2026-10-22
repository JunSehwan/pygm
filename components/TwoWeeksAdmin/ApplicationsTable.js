import { StatusBadge } from "./AdminCommon";
import { formatWon, getDepositBalance, getDepositRequiredBalance, getDepositTopUpRequiredAmount } from "../TwoWeeksShared/depositPolicy";
import { TWOWEEKS_MIN_PROFILE_PHOTOS } from "../TwoWeeksShared/profilePhotoPolicy";
import { getSanctionStatusLabel, isMatchingRestricted } from "../TwoWeeksShared/sanctionPolicy";
import {
  cx,
  formatDate,
  formatPhone,
  formatTimeSlots,
  getBasic,
  getGenderLabel,
  formatAgeBirth,
  getIdentity,
  getMatchingAvailabilityBlockReason,
  getMatchingPauseReasonLabel,
  getNoResponseReviewState,
  getMatchingDisplayStatus,
  getStatusLabel,
  getMatchingDisplayTone,
  getPenaltyStats,
  getProfilePhoto,
  getProfilePhotoCount,
  hasLegacyApprovedProfilePhotoException,
  hasPenaltyRecord,
  normalizeArray,
} from "./utils";

const ATTRIBUTION_LABELS = {
  instagram: "INSTAGRAM",
  instagram_facebook: "INSTAGRAM/FB",
  facebook: "FACEBOOK",
  naver_cafe: "NAVER CAFE",
  munto: "MUNTO",
  frip: "FRIP",
  danggeun: "DANGGEUN",
  open_chat: "OPENCHAT",
  offline: "OFFLINE",
  offline_qr: "OFFLINE",
  search: "SEARCH",
  referral: "REFERRAL",
  direct: "DIRECT",
};

function getAttributionLabel(application = {}) {
  const source = String(application?.marketingAttribution?.firstSource || "");
  return ATTRIBUTION_LABELS[source] || (source ? source.toUpperCase() : "기록없음");
}

function MobileApplicationCard({
  item,
  active,
  checked,
  selectable,
  rowSelectable,
  selectionReason,
  onSelect,
  onToggleSelected,
}) {
  const basic = getBasic(item);
  const identity = getIdentity(item);
  const legacyPhotoException = hasLegacyApprovedProfilePhotoException(item);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter") onSelect(item);
      }}
      className={cx(
        "border bg-white p-3 transition active:bg-orange-50",
        active ? "border-zinc-950" : "border-zinc-200"
      )}
    >
      <div className="flex items-start gap-3">
        {selectable ? (
          <div className="pt-1" onClick={(event) => event.stopPropagation()}>
            <input
              type="checkbox"
              checked={checked}
              disabled={!rowSelectable}
              title={selectionReason || ""}
              onChange={(event) => onToggleSelected?.(item.id, event.target.checked)}
              className="h-4 w-4 accent-orange-500 disabled:cursor-not-allowed disabled:opacity-30"
            />
            {!rowSelectable && selectionReason ? (
              <div className="mt-1 max-w-[90px] text-[10px] font-black leading-4 text-rose-500">
                {selectionReason}
              </div>
            ) : null}
          </div>
        ) : null}

        {getProfilePhoto(item) ? (
          <img src={getProfilePhoto(item)} alt="" className="h-14 w-14 shrink-0 object-cover" />
        ) : (
          <div className="h-14 w-14 shrink-0 bg-zinc-100" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="whitespace-nowrap text-base font-black tracking-[-0.03em] text-zinc-950">
                {basic.name || "-"}
              </div>
              <div className="truncate text-xs font-bold text-zinc-500">
                {basic.nickname || item.id}
              </div>
              <div className={`mt-1 text-[10px] font-black ${getProfilePhotoCount(item) >= TWOWEEKS_MIN_PROFILE_PHOTOS ? "text-emerald-600" : legacyPhotoException ? "text-blue-600" : "text-amber-600"}`}>
                사진 {getProfilePhotoCount(item)}장{legacyPhotoException ? " · 기존 승인" : ""}
              </div>
              <div className="mt-1 inline-flex rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-black text-blue-700">
                {getAttributionLabel(item)}
              </div>
            </div>
            <StatusBadge value={item.reviewStatus || "pending"} tone={item.reviewStatus === "approved" ? "good" : "warn"} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-zinc-700">
            <div>
              <div className="text-[11px] font-black text-zinc-400">연락처</div>
              <div className="mt-0.5 leading-5">{formatPhone(basic.phone || basic.phoneNormalized)}</div>
            </div>
            <div>
              <div className="text-[11px] font-black text-zinc-400">성별/나이</div>
              <div className="mt-0.5 leading-5">{getGenderLabel(basic.gender)} / {formatAgeBirth(item)}</div>
            </div>
            <div>
              <div className="text-[11px] font-black text-zinc-400">직업</div>
              <div className="mt-0.5 leading-5">
                {identity.jobCategory || "-"}
                <span className="block truncate text-xs text-zinc-400">{identity.organizationName || "-"}</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] font-black text-zinc-400">상태</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <StatusBadge value={item.deposit?.status === "pending" && item.deposit?.requestStage === "later" ? "추후 안내" : getStatusLabel(item.deposit?.status || "pending")} tone={["confirmed", "waived"].includes(item.deposit?.status) ? "good" : "warn"} />
                {isMatchingRestricted(item) ? <StatusBadge value="노쇼 제재중" tone="bad" /> : null}
                <StatusBadge value={getMatchingDisplayStatus(item)} tone={getMatchingDisplayTone(item)} />
                {getMatchingAvailabilityBlockReason(item) ? (
                  <span className="w-full text-[10px] font-black text-rose-500">
                    {getMatchingAvailabilityBlockReason(item)}
                  </span>
                ) : null}
                {hasPenaltyRecord(item) ? (
                  <StatusBadge
                    value={`${getNoResponseReviewState(item).isCurrentAdminReview ? "검토 필요 · " : "이력 · "}무응답 ${getPenaltyStats(item).totalNoResponseCount}회`}
                    tone={getNoResponseReviewState(item).isCurrentAdminReview ? "bad" : "warn"}
                  />
                ) : null}
              </div>
              <div className="mt-1 text-[11px] font-bold text-zinc-500">
                예치금 {formatWon(getDepositBalance(item.deposit || {}))} / 기준 {formatWon(getDepositRequiredBalance(item.deposit || {}))}
                {item.deposit?.status === "topup_required" ? (
                  <span className="ml-1 text-rose-600">· 추가 {formatWon(getDepositTopUpRequiredAmount(item.deposit || {}))} 필요</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationsTable({
  applications,
  selectedId,
  onSelect,
  selectable = false,
  selectedIds = [],
  selectableIds = null,
  selectionReasons = {},
  onToggleSelected,
  onToggleAll,
}) {
  const selectedSet = new Set(selectedIds);
  const selectableSet = selectableIds ? new Set(selectableIds) : null;
  const eligibleApplications = selectable
    ? applications.filter((item) => !selectableSet || selectableSet.has(item.id))
    : [];
  const allSelected = eligibleApplications.length > 0 && eligibleApplications.every((item) => selectedSet.has(item.id));

  const handleToggleAll = (event) => {
    event.stopPropagation();
    onToggleAll?.(!allSelected);
  };

  return (
    <div className="bg-white">
      <div className="md:hidden">
        {selectable ? (
          <label className="mb-2 flex items-center gap-2 border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-black text-zinc-800">
            <input
              type="checkbox"
              checked={allSelected}
              disabled={!eligibleApplications.length}
              onChange={handleToggleAll}
              className="h-4 w-4 accent-orange-500 disabled:cursor-not-allowed disabled:opacity-30"
            />
            현재 목록 전체 선택
          </label>
        ) : null}

        <div className="grid gap-2">
          {applications.map((item) => (
            <MobileApplicationCard
              key={item.id}
              item={item}
              active={selectedId === item.id}
              checked={selectedSet.has(item.id)}
              selectable={selectable}
              rowSelectable={!selectableSet || selectableSet.has(item.id)}
              selectionReason={selectionReasons?.[item.id] || ""}
              onSelect={onSelect}
              onToggleSelected={onToggleSelected}
            />
          ))}

          {!applications.length ? (
            <div className="border border-zinc-200 bg-white px-4 py-10 text-center text-xs font-bold text-zinc-400">
              표시할 신청자가 없습니다.
            </div>
          ) : null}
        </div>
      </div>

      <div className="hidden overflow-x-auto border border-solid border-zinc-200 bg-white md:block">
        <table className="min-w-[1260px] w-full border-collapse text-left [&_tbody_td]:align-middle">
          <thead className="bg-zinc-950 text-white">
            <tr>
              {selectable ? (
                <th className="w-12 border-solid border-r border-white/10 px-2 py-3 align-middle">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    disabled={!eligibleApplications.length}
                    onChange={handleToggleAll}
                    className="h-4 w-4 accent-orange-500 disabled:cursor-not-allowed disabled:opacity-30"
                  />
                </th>
              ) : null}
              {["신청자", "연락처", "성별/나이", "직업", "지역", "시간", "검토", "예치금", "추가예치", "매칭", "무응답", "신청일"].map((head) => (
                <th
                  key={head}
                  className={cx(
                    "border-r border-white/10 px-3 py-3 align-middle text-xs font-black last:border-r-0",
                    head === "신청자" && "w-[120px] min-w-[120px]"
                  )}
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {applications.map((item) => {
              const basic = getBasic(item);
              const identity = getIdentity(item);
              const active = selectedId === item.id;
              const checked = selectedSet.has(item.id);
              const rowSelectable = !selectableSet || selectableSet.has(item.id);
              const selectionReason = selectionReasons?.[item.id] || "";

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className={cx(
                    "cursor-pointer border-solid border-b border-zinc-100 align-middle transition hover:bg-orange-50",
                    active ? "bg-orange-50" : "bg-white"
                  )}
                >
                  {selectable ? (
                    <td className="px-2 py-3" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!rowSelectable}
                        title={selectionReason}
                        onChange={(event) => onToggleSelected?.(item.id, event.target.checked)}
                        className="h-4 w-4 accent-orange-500 disabled:cursor-not-allowed disabled:opacity-30"
                      />
                      {!rowSelectable && selectionReason ? (
                        <div className="mt-1 whitespace-nowrap text-[9px] font-black text-rose-500">
                          {selectionReason}
                        </div>
                      ) : null}
                    </td>
                  ) : null}
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      {getProfilePhoto(item) ? (
                        <img src={getProfilePhoto(item)} alt="" className="h-10 w-10 object-cover" />
                      ) : (
                        <div className="h-10 w-14 bg-zinc-100" />
                      )}
                      <div>
                        <div className="font-black text-zinc-950">{basic.name || "-"}</div>
                        <div className="text-xs font-semibold text-zinc-500">{basic.nickname || item.id}</div>
                        {/* <div className={`mt-0.5 text-[10px] font-black ${getProfilePhotoCount(item) >= TWOWEEKS_MIN_PROFILE_PHOTOS ? "text-emerald-600" : hasLegacyApprovedProfilePhotoException(item) ? "text-blue-600" : "text-amber-600"}`}>
                          사진 {getProfilePhotoCount(item)}장{hasLegacyApprovedProfilePhotoException(item) ? " · 기존 승인" : ""}
                        </div> */}
                        <div className="mt-1 inline-flex rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-black text-blue-700">
                          {getAttributionLabel(item)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-xs font-bold text-zinc-700">{formatPhone(basic.phone || basic.phoneNormalized)}</td>
                  <td className="px-2 py-3 text-xs font-bold text-zinc-700">
                    {getGenderLabel(basic.gender)} / {formatAgeBirth(item)}
                  </td>
                  <td className="px-2 py-3 text-xs font-bold text-zinc-700">
                    {identity.jobCategory || "-"}
                    <div className="text-xs text-zinc-400">{identity.organizationName || "-"}</div>
                  </td>
                  <td className="px-2 py-3 text-xs font-bold text-zinc-700">{normalizeArray(basic.activityAreas).join(" · ") || "-"}</td>
                  <td className="px-2 py-3 text-xs font-bold text-zinc-700">{formatTimeSlots(basic.availableTimeSlots) || "-"}</td>
                  <td className="px-2 py-3"><StatusBadge value={item.reviewStatus || "pending"} tone={item.reviewStatus === "approved" ? "good" : "warn"} /></td>
                  <td className="px-2 py-3">
                    <StatusBadge value={item.deposit?.status === "pending" && item.deposit?.requestStage === "later" ? "추후 안내" : getStatusLabel(item.deposit?.status || "pending")} tone={["confirmed", "waived"].includes(item.deposit?.status) ? "good" : "warn"} />
                    {isMatchingRestricted(item) ? <div className="mt-1"><StatusBadge value={getSanctionStatusLabel(item)} tone="bad" /></div> : null}
                    <div className="mt-1 whitespace-nowrap text-xs font-bold text-zinc-500">
                      {formatWon(getDepositBalance(item.deposit || {}))} / 기준 {formatWon(getDepositRequiredBalance(item.deposit || {}))}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-xs font-black">
                    {item.deposit?.status === "topup_required" ? (
                      <span className="text-rose-600">{formatWon(getDepositTopUpRequiredAmount(item.deposit || {}))}</span>
                    ) : item.deposit?.status === "refund_requested" ? (
                      <span className="text-amber-600">반환 처리중</span>
                    ) : item.deposit?.status === "refunded" ? (
                      <span className="text-zinc-500">반환 완료</span>
                    ) : ["confirmed", "waived"].includes(item.deposit?.status) ? (
                      <span className="text-emerald-600">없음</span>
                    ) : (
                      <span className="text-zinc-400">최초 예치</span>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <StatusBadge value={getMatchingDisplayStatus(item)} tone={getMatchingDisplayTone(item)} />
                    {getMatchingAvailabilityBlockReason(item) ? (
                      <div className="mt-1 max-w-[130px] break-keep text-[10px] font-black leading-4 text-rose-500">
                        {getMatchingAvailabilityBlockReason(item)}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-2 py-3">
                    {hasPenaltyRecord(item) ? (
                      <div className="grid gap-1 text-xs font-bold text-orange-700">
                        <span>{getNoResponseReviewState(item).isCurrentAdminReview ? "현재 검토 필요" : "과거 이력"} · 총 {getPenaltyStats(item).totalNoResponseCount}회</span>
                        <span className="text-zinc-400">제안 {getPenaltyStats(item).proposalNoResponseCount} · 일정 {getPenaltyStats(item).scheduleNoResponseCount}</span>
                        {getNoResponseReviewState(item).isCurrentlyPaused ? (
                          <span className="max-w-[150px] break-keep text-rose-500">{getMatchingPauseReasonLabel(item)}</span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-zinc-300">-</span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-xs font-bold text-zinc-700">{formatDate(item.submittedAt || item.createdAt || item.completedAtClient)}</td>
                </tr>
              );
            })}
            {!applications.length ? (
              <tr>
                <td colSpan={selectable ? 13 : 12} className="px-4 py-10 text-center text-xs font-bold text-zinc-400">
                  표시할 신청자가 없습니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
