import { useMemo, useState } from "react";
import ApplicantModal from "./ApplicantModal";
import ApplicationsTable from "./ApplicationsTable";
import { ActionButton, Section, StatCard } from "./AdminCommon";
import { isApprovedApplication } from "./utils";

export default function ReviewTab({
  applications,
  selectedApplication,
  setSelectedApplication,
  onUpdate,
  onApproveWithSms,
  onSendIncompleteSms,
  onBulkConfirmDeposit,
  busyId,
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const approvedApplications = applications.filter(isApprovedApplication);
  const waitingDeposit = approvedApplications.filter((item) => item.deposit?.status !== "confirmed");
  const confirmedDeposit = approvedApplications.filter((item) => item.deposit?.status === "confirmed");

  const selectedApplications = useMemo(
    () => approvedApplications.filter((item) => selectedIds.includes(item.id)),
    [approvedApplications, selectedIds]
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
    setSelectedIds(checked ? approvedApplications.map((item) => item.id) : []);
  };

  const handleBulkConfirm = async () => {
    await onBulkConfirmDeposit(selectedApplications);
    setSelectedIds([]);
  };

  return (
    <>
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="승인자" value={approvedApplications.length} />
          <StatCard label="입금 대기" value={waitingDeposit.length} />
          <StatCard label="입금 확인" value={confirmedDeposit.length} />
        </div>

        <Section
          title="입금 확인"
          desc="승인된 신청자만 표시됩니다. 입금 확인 완료된 신청자만 매칭보드에 표시됩니다."
          action={
            <ActionButton
              onClick={handleBulkConfirm}
              disabled={!selectedApplications.length || busyId === "bulkDeposit"}
              tone="good"
            >
              선택 {selectedApplications.length}명 입금확인
            </ActionButton>
          }
        >
          <ApplicationsTable
            applications={approvedApplications}
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
        onApproveWithSms={onApproveWithSms}
        onSendIncompleteSms={onSendIncompleteSms}
        busyId={busyId}
      />
    </>
  );
}
