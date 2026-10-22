import { FiShield } from "react-icons/fi";
import ProgressBar from "./ProgressBar";
import AgreementRow from "./AgreementRow";
import ProfilePreviewCard from "./ProfilePreviewCard";
import DepositPolicyCard from "./DepositPolicyCard";
import { OPTIONAL_CONSENTS, REQUIRED_CONSENTS, SELF_REPORTED_SOURCE_OPTIONS } from "./constants";
import { FieldError } from "./FormControls";
import { cx } from "./helpers";

export default function Step3ConsentForm({ form, setForm, errors, onSubmit, submitting }) {
  const femaleFirstCohort = form.gender === "female";
  const allKeys = [...REQUIRED_CONSENTS, ...OPTIONAL_CONSENTS].map((item) => item.key);
  const allChecked = allKeys.every((key) => form.consents?.[key]);

  const setConsent = (key, value) => {
    setForm((prev) => ({
      ...prev,
      consents: {
        ...prev.consents,
        [key]: value,
      },
    }));
  };

  const setAll = (value) => {
    setForm((prev) => ({
      ...prev,
      consents: allKeys.reduce((acc, key) => ({ ...acc, [key]: value }), { ...prev.consents }),
    }));
  };

  return (
    <main className="min-h-[calc(100svh-68px)] bg-[#f7f8fa] px-5 py-8 md:min-h-[calc(100vh-78px)] md:px-8 md:py-14">
      <div className="mx-auto grid w-full max-w-[1320px] gap-8 lg:grid-cols-[1fr_430px]">
        <section>
          <ProgressBar step={3} />

          <div className="mt-10">
            <h1 className="text-[34px] font-black leading-tight tracking-[-0.055em] text-slate-950 md:text-[42px]">
              동의 후 신청을 완료해주세요
            </h1>
            <p className="mt-4 break-keep text-sm leading-7 text-slate-500 md:text-base">
              아래 내용을 꼼꼼히 확인하시고, 필수 항목에 동의해 주세요.
            </p>
          </div>

          <div data-tw-field="true" className="mt-10 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_36px_rgba(15,23,42,0.04)] md:p-8">
            <div className="border-b border-slate-100 pb-7">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black text-slate-950">투윅스를 어디에서 알게 되셨나요?</h2>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">선택</span>
              </div>
              <select
                value={form.selfReportedSource || ""}
                onChange={(event) => setForm((prev) => ({
                  ...prev,
                  selfReportedSource: event.target.value,
                  selfReportedSourceDetail: event.target.value === "other" ? prev.selfReportedSourceDetail : "",
                }))}
                className="mt-4 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none focus:border-slate-950"
              >
                <option value="">선택하지 않음</option>
                {SELF_REPORTED_SOURCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {form.selfReportedSource === "other" ? (
                <input
                  type="text"
                  value={form.selfReportedSourceDetail || ""}
                  maxLength={60}
                  onChange={(event) => setForm((prev) => ({ ...prev, selfReportedSourceDetail: event.target.value }))}
                  placeholder="알게 된 경로를 간단히 적어주세요"
                  className="mt-3 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300 focus:border-slate-950"
                />
              ) : null}
            </div>

            <div className="border-b border-slate-100 py-7">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black text-slate-950">추천해주신 분이 있으신가요?</h2>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">선택</span>
              </div>
              <p className="mt-2 break-keep text-sm leading-6 text-slate-500">
                투윅스 기존 회원의 이름과 휴대폰 번호 뒤 4자리를 입력해주세요. 확인되지 않아도 가입은 정상 완료됩니다.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={form.referrerName || ""}
                  maxLength={30}
                  onChange={(event) => setForm((prev) => ({ ...prev, referrerName: event.target.value }))}
                  placeholder="추천인 이름"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300 focus:border-slate-950"
                />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.referrerPhoneLast4 || ""}
                  maxLength={4}
                  onChange={(event) => setForm((prev) => ({
                    ...prev,
                    referrerPhoneLast4: event.target.value.replace(/[^0-9]/g, "").slice(0, 4),
                  }))}
                  placeholder="휴대폰 뒤 4자리"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300 focus:border-slate-950"
                />
              </div>
            </div>

            <div className="flex items-start gap-4 pb-5">
              <button
                type="button"
                onClick={() => setAll(!allChecked)}
                className={cx(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-base font-black transition border-solid",
                  allChecked ? "border-black bg-black text-white" : "border-slate-300 bg-white text-transparent"
                )}
              >
                ✓
              </button>
              <div>
                <div className="text-lg font-black text-slate-950">전체 동의</div>
                <p className="mt-1 text-sm leading-6 text-slate-500">전체 동의는 필수 및 선택 항목에 모두 동의하는 것으로 간주됩니다.</p>
              </div>
            </div>

            <div className="pt-2 text-sm font-bold text-slate-500">필수 동의 (4/4)</div>
            <div className="mt-2">
              {REQUIRED_CONSENTS.map((item) => (
                <AgreementRow
                  key={item.key}
                  item={femaleFirstCohort && item.key === "noShowDeposit"
                    ? {
                        ...item,
                        title: "[필수] 취소·노쇼 및 계정 제재 정책 동의",
                        summary: "여성 1기 예치금은 면제되며, 확정된 바이트소개팅의 반복 당일 취소·무단 불참 시 이후 매칭이 제한될 수 있습니다.",
                        detail: "여성 1기 회원은 예치금 입금 없이 참여합니다. 제안 거절이나 일정 확정 전 취소에는 계정 제재가 없으며, 확정된 바이트소개팅의 당일 취소 또는 무단 불참은 운영자 확인을 거쳐 경고·다음 회차 제한·30일 제한이 적용될 수 있습니다. 질병·사고·가족문제 등 불가피한 사유는 운영자가 예외 처리할 수 있고, 자동 탈퇴시키지 않습니다. 노쇼 이력이 발생한 면제회원은 운영자 판단으로 이후 예치금 필수회원으로 전환될 수 있습니다.",
                      }
                    : item}
                  checked={form.consents?.[item.key]}
                  onChange={(value) => setConsent(item.key, value)}
                />
              ))}
            </div>

            <div className="mt-4 pt-2 text-sm font-bold text-slate-500">선택 동의 (1/1)</div>
            <div className="mt-2">
              {OPTIONAL_CONSENTS.map((item) => (
                <AgreementRow key={item.key} item={item} checked={form.consents?.[item.key]} onChange={(value) => setConsent(item.key, value)} />
              ))}
            </div>

            <FieldError>{errors.consents}</FieldError>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={onSubmit}
            className="mt-8 flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-black text-base font-bold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50 md:h-16"
          >
            {submitting ? "신청 정보를 제출하는 중..." : "동의하고 신청 완료하기"}
            {!submitting ? <span>→</span> : null}
          </button>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <FiShield />
            안전한 신청을 위해 모든 정보는 암호화되어 보호됩니다.
          </div>
        </section>

        <aside className="space-y-6">
          <ProfilePreviewCard form={form} />
          {femaleFirstCohort ? (
            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
              <div className="text-sm font-black text-blue-900">여성 1기 예치금 면제</div>
              <p className="mt-2 break-keep text-sm font-semibold leading-6 text-blue-800">
                별도 입금 없이 프로필 검토 후 매칭이 진행됩니다. 확정된 바이트소개팅의 당일 취소·무단 불참은 계정 제재 정책으로 관리합니다.
              </p>
            </div>
          ) : (
            <DepositPolicyCard />
          )}
        </aside>
      </div>
    </main>
  );
}
