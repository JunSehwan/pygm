import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { PiArrowLeft } from "react-icons/pi";

const cutePart1 = [
  "설렘",
  "두근",
  "심쿵",
  "달달",
  "말랑",
  "몽글",
  "반짝",
  "폭신",
  "소곤",
  "콩닥",
];

const cutePart2 = [
  "토끼",
  "고양",
  "여우",
  "곰돌",
  "햄찌",
  "병아",
  "고래",
  "하트",
  "별빛",
  "솜사탕",
];

function generateCuteNickname() {
  const p1 = cutePart1[Math.floor(Math.random() * cutePart1.length)];
  const p2 = cutePart2[Math.floor(Math.random() * cutePart2.length)];
  const base = `${p1}${p2}`;

  let num = "";
  if (base.length >= 6) num = String(Math.floor(Math.random() * 900) + 100);
  else num = String(Math.floor(Math.random() * 9000) + 1000);

  let nickname = `${base}${num}`;
  if (nickname.length > 10) nickname = `${p1}${p2.slice(0, 1)}${num}`;

  return nickname.slice(0, 10);
}

function genderLabel(gender) {
  if (gender === "male") return "남성";
  if (gender === "female") return "여성";
  return "";
}

function FieldErrorText({ children }) {
  if (!children) return null;
  return <p className="mt-2 text-[12px] text-rose-500">{children}</p>;
}

function FloatingField({
  label,
  value,
  onChange,
  type = "text",
  readOnly = false,
  disabled = false,
  maxLength,
  inputMode,
  autoComplete,
  error = false,
}) {
  const bgClass = readOnly ? "bg-zinc-50" : "bg-white";

  return (
    <label
      className={`relative flex h-[56px] w-full items-center rounded-md border-solid transition ${error
          ? "border-rose-400"
          : "border-zinc-200 focus-within:border-violet-500"
        } ${bgClass}`}
    >
      <input
        type={type}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        disabled={disabled}
        maxLength={maxLength}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder=" "
        className={`peer h-full w-full border-t-0 border-x-0 border-b-1 border-slate-200 bg-transparent px-4 pb-[8px] pt-[22px] text-[15px] text-zinc-900 outline-none ring-0 placeholder:text-transparent focus:border-0 focus:outline-none focus:ring-0 ${readOnly ? "cursor-default" : ""
          }`}
      />

      <span
        className={`pointer-events-none absolute left-3 origin-left px-1 text-zinc-400 transition-all duration-150 ${readOnly ? "bg-zinc-50" : "bg-transparent"
          } top-1/2 -translate-y-1/2 text-[14px]
        peer-focus:top-[10px] peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-violet-600
        peer-[:not(:placeholder-shown)]:top-[10px] peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:text-violet-600`}
      >
        {label}
      </span>
    </label>
  );
}

