import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PiXBold } from "react-icons/pi";

export default function BoardGuideModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 z-[60] bg-black/45"
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.985 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute inset-x-0 bottom-0 z-[70] mx-auto flex h-[88dvh] w-full max-w-[390px] flex-col overflow-hidden rounded-t-[22px] bg-white md:h-[700px] md:max-w-[430px]"
          >
            <header className="shrink-0 border-b border-slate-200 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="text-[18px] font-extrabold tracking-[-0.03em] text-zinc-900">
                  도움말 (안전 가이드)
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-slate-100"
                  style={{ cursor: "pointer" }}
                >
                  <PiXBold className="text-[18px]" />
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 text-[14px] leading-6 text-zinc-800">
              <div className="break-keep">
                연락처는 서로 동의했을 때만 공개됩니다.
                <br />
                좋은 인연은 편안한 첫 연락에서 시작돼요.
                <br />
                서로의 시간과 경계를 존중하며 대화를 시작해 주세요.
              </div>

              <div className="mt-5">
                <div className="text-[17px] font-extrabold text-zinc-900">
                  1. 첫 연락은 이렇게 해보세요
                </div>
                <div className="mt-2 break-keep">
                  처음부터 너무 길거나 무거운 이야기보다,
                  <br />
                  짧고 자연스럽게 인사 + 매칭 포인트 언급이 좋아요.
                </div>
                <div className="mt-2">
                  • 안녕하세요, 오늘 매칭된 ○○입니다 🙂
                  <br />
                  • 반가워요! 성향카드에서 ○○ 답변 좋았어요.
                  <br />
                  • 안녕하세요. 시간 괜찮으실 때 편하게 답장 주세요 :)
                </div>
                <div className="mt-2 font-semibold text-zinc-900">
                  이런 연락은 피해주세요
                </div>
                <div className="mt-1">
                  • 늦은 밤 반복 연락 / 연속 메시지
                  <br />
                  • 반말로 시작하는 말투
                  <br />
                  • 외모 평가 / 부담스러운 표현
                  <br />
                  • 답장 재촉 (“왜 답 없어요?”)
                </div>
              </div>

              <div className="mt-6">
                <div className="text-[17px] font-extrabold text-zinc-900">
                  2. 개인정보 공유는 천천히
                </div>
                <div className="mt-2 break-keep">
                  연락처가 공개되었더라도,
                  아래 정보는 충분히 신뢰가 쌓인 뒤 공유하세요.
                </div>
                <div className="mt-2">
                  • 집 주소 / 회사 상세 주소
                  <br />
                  • 주민등록번호 / 계좌번호
                  <br />
                  • 가족 정보 / 민감한 개인정보
                  <br />
                  • 금전 상황(대출/투자/재산 등)
                </div>
              </div>

              <div className="mt-6">
                <div className="text-[17px] font-extrabold text-zinc-900">
                  3. 이런 경우는 주의하세요
                </div>
                <div className="mt-2">
                  • 금전 요청 / 송금 유도
                  <br />
                  • 투자 / 코인 / 대리구매 권유
                  <br />
                  • 외부 링크 클릭 강요
                  <br />
                  • 반복적 성적 발언 / 불쾌한 표현
                  <br />
                  • 협박 / 집착 / 스토킹성 연락
                  <br />
                  • 사칭이 의심되는 행동
                </div>
              </div>

              <div className="mt-6">
                <div className="text-[17px] font-extrabold text-zinc-900">
                  4. 불편하면 바로 차단/신고하세요
                </div>
                <div className="mt-2 break-keep">
                  참지 않아도 괜찮아요.
                  <br />
                  조금이라도 불편하거나 위험하다고 느끼면 바로 거리를 두세요.
                </div>
                <div className="mt-2">
                  • 차단하기 : 더 이상 연락/노출되지 않도록 설정
                  <br />
                  • 신고하기 : 운영팀이 확인 후 조치 진행
                </div>
              </div>

              <div className="mt-6">
                <div className="text-[17px] font-extrabold text-zinc-900">
                  5. 오프라인 만남 전 체크
                </div>
                <div className="mt-2">
                  • 처음 만남은 낮 시간을 추천해요.
                  <br />
                  • 사람이 많은 공공장소에서 만나요.
                  <br />
                  • 늦은 시간 단둘이 외딴 공간은 피해주세요.
                  <br />
                  • 지인에게 일정/장소를 공유해 두세요.
                  <br />
                  • 무리한 음주/금전 요구는 거절하세요.
                </div>
              </div>

              <div className="mt-6">
                <div className="text-[17px] font-extrabold text-zinc-900">
                  6. 자주 묻는 질문
                </div>

                <div className="mt-3 font-semibold text-zinc-900">
                  Q. 연락처를 교환했는데 답장이 없어요.
                </div>
                <div className="mt-1 text-slate-600">
                  A. 상대의 상황/속도 차이일 수 있어요. 짧게 한 번 더 인사 후,
                  반복 연락은 피해주세요.
                </div>

                <div className="mt-3 font-semibold text-zinc-900">
                  Q. 불쾌한 연락을 받았어요.
                </div>
                <div className="mt-1 text-slate-600">
                  A. 즉시 차단/신고를 이용해 주세요. 필요한 경우 운영팀이 확인 후
                  조치합니다.
                </div>

                <div className="mt-3 font-semibold text-zinc-900">
                  Q. 신고하면 상대가 알게 되나요?
                </div>
                <div className="mt-1 text-slate-600">
                  A. 신고는 익명으로 처리됩니다.
                </div>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}