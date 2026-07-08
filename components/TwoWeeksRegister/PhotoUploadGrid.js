import { useMemo, useRef, useState } from "react";
import { FiImage, FiMove, FiPlus, FiStar, FiTrash2 } from "react-icons/fi";
import { FieldError, useObjectUrl } from "./FormControls";
import { cx } from "./helpers";

function PhotoCard({ file, index, isMain, onRemove, onDragStart, onDrop }) {
  const previewUrl = useObjectUrl(file);

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => onDrop(index)}
      className="group relative min-h-[178px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 md:min-h-[205px]"
    >
      {previewUrl ? (
        <img src={previewUrl} alt={`사진 ${index + 1}`} className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/8 to-transparent" />

      <div className="absolute left-3 top-3 flex gap-2">
        <span
          className={cx(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black shadow-sm backdrop-blur",
            isMain ? "bg-orange-500 text-white" : "bg-white/90 text-slate-700"
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
        <div className="min-w-0 truncate text-xs font-semibold">{file?.name}</div>
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-[11px] font-semibold backdrop-blur">
          <FiMove /> 드래그
        </div>
      </div>
    </div>
  );
}

export default function PhotoUploadGrid({ representativePhoto, additionalPhotos = [], setForm, error }) {
  const inputRef = useRef(null);
  const [dragIndex, setDragIndex] = useState(null);

  const photos = useMemo(
    () => [representativePhoto, ...(additionalPhotos || [])].filter(Boolean).slice(0, 4),
    [representativePhoto, additionalPhotos]
  );

  const commitPhotos = (nextPhotos) => {
    const compact = nextPhotos.filter(Boolean).slice(0, 4);
    setForm((prev) => ({
      ...prev,
      representativePhoto: compact[0] || null,
      additionalPhotos: compact.slice(1),
    }));
  };

  const appendFiles = (files) => {
    const selected = Array.from(files || []).filter(Boolean);
    if (!selected.length) return;
    commitPhotos([...photos, ...selected].slice(0, 4));
  };

  const removePhoto = (index) => {
    const next = photos.filter((_, photoIndex) => photoIndex !== index);
    commitPhotos(next);
  };

  const handleDrop = (targetIndex) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...photos];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    commitPhotos(next);
    setDragIndex(null);
  };

  return (
    <div data-tw-field="true">
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

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {photos.map((file, index) => (
          <PhotoCard
            key={`${file.name}_${file.size}_${index}`}
            file={file}
            index={index}
            isMain={index === 0}
            onRemove={removePhoto}
            onDragStart={setDragIndex}
            onDrop={handleDrop}
          />
        ))}

        {photos.length < 4 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cx(
              "flex min-h-[178px] flex-col items-center justify-center rounded-2xl border border-dashed bg-white px-3 py-4 text-center transition hover:border-black hover:bg-slate-50 md:min-h-[205px]",
              error ? "border-red-300" : "border-slate-200"
            )}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-xl text-slate-500">
              <FiPlus />
            </div>
            <div className="text-sm font-black leading-5 text-slate-950">사진 여러 장 선택</div>
            <div className="mt-1 text-xs leading-5 text-slate-400">최대 4장까지 등록</div>
          </button>
        ) : null}
      </div>

      <div className="mt-3 text-xs leading-5 text-slate-500">
        여러 장을 한 번에 선택할 수 있고, 사진을 드래그해 맨 앞으로 옮기면 대표 사진이 됩니다.
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}
