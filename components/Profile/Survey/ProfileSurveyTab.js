import React, { useMemo, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { FiChevronRight } from "react-icons/fi";
import { db } from "firebaseConfig";
import SurveySlideModal from "./SurveySlideModal";
import {
  SURVEY_SECTIONS,
  getQuestionAnsweredCount,
  getTotalAnsweredCount,
  getTotalQuestionCount,
} from "./SurveyConfig";

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

function SurveySectionCard({ section, user, onClick }) {
  const answered = getQuestionAnsweredCount(user, section);
  const total = section.fields.length;
  const complete = answered === total;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-md border px-4 py-4 text-left transition",
        complete ? "border-violet-200 bg-gray-200" : "border-amber-200 bg-slate-100"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[17px] font-bold text-slate-800">{section.title}</div>
          <div className={cn("mt-1 text-[13px] font-medium", complete ? "text-slate-500" : "text-amber-700")}>
            {answered} / {total}
          </div>
        </div>
        <FiChevronRight className="text-[20px] text-slate-400" />
      </div>
    </button>
  );
}

export default function ProfileSurveyTab({
  user,
  userId,
  onSaved,
}) {
  const [selectedSectionKey, setSelectedSectionKey] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedSection = useMemo(
    () => SURVEY_SECTIONS.find((section) => section.key === selectedSectionKey) || null,
    [selectedSectionKey]
  );

  const totalAnswered = useMemo(() => getTotalAnsweredCount(user), [user]);
  const totalQuestions = useMemo(() => getTotalQuestionCount(), []);

  const handleSaveSection = async (patch) => {
    if (!userId || !selectedSection) return;

    setSaving(true);

    try {
      await setDoc(
        doc(db, "users", userId),
        {
          ...patch,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      if (onSaved) {
        onSaved(patch, `${selectedSection.title}이 저장되었습니다.`);
      }

      setSelectedSectionKey("");
    } catch (error) {
      console.error("[ProfileSurveyTab] save error:", error);
      window.alert("가치관 설문 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-3 px-3 pb-8 pt-4">
        <div className="rounded-md border border-slate-200 bg-gradient-to-r from-violet-100 via-fuchsia-100 to-pink-100 px-4 py-4 shadow-[0_1px_6px_rgba(15,23,42,0.04)]">
          <div className="text-[18px] font-bold text-violet-800">가치관 설문</div>
          <div className="mt-2 text-[14px] text-slate-500">
            답변한 질문 수 / 전체 질문 수
          </div>
          <div className="mt-3 text-2xl font-black tracking-[-0.03em] text-slate-900">
            {totalAnswered} / {totalQuestions}
          </div>
        </div>

        {SURVEY_SECTIONS.map((section) => (
          <SurveySectionCard
            key={section.key}
            section={section}
            user={user}
            onClick={() => setSelectedSectionKey(section.key)}
          />
        ))}
      </div>

      <SurveySlideModal
        open={!!selectedSection}
        section={selectedSection}
        user={user}
        saving={saving}
        onClose={() => setSelectedSectionKey("")}
        onSave={handleSaveSection}
      />
    </>
  );
}