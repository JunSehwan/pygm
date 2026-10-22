import { useEffect, useMemo, useRef, useState } from "react";
import { FiMove, FiPlus, FiStar, FiTrash2 } from "react-icons/fi";
import {
  TWOWEEKS_MAX_PROFILE_PHOTOS,
  TWOWEEKS_MIN_PROFILE_PHOTOS,
} from "../TwoWeeksShared/profilePhotoPolicy";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function usePhotoPreview(item) {
  const [url, setUrl] = useState(item?.url || "");

  useEffect(() => {
    if (!item) {
      setUrl("");
      return undefined;
    }

    if (item.source === "existing") {
      setUrl(item.url || item.meta?.url || "");
      return undefined;
    }

    if (item.source === "file" && item.file) {
      const objectUrl = URL.createObjectURL(item.file);
      setUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    setUrl("");
    return undefined;
  }, [item]);

  return url;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function PhotoCard({
  item,
  index,
  isMain,
  dragging,
  onRemove,
  onDragStart,
  onDrop,
  onPointerStart,
  onPointerMove,
  onPointerEnd,
}) {
  const previewUrl = usePhotoPreview(item);

  return (
    <div
      draggable
      data-photo-index={index}
      onDragStart={(event) => onDragStart(index, event)}
      onDragEnd={onPointerEnd}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => onDrop(index)}
      className={cx(
        "group relative aspect-[4/5] overflow-hidden rounded-2xl border bg-zinc-100 transition",
        dragging ? "border-orange-500 opacity-70 ring-4 ring-orange-500/15" : "border-zinc-200"
      )}
    >
      {previewUrl ? (
        <img src={previewUrl} alt={`프로필 사진 ${index + 1}`} className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/10 to-transparent" />

      {isMain ? <div className="absolute left-3 top-3">
        <span
          className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-black text-white shadow-sm backdrop-blur"
        >
          <FiStar /> 대표
        </span>
      </div> : null}

      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur transition hover:bg-black"
        aria-label="사진 삭제"
      >
        <FiTrash2 />
      </button>

      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-white">
        <span className="text-xs font-bold">{isMain ? "대표사진" : `사진 ${index + 1}`}</span>
        <button
          type="button"
          aria-label={`${index + 1}번째 사진 순서 이동`}
          onPointerDown={(event) => onPointerStart(index, event)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          className="flex shrink-0 touch-none items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-[11px] font-semibold backdrop-blur"
        >
          <FiMove /> 이동
        </button>
      </div>
    </div>
  );
}

export default function PhotoEditGrid({ photos = [], onChange, error }) {
  const inputRef = useRef(null);
  const pointerIndexRef = useRef(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [fileError, setFileError] = useState("");

  const safePhotos = useMemo(
    () => (Array.isArray(photos) ? photos.filter(Boolean).slice(0, TWOWEEKS_MAX_PROFILE_PHOTOS) : []),
    [photos]
  );

  const commitPhotos = (nextPhotos) => {
    onChange?.(nextPhotos.filter(Boolean).slice(0, TWOWEEKS_MAX_PROFILE_PHOTOS));
  };

  const appendFiles = (files) => {
    const incoming = Array.from(files || []).filter(Boolean);
    const invalidType = incoming.find((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type));
    if (invalidType) {
      setFileError("JPG, PNG, WEBP 파일만 등록할 수 있습니다.");
      return;
    }
    const tooLarge = incoming.find((file) => file.size > MAX_IMAGE_BYTES);
    if (tooLarge) {
      setFileError("사진은 파일당 10MB 이하로 등록해주세요.");
      return;
    }
    if (safePhotos.length + incoming.length > TWOWEEKS_MAX_PROFILE_PHOTOS) {
      setFileError(`프로필 사진은 최대 ${TWOWEEKS_MAX_PROFILE_PHOTOS}장까지 등록할 수 있습니다.`);
      return;
    }

    const selected = incoming
      .map((file, index) => ({
        source: "file",
        id: `file_${Date.now()}_${index}_${file.name}`,
        label: file.name,
        file,
      }));

    if (!selected.length) return;
    setFileError("");
    commitPhotos([...safePhotos, ...selected]);
  };

  const removePhoto = (index) => {
    commitPhotos(safePhotos.filter((_, photoIndex) => photoIndex !== index));
  };

  const handleDrop = (targetIndex) => {
    const sourceIndex = pointerIndexRef.current ?? dragIndex;
    if (sourceIndex === null || sourceIndex === targetIndex) return;
    const next = [...safePhotos];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    commitPhotos(next);
    pointerIndexRef.current = targetIndex;
    setDragIndex(targetIndex);
  };

  const finishDrag = () => {
    pointerIndexRef.current = null;
    setDragIndex(null);
  };

  const startPointerDrag = (index, event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerIndexRef.current = index;
    setDragIndex(index);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };

  const movePointerDrag = (event) => {
    if (pointerIndexRef.current === null || typeof document === "undefined") return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.("[data-photo-index]");
    const targetIndex = Number(target?.dataset?.photoIndex);
    if (Number.isInteger(targetIndex) && targetIndex >= 0 && targetIndex < safePhotos.length) {
      handleDrop(targetIndex);
    }
    event.preventDefault();
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={(event) => {
          appendFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {safePhotos.map((item, index) => (
          <PhotoCard
            key={item.id || item.url || `${item?.file?.name}_${index}`}
            item={item}
            index={index}
            isMain={index === 0}
            dragging={dragIndex === index}
            onRemove={removePhoto}
            onDragStart={(photoIndex, event) => {
              pointerIndexRef.current = photoIndex;
              setDragIndex(photoIndex);
              event.dataTransfer.effectAllowed = "move";
            }}
            onDrop={handleDrop}
            onPointerStart={startPointerDrag}
            onPointerMove={movePointerDrag}
            onPointerEnd={finishDrag}
          />
        ))}

        {safePhotos.length < TWOWEEKS_MAX_PROFILE_PHOTOS ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cx(
              "flex aspect-[4/5] flex-col items-center justify-center rounded-2xl border border-dashed bg-white px-3 py-4 text-center transition hover:border-zinc-950 hover:bg-zinc-50",
              error ? "border-red-300" : "border-zinc-200"
            )}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-xl text-zinc-500">
              <FiPlus />
            </div>
            <div className="text-sm font-black leading-5 text-zinc-950">사진 추가</div>
            <div className="mt-1 text-xs leading-5 text-zinc-400">최소 3장 · 최대 5장</div>
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs leading-5 text-zinc-500">
        <span>사진을 드래그하여 순서를 변경할 수 있습니다. 첫 사진이 대표사진입니다.</span>
        <span className={cx(
          "rounded-full px-2.5 py-1 font-black",
          safePhotos.length >= TWOWEEKS_MIN_PROFILE_PHOTOS
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-700"
        )}>
          현재 {safePhotos.length}장 / 최소 {TWOWEEKS_MIN_PROFILE_PHOTOS}장
        </span>
      </div>

      {fileError ? <div className="mt-2 text-xs font-medium text-red-500">{fileError}</div> : null}
      {error ? <div className="mt-2 text-xs font-medium text-red-500">{error}</div> : null}
    </div>
  );
}
