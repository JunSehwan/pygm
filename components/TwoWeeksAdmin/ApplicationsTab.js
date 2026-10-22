import { useMemo, useState } from "react";
import ApplicantModal from "./ApplicantModal";
import ApplicationsTable from "./ApplicationsTable";
import { ActionButton, Section } from "./AdminCommon";

export default function ApplicationsTab({
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
  onBulkApproveWithSms,
  onBulkApproveWithoutSms,
  onBulkCompleteWithSms,
  onBulkCompleteWithoutSms,
  busyId,
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const selectedApplications = useMemo(
    () => applications.filter((item) => selectedIds.includes(item.id)),
    [applications, selectedIds]
  );

  const handleSelectRow = (application) => {
    setSelectedApplication(application);
    setModalOpen(true);
  };

  const handleToggleSelected = (id, checked) => {
    setSelectedIds((prev) => {
      if (checked) return Array.from(new Set([...prev, id]));
      return prev.filter((value) => value !== id);
    });
  };

  const handleToggleAll = (checked) => {
    setSelectedIds(checked ? applications.map((item) => item.id) : []);
  };

  const handleBulkComplete = async () => {
    await onBulkCompleteWithSms?.(selectedApplications);
    setSelectedIds([]);
  };

  const handleBulkCompleteNoSms = async () => {
    await onBulkCompleteWithoutSms?.(selectedApplications);
    setSelectedIds([]);
  };

  return (
    <>
      <div className="grid gap-4">
        <Section
          title="신청자 목록"
          desc="신규 회원은 프로필 사진 최소 3장, 입금 확인과 운영자 검토가 끝나면 매칭보드로 보냅니다. 기존 승인 1~2장 회원은 그대로 진행할 수 있습니다."
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
                onClick={handleBulkCompleteNoSms}
                disabled={!selectedApplications.length || busyId === "bulkCompleteNoSms"}
                tone="light"
              >
                테스트 완료(문자없이)
              </ActionButton>
            </div>
          }
        >
          <ApplicationsTable
            applications={applications}
            selectedId={selectedApplication?.id || ""}
            onSelect={handleSelectRow}
            selectable
            selectedIds={selectedIds}
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
