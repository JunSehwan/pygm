import { useState } from "react";
import { FiEdit3, FiLock, FiUserCheck } from "react-icons/fi";
import {
  buildMyProfileRows,
  getPhotoItems,
  getProfileEditLockReason,
  isApplicationProfileEditable,
} from "./helpers";
import PhotoGallery from "./PhotoGallery";
import MyProfileEditModal from "./MyProfileEditModal";

function Row({ label, value }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-3 border-t border-zinc-100 py-3 first:border-t-0">
      <div className="text-xs font-bold text-zinc-400">{label}</div>
      <div className="break-keep text-sm font-semibold leading-6 text-zinc-800">{value || "-"}</div>
    </div>
  );
}

export default function MyProfileCard({
  application,
  savingProfile,
  profileUploadProgress,
  onSaveProfile,
}) {
  const [editOpen, setEditOpen] = useState(false);

  if (!application?.id) return null;

  const editable = isApplicationProfileEditable(application);
  const lockReason = getProfileEditLockReason(application);
  const rows = buildMyProfileRows(application);
  const photos = getPhotoItems(application);

  const handleSave = async (form) => {
    await onSaveProfile?.(form);
    setEditOpen(false);
  };

  return (
    <div className="rounded-[34px] border border-zinc-200 bg-white p-5 shadow-[0_24px_90px_rgba(0,0,0,0.07)] md:p-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex rounded-full bg-zinc-950 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-white">
            my profile
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.055em] text-zinc-950">
            상대에게 보여질 내 프로필
          </h2>
          <p className="mt-2 break-keep text-sm leading-7 text-zinc-500">
            투윅스는 얼굴만 고르는 서비스가 아니라, 만나볼 이유를 먼저 제안하는 서비스입니다.
            매칭 확정 전까지 내 프로필을 다듬어 매칭 가능성을 높일 수 있습니다.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEditOpen(true)}
          disabled={!editable}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-black text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
        >
          {editable ? <FiEdit3 /> : <FiLock />}
          {editable ? "프로필 수정" : "수정 잠금"}
        </button>
      </div>

      <div className="mt-6 grid gap-7 lg:grid-cols-[0.78fr_1.22fr]">
        <div>
          <PhotoGallery
            photos={photos}
            blurred={false}
            noticeText="내 화면에서는 원본 확인"
          />
        </div>

        <div>
          <div className="rounded-3xl border border-zinc-200 p-5">
            {rows.map(([label, value]) => (
              <Row key={label} label={label} value={value} />
            ))}
          </div>

          <div className={`mt-4 flex items-start gap-3 rounded-2xl px-4 py-4 ${
            editable ? "bg-orange-50 text-orange-700" : "bg-zinc-100 text-zinc-500"
          }`}>
            {editable ? <FiUserCheck className="mt-1 shrink-0" /> : <FiLock className="mt-1 shrink-0" />}
            <p className="break-keep text-xs font-semibold leading-6">
              {lockReason}
            </p>
          </div>
        </div>
      </div>

      <MyProfileEditModal
        open={editOpen}
        application={application}
        editable={editable}
        saving={savingProfile}
        uploadProgress={profileUploadProgress}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
