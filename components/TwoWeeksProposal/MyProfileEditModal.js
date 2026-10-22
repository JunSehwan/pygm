import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiCheck, FiExternalLink, FiFileText, FiX } from "react-icons/fi";
import {
  ACTIVITY_AREAS,
  JOB_CATEGORIES,
  TIME_SLOTS,
} from "./constants";
import {
  CHILDREN_PLAN_OPTIONS,
  COMPANY_SCALE_OPTIONS,
  DRINKING_FREQUENCY_OPTIONS,
  DRINKING_PREFERENCE_OPTIONS,
  EDUCATION_OPTIONS,
  INTEREST_GROUPS,
  PREFERRED_STYLE_OPTIONS,
  MARRIAGE_PLAN_OPTIONS,
  RELIGION_OPTIONS,
  RELIGION_PREFERENCE_OPTIONS,
  SMOKING_OPTIONS,
  SMOKING_PREFERENCE_OPTIONS,
} from "../TwoWeeksRegister/constants";
import {
  buildProfileEditInitialForm,
  validateProfileEditForm,
} from "./helpers";
import PhotoEditGrid from "./PhotoEditGrid";
import { getVerificationDocumentStatus } from "./proposalService";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function FieldError({ children }) {
  if (!children) return null;
  return <div className="mt-2 text-xs font-medium text-red-500">{children}</div>;
}

function TextInput({ value, onChange, placeholder, type = "text", error, maxLength }) {
  return (
    <div>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cx(
          "h-12 w-full rounded-xl border bg-white px-4 text-sm font-medium text-[#172f4c] outline-none transition placeholder:text-[#a2adba] focus:border-[#326bda] focus:ring-2 focus:ring-[#326bda]/10",
          error ? "border-red-300" : "border-zinc-200"
        )}
      />
      <FieldError>{error}</FieldError>
    </div>
  );
}

function TextArea({ value, onChange, placeholder, error }) {
  return (
    <div>
      <textarea
        value={value}
        maxLength={80}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className={cx(
          "w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm font-medium leading-7 text-[#172f4c] outline-none transition placeholder:text-[#a2adba] focus:border-[#326bda] focus:ring-2 focus:ring-[#326bda]/10",
          error ? "border-red-300" : "border-zinc-200"
        )}
      />
      <div className="mt-1 flex justify-between">
        <FieldError>{error}</FieldError>
        <span className="ml-auto text-xs text-zinc-400">{value?.length || 0} / 80</span>
      </div>
    </div>
  );
}

function SelectBox({ value, onChange, options, placeholder, error }) {
  return (
    <div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cx(
          "h-12 w-full rounded-xl border bg-white px-4 text-sm font-semibold text-[#172f4c] outline-none transition focus:border-[#326bda] focus:ring-2 focus:ring-[#326bda]/10",
          value ? "text-zinc-950" : "text-zinc-400",
          error ? "border-red-300" : "border-zinc-200"
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((item) => {
          const optionValue = typeof item === "object" ? item.value : item;
          const optionLabel = typeof item === "object" ? item.label : item;

          return (
            <option key={optionValue} value={optionValue}>{optionLabel}</option>
          );
        })}
      </select>
      <FieldError>{error}</FieldError>
    </div>
  );
}

