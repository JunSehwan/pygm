import { useState } from "react";
import MyProfileEditModal from "./MyProfileEditModal";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getBasic(application = {}) {
  return application?.basic || {};
}

function getIdentity(application = {}) {
  return application?.identity || {};
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function formatBirthYear(value) {
  const year = Number(value || 0);
  if (!year) return "-";
  return `${String(year).slice(-2)}년생`;
}

function getGenderLabel(value = "") {
  if (value === "male") return "남성";
  if (value === "female") return "여성";
  return "-";
}

function getStatusLabel(value = "") {
  const labels = {
    applied: "신청 완료",
    pending: "검토 대기",
    reviewing: "검토 중",
    approved: "검토 완료",
    not_started: "매칭 대기",
    proposed: "제안 도착",
    accepted: "수락 완료",
    declined: "거절 완료",
    confirmed: "확정",
    completed: "완료",
    cancelled: "취소",
    rejected: "반려",
    withdrawn: "철회",
  };

  return labels[value] || value || "-";
}

function getResponseLabel(value = "") {
  const labels = {
    accepted: "만나볼게요",
    declined: "패스",
    pending: "응답 대기",
    confirmed: "확정",
  };

  return labels[value] || value || "응답 전";
}

function formatPhone(value = "") {
  const digits = String(value || "").replace(/[^0-9]/g, "");

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  return value || "-";
}

function formatDateTime(value) {
  if (!value) return "-";

  let date = null;

  if (typeof value?.toDate === "function") {
    date = value.toDate();
  } else if (typeof value?.seconds === "number") {
    date = new Date(value.seconds * 1000);
  } else if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) date = new Date(parsed);
  }

  if (!date) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getPhotos(application = {}) {
  const identity = getIdentity(application);
  const photos = [];

  if (identity.representativePhoto?.url) {
    photos.push({
      label: "대표",
      url: identity.representativePhoto.url,
    });
  }

  normalizeArray(identity.additionalPhotos).forEach((photo, index) => {
    if (photo?.url) {
      photos.push({
        label: `추가 ${index + 1}`,
        url: photo.url,
      });
    }
  });

  return photos.slice(0, 4);
}

function isProfileEditable(application = {}) {
  const status = String(application?.status || "");
  const matchingStatus = String(application?.matchingStatus || "");
  const scheduleStatus = String(application?.scheduleStatus || application?.meetingStatus || "");
  const proposalStatus = String(application?.currentProposal?.status || "");

  if (["cancelled", "withdrawn", "rejected"].includes(status)) return false;
  if (["confirmed", "completed"].includes(matchingStatus)) return false;
  if (["confirmed", "completed"].includes(scheduleStatus)) return false;
  if (["confirmed", "completed"].includes(proposalStatus)) return false;

  return true;
}

function Row({ label, value }) {
  return (
    <div className="grid grid-cols-[78px_1fr] gap-3 border-t border-zinc-100 py-3 first:border-t-0 sm:grid-cols-[100px_1fr]">
      <div className="text-xs font-bold text-zinc-400">{label}</div>
      <div className="break-keep text-sm font-semibold leading-6 text-zinc-800">{value || "-"}</div>
    </div>
  );
}

function InfoBox({ label, value, tone = "default" }) {
  return (
    <div
      className={cx(
        "rounded-xl p-4",
        tone === "dark" ? "bg-zinc-950 text-white" : "bg-zinc-50 text-zinc-950"
      )}
    >
      <div className="text-xs font-bold text-zinc-400">{label}</div>
      <div className="mt-1 break-keep text-base font-black tracking-[-0.03em]">
        {value || "-"}
      </div>
    </div>
  );
}

