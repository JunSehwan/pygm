import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import hangjungdong from "components/Common/Address";

function cn(...arr) {
  return arr.filter(Boolean).join(" ");
}

const MBTI_GROUPS = [
  [
    { key: "E", title: "외향형", desc: "타인/관계중심" },
    { key: "I", title: "내향형", desc: "개인/내면중심" },
  ],
  [
    { key: "S", title: "감각형", desc: "현실/경험중심" },
    { key: "N", title: "직관형", desc: "미래/가능성중심" },
  ],
  [
    { key: "T", title: "사고형", desc: "원칙/논리중심" },
    { key: "F", title: "감정형", desc: "관계/가치중심" },
  ],
  [
    { key: "J", title: "판단형", desc: "계획/체계중심" },
    { key: "P", title: "인식형", desc: "유연/즉흥중심" },
  ],
];


const MBTI_POSITION_KEYS = ["ei", "sn", "tf", "jp"];

function normalizeMbtiSelection(value) {
  if (value && typeof value === "object") {
    return {
      ei: ["E", "I"].includes(String(value.ei || "").toUpperCase())
        ? String(value.ei).toUpperCase()
        : "",
      sn: ["S", "N"].includes(String(value.sn || "").toUpperCase())
        ? String(value.sn).toUpperCase()
        : "",
      tf: ["T", "F"].includes(String(value.tf || "").toUpperCase())
        ? String(value.tf).toUpperCase()
        : "",
      jp: ["J", "P"].includes(String(value.jp || "").toUpperCase())
        ? String(value.jp).toUpperCase()
        : "",
    };
  }

  const text = String(value || "").trim().toUpperCase();

  return {
    ei: ["E", "I"].includes(text[0]) ? text[0] : "",
    sn: ["S", "N"].includes(text[1]) ? text[1] : "",
    tf: ["T", "F"].includes(text[2]) ? text[2] : "",
    jp: ["J", "P"].includes(text[3]) ? text[3] : "",
  };
}

function mbtiSelectionToText(value) {
  const normalized = normalizeMbtiSelection(value);
  return MBTI_POSITION_KEYS.map((key) => normalized[key] || "_").join("");
}

