import { useState } from "react";
import { serverTimestamp } from "firebase/firestore";
import { ActionButton, FieldRow, Section } from "./AdminCommon";
import NoResponseReviewPanel from "./NoResponseReviewPanel";
import { MATCHING_OPTION_LABELS } from "../TwoWeeksShared/matchingCompatibility";
import {
  TWOWEEKS_MIN_PROFILE_PHOTOS,
  getTwoWeeksProfilePhotos,
} from "../TwoWeeksShared/profilePhotoPolicy";
import {
  formatBirthYear,
  formatDate,
  formatPhone,
  formatTimeSlots,
  getBasic,
  getGenderLabel,
  getIdentity,
  getIdentityVerificationLabel,
  getProfilePhotoCount,
  getStatusLabel,
  hasLegacyApprovedProfilePhotoException,
  hasMatchingEligibleProfilePhotos,
  isIdentityVerifiedApplication,
  normalizeArray,
} from "./utils";

export default function ApplicantDetail({
  application,
  onUpdate,
  onApproveWithSms,
  onCompleteWithSms,
  onSendIncompleteSms,
  busyId,
}) {
  const [reasonText, setReasonText] = useState("프로필 사진 최소 3장, 직업/회사 정보, 인증자료를 다시 확인해주세요.");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  if (!application) {
    return (
      <div className="border border-zinc-200 bg-white p-6 text-center text-sm font-bold text-zinc-400">
        신청자를 선택하면 상세 정보가 표시됩니다.
      </div>
    );
  }

  const basic = getBasic(application);
  const identity = getIdentity(application);
  const identityVerified = isIdentityVerifiedApplication(application);
  const profilePhotoCount = getProfilePhotoCount(application);
  const legacyPhotoException = hasLegacyApprovedProfilePhotoException(application);
  const profilePhotosReady = hasMatchingEligibleProfilePhotos(application);
  const busy = busyId === application.id;
  const photos = getTwoWeeksProfilePhotos(application);
  const selectedPhoto = photos[Math.min(selectedPhotoIndex, Math.max(photos.length - 1, 0))] || null;
  const photo = typeof selectedPhoto === "string"
    ? selectedPhoto
    : selectedPhoto?.url || selectedPhoto?.downloadURL || selectedPhoto?.previewUrl || "";

  return (
    <div className="grid gap-4">
      {!identityVerified ? (
        <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-800">
          본인인증이 완료되지 않은 신청자입니다. 승인·예치금 확인·매칭 참여 처리는 본인인증 완료 후 가능합니다.
        </div>
      ) : null}
      {!profilePhotosReady ? (
        <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-800">
          프로필 사진이 {profilePhotoCount}장 등록되어 있습니다. 최소 {TWOWEEKS_MIN_PROFILE_PHOTOS}장 보완 전에는 승인·신청완료·신규 매칭 처리를 할 수 없습니다.
        </div>
      ) : null}
      {legacyPhotoException ? (
        <div className="border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold leading-6 text-blue-800">
          정책 적용 전에 승인된 프로필입니다. 사진 {profilePhotoCount}장 상태로 신청완료·신규 매칭을 진행할 수 있으며, 다음 프로필 수정 시에는 최소 {TWOWEEKS_MIN_PROFILE_PHOTOS}장을 등록해야 합니다.
        </div>
      ) : null}
      <Section
        title="선택 신청자 상세"
        desc={`${basic.name || "-"} · ${basic.nickname || "-"} · ${getGenderLabel(basic.gender)}`}
      >
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <div>
            {photo ? (
              <img src={photo} alt="" className="aspect-[4/5] w-full border border-zinc-200 object-cover" />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center border border-zinc-200 bg-zinc-50 text-sm font-bold text-zinc-400">
                사진 없음
              </div>
            )}
            {photos.length > 1 ? (
              <div className="mt-2 grid grid-cols-5 gap-2">
                {photos.map((item, index) => {
                  const url = typeof item === "string"
                    ? item
                    : item?.url || item?.downloadURL || item?.previewUrl || "";
                  return (
                    <button
                      key={`${url}_${index}`}
                      type="button"
                      onClick={() => setSelectedPhotoIndex(index)}
                      className={`aspect-square overflow-hidden border ${index === selectedPhotoIndex ? "border-zinc-950 ring-2 ring-zinc-950/10" : "border-zinc-200"}`}
                      aria-label={`프로필 사진 ${index + 1} 보기`}
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                  );
                })}
              </div>
            ) : null}
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

          <div className="border border-zinc-200 px-4">
            <FieldRow label="이름" value={basic.name} />
            <FieldRow label="닉네임" value={basic.nickname} />
            <FieldRow label="출생" value={`${formatBirthYear(basic.birthYear)} / ${basic.age || "-"}세`} />
            <FieldRow label="성별" value={getGenderLabel(basic.gender)} />
            <FieldRow label="연락처" value={formatPhone(basic.phone || basic.phoneNormalized)} />
            <FieldRow label="본인인증" value={getIdentityVerificationLabel(application)} />
            <FieldRow label="프로필 사진" value={legacyPhotoException ? `${profilePhotoCount}장 / 기존 승인 예외` : `${profilePhotoCount}장 / 최소 ${TWOWEEKS_MIN_PROFILE_PHOTOS}장`} />
            <FieldRow label="직업" value={`${identity.jobCategory || "-"} · ${identity.organizationName || "-"}`} />
            <FieldRow label="학력" value={`${identity.educationLevel || "-"}${identity.schoolName ? ` · ${identity.schoolName}` : ""}`} />
            <FieldRow label="지역" value={normalizeArray(basic.activityAreas).join(" · ")} />
            <FieldRow label="선호지역" value={basic.preferredArea} />
            <FieldRow label="가능시간" value={formatTimeSlots(basic.availableTimeSlots)} />
            <FieldRow label="키" value={basic.height ? `${basic.height}cm` : "-"} />
            <FieldRow label="결혼 의향" value={MATCHING_OPTION_LABELS.marriagePlan[application.matchingPreferences?.marriagePlan] || "-"} />
            <FieldRow label="자녀 계획" value={MATCHING_OPTION_LABELS.childrenPlan[application.matchingPreferences?.childrenPlan] || "-"} />
            <FieldRow label="종교" value={`${MATCHING_OPTION_LABELS.religion[application.matchingPreferences?.religion] || "-"} · ${MATCHING_OPTION_LABELS.religionPreference[application.matchingPreferences?.religionPreference] || "-"}`} />
            <FieldRow label="흡연" value={`${MATCHING_OPTION_LABELS.smoking[application.matchingPreferences?.smoking] || "-"} · ${MATCHING_OPTION_LABELS.smokingPreference[application.matchingPreferences?.smokingPreference] || "-"}`} />
            <FieldRow label="음주" value={MATCHING_OPTION_LABELS.drinkingFrequency[application.matchingPreferences?.drinkingFrequency] || "-"} />
            <FieldRow label="MBTI·관심사" value={`${application.profileTraits?.mbti || "-"} · ${normalizeArray(application.profileTraits?.interests).join(" · ") || "-"}`} />
            <FieldRow label="희망 연령" value={application.matchingPreferences?.preferredAgeRange ? `${application.matchingPreferences.preferredAgeRange.min}~${application.matchingPreferences.preferredAgeRange.max}세` : "상관없음"} />
            <FieldRow label="선호 스타일" value={normalizeArray(application.matchingPreferences?.preferredStyles).join(" · ") || "-"} />
            <FieldRow label="선호 직업군" value={normalizeArray(application.matchingPreferences?.preferredJobCategories).join(" · ") || "-"} />
            <FieldRow label="추가 희망조건" value={application.matchingPreferences?.additionalPreference || "-"} />
            <FieldRow label="소개" value={basic.introduction} />
            <FieldRow label="더미" value={application.isDummy ? "더미 신청자" : "-"} />
          </div>
        </div>
      </Section>

      <NoResponseReviewPanel application={application} onUpdate={onUpdate} busy={busy} />

      <Section title="신청 완료/보완 문자" desc="신규 회원은 프로필 사진 최소 3장, 입금 확인과 운영자 검토가 모두 끝났을 때 신청 완료 문자를 보냅니다. 기존 승인 1~2장 회원은 예외입니다.">
        <div className="grid gap-3 lg:grid-cols-[1fr_1.3fr]">
          <div className="border border-zinc-200 p-3">
            <div className="mb-3 text-xs font-black text-zinc-400">신청 완료 처리</div>
            <div className="flex flex-wrap gap-2">
              <ActionButton
                disabled={busy || !identityVerified || !profilePhotosReady}
                onClick={() => onCompleteWithSms?.(application)}
                tone="good"
              >
                신청완료 + 문자
              </ActionButton>
              <ActionButton
                disabled={busy || !identityVerified || !profilePhotosReady}
                onClick={() => onApproveWithSms(application)}
                tone="light"
              >
                프로필승인+예치금안내
              </ActionButton>
            </div>
          </div>

          <div className="border border-zinc-200 p-3">
            <div className="mb-3 text-xs font-black text-zinc-400">정보 업로드 부족</div>
            <textarea
              value={reasonText}
              onChange={(event) => setReasonText(event.target.value)}
              rows={3}
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

      <Section title="운영 상태 변경" desc="검토, 입금, 매칭 상태를 수동으로 변경합니다.">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="border border-zinc-200 p-3">
            <div className="mb-3 text-xs font-black text-zinc-400">검토 상태</div>
            <div className="flex flex-wrap gap-2">
              <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { reviewStatus: "reviewing", updatedAt: serverTimestamp() })} tone="light">검토중</ActionButton>
              <ActionButton disabled={busy || !identityVerified || !profilePhotosReady} onClick={() => onUpdate(application.id, { reviewStatus: "approved", status: "approved", updatedAt: serverTimestamp() })} tone="good">승인</ActionButton>
              <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { reviewStatus: "waitlisted", updatedAt: serverTimestamp() })} tone="warn">대기풀</ActionButton>
              <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { reviewStatus: "rejected", status: "rejected", updatedAt: serverTimestamp() })} tone="bad">반려</ActionButton>
            </div>
          </div>

          <div className="border border-zinc-200 p-3">
            <div className="mb-3 text-xs font-black text-zinc-400">입금 상태</div>
            <div className="flex flex-wrap gap-2">
              <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { "deposit.status": "pending", updatedAt: serverTimestamp() })} tone="light">대기</ActionButton>
              <ActionButton disabled={busy || !identityVerified} onClick={() => onUpdate(application.id, { "deposit.status": "confirmed", "deposit.confirmedAt": serverTimestamp(), updatedAt: serverTimestamp() })} tone="good">확인</ActionButton>
              <span className="inline-flex items-center px-1 text-xs font-bold text-zinc-400">반환은 예치금관리에서 처리</span>
            </div>
          </div>

          <div className="border border-zinc-200 p-3">
            <div className="mb-3 text-xs font-black text-zinc-400">매칭 상태</div>
            <div className="flex flex-wrap gap-2">
              <ActionButton disabled={busy || !profilePhotosReady} onClick={() => onUpdate(application.id, { matchingStatus: "not_started", updatedAt: serverTimestamp() })} tone="light">대기</ActionButton>
              <ActionButton disabled={busy || !profilePhotosReady} onClick={() => onUpdate(application.id, { matchingStatus: "proposed", updatedAt: serverTimestamp() })} tone="warn">제안</ActionButton>
              <ActionButton disabled={busy || !profilePhotosReady} onClick={() => onUpdate(application.id, { matchingStatus: "confirmed", updatedAt: serverTimestamp() })} tone="good">확정</ActionButton>
              <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { matchingStatus: "completed", updatedAt: serverTimestamp() })} tone="dark">완료</ActionButton>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
