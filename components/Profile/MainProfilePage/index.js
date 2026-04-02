import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { FiArrowLeft } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

import { db } from "firebaseConfig";
import { requestPortoneIdentityVerification } from "lib/portoneIdentity";
import ProfileFieldModal from "../ProfileFieldModal";
import CompanyVerificationFlowModal from "../CompanyVerificationFlowModal";
import ProfilePhotoEditModal from "../ProfilePhotoEditModal";
import ProfileBasicTab from "../ProfileBasicTab";
import ProfileSurveyTab from "../Survey/ProfileSurveyTab";
import ProfileCharmingTab from "../ProfileCharmingTab";

import BottomNavbar from "components/Common/BottomNavbar";

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

const RELIGION_OPTIONS = [
  "무교",
  "기독교",
  "천주교",
  "불교",
  "원불교",
  "유교",
  "이슬람교",
  "기타",
];

const SALARY_OPTIONS = [
  "2,000만원 이하",
  "2,000 - 2,500만원",
  "2,500 - 3,000만원",
  "3,000 - 3,500만원",
  "3,500 - 4,000만원",
  "4,000 - 4,500만원",
  "4,500 - 5,000만원",
  "5,000 - 5,500만원",
  "5,500 - 6,000만원",
  "6,000 - 7,000만원",
  "7,000 - 8,000만원",
  "8,000 - 9,000만원",
  "9,000만원 이상",
  "1억원 이상",
];

const JOB_OPTIONS = [
  "대기업",
  "중견기업",
  "공기업",
  "공무원",
  "공공기관",
  "외국계",
  "전문직",
  "금융권",
  "교육계",
  "프리랜서",
  "사업가",
  "기타",
];

const EDUCATION_OPTIONS = [
  "고등학교 졸업",
  "전문대 재학",
  "전문대 졸업",
  "4년제 재학",
  "4년제 졸업",
  "석사학위",
  "박사학위",
  "기타/비공개",
];

function getSchoolNameText(user) {
  return user?.schoolName || user?.educationSchoolName || user?.school || "";
}

function getBirthdayText(birthday) {
  if (!birthday) return "";
  if (typeof birthday === "string") return birthday;
  if (birthday?.year)
    return `${birthday.year}년 ${birthday.month || ""}월 ${birthday.day || ""}일`;
  return "";
}

function getAddressText(address) {
  if (!address) return "";
  return [address?.sido, address?.sigugun].filter(Boolean).join(" ");
}

function normalizeHeight(value) {
  return String(value || "").replace(/[^0-9]/g, "");
}

function getLikeScore(userDoc) {
  return (
    userDoc?.charmingCardLikeReceivedCount ||
    userDoc?.charmingCardReceivedLikeCount ||
    userDoc?.receivedLikeCount ||
    0
  );
}

