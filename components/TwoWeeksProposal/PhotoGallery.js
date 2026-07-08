import { useMemo, useState } from "react";
import { FiImage, FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function PhotoGallery({
  photos = [],
  blurred = true,
  noticeText = "사진은 제안 단계에서 흐림 처리됩니다",
}) {
  const safePhotos = useMemo(() => (Array.isArray(photos) ? photos.filter((photo) => photo?.url) : []), [photos]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const current = safePhotos[selectedIndex] || null;

  const move = (direction) => {
    if (!safePhotos.length) return;
    setSelectedIndex((prev) => {
      const next = prev + direction;
      if (next < 0) return safePhotos.length - 1;
      if (next >= safePhotos.length) return 0;
      return next;
    });
  };

  const mainImageClass = blurred
    ? "h-full w-full scale-105 object-cover blur-[18px] brightness-95"
    : "h-full w-full object-cover";

  const thumbImageClass = blurred
    ? "h-full w-full scale-110 object-cover blur-[8px]"
    : "h-full w-full object-cover";

  return (
    <div>
      <div className="relative overflow-hidden rounded-[30px] border border-zinc-200 bg-zinc-100">
        <div className="relative aspect-[4/5] w-full overflow-hidden">
          {current?.url ? (
            <>
              <img
                src={current.url}
                alt="프로필 사진"
                className={mainImageClass}
              />
              <div className={blurred ? "absolute inset-0 bg-black/10" : "absolute inset-0 bg-black/0"} />
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-zinc-400">
              <FiImage className="text-4xl" />
              <div className="mt-3 text-sm font-semibold">사진 확인 중</div>
            </div>
          )}

          {noticeText ? (
            <div className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white backdrop-blur">
              {noticeText}
            </div>
          ) : null}

          {safePhotos.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => move(-1)}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
                aria-label="이전 사진"
              >
                <FiChevronLeft />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
                aria-label="다음 사진"
              >
                <FiChevronRight />
              </button>
            </>
          ) : null}
        </div>
      </div>

      {safePhotos.length ? (
        <div className="mt-4 grid grid-cols-5 gap-2">
          {safePhotos.map((photo, index) => (
            <button
              key={photo.id || photo.url}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`relative overflow-hidden rounded-2xl border transition ${
                selectedIndex === index ? "border-zinc-950 ring-2 ring-zinc-950/10" : "border-zinc-200"
              }`}
            >
              <div className="aspect-square">
                <img
                  src={photo.url}
                  alt={`프로필 사진 ${index + 1}`}
                  className={thumbImageClass}
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-black/50 py-1 text-[10px] font-bold text-white">
                {photo.label || `사진 ${index + 1}`}
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