function SectionCard({ eyebrow, title, action, children }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_14px_46px_rgba(0,0,0,0.045)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow ? (
            <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
              {eyebrow}
            </div>
          ) : null}
          <h2 className="mt-2 text-2xl font-black tracking-[-0.045em] text-zinc-950">
            {title}
          </h2>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function PhotoStrip({ photos = [], blurred = false }) {
  if (!photos.length) {
    return (
      <div className="flex min-h-[190px] items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-sm font-bold text-zinc-400">
        사진 확인 중
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
      {photos.map((photo, index) => (
        <div
          key={`${photo.url}_${index}`}
          className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100"
        >
          <div className="relative aspect-[4/5]">
            <img
              src={photo.url}
              alt={photo.label || "프로필 사진"}
              className={cx(
                "h-full w-full object-cover",
                blurred ? "scale-105 blur-[14px] brightness-95" : ""
              )}
            />
            <div className="absolute left-2 top-2 rounded-md bg-black/60 px-2.5 py-1 text-[10px] font-black text-white sm:left-3 sm:top-3 sm:text-[11px]">
              {photo.label || `사진 ${index + 1}`}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { id: "status", label: "신청현황" },
  { id: "profile", label: "내 프로필" },
  { id: "candidate", label: "대상후보" },
  { id: "result", label: "결과보기" },
];

function TabNav({ activeTab, onChange }) {
  return (
    <div className="sticky top-16 z-30 -mx-2 mt-5 border-y border-zinc-200/80 bg-[#f6f3ef]/95 px-2 py-2 backdrop-blur md:top-20 sm:mx-0 sm:px-0">
      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-1.5 rounded-xl border border-zinc-200 bg-white p-1 shadow-[0_8px_28px_rgba(0,0,0,0.045)]">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                className={cx(
                  "h-10 rounded-lg px-3.5 text-sm font-black transition sm:px-5",
                  active
                    ? "bg-zinc-950 text-white"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatusTab({ application }) {
  const basic = getBasic(application);
  const deposit = application?.deposit || {};
  const auth = application?.phoneIdentityVerification || {};

  return (
    <div className="grid gap-4">
      <SectionCard eyebrow="status" title="신청 현황">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoBox label="신청 상태" value={getStatusLabel(application?.status)} tone="dark" />
          <InfoBox label="검토 상태" value={getStatusLabel(application?.reviewStatus)} />
          <InfoBox label="매칭 상태" value={getStatusLabel(application?.matchingStatus)} />
          <InfoBox label="회차" value={application?.roundLabel || application?.roundId || "-"} />
        </div>

        <div className="mt-5 rounded-xl border border-zinc-200 p-4 sm:p-5">
          <Row label="신청자" value={`${basic.nickname || basic.name || "-"} · ${getGenderLabel(basic.gender)} · ${basic.age || "-"}세`} />
          <Row label="연락처" value={formatPhone(basic.phone || basic.phoneNormalized || auth.phone)} />
          <Row label="예치금" value={`${deposit.amount ? `${deposit.amount.toLocaleString()}원` : "-"} · ${getStatusLabel(deposit.status || "pending")}`} />
          <Row label="신청일" value={formatDateTime(application?.submittedAt || application?.createdAt || application?.completedAtClient)} />
        </div>
      </SectionCard>
    </div>
  );
}

function ProfileTab({
  application,
  savingProfile,
  profileUploadProgress,
  onSaveProfile,
}) {
  const [editOpen, setEditOpen] = useState(false);
  const basic = getBasic(application);
  const identity = getIdentity(application);
  const photos = getPhotos(application);
  const editable = isProfileEditable(application);

  const handleSave = async (form) => {
    await onSaveProfile?.(form);
    setEditOpen(false);
  };

  return (
    <>
      <SectionCard
        eyebrow="my profile"
        title="내 프로필"
        action={
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            disabled={!editable}
            className="h-11 rounded-lg bg-zinc-950 px-5 text-sm font-black text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
          >
            {editable ? "프로필 수정" : "수정 잠금"}
          </button>
        }
      >
        <PhotoStrip photos={photos} />

        <div className="mt-5 rounded-xl border border-zinc-200 p-4 sm:p-5">
          <Row label="닉네임" value={basic.nickname} />
          <Row label="출생연도" value={formatBirthYear(basic.birthYear)} />
          <Row label="직업군" value={identity.jobCategory} />
          <Row label="회사/학교" value={identity.organizationName} />
          <Row label="활동 지역" value={normalizeArray(basic.activityAreas).join(" · ")} />
          <Row label="선호 지역" value={basic.preferredArea} />
          <Row label="가능 시간" value={normalizeArray(basic.availableTimeSlots).join(" · ")} />
          <Row label="키" value={basic.height ? `${basic.height}cm` : "-"} />
          <Row label="소개" value={basic.introduction} />
        </div>
      </SectionCard>

      <MyProfileEditModal
        open={editOpen}
        application={application}
        editable={editable}
        saving={savingProfile}
        uploadProgress={profileUploadProgress}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}

function CandidateTab({ bestMatch, responseStatus, savingResponse, onRespond }) {
  const candidate = bestMatch?.candidate;

  if (!candidate) {
    return (
      <SectionCard eyebrow="candidate" title="대상후보">
        <div className="rounded-xl bg-zinc-50 p-8 text-center">
          <div className="text-xl font-black tracking-[-0.04em] text-zinc-950">
            아직 표시할 후보가 없습니다
          </div>
          <p className="mt-2 break-keep text-sm leading-6 text-zinc-500">
            후보가 준비되면 이곳에서 확인할 수 있습니다.
          </p>
        </div>
      </SectionCard>
    );
  }

  const basic = getBasic(candidate);
  const identity = getIdentity(candidate);
  const photos = getPhotos(candidate);
  const score = bestMatch?.score || {};

  return (
    <SectionCard eyebrow="candidate" title="대상후보">
      <PhotoStrip photos={photos} blurred />

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.88fr]">
        <div className="rounded-xl border border-zinc-200 p-4 sm:p-5">
          <Row label="출생연도" value={formatBirthYear(basic.birthYear)} />
          <Row label="직업군" value={identity.jobCategory} />
          <Row label="활동 지역" value={normalizeArray(basic.activityAreas).join(" · ")} />
          <Row label="가능 시간" value={normalizeArray(basic.availableTimeSlots).join(" · ")} />
          <Row label="키" value={basic.height ? `${basic.height}cm` : "-"} />
          <Row label="소개" value={basic.introduction} />
        </div>

        <div className="rounded-xl bg-zinc-950 p-5 text-white">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-400">matching</div>
          <div className="mt-3 text-3xl font-black tracking-[-0.05em]">
            {Number.isFinite(score.total) ? `${score.total}점` : "검토중"}
          </div>
          <div className="mt-4 space-y-2 text-sm leading-6 text-zinc-300">
            <p>지역: {normalizeArray(score.areaOverlap).join(" · ") || "확인중"}</p>
            <p>시간: {normalizeArray(score.timeOverlap).join(" · ") || "확인중"}</p>
            <p>나이: {score.agePriority?.diffLabel || "확인중"}</p>
          </div>
        </div>
      </div>

      {responseStatus ? (
        <div className="mt-5 rounded-xl bg-zinc-50 p-5 text-center text-sm font-black text-zinc-950">
          {responseStatus === "accepted" ? "수락 응답이 저장되었습니다." : "거절 응답이 저장되었습니다."}
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onRespond?.("accepted")}
            disabled={savingResponse}
            className="h-14 rounded-lg bg-zinc-950 px-6 text-sm font-black text-white transition hover:bg-zinc-800 disabled:opacity-60"
          >
            만나볼게요
          </button>
          <button
            type="button"
            onClick={() => onRespond?.("declined")}
            disabled={savingResponse}
            className="h-14 rounded-lg border border-zinc-200 px-6 text-sm font-black text-zinc-800 transition hover:border-zinc-950 disabled:opacity-60"
          >
            이번엔 패스할게요
          </button>
        </div>
      )}
    </SectionCard>
  );
}

function ResultTab({ application, responseStatus }) {
  const proposal = application?.currentProposal || {};
  const schedule = application?.schedule || application?.meetingSchedule || {};
  const feedback = application?.feedback || application?.meetingFeedback || {};
  const response = responseStatus || proposal.response || proposal.status;

  return (
    <SectionCard eyebrow="result" title="결과보기">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoBox label="내 응답" value={getResponseLabel(response)} tone="dark" />
        <InfoBox label="상대 응답" value={getResponseLabel(proposal.counterpartResponse || proposal.partnerResponse)} />
        <InfoBox label="매칭 결과" value={getStatusLabel(application?.matchingStatus)} />
        <InfoBox label="일정" value={getStatusLabel(schedule.status || application?.scheduleStatus)} />
      </div>

      <div className="mt-5 rounded-xl border border-zinc-200 p-4 sm:p-5">
        <Row label="만남 일시" value={formatDateTime(schedule.date || schedule.datetime || schedule.confirmedAt)} />
        <Row label="장소" value={schedule.placeName || schedule.location || "-"} />
        <Row label="연락처 공개" value={application?.contactOpenStatus ? getStatusLabel(application.contactOpenStatus) : "상호 희망 시 공개"} />
        <Row label="피드백" value={feedback.status ? getStatusLabel(feedback.status) : "대기"} />
      </div>
    </SectionCard>
  );
}

export default function ProposalDashboard({
  verifiedProfile,
  application,
  bestMatch,
  loading,
  responseStatus,
  savingResponse,
  savingProfile,
  profileUploadProgress,
  onRespond,
  onSaveProfile,
  onResetIdentity,
}) {
  const [activeTab, setActiveTab] = useState("status");

  return (
    <main className="min-h-[calc(100svh-64px)] bg-[#f6f3ef] px-2 py-4 sm:px-4 md:min-h-[calc(100svh-80px)] md:px-8 md:py-7">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex rounded-md bg-orange-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-orange-600">
              2weeks
            </div>
            <h1 className="mt-3 text-[28px] font-black leading-tight tracking-[-0.06em] text-zinc-950 sm:text-[42px] md:text-[52px]">
              신청 현황 조회
            </h1>
            <p className="mt-2 break-keep text-sm leading-6 text-zinc-500 sm:text-base">
              {verifiedProfile?.name ? `${verifiedProfile.name}님, ` : ""}
              신청 상태와 후보를 확인해주세요.
            </p>
          </div>

          <button
            type="button"
            onClick={onResetIdentity}
            className="shrink-0 rounded-lg bg-zinc-950 px-3 py-2 text-xs font-black text-white transition hover:bg-zinc-800 sm:px-4"
          >
            다른 번호 조회
          </button>
        </div>

        <TabNav activeTab={activeTab} onChange={setActiveTab} />

        {loading ? (
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-8 text-center sm:mt-6">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-950" />
            <div className="mt-5 text-sm font-black text-zinc-950">불러오는 중입니다.</div>
          </div>
        ) : application ? (
          <div className="mt-4 sm:mt-6">
            {activeTab === "status" ? <StatusTab application={application} /> : null}
            {activeTab === "profile" ? (
              <ProfileTab
                application={application}
                savingProfile={savingProfile}
                profileUploadProgress={profileUploadProgress}
                onSaveProfile={onSaveProfile}
              />
            ) : null}
            {activeTab === "candidate" ? (
              <CandidateTab
                bestMatch={bestMatch}
                responseStatus={responseStatus}
                savingResponse={savingResponse}
                onRespond={onRespond}
              />
            ) : null}
            {activeTab === "result" ? (
              <ResultTab application={application} responseStatus={responseStatus} />
            ) : null}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-8 text-center">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-zinc-950">
              신청내역이 없습니다.
            </h2>
          </div>
        )}
      </div>
    </main>
  );
}
