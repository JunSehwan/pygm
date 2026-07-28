import { useState } from "react";
import { deleteField, serverTimestamp } from "firebase/firestore";
import { ActionButton, FieldRow, Section } from "./AdminCommon";
import {
  formatBirthYear,
  formatDate,
  formatPhone,
  getBasic,
  getGenderLabel,
  getIdentity,
  getPenaltyReasonLabel,
  getPenaltyStats,
  getPenaltySummaryText,
  getPenaltyTone,
  getProfilePhoto,
  hasPenaltyRecord,
  normalizeArray,
} from "./utils";

const NEXT_ROUND_READY_PATCH = {
  matchingStatus: "not_started",
  nextRoundStatus: "ready",
  scheduleStatus: "not_started",
  meetingStatus: "not_started",
  photoRevealStatus: "hidden",
  currentProposal: deleteField(),
  schedule: deleteField(),
  "penaltyStats.reviewStatus": "cleared",
  "penaltyStats.clearedAt": serverTimestamp(),
  updatedAt: serverTimestamp(),
};

export default function ApplicantDetail({
  application,
  onUpdate,
  onApproveWithSms,
  onSendIncompleteSms,
  busyId,
}) {
  const [reasonText, setReasonText] = useState("프로필 사진, 직업/회사 정보, 인증자료를 다시 확인해주세요.");

  if (!application) {
    return (
      <div className="border border-zinc-200 bg-white p-6 text-center text-sm font-bold text-zinc-400">
        신청자를 선택하면 상세 정보가 표시됩니다.
      </div>
    );
  }

  const basic = getBasic(application);
  const identity = getIdentity(application);
  const busy = busyId === application.id;
  const photo = getProfilePhoto(application);
  const penaltyStats = getPenaltyStats(application);
  const hasPenalty = hasPenaltyRecord(application);

  return (
    <div className="grid gap-4">
      <Section
        title="선택 신청자 상세"
        desc={`${basic.name || "-"} · ${basic.nickname || "-"} · ${getGenderLabel(basic.gender)}`}
      >
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <div>
            {photo ? (
              <img src={photo} alt="" className="aspect-[4/5] w-full border border-zinc-200 object-cover" />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center border border-zinc-200 bg-zinc-50 text-sm font-bold text-zinc-400">
                사진 없음
              </div>
            )}
            {identity.verificationDocument?.url ? (
              <a
                href={identity.verificationDocument.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block border border-zinc-200 bg-white px-3 py-2 text-center text-xs font-black text-zinc-700 hover:border-zinc-950"
              >
                인증자료 보기
              </a>
            ) : null}
          </div>

          <div className="border border-zinc-200 px-4">
            <FieldRow label="이름" value={basic.name} />
            <FieldRow label="닉네임" value={basic.nickname} />
            <FieldRow label="출생" value={`${formatBirthYear(basic.birthYear)} / ${basic.age || "-"}세`} />
            <FieldRow label="성별" value={getGenderLabel(basic.gender)} />
            <FieldRow label="연락처" value={formatPhone(basic.phone || basic.phoneNormalized)} />
            <FieldRow label="직업" value={`${identity.jobCategory || "-"} · ${identity.organizationName || "-"}`} />
            <FieldRow label="지역" value={normalizeArray(basic.activityAreas).join(" · ")} />
            <FieldRow label="선호지역" value={basic.preferredArea} />
            <FieldRow label="가능시간" value={normalizeArray(basic.availableTimeSlots).join(" · ")} />
            <FieldRow label="키" value={basic.height ? `${basic.height}cm` : "-"} />
            <FieldRow label="소개" value={basic.introduction} />
            <FieldRow label="더미" value={application.isDummy ? "더미 신청자" : "-"} />
          </div>
        </div>
      </Section>

      <Section
        title="무응답/기한초과 기록"
        desc="제안 응답 또는 일정조율 기한을 넘긴 기록입니다."
      >
        <div className="grid gap-3 md:grid-cols-4">
          <div className="border border-zinc-200 p-3">
            <div className="text-xs font-bold text-zinc-400">총 무응답</div>
            <div className={`mt-1 text-2xl font-bold ${getPenaltyTone(application) === "bad" ? "text-rose-600" : hasPenalty ? "text-orange-600" : "text-emerald-600"}`}>
              {penaltyStats.totalNoResponseCount}
            </div>
          </div>
          <div className="border border-zinc-200 p-3">
            <div className="text-xs font-bold text-zinc-400">제안</div>
            <div className="mt-1 text-2xl font-bold text-zinc-950">{penaltyStats.proposalNoResponseCount}</div>
          </div>
          <div className="border border-zinc-200 p-3">
            <div className="text-xs font-bold text-zinc-400">일정</div>
            <div className="mt-1 text-2xl font-bold text-zinc-950">{penaltyStats.scheduleNoResponseCount}</div>
          </div>
          <div className="border border-zinc-200 p-3">
            <div className="text-xs font-bold text-zinc-400">검토</div>
            <div className="mt-1 text-sm font-bold text-zinc-800">
              {application.nextRoundStatus === "admin_review" ? "관리자 검토 필요" : penaltyStats.reviewStatus || "-"}
            </div>
          </div>
        </div>

        <div className="mt-3 border border-zinc-200 px-4">
          <FieldRow label="요약" value={getPenaltySummaryText(application)} />
          <FieldRow label="마지막 사유" value={getPenaltyReasonLabel(penaltyStats.lastPenaltyReason)} />
          <FieldRow label="마지막 기록" value={penaltyStats.lastPenaltyAtClient ? formatDate(penaltyStats.lastPenaltyAtClient) : "-"} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <ActionButton disabled={busy} onClick={() => onUpdate(application.id, NEXT_ROUND_READY_PATCH)} tone="good">
            검토 후 매칭풀 복귀
          </ActionButton>
          <ActionButton
            disabled={busy}
            onClick={() => onUpdate(application.id, {
              matchingStatus: "paused",
              nextRoundStatus: "admin_review",
              "penaltyStats.reviewStatus": "admin_review",
              updatedAt: serverTimestamp(),
            })}
            tone="warn"
          >
            검토 유지
          </ActionButton>
        </div>
      </Section>

      <Section title="문자/승인 처리" desc="승인 문자 또는 정보 보완 문자를 보냅니다.">
        <div className="grid gap-3 lg:grid-cols-[1fr_1.3fr]">
          <div className="border border-zinc-200 p-3">
            <div className="mb-3 text-xs font-black text-zinc-400">회원 승인</div>
            <ActionButton
              disabled={busy}
              onClick={() => onApproveWithSms(application)}
              tone="good"
            >
              승인 + 문자 발송
            </ActionButton>
          </div>

          <div className="border border-zinc-200 p-3">
            <div className="mb-3 text-xs font-black text-zinc-400">정보 업로드 부족</div>
            <textarea
              value={reasonText}
              onChange={(event) => setReasonText(event.target.value)}
              rows={3}
              className="w-full resize-none border border-zinc-200 bg-white p-3 text-sm font-semibold leading-6 text-zinc-800 outline-none focus:border-zinc-950"
            />
            <div className="mt-2 flex justify-end">
              <ActionButton
                disabled={busy}
                onClick={() => onSendIncompleteSms(application, reasonText)}
                tone="warn"
              >
                보완 문자 발송
              </ActionButton>
            </div>
          </div>
        </div>
      </Section>

      <Section title="운영 상태 변경" desc="검토, 입금, 매칭 상태를 수동으로 변경합니다.">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="border border-zinc-200 p-3">
            <div className="mb-3 text-xs font-black text-zinc-400">검토 상태</div>
            <div className="flex flex-wrap gap-2">
              <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { reviewStatus: "reviewing", updatedAt: serverTimestamp() })} tone="light">검토중</ActionButton>
              <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { reviewStatus: "approved", status: "approved", updatedAt: serverTimestamp() })} tone="good">승인</ActionButton>
              <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { reviewStatus: "waitlisted", updatedAt: serverTimestamp() })} tone="warn">대기풀</ActionButton>
              <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { reviewStatus: "rejected", status: "rejected", updatedAt: serverTimestamp() })} tone="bad">반려</ActionButton>
            </div>
          </div>

          <div className="border border-zinc-200 p-3">
            <div className="mb-3 text-xs font-black text-zinc-400">입금 상태</div>
            <div className="flex flex-wrap gap-2">
              <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { "deposit.status": "pending", updatedAt: serverTimestamp() })} tone="light">대기</ActionButton>
              <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { "deposit.status": "confirmed", "deposit.confirmedAt": serverTimestamp(), updatedAt: serverTimestamp() })} tone="good">확인</ActionButton>
              <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { "deposit.status": "refunded", updatedAt: serverTimestamp() })} tone="bad">환불</ActionButton>
            </div>
          </div>

          <div className="border border-zinc-200 p-3">
            <div className="mb-3 text-xs font-black text-zinc-400">매칭 상태</div>
            <div className="flex flex-wrap gap-2">
              <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { matchingStatus: "not_started", updatedAt: serverTimestamp() })} tone="light">대기</ActionButton>
              <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { matchingStatus: "proposed", updatedAt: serverTimestamp() })} tone="warn">제안</ActionButton>
              <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { matchingStatus: "confirmed", updatedAt: serverTimestamp() })} tone="good">확정</ActionButton>
              <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { matchingStatus: "completed", updatedAt: serverTimestamp() })} tone="dark">완료</ActionButton>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
