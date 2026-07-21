import { useEffect, useMemo, useRef, useState } from "react";
import { FiImage, FiMove, FiPlus, FiStar, FiTrash2 } from "react-icons/fi";

const MAX_PROFILE_PHOTOS = 5;

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

function PhotoCard({ item, index, isMain, onRemove, onDragStart, onDrop }) {
  const previewUrl = usePhotoPreview(item);

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => onDrop(index)}
      className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100"
    >
      {previewUrl ? (
        <img src={previewUrl} alt={`프로필 사진 ${index + 1}`} className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/10 to-transparent" />

      <div className="absolute left-3 top-3">
        <span
          className={cx(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black shadow-sm backdrop-blur",
            isMain ? "bg-orange-500 text-white" : "bg-white/90 text-zinc-700"
          )}
        >
          {isMain ? <FiStar /> : <FiImage />}
          {isMain ? "대표" : `추가 ${index}`}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur transition hover:bg-black"
        aria-label="사진 삭제"
      >
        <FiTrash2 />
      </button>

      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-white">
        <div className="min-w-0 truncate text-xs font-semibold">
          {item?.file?.name || item?.meta?.name || item?.label || "프로필 사진"}
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-[11px] font-semibold backdrop-blur">
          <FiMove /> 이동
        </div>
      </div>
    </div>
  );
}

export default function PhotoEditGrid({ photos = [], onChange, error }) {
  const inputRef = useRef(null);
  const [dragIndex, setDragIndex] = useState(null);

  const safePhotos = useMemo(() => (Array.isArray(photos) ? photos.filter(Boolean).slice(0, MAX_PROFILE_PHOTOS) : []), [photos]);

  const commitPhotos = (nextPhotos) => {
    onChange?.(nextPhotos.filter(Boolean).slice(0, MAX_PROFILE_PHOTOS));
  };

  const appendFiles = (files) => {
    const selected = Array.from(files || [])
      .filter(Boolean)
      .filter((file) => ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type))
      .map((file, index) => ({
        source: "file",
        id: `file_${Date.now()}_${index}_${file.name}`,
        label: file.name,
        file,
      }));

    if (!selected.length) return;
    commitPhotos([...safePhotos, ...selected].slice(0, MAX_PROFILE_PHOTOS));
  };

  const removePhoto = (index) => {
    commitPhotos(safePhotos.filter((_, photoIndex) => photoIndex !== index));
  };

  const handleDrop = (targetIndex) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...safePhotos];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    commitPhotos(next);
    setDragIndex(null);
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {safePhotos.map((item, index) => (
          <PhotoCard
            key={item.id || item.url || `${item?.file?.name}_${index}`}
            item={item}
            index={index}
            isMain={index === 0}
            onRemove={removePhoto}
            onDragStart={setDragIndex}
            onDrop={handleDrop}
          />
        ))}

        {safePhotos.length < MAX_PROFILE_PHOTOS ? (
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
            <div className="mt-1 text-xs leading-5 text-zinc-400">최대 5장</div>
          </button>
        ) : null}
      </div>

      <div className="mt-3 text-xs leading-5 text-zinc-500">
        권장 4:5 · 1080×1350px. 첫 사진이 대표사진입니다.
      </div>

      {error ? <div className="mt-2 text-xs font-medium text-red-500">{error}</div> : null}
    </div>
  );
}