function SaveToast({ open, message }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="pointer-events-none fixed left-1/2 top-6 z-[12000] -translate-x-1/2"
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <div className="rounded-full border border-black/10 bg-black px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.28)]">
            {message}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function ProfileMainPage({ user }) {
  const router = useRouter();
  const scrollRef = useRef(null);
  const toastTimerRef = useRef(null);

  const [activeTab, setActiveTab] = useState("basic");
  const [tabsVisible, setTabsVisible] = useState(true);
  const [lastScrollTop, setLastScrollTop] = useState(0);

  const [draftUser, setDraftUser] = useState(user || {});
  const [fieldSaving, setFieldSaving] = useState(false);

  const [fieldModal, setFieldModal] = useState(null);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  const [badgeInfo, setBadgeInfo] = useState({
    totalUsers: 0,
    top1: false,
    top5: false,
  });

  const [toast, setToast] = useState({
    open: false,
    message: "",
  });

  useEffect(() => {
    if (!router.isReady) return;

    const tab = router.query?.tab;
    if (tab === "basic" || tab === "survey" || tab === "charming") {
      setActiveTab(tab);
    }
  }, [router.isReady, router.query?.tab]);

  const showToast = (message) => {
    setToast({ open: true, message });

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    toastTimerRef.current = setTimeout(() => {
      setToast({ open: false, message: "" });
    }, 1800);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setDraftUser(user || {});
  }, [user]);

  useEffect(() => {
    let mounted = true;

    async function loadBadgeRanking() {
      try {
        const snap = await getDocs(collection(db, "users"));
        const allUsers = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
        const totalUsers = allUsers.length;
        const ranked = [...allUsers].sort(
          (a, b) => getLikeScore(b) - getLikeScore(a)
        );
        const meIndex = ranked.findIndex((item) => item.id === user?.userID);
        const myRank = meIndex >= 0 ? meIndex + 1 : null;

        const top1Cut = Math.max(1, Math.ceil(totalUsers * 0.01));
        const top5Cut = Math.max(1, Math.ceil(totalUsers * 0.05));

        if (!mounted) return;

        setBadgeInfo({
          totalUsers,
          top1: totalUsers >= 100 && !!myRank && myRank <= top1Cut,
          top5: totalUsers >= 100 && !!myRank && myRank <= top5Cut,
        });
      } catch (error) {
        console.error("[ProfileMainPage] badge ranking error:", error);
      }
    }

    if (user?.userID) loadBadgeRanking();

    return () => {
      mounted = false;
    };
  }, [user?.userID, user?.charmingCardLikeReceivedCount]);

  const handleScroll = (e) => {
    const nextTop = e.currentTarget.scrollTop;

    if (nextTop <= 20) {
      setTabsVisible(true);
    } else if (nextTop > lastScrollTop + 6) {
      setTabsVisible(false);
    } else if (nextTop < lastScrollTop - 6) {
      setTabsVisible(true);
    }

    setLastScrollTop(nextTop);
  };

  const basicFields = useMemo(() => {
    return [
      {
        label: "닉네임",
        key: "nickname",
        value: draftUser?.nickname || draftUser?.username || "",
        type: "text",
      },
      { label: "본명", key: "name", value: draftUser?.name, type: "text" },
      {
        label: "거주지역",
        key: "residence",
        value:
          getAddressText(draftUser?.residence) ||
          getAddressText({
            sido: draftUser?.address_sido,
            sigugun: draftUser?.address_sigugun,
          }),
        type: "address",
      },
      {
        label: "근무지역",
        key: "workArea",
        value:
          getAddressText(draftUser?.workArea) ||
          getAddressText({
            sido: draftUser?.company_location_sido,
            sigugun: draftUser?.company_location_sigugun,
          }),
        type: "address",
      },
      {
        label: "생년월일",
        key: "birthday",
        value: getBirthdayText(draftUser?.birthday),
        type: "text",
        locked: true,
      },
      {
        label: "직업선택",
        key: "job",
        value: draftUser?.job,
        type: "select",
        options: JOB_OPTIONS,
      },
      {
        label: "회사명",
        key: "company",
        value: draftUser?.company,
        type: "company",
      },
      {
        label: "최종학력",
        key: "education",
        value: getSchoolNameText(draftUser)
          ? `${draftUser?.education || ""} · ${getSchoolNameText(draftUser)}`
          : draftUser?.education || "",
        type: "education",
        options: EDUCATION_OPTIONS,
      },
      {
        label: "경력인증",
        key: "companyVerified",
        value: draftUser?.companyVerified ? "인증완료" : "미인증",
        locked: true,
      },
      {
        label: "성별",
        key: "gender",
        value:
          draftUser?.gender === "male"
            ? "남자"
            : draftUser?.gender === "female"
              ? "여자"
              : draftUser?.gender,
        locked: true,
      },
      {
        label: "연락처",
        key: "phonenumber",
        value: draftUser?.phonenumber,
        locked: true,
      },
      {
        label: "상태",
        key: "maritalStatus",
        value: draftUser?.maritalStatus || "",
        type: "radio",
        options: [
          { label: "미혼", value: "미혼" },
          { label: "돌싱", value: "돌싱" },
        ],
      },
      { label: "키", key: "height", value: draftUser?.height, type: "number" },
      { label: "MBTI", key: "mbti", value: draftUser?.mbti, type: "mbti" },
      {
        label: "종교",
        key: "religion",
        value: draftUser?.religion,
        type: "select",
        options: RELIGION_OPTIONS,
      },
      {
        label: "연봉수준",
        key: "salary",
        value: draftUser?.salary,
        type: "select",
        options: SALARY_OPTIONS,
      },
      { label: "이메일", key: "email", value: draftUser?.email, type: "text" },
    ];
  }, [draftUser]);

  const getFieldValueForModal = (field) => {
    if (!field) return "";

    if (field.key === "nickname") {
      return draftUser?.nickname || draftUser?.username || "";
    }

    if (field.key === "residence") {
      return {
        sido: draftUser?.residence?.sido || draftUser?.address_sido || "",
        sigugun: draftUser?.residence?.sigugun || draftUser?.address_sigugun || "",
        sidoCode: draftUser?.residence?.sidoCode || "",
        sigugunCode: draftUser?.residence?.sigugunCode || "",
      };
    }

    if (field.key === "workArea") {
      return {
        sido:
          draftUser?.workArea?.sido || draftUser?.company_location_sido || "",
        sigugun:
          draftUser?.workArea?.sigugun ||
          draftUser?.company_location_sigugun ||
          "",
        sidoCode: draftUser?.workArea?.sidoCode || "",
        sigugunCode: draftUser?.workArea?.sigugunCode || "",
      };
    }

    if (field.key === "education") {
      return draftUser?.education || "";
    }

    if (field.key === "height") {
      return String(draftUser?.height || "").replace(/[^0-9]/g, "");
    }

    return draftUser?.[field.key] || "";
  };

  const buildFieldPatch = (field, payload) => {
    const patch = {};

    if (field.key === "nickname") {
      const nicknameValue = String(payload || "").trim();
      patch.nickname = nicknameValue;
      patch.username = nicknameValue;
      return patch;
    }

    if (field.key === "height") {
      patch.height = normalizeHeight(payload);
      return patch;
    }

    if (field.key === "company") {
      patch.company = String(payload?.value || "").trim();
      patch.companyPublic = payload?.companyPublic ?? true;
      return patch;
    }

    if (field.key === "education") {
      const nextEducation = String(payload?.value || "").trim();
      const nextSchoolName = String(payload?.schoolName || "").trim();

      patch.education = nextEducation;
      patch.schoolName = nextSchoolName;
      patch.educationSchoolName = nextSchoolName;
      patch.school = nextSchoolName;
      patch.educationPublic = payload?.educationPublic ?? true;
      return patch;
    }

    if (field.key === "residence") {
      patch.residence = payload || {};
      patch.address_sido = payload?.sido || "";
      patch.address_sigugun = payload?.sigugun || "";
      return patch;
    }

    if (field.key === "workArea") {
      patch.workArea = payload || {};
      patch.company_location_sido = payload?.sido || "";
      patch.company_location_sigugun = payload?.sigugun || "";
      return patch;
    }

    patch[field.key] = typeof payload === "string" ? payload.trim() : payload;
    return patch;
  };

  const applyFieldValue = async (field, payload) => {
    if (!user?.userID || !field) return;

    const patch = buildFieldPatch(field, payload);
    setFieldSaving(true);

    try {
      setDraftUser((prev) => ({
        ...prev,
        ...patch,
      }));

      await setDoc(
        doc(db, "users", user.userID),
        {
          ...patch,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setFieldModal(null);
      showToast(`${field.label}이 저장되었습니다.`);
    } catch (error) {
      console.error("[ProfileMainPage] field save error:", error);
      window.alert("저장 중 오류가 발생했습니다.");
    } finally {
      setFieldSaving(false);
    }
  };

  const handleIdentityVerification = async () => {
    const result = await requestPortoneIdentityVerification({
      phone: draftUser?.phonenumber || "",
      name: draftUser?.name || draftUser?.nickname || draftUser?.username || "",
    });

    if (!result?.ok) {
      window.alert(result?.message || "본인인증을 진행하지 못했습니다.");
      return;
    }

    try {
      await setDoc(
        doc(db, "users", user.userID),
        {
          identityVerified: true,
          identityVerifiedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      showToast("본인인증이 저장되었습니다.");
    } catch (error) {
      console.error("[ProfileMainPage] identity verify save error:", error);
    }
  };

  return (
    <>
      <SaveToast open={toast.open} message={toast.message} />

      <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-slate-50">
        <div className="shrink-0 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between px-5 pb-4 pt-[max(16px,env(safe-area-inset-top))]">
            <div className="text-[20px] font-bold tracking-[-0.03em] text-slate-900">
              내 프로필
            </div>

            <button
              type="button"
              onClick={() => router.back()}
              style={{ cursor: "pointer" }}
              className="flex h-9 w-9 items-center justify-center rounded-md text-slate-700 transition hover:bg-slate-100"
            >
              <FiArrowLeft className="text-[20px]" />
            </button>
          </div>

          <motion.div
            animate={{
              height: tabsVisible ? "auto" : 0,
              opacity: tabsVisible ? 1 : 0,
            }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-200 px-4 pt-4">
              <div className="flex items-center gap-6 border-b border-solid border-slate-200">
                {[
                  { key: "basic", label: "기본정보" },
                  { key: "survey", label: "가치관설문" },
                  { key: "charming", label: "차밍카드" },
                ].map((tab) => {
                  const active = activeTab === tab.key;

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.key);
                        router.replace(
                          {
                            pathname: router.pathname,
                            query: {
                              ...router.query,
                              tab: tab.key,
                            },
                          },
                          undefined,
                          { shallow: true }
                        );
                      }}
                      style={{ cursor: "pointer" }}
                      className={cn(
                        "relative pb-3 text-[16px] transition",
                        active
                          ? "font-bold text-slate-900"
                          : "font-medium text-slate-400"
                      )}
                    >
                      {tab.label}
                      {active ? (
                        <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-full bg-violet-600" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="min-h-0 flex-1 overflow-y-auto pb-[calc(64px+20px+env(safe-area-inset-bottom))]"
        >
          {activeTab === "basic" && (
            <ProfileBasicTab
              user={draftUser}
              basicFields={basicFields}
              badgeInfo={badgeInfo}
              onOpenField={setFieldModal}
              onOpenCompanyModal={() => setCompanyModalOpen(true)}
              onOpenPhotoModal={() => setPhotoModalOpen(true)}
              onIdentityVerify={handleIdentityVerification}
            />
          )}

          {activeTab === "survey" && (
            <ProfileSurveyTab
              user={draftUser}
              userId={user?.userID}
              onSaved={(patch, message) => {
                setDraftUser((prev) => ({
                  ...prev,
                  ...patch,
                }));
                showToast(message || "가치관 설문이 저장되었습니다.");
              }}
            />
          )}

          {activeTab === "charming" && <ProfileCharmingTab user={draftUser} />}
        </div>

        <BottomNavbar contained />

        <ProfileFieldModal
          open={!!fieldModal}
          title={fieldModal?.label || ""}
          type={fieldModal?.type || "text"}
          value={fieldModal ? getFieldValueForModal(fieldModal) : ""}
          options={fieldModal?.options || []}
          extra={{
            companyPublic: draftUser?.companyPublic,
            educationPublic: draftUser?.educationPublic,
            schoolName: getSchoolNameText(draftUser),
            educationValue: draftUser?.education || "",
          }}
          onClose={() => setFieldModal(null)}
          onSave={(payload) => applyFieldValue(fieldModal, payload)}
          saving={fieldSaving}
        />

        <CompanyVerificationFlowModal
          open={companyModalOpen}
          currentCompanyEmail={draftUser?.companyEmail || ""}
          onClose={() => setCompanyModalOpen(false)}
          onComplete={async ({
            companyEmail,
            companyVerified,
            companyNameGuess,
          }) => {
            try {
              const patch = {
                companyEmail,
                companyVerified,
                companyVerificationMethod: "email",
                companyVerifiedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              };

              if (!draftUser?.company && companyNameGuess) {
                patch.company = companyNameGuess;
              }

              await setDoc(doc(db, "users", user.userID), patch, {
                merge: true,
              });

              setDraftUser((prev) => ({
                ...prev,
                ...patch,
                company:
                  prev?.company || companyNameGuess || prev?.company || "",
              }));

              showToast("회사인증이 저장되었습니다.");
            } catch (error) {
              console.error(
                "[ProfileMainPage] company verify complete error:",
                error
              );
            }
          }}
        />

        <ProfilePhotoEditModal
          open={photoModalOpen}
          userId={user?.userID}
          photos={draftUser?.profilePhotos || []}
          onClose={() => setPhotoModalOpen(false)}
          onSaved={(patch) => {
            setDraftUser((prev) => ({
              ...prev,
              ...patch,
            }));
            showToast("프로필사진이 저장되었습니다.");
          }}
        />
      </div>
    </>
  );
}