function FloatingInput({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  inputMode,
  type = "text",
  suffix,
}) {
  const [focused, setFocused] = useState(false);
  const active =
    focused || (value !== undefined && value !== null && String(value).length > 0);

  if (multiline) {
    return (
      <div className="relative">
        <label
          className={cn(
            "pointer-events-none absolute left-4 z-10 bg-white px-1 transition-all",
            active
              ? "top-[-8px] text-[11px] font-semibold text-violet-500"
              : "top-4 text-[15px] text-slate-400"
          )}
        >
          {label}
        </label>

        <textarea
          value={value ?? ""}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={active ? placeholder : ""}
          className="h-28 w-full resize-none rounded-md border border-slate-200 bg-white px-4 pb-3 pt-6 text-[15px] text-slate-800 outline-none placeholder:text-slate-350 transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <label
        className={cn(
          "pointer-events-none absolute left-4 z-10 bg-white px-1 transition-all",
          active
            ? "top-[-8px] text-[11px] font-semibold text-violet-500"
            : "top-4 text-[15px] text-slate-400"
        )}
      >
        {label}
      </label>

      <div className="relative">
        <input
          type={type}
          inputMode={inputMode}
          value={value ?? ""}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={active ? placeholder : ""}
          className={cn(
            "h-[58px] w-full rounded-md border border-slate-200 bg-white px-4 pt-5 text-[15px] text-slate-800 outline-none placeholder:text-slate-350 transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100",
            suffix ? "pr-12" : ""
          )}
        />
        {suffix ? (
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 pt-2 text-[14px] font-semibold text-slate-400">
            {suffix}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RadioGroup({ options, value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              "rounded-md border px-3 py-3 text-[14px] font-medium transition",
              active
                ? "border-violet-300 bg-violet-50 text-violet-700 shadow-[0_4px_14px_rgba(139,92,246,0.10)]"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
            style={{ cursor: "pointer" }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function SelectGroup({ label, value, options, onChange }) {
  return (
    <div>
      <div className="mb-2 text-[13px] font-semibold text-slate-600">{label}</div>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-[52px] w-full rounded-md border border-slate-200 bg-white px-4 text-[15px] text-slate-800 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
      >
        <option value="">선택</option>
        {options.map((item) => (
          <option key={item.value || item} value={item.value || item}>
            {item.label || item}
          </option>
        ))}
      </select>
    </div>
  );
}

function MbtiPicker({ value, onChange }) {
  const parsed = normalizeMbtiSelection(value);

  const pick = (groupIndex, key) => {
    const positionKey = MBTI_POSITION_KEYS[groupIndex];

    onChange({
      ...parsed,
      [positionKey]: key,
    });
  };

  return (
    <div>
      <div className="mb-3 text-[13px] font-semibold text-slate-600">MBTI 선택</div>

      <div className="grid grid-cols-2 gap-2">
        {MBTI_GROUPS.map((pair, groupIndex) =>
          pair.map((item) => {
            const positionKey = MBTI_POSITION_KEYS[groupIndex];
            const active = parsed[positionKey] === item.key;

            return (
              <button
                key={`${groupIndex}-${item.key}`}
                type="button"
                onClick={() => pick(groupIndex, item.key)}
                className={cn(
                  "rounded-md border border-solid p-3 text-left transition",
                  active
                    ? "border-violet-300 bg-violet-50 shadow-[0_4px_14px_rgba(139,92,246,0.10)]"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                )}
                style={{ cursor: "pointer" }}
              >
                <p
                  className={cn(
                    "text-[15px] font-black",
                    active ? "text-violet-700" : "text-slate-700"
                  )}
                >
                  {item.key}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-600">
                  {item.title}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">{item.desc}</p>
              </button>
            );
          })
        )}
      </div>

      <div className="mt-4 rounded-md border border-violet-100 bg-violet-50/60 px-3 py-3">
        <p className="text-[12px] font-semibold text-slate-500">선택 결과</p>
        <p className="mt-1 text-[20px] font-black tracking-widest text-slate-900">
          {mbtiSelectionToText(parsed)}
        </p>
      </div>
    </div>
  );
}

function AddressPicker({ label, value, onChange }) {
  const sidoOptions = useMemo(() => {
    const raw = hangjungdong?.sido || [];
    return raw.map((item) => ({
      code: item.sido,
      name: item.codeNm,
    }));
  }, []);

  const sigugunOptions = useMemo(() => {
    if (!value?.sidoCode) return [];
    return (hangjungdong?.sigugun || [])
      .filter((item) => item.sido === value.sidoCode)
      .map((item) => ({
        code: item.sigugun,
        name: item.codeNm,
      }));
  }, [value?.sidoCode]);

  return (
    <div className="space-y-4">
      <div className="text-[13px] font-semibold text-slate-600">{label}</div>

      <div>
        <div className="mb-2 text-[13px] font-semibold text-slate-500">시/도</div>
        <select
          value={value?.sidoCode || ""}
          onChange={(e) => {
            const picked = sidoOptions.find((item) => item.code === e.target.value);
            onChange({
              sido: picked?.name || "",
              sidoCode: picked?.code || "",
              sigugun: "",
              sigugunCode: "",
            });
          }}
          className="h-[52px] w-full rounded-md border border-slate-200 bg-white px-4 text-[15px] text-slate-800 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
        >
          <option value="">시/도 선택</option>
          {sidoOptions.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-2 text-[13px] font-semibold text-slate-500">시/군(구)</div>
        <select
          value={value?.sigugunCode || ""}
          onChange={(e) => {
            const picked = sigugunOptions.find((item) => item.code === e.target.value);
            onChange({
              ...(value || {}),
              sigugun: picked?.name || "",
              sigugunCode: picked?.code || "",
            });
          }}
          disabled={!value?.sidoCode}
          className="h-[52px] w-full rounded-md border border-slate-200 bg-white px-4 text-[15px] text-slate-800 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100 disabled:text-slate-400"
        >
          <option value="">시/군(구) 선택</option>
          {sigugunOptions.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function VisibilityBox({ title, visible, setVisible }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="mb-3 text-[13px] font-semibold text-slate-600">{title}</div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setVisible(true)}
          className={cn(
            "rounded-md border px-3 py-3 text-[14px] font-medium transition",
            visible
              ? "border-violet-300 bg-violet-50 text-violet-700 shadow-[0_4px_14px_rgba(139,92,246,0.10)]"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          )}
          style={{ cursor: "pointer" }}
        >
          공개
        </button>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className={cn(
            "rounded-md border px-3 py-3 text-[14px] font-medium transition",
            !visible
              ? "border-violet-300 bg-violet-50 text-violet-700 shadow-[0_4px_14px_rgba(139,92,246,0.10)]"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          )}
          style={{ cursor: "pointer" }}
        >
          비공개
        </button>
      </div>
    </div>
  );
}

export default function ProfileFieldModal({
  open,
  title,
  description,
  type = "text",
  value,
  options = [],
  extra,
  onClose,
  onSave,
  saving = false,
}) {
  const [draftValue, setDraftValue] = useState(value || "");
  const [companyPublic, setCompanyPublic] = useState(extra?.companyPublic ?? true);
  const [educationPublic, setEducationPublic] = useState(
    extra?.educationPublic ?? true
  );
  const [salaryPublic, setSalaryPublic] = useState(extra?.salaryPublic ?? false);
  const [schoolName, setSchoolName] = useState(extra?.schoolName || "");

  useEffect(() => {
    if (!open) return;

    if (type === "education") {
      setDraftValue(extra?.educationValue || value || "");
      setSchoolName(extra?.schoolName || "");
      setEducationPublic(extra?.educationPublic ?? true);
      setSalaryPublic(extra?.salaryPublic ?? false);
      return;
    }

    if (type === "salary") {
      setDraftValue(value || "");
      setCompanyPublic(extra?.companyPublic ?? true);
      setEducationPublic(extra?.educationPublic ?? true);
      setSalaryPublic(extra?.salaryPublic ?? false);
      setSchoolName(extra?.schoolName || "");
      return;
    }

    setDraftValue(value || "");
    setCompanyPublic(extra?.companyPublic ?? true);
    setEducationPublic(extra?.educationPublic ?? true);
    setSalaryPublic(extra?.salaryPublic ?? false);
    setSchoolName(extra?.schoolName || "");
  }, [
    open,
    type,
    value,
    extra?.companyPublic,
    extra?.educationPublic,
    extra?.salaryPublic,
    extra?.schoolName,
    extra?.educationValue,
  ]);

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

  const savePayload = useMemo(() => {
    if (type === "company") {
      return {
        value: String(draftValue || "").trim(),
        companyPublic,
      };
    }

    if (type === "education") {
      return {
        value: String(draftValue || "").trim(),
        schoolName: String(schoolName || "").trim(),
        educationPublic,
      };
    }

    if (type === "salary") {
      return {
        value: String(draftValue || "").trim(),
        salaryPublic,
      };
    }

    if (type === "address") {
      return draftValue || {};
    }

    return typeof draftValue === "string" ? draftValue.trim() : draftValue;
  }, [companyPublic, draftValue, educationPublic, salaryPublic, schoolName, type]);

  const headerTitle = title ? `${title} 수정` : "정보 수정";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/45 px-3 pb-3 backdrop-blur-[2px] md:items-center md:px-4 md:pb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={saving ? undefined : onClose}
        >
          <motion.div
            className="w-full max-w-[420px] overflow-hidden rounded-[22px] border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]"
            initial={{ opacity: 0, y: 24, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.99 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-100 bg-gradient-to-b from-violet-50 via-white to-white px-5 pb-4 pt-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-700">
                    기본정보
                  </div>

                  <div className="mt-3 text-[22px] font-black tracking-[-0.03em] text-slate-900">
                    {headerTitle}
                  </div>

                  {description ? (
                    <p className="mt-2 whitespace-pre-line text-[13px] leading-6 text-slate-500">
                      {description}
                    </p>
                  ) : (
                    <p className="mt-2 text-[13px] leading-6 text-slate-500">
                      내용을 입력한 뒤 저장하면 프로필에 바로 반영돼요.
                    </p>
                  )}
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

            <div className="max-h-[68vh] space-y-4 overflow-y-auto px-5 py-5">
              {(type === "text" || type === "number" || type === "company") && (
                <FloatingInput
                  label={title}
                  value={draftValue}
                  onChange={(e) => {
                    if (type === "number") {
                      setDraftValue(
                        String(e.target.value || "").replace(/[^0-9]/g, "")
                      );
                      return;
                    }
                    setDraftValue(e.target.value);
                  }}
                  placeholder="입력해주세요"
                  inputMode={type === "number" ? "numeric" : undefined}
                  suffix={type === "number" ? "cm" : ""}
                />
              )}

              {type === "select" && (
                <SelectGroup
                  label={title}
                  value={draftValue}
                  options={options}
                  onChange={setDraftValue}
                />
              )}

              {type === "salary" && (
                <>
                  <SelectGroup
                    label={title}
                    value={draftValue}
                    options={options}
                    onChange={setDraftValue}
                  />

                  <VisibilityBox
                    title="연봉 공개 설정"
                    visible={salaryPublic}
                    setVisible={setSalaryPublic}
                  />
                </>
              )}

              {type === "radio" && (
                <RadioGroup
                  value={draftValue}
                  options={options}
                  onChange={setDraftValue}
                />
              )}

              {type === "mbti" && <MbtiPicker value={draftValue} onChange={setDraftValue} />}

              {type === "address" && (
                <AddressPicker
                  label={title}
                  value={draftValue}
                  onChange={setDraftValue}
                />
              )}

              {type === "education" && (
                <>
                  <SelectGroup
                    label="최종학력"
                    value={draftValue}
                    options={options}
                    onChange={setDraftValue}
                  />

                  <FloatingInput
                    label="최종학교명"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="학교명을 입력해주세요"
                  />

                  <VisibilityBox
                    title="학교 공개 설정"
                    visible={educationPublic}
                    setVisible={setEducationPublic}
                  />
                </>
              )}

              {type === "company" && (
                <VisibilityBox
                  title="회사 공개 설정"
                  visible={companyPublic}
                  setVisible={setCompanyPublic}
                />
              )}
            </div>

            <div className="border-t border-slate-100 bg-white px-5 pb-5 pt-4">
              <button
                type="button"
                onClick={() => onSave(savePayload)}
                disabled={saving}
                className="h-12 w-full rounded-md bg-violet-600 text-[16px] font-bold text-white shadow-[0_10px_24px_rgba(124,58,237,0.24)] transition hover:bg-violet-700 disabled:opacity-60"
                style={{ cursor: "pointer" }}
              >
                {saving ? "저장중..." : "저장하기"}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="w-full pb-5 text-center text-[15px] font-medium text-slate-400 transition hover:text-slate-600 disabled:opacity-60"
              style={{ cursor: "pointer" }}
            >
              취소
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}