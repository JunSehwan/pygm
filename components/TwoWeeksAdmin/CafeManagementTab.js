import { useMemo, useState } from "react";
import { ActionButton, Section } from "./AdminCommon";
import { cx } from "./utils";

const AREAS = ["강남구", "서초구", "동작구", "관악구", "영등포구"];

const EMPTY_FORM = {
  id: "",
  area: "강남구",
  name: "",
  station: "",
  reason: "",
  mapQuery: "",
  mapUrl: "",
  status: "active",
  sortOrder: 999,
};

function buildNaverSearchUrl(cafe = {}) {
  const query = cafe.mapQuery || cafe.name || "";
  if (cafe.mapUrl) return cafe.mapUrl;
  if (!query) return "";
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
}

function getStatusLabel(value = "") {
  if (value === "active") return "노출";
  if (value === "paused") return "비활성";
  if (value === "closed") return "폐업/제외";
  return value || "-";
}

function getVerifyLabel(value = "") {
  if (value === "verified") return "영업 확인";
  if (value === "needs_check") return "확인 필요";
  if (value === "not_found") return "검색 안됨";
  return value || "확인 필요";
}

function formatDate(value) {
  if (!value) return "-";
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function CafeForm({ form, setForm, onSubmit, onCancel, busy }) {
  const isEdit = Boolean(form.id);

  return (
    <div className="grid gap-3 border border-zinc-200 bg-zinc-50 p-4">
      <div className="text-sm font-bold text-zinc-950">
        {isEdit ? "카페 후보 수정" : "카페 후보 추가"}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-1 text-xs font-bold text-zinc-500">
          지역
          <select
            value={form.area}
            onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))}
            className="h-10 border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-950"
          >
            {AREAS.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-xs font-bold text-zinc-500">
          카페명
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="h-10 border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-950"
            placeholder="예: 알베르 강남역"
          />
        </label>

        <label className="grid gap-1 text-xs font-bold text-zinc-500">
          역/위치
          <input
            value={form.station}
            onChange={(event) => setForm((prev) => ({ ...prev, station: event.target.value }))}
            className="h-10 border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-950"
            placeholder="예: 강남/신논현"
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_120px]">
        <label className="grid gap-1 text-xs font-bold text-zinc-500">
          네이버 검색어
          <input
            value={form.mapQuery}
            onChange={(event) => setForm((prev) => ({ ...prev, mapQuery: event.target.value }))}
            className="h-10 border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-950"
            placeholder="카페명 + 지역"
          />
        </label>

        <label className="grid gap-1 text-xs font-bold text-zinc-500">
          지도 URL
          <input
            value={form.mapUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, mapUrl: event.target.value }))}
            className="h-10 border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-950"
            placeholder="비워두면 검색 URL 자동 생성"
          />
        </label>

        <label className="grid gap-1 text-xs font-bold text-zinc-500">
          순서
          <input
            type="number"
            value={form.sortOrder}
            onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: Number(event.target.value || 999) }))}
            className="h-10 border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-950"
          />
        </label>
      </div>

      <label className="grid gap-1 text-xs font-bold text-zinc-500">
        선정 이유
        <input
          value={form.reason}
          onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
          className="h-10 border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-950"
          placeholder="예: 위치 찾기 쉬움 · 좌석 안정"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <ActionButton disabled={busy} onClick={onSubmit} tone="dark">
          {isEdit ? "수정 저장" : "추가"}
        </ActionButton>
        {isEdit ? (
          <ActionButton disabled={busy} onClick={onCancel} tone="light">
            취소
          </ActionButton>
        ) : null}
      </div>
    </div>
  );
}

