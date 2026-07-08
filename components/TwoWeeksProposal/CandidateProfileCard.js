import { useState } from "react";
import { FiCheck, FiX, FiLock, FiMessageCircle } from "react-icons/fi";
import { buildPublicProfile, getPhotoItems } from "./helpers";
import PhotoGallery from "./PhotoGallery";
import MatchingReasonCard from "./MatchingReasonCard";

function Row({ label, value }) {
  return (
    <div className="grid grid-cols-[90px_1fr] gap-3 border-t border-zinc-100 py-3 first:border-t-0">
      <div className="text-xs font-bold text-zinc-400">{label}</div>
      <div className="break-keep text-sm font-semibold leading-6 text-zinc-800">{value || "-"}</div>
    </div>
  );
}

export default function CandidateProfileCard({
  bestMatch,
  responseStatus,
  savingResponse,
  onRespond,
}) {
  const [confirmType, setConfirmType] = useState("");

  if (!bestMatch?.candidate) {
    return (
      <div className="rounded-[32px] border border-zinc-200 bg-white p-7 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-2xl text-zinc-400">
          <FiMessageCircle />
        </div>
        <h2 className="mt-5 text-2xl font-black tracking-[-0.04em] text-zinc-950">
          아직 표시할 후보가 없습니다
        </h2>
        <p className="mt-3 break-keep text-sm leading-7 text-zinc-500">
          신청 인원과 성비에 따라 후보 제안이 준비되지 않았을 수 있습니다.
          운영자가 확인 후 개별 안내드립니다.
        </p>
      </div>
    );
  }

  const candidate = bestMatch.candidate;
  const score = bestMatch.score;
  const publicProfile = buildPublicProfile(candidate);
  const photos = getPhotoItems(candidate);

  const handleConfirm = async () => {
    if (!confirmType) return;
    await onRespond(confirmType);
    setConfirmType("");
  };

  return (
    <div className="rounded-[34px] border border-zinc-200 bg-white p-5 shadow-[0_24px_90px_rgba(0,0,0,0.07)] md:p-7">
      <div className="grid gap-7 lg:grid-cols-[0.86fr_1.14fr]">
        <PhotoGallery photos={photos} />

        <div>
          <div className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-600">
            이번 회차 우선 후보
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-[-0.055em] text-zinc-950">
            {publicProfile.title}
          </h2>

          <p className="mt-2 break-keep text-sm font-semibold leading-6 text-zinc-500">
            {publicProfile.subtitle}
          </p>

          <div className="mt-6 rounded-3xl border border-zinc-200 p-5">
            {publicProfile.rows.map(([label, value]) => (
              <Row key={label} label={label} value={value} />
            ))}
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-zinc-950 px-4 py-4 text-white">
            <FiLock className="mt-1 shrink-0 text-orange-400" />
            <p className="break-keep text-xs leading-6 text-zinc-300">
              실명, 연락처, 회사명, 인증자료는 제안 단계에서 공개되지 않습니다.
              사진은 사용자가 업로드한 이미지를 흐림 처리해 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <MatchingReasonCard score={score} />
      </div>

      {responseStatus ? (
        <div className="mt-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-5 text-center">
          <div className="text-sm font-black text-zinc-950">
            {responseStatus === "accepted" ? "수락 응답이 저장되었습니다." : "거절 응답이 저장되었습니다."}
          </div>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            운영자가 상대방 응답과 일정 가능 여부를 확인한 뒤 다음 안내를 드립니다.
          </p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setConfirmType("accepted")}
            className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 text-sm font-black text-white transition hover:bg-zinc-800"
          >
            <FiCheck />
            만나볼게요
          </button>
          <button
            type="button"
            onClick={() => setConfirmType("declined")}
            className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-full border border-zinc-200 px-6 text-sm font-black text-zinc-800 transition hover:border-zinc-950"
          >
            <FiX />
            이번엔 패스할게요
          </button>
        </div>
      )}

      {confirmType ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 px-5 backdrop-blur-sm">
          <div className="w-full max-w-[420px] rounded-[30px] bg-white p-6 text-center shadow-[0_28px_90px_rgba(0,0,0,0.30)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-950 text-2xl text-white">
              {confirmType === "accepted" ? <FiCheck /> : <FiX />}
            </div>

            <h3 className="mt-5 text-2xl font-black tracking-[-0.04em] text-zinc-950">
              {confirmType === "accepted" ? "이 후보를 만나볼까요?" : "이번 후보를 패스할까요?"}
            </h3>

            <p className="mt-3 break-keep text-sm leading-7 text-zinc-500">
              {confirmType === "accepted"
                ? "응답이 저장되면 운영자가 상대방 응답과 일정 가능 여부를 확인합니다."
                : "패스해도 바로 연락처는 공개되지 않습니다. 후보풀 상황에 따라 다음 후보 제안이 어려울 수 있습니다."}
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmType("")}
                className="h-12 flex-1 rounded-full border border-zinc-200 text-sm font-black text-zinc-700"
              >
                다시 볼게요
              </button>
              <button
                type="button"
                disabled={savingResponse}
                onClick={handleConfirm}
                className="h-12 flex-1 rounded-full bg-zinc-950 text-sm font-black text-white disabled:opacity-60"
              >
                {savingResponse ? "저장 중..." : "확인"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
