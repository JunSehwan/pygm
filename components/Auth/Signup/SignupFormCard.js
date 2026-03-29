import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  PiArrowLeft,
  PiSparkleDuotone,
  PiHeartStraightFill,
  PiCheckCircleFill,
  PiUser,
  PiPhone,
  PiEnvelopeSimple,
  PiLockKey,
  PiSmiley,
} from "react-icons/pi";

const fieldBase =
  "h-12 w-full rounded-md border border-zinc-200 bg-white px-4 text-[14px] text-zinc-900 outline-none placeholder:text-zinc-400 transition focus:border-violet-500";
const fieldReadonly =
  "bg-zinc-50 text-zinc-700 border-zinc-200 cursor-default";
const fieldError = "border-rose-400";

/**
 * 귀여움 중심 랜덤 닉네임 생성기 (10자 이내 고려)
 */
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

function SectionLabel({ icon: Icon, label }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <Icon className="text-[16px] text-zinc-400" />
      <span className="text-[14px] font-semibold text-zinc-800">{label}</span>
    </div>
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
    const nick = generateCuteNickname();
    onFieldChange("nickname", nick);
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
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col bg-white">
        <header className="shrink-0 border-b border-zinc-200 bg-white px-5 pb-5 pt-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              style={{ cursor: "pointer" }}
              className="flex h-10 w-10 items-center justify-center rounded-md transition hover:bg-slate-100"
              aria-label="뒤로가기"
            >
              <PiArrowLeft className="text-[20px] text-zinc-800" />
            </button>

            <div>
              <div className="text-[20px] font-bold tracking-[-0.02em] text-zinc-900">
                회원가입
              </div>
              <div className="mt-0.5 text-[13px] text-zinc-500">
                검증된 연결을 위한 첫 단계예요
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-md bg-gradient-to-br from-violet-600 via-violet-500 to-fuchsia-400 p-[1px]">
            <div className="relative rounded-md bg-gradient-to-br from-violet-600 via-violet-500 to-fuchsia-400 px-5 py-5 text-white">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-8 left-[-10px] h-24 w-24 rounded-full bg-pink-200/20 blur-2xl" />

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold text-white/95 backdrop-blur-sm">
                    <PiSparkleDuotone className="text-[14px]" />
                    CharmingSoup
                  </div>

                  <div className="mt-3 text-[22px] font-bold tracking-[-0.03em] leading-[1.3]">
                    더 진지하고
                    <br />
                    더 안전한 시작
                  </div>

                  <p className="mt-3 break-keep text-[13px] leading-6 text-white/90">
                    본인인증을 완료하고
                    <br />
                    신뢰도 있는 프로필로 시작해보세요.
                  </p>
                </div>

                <div className="shrink-0 rounded-2xl bg-white/14 p-3 backdrop-blur-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12">
                    <PiHeartStraightFill className="text-[22px] text-white" />
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-md bg-white/12 px-3 py-2 backdrop-blur-sm">
                  <div className="text-[11px] font-medium text-white/75">본인인증</div>
                  <div className="mt-1 text-[13px] font-semibold text-white">
                    더 신뢰감 있게
                  </div>
                </div>

                <div className="rounded-md bg-white/12 px-3 py-2 backdrop-blur-sm">
                  <div className="text-[11px] font-medium text-white/75">프로필</div>
                  <div className="mt-1 text-[13px] font-semibold text-white">
                    나답게 시작
                  </div>
                </div>

                <div className="rounded-md bg-white/12 px-3 py-2 backdrop-blur-sm">
                  <div className="text-[11px] font-medium text-white/75">매칭</div>
                  <div className="mt-1 text-[13px] font-semibold text-white">
                    더 자연스럽게 연결
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-5 pb-8 pt-6">
          <div className="rounded-md border border-violet-100 bg-violet-50 px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white">
                <PiCheckCircleFill className="text-[20px] text-violet-600" />
              </div>

              <div className="min-w-0">
                <div className="text-[16px] font-semibold text-zinc-900">
                  가입 전에 이것만 확인해주세요
                </div>
                <p className="mt-2 break-keep text-[14px] leading-6 text-zinc-600">
                  연락처 본인인증을 완료한 뒤
                  <br />
                  이메일과 비밀번호를 입력하면 가입할 수 있어요.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <section>
              <SectionLabel icon={PiUser} label="기본 정보" />

              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="이름 (실명 입력)"
                    value={form.username}
                    onChange={(e) => {
                      if (isNameLocked) return;
                      onFieldChange("username", e.target.value);
                    }}
                    readOnly={isNameLocked}
                    className={`${fieldBase} ${isNameLocked ? fieldReadonly : ""} ${errors.username ? fieldError : ""
                      }`}
                  />
                  {!isNameLocked && errors.username ? (
                    <FieldErrorText>{errors.username}</FieldErrorText>
                  ) : null}
                </div>

                <div>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={11}
                      placeholder="연락처 (01012345678)"
                      value={form.tel}
                      onChange={(e) => {
                        if (isTelLocked) return;
                        onFieldChange("tel", e.target.value.replace(/[^0-9]/g, ""));
                      }}
                      readOnly={isTelLocked}
                      className={`${fieldBase} ${isTelLocked ? fieldReadonly : ""} ${errors.tel || errors.telVerify ? fieldError : ""
                        }`}
                    />

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
                      className={`h-12 shrink-0 rounded-md px-4 text-[13px] font-semibold text-white transition disabled:opacity-60 ${phoneVerified
                          ? "bg-emerald-600"
                          : "bg-violet-600 hover:bg-violet-700"
                        }`}
                    >
                      {phoneVerifyLoading
                        ? "인증창 여는 중..."
                        : phoneVerified
                          ? "인증완료"
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
                    <div className="flex items-start gap-2">
                      <span className="mt-[2px] inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                        ✓
                      </span>

                      <div className="min-w-0">
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
                        className={`h-12 rounded-md border text-[14px] font-semibold transition ${form.gender === "male"
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-200 bg-white text-zinc-700"
                          }`}
                      >
                        남성
                      </button>
                      <button
                        type="button"
                        onClick={() => onFieldChange("gender", "female")}
                        style={{ cursor: "pointer" }}
                        className={`h-12 rounded-md border text-[14px] font-semibold transition ${form.gender === "female"
                            ? "border-violet-600 bg-violet-600 text-white"
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
              <SectionLabel icon={PiEnvelopeSimple} label="계정 정보" />

              <div className="space-y-3">
                <div>
                  <input
                    type="email"
                    placeholder="이메일 주소 (example@email.com)"
                    value={form.email}
                    onChange={(e) => onFieldChange("email", e.target.value)}
                    className={`${fieldBase} ${errors.email ? fieldError : ""}`}
                  />
                  {errors.email ? (
                    <FieldErrorText>{errors.email}</FieldErrorText>
                  ) : null}
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="비밀번호 (8자 이상)"
                    value={form.password}
                    onChange={(e) => onFieldChange("password", e.target.value)}
                    className={`${fieldBase} ${errors.passwordLength ? fieldError : ""}`}
                  />
                  {errors.passwordLength ? (
                    <FieldErrorText>{errors.passwordLength}</FieldErrorText>
                  ) : null}
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="비밀번호 확인"
                    value={form.passwordCheck}
                    onChange={(e) => onFieldChange("passwordCheck", e.target.value)}
                    className={`${fieldBase} ${errors.passwordMatch ? fieldError : ""}`}
                  />

                  {form.passwordCheck ? (
                    <p
                      className={`mt-2 text-[12px] font-medium ${isPasswordMatch ? "text-emerald-600" : "text-rose-500"
                        }`}
                    >
                      {isPasswordMatch ? "비밀번호가 일치해요." : "비밀번호가 일치하지 않아요."}
                    </p>
                  ) : null}

                  {errors.passwordMatch ? (
                    <FieldErrorText>{errors.passwordMatch}</FieldErrorText>
                  ) : null}
                </div>
              </div>
            </section>

            <section>
              <SectionLabel icon={PiSmiley} label="프로필 기본 설정" />

              <div className="space-y-3">
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="닉네임 (자동생성 가능)"
                      value={form.nickname}
                      onChange={(e) => onFieldChange("nickname", e.target.value)}
                      className={`${fieldBase} ${errors.nickname ? fieldError : ""}`}
                    />
                    <button
                      type="button"
                      onClick={handleGenerateNickname}
                      style={{ cursor: "pointer" }}
                      className="h-12 shrink-0 rounded-md border border-zinc-200 bg-zinc-50 px-4 text-[13px] font-semibold text-zinc-700 transition hover:bg-zinc-100"
                    >
                      자동생성
                    </button>
                  </div>

                  {errors.nickname ? (
                    <FieldErrorText>{errors.nickname}</FieldErrorText>
                  ) : (
                    <p className="mt-2 text-[12px] text-zinc-400">
                      서비스 안에서 보여질 이름이에요.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-md border border-zinc-200 bg-white px-4 py-3">
              <p className="text-[12px] leading-5 text-zinc-500">
                회원가입 시{" "}
                <Link
                  href="/about/Service"
                  className="font-semibold text-violet-600 underline underline-offset-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  서비스 약관
                </Link>{" "}
                및{" "}
                <Link
                  href="/about/Privacy"
                  className="font-semibold text-violet-600 underline underline-offset-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  개인정보 처리방침
                </Link>
                에 동의한 것으로 간주합니다.
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
    </div>
  );
}