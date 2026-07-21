import { useEffect, useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";
import {
  ACTIVITY_AREAS,
  JOB_CATEGORIES,
  TIME_SLOTS,
} from "./constants";
import {
  buildProfileEditInitialForm,
  validateProfileEditForm,
} from "./helpers";
import PhotoEditGrid from "./PhotoEditGrid";

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
          "h-12 w-full rounded-xl border bg-white px-4 text-sm font-semibold text-zinc-950 outline-none transition placeholder:text-zinc-300 focus:border-zinc-950 focus:ring-4 focus:ring-zinc-950/[0.04]",
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
          "w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm font-semibold leading-6 text-zinc-950 outline-none transition placeholder:text-zinc-300 focus:border-zinc-950 focus:ring-4 focus:ring-zinc-950/[0.04]",
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
          "h-12 w-full rounded-xl border bg-white px-4 text-sm font-semibold text-zinc-950 outline-none transition focus:border-zinc-950 focus:ring-4 focus:ring-zinc-950/[0.04]",
          value ? "text-zinc-950" : "text-zinc-400",
          error ? "border-red-300" : "border-zinc-200"
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
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
                "rounded-lg border px-4 py-2 text-sm font-black transition",
                selected
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
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

export default function MyProfileEditModal({
  open,
  application,
  editable,
  saving,
  uploadProgress,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(() => buildProfileEditInitialForm(application));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm(buildProfileEditInitialForm(application));
    setErrors({});
  }, [application, open]);

  if (!open) return null;

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

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/55 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-[960px] overflow-hidden rounded-[32px] bg-[#f6f3ef] shadow-[0_28px_90px_rgba(0,0,0,0.30)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-5 py-4 backdrop-blur md:px-7">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">my profile</div>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.05em] text-zinc-950">내 프로필 수정</h2>
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

        <div className="p-5 md:p-7">
          <div className="rounded-3xl border border-orange-200 bg-orange-50 p-4">
            <div className="text-sm font-black text-orange-700">
              매칭 확정 전까지만 수정할 수 있습니다
            </div>
            <p className="mt-1 break-keep text-xs leading-5 text-orange-700/80">
              수정한 내용은 이후 후보 추천과 상대방에게 보여지는 프로필에 반영됩니다.
              이미 매칭이 확정된 뒤에는 상대에게 전달된 정보가 바뀌지 않도록 수정이 제한됩니다.
            </p>
          </div>

          {!editable ? (
            <div className="mt-5 rounded-3xl border border-zinc-200 bg-white p-6 text-center">
              <div className="text-lg font-black text-zinc-950">현재는 수정할 수 없습니다</div>
              <p className="mt-2 break-keep text-sm leading-6 text-zinc-500">
                매칭이 확정되었거나 운영상 수정 제한 상태입니다.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-6">
              <section className="rounded-3xl border border-zinc-200 bg-white p-5 md:p-6">
                <Label
                  title="프로필 사진"
                  sub="권장 4:5 · 1080×1350px · 최대 5장"
                />
                <PhotoEditGrid
                  photos={form.photos}
                  onChange={(photos) => update("photos", photos)}
                  error={errors.photos}
                />
              </section>

              <section className="grid gap-5 rounded-3xl border border-zinc-200 bg-white p-5 md:grid-cols-2 md:p-6">
                <div>
                  <Label title="닉네임" sub="오프라인 만남에서 부르기 좋은 이름으로 입력해주세요." />
                  <TextInput
                    value={form.nickname}
                    onChange={(value) => update("nickname", value)}
                    placeholder="예: 차분한 산책러"
                    error={errors.nickname}
                    maxLength={16}
                  />
                </div>

                <div>
                  <Label title="키" sub="선택 입력입니다." />
                  <TextInput
                    value={form.height}
                    onChange={(value) => update("height", value.replace(/[^0-9]/g, "").slice(0, 3))}
                    placeholder="예: 175"
                    error={errors.height}
                    type="tel"
                  />
                </div>

                <div>
                  <Label title="직업군" />
                  <SelectBox
                    value={form.jobCategory}
                    onChange={(value) => update("jobCategory", value)}
                    options={JOB_CATEGORIES}
                    placeholder="직업군 선택"
                    error={errors.jobCategory}
                  />
                </div>

                <div>
                  <Label title="회사명 / 학교명" sub="회사명 중심으로 입력하고, 대학원생만 학교명으로 작성해주세요." />
                  <TextInput
                    value={form.organizationName}
                    onChange={(value) => update("organizationName", value)}
                    placeholder="예: 00기업"
                    error={errors.organizationName}
                    maxLength={30}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label title="1줄 자기소개" sub="상대가 만나볼 이유를 느낄 수 있게 구체적으로 적어주세요." />
                  <TextArea
                    value={form.introduction}
                    onChange={(value) => update("introduction", value)}
                    placeholder="예: 주말에는 카페를 가거나 한강 걷는 걸 좋아해요."
                    error={errors.introduction}
                  />
                </div>
              </section>

              <section className="rounded-3xl border border-zinc-200 bg-white p-5 md:p-6">
                <Label
                  title="활동 지역"
                  sub="정말 이동이 어려운 지역만 해제해주세요. 인원 구성에 따라 해제한 지역도 제안될 수 있습니다."
                />
                <ChipGroup
                  options={ACTIVITY_AREAS}
                  value={form.activityAreas}
                  onChange={(value) => update("activityAreas", value)}
                  error={errors.activityAreas}
                />

                <div className="mt-5">
                  <Label title="가장 편한 지역 1곳" />
                  <SelectBox
                    value={form.preferredArea}
                    onChange={(value) => update("preferredArea", value)}
                    options={ACTIVITY_AREAS}
                    placeholder="가장 편한 지역 선택"
                    error={errors.preferredArea}
                  />
                </div>
              </section>

              <section className="rounded-3xl border border-zinc-200 bg-white p-5 md:p-6">
                <Label
                  title="만남 가능한 시간대"
                  sub="기본적으로 가능한 시간대를 넓게 열어둘수록 매칭 가능성이 높아집니다."
                />
                <ChipGroup
                  options={TIME_SLOTS}
                  value={form.availableTimeSlots}
                  onChange={(value) => update("availableTimeSlots", value)}
                  error={errors.availableTimeSlots}
                />
              </section>
            </div>
          )}

          {saving ? (
            <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5">
              <div className="text-sm font-black text-zinc-950">프로필을 저장하고 있습니다</div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full bg-zinc-950 transition-all duration-300"
                  style={{ width: `${Math.max(6, Math.min(uploadProgress || 0, 100))}%` }}
                />
              </div>
              <div className="mt-2 text-xs font-semibold text-zinc-400">{uploadProgress || 0}%</div>
            </div>
          ) : null}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-12 rounded-full border border-zinc-200 bg-white px-6 py-3 text-sm font-black text-zinc-700 transition hover:border-zinc-950 disabled:opacity-50"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!editable || saving}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-zinc-950 px-7 py-3 text-sm font-black text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiCheck />
              수정 내용 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
