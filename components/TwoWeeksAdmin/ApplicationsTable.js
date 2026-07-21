import { StatusBadge } from "./AdminCommon";
import {
  cx,
  formatDate,
  formatPhone,
  getBasic,
  getGenderLabel,
  formatAgeBirth,
  getIdentity,
  getMatchingDisplayStatus,
  getMatchingDisplayTone,
  getProfilePhoto,
  normalizeArray,
} from "./utils";

function MobileApplicationCard({
  item,
  active,
  checked,
  selectable,
  onSelect,
  onToggleSelected,
}) {
  const basic = getBasic(item);
  const identity = getIdentity(item);

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
              onChange={(event) => onToggleSelected?.(item.id, event.target.checked)}
              className="h-4 w-4 accent-orange-500"
            />
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
              <div className="truncate text-base font-black tracking-[-0.03em] text-zinc-950">
                {basic.name || "-"}
              </div>
              <div className="truncate text-xs font-bold text-zinc-500">
                {basic.nickname || item.id}
              </div>
            </div>
            <StatusBadge value={item.reviewStatus || "pending"} tone={item.reviewStatus === "approved" ? "good" : "warn"} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-bold text-zinc-700">
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
                <StatusBadge value={item.deposit?.status || "pending"} tone={item.deposit?.status === "confirmed" ? "good" : "warn"} />
                <StatusBadge value={getMatchingDisplayStatus(item)} tone={getMatchingDisplayTone(item)} />
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
  onToggleSelected,
  onToggleAll,
}) {
  const selectedSet = new Set(selectedIds);
  const allSelected = applications.length > 0 && applications.every((item) => selectedSet.has(item.id));

  const handleToggleAll = (event) => {
    event.stopPropagation();
    onToggleAll?.(!allSelected);
  };

  return (
    <div className="bg-white">
      <div className="md:hidden">
        {selectable ? (
          <label className="mb-2 flex items-center gap-2 border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-black text-zinc-800">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={handleToggleAll}
              className="h-4 w-4 accent-orange-500"
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
              onSelect={onSelect}
              onToggleSelected={onToggleSelected}
            />
          ))}

          {!applications.length ? (
            <div className="border border-zinc-200 bg-white px-4 py-10 text-center text-sm font-bold text-zinc-400">
              표시할 신청자가 없습니다.
            </div>
          ) : null}
        </div>
      </div>

      <div className="hidden overflow-x-auto border border-zinc-200 bg-white md:block">
        <table className="min-w-[1160px] w-full border-collapse text-left">
          <thead className="bg-zinc-950 text-white">
            <tr>
              {selectable ? (
                <th className="w-12 border-r border-white/10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleToggleAll}
                    className="h-4 w-4 accent-orange-500"
                  />
                </th>
              ) : null}
              {["신청자", "연락처", "성별/나이", "직업", "지역", "시간", "검토", "입금", "매칭", "신청일"].map((head) => (
                <th key={head} className="border-r border-white/10 px-3 py-3 text-xs font-black last:border-r-0">
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

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className={cx(
                    "cursor-pointer border-b border-zinc-100 transition hover:bg-orange-50",
                    active ? "bg-orange-50" : "bg-white"
                  )}
                >
                  {selectable ? (
                    <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => onToggleSelected?.(item.id, event.target.checked)}
                        className="h-4 w-4 accent-orange-500"
                      />
                    </td>
                  ) : null}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      {getProfilePhoto(item) ? (
                        <img src={getProfilePhoto(item)} alt="" className="h-10 w-10 object-cover" />
                      ) : (
                        <div className="h-10 w-10 bg-zinc-100" />
                      )}
                      <div>
                        <div className="font-black text-zinc-950">{basic.name || "-"}</div>
                        <div className="text-xs font-semibold text-zinc-500">{basic.nickname || item.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm font-bold text-zinc-700">{formatPhone(basic.phone || basic.phoneNormalized)}</td>
                  <td className="px-3 py-3 text-sm font-bold text-zinc-700">
                    {getGenderLabel(basic.gender)} / {formatAgeBirth(item)}
                  </td>
                  <td className="px-3 py-3 text-sm font-bold text-zinc-700">
                    {identity.jobCategory || "-"}
                    <div className="text-xs text-zinc-400">{identity.organizationName || "-"}</div>
                  </td>
                  <td className="px-3 py-3 text-sm font-bold text-zinc-700">{normalizeArray(basic.activityAreas).join(" · ") || "-"}</td>
                  <td className="px-3 py-3 text-sm font-bold text-zinc-700">{normalizeArray(basic.availableTimeSlots).join(" · ") || "-"}</td>
                  <td className="px-3 py-3"><StatusBadge value={item.reviewStatus || "pending"} tone={item.reviewStatus === "approved" ? "good" : "warn"} /></td>
                  <td className="px-3 py-3"><StatusBadge value={item.deposit?.status || "pending"} tone={item.deposit?.status === "confirmed" ? "good" : "warn"} /></td>
                  <td className="px-3 py-3"><StatusBadge value={getMatchingDisplayStatus(item)} tone={getMatchingDisplayTone(item)} /></td>
                  <td className="px-3 py-3 text-sm font-bold text-zinc-700">{formatDate(item.submittedAt || item.createdAt || item.completedAtClient)}</td>
                </tr>
              );
            })}
            {!applications.length ? (
              <tr>
                <td colSpan={selectable ? 11 : 10} className="px-4 py-10 text-center text-sm font-bold text-zinc-400">
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
