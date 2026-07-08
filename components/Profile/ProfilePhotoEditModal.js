import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCamera, FiTrash2, FiX } from "react-icons/fi";
import { PiSparkleFill } from "react-icons/pi";
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, storage } from "firebaseConfig";
import { useRouter } from "next/router";
import { buildDatingReviewPatch } from "lib/reviewEligibility";

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

function uploadFileToStorage(storageRef, file, onProgress) {
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type || "image/jpeg",
      cacheControl: "public,max-age=31536000",
    });

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const totalBytes = snapshot.totalBytes || 0;
        const transferredBytes = snapshot.bytesTransferred || 0;
        const progress = totalBytes
          ? Math.round((transferredBytes / totalBytes) * 100)
          : 0;

        onProgress?.(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

const MAX_SOURCE_FILE_SIZE = 25 * 1024 * 1024;

function getFileExtension(file) {
  const name = String(file?.name || "").toLowerCase();
  const ext = name.includes(".") ? name.split(".").pop() : "";

  if (ext) return ext;

  if (file?.type === "image/jpeg") return "jpg";
  if (file?.type === "image/png") return "png";
  if (file?.type === "image/webp") return "webp";
  if (file?.type === "image/heic") return "heic";
  if (file?.type === "image/heif") return "heif";

  return "jpg";
}

function validateFile(file) {
  if (!file) return "이미지를 선택해주세요.";

  const fileType = String(file.type || "").toLowerCase();
  const extension = getFileExtension(file);

  const isImageMime = fileType.startsWith("image/");
  const isImageExtension = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "heic",
    "heif",
  ].includes(extension);

  if (!isImageMime && !isImageExtension) {
    return "이미지 파일만 업로드할 수 있어요.";
  }

  if (file.size > MAX_SOURCE_FILE_SIZE) {
    return "이미지 용량이 너무 커요. 25MB 이하 사진만 등록해주세요.";
  }

  return "";
}

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("이미지를 읽을 수 없습니다."));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(canvas, type = "image/jpeg", quality = 0.84) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("이미지 변환에 실패했습니다."));
          return;
        }

        resolve(blob);
      },
      type,
      quality
    );
  });
}

