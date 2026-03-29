import React from "react";
import {
  PiCardsDuotone,
  PiCreditCardDuotone,
  PiHeartDuotone,
  PiSealWarningDuotone,
  PiUsersThreeDuotone,
} from "react-icons/pi";
import { SummaryCard, SectionCard, InfoRow } from "../AdminCommon";

export default function AdminOverviewTab({ counts }) {
  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <SummaryCard icon={PiUsersThreeDuotone} title="가입 승인 대기" value={`${counts.pendingUsers}명`} accent="violet" />
        <SummaryCard icon={PiCardsDuotone} title="카드 승인 대기" value={`${counts.pendingCards}건`} accent="blue" />
        <SummaryCard icon={PiSealWarningDuotone} title="신고 검토" value={`${counts.pendingReports}건`} accent="rose" />
        <SummaryCard icon={PiCreditCardDuotone} title="입금 확인 대기" value={`${counts.pendingPayments}건`} accent="emerald" />
        <SummaryCard icon={PiHeartDuotone} title="매칭 성사" value={`${counts.successMatches}건`} accent="violet" />
      </section>

      <SectionCard
        title="운영 체크 요약"
        description="현재 관리자 페이지에서 바로 확인해야 하는 핵심 수치예요."
      >
        <InfoRow title="신규 심사 대상" value={`${counts.pendingUsers}명`} />
        <InfoRow title="기존 가입자 일괄 승인 대상" value={`${counts.legacyUsers}명`} />
        <InfoRow title="카드 승인 대기" value={`${counts.pendingCards}건`} />
        <InfoRow title="신고 누적" value={`${counts.pendingReports}건`} />
        <InfoRow title="입금 확인 대기" value={`${counts.pendingPayments}건`} />
        <InfoRow title="최근 매칭 성사" value={`${counts.successMatches}건`} />
      </SectionCard>
    </div>
  );
}
