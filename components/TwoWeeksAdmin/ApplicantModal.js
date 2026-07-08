import { useEffect, useState } from "react";
import { serverTimestamp } from "firebase/firestore";
import { ActionButton, FieldRow, Section } from "./AdminCommon";
import {
  formatBirthYear,
  formatPhone,
  getBasic,
  getGenderLabel,
  getIdentity,
  getProfilePhoto,
  normalizeArray,
} from "./utils";

export default function ApplicantModal({
  open,
  application,
  onClose,
  onUpdate,
  onApproveWithSms,
  onSendIncompleteSms,
  busyId,
}) {
  const [reasonText, setReasonText] = useState("프로필 사진, 직업/회사 정보, 인증자료를 다시 확인해주세요.");

  useEffect(() => {
    if (open) {
      setReasonText("프로필 사진, 직업/회사 정보, 인증자료를 다시 확인해주세요.");
    }
  }, [open, application?.id]);

  if (!open || !application) return null;

  const basic = getBasic(application);
  const identity = getIdentity(application);
  const busy = busyId === application.id;
  const photo = getProfilePhoto(application);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 px-3 py-4 backdrop-blur-sm sm:px-6">
      <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden border border-zinc-200 bg-[#f4f1eb] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 bg-white px-4 py-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">applicant detail</div>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.05em] text-zinc-950">
              {basic.name || "-"} · {basic.nickname || "-"}
            </h2>
            <p className="mt-1 text-sm font-semibold text-zinc-500">
              {getGenderLabel(basic.gender)} · {formatBirthYear(basic.birthYear)} · {formatPhone(basic.phone || basic.phoneNormalized)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="border border-zinc-200 bg-white px-3 py-2 text-xs font-black text-zinc-700 hover:border-zinc-950"
          >
            닫기
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid gap-4">
            <Section title="프로필 상세" desc="신청자가 제출한 프로필과 인증자료입니다.">
              <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
                <div>
                  {photo ? (
                    <img src={photo} alt="" className="aspect-[4/5] w-full border border-zinc-200 object-cover" />
                  ) : (
                    <div className="flex aspect-[4/5] items-center justify-center border border-zinc-200 bg-zinc-50 text-sm font-bold text-zinc-400">
                      사진 없음
                    </div>
                  )}
                  {identity.verificationDocument?.url ? (
                    <a
                      href={identity.verificationDocument.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block border border-zinc-200 bg-white px-3 py-2 text-center text-xs font-black text-zinc-700 hover:border-zinc-950"
                    >
                      인증자료 보기
                    </a>
                  ) : null}
                </div>

                <div className="border border-zinc-200 bg-white px-4">
                  <FieldRow label="이름" value={basic.name} />
                  <FieldRow label="닉네임" value={basic.nickname} />
                  <FieldRow label="출생" value={`${formatBirthYear(basic.birthYear)} / ${basic.age || "-"}세`} />
                  <FieldRow label="성별" value={getGenderLabel(basic.gender)} />
                  <FieldRow label="연락처" value={formatPhone(basic.phone || basic.phoneNormalized)} />
                  <FieldRow label="직업" value={`${identity.jobCategory || "-"} · ${identity.organizationName || "-"}`} />
                  <FieldRow label="지역" value={normalizeArray(basic.activityAreas).join(" · ")} />
                  <FieldRow label="선호지역" value={basic.preferredArea} />
                  <FieldRow label="가능시간" value={normalizeArray(basic.availableTimeSlots).join(" · ")} />
                  <FieldRow label="키" value={basic.height ? `${basic.height}cm` : "-"} />
                  <FieldRow label="소개" value={basic.introduction} />
                  <FieldRow label="더미" value={application.isDummy ? "더미 신청자" : "-"} />
                </div>
              </div>
            </Section>

            <Section title="승인/보완 문자" desc="승인 시 예치금 입금 안내 LMS가 같이 발송됩니다.">
              <div className="grid gap-3 lg:grid-cols-[1fr_1.3fr]">
                <div className="border border-zinc-200 bg-white p-3">
                  <div className="mb-3 text-xs font-black text-zinc-400">회원 승인</div>
                  <p className="mb-3 break-keep text-sm font-semibold leading-6 text-zinc-500">
                    승인 후 예치금 입금 계좌와 입금 확인 후 매칭 진행 안내를 발송합니다.
                  </p>
                  <ActionButton
                    disabled={busy}
                    onClick={() => onApproveWithSms(application)}
                    tone="good"
                  >
                    승인 + 문자 발송
                  </ActionButton>
                </div>

                <div className="border border-zinc-200 bg-white p-3">
                  <div className="mb-3 text-xs font-black text-zinc-400">정보 업로드 부족</div>
                  <textarea
                    value={reasonText}
                    onChange={(event) => setReasonText(event.target.value)}
                    rows={4}
                    className="w-full resize-none border border-zinc-200 bg-white p-3 text-sm font-semibold leading-6 text-zinc-800 outline-none focus:border-zinc-950"
                  />
                  <div className="mt-2 flex justify-end">
                    <ActionButton
                      disabled={busy}
                      onClick={() => onSendIncompleteSms(application, reasonText)}
                      tone="warn"
                    >
                      보완 문자 발송
                    </ActionButton>
                  </div>
                </div>
              </div>
            </Section>

            <Section title="상태 수동 변경" desc="필요할 때만 수동으로 상태를 변경합니다.">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="border border-zinc-200 bg-white p-3">
                  <div className="mb-3 text-xs font-black text-zinc-400">검토 상태</div>
                  <div className="flex flex-wrap gap-2">
                    <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { reviewStatus: "reviewing", updatedAt: serverTimestamp() })} tone="light">검토중</ActionButton>
                    <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { reviewStatus: "approved", status: "approved", updatedAt: serverTimestamp() })} tone="good">승인</ActionButton>
                    <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { reviewStatus: "waitlisted", updatedAt: serverTimestamp() })} tone="warn">대기풀</ActionButton>
                    <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { reviewStatus: "rejected", status: "rejected", updatedAt: serverTimestamp() })} tone="bad">반려</ActionButton>
                  </div>
                </div>

                <div className="border border-zinc-200 bg-white p-3">
                  <div className="mb-3 text-xs font-black text-zinc-400">입금 상태</div>
                  <div className="flex flex-wrap gap-2">
                    <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { "deposit.status": "pending", updatedAt: serverTimestamp() })} tone="light">대기</ActionButton>
                    <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { "deposit.status": "confirmed", "deposit.confirmedAt": serverTimestamp(), updatedAt: serverTimestamp() })} tone="good">입금확인</ActionButton>
                    <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { "deposit.status": "refunded", updatedAt: serverTimestamp() })} tone="bad">환불</ActionButton>
                  </div>
                </div>

                <div className="border border-zinc-200 bg-white p-3">
                  <div className="mb-3 text-xs font-black text-zinc-400">매칭 상태</div>
                  <div className="flex flex-wrap gap-2">
                    <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { matchingStatus: "not_started", updatedAt: serverTimestamp() })} tone="light">대기</ActionButton>
                    <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { matchingStatus: "proposed", updatedAt: serverTimestamp() })} tone="warn">제안</ActionButton>
                    <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { matchingStatus: "confirmed", updatedAt: serverTimestamp() })} tone="good">확정</ActionButton>
                    <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { matchingStatus: "completed", updatedAt: serverTimestamp() })} tone="dark">완료</ActionButton>
                  </div>
                </div>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
