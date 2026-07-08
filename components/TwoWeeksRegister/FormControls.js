import { useEffect, useState } from "react";
import { FiChevronDown, FiImage, FiUpload, FiX } from "react-icons/fi";
import { cx } from "./helpers";

export function FieldError({ children }) {
  if (!children) return null;
  return <div data-tw-error="true" className="mt-2 text-xs font-medium text-red-500">{children}</div>;
}

export function TextInput({ value, onChange, placeholder, type = "text", disabled = false, maxLength, error }) {
  return (
    <div data-tw-field="true">
      <input
        type={type}
        value={value}
        disabled={disabled}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cx(
          "h-12 w-full rounded-xl border bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-black focus:ring-4 focus:ring-black/[0.04] md:h-14 md:text-base",
          disabled ? "bg-slate-100 text-slate-400" : "",
          error ? "border-red-300" : "border-slate-200"
        )}
      />
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function TextArea({ value, onChange, placeholder, maxLength = 40, error }) {
  return (
    <div data-tw-field="true">
      <textarea
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className={cx(
          "w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-black focus:ring-4 focus:ring-black/[0.04] md:text-base",
          error ? "border-red-300" : "border-slate-200"
        )}
      />
      <div className="mt-1 flex justify-between">
        <FieldError>{error}</FieldError>
        <span className="ml-auto text-xs text-slate-400">{value?.length || 0} / {maxLength}</span>
      </div>
    </div>
  );
}

export function SelectBox({ value, onChange, options, placeholder, error }) {
  return (
    <div data-tw-field="true">
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cx(
            "h-12 w-full appearance-none rounded-xl border bg-white px-4 pr-10 text-sm font-medium text-slate-900 outline-none transition focus:border-black focus:ring-4 focus:ring-black/[0.04] md:h-14 md:text-base",
            value ? "text-slate-900" : "text-slate-400",
            error ? "border-red-300" : "border-slate-200"
          )}
        >
          <option value="">{placeholder}</option>
          {options.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        {/* <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" /> */}
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function SegmentedButtons({ value, onChange, options, error }) {
  return (
    <div data-tw-field="true">
      <div className={cx("grid gap-3", options.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <button
              type="button"
              key={option.value}
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className={cx(
                "h-12 rounded-xl border text-sm font-semibold transition md:h-14 md:text-base",
                selected
                  ? "border-black bg-black text-white shadow-[0_14px_34px_rgba(15,23,42,0.16)]"
                  : "border-slate-200 border-solid bg-white text-slate-500 hover:border-slate-400 hover:text-slate-900"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function RadioConfirm({ checked, onChange, label, description, error }) {
  return (
    <div data-tw-field="true">
      <button
        type="button"
        onClick={() => onChange(true)}
        aria-pressed={checked}
        className={cx(
          "flex w-full border-solid items-start gap-4 rounded-2xl border bg-white p-4 text-left transition md:p-5",
          checked
            ? "border-black shadow-[0_0_0_1px_#000]"
            : "border-slate-200 hover:border-slate-400",
          error ? "border-red-300" : ""
        )}
      >
        <span
          className={cx(
            "mt-0.5 flex h-5 w-5 shrink-0 border-solid items-center justify-center rounded-full border transition",
            checked ? "border-black" : "border-slate-300"
          )}
        >
          <span className={cx("h-2.5 w-2.5 rounded-full transition", checked ? "bg-black" : "bg-transparent")} />
        </span>

        <span className="min-w-0">
          <span className="block text-sm font-black text-slate-950 md:text-base">{label}</span>
          {description ? (
            <span className="mt-1 block break-keep text-xs leading-5 text-slate-500">{description}</span>
          ) : null}
        </span>
      </button>
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function ChipGroup({ options, value = [], onToggle, max, error }) {
  return (
    <div data-tw-field="true">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value.includes(option);
          const disabled = !selected && max && value.length >= max;

          return (
            <button
              type="button"
              key={option}
              disabled={disabled}
              onClick={() => onToggle(option)}
              className={cx(
                "rounded-lg border px-4 py-2 text-sm font-semibold transition md:px-5 md:py-2.5",
                selected
                  ? "border-black bg-black text-white"
                  : "border-slate-200 border-solid bg-white text-slate-700 hover:border-slate-400",
                disabled ? "cursor-not-allowed opacity-40" : ""
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

export function useObjectUrl(file) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}

export function FileUploadBox({
  file,
  onChange,
  onRemove,
  label,
  badge,
  large = false,
  error,
}) {
  const previewUrl = useObjectUrl(file);
  const hasPreview = Boolean(file && previewUrl);

  return (
    <div data-tw-field="true">
      <label
        className={cx(
          "group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed bg-white text-center transition hover:border-black hover:bg-slate-50",
          large ? "min-h-[190px] px-6 py-8 md:min-h-[210px]" : "min-h-[178px] px-3 py-4 md:min-h-[205px]",
          error ? "border-red-300" : "border-slate-200"
        )}
      >
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (selected) onChange(selected);
            event.target.value = "";
          }}
        />

        {hasPreview ? (
          <>
            <img src={previewUrl} alt={label} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 text-left">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur">
                <FiImage className="shrink-0" />
                <span className="truncate">{file.name}</span>
              </div>
            </div>
            {onRemove ? (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onRemove();
                }}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur transition hover:bg-black"
                aria-label="파일 삭제"
              >
                <FiX />
              </button>
            ) : null}
          </>
        ) : (
          <>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-xl text-slate-500 transition group-hover:bg-black group-hover:text-white">
              <FiUpload />
            </div>

            <div className="flex min-h-[44px] flex-col items-center justify-center gap-2 text-sm font-bold leading-5 text-slate-900">
              {badge ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                  {badge}
                </span>
              ) : null}
              <span className="break-keep">{label}</span>
            </div>
            <div className="mt-1 text-xs text-slate-400">이미지 파일 (JPG, PNG, WEBP)</div>
          </>
        )}
      </label>
      <FieldError>{error}</FieldError>
    </div>
  );
}
