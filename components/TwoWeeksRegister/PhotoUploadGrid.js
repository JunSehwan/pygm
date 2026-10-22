import { useMemo, useRef, useState } from "react";
import { FiCamera, FiCheck, FiPlus, FiStar, FiTrash2 } from "react-icons/fi";
import { FieldError, useObjectUrl } from "./FormControls";
import { cx } from "./helpers";
import {
  TWOWEEKS_MAX_PROFILE_PHOTOS,
  TWOWEEKS_MIN_PROFILE_PHOTOS,
} from "../TwoWeeksShared/profilePhotoPolicy";

function PhotoCard({ file, isMain = false, onRemove, onMakeMain, onDragStart, onDrop }) {
  const previewUrl = useObjectUrl(file);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => { event.preventDefault(); onDrop(); }}
      className={cx(
        "group relative overflow-hidden rounded-2xl bg-[#eef2f7]",
        isMain ? "aspect-[4/5] w-full shadow-[0_8px_24px_rgba(20,42,64,.12)]" : "aspect-[4/5] w-full"
      )}
    >
      {previewUrl ? <img src={previewUrl} alt={isMain ? "대표 프로필 사진" : "추가 프로필 사진"} className="absolute inset-0 h-full w-full object-cover" /> : null}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/15" />
      {isMain ? (
        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#ff821f] px-3 py-1.5 text-xs font-extrabold text-white shadow-sm">
          <FiStar /> 대표사진
        </div>
      ) : null}
      <button
        type="button"
        onClick={onRemove}
        aria-label={isMain ? "대표사진 삭제" : "추가사진 삭제"}
        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
      >
        <FiTrash2 size={16} />
      </button>
      {!isMain ? (
        <button
          type="button"
          onClick={onMakeMain}
          className="absolute bottom-2 left-2 right-2 rounded-full bg-white/95 px-2 py-2 text-xs font-extrabold text-[#24486f] shadow-sm transition hover:bg-white"
        >
          대표로 설정
        </button>
      ) : null}
    </div>
  );
}

export default function PhotoUploadGrid({ representativePhoto, additionalPhotos = [], setForm, error }) {
  const inputRef = useRef(null);
  const [dragIndex, setDragIndex] = useState(null);
  const photos = useMemo(
    () => [representativePhoto, ...(additionalPhotos || [])].filter(Boolean).slice(0, TWOWEEKS_MAX_PROFILE_PHOTOS),
    [representativePhoto, additionalPhotos]
  );
  const commitPhotos = (nextPhotos) => {
    const compact = nextPhotos.filter(Boolean).slice(0, TWOWEEKS_MAX_PROFILE_PHOTOS);
    setForm((prev) => ({ ...prev, representativePhoto: compact[0] || null, additionalPhotos: compact.slice(1) }));
  };
  const appendFiles = (files) => {
    const selected = Array.from(files || []).filter(Boolean);
    if (selected.length) commitPhotos([...photos, ...selected]);
  };
  const makeMain = (index) => {
    if (index === 0) return;
    const next = [...photos];
    const [selected] = next.splice(index, 1);
    commitPhotos([selected, ...next]);
  };
  const removePhoto = (index) => commitPhotos(photos.filter((_, i) => i !== index));
  const dropPhoto = (targetIndex) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...photos];
    const [selected] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, selected);
    commitPhotos(next);
    setDragIndex(null);
  };
  const hasEnough = photos.length >= TWOWEEKS_MIN_PROFILE_PHOTOS;

  return (
    <div data-tw-field="true">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={(event) => { appendFiles(event.target.files); event.target.value = ""; }}
      />
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-[#36536d]">등록한 사진 {photos.length}장 <span className="font-medium text-[#8a9aa9]">/ 최소 {TWOWEEKS_MIN_PROFILE_PHOTOS}장</span></span>
        <span className={cx(
          "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold",
          hasEnough ? "bg-emerald-50 text-emerald-700" : "bg-[#eff4ff] text-[#3268d9]"
        )}>{hasEnough ? <><FiCheck /> 등록 완료</> : "최대 5장"}</span>
      </div>
      <div className="mx-auto w-full max-w-[340px]">
        {photos[0] ? (
          <PhotoCard file={photos[0]} isMain onRemove={() => removePhoto(0)} onDragStart={() => setDragIndex(0)} onDrop={() => dropPhoto(0)} />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-[4/5] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#cad8eb] bg-[#f6f9ff] text-[#3268d9] transition hover:border-[#3268d9]"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm"><FiCamera size={27} /></span>
            <span className="mt-4 text-base font-extrabold">대표사진 등록하기</span>
            <span className="mt-1 text-xs text-[#8293aa]">사진을 여러 장 한 번에 선택할 수 있어요</span>
          </button>
        )}
      </div>
      {photos.length > 0 ? (
        <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {photos.slice(1).map((file, index) => (
            <PhotoCard
              key={`${file.name}_${file.size}_${index}`}
              file={file}
              onRemove={() => removePhoto(index + 1)}
              onMakeMain={() => makeMain(index + 1)}
              onDragStart={() => setDragIndex(index + 1)}
              onDrop={() => dropPhoto(index + 1)}
            />
          ))}
          {photos.length < TWOWEEKS_MAX_PROFILE_PHOTOS ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex aspect-[4/5] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d5e0ec] bg-white text-[#8293a7] transition hover:border-[#3268d9] hover:text-[#3268d9]"
            >
              <FiPlus size={26} />
              <span className="mt-2 text-xs font-bold">사진 추가</span>
            </button>
          ) : null}
        </div>
      ) : null}
      {photos.length > 0 ? (
        <p className="mt-3 text-center text-xs leading-5 text-[#8293a7]">추가사진 아래 ‘대표로 설정’을 누르면 대표사진이 바뀌어요.</p>
      ) : null}
      <FieldError>{error}</FieldError>
    </div>
  );
}
