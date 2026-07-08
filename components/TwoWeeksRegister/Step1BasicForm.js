import { FiAlertCircle, FiCheckCircle, FiShield } from "react-icons/fi";
import ProgressBar from "./ProgressBar";
import { ACTIVITY_AREAS, TIME_SLOTS } from "./constants";
import { ChipGroup, RadioConfirm, SegmentedButtons, SelectBox, TextArea, TextInput } from "./FormControls";
import { formatPhone } from "./helpers";

function Label({ title, sub }) {
  return (
    <div className="pt-1">
      <div className="text-sm font-bold text-slate-950 md:text-base">{title}</div>
      {sub ? <div className="mt-1 whitespace-pre-line text-xs leading-5 text-slate-400">{sub}</div> : null}
    </div>
  );
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
          <div className="text-sm font-black text-slate-950">
            {verified ? "본인인증이 완료되었습니다" : "본인인증"}
          </div>
          <p className="mt-1 break-keep text-xs leading-5 text-slate-500">
            차밍수프 회원가입과 동일한 본인인증 방식입니다. 인증 시 이름, 연락처, 성별, 출생연도가 자동 반영됩니다.
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
            <h1 className="mt-16 text-[48px] font-black leading-[1.02] tracking-[-0.06em] text-black lg:text-[56px]">
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
          <div className="pointer-events-none absolute -bottom-16 -left-10 text-[220px] font-black tracking-[-0.1em] text-slate-50">
            2W
          </div>
        </aside>

        <section className="mx-auto w-full max-w-[720px] px-5 py-10 md:h-full md:overflow-y-auto md:px-10 md:py-16 lg:px-16">
          <div className="md:hidden">
            <ProgressBar step={1} />
            <h1 className="mt-10 text-[38px] font-black leading-[1.02] tracking-[-0.06em] text-black">
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
              <Label title="출생연도" sub="85년생~00년생" />
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

            <div className="grid gap-4 md:grid-cols-[170px_1fr] md:items-start">
              <Label title="키" sub="선택입력" />
              <TextInput value={form.height} onChange={(value) => update("height", value.replace(/[^0-9]/g, "").slice(0, 3))} placeholder="예: 175" />
            </div>

            <div className="grid gap-4 md:grid-cols-[170px_1fr] md:items-start">
              <Label title="짧은 자기소개" sub="필수입력" />
              <TextArea
                value={form.introduction}
                onChange={(value) => update("introduction", value)}
                placeholder="주말엔 카페 가거나 한강 걷는 걸 좋아해요."
                maxLength={40}
                error={errors.introduction}
              />
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