export default function SignupFormCard({
  form,
  errors,
  loading,
  canSubmit,
  phoneVerified,
  phoneVerifyLoading,
  phoneVerifyError,
  identityVerifiedData,
  isPasswordMatch,
  onFieldChange,
  onPhoneVerify,
  onSubmit,
}) {
  const router = useRouter();

  const handleGenerateNickname = () => {
    onFieldChange("nickname", generateCuteNickname());
  };

  const isTelLocked = phoneVerified;
  const isNameLocked = phoneVerified && !!identityVerifiedData?.name;
  const hasVerifiedGender = !!identityVerifiedData?.gender;
  const shouldShowGenderFallback = !phoneVerified || !hasVerifiedGender;

  const hasIdentitySummary =
    phoneVerified &&
    (identityVerifiedData?.name ||
      identityVerifiedData?.phone ||
      identityVerifiedData?.gender ||
      identityVerifiedData?.birth);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-transparent">
      <header className="sticky top-0 z-20 shrink-0 border-b border-zinc-200 bg-white px-5 pb-4 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[20px] font-bold tracking-[-0.02em] text-zinc-900">
              1분 회원가입
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            style={{ cursor: "pointer" }}
            className="flex h-12 w-12 items-center justify-center rounded-md transition hover:bg-slate-100"
            aria-label="뒤로가기"
          >
            <PiArrowLeft className="text-[20px] text-zinc-800" />
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-5 pb-8 pt-3">
        <form onSubmit={onSubmit} className="space-y-3">
          <section>
            <div className="space-y-2">
              <div>
                <FloatingField
                  label="이름"
                  value={form.username}
                  onChange={(e) => {
                    if (isNameLocked) return;
                    onFieldChange("username", e.target.value);
                  }}
                  readOnly={isNameLocked}
                  error={!!errors.username}
                />
                {!isNameLocked && errors.username ? (
                  <FieldErrorText>{errors.username}</FieldErrorText>
                ) : null}
              </div>

              <div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <FloatingField
                      label="연락처"
                      value={form.tel}
                      onChange={(e) => {
                        if (isTelLocked) return;
                        onFieldChange(
                          "tel",
                          e.target.value.replace(/[^0-9]/g, "")
                        );
                      }}
                      readOnly={isTelLocked}
                      inputMode="numeric"
                      maxLength={11}
                      error={!!errors.tel || !!errors.telVerify}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={onPhoneVerify}
                    disabled={phoneVerified || phoneVerifyLoading || loading}
                    style={{
                      cursor:
                        phoneVerified || phoneVerifyLoading || loading
                          ? "default"
                          : "pointer",
                    }}
                    className={`h-[52px] shrink-0 rounded-md px-4 text-[13px] font-semibold text-white transition disabled:opacity-60 ${phoneVerified
                        ? "bg-emerald-500"
                        : "bg-violet-500 hover:bg-violet-600"
                      }`}
                  >
                    {phoneVerifyLoading
                      ? "확인 중"
                      : phoneVerified
                        ? "인증 완료"
                        : "연락처 인증"}
                  </button>
                </div>

                {errors.tel ? <FieldErrorText>{errors.tel}</FieldErrorText> : null}
                {!errors.tel && errors.telVerify ? (
                  <FieldErrorText>{errors.telVerify}</FieldErrorText>
                ) : null}
                {phoneVerifyError ? (
                  <FieldErrorText>{phoneVerifyError}</FieldErrorText>
                ) : null}
              </div>

              {hasIdentitySummary ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-[13px] font-semibold text-emerald-700">
                    본인인증이 완료되었어요
                  </p>

                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                    {identityVerifiedData?.name ? (
                      <p className="text-[12px] text-emerald-800">
                        이름 · {identityVerifiedData.name}
                      </p>
                    ) : null}

                    {identityVerifiedData?.phone ? (
                      <p className="text-[12px] text-emerald-800">
                        연락처 · {identityVerifiedData.phone}
                      </p>
                    ) : null}

                    {identityVerifiedData?.gender ? (
                      <p className="text-[12px] text-emerald-800">
                        성별 · {genderLabel(identityVerifiedData.gender)}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {shouldShowGenderFallback ? (
                <div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onFieldChange("gender", "male")}
                      style={{ cursor: "pointer" }}
                      className={`h-12 rounded-md border border-solid text-[14px] font-semibold transition ${form.gender === "male"
                          ? "border-gray-600 bg-gray-600 text-white"
                          : "border-zinc-200 bg-white text-zinc-700"
                        }`}
                    >
                      남성
                    </button>

                    <button
                      type="button"
                      onClick={() => onFieldChange("gender", "female")}
                      style={{ cursor: "pointer" }}
                      className={`h-12 rounded-md border border-solid text-[14px] font-semibold transition ${form.gender === "female"
                          ? "border-gray-600 bg-gray-600 text-white"
                          : "border-zinc-200 bg-white text-zinc-700"
                        }`}
                    >
                      여성
                    </button>
                  </div>

                  {errors.gender ? (
                    <FieldErrorText>{errors.gender}</FieldErrorText>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>

          <section>
            <div className="space-y-2">
              <div>
                <FloatingField
                  label="이메일"
                  value={form.email}
                  onChange={(e) => onFieldChange("email", e.target.value)}
                  type="email"
                  autoComplete="email"
                  error={!!errors.email}
                />
                {errors.email ? (
                  <FieldErrorText>{errors.email}</FieldErrorText>
                ) : null}
              </div>

              <div>
                <FloatingField
                  label="비밀번호"
                  value={form.password}
                  onChange={(e) => onFieldChange("password", e.target.value)}
                  type="password"
                  autoComplete="new-password"
                  error={!!errors.passwordLength}
                />
                {errors.passwordLength ? (
                  <FieldErrorText>{errors.passwordLength}</FieldErrorText>
                ) : null}
              </div>

              <div>
                <FloatingField
                  label="비밀번호 확인"
                  value={form.passwordCheck}
                  onChange={(e) => onFieldChange("passwordCheck", e.target.value)}
                  type="password"
                  autoComplete="new-password"
                  error={!!errors.passwordMatch}
                />

                {form.passwordCheck ? (
                  <p
                    className={`mt-2 text-[12px] font-medium ${isPasswordMatch ? "text-emerald-600" : "text-rose-500"
                      }`}
                  >
                    {isPasswordMatch
                      ? "비밀번호가 일치해요."
                      : "비밀번호가 일치하지 않아요."}
                  </p>
                ) : null}

                {errors.passwordMatch ? (
                  <FieldErrorText>{errors.passwordMatch}</FieldErrorText>
                ) : null}
              </div>
            </div>
          </section>

          <section>
            <div className="space-y-3">
              <div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <FloatingField
                      label="닉네임"
                      value={form.nickname}
                      onChange={(e) => onFieldChange("nickname", e.target.value)}
                      maxLength={10}
                      error={!!errors.nickname}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateNickname}
                    style={{ cursor: "pointer" }}
                    className="h-[56px] shrink-0 rounded-md border border-solid border-zinc-200 bg-slate-100 px-4 text-[13px] font-semibold text-zinc-700 transition hover:bg-zinc-300"
                  >
                    자동생성
                  </button>
                </div>

                {errors.nickname ? (
                  <FieldErrorText>{errors.nickname}</FieldErrorText>
                ) : null}
              </div>
            </div>
          </section>

          <section className="rounded-md border border-zinc-200 bg-white px-2 py-1">
            <p className="text-[12px] leading-5 text-zinc-400">
              회원가입 시{" "}
              <Link
                href="/about/service"
                className="font-semibold text-violet-400 underline underline-offset-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                서비스 약관
              </Link>{" "}
              및{" "}
              <Link
                href="/about/privacy"
                className="font-semibold text-violet-400 underline underline-offset-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                개인정보 처리방침
              </Link>
              에 동의한 것으로
              <br />
              간주합니다.
            </p>
          </section>

          <div className="pt-1">
            <button
              type="submit"
              disabled={!canSubmit}
              style={{ cursor: canSubmit ? "pointer" : "default" }}
              className={`flex h-12 w-full items-center justify-center rounded-md text-[15px] font-semibold transition ${canSubmit
                  ? "bg-violet-600 text-white hover:bg-violet-700"
                  : "bg-zinc-200 text-zinc-400"
                }`}
            >
              {loading ? "가입 처리 중..." : "회원가입"}
            </button>

            <p className="mt-4 text-center text-[14px] text-zinc-500">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="font-semibold text-violet-600">
                로그인
              </Link>
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}