export default function CafeManagementTab({
  cafes = [],
  onSeedDefaultCafes,
  onCreateCafe,
  onUpdateCafe,
  onDeleteCafe,
  onMarkAllNeedCheck,
  busyId,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const busy = Boolean(busyId && String(busyId).startsWith("cafe"));

  const stats = useMemo(() => {
    return {
      total: cafes.length,
      active: cafes.filter((item) => item.status === "active").length,
      needsCheck: cafes.filter((item) => item.verificationStatus !== "verified").length,
    };
  }, [cafes]);

  const grouped = useMemo(() => {
    return AREAS.map((area) => ({
      area,
      rows: cafes.filter((item) => item.area === area),
    }));
  }, [cafes]);

  const submitForm = () => {
    const payload = {
      ...form,
      mapQuery: form.mapQuery || form.name,
      mapUrl: form.mapUrl || "",
    };

    if (form.id) {
      onUpdateCafe?.(form.id, payload);
    } else {
      onCreateCafe?.(payload);
    }

    setForm(EMPTY_FORM);
  };

  return (
    <div className="grid gap-4">
      <Section
        title="카페 후보 관리"
        desc="고객 일정조율 화면에 노출되는 카페 후보를 관리합니다. 영업 여부는 운영자가 네이버지도에서 직접 확인한 뒤 노출 상태를 조정합니다."
        action={
          <div className="flex flex-wrap gap-2">
            <ActionButton disabled={busy} onClick={onSeedDefaultCafes} tone="light">
              기본 후보 불러오기
            </ActionButton>
            <ActionButton disabled={!cafes.length || busy} onClick={onMarkAllNeedCheck} tone="warn">
              전체 확인 필요 표시
            </ActionButton>
          </div>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xs font-bold text-zinc-400">전체 후보</div>
            <div className="mt-1 text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xs font-bold text-zinc-400">고객 노출</div>
            <div className="mt-1 text-2xl font-bold">{stats.active}</div>
          </div>
          <div className="border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xs font-bold text-zinc-400">확인 필요</div>
            <div className="mt-1 text-2xl font-bold">{stats.needsCheck}</div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-800">
          네이버지도 검색 버튼으로 실제 매장이 검색되는지, 폐업/이전 여부가 없는지 확인한 뒤 `영업 확인`을 눌러주세요.
          검색이 안 되거나 불확실하면 `비활성`으로 내려 고객 화면에서 제외하는 방식이 안전합니다.
        </div>

        <div className="mt-4">
          <CafeForm
            form={form}
            setForm={setForm}
            busy={busy}
            onSubmit={submitForm}
            onCancel={() => setForm(EMPTY_FORM)}
          />
        </div>
      </Section>

      {grouped.map(({ area, rows }) => (
        <Section key={area} title={area} desc={`등록 후보 ${rows.length}개`}>
          {rows.length ? (
            <div className="grid gap-3">
              {rows.map((cafe) => {
                const mapUrl = buildNaverSearchUrl(cafe);
                const active = cafe.status === "active";

                return (
                  <div key={cafe.id} className={cx("border p-4", active ? "border-zinc-200 bg-white" : "border-zinc-200 bg-zinc-50 opacity-75")}>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-base font-bold text-zinc-950">{cafe.name}</div>
                          <span className={cx("border px-2 py-1 text-xs font-bold", active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-white text-zinc-500")}>
                            {getStatusLabel(cafe.status)}
                          </span>
                          <span className={cx("border px-2 py-1 text-xs font-bold", cafe.verificationStatus === "verified" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-orange-200 bg-orange-50 text-orange-700")}>
                            {getVerifyLabel(cafe.verificationStatus)}
                          </span>
                        </div>
                        <div className="mt-1 text-sm font-semibold text-zinc-500">
                          {cafe.station || "-"} · {cafe.reason || "-"}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-zinc-400">
                          검색어: {cafe.mapQuery || cafe.name} / 최종확인: {formatDate(cafe.lastVerifiedAtClient)}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {mapUrl ? (
                          <a
                            href={mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-9 items-center border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700"
                          >
                            네이버지도 검색
                          </a>
                        ) : null}
                        <ActionButton
                          disabled={busy}
                          onClick={() =>
                            onUpdateCafe?.(cafe.id, {
                              status: "active",
                              verificationStatus: "verified",
                              lastVerifiedAtClient: new Date().toISOString(),
                            })
                          }
                          tone="good"
                        >
                          영업 확인
                        </ActionButton>
                        <ActionButton
                          disabled={busy}
                          onClick={() =>
                            onUpdateCafe?.(cafe.id, {
                              status: "paused",
                              verificationStatus: "needs_check",
                            })
                          }
                          tone="light"
                        >
                          비활성
                        </ActionButton>
                        <ActionButton
                          disabled={busy}
                          onClick={() => setForm({
                            id: cafe.id,
                            area: cafe.area || "강남구",
                            name: cafe.name || "",
                            station: cafe.station || "",
                            reason: cafe.reason || "",
                            mapQuery: cafe.mapQuery || cafe.name || "",
                            mapUrl: cafe.mapUrl || "",
                            status: cafe.status || "active",
                            sortOrder: Number(cafe.sortOrder || 999),
                          })}
                          tone="light"
                        >
                          수정
                        </ActionButton>
                        <ActionButton
                          disabled={busy}
                          onClick={() => onDeleteCafe?.(cafe.id)}
                          tone="bad"
                        >
                          삭제
                        </ActionButton>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-zinc-50 p-6 text-center text-sm font-bold text-zinc-400">
              등록된 카페 후보가 없습니다.
            </div>
          )}
        </Section>
      ))}
    </div>
  );
}
