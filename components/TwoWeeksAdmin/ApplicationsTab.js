import { useMemo, useState } from "react";
import ApplicantModal from "./ApplicantModal";
import ApplicationsTable from "./ApplicationsTable";
import { ActionButton, Section } from "./AdminCommon";

export default function ApplicationsTab({
  applications,
  selectedApplication,
  setSelectedApplication,
  onUpdate,
  onApproveWithSms,
  onSendIncompleteSms,
  onBulkApproveWithSms,
  onBulkApproveWithoutSms,
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

  const handleBulkApprove = async () => {
    await onBulkApproveWithSms(selectedApplications);
    setSelectedIds([]);
  };

  const handleBulkApproveNoSms = async () => {
    await onBulkApproveWithoutSms(selectedApplications);
    setSelectedIds([]);
  };

  return (
    <>
      <div className="grid gap-4">
        <Section
          title="신청자 목록"
          desc="프로필 검토/승인은 이 탭에서 처리합니다. 행을 클릭하면 상세 모달이 열립니다."
          action={
            <div className="flex flex-wrap gap-2">
              <ActionButton
                onClick={handleBulkApprove}
                disabled={!selectedApplications.length || busyId === "bulkApprove"}
                tone="good"
              >
                선택 {selectedApplications.length}명 승인+문자
              </ActionButton>

              <ActionButton
                onClick={handleBulkApproveNoSms}
                disabled={!selectedApplications.length || busyId === "bulkApproveNoSms"}
                tone="light"
              >
                테스트 승인(문자없이)
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
        onApproveWithSms={onApproveWithSms}
        onSendIncompleteSms={onSendIncompleteSms}
        busyId={busyId}
      />
    </>
  );
}
