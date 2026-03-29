import React from "react";
import { useRouter } from "next/router";
import RowField from "./RowField";

export default function ProfileSetupCard({
  formView,
  errors,
  saving,
  canNext,
  onOpenMarital,
  onOpenMbti,
  onOpenJob,
  onOpenEducation,
  onOpenResidence,
  onOpenWorkArea,
  onSubmitNext,
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col md:min-h-[760px]">
      <div className="px-5 pt-5 pb-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
          aria-label="뒤로가기"
        >
          ←
        </button>

        <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-900">
          첫 만남 전,<br/>
          기본 프로필부터 맞춰볼게요.
        </h1>
        <p className="mt-3 whitespace-pre-line text-[14px] leading-5 text-slate-500">
          필요정보 입력후에 매칭이 진행됩니다.
          {"\n"}2~3분 정보입력을 하고 나의 인연을 만나보세요!
        </p>
      </div>

      <div className="flex-1 px-5">
        <RowField
          label="기혼여부"
          value={formView.maritalLabel}
          placeholder="선택해주세요"
          required
          onClick={onOpenMarital}
          error={errors.maritalStatus}
        />

        <RowField
          label="MBTI"
          value={formView.mbti}
          placeholder="선택해주세요"
          required
          helper="MBTI는 이성분들의 관심사입니다."
          onClick={onOpenMbti}
          error={errors.mbti}
        />

        <RowField
          label="직업"
          value={formView.job}
          placeholder="선택해주세요"
          required
          onClick={onOpenJob}
          error={errors.job}
        />

        <RowField
          label="최종학력"
          value={formView.education}
          placeholder="선택해주세요"
          required
          onClick={onOpenEducation}
          error={errors.education}
        />

        <RowField
          label="거주지역"
          value={formView.residenceText}
          placeholder="시/도, 구/군 선택"
          required
          onClick={onOpenResidence}
          error={errors.residence}
        />

        <RowField
          label="근무지역(활동지)"
          value={formView.workAreaText}
          placeholder="시/도, 구/군 선택"
          required
          onClick={onOpenWorkArea}
          error={errors.workArea}
        />
      </div>

      <div className="mt-4">
        <button
          type="button"
          disabled={!canNext}
          onClick={onSubmitNext}
          className="flex h-[58px] w-full items-center justify-center bg-[#ff4338] text-[18px] font-extrabold text-white disabled:opacity-50"
        >
          {saving ? "저장 중..." : "다음"}
        </button>
      </div>
    </div>
  );
}