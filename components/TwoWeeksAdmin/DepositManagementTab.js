import { ActionButton, Section } from "./AdminCommon";
import {
  formatWon,
  getDepositBalance,
  getDepositHistory,
  getDepositRequiredBalance,
} from "../TwoWeeksShared/depositPolicy";
import {
  getBasic,
  isFullyApprovedApplication,
  isIdentityVerifiedApplication,
} from "./utils";

function formatDate(value) {
  if (!value) return "-";
  let date = null;
  if (typeof value?.toDate === "function") date = value.toDate();
  else if (typeof value?.seconds === "number") date = new Date(value.seconds * 1000);
  else {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) date = new Date(parsed);
  }
  if (!date) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatPhone(value = "") {
  const digits = String(value || "").replace(/[^0-9]/g, "");
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  return value || "-";
}

function historyLabel(type = "") {
  if (type === "initial_deposit") return "최초 예치";
  if (type === "deposit_waiver") return "예치금 면제";
  if (type === "top_up") return "추가 예치";
  if (type === "deduction") return "차감";
  if (type === "refund_request") return "반환 요청";
  if (type === "refund") return "반환 완료";
  if (type === "required_balance_adjustment") return "기준 변경";
  return type || "예치금 변동";
}

export default function DepositManagementTab({
  applications = [],
  onSendInitialDepositReminder,
  onCompleteDepositRefund,
  busyId = "",
}) {
  const unpaidApplications = applications
    .filter((application) => {
      const deposit = application?.deposit || {};
      const status = String(deposit.status || "");
      if (!isFullyApprovedApplication(application) || !isIdentityVerifiedApplication(application)) return false;
      if (["cancelled", "withdrawn", "rejected"].includes(String(application?.status || ""))) return false;
      if (["confirmed", "topup_required", "refund_requested", "refunded", "withdrawn_no_balance"].includes(status)) return false;
      return getDepositBalance(deposit) < getDepositRequiredBalance(deposit);
    })
    .sort((a, b) => String(a?.approvedAtClient || "").localeCompare(String(b?.approvedAtClient || "")));

  const pendingRefunds = applications
    .filter((item) => item?.deposit?.refundRequest?.status === "requested" || item?.deposit?.status === "refund_requested")
    .sort((a, b) => String(a?.deposit?.refundRequest?.dueAtClient || "").localeCompare(String(b?.deposit?.refundRequest?.dueAtClient || "")));

  const recentHistory = applications
    .flatMap((application) => {
      const basic = getBasic(application);
      return getDepositHistory(application?.deposit || {}).map((item) => ({
        ...item,
        applicationId: application.id,
        name: basic.name || basic.nickname || "-",
      }));
    })
    .sort((a, b) => String(b?.createdAtClient || "").localeCompare(String(a?.createdAtClient || "")))
    .slice(0, 80);

  return (
    <div className="grid gap-4">
      <Section
        title="프로필 승인 · 예치금 미입금"
        desc="본인인증과 프로필 승인은 끝났지만 회원별 기준 예치금이 충족되지 않은 회원입니다. 재안내 성공 횟수만 집계됩니다."
      >
        {unpaidApplications.length ? (
          <div className="grid gap-3">
            {unpaidApplications.map((application) => {
              const basic = getBasic(application);
              const deposit = application.deposit || {};
              const balance = getDepositBalance(deposit);
              const requiredBalance = getDepositRequiredBalance(deposit);
              const busy = busyId === application.id;

              return (
                <div key={application.id} className="border border-zinc-200 bg-white p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="text-base font-black text-zinc-950">
                        {basic.name || basic.nickname || "-"} · 미입금 {formatWon(Math.max(0, requiredBalance - balance))}
                      </div>
                      <div className="mt-1 text-xs font-bold text-zinc-500">
                        {formatPhone(basic.phone || basic.phoneNormalized)} · 현재 {formatWon(balance)} / 기준 {formatWon(requiredBalance)}
                      </div>
                      <div className="mt-1 text-xs font-bold text-zinc-400">
                        재안내 발송 {Number(deposit.initialReminderSentCount || 0)}회
                        {deposit.initialReminderLastSentAtClient
                          ? ` · 최근 ${formatDate(deposit.initialReminderLastSentAtClient)}`
                          : ""}
                      </div>
                    </div>

                    <ActionButton
                      tone="warn"
                      disabled={busy}
                      onClick={() => onSendInitialDepositReminder?.(application)}
                    >
                      {busy ? "발송 중..." : deposit.requestStage === "later" ? "입금 요청하기" : "예치금 재안내"}
                    </ActionButton>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border border-zinc-200 bg-white px-4 py-8 text-center text-sm font-bold text-zinc-400">
            프로필 승인 후 예치금 입금을 기다리는 회원이 없습니다.
          </div>
        )}
      </Section>

      <Section
        title="예치금 반환 요청"
        desc="실제 계좌 송금을 완료한 뒤 ‘반환완료 처리’를 눌러주세요. 완료 처리 시 고객 예치금 잔액이 0원이 되고 완료 문자가 발송됩니다."
      >
        {pendingRefunds.length ? (
          <div className="grid gap-3">
            {pendingRefunds.map((application) => {
              const basic = getBasic(application);
              const deposit = application.deposit || {};
              const request = deposit.refundRequest || {};
              const busy = busyId === `depositRefund:${application.id}`;

              return (
                <div key={application.id} className="border border-amber-200 bg-amber-50 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="text-lg font-black text-zinc-950">
                        {basic.name || basic.nickname || "-"} · {formatWon(request.requestedAmount || getDepositBalance(deposit))}
                      </div>
                      <div className="mt-1 text-xs font-bold text-zinc-500">
                        {formatPhone(basic.phone || basic.phoneNormalized)} · 요청 {formatDate(request.requestedAtClient)} · 처리기한 {formatDate(request.dueAtClient)}
                      </div>
                      <div className="mt-3 grid gap-2 border border-amber-200 bg-white px-4 py-3 text-sm font-bold text-zinc-800 sm:grid-cols-3">
                        <div>은행 <span className="text-zinc-950">{request.bankName || "-"}</span></div>
                        <div>계좌 <span className="text-zinc-950">{request.accountNumber || "-"}</span></div>
                        <div>예금주 <span className="text-zinc-950">{request.accountHolder || "-"}</span></div>
                      </div>
                    </div>

                    <ActionButton
                      tone="good"
                      disabled={busy}
                      onClick={() => onCompleteDepositRefund?.(application)}
                    >
                      {busy ? "처리 중..." : "반환완료 처리"}
                    </ActionButton>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border border-zinc-200 bg-white px-4 py-8 text-center text-sm font-bold text-zinc-400">
            처리 대기 중인 예치금 반환 요청이 없습니다.
          </div>
        )}
      </Section>

      <Section title="최근 예치금 변동" desc="최초 예치, 추가 예치, 차감, 반환 요청과 반환 완료 내역을 최근 순서로 확인합니다.">
        {recentHistory.length ? (
          <div className="overflow-x-auto border border-zinc-200 bg-white">
            <table className="min-w-[760px] w-full border-collapse text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-500">
                <tr>
                  <th className="px-3 py-3 font-black">회원</th>
                  <th className="px-3 py-3 font-black">구분</th>
                  <th className="px-3 py-3 font-black">금액</th>
                  <th className="px-3 py-3 font-black">처리 후 잔액</th>
                  <th className="px-3 py-3 font-black">내용</th>
                  <th className="px-3 py-3 font-black">일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {recentHistory.map((item, index) => (
                  <tr key={item.id || `${item.applicationId}-${item.type}-${item.createdAtClient}-${index}`}>
                    <td className="px-3 py-3 font-black text-zinc-900">{item.name}</td>
                    <td className="px-3 py-3 font-bold text-zinc-700">{historyLabel(item.type)}</td>
                    <td className="px-3 py-3 font-bold text-zinc-700">{formatWon(item.amount || 0)}</td>
                    <td className="px-3 py-3 font-bold text-zinc-700">{formatWon(item.balanceAfter || 0)}</td>
                    <td className="max-w-[300px] break-keep px-3 py-3 font-semibold text-zinc-500">{item.note || item.reason || "-"}</td>
                    <td className="px-3 py-3 font-semibold text-zinc-400">{formatDate(item.createdAtClient)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-zinc-200 bg-white px-4 py-8 text-center text-sm font-bold text-zinc-400">
            아직 예치금 변동 내역이 없습니다.
          </div>
        )}
      </Section>
    </div>
  );
}
