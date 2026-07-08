import { FiCheckCircle, FiInfo } from "react-icons/fi";
import ProgressBar from "./ProgressBar";
import { JOB_CATEGORIES } from "./constants";
import { ChipGroup, FileUploadBox, TextInput } from "./FormControls";
import PhotoUploadGrid from "./PhotoUploadGrid";

function Label({ title, sub }) {
  return (
    <div className="pt-1">
      <div className="text-sm font-bold text-slate-950 md:text-base">{title}</div>
      {sub ? <div className="mt-1 whitespace-pre-line break-keep text-xs leading-5 text-slate-500">{sub}</div> : null}
    </div>
  );
}

function GuideCard({ title, items, icon }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_36px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-3 text-xl font-black tracking-[-0.04em] text-slate-950">
        {icon}
        {title}
      </div>
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
            <FiCheckCircle className="mt-1 shrink-0 text-slate-400" />
            <span className="break-keep">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Step2VerificationForm({ form, setForm, errors, onNext }) {
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <main className="bg-[#f7f8fa] md:h-[calc(100svh-78px)] md:overflow-hidden md:px-6 md:py-8">
      <div className="mx-auto grid w-full gap-6 border border-slate-200 bg-white p-5 shadow-sm md:h-full md:max-w-[1320px] md:grid-cols-[1fr_390px] md:overflow-hidden md:rounded-3xl md:p-8 lg:p-10">
        <section className="md:h-full md:overflow-y-auto md:pr-2">
          <ProgressBar step={2} />

          <div className="mt-10">
            <h1 className="break-keep text-[34px] font-black leading-tight tracking-[-0.055em] text-black md:text-[42px]">
              사진과 인증 정보를 등록해주세요
            </h1>
            <p className="mt-4 break-keep text-sm leading-7 text-slate-500 md:text-base">
              제출한 사진은 본인 확인 및 매칭 검토용으로 사용되며,
              매칭 제안 시 대표 사진 1장과 기본 정보 일부가 공개될 수 있습니다.
            </p>
          </div>

          <div className="mt-10 divide-y divide-slate-100 border-y border-slate-100">
            <div className="grid gap-5 py-8 md:grid-cols-[190px_1fr]">
              <Label title="사진 업로드" sub={"대표 사진 1장 필수\n추가 사진 1~3장 선택"} />
              <PhotoUploadGrid
                representativePhoto={form.representativePhoto}
                additionalPhotos={form.additionalPhotos}
                setForm={setForm}
                error={errors.representativePhoto || errors.additionalPhotos}
              />
            </div>

            <div className="grid gap-5 py-8 md:grid-cols-[190px_1fr]">
              <Label title="직업 선택" />
              <ChipGroup
                options={JOB_CATEGORIES}
                value={form.jobCategory ? [form.jobCategory] : []}
                onToggle={(item) => update("jobCategory", form.jobCategory === item ? "" : item)}
                error={errors.jobCategory}
              />
            </div>

            <div className="grid gap-5 py-8 md:grid-cols-[190px_1fr]">
              <Label title="회사명" sub="대학원생만 학교명 입력" />
              <div>
                <TextInput
                  value={form.organizationName}
                  onChange={(value) => update("organizationName", value)}
                  placeholder="회사명을 입력해주세요"
                  error={errors.organizationName}
                />
                <p className="mt-2 break-keep text-xs leading-5 text-slate-400">
                  회사명 중심으로 입력해주세요. 대학원생 또는 재학 중인 분만 학교명을 입력해도 됩니다. 운영자 인증용으로만 사용되며 상대방에게 공개되지 않습니다.
                </p>
              </div>
            </div>

            <div className="grid gap-5 py-8 md:grid-cols-[190px_1fr]">
              <Label title="신원 인증 업로드 (필수)" sub={"명함, 사원증, 학생증, 재직/재학\n확인 화면 중 1개 제출"} />
              <div>
                <FileUploadBox
                  large
                  file={form.verificationDocument}
                  label="인증 자료 업로드"
                  onChange={(file) => update("verificationDocument", file)}
                  onRemove={() => update("verificationDocument", null)}
                  error={errors.verificationDocument}
                />
                <div className="mt-4 space-y-2 text-xs leading-5 text-slate-500">
                  <div className="flex gap-2">
                    <FiInfo className="mt-0.5 shrink-0" />
                    <span>불필요한 개인정보는 가리고 업로드해주세요.</span>
                  </div>
                  <div className="flex gap-2">
                    <FiInfo className="mt-0.5 shrink-0" />
                    <span>인증 자료는 운영자 확인용으로 사용되며 상대방에게 공개되지 않습니다.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button type="button" onClick={onNext} className="mt-8 flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-black text-base font-bold text-white transition hover:bg-slate-900 md:h-16">
            다음 <span>→</span>
          </button>
        </section>

        <aside className="space-y-5 md:h-full md:overflow-hidden">
          <div className="md:sticky md:top-0 md:space-y-5">
            <GuideCard
              title="사진 검토 기준"
              icon={<FiCheckCircle />}
              items={["최근 6개월 이내 사진", "얼굴이 잘 보이는 단독 사진", "과도한 필터/단체 사진/가림 사진 지양", "선명한 화질 권장"]}
            />
            <GuideCard
              title="인증 자료 안내"
              icon={<FiCheckCircle />}
              items={["인증 자료는 운영자 확인용", "주민번호 등 민감정보는 가리고 업로드", "명함, 사원증, 학생증, 재직/재학 확인 화면 중 1개 제출"]}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}
