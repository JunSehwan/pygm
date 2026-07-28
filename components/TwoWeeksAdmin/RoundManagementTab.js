import { useMemo, useState } from "react";
import { ActionButton, FieldRow, Section, StatCard, StatusBadge } from "./AdminCommon";
import { DEFAULT_ROUND_ID, DEFAULT_ROUND_LABEL } from "./constants";
import { formatDate, getRoundId } from "./utils";

const STATUS_OPTIONS = [
  { value: "draft", label: "준비중" },
  { value: "open", label: "모집중" },
  { value: "matching", label: "매칭중" },
  { value: "meeting", label: "만남진행" },
  { value: "closed", label: "마감" },
  { value: "paused", label: "보류" },
];

function countByRound(items = [], roundId = "") {
  return items.filter((item) => getRoundId(item) === roundId || item.roundId === roundId).length;
}

function RoundForm({ onCreateRound, busyId }) {
  const [form, setForm] = useState({
    label: "",
    status: "draft",
    applyOpenAtClient: "",
    applyCloseAtClient: "",
    proposalStartAtClient: "",
    scheduleDueAtClient: "",
    meetingStartAtClient: "",
    meetingEndAtClient: "",
    memo: "",
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    await onCreateRound?.(form);
    setForm((prev) => ({ ...prev, label: "", memo: "" }));
  };

  return (
    <div className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-[1.2fr_160px]">
        <input
          value={form.label}
          onChange={(event) => update("label", event.target.value)}
          placeholder="예: 2026년 8월 1차"
          className="h-11 border border-zinc-200 px-3 text-sm font-bold outline-none focus:border-zinc-950"
        />
        <select
          value={form.status}
          onChange={(event) => update("status", event.target.value)}
          className="h-11 border border-zinc-200 px-3 text-sm font-bold outline-none focus:border-zinc-950"
        >
          {STATUS_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-xs font-bold text-zinc-500">모집 시작
          <input type="datetime-local" value={form.applyOpenAtClient} onChange={(e) => update("applyOpenAtClient", e.target.value)} className="mt-1 h-10 w-full border border-zinc-200 px-2 text-xs font-bold" />
        </label>
        <label className="text-xs font-bold text-zinc-500">모집 마감
          <input type="datetime-local" value={form.applyCloseAtClient} onChange={(e) => update("applyCloseAtClient", e.target.value)} className="mt-1 h-10 w-full border border-zinc-200 px-2 text-xs font-bold" />
        </label>
        <label className="text-xs font-bold text-zinc-500">제안 시작
          <input type="datetime-local" value={form.proposalStartAtClient} onChange={(e) => update("proposalStartAtClient", e.target.value)} className="mt-1 h-10 w-full border border-zinc-200 px-2 text-xs font-bold" />
        </label>
        <label className="text-xs font-bold text-zinc-500">일정조율 마감
          <input type="datetime-local" value={form.scheduleDueAtClient} onChange={(e) => update("scheduleDueAtClient", e.target.value)} className="mt-1 h-10 w-full border border-zinc-200 px-2 text-xs font-bold" />
        </label>
        <label className="text-xs font-bold text-zinc-500">만남 시작
          <input type="datetime-local" value={form.meetingStartAtClient} onChange={(e) => update("meetingStartAtClient", e.target.value)} className="mt-1 h-10 w-full border border-zinc-200 px-2 text-xs font-bold" />
        </label>
        <label className="text-xs font-bold text-zinc-500">만남 종료
          <input type="datetime-local" value={form.meetingEndAtClient} onChange={(e) => update("meetingEndAtClient", e.target.value)} className="mt-1 h-10 w-full border border-zinc-200 px-2 text-xs font-bold" />
        </label>
      </div>

      <textarea
        value={form.memo}
        onChange={(event) => update("memo", event.target.value)}
        rows={3}
        placeholder="운영 메모"
        className="w-full resize-none border border-zinc-200 p-3 text-sm font-semibold outline-none focus:border-zinc-950"
      />

      <div className="flex justify-end">
        <ActionButton disabled={busyId === "createRound" || !form.label.trim()} onClick={submit} tone="dark">
          회차 생성
        </ActionButton>
      </div>
    </div>
  );
}

export default function RoundManagementTab({
  rounds = [],
  applications = [],
  matches = [],
  onSeedDefaultRound,
  onCreateRound,
  onUpdateRound,
  busyId,
}) {
  const fallbackRounds = useMemo(() => {
    const ids = Array.from(new Set(applications.map((item) => getRoundId(item)).filter(Boolean)));
    return ids
      .filter((id) => !rounds.some((round) => round.id === id))
      .map((id) => ({ id, label: id === DEFAULT_ROUND_ID ? DEFAULT_ROUND_LABEL : id, status: "open", virtual: true }));
  }, [applications, rounds]);

  const allRounds = [...rounds, ...fallbackRounds];

  return (
    <div className="grid gap-4">
      <Section
        title="회차 요약"
        desc="모집, 제안, 일정조율, 만남 주간을 회차 단위로 관리합니다."
        action={<ActionButton disabled={busyId === "seedRound"} onClick={onSeedDefaultRound} tone="light">기본 회차 만들기</ActionButton>}
      >
        <div className="grid gap-3 md:grid-cols-4">
          <StatCard label="등록 회차" value={allRounds.length} />
          <StatCard label="모집중" value={allRounds.filter((item) => item.status === "open").length} />
          <StatCard label="매칭중" value={allRounds.filter((item) => item.status === "matching").length} />
          <StatCard label="만남진행" value={allRounds.filter((item) => item.status === "meeting").length} />
        </div>
      </Section>

      <Section title="회차 생성" desc="새로운 운영 회차를 생성합니다.">
        <RoundForm onCreateRound={onCreateRound} busyId={busyId} />
      </Section>

      <Section title="회차 목록" desc="회차별 신청자와 매칭 수를 확인하고 운영 상태를 변경합니다.">
        <div className="grid gap-3">
          {allRounds.map((round) => {
            const applicationCount = countByRound(applications, round.id);
            const matchCount = matches.filter((match) => match.roundId === round.id).length;

            return (
              <div key={round.id} className="border border-zinc-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-lg font-bold text-zinc-950">{round.label || round.id}</div>
                      <StatusBadge value={round.status || "draft"} tone={round.status === "open" || round.status === "meeting" ? "good" : round.status === "closed" ? "default" : "warn"} />
                      {round.virtual ? <span className="border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-bold text-zinc-400">문서 미생성</span> : null}
                    </div>
                    <div className="mt-1 text-xs font-bold text-zinc-400">ID: {round.id}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status.value}
                        type="button"
                        disabled={round.virtual || busyId === `round:${round.id}:${status.value}`}
                        onClick={() => onUpdateRound?.(round.id, { status: status.value })}
                        className="border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 disabled:opacity-40"
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-2 md:grid-cols-3">
                  <div className="border border-zinc-100 bg-zinc-50 p-3 text-sm font-bold text-zinc-700">신청자 {applicationCount}명</div>
                  <div className="border border-zinc-100 bg-zinc-50 p-3 text-sm font-bold text-zinc-700">매칭 {matchCount}건</div>
                  <div className="border border-zinc-100 bg-zinc-50 p-3 text-sm font-bold text-zinc-700">최근 수정 {formatDate(round.updatedAtClient || round.updatedAt || round.createdAtClient)}</div>
                </div>

                <div className="mt-3 border border-zinc-100 px-3">
                  <FieldRow label="모집" value={[round.applyOpenAtClient, round.applyCloseAtClient].filter(Boolean).join(" ~ ") || "-"} />
                  <FieldRow label="제안" value={round.proposalStartAtClient || "-"} />
                  <FieldRow label="일정마감" value={round.scheduleDueAtClient || "-"} />
                  <FieldRow label="만남" value={[round.meetingStartAtClient, round.meetingEndAtClient].filter(Boolean).join(" ~ ") || "-"} />
                  <FieldRow label="메모" value={round.memo || "-"} />
                </div>
              </div>
            );
          })}

          {!allRounds.length ? (
            <div className="bg-white p-8 text-center text-sm font-bold text-zinc-400">아직 등록된 회차가 없습니다.</div>
          ) : null}
        </div>
      </Section>
    </div>
  );
}