function ChipGroup({ options, value = [], onChange, error }) {
  const toggle = (option) => {
    const selected = value.includes(option);
    const next = selected ? value.filter((item) => item !== option) : [...value, option];
    onChange(next);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value.includes(option);

          return (
            <button
              type="button"
              key={option}
              onClick={() => toggle(option)}
              className={cx(
                "rounded-xl border border-solid px-3 py-2 text-sm font-semibold transition",
                selected
                  ? "border-[#326bda] bg-[#edf4ff] text-[#2568c7]"
                  : "border-[#e0e7f0] bg-white text-[#506a88] hover:border-[#86ace7]"
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}

function Label({ title, sub }) {
  return (
    <div className="mb-2">
      <div className="text-sm font-black text-zinc-950">{title}</div>
      {sub ? <div className="mt-1 break-keep text-xs leading-5 text-zinc-500">{sub}</div> : null}
    </div>
  );
}

function SignalField({ number, title, optional = false, description = "", wide = false, children }) {
  return (
    <div
      className={cx(
        "border-b border-[#e8edf5] py-4 border-solid last:border-b-0",
        wide ? "md:col-span-2" : ""
      )}
    >
      <div className="flex items-start gap-3">

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-zinc-950">
              {title}
              {!optional ? <span className="ml-1 text-rose-500">*</span> : null}
            </h3>
            {optional ? (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500">
                선택
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="mt-1 break-keep text-xs leading-5 text-zinc-500">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function MiniFieldLabel({ children }) {
  return <div className="mb-2 text-xs font-bold text-zinc-500">{children}</div>;
}

function MbtiSelector({ value, onChange }) {
  const [pairs, setPairs] = useState(() => /^[EI][NS][TF][JP]$/.test(value || "") ? value.split("") : ["", "", "", ""]);
  const groups = [["E", "I"], ["S", "N"], ["T", "F"], ["J", "P"]];
  const select = (index, letter) => {
    const next = [...pairs]; next[index] = letter; setPairs(next);
    onChange(next.every(Boolean) ? next.join("") : "");
  };
  return <div className="space-y-3">
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{groups.map((group, index) => <div key={index} className="flex gap-1">{group.map(letter => <button key={letter} type="button" aria-pressed={pairs[index] === letter} onClick={() => select(index, letter)} className={`min-h-11 min-w-0 flex-1 rounded-xl border text-sm font-bold transition ${pairs[index] === letter ? "border-[#326bda] bg-[#eaf2ff] text-[#2568c7]" : "border-[#e0e7f0] border-solid bg-white text-[#61748d] hover:border-[#a4bee4]"}`}>{letter}</button>)}</div>)}</div>
    <button type="button" onClick={() => { setPairs(["", "", "", ""]); onChange("모름"); }} className="text-xs font-semibold text-[#75869a] underline underline-offset-2">잘 모르겠어요</button>
  </div>;
}

export default function MyProfileEditModal({
  open,
  application,
  editable,
  saving,
  uploadProgress,
  onClose,
  onSave,
  onSubmitVerification,
}) {
  const [form, setForm] = useState(() => buildProfileEditInitialForm(application));
  const [errors, setErrors] = useState({});
  const [verificationFile, setVerificationFile] = useState(null);
  const [verificationPreviewUrl, setVerificationPreviewUrl] = useState("");
  const [currentVerification, setCurrentVerification] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationLoadError, setVerificationLoadError] = useState("");
  const verificationInputRef = useRef(null);
  const modalScrollRef = useRef(null);
  const [portalHost, setPortalHost] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    setPortalHost(document.body);
    // Freeze the document behind the modal, but leave the inner form scrollable.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event) => {
      if (event.key === "Escape" && !saving) onClose?.();
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose, saving]);

  useEffect(() => {
    if (!open) return;
    setForm(buildProfileEditInitialForm(application));
    setErrors({});
    setVerificationFile(null);
    if (modalScrollRef.current) modalScrollRef.current.scrollTop = 0;
  }, [application, open]);

  useEffect(() => {
    if (!open || !application?.id) return undefined;
    let cancelled = false;
    setVerificationLoading(true);
    setVerificationLoadError("");

    getVerificationDocumentStatus({ application })
      .then((result) => {
        if (!cancelled) setCurrentVerification(result?.document || null);
      })
      .catch((error) => {
        if (!cancelled) setVerificationLoadError(error?.message || "현재 인증자료를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setVerificationLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [application?.id, open]);

  useEffect(() => {
    if (!verificationFile) {
      setVerificationPreviewUrl("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(verificationFile);
    setVerificationPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [verificationFile]);

  if (!open || !portalHost) return null;

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    const nextErrors = validateProfileEditForm(form);

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    await onSave(form);
  };

  const submitVerification = async () => {
    if (!verificationFile) {
      setErrors((prev) => ({ ...prev, verificationDocument: "새 인증자료 파일을 선택해주세요." }));
      return;
    }
    const ok = await onSubmitVerification?.(verificationFile);
    if (ok) {
      try {
        const result = await getVerificationDocumentStatus({ application });
        setCurrentVerification(result?.document || null);
      } catch {
        setCurrentVerification({
          name: verificationFile.name,
          type: verificationFile.type,
          size: verificationFile.size,
          url: "",
        });
      }
      setVerificationFile(null);
      if (verificationInputRef.current) verificationInputRef.current.value = "";
      setErrors((prev) => ({ ...prev, verificationDocument: "" }));
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 px-2 py-2 backdrop-blur-sm sm:px-4 sm:py-6"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose?.(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tw-edit-profile-heading"
        className="mx-auto flex min-h-0 w-full max-w-[650px] flex-col overflow-hidden rounded-[22px] bg-[#f6f8fb] shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
        style={{ height: "calc(100dvh - 16px)", maxHeight: "780px" }}
      >
        <div className="z-10 flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-5 py-4 md:px-7">
          <div>
            
            <h2 id="tw-edit-profile-heading" className="text-xl font-black tracking-[-0.035em] text-blue-600">내 프로필 수정</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-50"
            aria-label="닫기"
          >
            <FiX />
          </button>
        </div>

        <div
          ref={modalScrollRef}
          tabIndex={0}
          aria-label="프로필 수정 입력 항목 (세로 스크롤)"
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-3 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#326bda] sm:p-4"
          style={{ overflowY: "auto", WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
        >
          <p className="px-1 text-[13px] leading-6 text-[#70849b]">변경 내용은 다음 소개부터 반영돼요.</p>

          {!editable ? (
            <div className="mt-5 rounded-3xl border border-zinc-200 bg-white p-6 text-center">
              <div className="text-lg font-black text-zinc-950">현재는 수정할 수 없습니다</div>
              <p className="mt-2 break-keep text-sm leading-6 text-zinc-500">
                진행 중인 제안·일정·만남·피드백 처리가 끝난 뒤 일반 프로필을 수정할 수 있습니다. 잘못 제출한 직업 인증자료는 아래에서 별도로 보완할 수 있습니다.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              <section className="rounded-[20px] border border-[#e5ebf4] bg-white p-4 sm:p-5">
                <Label
                  title="프로필 사진"
                  sub="대표사진 포함 최소 3장 · 최대 5장 · 권장 4:5"
                />
                <PhotoEditGrid
                  photos={form.photos}
                  onChange={(photos) => update("photos", photos)}
                  error={errors.photos}
                />
              </section>

              <section className="grid gap-5 rounded-[20px] border border-[#e5ebf4] bg-white p-4 sm:grid-cols-2 sm:p-5">
                <div>
                  <Label title="닉네임"
                  //  sub="오프라인 만남에서 부르기 좋은 이름으로 입력해주세요."
                    />
                  <TextInput
                    value={form.nickname}
                    onChange={(value) => update("nickname", value)}
                    placeholder="예: 차분한 산책러"
                    error={errors.nickname}
                    maxLength={16}
                  />
                </div>

                <div>
                  <Label title="직업군" />
                  <SelectBox
                    value={form.jobCategory}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        jobCategory: value,
                        companyScale: value === "회사원" ? prev.companyScale || "" : "",
                      }))
                    }
                    options={JOB_CATEGORIES}
                    placeholder="직업군 선택"
                    error={errors.jobCategory}
                  />
                </div>

                {form.jobCategory === "회사원" ? (
                  <div>
                    <Label title="회사 유형"
                    //  sub="현재 재직 중인 회사 기준으로 선택해주세요." 
                     />
                    <SelectBox
                      value={form.companyScale}
                      onChange={(value) => update("companyScale", value)}
                      options={COMPANY_SCALE_OPTIONS}
                      placeholder="회사 유형 선택"
                      error={errors.companyScale}
                    />
                  </div>
                ) : null}

                <div>
                  <Label title="회사 또는 활동명" />
                  <TextInput
                    value={form.organizationName}
                    onChange={(value) => update("organizationName", value)}
                    placeholder="예: 00기업"
                    error={errors.organizationName}
                    maxLength={30}
                  />
                </div>

              </section>

              <section className="rounded-[20px] border border-[#e5ebf4] bg-white p-4 sm:p-5" aria-label="학교와 성향">
                <h3 className="text-base font-extrabold text-blue-600">학력과 관심사</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div><Label title="최종 학력"/><SelectBox value={form.educationLevel || ""} onChange={v => update("educationLevel",v)} options={EDUCATION_OPTIONS} placeholder="학력 선택"/></div>
                  <div><Label title="학교명"/><TextInput value={form.schoolName || ""} onChange={v => update("schoolName",v)} placeholder="한국대학교" maxLength={80} error={errors.schoolName}/></div>
                  <div className="sm:col-span-2"><Label title="MBTI"/><MbtiSelector value={form.mbti || ""} onChange={v => update("mbti",v)} /></div>
                </div>
                <div className="mt-5"><Label title="관심사" sub="여러 개를 골라도 좋아요."/>
                  <div className="space-y-4">{INTEREST_GROUPS.map(group => <div key={group.name}><p className="mb-2 text-xs font-bold text-[#697f96]">{group.name}</p><ChipGroup options={group.items} value={form.interests || []} onChange={value => update("interests", value)} /></div>)}</div>
                  <FieldError>{errors.interests}</FieldError>
                </div>
              </section>

              <section className="rounded-[20px] border border-[#e5ebf4] bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[17px] font-extrabold text-blue-600">생활정보와 가치관</div>
        
                  </div>
                  
                </div>

                <div className="mt-4 grid gap-x-5 gap-y-1 sm:grid-cols-2">
                  <SignalField number="1" title="결혼 의향">
                    <SelectBox
                      value={form.marriagePlan}
                      onChange={(value) => update("marriagePlan", value)}
                      options={MARRIAGE_PLAN_OPTIONS}
                      placeholder="결혼에 대한 생각을 선택해주세요"
                      error={errors.marriagePlan}
                    />
                  </SignalField>

                  <SignalField number="2" title="자녀 계획">
                    <SelectBox
                      value={form.childrenPlan}
                      onChange={(value) => update("childrenPlan", value)}
                      options={CHILDREN_PLAN_OPTIONS}
                      placeholder="자녀 계획을 선택해주세요"
                      error={errors.childrenPlan}
                    />
                  </SignalField>

                  <SignalField number="3" title="종교" wide>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <MiniFieldLabel>현재 종교</MiniFieldLabel>
                        <SelectBox
                          value={form.religion}
                          onChange={(value) => update("religion", value)}
                          options={RELIGION_OPTIONS}
                          placeholder="현재 종교를 선택해주세요"
                          error={errors.religion}
                        />
                      </div>
                    </div>
                  </SignalField>

                  <SignalField number="4" title="흡연" wide>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <MiniFieldLabel>나의 흡연 여부</MiniFieldLabel>
                        <SelectBox
                          value={form.smoking}
                          onChange={(value) => update("smoking", value)}
                          options={SMOKING_OPTIONS}
                          placeholder="흡연 여부를 선택해주세요"
                          error={errors.smoking}
                        />
                      </div>
                    </div>
                  </SignalField>

                  <SignalField number="5" title="음주 빈도">
                    <SelectBox
                      value={form.drinkingFrequency}
                      onChange={(value) => update("drinkingFrequency", value)}
                      options={DRINKING_FREQUENCY_OPTIONS}
                      placeholder="평소 음주 빈도를 선택해주세요"
                      error={errors.drinkingFrequency}
                    />
                  </SignalField>

                  <SignalField number="6" title="키" optional>
                    <TextInput
                      value={form.height}
                      onChange={(value) => update("height", value.replace(/[^0-9]/g, "").slice(0, 3))}
                      placeholder="예: 175"
                      error={errors.height}
                      type="tel"
                    />
                  </SignalField>

                  <SignalField
                    number="7"
                    title="짧은 자기소개"
                    description="성격, 좋아하는 것, 어떤 만남을 원하는지 편하게 적어주세요."
                    wide
                  >
                    <TextArea
                      value={form.introduction}
                      onChange={(value) => update("introduction", value)}
                      placeholder="예: 주말에는 카페를 가거나 한강 걷는 걸 좋아해요."
                      error={errors.introduction}
                    />
                  </SignalField>
                </div>
              </section>

              <section className="rounded-[20px] border border-[#e5ebf4] bg-white p-4 sm:p-5">
                <Label
                  title="활동 지역"
                  sub="실제로 만날 수 있는 지역을 선택해주세요."
                />
                <ChipGroup
                  options={ACTIVITY_AREAS}
                  value={form.activityAreas}
                  onChange={(value) => setForm((prev) => ({
                    ...prev,
                    activityAreas: value,
                    preferredArea: value.includes(prev.preferredArea) ? prev.preferredArea : "",
                  }))}
                  error={errors.activityAreas}
                />

                <div className="mt-5">
                  <Label title="가장 편한 지역 1곳" />
                  <SelectBox
                    value={form.preferredArea}
                    onChange={(value) => update("preferredArea", value)}
                    options={form.activityAreas}
                    placeholder="가장 편한 지역 선택"
                    error={errors.preferredArea}
                  />
                </div>
              </section>

              <section className="rounded-[20px] border border-[#e5ebf4] bg-white p-4 sm:p-5">
                <Label
                  title="만남 가능한 시간대"
                  sub="가능한 시간대를 선택해주세요."
                />
                <ChipGroup
                  options={TIME_SLOTS}
                  value={form.availableTimeSlots}
                  onChange={(value) => update("availableTimeSlots", value)}
                  error={errors.availableTimeSlots}
                />
              </section>

              <section className="rounded-[20px] border border-[#d9e7f7] bg-[#f8fbff] p-4 sm:p-5" aria-label="원하는 상대 조건">
                <p className="text-xs font-extrabold text-[#2d68bc]">나의 소개조건</p>
                <h3 className="mt-1 text-[18px] font-black text-blue-600">어떤 상대를 만나고 싶으세요?</h3>
                <p className="mt-1 break-keep text-xs leading-5 text-[#69809a]">내 정보와 별개로 저장돼요. 현재 소개에는 소급 적용되지 않아요.</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div><Label title="희망연령 최소"/><TextInput type="number" value={form.preferredAgeMin || ""} onChange={v => update("preferredAgeMin", v)} placeholder="최소 나이"/></div>
                  <div><Label title="희망연령 최대"/><TextInput type="number" value={form.preferredAgeMax || ""} onChange={v => update("preferredAgeMax", v)} placeholder="최대 나이"/></div>
                </div>
                <FieldError>{errors.preferredAgeRange}</FieldError>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div><Label title="상대 흡연"/><SelectBox value={form.smokingPreference} onChange={v => update("smokingPreference",v)} options={SMOKING_PREFERENCE_OPTIONS} placeholder="흡연 허용 범위" error={errors.smokingPreference}/></div>
                  <div><Label title="상대 종교"/><SelectBox value={form.religionPreference} onChange={v => update("religionPreference",v)} options={RELIGION_PREFERENCE_OPTIONS} placeholder="종교 수용 범위" error={errors.religionPreference}/></div>
                </div>
                <div className="mt-5"><Label title="원하는 상대의 음주"/><SelectBox value={form.preferredDrinking || ""} onChange={v => update("preferredDrinking",v)} options={DRINKING_PREFERENCE_OPTIONS} placeholder="선택사항"/></div>
                <div className="mt-5"><Label title="상대방 스타일" sub="최대 3개"/><ChipGroup options={PREFERRED_STYLE_OPTIONS} value={form.preferredStyles || []} onChange={value => update("preferredStyles",value.slice(0,3))} error={errors.preferredStyles}/></div>
                <div className="mt-5"><Label title="선호 직업군" sub="최대 2개"/><ChipGroup options={JOB_CATEGORIES} value={form.preferredJobCategories || []} onChange={value => update("preferredJobCategories",value.slice(0,2))} error={errors.preferredJobCategories}/></div>
                <div className="mt-5"><Label title="추가로 바라는 점"/><textarea rows={3} maxLength={300} value={form.additionalPreference || ""} onChange={e => update("additionalPreference",e.target.value)} placeholder="꼭 전하고 싶은 조건이 있다면 적어주세요." className="w-full resize-none rounded-xl border border-[#dbe4ef] bg-white p-3 text-sm leading-6 outline-none focus:border-[#326bda]"/><FieldError>{errors.additionalPreference}</FieldError></div>
              </section>
            </div>
          )}

          <section className="mt-6 rounded-3xl border  border-blue-200 bg-blue-50 p-4 md:p-5">
            <Label
              title="직업 인증자료 다시 제출"
              sub="직업을 확인할 수 있는 자료를 제출해주세요. (명함·재직증명·학생증 등)"
            />
            <div className="rounded-2xl bg-white p-4 text-xs  leading-5 text-zinc-600">
              주민등록번호 등 민감정보는 가리고 제출해주세요. JPG·PNG·WEBP, 최대 15MB까지 가능하며  인증자료는 상대방에게 공개되지 않습니다.
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-blue-200 bg-white p-4">
                <div className="text-xs font-black text-zinc-500">현재 제출된 자료</div>
                {verificationLoading ? (
                  <div className="mt-3 text-sm font-semibold text-zinc-400">불러오는 중...</div>
                ) : currentVerification ? (
                  <div className="mt-3">
                    {String(currentVerification.type || "").startsWith("image/") && currentVerification.url ? (
                      <a href={currentVerification.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                        <img src={currentVerification.url} alt="현재 직업 인증자료" className="h-36 w-full object-contain" />
                      </a>
                    ) : (
                      <div className="flex h-24 items-center justify-center rounded-xl bg-zinc-50 text-3xl text-zinc-400"><FiFileText /></div>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-xs font-bold text-zinc-700">{currentVerification.name || "인증자료"}</span>
                      {currentVerification.url ? (
                        <a href={currentVerification.url} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs font-black text-blue-700">
                          열기 <FiExternalLink />
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-sm font-semibold text-zinc-400">표시할 기존 자료가 없습니다.</div>
                )}
                {verificationLoadError ? <div className="mt-2 text-xs font-semibold text-amber-600">{verificationLoadError}</div> : null}
              </div>

              <div className="rounded-2xl border border-blue-200 bg-white p-4">
                <div className="text-xs font-black text-zinc-500">새로 선택한 자료</div>
                {verificationFile ? (
                  <div className="mt-3">
                    {verificationPreviewUrl ? (
                      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                        <img src={verificationPreviewUrl} alt="새 직업 인증자료 미리보기" className="h-36 w-full object-contain" />
                      </div>
                    ) : null}
                    <div className="mt-2 truncate text-xs font-bold text-zinc-700">{verificationFile.name}</div>
                  </div>
                ) : (
                  <div className="mt-3 text-sm font-semibold text-zinc-400">새 파일을 선택하면 여기에 표시됩니다.</div>
                )}
              </div>
            </div>
            <input
              ref={verificationInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={saving}
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                if (file && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                  setVerificationFile(null);
                  setErrors((prev) => ({ ...prev, verificationDocument: "JPG, PNG, WEBP 파일만 등록할 수 있습니다." }));
                  return;
                }
                if (file && file.size > 15 * 1024 * 1024) {
                  setVerificationFile(null);
                  setErrors((prev) => ({ ...prev, verificationDocument: "15MB 이하 파일을 선택해주세요." }));
                  return;
                }
                setVerificationFile(file);
                setErrors((prev) => ({ ...prev, verificationDocument: "" }));
              }}
              className="mt-4 block w-full rounded-xl border border-blue-200 bg-white px-3 py-3 text-sm font-semibold text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-950 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
            />
            <FieldError>{errors.verificationDocument}</FieldError>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={submitVerification}
                disabled={!verificationFile || saving}
                className="h-11 rounded-full bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                인증자료 제출 · 재검토 요청
              </button>
            </div>
          </section>

        </div>
        <div className="z-10 shrink-0 border-t border-solid border-[#e1e8f2] bg-white px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_28px_rgba(30,55,90,.06)] sm:px-4">
          {saving ? <div role="status" className="mb-2 flex items-center gap-3 text-xs font-bold text-[#42678c]">
            <span>프로필 저장 중 · {Math.min(100, Math.max(0, uploadProgress || 0))}%</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e9eef5]"><div className="h-full rounded-full bg-[#326bda] transition-all" style={{ width: `${Math.max(0, Math.min(uploadProgress || 0, 100))}%` }}/></div>
          </div> : null}
          <div className="grid grid-cols-2 w-full gap-2 sm:ml-auto ">
            <button type="button" onClick={onClose} disabled={saving} className="h-12 rounded-xl border border-[#d6e0ed] bg-white px-3 text-sm font-bold text-[#52677f] transition hover:bg-[#f4f7fb] disabled:opacity-50">닫기</button>
            <button type="button" onClick={submit} disabled={!editable || saving} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#286ad3] px-3 text-sm font-extrabold text-white transition hover:bg-[#195ab9] disabled:cursor-not-allowed disabled:opacity-50"><FiCheck aria-hidden="true"/>{saving ? "저장 중..." : "수정 내용 저장"}</button>
          </div>
        </div>
      </div>
    </div>
  , document.body);
}
