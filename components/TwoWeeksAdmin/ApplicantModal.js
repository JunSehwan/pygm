import { useEffect, useState } from "react";
import { deleteField, serverTimestamp } from "firebase/firestore";
import { ActionButton, FieldRow, Section } from "./AdminCommon";
import {
  formatAgeBirth,
  formatBirthYear,
  formatPhone,
  getBasic,
  getGenderLabel,
  getIdentity,
  getPenaltyReasonLabel,
  getPenaltyStats,
  getPenaltySummaryText,
  getPenaltyTone,
  hasPenaltyRecord,
  normalizeArray,
} from "./utils";

const NEXT_ROUND_READY_PATCH = {
  matchingStatus: "not_started",
  nextRoundStatus: "ready",
  scheduleStatus: "not_started",
  meetingStatus: "not_started",
  photoRevealStatus: "hidden",
  currentProposal: deleteField(),
  schedule: deleteField(),
  "penaltyStats.reviewStatus": "cleared",
  "penaltyStats.clearedAt": serverTimestamp(),
  updatedAt: serverTimestamp(),
};


function getPhotoUrl(photo) {
  if (!photo) return "";
  if (typeof photo === "string") return photo;
  return photo.url || photo.downloadURL || photo.src || photo.previewUrl || "";
}

function getPhotoName(photo, fallback = "") {
  if (!photo || typeof photo === "string") return fallback;
  return photo.name || photo.fileName || photo.originalName || fallback;
}

function getApplicationPhotos(application = {}) {
  const identity = getIdentity(application);
  const photos = [];
  const seen = new Set();

  const pushPhoto = (photo, label) => {
    const url = getPhotoUrl(photo);
    if (!url || seen.has(url)) return;

    seen.add(url);
    photos.push({
      url,
      label,
      name: getPhotoName(photo, label),
      raw: photo,
    });
  };

  pushPhoto(identity.representativePhoto, "대표 사진");

  if (Array.isArray(identity.additionalPhotos)) {
    identity.additionalPhotos.forEach((photo, index) => {
      pushPhoto(photo, `추가 사진 ${index + 1}`);
    });
  }

  if (Array.isArray(identity.photos)) {
    identity.photos.forEach((photo, index) => {
      pushPhoto(photo, `사진 ${index + 1}`);
    });
  }

  if (Array.isArray(application.profilePhotos)) {
    application.profilePhotos.forEach((photo, index) => {
      pushPhoto(photo, `프로필 사진 ${index + 1}`);
    });
  }

  return photos;
}

