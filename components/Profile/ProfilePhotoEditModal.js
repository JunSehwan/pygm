import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCamera, FiTrash2, FiX } from "react-icons/fi";
import { PiSparkleFill } from "react-icons/pi";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, storage } from "firebaseConfig";

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

const PHOTO_COUNT = 5;
const MIN_REQUIRED_PHOTOS = 3;

function normalizePhotos(profilePhotos = []) {
  const arr = Array.isArray(profilePhotos) ? [...profilePhotos] : [];
  while (arr.length < PHOTO_COUNT) arr.push(null);
  return arr.slice(0, PHOTO_COUNT);
}

function toPhotoItem(item) {
  if (!item) return null;
  if (typeof item === "string") {
    return {
      url: item,
      path: "",
      file: null,
      preview: item,
    };
  }

  return {
    url: item.url || "",
    path: item.path || "",
    file: item.file || null,
    preview: item.preview || item.url || "",
  };
}

function validateFile(file) {
  if (!file) return "이미지를 선택해주세요.";

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return "JPG, PNG, WEBP 파일만 업로드할 수 있어요.";
  }

  if (file.size > 8 * 1024 * 1024) {
    return "이미지 용량은 8MB 이하만 업로드할 수 있어요.";
  }

  return "";
}

export default function ProfilePhotoEditModal({
  open,
  userId,
  photos = [],
  onClose,
  onSaved,
}) {
  const fileInputRef = useRef(null);

  const [draftPhotos, setDraftPhotos] = useState(normalizePhotos([]));
  const [activeIndex, setActiveIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    const normalized = normalizePhotos(photos).map(toPhotoItem);
    setDraftPhotos(normalized);
    setActiveIndex(0);
  }, [open, photos]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !saving) {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, saving, onClose]);

  const mainPreview = useMemo(() => {
    const current = draftPhotos?.[activeIndex];
    return current?.preview || current?.url || "";
  }, [activeIndex, draftPhotos]);

  const validPhotoCount = useMemo(() => {
    return draftPhotos.filter((item) => !!(item?.preview || item?.url)).length;
  }, [draftPhotos]);

  const handleOpenPicker = (index) => {
    setActiveIndex(index);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    const errorMessage = validateFile(file);

    if (errorMessage) {
      window.alert(errorMessage);
      return;
    }

    const preview = URL.createObjectURL(file);

    setDraftPhotos((prev) => {
      const next = [...prev];
      const prevItem = next[activeIndex];

      if (prevItem?.preview?.startsWith?.("blob:")) {
        try {
          URL.revokeObjectURL(prevItem.preview);
        } catch (e) { }
      }

      next[activeIndex] = {
        ...(prevItem || {}),
        file,
        preview,
      };

      return next;
    });
  };

  const handleRemove = (index) => {
    setDraftPhotos((prev) => {
      const next = [...prev];
      const target = next[index];

      if (target?.preview?.startsWith?.("blob:")) {
        try {
          URL.revokeObjectURL(target.preview);
        } catch (e) { }
      }

      next[index] = null;
      return next;
    });
  };

  const handleSave = async () => {
    if (!userId) {
      window.alert("유저 정보가 올바르지 않습니다.");
      return;
    }

    if (validPhotoCount < MIN_REQUIRED_PHOTOS) {
      window.alert("프로필사진은 최소 3장 이상 등록해야 합니다.");
      return;
    }

    setSaving(true);

    try {
      const nextPhotos = [];

      for (let i = 0; i < draftPhotos.length; i += 1) {
        const item = draftPhotos[i];
        if (!item) continue;

        if (item.file) {
          const extension = item.file.name?.split(".").pop() || "jpg";
          const storagePath = `users/${userId}/profilePhotos/${i}-${Date.now()}.${extension}`;
          const storageRef = ref(storage, storagePath);

          await uploadBytes(storageRef, item.file, {
            contentType: item.file.type,
          });

          const downloadURL = await getDownloadURL(storageRef);

          if (item.path) {
            try {
              await deleteObject(ref(storage, item.path));
            } catch (error) {
              console.warn("[ProfilePhotoEditModal] old photo delete fail:", error);
            }
          }

          nextPhotos.push({
            url: downloadURL,
            path: storagePath,
          });
        } else if (item.url) {
          nextPhotos.push({
            url: item.url,
            path: item.path || "",
          });
        }
      }

      if (nextPhotos.length < MIN_REQUIRED_PHOTOS) {
        window.alert("프로필사진은 최소 3장 이상 등록해야 합니다.");
        setSaving(false);
        return;
      }

      const thumbimage = nextPhotos?.[0]?.url || "";

      await setDoc(
        doc(db, "users", userId),
        {
          profilePhotos: nextPhotos,
          thumbimage,
          profilePhotoUpdatedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      if (onSaved) {
        onSaved({
          profilePhotos: nextPhotos,
          thumbimage,
        });
      }

      onClose?.();
    } catch (error) {
      console.error("[ProfilePhotoEditModal] save error:", error);
      window.alert("사진 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[11000] flex items-end justify-center bg-slate-950/50 px-3 pb-3 backdrop-blur-[3px] md:items-center md:px-4 md:pb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={saving ? undefined : onClose}
        >
          <motion.div
            className="w-full max-w-[420px] overflow-hidden rounded-md border border-white/70 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.28)]"
            initial={{ opacity: 0, y: 24, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.99 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-100 bg-gradient-to-b from-violet-50 via-white to-white px-5 pb-4 pt-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-700">
                    <PiSparkleFill className="text-[10px]" />
                    사진 관리
                  </div>

                  <div className="mt-3 text-[22px] font-black tracking-[-0.03em] text-slate-900">
                    프로필사진 수정
                  </div>

                  <p className="mt-2 text-[13px] leading-5 text-slate-500">
                    대표 사진 2장, 추가 사진 3장을 설정할 수 있어요.
                  </p>
                  <p className="mt-1 text-[12px] font-semibold text-violet-600">
                    최소 3장 이상 등록해야 저장할 수 있어요.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-60"
                  style={{ cursor: "pointer" }}
                  aria-label="닫기"
                >
                  <FiX className="text-[18px]" />
                </button>
              </div>
            </div>

            <div className="max-h-[72vh] overflow-y-auto px-4 pb-4">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                  <div className="relative h-[240px] w-full bg-gradient-to-br from-slate-100 via-slate-50 to-violet-50/40">
                    {mainPreview ? (
                      <img
                        src={mainPreview}
                        alt="대표 미리보기"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-slate-200">
                          <FiCamera className="text-[24px]" />
                        </div>
                        <div className="mt-3 text-[14px] font-semibold">
                          사진을 선택해주세요
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-[14px] border border-slate-200 bg-slate-50 px-3.5 py-3">
                  <div>
                    <div className="text-[13px] font-semibold text-slate-700">
                      등록된 사진
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-400">
                      첫 번째 사진이 대표 이미지로 사용돼요
                    </div>
                  </div>

                  <div className="rounded-full bg-white px-3 py-1 text-[13px] font-bold text-slate-900 ring-1 ring-slate-200">
                    {validPhotoCount} / {PHOTO_COUNT}
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {draftPhotos.map((item, index) => {
                    const url = item?.preview || item?.url || "";

                    return (
                      <div
                        key={index}
                        className={cn(
                          "relative overflow-hidden rounded-[14px] border bg-slate-100 transition",
                          activeIndex === index
                            ? "border-violet-300 ring-2 ring-violet-100 shadow-[0_8px_18px_rgba(139,92,246,0.10)]"
                            : "border-slate-200"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenPicker(index)}
                          className="h-[76px] w-full"
                          style={{ cursor: "pointer" }}
                        >
                          {url ? (
                            <img
                              src={url}
                              alt={`프로필 사진 ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              <FiCamera className="text-[18px]" />
                            </div>
                          )}
                        </button>

                        <div className="pointer-events-none absolute left-1.5 top-1.5 rounded-full bg-black/45 px-1.5 py-[2px] text-[10px] font-bold text-white">
                          {index + 1}
                        </div>

                        {url ? (
                          <button
                            type="button"
                            onClick={() => handleRemove(index)}
                            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/75"
                            style={{ cursor: "pointer" }}
                            aria-label="사진 삭제"
                          >
                            <FiTrash2 className="text-[12px]" />
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenPicker(activeIndex)}
                    className="h-12 rounded-md border border-slate-200 bg-white text-[15px] font-semibold text-slate-700 transition hover:bg-slate-50"
                    style={{ cursor: "pointer" }}
                  >
                    사진 선택
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSave}
                    className="h-12 rounded-md bg-violet-600 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(124,58,237,0.24)] transition hover:bg-violet-700 disabled:opacity-60"
                    style={{ cursor: "pointer" }}
                  >
                    {saving ? "저장중..." : "적용하기"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="w-full py-4 hover:bg-slate-100 text-center text-[15px] font-medium text-slate-400 transition hover:text-slate-600 disabled:opacity-60"
                  style={{ cursor: "pointer" }}
                >
                  취소
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}