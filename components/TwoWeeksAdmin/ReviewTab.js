import { useEffect, useMemo, useState } from "react";
import ApplicantModal from "./ApplicantModal";
import ApplicationsTable from "./ApplicationsTable";
import { ActionButton, Section, StatCard } from "./AdminCommon";
import {
  getApplicationCompletionBlockReason,
  isApplicationCompleted,
  isApplicationCompletionEligible,
  isApprovedApplication,
  isIdentityVerifiedApplication,
} from "./utils";

export default function ReviewTab({
  applications,
  selectedApplication,
  setSelectedApplication,
  onUpdate,
  onUpdateAdminMatchingMeta,
  onApproveWithSms,
  onCompleteWithSms,
  onSendIncompleteSms,
  onSendInitialDepositReminder,
  onSendDepositTopUpReminder,
  onConfirmDepositTopUp,
  onCompleteDepositRefund,
  onManageSanction,
  onLoadSanctionHistory,
  onBulkConfirmDeposit,
  onBulkCompleteWithSms,
  busyId,
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const approvedApplications = applications
    .filter(isApprovedApplication)
    .filter((item) => !["refund_requested", "refunded"].includes(String(item?.deposit?.status || "")));
  const identityPending = approvedApplications.filter(
    (item) => !isApplicationCompleted(item) && !isIdentityVerifiedApplication(item)
  );
  const completionEligibleApplications = approvedApplications.filter(isApplicationCompletionEligible);
  const completedApplications = approvedApplications.filter(isApplicationCompleted);
  const completionEligibleIds = useMemo(
    () => completionEligibleApplications.map((item) => item.id),
    [completionEligibleApplications]
  );
  const completionSelectionReasons = useMemo(
    () =>
      approvedApplications.reduce((acc, item) => {
        const reason = getApplicationCompletionBlockReason(item);
        if (reason) acc[item.id] = reason;
        return acc;
      }, {}),
    [approvedApplications]
  );

  const selectedApplications = useMemo(
    () => completionEligibleApplications.filter((item) => selectedIds.includes(item.id)),
    [completionEligibleApplications, selectedIds]
  );

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => completionEligibleIds.includes(id)));
  }, [completionEligibleIds]);

  const handleSelectRow = (application) => {
    setSelectedApplication(application);
    setModalOpen(true);
  };

  const handleToggleSelected = (id, checked) => {
    if (checked && !completionEligibleIds.includes(id)) return;

    setSelectedIds((prev) => {
      if (checked) return Array.from(new Set([...prev, id]));
      return prev.filter((value) => value !== id);
    });
  };

  const handleToggleAll = (checked) => {
    setSelectedIds(checked ? completionEligibleIds : []);
  };

  const handleBulkConfirm = async () => {
    await onBulkConfirmDeposit(selectedApplications);
    setSelectedIds([]);
  };

  const handleBulkComplete = async () => {
    await onBulkCompleteWithSms?.(selectedApplications);
    setSelectedIds([]);
  };

  return (
    <>
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="승인자" value={approvedApplications.length} />
          <StatCard label="본인인증 필요" value={identityPending.length} />
          <StatCard label="신청완료 가능" value={completionEligibleApplications.length} />
          <StatCard label="신청완료" value={completedApplications.length} />
        </div>

        <Section
          title="신청 완료 처리"
          desc="본인인증, 프로필 사진 최소 3장, 운영자 검토가 끝난 신청자만 선택할 수 있습니다. 정책 적용 전에 이미 승인된 1~2장 회원은 예외이며, 신청완료 회원은 다시 문자 발송 대상에 포함되지 않습니다."
          action={
            <div className="flex flex-wrap gap-2">
              <ActionButton
                onClick={handleBulkComplete}
                disabled={!selectedApplications.length || busyId === "bulkComplete"}
                tone="good"
              >
                선택 {selectedApplications.length}명 신청완료+문자
              </ActionButton>
              <ActionButton
                onClick={handleBulkConfirm}
                disabled={!selectedApplications.length || busyId === "bulkDeposit"}
                tone="light"
              >
                수동 입금확인만
              </ActionButton>
            </div>
          }
        >
          <div className="mb-3 border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-800">
            체크박스가 비활성화된 회원은 본인인증·프로필 사진 보완이 필요하거나 이미 신청완료된 회원입니다. 기존 승인 1~2장 회원은 사진 보완 없이 선택할 수 있습니다.
          </div>
          <ApplicationsTable
            applications={approvedApplications}
            selectedId={selectedApplication?.id || ""}
            onSelect={handleSelectRow}
            selectable
            selectedIds={selectedIds}
            selectableIds={completionEligibleIds}
            selectionReasons={completionSelectionReasons}
            onToggleSelected={handleToggleSelected}
            onToggleAll={handleToggleAll}
          />
        </Section>
      </div>

      <ApplicantModal
        open={modalOpen}
        application={selectedApplication}
        onClose={() => setModalOpen(false)}
        onUpdate={onUpdate}
        onUpdateAdminMatchingMeta={onUpdateAdminMatchingMeta}
        onApproveWithSms={onApproveWithSms}
        onCompleteWithSms={onCompleteWithSms}
        onSendIncompleteSms={onSendIncompleteSms}
        onSendInitialDepositReminder={onSendInitialDepositReminder}
        onSendDepositTopUpReminder={onSendDepositTopUpReminder}
        onConfirmDepositTopUp={onConfirmDepositTopUp}
        onCompleteDepositRefund={onCompleteDepositRefund}
        onManageSanction={onManageSanction}
        onLoadSanctionHistory={onLoadSanctionHistory}
        busyId={busyId}
      />
    </>
  );
}