function PhotoGallery({ photos = [], selectedIndex, onSelect }) {
  const selectedPhoto = photos[selectedIndex] || photos[0];

  if (!photos.length) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center border border-zinc-200 bg-zinc-50 text-sm font-bold text-zinc-400">
        사진 없음
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-hidden border border-zinc-200 bg-zinc-50">
        <div className="relative aspect-[4/5]">
          <img
            src={selectedPhoto.url}
            alt={selectedPhoto.label || "프로필 사진"}
            className="h-full w-full object-cover"
          />
          <div className="absolute left-3 top-3 rounded bg-black/70 px-2.5 py-1 text-[11px] font-black text-white">
            {selectedPhoto.label || "사진"}
          </div>
          <a
            href={selectedPhoto.url}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-3 right-3 rounded bg-white/95 px-2.5 py-1 text-[11px] font-black text-zinc-800 shadow hover:bg-white"
          >
            원본 보기
          </a>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-xs font-black text-zinc-400">
          등록 사진 {photos.length}장
        </div>
        <div className="text-xs font-bold text-zinc-500">
          작은 사진을 누르면 위에 크게 표시됩니다.
        </div>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-4">
        {photos.map((photo, index) => {
          const active = index === selectedIndex;

          return (
            <button
              key={`${photo.url}_${index}`}
              type="button"
              onClick={() => onSelect(index)}
              className={`group overflow-hidden border bg-zinc-50 transition ${
                active
                  ? "border-orange-500 ring-2 ring-orange-500/25"
                  : "border-zinc-200 hover:border-zinc-500"
              }`}
              title={photo.label}
            >
              <div className="relative aspect-square">
                <img
                  src={photo.url}
                  alt={photo.label || `사진 ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <div className={`absolute inset-x-0 bottom-0 px-1 py-1 text-[10px] font-black text-white ${
                  active ? "bg-orange-600" : "bg-black/55 group-hover:bg-black/70"
                }`}>
                  {index + 1}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setReasonText("프로필 사진, 직업/회사 정보, 인증자료를 다시 확인해주세요.");
      setSelectedPhotoIndex(0);
    }
  }, [open, application?.id]);

  if (!open || !application) return null;

  const basic = getBasic(application);
  const identity = getIdentity(application);
  const busy = busyId === application.id;
  const photos = getApplicationPhotos(application);
  const safeSelectedPhotoIndex = Math.min(selectedPhotoIndex, Math.max(photos.length - 1, 0));
  const penaltyStats = getPenaltyStats(application);
  const hasPenalty = hasPenaltyRecord(application);

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
              {getGenderLabel(basic.gender)} · {formatAgeBirth(application)} · {formatPhone(basic.phone || basic.phoneNormalized)}
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
                  <PhotoGallery
                    photos={photos}
                    selectedIndex={safeSelectedPhotoIndex}
                    onSelect={setSelectedPhotoIndex}
                  />

                  {identity.verificationDocument?.url ? (
                    <a
                      href={identity.verificationDocument.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 block border border-zinc-200 bg-white px-3 py-2 text-center text-xs font-black text-zinc-700 hover:border-zinc-950"
                    >
                      인증자료 보기
                    </a>
                  ) : null}
                </div>

                <div className="border border-zinc-200 bg-white px-4">
                  <FieldRow label="이름" value={basic.name} />
                  <FieldRow label="닉네임" value={basic.nickname} />
                  <FieldRow label="출생" value={formatAgeBirth(application)} />
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

            <Section
              title="무응답/기한초과 기록"
              desc="제안 응답 또는 일정조율 기한을 넘긴 기록입니다. 운영자가 검토 후 매칭풀 복귀 여부를 결정합니다."
            >
              <div className="grid gap-3 md:grid-cols-4">
                <div className="border border-zinc-200 bg-white p-3">
                  <div className="text-xs font-bold text-zinc-400">총 무응답</div>
                  <div className={`mt-1 text-2xl font-bold ${getPenaltyTone(application) === "bad" ? "text-rose-600" : hasPenalty ? "text-orange-600" : "text-emerald-600"}`}>
                    {penaltyStats.totalNoResponseCount}
                  </div>
                </div>
                <div className="border border-zinc-200 bg-white p-3">
                  <div className="text-xs font-bold text-zinc-400">제안 무응답</div>
                  <div className="mt-1 text-2xl font-bold text-zinc-950">{penaltyStats.proposalNoResponseCount}</div>
                </div>
                <div className="border border-zinc-200 bg-white p-3">
                  <div className="text-xs font-bold text-zinc-400">일정 무응답</div>
                  <div className="mt-1 text-2xl font-bold text-zinc-950">{penaltyStats.scheduleNoResponseCount}</div>
                </div>
                <div className="border border-zinc-200 bg-white p-3">
                  <div className="text-xs font-bold text-zinc-400">검토 상태</div>
                  <div className="mt-1 break-keep text-sm font-bold leading-6 text-zinc-800">
                    {application.nextRoundStatus === "admin_review" ? "관리자 검토 필요" : penaltyStats.reviewStatus || "-"}
                  </div>
                </div>
              </div>

              <div className="mt-3 border border-zinc-200 bg-zinc-50 px-4">
                <FieldRow label="요약" value={getPenaltySummaryText(application)} />
                <FieldRow label="마지막 사유" value={getPenaltyReasonLabel(penaltyStats.lastPenaltyReason)} />
                <FieldRow label="마지막 기록" value={penaltyStats.lastPenaltyAtClient ? formatDate(penaltyStats.lastPenaltyAtClient) : "-"} />
                <FieldRow label="현재 상태" value={`${application.matchingStatus || "-"} / ${application.nextRoundStatus || "-"}`} />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <ActionButton
                  disabled={busy}
                  onClick={() => onUpdate(application.id, NEXT_ROUND_READY_PATCH)}
                  tone="good"
                >
                  검토 후 매칭풀 복귀
                </ActionButton>
                <ActionButton
                  disabled={busy}
                  onClick={() =>
                    onUpdate(application.id, {
                      matchingStatus: "paused",
                      nextRoundStatus: "admin_review",
                      "penaltyStats.reviewStatus": "admin_review",
                      updatedAt: serverTimestamp(),
                    })
                  }
                  tone="warn"
                >
                  검토 유지
                </ActionButton>
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

            <Section title="상태 수동 변경" desc="프로필 검토와 입금 상태만 수동 변경합니다. 후보 제안/확정은 매칭보드에서 처리합니다.">
              <div className="grid gap-3 md:grid-cols-2">
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

              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
