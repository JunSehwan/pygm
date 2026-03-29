import React from "react";
import { PiCreditCardDuotone } from "react-icons/pi";
import {
  ActionButton,
  EmptyBlock,
  MiniBadge,
  SectionCard,
} from "../AdminCommon";
import { formatDateTime } from "../adminUtils";

function PaymentCard({ item, onConfirm, busyId }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <MiniBadge tone="violet">{item.productTitle || "-"}</MiniBadge>
        <MiniBadge tone="green">
          {item.spoonAmount ? `${item.spoonAmount}스푼` : "-"}
        </MiniBadge>
        <MiniBadge>{item.status || "requested"}</MiniBadge>
      </div>

      <div className="mt-3 text-[18px] font-bold text-slate-900">
        {item.depositorName || "입금자 없음"}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        <InfoLine label="UID" value={item.uid || "-"} />
        <InfoLine label="신청번호" value={item.id || "-"} />
        <InfoLine
          label="금액"
          value={item.amount ? `${Number(item.amount).toLocaleString()}원` : "-"}
        />
        <InfoLine label="연락처" value={item.phoneNumber || "-"} />
        <InfoLine
          label="입금계좌"
          value={`${item.accountBank || "-"} ${item.accountNumber || "-"}`}
        />
        <InfoLine label="예금주" value={item.accountHolder || "-"} />
        <InfoLine
          label="신청일"
          value={formatDateTime(item.createdAt || item.updatedAt)}
        />
      </div>

      <div className="mt-4">
        <ActionButton
          onClick={() => onConfirm(item)}
          tone="green"
          disabled={busyId === item.id}
        >
          {busyId === item.id ? "충전 처리 중..." : "입금 확인 · 충전 처리"}
        </ActionButton>
      </div>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-md bg-slate-50 px-3 py-3">
      <div className="w-[72px] shrink-0 text-[13px] font-semibold text-slate-500">
        {label}
      </div>
      <div className="min-w-0 break-all text-[14px] leading-6 text-slate-800">
        {value || "-"}
      </div>
    </div>
  );
}

export default function PaymentTab({ payments, onConfirm, busyPaymentId }) {
  return (
    <div className="space-y-4">
      <SectionCard
        icon={PiCreditCardDuotone}
        title="결제 확인"
        description="입금 확인 후 스푼 충전, 이력 저장, 알림 저장, 문자 발송까지 한 번에 처리해요."
      >
        {payments.length ? (
          <div className="space-y-3">
            {payments.map((item) => (
              <PaymentCard
                key={item.id}
                item={item}
                onConfirm={onConfirm}
                busyId={busyPaymentId}
              />
            ))}
          </div>
        ) : (
          <EmptyBlock text="현재 입금 확인 대기 건이 없어요." />
        )}
      </SectionCard>
    </div>
  );
}