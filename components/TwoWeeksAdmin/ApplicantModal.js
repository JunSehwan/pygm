import { useEffect, useState } from "react";
import { serverTimestamp } from "firebase/firestore";
import { ActionButton, FieldRow, Section } from "./AdminCommon";
import NoResponseReviewPanel from "./NoResponseReviewPanel";
import { COMPANY_SCALE_OPTIONS } from "../TwoWeeksRegister/constants";
import { MATCHING_OPTION_LABELS } from "../TwoWeeksShared/matchingCompatibility";
import {
  TWOWEEKS_DEPOSIT_PRESET_AMOUNTS,
  formatWon,
  getDepositBalance,
  getDepositDeductionPolicy,
  getDepositHistory,
  getDepositPolicySnapshot,
  getDepositRequiredBalance,
  getDepositTopUpRequiredAmount,
  isDepositWaived,
} from "../TwoWeeksShared/depositPolicy";
import { getSanctionStatusLabel, isMatchingRestricted } from "../TwoWeeksShared/sanctionPolicy";
import { TWOWEEKS_MIN_PROFILE_PHOTOS } from "../TwoWeeksShared/profilePhotoPolicy";
import {
  formatAgeBirth,
  formatBirthYear,
  formatDate,
  formatPhone,
  formatTimeSlots,
  getBasic,
  getGenderLabel,
  getIdentity,
  getIdentityVerificationLabel,
  getProfilePhotoCount,
  hasLegacyApprovedProfilePhotoException,
  hasMatchingEligibleProfilePhotos,
  getStatusLabel,
  isFullyApprovedApplication,
  isIdentityVerifiedApplication,
  normalizeArray,
} from "./utils";

const DEFAULT_ADMIN_MATCHING_RATING = 3;

function normalizeAdminRating(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_ADMIN_MATCHING_RATING;
  return Math.min(5, Math.max(1, Math.round(numeric)));
}

function buildAdminMetaDraft(application = {}) {
  const identity = getIdentity(application);
  const meta = application?.adminMatchingMeta || {};
  return {
    profileAppeal: normalizeAdminRating(meta.profileAppeal),
    conditionCompetitiveness: normalizeAdminRating(meta.conditionCompetitiveness),
    matchingReliability: normalizeAdminRating(meta.matchingReliability),
    companyScaleVerified: meta.companyScaleVerified || (identity.jobCategory === "회사원" ? identity.companyScale || "" : ""),
  };
}

function RatingSelector({ value, onChange, disabled = false }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          disabled={disabled}
          onClick={() => onChange(rating)}
          className={`h-9 w-10 border text-sm font-black transition disabled:opacity-50 ${value === rating
              ? "border-orange-600 bg-orange-600 text-white"
              : "border-zinc-200 bg-white text-zinc-600 hover:border-orange-400"
            }`}
        >
          {rating}
        </button>
      ))}
    </div>
  );
}

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

