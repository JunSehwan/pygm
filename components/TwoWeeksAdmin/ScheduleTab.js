import { useMemo, useState } from "react";
import { ActionButton, FieldRow, InfoBox, Section, StatCard, StatusBadge } from "./AdminCommon";
import { formatDate } from "./utils";

function getScheduleStatus(match = {}) {
  return match.scheduleStatus || match?.schedule?.status || match.status || "not_started";
}

function getStatusTone(status = "") {
  if (["confirmed", "schedule_confirmed"].includes(status)) return "good";
  if (["place_pending", "ready", "needs_first_choice", "waiting_counterpart", "needs_final_choice"].includes(status)) return "warn";
  if (["cancelled", "failed", "declined"].includes(status)) return "bad";
  if (["mutualAccepted"].includes(status)) return "good";
  return "default";
}

function getStatusLabel(status = "") {
  const labels = {
    proposed: "후보 응답 대기",
    accepted: "일부 수락",
    declined: "거절 발생",
    mutualAccepted: "양쪽 수락",
    ready: "일정 선택 대기",
    needs_first_choice: "일정 선택 대기",
    waiting_counterpart: "상대 선택 대기",
    needs_final_choice: "상대 선택 대기",
    place_pending: "자동 확정 처리 중",
    confirmed: "확정 완료",
    not_started: "대기",
  };

  return labels[status] || status || "-";
}

function getFinalChoice(match = {}) {
  return match?.schedule?.finalChoice || match?.schedule?.selectedChoice || match?.finalMeeting || {};
}

function formatChoice(choice = {}) {
  return [choice.dateLabel, choice.timeLabel, choice.area].filter(Boolean).join(" · ") || "-";
}

function getDueAt(match = {}) {
  const status = getScheduleStatus(match);
  const schedule = match.schedule || {};

  if (["waiting_counterpart", "needs_final_choice"].includes(status)) {
    return schedule.counterpartDueAtClient || schedule.dueAtClient || "";
  }

  if (status === "place_pending") return schedule.placeConfirmDueAtClient || "";

  return schedule.dueAtClient || schedule.counterpartDueAtClient || match.responseDueAtClient || "";
}

function isExpired(value) {
  if (!value) return false;
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed) && parsed <= Date.now();
}

function canSendReminder(match = {}) {
  const status = getScheduleStatus(match);
  return match.status === "mutualAccepted" || ["ready", "needs_first_choice", "waiting_counterpart", "needs_final_choice"].includes(status);
}

function getMatchName(match = {}) {
  return `${match.maleName || match.maleApplicationId || "남성"} ↔ ${match.femaleName || match.femaleApplicationId || "여성"}`;
}

function PlaceForm({ match, onConfirm, busyId }) {
  const finalChoice = getFinalChoice(match);
  const [form, setForm] = useState({
    placeName: match?.finalMeeting?.placeName || "",
    address: match?.finalMeeting?.address || "",
    mapUrl: match?.finalMeeting?.mapUrl || "",
    memo: match?.finalMeeting?.memo || "각자 음료 주문 후 60분 정도 가볍게 대화해주세요.",
  });

  const disabled = busyId === `confirmSchedule:${match.id}` || !finalChoice?.id || !form.placeName.trim();

  return (
    <div className="grid gap-3 border border-orange-200 bg-orange-50 p-4">
      <div>
        <div className="text-xs font-bold text-orange-700">선택된 일정</div>
        <div className="mt-1 text-base font-bold tracking-[-0.03em] text-zinc-950">
          {formatChoice(finalChoice)}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <input
          value={form.placeName}
          onChange={(event) => setForm((prev) => ({ ...prev, placeName: event.target.value }))}
          placeholder="장소명 예: 강남역 카페 OOO"
          className="h-10 border border-zinc-200 bg-white px-3 text-sm font-bold outline-none focus:border-zinc-950"
        />
        <input
          value={form.address}
          onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
          placeholder="주소"
          className="h-10 border border-zinc-200 bg-white px-3 text-sm font-bold outline-none focus:border-zinc-950"
        />
        <input
          value={form.mapUrl}
          onChange={(event) => setForm((prev) => ({ ...prev, mapUrl: event.target.value }))}
          placeholder="지도 링크"
          className="h-10 border border-zinc-200 bg-white px-3 text-sm font-bold outline-none focus:border-zinc-950 md:col-span-2"
        />
        <textarea
          value={form.memo}
          onChange={(event) => setForm((prev) => ({ ...prev, memo: event.target.value }))}
          placeholder="안내 메모"
          rows={3}
          className="border border-zinc-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-zinc-950 md:col-span-2"
        />
      </div>

      <div className="flex justify-end">
        <ActionButton
          tone="good"
          disabled={disabled}
          onClick={() => onConfirm(match, form)}
        >
          일정·장소 확정 + 사진공개 + 문자
        </ActionButton>
      </div>
    </div>
  );
}