async function prepareImageForUpload(file) {
  const fileType = String(file?.type || "").toLowerCase();
  const extension = getFileExtension(file);

  const isHeicLike =
    ["heic", "heif"].includes(extension) ||
    ["image/heic", "image/heif"].includes(fileType);

  try {
    const image = await loadImageElement(file);

    const maxWidth = 1600;
    const maxHeight = 1600;

    const originalWidth = image.naturalWidth || image.width;
    const originalHeight = image.naturalHeight || image.height;

    if (!originalWidth || !originalHeight) {
      throw new Error("이미지 크기를 확인할 수 없습니다.");
    }

    const ratio = Math.min(
      1,
      maxWidth / originalWidth,
      maxHeight / originalHeight
    );

    const targetWidth = Math.max(1, Math.round(originalWidth * ratio));
    const targetHeight = Math.max(1, Math.round(originalHeight * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("이미지 변환을 시작할 수 없습니다.");
    }

    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

    const blob = await canvasToBlob(canvas, "image/jpeg", 0.84);

    const safeName = String(file.name || "profile-photo")
      .replace(/\.[^.]+$/, "")
      .replace(/[^\w가-힣.-]+/g, "_");

    return new File([blob], `${safeName || "profile-photo"}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error("[ProfilePhotoEditModal] prepareImageForUpload error:", error);

    if (isHeicLike) {
      throw new Error(
        "아이폰 HEIC 사진을 변환하지 못했어요. 사진 앱에서 JPG로 저장한 뒤 다시 시도해주세요."
      );
    }

    return file;
  }
}

function getUploadErrorMessage(error) {
  const code = error?.code || "";

  if (code === "storage/unauthorized") {
    return "로그인 인증이 풀렸어요. 다시 로그인 후 시도해주세요.";
  }

  if (code === "storage/retry-limit-exceeded") {
    return "네트워크가 불안정해요. 와이파이에서 다시 시도해주세요.";
  }

  if (code === "storage/canceled") {
    return "사진 업로드가 취소되었어요.";
  }

  if (code === "storage/quota-exceeded") {
    return "저장공간 한도를 초과했어요. 관리자에게 문의해주세요.";
  }

  if (error?.message?.includes("HEIC")) {
    return error.message;
  }

  return "사진 저장 중 오류가 발생했어요. 다른 사진으로 다시 시도해주세요.";
}

export default function ProfilePhotoEditModal({
  open,
  userId,
  photos = [],
  currentUser = {},
  onClose,
  onSaved,
}) {
  const fileInputRef = useRef(null);
  const router = useRouter();

  const [draftPhotos, setDraftPhotos] = useState(normalizePhotos([]));
  const [activeIndex, setActiveIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [uploadProgressMap, setUploadProgressMap] = useState({});
  const [uploadPhase, setUploadPhase] = useState("");


  useEffect(() => {
    if (!open) return;

    const normalized = normalizePhotos(photos).map(toPhotoItem);
    setDraftPhotos(normalized);
    setActiveIndex(0);
    setUploadingIndex(null);
    setUploadProgressMap({});
    setUploadPhase("");
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
    if (saving) return;
    setActiveIndex(index);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    if (saving) return;

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
    if (saving) return;

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
    setUploadingIndex(null);
    setUploadProgressMap({});

    const pendingUploadCount = draftPhotos.filter((item) => !!item?.file).length;
    let uploadedFileCount = 0;

    try {
      setUploadPhase(
        pendingUploadCount > 0
          ? `사진 ${pendingUploadCount}장을 업로드하고 있어요`
          : "프로필사진을 저장하고 있어요"
      );

      const nextPhotos = [];

      for (let i = 0; i < draftPhotos.length; i += 1) {
        const item = draftPhotos[i];
        if (!item) continue;

        if (item.file) {
          const preparedFile = await prepareImageForUpload(item.file);
          const extension = getFileExtension(preparedFile) || "jpg";

          const storagePath = `users/${userId}/profilePhotos/${i}-${Date.now()}.${extension}`;
          const storageRef = ref(storage, storagePath);

          setUploadingIndex(i);
          setUploadPhase(
            `${uploadedFileCount + 1}/${pendingUploadCount}번째 사진 업로드 중`
          );

          const downloadURL = await uploadFileToStorage(
            storageRef,
            preparedFile,
            (progress) => {
              setUploadProgressMap((prev) => ({
                ...prev,
                [i]: progress,
              }));
            }
          );

          uploadedFileCount += 1;
          setUploadProgressMap((prev) => ({
            ...prev,
            [i]: 100,
          }));

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

      setUploadingIndex(null);
      setUploadPhase("프로필에 반영하고 있어요");

      const thumbimage = nextPhotos?.[0]?.url || "";

      const basePatch = {
        profilePhotos: nextPhotos,
        thumbimage,
        profilePhotoUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        date_sleep: false,
      };

      const nextUser = {
        ...(currentUser || {}),
        ...basePatch,
        profilePhotos: nextPhotos,
      };

      const { patch: reviewPatch, shouldMoveToPending } = buildDatingReviewPatch(
        nextUser,
        currentUser || {}
      );

      await setDoc(
        doc(db, "users", userId),
        {
          ...basePatch,
          ...reviewPatch,
        },
        { merge: true }
      );

      if (onSaved) {
        onSaved({
          profilePhotos: nextPhotos,
          thumbimage,
          ...reviewPatch,
        });
      }

      onClose?.();

      if (shouldMoveToPending) {
        window.alert("데이트 매칭 심사가 접수되었어요.");
        router.push("/arena/pending");
      }
    } catch (error) {
      console.error("[ProfilePhotoEditModal] save error:", {
        code: error?.code,
        message: error?.message,
        name: error?.name,
        error,
      });

      window.alert(getUploadErrorMessage(error));
    } finally {
      setSaving(false);
      setUploadingIndex(null);
      setUploadProgressMap({});
      setUploadPhase("");
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

                    {saving ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/45 px-6 text-center text-white backdrop-blur-[2px]">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        </div>
                        <div className="mt-3 text-[14px] font-extrabold tracking-[-0.02em]">
                          사진 업로드 중
                        </div>
                        <div className="mt-1 text-[12px] font-medium text-white/80">
                          {uploadPhase || "잠시만 기다려주세요"}
                        </div>
                      </div>
                    ) : null}
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
                    const isPendingFile = !!item?.file;
                    const isUploadingThis = saving && uploadingIndex === index;
                    const uploadProgress = uploadProgressMap[index];

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
                          disabled={saving}
                          className="h-[76px] w-full disabled:cursor-not-allowed"
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

                        {isPendingFile && !saving ? (
                          <div className="pointer-events-none absolute inset-x-1 bottom-1 rounded-full bg-violet-600/90 px-1.5 py-[3px] text-center text-[9px] font-extrabold text-white shadow-sm">
                            저장 전
                          </div>
                        ) : null}

                        {isPendingFile && saving ? (
                          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-slate-950/50 px-1.5 text-white backdrop-blur-[1px]">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                            <div className="mt-1 text-[9px] font-extrabold">
                              {typeof uploadProgress === "number"
                                ? `${uploadProgress}%`
                                : isUploadingThis
                                  ? "업로드"
                                  : "대기"}
                            </div>
                          </div>
                        ) : null}

                        <div className="pointer-events-none absolute left-1.5 top-1.5 rounded-full bg-black/45 px-1.5 py-[2px] text-[10px] font-bold text-white">
                          {index + 1}
                        </div>

                        {url ? (
                          <button
                            type="button"
                            onClick={() => handleRemove(index)}
                            disabled={saving}
                            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/75 disabled:opacity-40"
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
                    disabled={saving}
                    className="h-12 rounded-md border border-slate-200 bg-white text-[15px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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
                    {saving ? uploadPhase || "업로드 중..." : "적용하기"}
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