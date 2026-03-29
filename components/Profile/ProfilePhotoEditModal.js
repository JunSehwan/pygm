import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCamera, FiTrash2, FiX } from "react-icons/fi";
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

      onClose();
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
          className="fixed inset-0 z-[11000] flex items-end justify-center bg-black/45 px-4 pb-4 md:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-[390px] overflow-hidden rounded-md bg-white shadow-2xl"
            initial={{ opacity: 0, y: 16, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.99 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-[22px] font-bold tracking-[-0.03em] text-slate-900">
                  프로필사진 수정
                </div>
                <p className="mt-1 text-[13px] leading-5 text-slate-500">
                  대표 사진 2장, 추가 사진 3장을 설정할 수 있어요.
                </p>
                <p className="mt-1 text-[12px] font-semibold text-rose-500">
                  최소 3장 이상 등록해야 저장할 수 있어요.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="text-slate-400"
              >
                <FiX className="text-[24px]" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="overflow-hidden rounded-md bg-slate-100">
                <div className="relative h-[220px] w-full">
                  {mainPreview ? (
                    <img
                      src={mainPreview}
                      alt="대표 미리보기"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                      <FiCamera className="text-[34px]" />
                      <div className="mt-2 text-[14px] font-medium">
                        사진을 선택해주세요
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-[13px] font-medium text-slate-600">
                  등록된 사진
                </div>
                <div className="text-[13px] font-bold text-slate-900">
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
                        "relative overflow-hidden rounded-md border bg-slate-100",
                        activeIndex === index
                          ? "border-violet-300 ring-2 ring-violet-100"
                          : "border-slate-200"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenPicker(index)}
                        className="h-[74px] w-full"
                      >
                        {url ? (
                          <img src={url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <FiCamera className="text-[18px]" />
                          </div>
                        )}
                      </button>

                      {url ? (
                        <button
                          type="button"
                          onClick={() => handleRemove(index)}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white"
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
                  className="h-12 rounded-md border border-slate-200 bg-white text-[15px] font-semibold text-slate-700"
                >
                  사진 선택
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="h-12 rounded-md bg-[#ff4338] text-[15px] font-bold text-white disabled:opacity-60"
                >
                  {saving ? "저장중..." : "적용하기"}
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