function PhotoGallery({ photos = [], selectedIndex, onSelect, legacyException = false }) {
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
          등록 사진 {photos.length}장 · {legacyException ? "기존 승인 예외" : `승인 기준 최소 ${TWOWEEKS_MIN_PROFILE_PHOTOS}장`}
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
              className={`group overflow-hidden border bg-zinc-50 transition ${active
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
                <div className={`absolute inset-x-0 bottom-0 px-1 py-1 text-[10px] font-black text-white ${active ? "bg-orange-600" : "bg-black/55 group-hover:bg-black/70"
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
  onUpdateAdminMatchingMeta,
  onApproveWithSms,
  onCompleteWithSms,
  onSendIncompleteSms,
  onSendInitialDepositReminder,
  onSendDepositTopUpReminder,
  onConfirmDepositTopUp,
  onCompleteDepositRefund,
  onManageSanction,
  onLoadSanctionHistory,
  busyId,
}) {
  const [reasonText, setReasonText] = useState("프로필 사진 최소 3장, 직업/회사 정보, 인증자료를 다시 확인해주세요.");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [adminMetaDraft, setAdminMetaDraft] = useState(() => buildAdminMetaDraft(application));
  const [adminMetaSaving, setAdminMetaSaving] = useState(false);
  const [depositAmountInput, setDepositAmountInput] = useState(() => String(getDepositRequiredBalance(application?.deposit || {})));
  const [sanctionMemo, setSanctionMemo] = useState("");
  const [sanctionHistory, setSanctionHistory] = useState([]);
  const [sanctionLoading, setSanctionLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setReasonText("프로필 사진 최소 3장, 직업/회사 정보, 인증자료를 다시 확인해주세요.");
      setSelectedPhotoIndex(0);
      setAdminMetaDraft(buildAdminMetaDraft(application));
      setDepositAmountInput(String(getDepositRequiredBalance(application?.deposit || {})));
      setSanctionMemo(application?.sanctionSummary?.lastMemo || "");
      setSanctionLoading(true);
      Promise.resolve(onLoadSanctionHistory?.(application?.id))
        .then((history) => setSanctionHistory(Array.isArray(history) ? history : []))
        .catch((error) => console.error("[TwoWeeksAdmin] sanction history load error:", error))
        .finally(() => setSanctionLoading(false));
    }
  }, [open, application?.id, onLoadSanctionHistory]);

  const saveAdminMatchingMeta = async ({ showMessage = false } = {}) => {
    if (!application?.id || !onUpdateAdminMatchingMeta) return;
    setAdminMetaSaving(true);
    try {
      await onUpdateAdminMatchingMeta(application.id, adminMetaDraft);
      if (showMessage) alert("내부 매칭 평가를 저장했습니다.");
    } catch (error) {
      console.error("[TwoWeeksAdmin] internal matching meta save error:", error);
      if (showMessage) alert(error?.message || "내부 매칭 평가 저장 중 오류가 발생했습니다.");
      throw error;
    } finally {
      setAdminMetaSaving(false);
    }
  };

  const saveMetaThen = async (callback) => {
    try {
      await saveAdminMatchingMeta();
      await callback?.();
    } catch (error) {
      // 저장 실패 시 승인/완료를 이어서 진행하지 않는다.
    }
  };

  if (!open || !application) return null;

  const basic = getBasic(application);
  const identity = getIdentity(application);
  const matchingPreferences = application.matchingPreferences || basic.matchingPreferences || {};
  const consents = application.consents || {};
  const identityVerified = isIdentityVerifiedApplication(application);
  const profilePhotoCount = getProfilePhotoCount(application);
  const legacyPhotoException = hasLegacyApprovedProfilePhotoException(application);
  const profilePhotosReady = hasMatchingEligibleProfilePhotos(application);
  const profileApproved = isFullyApprovedApplication(application);
  const refundBusy = busyId === `depositRefund:${application.id}`;
  const busy = busyId === application.id || refundBusy;
  const photos = getApplicationPhotos(application);
  const safeSelectedPhotoIndex = Math.min(selectedPhotoIndex, Math.max(photos.length - 1, 0));
  const deposit = application.deposit || {};
  const selectedDepositAmount = Math.round(Number(depositAmountInput));
  const depositAmountValid = Number.isFinite(selectedDepositAmount) && selectedDepositAmount >= 0 && selectedDepositAmount <= 1000000;
  const selectedDepositPolicy = depositAmountValid ? getDepositDeductionPolicy(selectedDepositAmount) : null;
  const depositBalance = getDepositBalance(deposit);
  const depositRequiredBalance = getDepositRequiredBalance(deposit);
  const depositTopUpRequired = getDepositTopUpRequiredAmount(deposit);
  const isDepositTopUpRequired = deposit.status === "topup_required" || deposit.noShowResolution === "deducted_top_up_required";
  const depositStatus = String(deposit.status || "");
  const isInitialDepositPending =
    profileApproved &&
    identityVerified &&
    profilePhotosReady &&
    !["confirmed", "waived", "topup_required", "refund_requested", "refunded", "withdrawn_no_balance"].includes(depositStatus) &&
    depositBalance < depositRequiredBalance;
  const initialReminderSentCount = Number(deposit.initialReminderSentCount || 0);
  const refundRequest = deposit.refundRequest || {};
  const refundPending = refundRequest.status === "requested" || deposit.status === "refund_requested";
  const depositHistory = getDepositHistory(deposit).slice().sort((a, b) => String(b?.createdAtClient || "").localeCompare(String(a?.createdAtClient || "")));
  const sanctionSummary = application.sanctionSummary || {};
  const sanctionBusy = busyId === `sanction:${application.id}`;

  const runSanctionAction = async (action, label) => {
    if (!onManageSanction || !application?.id) return;
    if (!window.confirm(`${label} 처리를 적용할까요? 제재 이력에 기록됩니다.`)) return;
    try {
      await onManageSanction({ applicationId: application.id, action, memo: sanctionMemo });
      const history = await onLoadSanctionHistory?.(application.id);
      setSanctionHistory(Array.isArray(history) ? history : []);
      window.alert(`${label} 처리가 완료되었습니다.`);
    } catch (error) {
      console.error("[TwoWeeksAdmin] sanction action error:", error);
      window.alert(error?.message || "제재 처리 중 오류가 발생했습니다.");
    }
  };

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
            className="border border-zinc-200 border-solid bg-white px-3 py-2 text-xs font-black text-zinc-700 hover:border-zinc-950"
          >
            닫기
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid gap-4">
            {!identityVerified ? (
              <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-800">
                본인인증이 완료되지 않은 신청자입니다. 본인인증 완료 전에는 승인·예치금 확인·매칭 참여 처리를 할 수 없습니다.
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

            <Section title="프로필 상세" desc="신청자가 제출한 프로필과 인증자료입니다.">
              <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
                <div>
                  <PhotoGallery
                    photos={photos}
                    selectedIndex={safeSelectedPhotoIndex}
                    onSelect={setSelectedPhotoIndex}
                    legacyException={legacyPhotoException}
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
                  <FieldRow label="혼인 상태" value={basic.maritalStatus === "single" ? "미혼" : basic.maritalStatus || "-"} />
                  <FieldRow label="연락처" value={formatPhone(basic.phone || basic.phoneNormalized)} />
                  <FieldRow label="본인인증" value={getIdentityVerificationLabel(application)} />
                  <FieldRow label="직업" value={`${identity.jobCategory || "-"} · ${identity.organizationName || "-"}`} />
                  <FieldRow label="학력" value={`${identity.educationLevel || "-"}${identity.schoolName ? ` · ${identity.schoolName}` : ""}`} />
                  {identity.jobCategory === "회사원" ? <FieldRow label="회사 유형(신청)" value={identity.companyScale || "미입력"} /> : null}
                  <FieldRow label="지역" value={normalizeArray(basic.activityAreas).join(" · ")} />
                  <FieldRow label="선호지역" value={basic.preferredArea} />
                  <FieldRow label="가능시간" value={formatTimeSlots(basic.availableTimeSlots)} />
                  <FieldRow label="키" value={basic.height ? `${basic.height}cm` : "-"} />
                  <FieldRow label="소개" value={basic.introduction} />
                  <FieldRow label="더미" value={application.isDummy ? "더미 신청자" : "-"} />
                </div>
              </div>
            </Section>

            <Section title="가입 시 입력한 매칭 조건 전체" desc="매칭 검토에 사용하는 지역·일정·생활조건과 가치관입니다.">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <FieldRow label="결혼 방향" value={MATCHING_OPTION_LABELS.marriagePlan?.[matchingPreferences.marriagePlan] || "-"} />
                <FieldRow label="자녀 계획" value={MATCHING_OPTION_LABELS.childrenPlan?.[matchingPreferences.childrenPlan] || "-"} />
                <FieldRow label="종교" value={MATCHING_OPTION_LABELS.religion?.[matchingPreferences.religion] || "-"} />
                <FieldRow label="상대 종교 선호" value={MATCHING_OPTION_LABELS.religionPreference?.[matchingPreferences.religionPreference] || "-"} />
                <FieldRow label="흡연" value={MATCHING_OPTION_LABELS.smoking?.[matchingPreferences.smoking] || "-"} />
                <FieldRow label="상대 흡연 선호" value={MATCHING_OPTION_LABELS.smokingPreference?.[matchingPreferences.smokingPreference] || "-"} />
                <FieldRow label="음주 빈도" value={MATCHING_OPTION_LABELS.drinkingFrequency?.[matchingPreferences.drinkingFrequency] || "-"} />
                <FieldRow label="MBTI" value={application.profileTraits?.mbti || "-"} />
                <FieldRow label="관심사" value={normalizeArray(application.profileTraits?.interests).join(" · ") || "-"} />
                <FieldRow label="희망 연령" value={matchingPreferences.preferredAgeRange ? `${matchingPreferences.preferredAgeRange.min}~${matchingPreferences.preferredAgeRange.max}세` : "상관없음"} />
                <FieldRow label="상대 음주 선호" value={matchingPreferences.preferredDrinking || "-"} />
                <FieldRow label="선호 스타일" value={normalizeArray(matchingPreferences.preferredStyles).join(" · ") || "-"} />
                <FieldRow label="선호 직업군" value={normalizeArray(matchingPreferences.preferredJobCategories).join(" · ") || "-"} />
                <FieldRow label="추가 희망조건" value={matchingPreferences.additionalPreference || "-"} />
                <FieldRow label="활동지역" value={normalizeArray(basic.activityAreas).join(" · ") || "-"} />
                <FieldRow label="가장 편한 지역" value={basic.preferredArea || "-"} />
                <FieldRow label="가능 일정" value={formatTimeSlots(basic.availableTimeSlots)} />
                <FieldRow label="직업군" value={identity.jobCategory || "-"} />
                <FieldRow label="회사·학교명" value={identity.organizationName || "-"} />
                <FieldRow label="최종학력" value={identity.educationLevel || "-"} />
                <FieldRow label="학교명" value={identity.schoolName || "-"} />
                <FieldRow label="회사 유형" value={identity.companyScale || "해당 없음"} />
              </div>
            </Section>

            <Section title="신청·동의·운영 정보" desc="가입 당시 동의와 현재 운영 상태를 한 화면에서 확인합니다.">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <FieldRow label="신청 ID" value={application.id || "-"} />
                <FieldRow label="회원 UID" value={application.uid || application.ownerUid || "-"} />
                <FieldRow label="회차" value={`${application.roundLabel || "-"} · ${application.roundId || "-"}`} />
                <FieldRow label="신청/검토" value={`${getStatusLabel(application.status)} · ${getStatusLabel(application.reviewStatus)}`} />
                <FieldRow label="매칭/다음 회차" value={`${getStatusLabel(application.matchingStatus)} · ${getStatusLabel(application.nextRoundStatus)}`} />
                <FieldRow label="사진" value={`${profilePhotoCount}장${legacyPhotoException ? " · 기존 승인 예외" : ""}`} />
                <FieldRow label="인증자료" value={identity.verificationDocument?.url ? "제출됨" : "미제출"} />
                <FieldRow label="본인인증" value={getIdentityVerificationLabel(application)} />
                <FieldRow label="개인정보 동의" value={consents.privacy ? "동의" : "미동의"} />
                <FieldRow label="프로필 공개 동의" value={consents.profileContact ? "동의" : "미동의"} />
                <FieldRow label="예치금·노쇼 동의" value={consents.noShowDeposit ? "동의" : "미동의"} />
                <FieldRow label="허위정보 책임 동의" value={consents.falseInfo ? "동의" : "미동의"} />
                <FieldRow label="마케팅 동의" value={consents.marketing ? "동의" : "미동의"} />
                <FieldRow label="신청 시각" value={formatDate(application.createdAtClient || application.createdAt)} />
                <FieldRow label="승인 시각" value={formatDate(application.approvedAtClient || application.approvedAt)} />
                <FieldRow label="최근 변경" value={formatDate(application.updatedAtClient || application.updatedAt)} />
                <FieldRow label="프로필 재검토" value={application.profileReview?.status || "없음"} />
              </div>
            </Section>

            <Section title="마케팅 유입" desc="자동 추적값, 가입자 본인 응답, 추천인 입력은 서로 분리해 표시합니다.">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <FieldRow
                  label="최초 유입"
                  value={application?.marketingAttribution
                    ? `${String(application.marketingAttribution.firstSource || "DIRECT").toUpperCase()}${application.marketingAttribution.firstCampaign ? ` / ${application.marketingAttribution.firstCampaign}` : ""}`
                    : "기록없음"}
                />
                <FieldRow
                  label="마지막 유입"
                  value={application?.marketingAttribution
                    ? `${String(application.marketingAttribution.lastSource || application.marketingAttribution.firstSource || "DIRECT").toUpperCase()}${application.marketingAttribution.lastCampaign ? ` / ${application.marketingAttribution.lastCampaign}` : ""}`
                    : "기록없음"}
                />
                <FieldRow
                  label="본인 응답"
                  value={application?.selfReportedSource
                    ? `${application.selfReportedSource}${application.selfReportedSourceDetail ? ` · ${application.selfReportedSourceDetail}` : ""}`
                    : "미응답"}
                />
                <FieldRow
                  label="추천인"
                  value={application?.referral
                    ? `${application.referral.referrerNameInput || "입력 없음"}${application.referral.referrerPhoneLast4Input ? ` · 뒤 ${application.referral.referrerPhoneLast4Input}` : ""} (${application.referral.status || "none"})`
                    : "기록없음"}
                />
              </div>
            </Section>

            {application?.profileReview?.status === "needs_review" || application?.verificationReview?.status === "needs_review" ? (
              <Section title="프로필 재검토" desc="변경된 사진·직업정보·인증자료는 승인 전까지 다음 매칭에 사용되지 않습니다.">
                <div className="border border-amber-200 bg-amber-50 p-4">
                  <div className="text-sm font-black text-amber-900">재검토 필요</div>
                  <div className="mt-2 text-xs font-semibold leading-6 text-amber-800">
                    변경 항목: {normalizeArray(application?.profileReview?.changedFields).join(" · ") || "직업 인증자료"}<br />
                    요청 시각: {formatDate(application?.profileReview?.requestedAtClient || application?.verificationReview?.submittedAtClient) || "-"}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ActionButton
                      disabled={busy || !identityVerified || !profilePhotosReady}
                      onClick={async () => {
                        const updated = await onUpdate(application.id, {
                          reviewStatus: "approved",
                          status: "approved",
                          matchingStatus: application?.matchingAvailability === "paused" ? "paused" : "not_started",
                          nextRoundStatus: application?.matchingAvailability === "paused" ? "paused" : "ready",
                          "profileReview.status": "approved",
                          "profileReview.reviewedAt": serverTimestamp(),
                          "profileReview.reviewedAtClient": new Date().toISOString(),
                          "verificationReview.status": "approved",
                          "verificationReview.reviewedAt": serverTimestamp(),
                          "verificationReview.reviewedAtClient": new Date().toISOString(),
                          updatedAt: serverTimestamp(),
                        });
                        if (updated) alert("재검토 승인 완료");
                      }}
                      tone="good"
                    >
                      재검토 승인
                    </ActionButton>
                    <ActionButton
                      disabled={busy}
                      onClick={() => onUpdate(application.id, {
                        reviewStatus: "incomplete",
                        "profileReview.status": "revision_requested",
                        "verificationReview.status": "revision_requested",
                        updatedAt: serverTimestamp(),
                      })}
                      tone="warn"
                    >
                      보완 필요 상태
                    </ActionButton>
                  </div>
                </div>
              </Section>
            ) : null}

            <Section
              title="내부 매칭 평가"
              desc="관리자만 보는 내부 참고값입니다. 선택하지 않으면 모두 3(보통)으로 적용하며, 후보를 막지 않고 추천 순서에만 작게 반영합니다."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="border border-zinc-200 bg-white p-4">
                  <div className="text-sm font-black text-zinc-950">프로필 매력도</div>
                  <p className="mt-1 text-xs font-semibold leading-5 text-zinc-400">사진·스타일·첫인상을 종합한 내부 참고값</p>
                  <div className="mt-3">
                    <RatingSelector
                      value={adminMetaDraft.profileAppeal}
                      disabled={adminMetaSaving || busy}
                      onChange={(value) => setAdminMetaDraft((prev) => ({ ...prev, profileAppeal: value }))}
                    />
                  </div>
                </div>

                <div className="border border-zinc-200 bg-white p-4">
                  <div className="text-sm font-black text-zinc-950">조건 경쟁력</div>
                  <p className="mt-1 text-xs font-semibold leading-5 text-zinc-400">직업·회사·학력·나이 등 현재 회원풀 기준 내부 참고값</p>
                  <div className="mt-3">
                    <RatingSelector
                      value={adminMetaDraft.conditionCompetitiveness}
                      disabled={adminMetaSaving || busy}
                      onChange={(value) => setAdminMetaDraft((prev) => ({ ...prev, conditionCompetitiveness: value }))}
                    />
                  </div>
                </div>

                <div className="border border-zinc-200 bg-white p-4">
                  <div className="text-sm font-black text-zinc-950">매칭 신뢰도</div>
                  <p className="mt-1 text-xs font-semibold leading-5 text-zinc-400">인증 충실도·응답성·실제 만남 의사를 종합한 내부 참고값</p>
                  <div className="mt-3">
                    <RatingSelector
                      value={adminMetaDraft.matchingReliability}
                      disabled={adminMetaSaving || busy}
                      onChange={(value) => setAdminMetaDraft((prev) => ({ ...prev, matchingReliability: value }))}
                    />
                  </div>
                </div>

                <div className="border border-zinc-200 bg-white p-4">
                  <div className="text-sm font-black text-zinc-950">회사 유형 확인</div>
                  <p className="mt-1 text-xs font-semibold leading-5 text-zinc-400">
                    {identity.jobCategory === "회사원"
                      ? `신청자 선택: ${identity.companyScale || "미입력"} · 인증자료 확인 후 필요할 때만 수정`
                      : "회사원 회원에게만 적용됩니다."}
                  </p>
                  {identity.jobCategory === "회사원" ? (
                    <select
                      value={adminMetaDraft.companyScaleVerified}
                      disabled={adminMetaSaving || busy}
                      onChange={(event) => setAdminMetaDraft((prev) => ({ ...prev, companyScaleVerified: event.target.value }))}
                      className="mt-3 h-10 w-full border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-800 outline-none focus:border-zinc-950 disabled:opacity-50"
                    >
                      <option value="">확인 필요</option>
                      {COMPANY_SCALE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : (
                    <div className="mt-3 text-sm font-bold text-zinc-400">해당 없음</div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-zinc-200 bg-zinc-50 p-3">
                <div className="break-keep text-xs font-semibold leading-5 text-zinc-500">
                  기본값은 3 · 점수 차이는 자동매칭 후보를 제외하지 않고 비슷한 밸런스를 우선 보여주는 용도로만 사용합니다.
                </div>
                <ActionButton
                  disabled={adminMetaSaving || busy}
                  onClick={() => saveAdminMatchingMeta({ showMessage: true })}
                  tone="dark"
                >
                  {adminMetaSaving ? "저장 중..." : "내부평가 저장"}
                </ActionButton>
              </div>
            </Section>

            <Section title="노쇼·당일취소 관리" desc="행동 기준은 성별과 관계없이 동일하며, 예치금 차감 여부만 회원별 정책을 따릅니다.">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <FieldRow label="노쇼" value={`${Number(sanctionSummary.noShowCount || 0)}회`} />
                <FieldRow label="당일취소" value={`${Number(sanctionSummary.sameDayCancelCount || 0)}회`} />
                <FieldRow label="현재 상태" value={getSanctionStatusLabel(application)} />
                <FieldRow label="제재 종료" value={formatDate(sanctionSummary.restrictedUntil)} />
                <FieldRow label="예치금 정책" value={isDepositWaived(deposit) ? "예치금 면제" : "예치금 필수"} />
              </div>

              {isMatchingRestricted(application) ? (
                <div className="mt-3 border border-rose-200 bg-rose-50 p-3 text-sm font-black text-rose-800">
                  현재 제재로 매칭 대상에서 제외됩니다. 해제 또는 운영자 예외처리 후 다시 판정됩니다.
                </div>
              ) : null}

              <textarea
                value={sanctionMemo}
                onChange={(event) => setSanctionMemo(event.target.value)}
                rows={3}
                maxLength={500}
                placeholder="운영자 메모 (예: 10/20 무단불참, 질병 증빙 확인)"
                className="mt-4 w-full resize-none border border-zinc-200 bg-white p-3 text-sm font-semibold leading-6 text-zinc-800 outline-none focus:border-zinc-950"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <ActionButton disabled={busy || sanctionBusy} onClick={() => runSanctionAction("record_no_show", "노쇼 등록")} tone="bad">노쇼 등록</ActionButton>
                <ActionButton disabled={busy || sanctionBusy} onClick={() => runSanctionAction("record_same_day_cancel", "당일취소 등록")} tone="warn">당일취소 등록</ActionButton>
                <ActionButton disabled={busy || sanctionBusy} onClick={() => runSanctionAction("warning", "경고 등록")} tone="warn">경고 등록</ActionButton>
                <ActionButton disabled={busy || sanctionBusy} onClick={() => runSanctionAction("restrict_next_round", "다음 1회차 제한")} tone="bad">다음 1회차 제한</ActionButton>
                <ActionButton disabled={busy || sanctionBusy} onClick={() => runSanctionAction("restrict_30_days", "30일 제한")} tone="bad">30일 제한</ActionButton>
                <ActionButton disabled={busy || sanctionBusy} onClick={() => runSanctionAction("release", "제재 해제")} tone="good">제재 해제</ActionButton>
                <ActionButton disabled={busy || sanctionBusy} onClick={() => runSanctionAction("exception", "운영자 예외")} tone="light">운영자 예외처리</ActionButton>
                <ActionButton disabled={busy || sanctionBusy || isDepositWaived(deposit)} onClick={() => runSanctionAction("waive_deposit", "예치금 면제")} tone="light">예치금 면제</ActionButton>
                <ActionButton disabled={busy || sanctionBusy || !isDepositWaived(deposit)} onClick={() => runSanctionAction("require_deposit", "예치금 필수 전환")} tone="light">예치금 필수 전환</ActionButton>
              </div>

              <div className="mt-4 border border-zinc-200 bg-white">
                <div className="border-b border-zinc-100 px-4 py-3 text-xs font-black text-zinc-500">제재 처리 이력</div>
                {sanctionLoading ? (
                  <div className="px-4 py-5 text-xs font-bold text-zinc-400">불러오는 중...</div>
                ) : sanctionHistory.length ? (
                  <div className="divide-y divide-zinc-100">
                    {sanctionHistory.map((item) => (
                      <div key={item.id} className="grid gap-1 px-4 py-3 text-xs font-semibold text-zinc-600 sm:grid-cols-[150px_1fr_auto]">
                        <div className="font-black text-zinc-900">{item.type || item.action || "처리"}</div>
                        <div>{item.adminMemo || "메모 없음"}{item.matchId ? ` · 매칭 ${item.matchId}` : ""}</div>
                        <div className="text-zinc-400">{formatDate(item.occurredAtClient || item.occurredAt)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-5 text-xs font-bold text-zinc-400">등록된 제재 이력이 없습니다.</div>
                )}
              </div>
            </Section>

            <NoResponseReviewPanel application={application} onUpdate={onUpdate} busy={busy} />

            <Section title="예치금 현황" desc="현재 잔액, 차감 내역, 다음 매칭 전 추가 예치 필요 금액을 관리합니다.">
              <div className="mb-4 border border-zinc-300 bg-zinc-50 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="text-sm font-black text-zinc-950">이 회원의 기준 예치금</div>
                    <p className="mt-1 break-keep text-xs font-semibold leading-5 text-zinc-500">
                      외부 플랫폼 참여자는 20,000원, 일반 신청자는 30,000원을 선택할 수 있습니다. 면제 대상은 0원으로 설정하세요.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {TWOWEEKS_DEPOSIT_PRESET_AMOUNTS.map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          disabled={busy}
                          onClick={() => setDepositAmountInput(String(amount))}
                          className={`h-10 border px-4 text-sm font-black transition disabled:opacity-50 ${selectedDepositAmount === amount
                            ? "border-zinc-950 bg-zinc-950 text-white"
                            : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-950"
                          }`}
                        >
                          {formatWon(amount)}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setDepositAmountInput("0")}
                        className={`h-10 border px-4 text-sm font-black transition disabled:opacity-50 ${selectedDepositAmount === 0
                          ? "border-emerald-700 bg-emerald-700 text-white"
                          : "border-emerald-300 bg-white text-emerald-700 hover:border-emerald-700"
                        }`}
                      >
                        예치금 면제
                      </button>
                    </div>
                  </div>

                  <label className="block w-full max-w-[260px]">
                    <span className="text-xs font-black text-zinc-500">직접 입력</span>
                    <div className="mt-1 flex items-center border border-zinc-300 bg-white px-3 focus-within:border-zinc-950">
                      <input
                        type="number"
                        min="0"
                        max="1000000"
                        step="1000"
                        value={depositAmountInput}
                        disabled={busy}
                        onChange={(event) => setDepositAmountInput(event.target.value)}
                        className="h-11 min-w-0 flex-1 bg-transparent text-right text-base font-black text-zinc-950 outline-none disabled:opacity-50"
                      />
                      <span className="ml-2 text-sm font-bold text-zinc-500">원</span>
                    </div>
                  </label>
                </div>

                {depositAmountValid ? (
                  <div className="mt-3 text-xs font-bold leading-5 text-zinc-500">
                    {selectedDepositAmount === 0
                      ? "예치금 면제 대상 · 차감 및 추가 예치 없음"
                      : `취소 차감 기준 · 확정 전 ${formatWon(selectedDepositPolicy.afterMutualAcceptBeforeScheduleConfirmed.amount)} / 확정 후 ${formatWon(selectedDepositPolicy.afterScheduleConfirmedUntilDayBefore.amount)} / 당일·노쇼 ${formatWon(selectedDepositPolicy.noShow.amount)}`}
                  </div>
                ) : (
                  <div className="mt-3 text-xs font-black text-rose-600">0원 이상 1,000,000원 이하의 금액을 입력해주세요.</div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="border border-zinc-200 bg-white p-3">
                  <div className="text-xs font-bold text-zinc-400">기준 예치금</div>
                  <div className="mt-1 text-xl font-black text-zinc-950">{deposit.status === "waived" ? "면제" : formatWon(depositRequiredBalance)}</div>
                </div>
                <div className="border border-zinc-200 bg-white p-3">
                  <div className="text-xs font-bold text-zinc-400">현재 잔액</div>
                  <div className="mt-1 text-xl font-black text-zinc-950">{formatWon(depositBalance)}</div>
                </div>
                <div className="border border-zinc-200 bg-white p-3">
                  <div className="text-xs font-bold text-zinc-400">누적 차감</div>
                  <div className="mt-1 text-xl font-black text-rose-600">{formatWon(deposit.totalDeducted || 0)}</div>
                </div>
                <div className={`border p-3 ${depositTopUpRequired > 0 ? "border-rose-200 bg-rose-50" : "border-emerald-200 bg-emerald-50"}`}>
                  <div className={`text-xs font-bold ${isDepositTopUpRequired ? "text-rose-500" : ["confirmed", "waived"].includes(deposit.status) ? "text-emerald-600" : deposit.status === "refund_requested" ? "text-amber-600" : "text-zinc-500"}`}>{isDepositTopUpRequired ? "다음 매칭 추가 필요" : deposit.status === "waived" ? "면제 상태" : deposit.status === "confirmed" ? "추가 필요" : deposit.status === "refund_requested" ? "반환 상태" : deposit.status === "refunded" ? "반환 상태" : "최초 예치 필요"}</div>
                  <div className={`mt-1 text-xl font-black ${isDepositTopUpRequired ? "text-rose-700" : ["confirmed", "waived"].includes(deposit.status) ? "text-emerald-700" : deposit.status === "refund_requested" ? "text-amber-700" : "text-zinc-800"}`}>{deposit.status === "waived" ? "면제" : ["refund_requested", "refunded"].includes(deposit.status) ? (deposit.status === "refund_requested" ? "처리중" : "완료") : formatWon(depositTopUpRequired)}</div>
                </div>
              </div>

              {isDepositTopUpRequired ? (
                <div className="mt-3 border border-rose-200 bg-rose-50 p-4">
                  <div className="text-sm font-black text-rose-900">추가 예치 확인 전 다음 매칭 제한</div>
                  <p className="mt-1 break-keep text-xs font-semibold leading-5 text-rose-700">
                    현재 잔액이 기준 예치금 {formatWon(depositRequiredBalance)}보다 부족합니다. 추가 예치금 {formatWon(depositTopUpRequired)} 입금 확인 후 다음 매칭 가능 상태로 전환하세요.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ActionButton
                      disabled={busy}
                      onClick={() => onSendDepositTopUpReminder?.(application)}
                      tone="warn"
                    >
                      추가 예치 안내문자
                    </ActionButton>
                    <ActionButton
                      disabled={busy}
                      onClick={() => onConfirmDepositTopUp?.(application)}
                      tone="good"
                    >
                      추가 예치 입금확인
                    </ActionButton>
                  </div>
                  {deposit.topUpReminderSentAtClient ? (
                    <div className="mt-2 text-xs font-bold text-rose-500">최근 추가 예치 안내: {formatDate(deposit.topUpReminderSentAtClient)}</div>
                  ) : null}
                </div>
              ) : deposit.status === "waived" ? (
                <div className="mt-3 border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
                  예치금 면제 대상으로 설정되어 추가 입금 없이 매칭 참여가 가능합니다.
                </div>
              ) : deposit.status === "confirmed" ? (
                <div className="mt-3 border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
                  예치금 기준액이 충족되어 다음 매칭 참여가 가능합니다.
                </div>
              ) : ["refund_requested", "refunded"].includes(deposit.status) ? (
                <div className="mt-3 border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
                  {deposit.status === "refund_requested" ? "예치금 반환 요청 처리 중입니다." : "예치금 반환이 완료되어 현재 잔액은 0원입니다."}
                </div>
              ) : (
                <div className="mt-3 border border-zinc-200 bg-zinc-50 p-4">
                  <div className="text-sm font-bold text-zinc-700">
                    최초 예치금 {formatWon(depositRequiredBalance)} 입금 확인 전입니다.
                  </div>
                  {isInitialDepositPending ? (
                    <>
                      <p className="mt-1 break-keep text-xs font-semibold leading-5 text-zinc-500">
                        프로필 승인은 완료됐지만 기준 예치금이 충족되지 않아 아직 매칭 대상이 아닙니다.
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <ActionButton
                          disabled={busy}
                          onClick={() => onSendInitialDepositReminder?.(application)}
                          tone="warn"
                        >
                          {deposit.requestStage === "later" ? "입금 요청하기" : "예치금 재안내"}
                        </ActionButton>
                        <span className="text-xs font-bold text-zinc-500">
                          발송 {initialReminderSentCount}회
                          {deposit.initialReminderLastSentAtClient
                            ? ` · 최근 ${formatDate(deposit.initialReminderLastSentAtClient)}`
                            : ""}
                        </span>
                      </div>
                    </>
                  ) : !profileApproved ? (
                    <p className="mt-1 text-xs font-semibold text-zinc-500">프로필 승인 완료 후 재안내할 수 있습니다.</p>
                  ) : null}
                </div>
              )}

              {refundPending ? (
                <div className="mt-4 border border-amber-200 bg-amber-50 p-4">
                  <div className="text-sm font-black text-amber-900">예치금 반환 요청 접수</div>
                  <p className="mt-1 break-keep text-xs font-semibold leading-5 text-amber-800">
                    실제 계좌 송금을 완료한 뒤 아래 버튼을 눌러주세요. 완료 처리 시 예치금 잔액은 0원이 되고 고객에게 반환 완료 문자가 발송됩니다.
                  </p>
                  <div className="mt-3 grid gap-2 border border-amber-200 bg-white px-4 py-3 text-xs font-bold text-zinc-700 sm:grid-cols-2 lg:grid-cols-4">
                    <div>반환액 <span className="text-zinc-950">{formatWon(refundRequest.requestedAmount || depositBalance)}</span></div>
                    <div>은행 <span className="text-zinc-950">{refundRequest.bankName || "-"}</span></div>
                    <div>계좌 <span className="text-zinc-950">{refundRequest.accountNumber || "-"}</span></div>
                    <div>예금주 <span className="text-zinc-950">{refundRequest.accountHolder || "-"}</span></div>
                  </div>
                  <div className="mt-2 text-xs font-bold text-amber-700">
                    요청 {formatDate(refundRequest.requestedAtClient)} · 처리기한 {formatDate(refundRequest.dueAtClient)}
                  </div>
                  <div className="mt-3">
                    <ActionButton
                      disabled={busy}
                      onClick={() => onCompleteDepositRefund?.(application)}
                      tone="good"
                    >
                      {refundBusy ? "처리 중..." : "예치금 반환완료"}
                    </ActionButton>
                  </div>
                </div>
              ) : null}

              <div className="mt-4 border border-zinc-200 bg-white">
                <div className="border-b border-zinc-100 px-4 py-3 text-xs font-black text-zinc-500">예치금 입금·차감·반환 히스토리</div>
                {depositHistory.length ? (
                  <div className="divide-y divide-zinc-100">
                    {depositHistory.map((item) => (
                      <div key={item.id || `${item.type}-${item.createdAtClient}`} className="grid gap-1 px-4 py-3 text-xs font-semibold text-zinc-600 sm:grid-cols-[120px_1fr_auto] sm:items-center">
                        <div className="font-black text-zinc-800">{item.type === "deduction" ? "차감" : item.type === "top_up" ? "추가 예치" : item.type === "initial_deposit" ? "최초 예치" : item.type === "deposit_waiver" ? "예치금 면제" : item.type === "required_balance_adjustment" ? "기준 변경" : item.type === "refund_request" ? "반환 요청" : item.type === "refund" ? "반환 완료" : item.type || "예치금"}</div>
                        <div className="break-keep">{item.note || item.reason || "-"}<span className="ml-2 text-zinc-400">잔액 {formatWon(item.balanceAfter || 0)}</span></div>
                        <div className="text-zinc-400">{item.createdAtClient ? formatDate(item.createdAtClient) : "-"}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-xs font-bold text-zinc-400">아직 예치금 히스토리가 없습니다.</div>
                )}
              </div>
            </Section>

            <Section title="신청 완료/보완 문자" desc="신규 회원은 프로필 사진 최소 3장, 입금 확인과 운영자 검토가 모두 끝났을 때 신청 완료 문자를 발송합니다. 기존 승인 1~2장 회원은 예외입니다.">
              <div className="grid gap-3 lg:grid-cols-[1fr_1.3fr]">
                <div className="border border-zinc-200 bg-white p-3">
                  <div className="mb-3 text-xs font-black text-zinc-400">신청 완료 처리</div>
                  <p className="mb-3 break-keep text-sm font-semibold leading-6 text-zinc-500">
                    입금 확인 + 프로필 이상 없음 상태로 처리하고, 매칭 가능 상태 안내 문자를 보냅니다.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <ActionButton
                      disabled={busy || !identityVerified || !profilePhotosReady || !depositAmountValid}
                      onClick={() => saveMetaThen(() => onCompleteWithSms?.(application, selectedDepositAmount))}
                      tone="good"
                    >
                      신청완료 + 문자
                    </ActionButton>
                    <ActionButton
                      disabled={busy || !identityVerified || !profilePhotosReady || !depositAmountValid}
                      onClick={() => saveMetaThen(() => onApproveWithSms(application, selectedDepositAmount))}
                      tone="light"
                    >
                      프로필승인+예치금안내
                    </ActionButton>
                  </div>
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

            <Section title="상태 수동 변경" desc="프로필 승인과 입금 확인이 모두 끝나면 자동으로 매칭 대기로 전환됩니다. 후보 제안/확정은 매칭보드에서 처리합니다.">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="border border-zinc-200 bg-white p-3">
                  <div className="mb-3 text-xs font-black text-zinc-400">검토 상태</div>
                  <div className="flex flex-wrap gap-2">
                    <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { reviewStatus: "reviewing", updatedAt: serverTimestamp() })} tone="light">검토중</ActionButton>
                    <ActionButton disabled={busy || adminMetaSaving || !identityVerified || !profilePhotosReady} onClick={() => saveMetaThen(() => onUpdate(application.id, { reviewStatus: "approved", status: "approved", updatedAt: serverTimestamp() }))} tone="good">승인</ActionButton>
                    <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { reviewStatus: "waitlisted", updatedAt: serverTimestamp() })} tone="warn">대기풀</ActionButton>
                    <ActionButton disabled={busy} onClick={() => onUpdate(application.id, { reviewStatus: "rejected", status: "rejected", updatedAt: serverTimestamp() })} tone="bad">반려</ActionButton>
                  </div>
                </div>

                <div className="border border-zinc-200 bg-white p-3">
                  <div className="mb-3 text-xs font-black text-zinc-400">입금 상태</div>
                  <div className="flex flex-wrap gap-2">
                    <ActionButton disabled={busy || !depositAmountValid || selectedDepositAmount === 0} onClick={() => onUpdate(application.id, { "deposit.policy": "required", "deposit.status": "pending", "deposit.waived": false, "deposit.amount": selectedDepositAmount, "deposit.balance": 0, "deposit.requiredBalance": selectedDepositAmount, "deposit.topUpRequiredAmount": selectedDepositAmount, "deposit.policySnapshot": getDepositPolicySnapshot(selectedDepositAmount), "deposit.participationEligible": false, updatedAt: serverTimestamp() })} tone="light">대기</ActionButton>
                    <ActionButton disabled={busy || !identityVerified || !depositAmountValid || selectedDepositAmount === 0} onClick={() => onUpdate(application.id, { "deposit.policy": "required", "deposit.status": "confirmed", "deposit.waived": false, "deposit.amount": selectedDepositAmount, "deposit.balance": selectedDepositAmount, "deposit.requiredBalance": selectedDepositAmount, "deposit.topUpRequiredAmount": 0, "deposit.policySnapshot": getDepositPolicySnapshot(selectedDepositAmount), "deposit.participationEligible": true, "deposit.confirmedAt": serverTimestamp(), updatedAt: serverTimestamp() })} tone="good">입금확인</ActionButton>
                    <ActionButton disabled={busy || !identityVerified || selectedDepositAmount !== 0} onClick={() => saveMetaThen(() => onCompleteWithSms?.(application, 0))} tone="good">면제 + 신청완료 문자</ActionButton>
                    <ActionButton disabled={busy || !identityVerified || selectedDepositAmount !== 0} onClick={() => onUpdate(application.id, { "deposit.policy": "waived", "deposit.status": "waived", "deposit.waived": true, "deposit.requiredBalance": 0, "deposit.balance": 0, "deposit.topUpRequiredAmount": 0, "deposit.participationEligible": true, updatedAt: serverTimestamp() })} tone="light">면제 상태 저장</ActionButton>
                    <span className="inline-flex items-center px-1 text-xs font-bold text-zinc-400">반환은 ‘예치금관리’에서 처리</span>
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
