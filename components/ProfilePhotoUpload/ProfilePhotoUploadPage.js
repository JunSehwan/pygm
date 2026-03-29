import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Toaster, toast } from "react-hot-toast";
import { ToggleSwitch } from "flowbite-react";
import { db, storage } from "firebaseConfig";

import PhotoGuideSheet from "./PhotoGuideSheet";

import { FaExchangeAlt } from "react-icons/fa";
import { TiDelete } from "react-icons/ti";
import { FiLoader } from "react-icons/fi";

const PHOTO_COUNT = 6;

const EMPTY_PHOTOS = Array.from({ length: PHOTO_COUNT }, () => ({
  url: "",
  path: "",
}));

const toastBaseStyle = {
  borderRadius: "14px",
  background: "rgba(30, 41, 59, 0.96)",
  color: "#fff",
  fontSize: "12px",
  lineHeight: "1.45",
  padding: "10px 14px",
  boxShadow: "0 10px 30px rgba(15,23,42,0.22)",
  backdropFilter: "blur(6px)",
};

const errorToastStyle = {
  ...toastBaseStyle,
  background: "rgba(244, 63, 94, 0.96)",
};

export default function ProfilePhotoUploadPage({ user }) {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const uid = user?.userID || user?.uid;

  const [photos, setPhotos] = useState(EMPTY_PHOTOS);
  const [charmingCardPhotoPublic, setCharmingCardPhotoPublic] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // 사진 업로드
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const savedPhotos = Array.isArray(user.profilePhotos) ? user.profilePhotos : [];
    const mergedPhotos = EMPTY_PHOTOS.map((item, index) => {
      if (savedPhotos[index]) {
        return {
          url: savedPhotos[index].url || "",
          path: savedPhotos[index].path || "",
        };
      }
      return item;
    });

    setPhotos(mergedPhotos);
    setCharmingCardPhotoPublic(!!user.charmingCardPhotoPublic);
    setPageLoading(false);
  }, [user]);

  const uploadedCount = useMemo(() => {
    return photos.filter((item) => item.url).length;
  }, [photos]);

  const hasMainPhoto = !!photos[0]?.url;
  const canSubmit = hasMainPhoto && uploadedCount >= 3;

  const showInfoToast = (message) => {
    toast.dismiss();
    toast(message, {
      duration: 2200,
      position: "bottom-center",
      style: {
        ...toastBaseStyle,
        maxWidth: "280px",
        textAlign: "center",
      },
    });
  };

  const showSuccessToast = (message) => {
    toast.dismiss();
    toast.success(message, {
      duration: 2200,
      position: "bottom-center",
      style: {
        ...toastBaseStyle,
        maxWidth: "220px",
        textAlign: "center",
      },
      iconTheme: {
        primary: "#ffffff",
        secondary: "#1e293b",
      },
    });
  };

  const showErrorToast = (message) => {
    toast.dismiss();
    toast.error(message, {
      duration: 2400,
      position: "bottom-center",
      style: {
        ...errorToastStyle,
        maxWidth: "240px",
        textAlign: "center",
      },
      iconTheme: {
        primary: "#ffffff",
        secondary: "#f43f5e",
      },
    });
  };

  const saveProfileData = async (nextPhotos, nextPublic) => {
    if (!uid) {
      throw new Error("유저 ID가 없습니다.");
    }

    const userRef = doc(db, "users", uid);

    await setDoc(
      userRef,
      {
        profilePhotos: nextPhotos,
        charmingCardPhotoPublic: nextPublic,
        profilePhotoUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const validateFile = (file) => {
    if (!file) return "이미지를 선택해주세요.";

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return "JPG, PNG, WEBP 파일만 업로드할 수 있어요.";
    }

    if (file.size > 8 * 1024 * 1024) {
      return "이미지 용량은 8MB 이하만 업로드할 수 있어요.";
    }

    return "";
  };

  const getUploadTargetSlots = (startSlot, currentPhotos, fileCount) => {
    const slots = [startSlot];

    for (let i = startSlot + 1; i < PHOTO_COUNT; i += 1) {
      if (!currentPhotos[i]?.url) slots.push(i);
      if (slots.length >= fileCount) return slots;
    }

    for (let i = 0; i < PHOTO_COUNT; i += 1) {
      if (i === startSlot) continue;
      if (!currentPhotos[i]?.url) slots.push(i);
      if (slots.length >= fileCount) return slots;
    }

    return slots.slice(0, fileCount);
  };


  const openGuide = (slotIndex) => {
    setSelectedSlot(slotIndex);
    setGuideOpen(true);
  };

  const handleSelectPhotoClick = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) {
      showErrorToast("이미지를 선택해주세요.");
      return;
    }

    if (selectedSlot === null) {
      showErrorToast("업로드할 위치를 다시 선택해주세요.");
      return;
    }

    if (!uid) {
      showErrorToast("로그인 정보가 올바르지 않습니다.");
      return;
    }

    const invalidMessage = files.map(validateFile).find(Boolean);
    if (invalidMessage) {
      showErrorToast(invalidMessage);
      return;
    }

    const targetSlots = getUploadTargetSlots(selectedSlot, photos, files.length);

    if (!targetSlots.length) {
      showErrorToast("등록 가능한 빈 슬롯이 없어요.");
      return;
    }

    if (targetSlots.length < files.length) {
      showInfoToast(`빈 슬롯이 부족해서 ${targetSlots.length}장만 등록할게요.`);
    }

    setGuideOpen(false);
    setSaving(true);
    setUploading(true);

    try {
      const nextPhotos = [...photos];

      for (let i = 0; i < targetSlots.length; i += 1) {
        const file = files[i];
        const slotIndex = targetSlots[i];

        const prevPhoto = nextPhotos[slotIndex];
        const extension = file.name?.split(".").pop() || "jpg";
        const storagePath = `users/${uid}/profilePhotos/${slotIndex}-${Date.now()}-${i}.${extension}`;
        const storageRef = ref(storage, storagePath);

        await uploadBytes(storageRef, file, {
          contentType: file.type,
        });

        const downloadURL = await getDownloadURL(storageRef);

        if (prevPhoto?.path) {
          try {
            await deleteObject(ref(storage, prevPhoto.path));
          } catch (deleteError) {
            console.warn("[ProfilePhotoUploadPage] old photo delete fail:", deleteError);
          }
        }

        nextPhotos[slotIndex] = {
          url: downloadURL,
          path: storagePath,
        };
      }

      setPhotos(nextPhotos);
      await saveProfileData(nextPhotos, charmingCardPhotoPublic);

      if (targetSlots.length === 1) {
        showSuccessToast("사진이 등록되었어요.");
      } else {
        showSuccessToast(`${targetSlots.length}장의 사진이 등록되었어요.`);
      }
    } catch (error) {
      console.error("[ProfilePhotoUploadPage] upload error:", error);
      showErrorToast("사진 업로드 중 오류가 발생했어요.");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (slotIndex) => {
    const target = photos[slotIndex];
    if (!target?.url) return;

    setSaving(true);
    // setUploading(true);

    try {
      if (target.path) {
        try {
          await deleteObject(ref(storage, target.path));
        } catch (deleteError) {
          console.warn("[ProfilePhotoUploadPage] delete fail:", deleteError);
        }
      }

      const nextPhotos = [...photos];
      nextPhotos[slotIndex] = { url: "", path: "" };

      setPhotos(nextPhotos);
      await saveProfileData(nextPhotos, charmingCardPhotoPublic);

      <TiDelete />
    } catch (error) {
      console.error("[ProfilePhotoUploadPage] delete error:", error);
    } finally {
      setSaving(false);
      // setUploading(false);
    }
  };

  const handleTogglePublic = async (checked) => {
    const nextValue = checked;
    setCharmingCardPhotoPublic(nextValue);

    try {
      await saveProfileData(photos, nextValue);
      showSuccessToast(nextValue ? "차밍카드 공개가 켜졌어요." : "차밍카드 공개가 꺼졌어요.");
    } catch (error) {
      console.error("[ProfilePhotoUploadPage] toggle error:", error);
      setCharmingCardPhotoPublic(!nextValue);
      showErrorToast("설정 저장 중 오류가 발생했어요.");
    }
  };

  const handleGuideInfo = () => {
    showInfoToast("차밍카드 작성시 프로필 사진을 공개합니다.");
  };

  const handleSubmit = async () => {
    if (!hasMainPhoto) {
      showErrorToast("대표 사진은 꼭 등록해주세요.");
      return;
    }

    if (uploadedCount < 3) {
      showErrorToast("사진은 최소 3장 이상 등록해주세요.");
      return;
    }

    if (!uid) {
      showErrorToast("로그인 정보가 올바르지 않습니다.");
      return;
    }

    try {
      setSaving(true);
      setUploading(true);

      await setDoc(
        doc(db, "users", uid),
        {
          profile_photo_required_done: true,
          profile_setup_step: 2,
          date_profile_finished: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      router.push("/arena/pending");
    } catch (error) {
      console.error("[ProfilePhotoUploadPage] submit error:", error);
      showErrorToast("저장 중 오류가 발생했어요.");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const renderPhotoCard = (photo, slotIndex, options = {}) => {
    const { large = false, label = "" } = options;

    const wrapperClass = large
      ? "relative aspect-square overflow-hidden rounded-[24px] border-2 border-dashed border-[#bfd0ea] bg-white"
      : "relative aspect-square overflow-hidden rounded-[20px] border-2 border-dashed border-[#bfd0ea] bg-white";

    return (
      <button
        type="button"
        className={`${wrapperClass} text-left`}
        onClick={() => openGuide(slotIndex)}
      >
        {photo?.url ? (
          <>
            <img
              src={photo.url}
              alt={`프로필 사진 ${slotIndex + 1}`}
              className="h-full w-full object-cover"
            />

            {label ? (
              <div className="absolute left-1.5 top-1.5 rounded-full bg-[#0b63ce]/95 text-white shadow-md px-2 py-2 text-[10px] font-extrabold ">
                {label}
              </div>
            ) : null}

            <div className="absolute inset-x-2 bottom-2 flex gap-1">
              <button
                type="button"
                className={`${large ? "px-2 py-2 text-md" : "px-2 py-2 text-md"
                  } rounded-full bg-black/65 font-bold text-white`}
                onClick={(e) => {
                  e.stopPropagation();
                  openGuide(slotIndex);
                }}
              >
                <FaExchangeAlt />
              </button>

              <button
                type="button"
                className={`${large ? "px-2 py-2 text-md" : "px-2 py-2 text-md"
                  } rounded-full bg-rose-500/95 hover:bg-rose-700 font-bold text-white`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePhoto(slotIndex);
                }}
              >
                <TiDelete />
              </button>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center">
            <div
              className={`${large
                ? "mb-2 flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#0b63ce] text-[32px] text-white"
                : "flex h-[30px] w-[30px] items-center justify-center rounded-full bg-blue-50 text-[20px] text-[#0b63ce]"
                }`}
            >
              +
            </div>

            {/* <span
              className={`${large
                ? "text-[18px] font-black text-[#0b63ce]"
                : "mt-2 text-[12px] font-bold text-slate-500"
                }`}
            >
              등록+
            </span> */}

            {large ? (
              <span className="mt-0.5 text-md text-blue-600">대표 사진</span>
            ) : null}
          </div>
        )}
      </button>
    );
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-[15px] font-semibold text-slate-500">불러오는 중...</div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        gutter={8}
        containerStyle={{ bottom: 88 }}
        toastOptions={{
          duration: 2200,
        }}
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[390px] flex-col bg-white md:min-h-[760px] md:max-w-[430px]">
        <div className="px-5 pt-5 pb-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
          >
            ←
          </button>

          <h1 className="text-[28px] font-black text-slate-900">
            당신다운 사진이 <br />가장 매력적이에요!
          </h1>

          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-500">
            첫 사진은 대표 이미지로 보여져요.
            {"\n"}
            자연스럽고 선명한 사진일수록 매력이 더 잘 전달됩니다.
          </p>
        </div>

        <div className="flex-1 px-5 pb-[78px]">
          <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-4">
            <div className="grid grid-cols-2 gap-3">
              {renderPhotoCard(photos[0], 0, { large: true, label: "대표" })}
              {renderPhotoCard(photos[1], 1)}
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2.5">
              {photos.slice(2).map((photo, index) => {
                const slotIndex = index + 2;

                return (
                  <div key={slotIndex} className="aspect-square">
                    <button
                      type="button"
                      className="relative h-full w-full overflow-hidden rounded-[18px] border-2 border-dashed border-slate-200 bg-white"
                      onClick={() => openGuide(slotIndex)}
                    >
                      {photo?.url ? (
                        <>
                          <img
                            src={photo.url}
                            alt={`프로필 사진 ${slotIndex + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-x-1.5 bottom-0.5 flex gap-0.5">
                            <button
                              type="button"
                              className="rounded-full bg-black/65 p-1.5 text-sm font-bold text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                openGuide(slotIndex);
                              }}
                            >
                              <FaExchangeAlt />
                            </button>
                            <button
                              type="button"
                              className="rounded-full bg-rose-500/95 hover:bg-rose-700 p-1.5 text-sm font-bold text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePhoto(slotIndex);
                              }}
                            >
                              <TiDelete />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-blue-50 text-[20px] text-[#0b63ce]">
                            +
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-2">
            <div className="flex min-h-[54px] items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-[15px] font-bold text-slate-800">
                  차밍카드에 공개하기
                </span>

                <button
                  type="button"
                  onClick={handleGuideInfo}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-[12px] font-extrabold text-[#0b63ce]"
                >
                  ?
                </button>
              </div>

              <div className="[&>button]:focus:ring-0 [&>button]:focus:outline-none">
                <ToggleSwitch
                  checked={charmingCardPhotoPublic}
                  // label="Toggle"
                  sizing="md"
                  onChange={handleTogglePublic}
                  color="pink"
                />
              </div>
            </div>
          </div>

          <p
            className={`mt-3 text-[13px] font-semibold ${canSubmit ? "text-emerald-600" : "text-slate-500"
              }`}
          >
            {canSubmit
              ? "사진 조건이 충족되었어요."
              : `현재 ${uploadedCount}장 등록됨 · 대표 사진 포함 최소 3장 필요`}
          </p>

        </div>

        <AnimatePresence>
          {uploading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[120] flex items-center justify-center bg-white/72 backdrop-blur-[2px]"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                className="mx-6 flex w-full max-w-[220px] flex-col items-center rounded-[22px] bg-white px-6 py-5 shadow-[0_12px_40px_rgba(15,23,42,0.14)]"
              >
                <FiLoader className="mb-3 animate-spin text-[26px] text-[#ff4458]" />
                <p className="text-[15px] font-bold text-slate-800">사진 업로드 중...</p>
                <p className="mt-1 text-[12px] text-slate-500">잠시만 기다려주세요</p>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <PhotoGuideSheet
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        onSelectPhoto={handleSelectPhotoClick}
      />
      <div className="absolute bottom-0 left-0 right-0 z-[40]">
        <div className="border-t border-slate-200/80 bg-white/92 px-0 pt-3 backdrop-blur-xl">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !canSubmit}
            className="flex h-[62px] w-full items-center justify-center bg-gradient-to-r from-pink-500 via-[#ff4d67] to-pink-700 hover:bg-pink-800 text-[18px] font-black tracking-[-0.02em] text-white shadow-[0_-6px_24px_rgba(255,68,88,0.22)] transition duration-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {saving
              ? "처리중..."
              : !hasMainPhoto
                ? "대표 사진을 등록해주세요"
                : uploadedCount < 3
                  ? "사진 3장 이상 필요"
                  : "매칭심사 진행"}
          </button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      {/* <AnimatePresence>
        {uploading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[80] flex items-center justify-center bg-white/70 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="flex flex-col items-center rounded-[22px] bg-white px-6 py-5 shadow-[0_12px_40px_rgba(15,23,42,0.14)]"
            >
              <FiLoader className="mb-3 animate-spin text-[26px] text-[#ff4458]" />
              <p className="text-[15px] font-bold text-slate-800">사진 업로드 중...</p>
              <p className="mt-1 text-[12px] text-slate-500">잠시만 기다려주세요</p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence> */}
    </>

  );
}