function MatchScheduleCard({ match, onConfirmSchedule, onSendReminder, busyId }) {
  const status = getScheduleStatus(match);
  const finalChoice = getFinalChoice(match);
  const firstChoices = Array.isArray(match?.schedule?.firstChoices) ? match.schedule.firstChoices : [];
  const dueAt = getDueAt(match);
  const expired = isExpired(dueAt);
  const reminderBusy = busyId === `scheduleReminder:${match.id}`;

  return (
    <div className="border border-zinc-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-base font-bold tracking-[-0.035em] text-zinc-950">
            {getMatchName(match)}
          </div>
          <div className="mt-1 text-xs font-bold text-zinc-400">
            {match.roundId || "-"} · 생성 {formatDate(match.createdAt)}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {expired ? <StatusBadge value="기한 초과" tone="bad" /> : null}
          <StatusBadge value={getStatusLabel(status)} tone={getStatusTone(status)} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <InfoBox label="응답 기한" value={match.responseDueAtClient ? formatDate(match.responseDueAtClient) : "2일 내"} />
        <InfoBox label="일정 기한" value={dueAt ? formatDate(dueAt) : "2일 내"} />
        <InfoBox label="사진 공개" value={match.photoRevealStatus === "revealed" ? "공개 완료" : "일정·장소 확정 후"} />
      </div>

      <div className="mt-4 border border-zinc-200 px-4">
        <FieldRow label="남성" value={match.maleName || match.maleApplicationId || "-"} />
        <FieldRow label="여성" value={match.femaleName || match.femaleApplicationId || "-"} />
        <FieldRow label="1차 후보" value={firstChoices.length ? firstChoices.map(formatChoice).join(" / ") : "-"} />
        <FieldRow label="최종 일정" value={formatChoice(finalChoice)} />
        <FieldRow label="확정 장소" value={match?.finalMeeting?.placeName || match?.schedule?.finalMeeting?.placeName || "-"} />
      </div>

      {canSendReminder(match) ? (
        <div className="mt-4 flex justify-end">
          <ActionButton
            tone="default"
            disabled={reminderBusy}
            onClick={() => onSendReminder?.(match)}
          >
            일정 리마인드 문자
          </ActionButton>
        </div>
      ) : null}

      {status === "place_pending" ? (
        <div className="mt-4">
          <PlaceForm match={match} onConfirm={onConfirmSchedule} busyId={busyId} />
        </div>
      ) : null}

      {status === "confirmed" ? (
        <div className="mt-4 border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-800">
          만남의 일시와 장소가 자동 확정되었습니다. 고객 화면에서 사진과 만남 전 한마디 입력 영역이 표시됩니다.
        </div>
      ) : null}
    </div>
  );
}

export default function ScheduleTab({ matches, onConfirmSchedule, onSendReminder, busyId }) {
  const scheduleMatches = useMemo(() => {
    return matches.filter((match) => {
      const status = getScheduleStatus(match);
      return (
        match.status === "mutualAccepted" ||
        match.status === "confirmed" ||
        ["ready", "needs_first_choice", "waiting_counterpart", "needs_final_choice", "place_pending", "confirmed"].includes(status)
      );
    });
  }, [matches]);

  const stats = useMemo(() => {
    const ready = scheduleMatches.filter((item) => ["ready", "needs_first_choice", "mutualAccepted"].includes(getScheduleStatus(item)) || item.status === "mutualAccepted").length;
    const waiting = scheduleMatches.filter((item) => ["waiting_counterpart", "needs_final_choice"].includes(getScheduleStatus(item))).length;
    const placePending = scheduleMatches.filter((item) => getScheduleStatus(item) === "place_pending").length;
    const confirmed = scheduleMatches.filter((item) => getScheduleStatus(item) === "confirmed" || item.status === "confirmed").length;

    return {
      ready,
      waiting,
      placePending,
      confirmed,
    };
  }, [scheduleMatches]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="일정 선택 대기" value={stats.ready} />
        <StatCard label="상대 선택 대기" value={stats.waiting} />
        <StatCard label="자동 확정 처리 중" value={stats.placePending} />
        <StatCard label="확정 완료" value={stats.confirmed} />
      </div>

      <Section
        title="일정관리"
        desc="양쪽 모두 만남 진행 의사를 선택한 매칭의 일시/장소 선택 상태를 관리합니다. 후선택자가 일시와 장소를 선택하면 자동 확정되고 안내 문자가 발송됩니다."
      >
        <div className="mb-4 border border-orange-200 bg-orange-50 p-4 text-sm font-bold leading-6 text-orange-800">
          모든 응답과 일정 선택은 2일 내 진행 기준입니다. 후선택자가 일시 1개와 장소 1개를 선택하면 고객 안내 문자가 자동 발송됩니다.
        </div>

        <div className="grid gap-3">
          {scheduleMatches.map((match) => (
            <MatchScheduleCard
              key={match.id}
              match={match}
              onConfirmSchedule={onConfirmSchedule}
              onSendReminder={onSendReminder}
              busyId={busyId}
            />
          ))}

          {!scheduleMatches.length ? (
            <div className="bg-zinc-50 p-8 text-center text-sm font-bold text-zinc-400">
              아직 일정 조율 단계의 매칭이 없습니다.
            </div>
          ) : null}
        </div>
      </Section>
    </div>
  );
}
