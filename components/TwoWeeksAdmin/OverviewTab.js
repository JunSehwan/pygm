import ApplicationsTable from "./ApplicationsTable";
import { ActionButton, Section, StatCard } from "./AdminCommon";
import { makeStats } from "./utils";

export default function OverviewTab({
  applications,
  responses,
  matches,
  onCreateDummy,
  onDeleteDummy,
  creatingDummy,
  deletingDummy,
}) {
  const stats = makeStats(applications, responses, matches);
  const recent = applications.slice(0, 6);
  const dummyCount = applications.filter((item) => item.isDummy || item.source === "twoweeks_admin_dummy").length;

  return (
    <div className="grid gap-4">
      <Section
        title="운영 테스트"
        desc={`더미 신청자 ${dummyCount}명 · 더미 번호는 010-7578-1252로 통일됩니다.`}
        action={
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={onCreateDummy} disabled={creatingDummy} tone="dark">
              {creatingDummy ? "생성 중..." : "더미 신청자 5명 생성"}
            </ActionButton>
            <ActionButton onClick={onDeleteDummy} disabled={deletingDummy || dummyCount === 0} tone="bad">
              {deletingDummy ? "삭제 중..." : "더미데이터 삭제"}
            </ActionButton>
          </div>
        }
      >
        <div className="text-sm font-semibold leading-6 text-zinc-500">
          관리자 화면, 문자 발송, 매칭보드 테스트용입니다.
        </div>
      </Section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="전체 신청" value={stats.total} sub={`남 ${stats.male} / 여 ${stats.female}`} />
        <StatCard label="승인" value={stats.approved} sub={`검토대기 ${stats.pendingReview}`} />
        <StatCard label="입금 확인" value={stats.depositConfirmed} sub="예치금 기준" />
        <StatCard label="매칭 확정" value={stats.confirmed} sub={`제안 ${stats.proposed}`} />
      </div>

      <Section title="최근 신청자" desc="최근 접수된 투윅스 신청자입니다.">
        <ApplicationsTable applications={recent} selectedId="" onSelect={() => {}} />
      </Section>
    </div>
  );
}
