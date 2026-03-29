import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  PiArrowLeft,
  PiWarningDiamondDuotone,
  PiCheckCircleFill,
} from "react-icons/pi";

const REPORT_REASONS = [
  {
    key: "fake_profile",
    title: "허위 프로필 같아요",
    description: "사진, 직업, 나이 등 프로필 정보가 사실과 달라 보여요.",
  },
  {
    key: "stolen_photo",
    title: "도용 사진 같아요",
    description: "본인 사진이 아니거나 인터넷 사진을 사용한 것 같아요.",
  },
  {
    key: "inappropriate_profile",
    title: "불쾌하거나 부적절해요",
    description: "프로필 문구나 이미지가 불쾌감을 주거나 부적절해요.",
  },
  {
    key: "sexual_content",
    title: "선정적이거나 수위가 높아요",
    description: "소개팅 서비스에 맞지 않는 과도한 성적 표현이 있어요.",
  },
  {
    key: "spam_or_ad",
    title: "광고·홍보 계정 같아요",
    description: "서비스 이용보다 홍보·유입 목적의 계정처럼 보여요.",
  },
  {
    key: "other",
    title: "기타",
    description: "위 항목 외에 따로 알리고 싶은 문제가 있어요.",
  },
];

export default function ArenaReportModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
  targetName = "",
}) {
  const [selectedReason, setSelectedReason] = useState("");
  const [details, setDetails] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedReason("");
      setDetails("");
    }
  }, [open]);

  const selectedReasonData =
    REPORT_REASONS.find((item) => item.key === selectedReason) || null;

  const handleSubmit = () => {
    if (!selectedReason || submitting) return;

    onSubmit?.({
      reasonKey: selectedReason,
      reasonTitle: selectedReasonData?.title || "",
      reasonDescription: selectedReasonData?.description || "",
      details: details.trim(),
    });
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="absolute inset-0 z-40 bg-black/34"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.985 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-x-0 bottom-0 z-50 flex max-h-[84%] flex-col rounded-t-[18px] bg-white shadow-[0_-18px_60px_rgba(15,23,42,0.18)]"
          >
            <div className="shrink-0 border-b border-slate-200">
              <div className="flex h-[58px] items-center justify-between px-4">
                <div className="flex items-center gap-2 text-[17px] font-extrabold tracking-[-0.03em] text-zinc-900">
                  <PiWarningDiamondDuotone className="text-[18px] text-rose-500" />
                  신고하기
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 hover:bg-slate-100"
                  style={{ cursor: "pointer" }}
                >
                  <PiArrowLeft className="text-[20px]" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <div className="rounded-[14px] bg-slate-50 px-4 py-4 text-[13px] leading-6 text-slate-600">
                {targetName
                  ? `${targetName}님에 대해 신고하는 이유를 선택해주세요.`
                  : "신고 사유를 선택해주세요."}
              </div>

              <div className="mt-4 space-y-2">
                {REPORT_REASONS.map((reason) => {
                  const active = selectedReason === reason.key;

                  return (
                    <button
                      key={reason.key}
                      type="button"
                      onClick={() => setSelectedReason(reason.key)}
                      className={`flex w-full items-start justify-between gap-3 rounded-[14px] border border-solid px-4 py-4 text-left transition ${active
                          ? "border-rose-200 bg-rose-50"
                          : "border-slate-200 bg-white"
                        }`}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="min-w-0">
                        <div
                          className={`text-[14px] font-bold ${active ? "text-rose-600" : "text-zinc-800"
                            }`}
                        >
                          {reason.title}
                        </div>
                        <div className="mt-1 break-keep text-[12px] leading-5 text-slate-500">
                          {reason.description}
                        </div>
                      </div>

                      <div className="shrink-0 pt-0.5">
                        {active ? (
                          <PiCheckCircleFill className="text-[18px] text-rose-500" />
                        ) : (
                          <span className="block h-[18px] w-[18px] rounded-full border border-solid border-slate-300" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4">
                <div className="mb-2 text-[13px] font-semibold text-slate-500">
                  추가 설명
                </div>

                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="필요하면 자세한 사유를 적어주세요."
                  className="h-[120px] w-full resize-none rounded-[14px] border border-solid border-slate-200 bg-white px-4 py-3 text-[14px] text-zinc-800 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedReason || submitting}
                className={`flex h-[50px] w-full items-center justify-center rounded-md text-[15px] font-bold text-white ${!selectedReason || submitting ? "bg-slate-300" : "bg-rose-500"
                  }`}
                style={{ cursor: !selectedReason || submitting ? "default" : "pointer" }}
              >
                {submitting ? "접수 중..." : "신고 접수하기"}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="mt-3 flex w-full items-center justify-center bg-transparent text-[14px] font-semibold text-slate-500"
                style={{ cursor: "pointer" }}
              >
                취소
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}