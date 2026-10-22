import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiCheck, FiChevronRight, FiGift, FiX } from "react-icons/fi";
import { OPTIONAL_CONSENTS, REQUIRED_CONSENTS } from "./constants";

const CONSENT_ITEMS = [...REQUIRED_CONSENTS, ...OPTIONAL_CONSENTS];
const CONSENT_KEYS = CONSENT_ITEMS.map((item) => item.key);

function ConsentItem({ item, checked, onChange, onDetails, marketing = false }) {
  const label = item.title.replace(/^\[(?:필수|선택)\]\s*/, "");
  return (
    <div className={marketing ? "rounded-xl border border-[#cfdef7] bg-white px-3.5 py-3" : "border-b border-solid border-[#e9eef5] py-3 last:border-b-0"}>
      <div className="flex items-center gap-2.5">
        <button type="button" aria-label={`${label} ${checked ? "동의 해제" : "동의"}`}
          aria-pressed={Boolean(checked)} onClick={() => onChange(!checked)}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border-2 transition ${checked ? "border-[#2167d5] bg-[#2167d5] text-white" : "border-[#cbd5e1] bg-white text-transparent"}`}>
          <FiCheck size={17} strokeWidth={3} />
        </button>
        <button type="button" onClick={() => onChange(!checked)}
          className="min-w-0 flex-1 break-keep text-left text-[13px] font-bold leading-5 text-[#263f58] sm:text-sm">{label}</button>
        <button type="button" onClick={() => onDetails(item)}
          aria-label={`${label} 약관 내용 보기`}
          className="flex shrink-0 items-center gap-1 rounded-lg px-1 py-2 text-[11px] font-semibold text-[#718395] hover:text-[#2167d5]">
          상세 <FiChevronRight />
        </button>
      </div>
    </div>
  );
}

function ConsentDetailModal({ item, onClose }) {
  const headingId = useId();
  const closeRef = useRef(null);
  useEffect(() => {
    if (!item) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [item, onClose]);
  if (!item) return null;
  const detailTitle = item.title.replace(/^\[(?:필수|선택)\]\s*/, "");
  const paragraphs = String(item.detail || "").split(/(?<=[.!?])\s+/).filter(Boolean);
  return createPortal(
    <div className="fixed inset-0 z-[10100] flex items-end justify-center bg-[#0e253d]/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby={headingId}
        className="flex max-h-[88dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[24px] bg-white shadow-[0_24px_60px_rgba(15,42,67,0.2)] sm:max-h-[82dvh] sm:rounded-[22px]">
        <div className="flex shrink-0 items-start gap-3 border-b border-[#e8edf4] px-5 py-5 sm:px-6">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-extrabold text-[#3268d9]">약관 상세</span>
            <h2 id={headingId} className="mt-1 break-keep text-[19px] font-extrabold leading-[1.4] text-[#102a43] sm:text-[21px]">{detailTitle}</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="약관 상세 닫기"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f2f5f9] text-[#516a85]"><FiX size={19} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          {item.summary ? <p className="mb-4 break-keep rounded-[12px] bg-[#f1f6ff] p-4 text-[14px] font-bold leading-6 text-[#325a88]">{item.summary}</p> : null}
          <div className="space-y-3 break-keep text-[14px] leading-[1.85] text-[#4b6179]">
            {paragraphs.map((part, index) => <p key={`${item.key}-${index}`}>{part}</p>)}
          </div>
        </div>
        <div className="shrink-0 border-t border-[#e8edf4] bg-white p-4 pb-[calc(16px+env(safe-area-inset-bottom))] sm:p-5">
          <button type="button" onClick={onClose} className="h-12 w-full rounded-xl bg-[#1769d2] text-sm font-bold text-white">내용 확인했어요</button>
        </div>
      </section>
    </div>,
    document.body
  );
}

/** 기존 consents 필드 5개를 그대로 사용하며, 전체 동의는 선택 동의를 포함합니다. */
export default function ConsentAgreementPanel({ consents, onChange, error, gender }) {
  const [detailItem, setDetailItem] = useState(null);
  const values = consents || {};
  const requiredCount = REQUIRED_CONSENTS.filter(({ key }) => values[key] === true).length;
  const allChecked = CONSENT_KEYS.every((key) => values[key] === true);
  // 첫 기수 여성에게는 일반 예치금 부과 안내 대신 실제 면제 정책을 표시합니다.
  const getRequiredItem = (item) => gender === "female" && item.key === "noShowDeposit"
    ? {
        ...item,
        title: "[필수] 취소·노쇼 및 계정 제재 정책 동의",
        summary: "여성 1기 예치금은 면제되며, 확정된 만남의 무단 불참 등은 운영 정책에 따라 검토될 수 있어요.",
        detail: "여성 1기 회원은 예치금 입금 없이 참여합니다. 매칭 제안 거절이나 일정 확정 전 취소에는 계정 제재가 없으며, 만남 확정 후 당일 취소 또는 무단 불참은 운영자가 사유를 확인해 경고·다음 회차 제한 등 조치를 검토할 수 있습니다. 질병·사고·가족문제 등 불가피한 사유는 예외 처리할 수 있습니다. 노쇼가 반복될 경우 운영자 판단에 따라 이후 예치금 필수회원으로 전환될 수 있습니다.",
      }
    : item;

  return (
    <div data-tw-field="true" className="space-y-5">
      <button
        type="button"
        aria-label="필수 및 선택 항목 모두 동의"
        aria-pressed={allChecked}
        onClick={() => onChange(Object.fromEntries(CONSENT_KEYS.map((key) => [key, !allChecked])))}
        className={`flex w-full items-center gap-3 rounded-[16px] border-2 px-4 py-4 text-left transition sm:px-5 ${allChecked ? "border-[#2d6cdf] bg-[#edf4ff]" : "border-[#d9e5f6] bg-[#f5f8ff] hover:border-[#92b4ed]"}`}
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border-2 ${allChecked ? "border-[#2d6cdf] bg-[#2d6cdf] text-white" : "border-[#b9cae4] bg-white text-transparent"}`}>
          <FiCheck size={21} strokeWidth={3} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-extrabold text-[#16375c]">전체 동의</span>
          <span className="mt-0.5 block break-keep text-xs leading-5 text-[#637e9f]">필수 약관과 선택 혜택 알림까지 한 번에 동의해요.</span>
        </span>
      </button>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-sm font-extrabold text-[#283f56]">필수 동의</div>
          <span className="text-xs font-bold text-[#778aa1]">{requiredCount}/{REQUIRED_CONSENTS.length}</span>
        </div>
        <div className="border-t border-[#e2e8f0]">
          {REQUIRED_CONSENTS.map((item) => (
            <ConsentItem key={item.key} item={getRequiredItem(item)} checked={values[item.key] === true} onChange={(checked) => onChange({ [item.key]: checked })} onDetails={setDetailItem} />
          ))}
        </div>
      </div>

      <div className="rounded-[16px] border border-[#e1e9f6] bg-[#f7faff] px-3.5 py-4 sm:px-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#285a9d]">
          <FiGift size={17} /> 투윅스 혜택 소식 <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[#7187a6]">선택</span>
        </div>
        <p className="mb-3 break-keep text-xs leading-5 text-[#6680a0]">이벤트와 새로운 혜택을 놓치지 않고 받아보세요.</p>
        {OPTIONAL_CONSENTS.map((item) => (
          <ConsentItem key={item.key} item={item} marketing checked={values[item.key] === true} onChange={(checked) => onChange({ [item.key]: checked })} onDetails={setDetailItem} />
        ))}
        <p className="mt-2 text-[11px] leading-5 text-[#8193aa]">선택 동의 없이도 가입할 수 있으며, 수신 동의는 추후 철회할 수 있어요.</p>
      </div>
      <ConsentDetailModal item={detailItem} onClose={() => setDetailItem(null)} />
      {error ? <p data-tw-error="true" className="text-xs font-semibold text-rose-600" role="alert">{error}</p> : null}
    </div>
  );
}
