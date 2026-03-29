import React from "react";
import { PiWarningCircleDuotone } from "react-icons/pi";
import { ActionButton, EmptyBlock, MiniBadge, OutlineButton, SectionCard } from "../AdminCommon";
import { formatDateTime } from "../adminUtils";

function ReportCard({ item, onAction, busyKey }) {
  const reviewing = busyKey === `${item.id}:review`;
  const warning = busyKey === `${item.id}:warn`;
  const suspending = busyKey === `${item.id}:suspend`;
  const dismissing = busyKey === `${item.id}:dismiss`;

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <MiniBadge tone="rose">신고</MiniBadge>
        <MiniBadge tone="violet">{item.sourceType === "card_answer" ? "차밍카드 답변" : "아레나"}</MiniBadge>
        <MiniBadge>{item.reasonTitle || item.reasonLabel || "-"}</MiniBadge>
        <MiniBadge>{item.status || "submitted"}</MiniBadge>
      </div>

      <div className="mt-2 text-[14px] font-bold text-slate-900">
        대상: {item.targetName || item.reportedAnswerUsername || item.targetUid || "-"}
      </div>

      <div className="mt-2 rounded-md bg-slate-50 px-3 py-3 text-[12px] leading-5 text-slate-600">
        신고자: {item.reporterName || item.ownerUid || "-"}
        <br />
        대상 UID: {item.targetUid || item.reportedAnswererUid || item.answererUid || "-"}
        <br />
        상세 사유: {item.details || item.reasonDescription || item.reportReasonDetail || "-"}
      </div>

      <div className="mt-2 text-[11px] text-slate-400">접수일: {formatDateTime(item.createdAt || item.updatedAt)}</div>

      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <OutlineButton onClick={() => onAction(item, "review")} disabled={reviewing}>
          {reviewing ? "검토 중..." : "검토 완료"}
        </OutlineButton>
        <ActionButton onClick={() => onAction(item, "warn")} tone="slate" disabled={warning}>
          {warning ? "처리 중..." : "경고"}
        </ActionButton>
        <ActionButton onClick={() => onAction(item, "suspend")} tone="rose" disabled={suspending}>
          {suspending ? "처리 중..." : "제재"}
        </ActionButton>
        <OutlineButton onClick={() => onAction(item, "dismiss")} disabled={dismissing}>
          {dismissing ? "처리 중..." : "기각"}
        </OutlineButton>
      </div>
    </div>
  );
}

export default function ReportReviewTab({ reports, onAction, busyReportKey }) {
  return (
    <div className="space-y-4">
      <SectionCard
        icon={PiWarningCircleDuotone}
        title="신고 검토"
        description="현재는 신고 접수 상태를 검토하고, 경고 또는 제재를 수동으로 적용하는 구조예요."
      >
        {reports.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {reports.map((item) => (
              <ReportCard
                key={`${item.sourceType}-${item.id}`}
                item={item}
                onAction={onAction}
                busyKey={busyReportKey}
              />
            ))}
          </div>
        ) : (
          <EmptyBlock text="현재 검토할 신고 내역이 없어요." />
        )}
      </SectionCard>
    </div>
  );
}
