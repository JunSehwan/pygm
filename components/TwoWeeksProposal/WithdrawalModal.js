import { useEffect, useMemo, useState } from "react";
import { formatWon } from "../TwoWeeksShared/depositPolicy";

const REASON_OPTIONS = [
  { value: "deposit_burden", label: "예치금이 부담돼서" },
  { value: "service_unclear", label: "서비스 방식이 아직 잘 이해되지 않아서" },
  { value: "privacy_concern", label: "개인정보가 걱정돼서" },
  { value: "personal_circumstances", label: "다른 인연/사정이 생겨서" },
  { value: "area_conditions_mismatch", label: "지역/조건이 맞지 않아서" },
  { value: "other", label: "기타" },
];

function ErrorBox({ children }) {
  if (!children) return null;
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-semibold leading-6 text-rose-700">
      {children}
    </div>
  );
}

function ChoiceCard({ checked, title, description, warning, onChange }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
        checked
          ? "border-[#1877f2] bg-blue-50"
          : "border-[#dfe3e8] bg-white hover:border-[#b8bec7]"
      }`}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 accent-[#1877f2]"
      />
      <span className="min-w-0">
        <span className="block text-[14px] font-bold text-[#1c1e21]">{title}</span>
        <span className="mt-1 block break-keep text-[12px] font-semibold leading-5 text-[#65676b]">
          {description}
        </span>
        {warning ? (
          <span className="mt-1 block break-keep text-[12px] font-bold leading-5 text-rose-600">
            {warning}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export default function WithdrawalModal({
  open,
  application,
  submitting,
  onClose,
  onLoadPreview,
  onSubmit,
}) {
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("immediate");
  const [reasonCode, setReasonCode] = useState("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const accountHolder = String(application?.basic?.name || "").trim();
  const committedMatch = preview?.activeMatch?.phase === "committed_meeting";
  const proposalMatch = preview?.activeMatch?.phase === "proposal";
  const cancellation = preview?.cancellation || {};
  const deductionAmount = mode === "cancel_and_withdraw"
    ? Number(cancellation.deductionAmount || 0)
    : 0;
  const refundAmount = mode === "cancel_and_withdraw"
    ? Number(cancellation.refundableAmount || 0)
    : Number(preview?.balance || 0);
  const needsAccount = refundAmount > 0 && preview?.refundAlreadyRequested !== true;

  const primaryLabel = useMemo(() => {
    if (submitting) return "처리 중...";
    if (mode === "after_current_match") return "현재 만남 후 탈퇴 예약";
    if (mode === "cancel_and_withdraw") return "만남 취소 후 탈퇴";
    return "투윅스 탈퇴하기";
  }, [mode, submitting]);

  useEffect(() => {
    if (!open || !application?.id) return undefined;

    let active = true;
    setPreview(null);
    setPreviewLoading(true);
    setError("");
    setReasonCode("");
    setReasonDetail("");
    setBankName("");
    setAccountNumber("");
    setConfirmed(false);

    Promise.resolve(onLoadPreview?.())
      .then((result) => {
        if (!active) return;
        if (!result) throw new Error("탈퇴 전 상태를 확인하지 못했습니다.");
        setPreview(result);
        setMode(
          Array.isArray(result.availableModes) &&
          result.availableModes.includes("after_current_match")
            ? "after_current_match"
            : "immediate"
        );
      })
      .catch((loadError) => {
        if (active) setError(loadError?.message || "탈퇴 전 상태를 확인하지 못했습니다.");
      })
      .finally(() => {
        if (active) setPreviewLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, application?.id, onLoadPreview]);

  useEffect(() => {
    if (!open) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, submitting, onClose]);

  if (!open) return null;

  const handleSubmit = async () => {
    setError("");
    if (!preview) {
      setError("탈퇴 전 상태를 먼저 확인해주세요.");
      return;
    }
    if (reasonCode === "other" && reasonDetail.trim().length < 2) {
      setError("기타 사유를 간단히 작성해주세요.");
      return;
    }
    if (needsAccount && (!bankName.trim() || accountNumber.replace(/[^0-9]/g, "").length < 6)) {
      setError("예치금을 반환받을 은행과 계좌번호를 확인해주세요.");
      return;
    }
    if (!confirmed) {
      setError("탈퇴 및 예치금 처리 안내를 확인해주세요.");
      return;
    }

    try {
      const result = await onSubmit?.({
        mode,
        reasonCode,
        reasonDetail,
        bankName,
        accountNumber,
        accountHolder,
      });
      if (result === false) return;
      onClose?.();
    } catch (submitError) {
      setError(submitError?.message || "탈퇴 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="fixed inset-0 z-[10020] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-5">
      <button
        type="button"
        aria-label="탈퇴 창 닫기"
        onClick={() => !submitting && onClose?.()}
        className="absolute inset-0 cursor-default"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdrawal-title"
        className="relative max-h-[92svh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="withdrawal-title" className="text-[22px] font-bold tracking-[-0.04em] text-[#1c1e21]">
              투윅스 탈퇴
            </h2>
            <p className="mt-1 break-keep text-[13px] font-semibold leading-6 text-[#65676b]">
              탈퇴 사유는 서비스 개선에만 참고합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-9 rounded-lg px-2 text-[13px] font-bold text-[#65676b] hover:bg-[#f0f2f5] disabled:opacity-40"
          >
            닫기
          </button>
        </div>

        {previewLoading ? (
          <div className="mt-6 rounded-xl bg-[#f0f2f5] px-4 py-8 text-center text-[13px] font-semibold text-[#65676b]">
            진행 중인 매칭과 예치금을 확인하고 있습니다.
          </div>
        ) : (
          <div className="mt-5 grid gap-5">
            <ErrorBox>{error}</ErrorBox>

            {preview ? (
              <>
                {committedMatch ? (
                  <div>
                    <div className="mb-2 text-[14px] font-bold text-[#1c1e21]">진행 중인 만남 처리</div>
                    <div className="grid gap-2">
                      <ChoiceCard
                        checked={mode === "after_current_match"}
                        onChange={() => {
                          setMode("after_current_match");
                          setConfirmed(false);
                        }}
                        title="현재 만남까지 진행 후 탈퇴"
                        description="현재 상대와 일정은 그대로 유지하고, 이후 매칭만 중단합니다. 만남 정리가 끝나면 탈퇴와 예치금 반환 요청으로 자동 전환됩니다."
                      />
                      <ChoiceCard
                        checked={mode === "cancel_and_withdraw"}
                        onChange={() => {
                          setMode("cancel_and_withdraw");
                          setConfirmed(false);
                        }}
                        title="지금 만남을 취소하고 탈퇴"
                        description={`상대방에게 취소 사실을 안내하고 현재 만남을 종료합니다. ${cancellation.policyLabel || "취소 정책"}이 적용됩니다.`}
                        warning={`${formatWon(deductionAmount || cancellation.deductionAmount || 0)} 차감 · ${formatWon(cancellation.refundableAmount || 0)} 반환 예정`}
                      />
                    </div>
                  </div>
                ) : proposalMatch ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="text-[14px] font-bold text-amber-900">현재 제안은 거절 처리됩니다</div>
                    <p className="mt-1 break-keep text-[12px] font-semibold leading-5 text-amber-800">
                      제안 단계이므로 예치금 차감은 없습니다. 상대방에게는 이번 매칭이 진행되지 않는다고 안내합니다.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#dfe3e8] bg-[#f8f9fa] p-4 text-[13px] font-semibold leading-6 text-[#65676b]">
                    진행 중인 매칭이 없어 탈퇴 요청 즉시 다음 매칭과 신청현황 이용이 종료됩니다.
                  </div>
                )}

                <div className="rounded-xl border border-[#dfe3e8] bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] font-bold text-[#65676b]">현재 예치금</span>
                    <b className="text-[16px] text-[#1c1e21]">{formatWon(preview.balance || 0)}</b>
                  </div>
                  {mode === "cancel_and_withdraw" ? (
                    <>
                      <div className="mt-2 flex items-center justify-between gap-3 text-[13px] font-semibold text-rose-600">
                        <span>취소 차감</span>
                        <b>- {formatWon(deductionAmount)}</b>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3 border-t border-[#eef0f3] pt-2">
                        <span className="text-[13px] font-bold text-[#65676b]">반환 예정액</span>
                        <b className="text-[16px] text-[#1c1e21]">{formatWon(refundAmount)}</b>
                      </div>
                    </>
                  ) : (
                    <p className="mt-2 break-keep text-[12px] font-semibold leading-5 text-[#65676b]">
                      {mode === "after_current_match"
                        ? "현재 만남 중 예치금 변동이 없다면 위 잔액이 반환됩니다. 최종 금액은 만남 종료 후 확정됩니다."
                        : preview.unresolvedReview
                          ? "운영자 확인이 필요한 기록이 있어 확인 후 반환 가능 금액을 안내합니다."
                          : preview.refundAlreadyRequested
                            ? "기존에 접수된 반환 요청은 그대로 유지됩니다."
                            : `탈퇴 접수 후 ${preview.refundProcessingDays || 3}일 이내 반환됩니다.`}
                    </p>
                  )}
                </div>

                <div>
                  <div className="mb-2 text-[14px] font-bold text-[#1c1e21]">삭제 이유 <span className="font-semibold text-[#8a8d91]">(선택)</span></div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {REASON_OPTIONS.map((reason) => (
                      <label
                        key={reason.value}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-[13px] font-semibold ${
                          reasonCode === reason.value
                            ? "border-[#1877f2] bg-blue-50 text-[#1c1e21]"
                            : "border-[#dfe3e8] text-[#65676b]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="withdrawal-reason"
                          value={reason.value}
                          checked={reasonCode === reason.value}
                          onChange={() => setReasonCode(reason.value)}
                          className="h-4 w-4 accent-[#1877f2]"
                        />
                        {reason.label}
                      </label>
                    ))}
                  </div>
                  {reasonCode === "other" ? (
                    <textarea
                      value={reasonDetail}
                      onChange={(event) => setReasonDetail(event.target.value.slice(0, 500))}
                      placeholder="기타 사유를 간단히 알려주세요."
                      rows={3}
                      className="mt-2 w-full resize-none rounded-xl border border-[#dfe3e8] px-3 py-3 text-[13px] font-semibold text-[#1c1e21] outline-none focus:border-[#1877f2]"
                    />
                  ) : null}
                </div>

                {needsAccount ? (
                  <div>
                    <div className="text-[14px] font-bold text-[#1c1e21]">예치금 반환 계좌</div>
                    <p className="mt-1 text-[12px] font-semibold leading-5 text-[#65676b]">
                      신청자 본인 명의 계좌만 입력할 수 있습니다.
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <input
                        value={bankName}
                        onChange={(event) => setBankName(event.target.value.slice(0, 30))}
                        placeholder="은행명"
                        className="h-11 rounded-xl border border-[#dfe3e8] px-3 text-[13px] font-semibold outline-none focus:border-[#1877f2]"
                      />
                      <input
                        value={accountNumber}
                        onChange={(event) => setAccountNumber(event.target.value.replace(/[^0-9-]/g, "").slice(0, 40))}
                        placeholder="계좌번호"
                        inputMode="numeric"
                        className="h-11 rounded-xl border border-[#dfe3e8] px-3 text-[13px] font-semibold outline-none focus:border-[#1877f2]"
                      />
                      <input
                        value={accountHolder}
                        readOnly
                        aria-readonly="true"
                        placeholder="예금주"
                        className="h-11 rounded-xl border border-[#dfe3e8] bg-[#f0f2f5] px-3 text-[13px] font-semibold text-[#65676b] outline-none"
                      />
                    </div>
                  </div>
                ) : null}

                <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#f0f2f5] p-4">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(event) => setConfirmed(event.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#1877f2]"
                  />
                  <span className="break-keep text-[12px] font-semibold leading-5 text-[#4b4f56]">
                    {mode === "after_current_match"
                      ? "현재 만남은 그대로 진행되고 이후 탈퇴가 완료되며, 다음 매칭은 지금부터 중단되는 점을 확인했습니다."
                      : mode === "cancel_and_withdraw"
                        ? `현재 만남 취소, 상대방 안내, 예치금 ${formatWon(deductionAmount)} 차감 후 탈퇴되는 점을 확인했습니다.`
                        : "탈퇴 후 신청현황 조회와 매칭 재개가 불가능하며, 재이용 시 새로 신청·심사해야 하는 점을 확인했습니다."}
                  </span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="h-12 flex-1 rounded-xl border border-[#dfe3e8] bg-white text-[14px] font-bold text-[#65676b] disabled:opacity-40"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || previewLoading}
                    className="h-12 flex-[1.4] rounded-xl bg-[#1c1e21] px-4 text-[14px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {primaryLabel}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
