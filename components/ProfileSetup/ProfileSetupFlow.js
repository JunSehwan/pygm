import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "firebaseConfig";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import hangjungdong from "components/Common/Address";

import ProfileSetupCard from "./ProfileSetupCard";
import ConfirmModal from "./ConfirmModal";
import SelectListSheet from "./SelectListSheet";
import MbtiModal from "./MbtiModal";
import { EDUCATION_OPTIONS, JOB_OPTIONS, MARITAL_OPTIONS } from "./constants";

import MarriedBlockedModal from "./MarriedBlockedModal";
import { buildDatingReviewPatch } from "lib/reviewEligibility";

export default function ProfileSetupFlow() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [currentUser, setCurrentUser] = useState({});

  const [form, setForm] = useState({
    maritalStatus: "",
    mbti: "",
    job: "",
    education: "",
    residence: { sido: "", sigugun: "", sidoCode: "", sigugunCode: "" },
    workArea: { sido: "", sigugun: "", sidoCode: "", sigugunCode: "" },
  });

  const [errors, setErrors] = useState({});

  // modal/sheet state
  const [mbtiModalOpen, setMbtiModalOpen] = useState(false);
  const [marriedBlockedModalOpen, setMarriedBlockedModalOpen] = useState(false);

  const [jobSheetOpen, setJobSheetOpen] = useState(false);
  const [educationSheetOpen, setEducationSheetOpen] = useState(false);

  const [resSidoSheetOpen, setResSidoSheetOpen] = useState(false);
  const [resSigugunSheetOpen, setResSigugunSheetOpen] = useState(false);

  const [workSidoSheetOpen, setWorkSidoSheetOpen] = useState(false);
  const [workSigugunSheetOpen, setWorkSigugunSheetOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth?.onAuthStateChanged?.(async (u) => {
      if (!u) return;
      setFirebaseUser(u);

      try {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data() || {};

          setCurrentUser({
            userID: u.uid,
            id: u.uid,
            ...data,
          });

          setForm((prev) => ({
            ...prev,
            maritalStatus: data.maritalStatus || prev.maritalStatus,
            mbti: data.mbti || prev.mbti,
            job: data.job || prev.job,
            education: data.education || prev.education,
            residence: {
              sido: data?.residence?.sido || prev.residence.sido,
              sigugun: data?.residence?.sigugun || prev.residence.sigugun,
              sidoCode: data?.residence?.sidoCode || prev.residence.sidoCode,
              sigugunCode: data?.residence?.sigugunCode || prev.residence.sigugunCode,
            },
            workArea: {
              sido: data?.workArea?.sido || prev.workArea.sido,
              sigugun: data?.workArea?.sigugun || prev.workArea.sigugun,
              sidoCode: data?.workArea?.sidoCode || prev.workArea.sidoCode,
              sigugunCode: data?.workArea?.sigugunCode || prev.workArea.sigugunCode,
            },
          }));
        } else {
          setCurrentUser({
            userID: u.uid,
            id: u.uid,
          });
        }
      } catch (e) {
        console.error("[ProfileSetupFlow] load error:", e);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe && unsubscribe();
  }, []);

  const clearError = (key) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Address.js 기반 시/도
  const sidoOptions = useMemo(() => {
    const raw = hangjungdong?.sido || [];
    return raw.map((item) => ({
      code: item.sido,
      name: item.codeNm,
    }));
  }, []);

  const residenceSigugunOptions = useMemo(() => {
    if (!form.residence.sidoCode) return [];
    return (hangjungdong?.sigugun || [])
      .filter((item) => item.sido === form.residence.sidoCode)
      .map((item) => ({
        code: item.sigugun,
        name: item.codeNm,
      }));
  }, [form.residence.sidoCode]);

  const workSigugunOptions = useMemo(() => {
    if (!form.workArea.sidoCode) return [];
    return (hangjungdong?.sigugun || [])
      .filter((item) => item.sido === form.workArea.sidoCode)
      .map((item) => ({
        code: item.sigugun,
        name: item.codeNm,
      }));
  }, [form.workArea.sidoCode]);

  const maritalLabel = useMemo(() => {
    if (form.maritalStatus === "single") return "가입 가능합니다.";
    if (form.maritalStatus === "divorced") return "돌싱입니다. 가입 계속";
    if (form.maritalStatus === "married") return "기혼입니다. 가입 제한";
    return "";
  }, [form.maritalStatus]);

  const residenceText = form.residence.sido
    ? `${form.residence.sido}${form.residence.sigugun ? ` ${form.residence.sigugun}` : ""}`
    : "";

  const workAreaText = form.workArea.sido
    ? `${form.workArea.sido}${form.workArea.sigugun ? ` ${form.workArea.sigugun}` : ""}`
    : "";

  const canNext = useMemo(() => {
    if (saving || loading) return false;
    return (
      form.maritalStatus &&
      form.maritalStatus !== "married" &&
      form.mbti &&
      form.job &&
      form.education &&
      form.residence.sido &&
      form.residence.sigugun &&
      form.workArea.sido &&
      form.workArea.sigugun
    );
  }, [form, saving, loading]);

  const validate = () => {
    const next = {};
    if (!form.maritalStatus || form.maritalStatus === "married") next.maritalStatus = "기혼자는 가입이 제한됩니다.";
    if (!form.mbti) next.mbti = "MBTI를 선택해주세요.";
    if (!form.job) next.job = "직업을 선택해주세요.";
    if (!form.education) next.education = "최종학력을 선택해주세요.";
    if (!form.residence.sido || !form.residence.sigugun) next.residence = "거주지역을 선택해주세요.";
    if (!form.workArea.sido || !form.workArea.sigugun) next.workArea = "근무지역(활동지)을 선택해주세요.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePickMarital = (value) => {
    if (value === "married") {
      setForm((prev) => ({ ...prev, maritalStatus: "married" }));
      clearError("maritalStatus");
      setMarriedBlockedModalOpen(true);
      return;
    }

    setForm((prev) => ({ ...prev, maritalStatus: value }));
    clearError("maritalStatus");
  };

  const handlePickResidenceSido = (opt) => {
    setForm((prev) => ({
      ...prev,
      residence: { sido: opt.name, sidoCode: opt.code, sigugun: "", sigugunCode: "" },
    }));
    clearError("residence");
    setResSidoSheetOpen(false);
    setTimeout(() => setResSigugunSheetOpen(true), 120);
  };

  const handlePickResidenceSigugun = (opt) => {
    setForm((prev) => ({
      ...prev,
      residence: { ...prev.residence, sigugun: opt.name, sigugunCode: opt.code },
    }));
    clearError("residence");
    setResSigugunSheetOpen(false);
  };

  const handlePickWorkSido = (opt) => {
    setForm((prev) => ({
      ...prev,
      workArea: { sido: opt.name, sidoCode: opt.code, sigugun: "", sigugunCode: "" },
    }));
    clearError("workArea");
    setWorkSidoSheetOpen(false);
    setTimeout(() => setWorkSigugunSheetOpen(true), 120);
  };

  const handlePickWorkSigugun = (opt) => {
    setForm((prev) => ({
      ...prev,
      workArea: { ...prev.workArea, sigugun: opt.name, sigugunCode: opt.code },
    }));
    clearError("workArea");
    setWorkSigugunSheetOpen(false);
  };

  const handleSaveAndNext = async () => {
    if (!firebaseUser) return;
    if (!validate()) return;

    try {
      setSaving(true);

      const ref = doc(db, "users", firebaseUser.uid);

      const basePatch = {
        maritalStatus: form.maritalStatus,
        mbti: form.mbti,
        job: form.job,
        education: form.education,

        residence: {
          sido: form.residence.sido,
          sidoCode: form.residence.sidoCode,
          sigugun: form.residence.sigugun,
          sigugunCode: form.residence.sigugunCode,
        },
        workArea: {
          sido: form.workArea.sido,
          sidoCode: form.workArea.sidoCode,
          sigugun: form.workArea.sigugun,
          sigugunCode: form.workArea.sigugunCode,
        },

        address_sido: form.residence.sido,
        address_sigugun: form.residence.sigugun,
        company_location_sido: form.workArea.sido,
        company_location_sigugun: form.workArea.sigugun,

        profile_setup_step: 1,
        profile_setup_required_done: true,
        date_sleep: false,
      };

      const nextUser = {
        ...(currentUser || {}),
        ...basePatch,
      };

      const { patch: reviewPatch } = buildDatingReviewPatch(nextUser, currentUser || {});

      await setDoc(
        ref,
        {
          ...basePatch,
          ...reviewPatch,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      router.push("/profile/photos");
    } catch (e) {
      console.error("[ProfileSetupFlow] save error:", e);
      alert("저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ProfileSetupCard
        formView={{
          maritalLabel,
          mbti: form.mbti,
          job: form.job,
          education: form.education,
          residenceText,
          workAreaText,
        }}
        errors={errors}
        saving={saving}
        canNext={canNext}
        onOpenMarital={() => setMarriedBlockedModalOpen(true)}
        onOpenMbti={() => setMbtiModalOpen(true)}
        onOpenJob={() => setJobSheetOpen(true)}
        onOpenEducation={() => setEducationSheetOpen(true)}
        onOpenResidence={() => setResSidoSheetOpen(true)}
        onOpenWorkArea={() => setWorkSidoSheetOpen(true)}
        onSubmitNext={handleSaveAndNext}
      />

      {/* 기혼여부 선택 (간단 리스트 모달 형태) */}


      {/* 기혼 차단 안내 모달 */}
      <MarriedBlockedModal
        open={marriedBlockedModalOpen}
        onPickDivorced={() => {
          setMarriedBlockedModalOpen(false);
          setForm((prev) => ({ ...prev, maritalStatus: "divorced" }));
        }}
        onPickSingle={() => {
          setMarriedBlockedModalOpen(false);
          setForm((prev) => ({ ...prev, maritalStatus: "single" }));
        }}
      />

      {/* MBTI */}
      <MbtiModal
        open={mbtiModalOpen}
        value={form.mbti}
        onClose={() => setMbtiModalOpen(false)}
        onConfirm={(mbti) => {
          setForm((prev) => ({ ...prev, mbti }));
          clearError("mbti");
          setMbtiModalOpen(false);
        }}
      />

      {/* 직업 */}
      <SelectListSheet
        open={jobSheetOpen}
        title="직업 선택"
        options={JOB_OPTIONS}
        selectedValue={form.job}
        onClose={() => setJobSheetOpen(false)}
        onSelect={(value) => {
          setForm((prev) => ({ ...prev, job: value }));
          clearError("job");
          setJobSheetOpen(false);
        }}
      />

      {/* 학력 */}
      <SelectListSheet
        open={educationSheetOpen}
        title="최종학력 선택"
        options={EDUCATION_OPTIONS}
        selectedValue={form.education}
        onClose={() => setEducationSheetOpen(false)}
        onSelect={(value) => {
          setForm((prev) => ({ ...prev, education: value }));
          clearError("education");
          setEducationSheetOpen(false);
        }}
      />

      {/* 거주지역 시/도 */}
      <SelectListSheet
        open={resSidoSheetOpen}
        title="시/도 선택"
        options={sidoOptions}
        selectedValue={form.residence.sidoCode}
        labelKey="name"
        valueKey="code"
        onClose={() => setResSidoSheetOpen(false)}
        onSelect={(opt) => handlePickResidenceSido(opt)}
      />

      {/* 거주지역 구/군 */}
      <SelectListSheet
        open={resSigugunSheetOpen}
        title="구/군 선택"
        options={residenceSigugunOptions}
        selectedValue={form.residence.sigugunCode}
        labelKey="name"
        valueKey="code"
        onClose={() => setResSigugunSheetOpen(false)}
        onSelect={(opt) => handlePickResidenceSigugun(opt)}
      />

      {/* 근무지역 시/도 */}
      <SelectListSheet
        open={workSidoSheetOpen}
        title="시/도 선택"
        options={sidoOptions}
        selectedValue={form.workArea.sidoCode}
        labelKey="name"
        valueKey="code"
        onClose={() => setWorkSidoSheetOpen(false)}
        onSelect={(opt) => handlePickWorkSido(opt)}
      />

      {/* 근무지역 구/군 */}
      <SelectListSheet
        open={workSigugunSheetOpen}
        title="구/군 선택"
        options={workSigugunOptions}
        selectedValue={form.workArea.sigugunCode}
        labelKey="name"
        valueKey="code"
        onClose={() => setWorkSigugunSheetOpen(false)}
        onSelect={(opt) => handlePickWorkSigugun(opt)}
      />
    </>
  );
}