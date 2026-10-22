import { FiAlertCircle, FiCheckCircle, FiShield } from "react-icons/fi";
import ProgressBar from "./ProgressBar";
import {
  ACTIVITY_AREAS, TIME_SLOTS, MARRIAGE_PLAN_OPTIONS, CHILDREN_PLAN_OPTIONS,
  RELIGION_OPTIONS, RELIGION_PREFERENCE_OPTIONS, SMOKING_OPTIONS,
  SMOKING_PREFERENCE_OPTIONS, DRINKING_FREQUENCY_OPTIONS,
} from "./constants";
import { ChipGroup, RadioConfirm, SegmentedButtons, SelectBox, TextArea, TextInput } from "./FormControls";
import { formatPhone } from "./helpers";

function Label({ title, sub }) {
  return (
    <div className="pt-[1rem]">
      <div className="text-sm font-bold text-slate-950 md:text-base">{title}</div>
      {sub ? <div className="mt-1 whitespace-pre-line text-xs leading-5 text-slate-400">{sub}</div> : null}
    </div>
  );
}

function SignalField({ number, title, optional = false, description = "", wide = false, children }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 md:p-5 ${wide ? "md:col-span-2" : ""}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-950 px-1 text-xs font-bold text-white">
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-slate-950 md:text-base">
              {title}
              {!optional ? <span className="ml-1 text-rose-500">*</span> : null}
            </h3>
            {optional ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                선택
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="mt-1 break-keep text-xs leading-5 text-slate-400">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function MiniFieldLabel({ children }) {
  return <div className="mb-2 text-xs font-bold text-slate-500">{children}</div>;
}

function IdentityVerificationBox({
  verified,
  loading,
  error,
  identityData,
  onVerify,
}) {
  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${verified ? "bg-emerald-50 text-emerald-600" : "bg-white text-slate-700"}`}>
          {verified ? <FiCheckCircle /> : <FiShield />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-black text-slate-950">
            <span>{verified ? "본인인증이 완료되었습니다" : "본인인증"}</span>
            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-black text-orange-600">필수</span>
          </div>
          <p className="mt-1 break-keep text-xs leading-5 text-slate-500">
            안전한 실제 만남과 예치금 운영을 위해 본인인증이 필요합니다. 인증 시 이름, 연락처, 성별, 출생연도가 자동 반영됩니다.
          </p>

          {verified ? (
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-emerald-700">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1">인증 연락처 {identityData?.phone || "확인됨"}</span>
              {identityData?.name ? <span className="rounded-full bg-emerald-50 px-2.5 py-1">{identityData.name}</span> : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={onVerify}
              disabled={loading}
              className="mt-3 inline-flex h-10 items-center justify-center rounded-xl bg-black px-4 text-xs font-bold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "본인인증 확인 중..." : "본인인증하기"}
            </button>
          )}

          {error ? (
            <div className="mt-3 flex gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium leading-5 text-red-600">
              <FiAlertCircle className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function Step1BasicForm({
  form,
  setForm,
  errors,
  onNext,
  onIdentityVerify,
  identityLoading = false,
  identityError = "",
}) {
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleListValue = (key, item) => {
    setForm((prev) => {
      const current = prev[key] || [];
      const exists = current.includes(item);
      const next = exists ? current.filter((value) => value !== item) : [...current, item];

      const patch = { [key]: next };
      if (key === "activityAreas" && prev.preferredArea && !next.includes(prev.preferredArea)) {
        patch.preferredArea = "";
      }

      return {
        ...prev,
        ...patch,
      };
    });
  };

  const phoneVerified = form.phoneVerified === true && form.identityVerifiedData?.verified;

  return (
    <main className="bg-white md:h-[calc(100svh-78px)] md:overflow-hidden">
      <div className="grid min-h-[calc(100svh-68px)] md:h-[calc(100svh-78px)] md:min-h-0 md:grid-cols-[0.8fr_1.2fr]">
        <aside className="relative hidden border-r border-slate-200 bg-white px-10 py-14 md:flex md:h-full md:flex-col md:justify-between lg:px-14">
          <div>
            <ProgressBar step={1} />
            <h1 className="mt-16 text-[48px] font-black leading-[1.02] text-black lg:text-[56px]">
              기본 정보를
              <br />
              입력해주세요
            </h1>
            <p className="mt-7 max-w-[360px] break-keep text-lg leading-8 text-slate-500">
              진지하게 사람을 알아가고 싶은 분만 신청해주세요.
            </p>
          </div>

          <div className="relative z-10 text-sm font-semibold text-slate-400">
            100% 신원 인증된 회원만 참여합니다.
          </div>
          <div className="pointer-events-none absolute -bottom-10 -left-10 opacity-[0.04]">
            <img
              src="/logo/2weeks_logo.png"
              alt=""
              className="w-[360px] object-contain"
              draggable={false}
            />
          </div>
        </aside>

        <section className="mx-auto w-full max-w-[720px] px-3 py-10 md:h-full md:overflow-y-auto md:px-10 md:py-16 lg:px-16">
          <div className="md:hidden">
            <ProgressBar step={1} />
            <h1 className="mt-10 text-[38px] font-black leading-[1.02] text-black">
              기본 정보를
              <br />
              입력해주세요
            </h1>
            <p className="mt-5 text-[15px] leading-7 text-slate-500">
              진지하게 사람을 알아가고 싶은 분만 신청해주세요.
            </p>
          </div>

          <div className="mt-10 space-y-8 md:mt-0">
            <div className="grid gap-4 md:grid-cols-[170px_1fr] md:items-start">
              <Label title="성별" />
              <SegmentedButtons
                value={form.gender}
                onChange={(value) => update("gender", value)}
                error={errors.gender}
                options={[{ label: "남성", value: "male" }, { label: "여성", value: "female" }]}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-[170px_1fr] md:items-start">
              <Label title="이름" />
              <TextInput value={form.name} onChange={(value) => update("name", value)} placeholder="실명을 입력해주세요" error={errors.name} />
            </div>

            <div className="grid gap-4 md:grid-cols-[170px_1fr] md:items-start">
              <Label title="닉네임" sub="[닉네임]님 맞으세요?" />
              <div>
                <TextInput
                  value={form.nickname}
                  onChange={(value) => update("nickname", value.slice(0, 12))}
                  placeholder="본인을 잘 나타내는 닉네임을 입력해주세요"
                  maxLength={12}
                  error={errors.nickname}
                />
                <p className="mt-2 break-keep text-xs leading-5 text-slate-400">
                  상대방이 만남 전후로 기억하기 쉬운 닉네임을 추천합니다.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[170px_1fr] md:items-start">
              <Label title="출생연도" sub="(남성)87년생~99년생, (여성)제한 없음" />
              <TextInput
                value={form.birthYear}
                onChange={(value) => update("birthYear", value.replace(/[^0-9]/g, "").slice(0, 4))}
                placeholder="YYYY"
                error={errors.birthYear}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-[170px_1fr] md:items-start">
              <Label title="연락처" sub="전화번호" />
              <div>
                <TextInput
                  value={form.phone}
                  onChange={(value) => {
                    const nextPhone = formatPhone(value);
                    setForm((prev) => ({
                      ...prev,
                      phone: nextPhone,
                      phoneVerified: false,
                      phoneVerificationSkipped: true,
                      identityVerifiedData: null,
                    }));
                  }}
                  placeholder="010-0000-0000"
                  error={errors.phone || errors.phoneVerify}
                />
                <p className="mt-2 break-keep text-xs leading-5 text-slate-400">
                  신청 안내와 매칭 진행 안내를 받을 연락처입니다. 매칭 후 상호 연결 희망 시 연락처가 공개됩니다.
                </p>
                <IdentityVerificationBox
                  verified={phoneVerified}
                  loading={identityLoading}
                  error={identityError || errors.phoneVerify}
                  identityData={form.identityVerifiedData}
                  onVerify={onIdentityVerify}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[170px_1fr] md:items-start">
              <Label title="활동 지역" sub="만남 가능 지역" />
              <div>
                <ChipGroup
                  options={ACTIVITY_AREAS}
                  value={form.activityAreas}
                  onToggle={(item) => toggleListValue("activityAreas", item)}
                  error={errors.activityAreas}
                />
                <p className="mt-2 break-keep text-xs leading-5 text-slate-400">
                  정말 이동이 어려운 지역만 해제해주세요.<br/>
                  인원 구성에 따라 체크가 해제된 지역도 제안될 수 있습니다.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[170px_1fr] md:items-start">
              <Label title="가장 편한 지역 1곳 선택" />
              <SelectBox
                value={form.preferredArea}
                onChange={(value) => update("preferredArea", value)}
                options={form.activityAreas?.length ? form.activityAreas : ACTIVITY_AREAS}
                placeholder="선택해주세요"
                error={errors.preferredArea}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-[170px_1fr] md:items-start">
              <Label title="결혼여부" />
              <div>
                <RadioConfirm
                  checked={form.maritalStatus === "single"}
                  onChange={() => update("maritalStatus", "single")}
                  label="미혼 / 싱글입니다"
                  description="기혼자, 사실혼 관계, 교제 중인 상대가 있는 경우 이용할 수 없습니다."
                  error={errors.maritalStatus}
                />
                <p className="mt-2 break-keep text-xs leading-5 text-slate-400">
                  투윅스 1기는 미혼/싱글만 신청 가능합니다. 허위 작성 시 이용 제한 및 매칭 취소가 될 수 있습니다.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[170px_1fr] md:items-start">
              <Label title="만남 가능한 시간대" sub="어려운 시간만 해제" />
              <div>
                <ChipGroup options={TIME_SLOTS} value={form.availableTimeSlots} onToggle={(item) => toggleListValue("availableTimeSlots", item)} error={errors.availableTimeSlots} />
                <p className="mt-2 break-keep text-xs leading-5 text-slate-400">
                  기본적으로 모든 시간대가 선택되어 있습니다. 실제로 어려운 시간대만 해제해주세요.
                </p>
              </div>
            </div>


            <div className="border-t border-slate-100 pt-8">
              <div className="rounded-3xl bg-slate-50 p-3 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-bold text-slate-950">투윅스 매칭 시그널 7</div>
                    <p className="mt-2 max-w-[520px] break-keep text-xs leading-5 text-slate-500">
                      실제 만남 전에 꼭 필요한 방향만 가볍게 확인합니다. 답변은 상대 프로필과 매칭 적합도에 함께 반영됩니다.
                    </p>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500 shadow-sm">
                    <span className="text-rose-500">*</span> 필수
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <SignalField number="1" title="결혼 의향">
                    <SelectBox
                      value={form.marriagePlan}
                      onChange={(value) => update("marriagePlan", value)}
                      options={MARRIAGE_PLAN_OPTIONS}
                      placeholder="결혼에 대한 생각"
                      error={errors.marriagePlan}
                    />
                  </SignalField>

                  <SignalField number="2" title="자녀 계획">
                    <SelectBox
                      value={form.childrenPlan}
                      onChange={(value) => update("childrenPlan", value)}
                      options={CHILDREN_PLAN_OPTIONS}
                      placeholder="자녀 계획"
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
                          placeholder="현재 종교"
                          error={errors.religion}
                        />
                      </div>
                      <div>
                        <MiniFieldLabel>상대방 종교에 대한 생각</MiniFieldLabel>
                        <SelectBox
                          value={form.religionPreference}
                          onChange={(value) => update("religionPreference", value)}
                          options={RELIGION_PREFERENCE_OPTIONS}
                          placeholder="종교 수용범위"
                          error={errors.religionPreference}
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
                          placeholder="흡연 여부"
                          error={errors.smoking}
                        />
                      </div>
                      <div>
                        <MiniFieldLabel>상대방 흡연 허용 범위</MiniFieldLabel>
                        <SelectBox
                          value={form.smokingPreference}
                          onChange={(value) => update("smokingPreference", value)}
                          options={SMOKING_PREFERENCE_OPTIONS}
                          placeholder="흡연 허용범위"
                          error={errors.smokingPreference}
                        />
                      </div>
                    </div>
                  </SignalField>

                  <SignalField number="5" title="음주 빈도">
                    <SelectBox
                      value={form.drinkingFrequency}
                      onChange={(value) => update("drinkingFrequency", value)}
                      options={DRINKING_FREQUENCY_OPTIONS}
                      placeholder="평소 음주 빈도"
                      error={errors.drinkingFrequency}
                    />
                  </SignalField>

                  <SignalField number="6" title="키" optional>
                    <TextInput
                      value={form.height}
                      onChange={(value) => update("height", value.replace(/[^0-9]/g, "").slice(0, 3))}
                      placeholder="예: 175"
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
                      maxLength={40}
                      error={errors.introduction}
                    />
                  </SignalField>
                </div>
              </div>
            </div>
          </div>

          <button type="button" onClick={onNext} className="mt-10 flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-black text-base font-bold text-white transition hover:bg-slate-900 md:h-16">
            다음 <span>→</span>
          </button>
        </section>
      </div>
    </main>
  );
}
