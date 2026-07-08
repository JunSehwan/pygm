import { FiShield } from "react-icons/fi";
import ProgressBar from "./ProgressBar";
import AgreementRow from "./AgreementRow";
import ProfilePreviewCard from "./ProfilePreviewCard";
import DepositPolicyCard from "./DepositPolicyCard";
import { OPTIONAL_CONSENTS, REQUIRED_CONSENTS } from "./constants";
import { FieldError } from "./FormControls";
import { cx } from "./helpers";

export default function Step3ConsentForm({ form, setForm, errors, onSubmit, submitting }) {
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
            <div className="flex items-start gap-4 pb-5">
              <button
                type="button"
                onClick={() => setAll(!allChecked)}
                className={cx(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-base font-black transition",
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
                <AgreementRow key={item.key} item={item} checked={form.consents?.[item.key]} onChange={(value) => setConsent(item.key, value)} />
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
          <DepositPolicyCard />
        </aside>
      </div>
    </main>
  );
}
