import { useState } from "react";
import { FiArrowLeft, FiCheck, FiChevronRight, FiShield } from "react-icons/fi";
import ConsentAgreementPanel from "./ConsentAgreementPanel";
import PhotoUploadGrid from "./PhotoUploadGrid";
import { FieldError, useObjectUrl } from "./FormControls";
import {
  ACTIVITY_AREAS,
  COMPANY_SCALE_OPTIONS,
  CHILDREN_PLAN_OPTIONS,
  DRINKING_FREQUENCY_OPTIONS,
  DRINKING_PREFERENCE_OPTIONS,
  EDUCATION_OPTIONS,
  INTEREST_GROUPS,
  JOB_CATEGORIES,
  MARRIAGE_PLAN_OPTIONS,
  PREFERRED_STYLE_OPTIONS,
  RELIGION_OPTIONS,
  RELIGION_PREFERENCE_OPTIONS,
  SELF_REPORTED_SOURCE_OPTIONS,
  SMOKING_OPTIONS,
  SMOKING_PREFERENCE_OPTIONS,
  TARGET_BIRTH_YEAR_MAX,
  TARGET_BIRTH_YEAR_MIN,
  TIME_SLOTS,
} from "./constants";
import { formatFullAgeLabel, formatPhone } from "./helpers";
import { SCHOOL_NAME_SUGGESTIONS } from "./schoolOptions";

// 내 정보 → 실제 만남 → 상대 선호 → 마무리. 기존 저장 필드명은 변경하지 않습니다.
export const REGISTER_SCREENS = [
  "welcome", "identity", "basic", "profile", "introduction", "job", "jobProof",
  "education", "traits", "marriage", "children", "smoking", "religion", "drinking",
  "meeting", "availability", "midpoint",
  "preference", "preferenceLifestyle", "preferenceReligion", "preferenceStyle",
  "source", "consent", "review",
];

const STAGE_META = [
  { label: "본인 확인", screens: ["identity", "basic"] },
  { label: "나를 소개하기", screens: ["profile", "introduction", "job", "jobProof", "education", "traits", "marriage", "children", "smoking", "religion", "drinking"] },
  { label: "실제 만남 준비", screens: ["meeting", "availability", "midpoint"] },
  { label: "원하는 상대", screens: ["preference", "preferenceLifestyle", "preferenceReligion", "preferenceStyle"] },
  { label: "마무리", screens: ["source", "consent", "review"] },
];

const optionValue = (option) => typeof option === "string" ? option : option.value;
const optionLabel = (option) => typeof option === "string" ? option : option.label;

// 질문을 읽어주기보다 다음 행동과 진행 상황을 친근하게 돕는 한마디.
const WICKY_MESSAGES = {
  welcome: "반가워요! 빠르게 이성소개를 진행할 수 있게 제가 옆에서 도와드릴게요.",
  identity: "안전한 만남의 첫걸음이에요. 인증이 끝나면 바로 다음으로 넘어갈게요!",
  basic: "좋아요! 기본정보까지 적으면 우리 소개가 본격적으로 시작돼요.",
  profile: "가장 나다운 사진을 골라봐요. 대표사진이 첫인상을 만들어줄 거예요.",
  introduction: "거창하게 쓰지 않아도 괜찮아요. 자연스럽게 나를 표현해봐요!",
  job: "어떤 일을 하는지도 중요한 나의 이야기죠. 내 직업을 골라주세요.",
  jobProof: "여기까지 잘하고 있어요! 직업정보도 채우면 소개가 더 든든해져요.",
  education: "학교명을 입력하면 비슷한 이름도 찾아드릴게요. 안 보이면 직접 적어도 돼요.",
  traits: "조금 더 나를 알아가는 시간이에요. 잘 모르는 항목은 건너뛰어도 좋아요.",
  marriage: "이제 관계에서 중요하게 생각하는 방향을 하나씩 알아볼게요.",
  children: "좋아요, 멋진 소개가 만들어지고 있어요. 편한 답을 골라주세요!",
  smoking: "작은 생활 습관도 서로 이해하는 데 도움이 돼요.",
  religion: "다른 사람의 정답 말고, 내 마음에 맞는 답이면 충분해요.",
  drinking: "내 이야기는 거의 완성됐어요. 이제 실제 만남을 준비해볼까요?",
  meeting: "가능한 지역을 많이 남길수록 소개할 분을 더 폭넓게 찾을 수 있어요!",
  availability: "가능한 시간을 넉넉하게 선택하면 서로 맞는 일정을 찾기 한결 수월해져요.",
  midpoint: "와, 꽤 근사한 프로필이 됐어요! 이제 어울리는 상대의 모습을 그려봐요.",
  preference: "여기부터는 선택사항이에요. 나이가 중요하지 않다면 그대로 넘어가도 돼요.",
  preferenceLifestyle: "내 생활과 원하는 상대의 생활은 다를 수 있죠. 편한 범위만 알려주세요.",
  preferenceReligion: "서로 다른 생각을 존중할 수 있는지도 중요한 소개 기준이에요.",
  preferenceStyle: "점점 더 또렷해지고 있어요! 어떤 분과 있으면 편안할지 골라봐요.",
  source: "친구 또는 지인분에게 추천받으셨어요?",
  consent: "하나만 더요! 마지막 약속만 확인하면 우리 프로필이 완성돼요.",
  review: "완성했어요! 함께 만든 프로필을 보고 준비를 마무리해요.",
};

// 글자 수 기준 강제 줄바꿈은 단어를 찢어 놓을 수 있습니다.
// 문장부호 단위로만 문장을 분리하고, 각 문장 내부는 CSS가 화면 폭에 맞게 자연스럽게 줄바꿈합니다.
function wickySentences(copy) {
  return (String(copy || "").match(/[^.!?]+[.!?]*/g) || [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function WickyGuide({ screen, form }) {
  let copy = WICKY_MESSAGES[screen];
  if (!copy) return null;
  if (screen === "traits" && form?.interests?.length === 3) copy = "벌써 관심사도 세 가지나 골랐네요! 함께 이야기할 소재가 늘어났어요.";
  if (screen === "meeting" && form?.activityAreas?.length > 0) copy = `현재 ${form.activityAreas.length}개 지역이 선택됐어요. 가능성이 넓어지도록, 어려운 곳만 해제해 주세요!`;
  if (screen === "availability" && form?.availableTimeSlots?.length > 0) copy = `지금 ${form.availableTimeSlots.length}개 시간대가 선택됐어요. 어려운 시간만 해제하면 돼요!`;
  const photo = screen === "welcome" ? "wicky-welcome.png" : screen === "review" || screen === "midpoint" ? "wicky-success.png" : "wicky-phone.png";
  return (
    <div className="mt-12 flex items-start gap-3.5" aria-label="윅키 안내">
      <img src={`/images/twoweeks/wicky/${photo}`} alt="윅키" draggable={false}
        className={screen === "welcome" ? "wicky-float h-[96px] w-[96px] shrink-0 object-contain sm:h-[104px] sm:w-[104px]" : "wicky-float h-[72px] w-[72px] shrink-0 object-contain sm:h-[78px] sm:w-[78px]"} />
      <p className="relative min-w-0 flex-1 rounded-[20px] rounded-tl-[10px] bg-[#f0f5ff] px-4 py-3.5 text-[14px] font-bold leading-[1.62] tracking-[-0.02em] text-[#355a89] break-keep [overflow-wrap:break-word] sm:px-5 sm:py-4 sm:text-[15px]">
        {wickySentences(copy).map((sentence, i) => (
          <span key={`${screen}-${i}`} className="block break-keep">{sentence}</span>
        ))}
      </p>
      <style jsx>{`
        .wicky-float{animation:wicky-floating 3s ease-in-out infinite;transform-origin:50% 80%;}
        @keyframes wicky-floating{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-5px) rotate(2deg)}}
        @media(prefers-reduced-motion:reduce){.wicky-float{animation:none}}
      `}</style>
    </div>
  );
}

function ChoiceGrid({ options, value, onChange, multiple = false, max, columns = 2 }) {
  const values = multiple ? (Array.isArray(value) ? value : []) : [];
  return (
    <div className={`grid gap-3 ${columns === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
      {options.map((option) => {
        const itemValue = optionValue(option);
        const selected = multiple ? values.includes(itemValue) : value === itemValue;
        const disabled = multiple && !selected && max && values.length >= max;
        return (
          <button
            type="button"
            key={itemValue}
            disabled={disabled}
            onClick={() => {
              if (!multiple) return onChange(itemValue);
              onChange(selected ? values.filter((item) => item !== itemValue) : [...values, itemValue]);
            }}
            className={` rounded-[12px] min-h-4 border px-3.5 py-2.5 text-left text-sm font-bold border-solid transition active:scale-[0.99] ${selected ? "border-[#2d6cdf] bg-[#f2f6ff] text-[#1d55ad]" : "border-[#dce3eb] bg-white text-[#263f58] hover:border-[#9eb7d7] hover:bg-[#fafbfd]"} ${disabled ? "opacity-35" : ""}`}
          >
            <span className="flex items-center justify-between gap-2">{optionLabel(option)}{selected ? <FiCheck /> : null}</span>
          </button>
        );
      })}
    </div>
  );
}

function TextField({ value, onChange, placeholder, type = "text", inputMode, maxLength, disabled, error }) {
  return (
    <div data-tw-field="true">
      <input type={type} inputMode={inputMode} value={value || ""} maxLength={maxLength} disabled={disabled}
        onChange={(event) => onChange(event.target.value)} placeholder={placeholder}
        className={`h-14 w-full rounded-[10px] border bg-white px-4 text-base font-semibold text-[#142b40] outline-none transition placeholder:text-[#a9b5c1] focus:border-[#2d6cdf] focus:ring-2 focus:ring-[#2d6cdf]/10 ${disabled ? "border-[#e3e8ef] bg-[#f5f7f9] text-[#6f8191]" : "border-[#d5dde6]"} ${error ? "border-rose-400" : ""}`} />
      <FieldError>{error}</FieldError>
    </div>
  );
}

// 선택형 관심사: 전체 50여 개를 한 번에 나열하지 않고 카테고리별로 보여줍니다.
function InterestPicker({ value, onChange }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const values = Array.isArray(value) ? value : [];
  const active = INTEREST_GROUPS[activeCategory];
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-[#29445d]">내 관심사 <span className="font-medium text-[#71869c]">(최대 3개)</span></span>
        <span className="text-sm font-extrabold text-[#2465c9]">{values.length}/3</span>
      </div>
      {values.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2" aria-label="선택한 관심사">
          {values.map((v) => <button type="button" key={v} onClick={() => onChange(values.filter((i) => i !== v))}
            className="rounded-full border border-[#bad0f9] bg-[#eff5ff] px-3 py-1.5 text-xs font-bold text-[#1d55ad]" aria-label={`${v} 선택 해제`}>{v} ×</button>)}
        </div>
      ) : null}
      <div className="interest-tabs -mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-5" role="tablist" aria-label="관심사 카테고리">
        {INTEREST_GROUPS.map((category, idx) => <button type="button" key={category.name} role="tab" aria-selected={activeCategory === idx}
          onClick={() => setActiveCategory(idx)} className={`shrink-0 rounded-full border border-solid px-3.5 py-2 text-xs font-bold ${activeCategory === idx ? "border-[#2d6cdf] bg-[#2d6cdf] text-white" : "border-[#dce3eb] bg-white text-[#546b82]"}`}>{category.name}</button>)}
      </div>
      <div className="pt-2"><ChoiceGrid options={active.items} value={values} multiple max={3} onChange={onChange} /></div>
      <p className="mt-4 text-xs font-medium text-[#8192a5]">선택한 항목을 다시 누르면 취소할 수 있어요.</p>
      <style jsx>{`.interest-tabs{scrollbar-width:none;} .interest-tabs::-webkit-scrollbar{display:none;}`}</style>
    </div>
  );
}

const MBTI_PAIRS = [
  { label: "에너지 방향", letters: ["E", "I"], hints: ["외향", "내향"] },
  { label: "정보를 보는 방식", letters: ["S", "N"], hints: ["감각", "직관"] },
  { label: "판단 기준", letters: ["T", "F"], hints: ["사고", "감정"] },
  { label: "생활 방식", letters: ["J", "P"], hints: ["계획", "즉흥"] },
];
function MbtiPicker({ value, draft, onChange }) {
  const letters = /^[EI][SN][TF][JP]$/.test(draft || "") ? draft
    : /^[EI][SN][TF][JP]$/.test(value || "") ? value
      : /^[EI_][SN_][TF_][JP_]$/.test(draft || "") ? draft : "____";
  const count = letters.split("").filter((char) => char !== "_").length;
  const selectLetter = (index, letter) => {
    const next = letters.split("");
    next[index] = next[index] === letter ? "_" : letter;
    const result = next.join("");
    onChange({ mbtiDraft: result, mbti: result.includes("_") ? "" : result });
  };
  return (
    <div className="rounded-xl border border-[#e0e6f0] bg-[#fafbfe] p-4">
      <div className="mb-3 flex items-center justify-between"><span className="text-sm font-bold text-[#29445d]">MBTI</span><span className="text-xs font-bold text-[#6381a4]">{count === 4 ? letters : `${count}/4 선택`}</span></div>
      <div className="grid gap-2.5">
        {MBTI_PAIRS.map((pair, idx) => <div key={pair.label} className="flex items-center gap-3">
          <span className="min-w-0 flex-1 text-xs font-semibold text-[#657b90]">{pair.label}</span>
          <div className="grid w-[190px] grid-cols-2 gap-1.5">
            {pair.letters.map((letter, i) => <button key={letter} type="button" aria-pressed={letters[idx] === letter}
              onClick={() => selectLetter(idx, letter)}
              className={`flex h-11 flex-col items-center justify-center rounded-[9px] border border-solid transition ${letters[idx] === letter ? "border-[#2d6cdf] bg-[#2d6cdf] text-white" : "border-[#d7e0ea] bg-white text-[#29445d]"}`}>
                <span className="text-sm font-extrabold leading-4">{letter}</span><span className="mt-0.5 text-[10px] leading-3 opacity-80">{pair.hints[i]}</span>
              </button>)}
          </div>
        </div>)}
      </div>
      <p className="mt-3 text-xs text-[#8496a8]">잘 모르겠다면 선택하지 않아도 괜찮아요.</p>
    </div>
  );
}

// 주요 대학 로컬 추천: 외부 호출·서버 키가 필요 없고, 그 외 모든 학교는 직접 입력 허용.
function SchoolAutocomplete({ value, onChange, error }) {
  const [opened, setOpened] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const query = String(value || "").toLowerCase().replace(/\s/g, "").trim();
  const matched = query.length < 1 ? [] : SCHOOL_NAME_SUGGESTIONS.filter((item) => item.toLowerCase().replace(/\s/g, "").includes(query)).slice(0, 7);
  const choose = (item) => { onChange(item); setOpened(false); setFocusedIndex(-1); };
  const onKeyDown = (event) => {
    if (!opened || !matched.length) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setFocusedIndex((idx) => (idx + 1) % matched.length); }
    if (event.key === "ArrowUp") { event.preventDefault(); setFocusedIndex((idx) => (idx - 1 + matched.length) % matched.length); }
    if (event.key === "Enter" && focusedIndex >= 0) { event.preventDefault(); choose(matched[focusedIndex]); }
    if (event.key === "Escape") setOpened(false);
  };
  return (
    <div className="relative" data-tw-field="true">
      <div className="mb-2 text-sm font-bold text-[#29445d]">학교명 <span className="text-[#3268d9]">· 필수</span></div>
      <input type="text" value={value || ""} onFocus={() => setOpened(true)} onBlur={() => setTimeout(() => setOpened(false), 120)}
        onChange={(event) => { onChange(event.target.value); setOpened(true); setFocusedIndex(-1); }} onKeyDown={onKeyDown}
        autoComplete="off" maxLength={60} placeholder="예: 한국대학교" aria-autocomplete="list"
        className="h-14 w-full rounded-[10px] border border-[#d5dde6] bg-white px-4 text-base font-semibold text-[#142b40] outline-none focus:border-[#2d6cdf]" />
      {opened && matched.length > 0 ? <div role="listbox" aria-label="학교명 추천" className="absolute left-0 right-0 top-[92px] z-30 max-h-[260px] overflow-y-auto rounded-xl border border-[#d6e1ee] bg-white py-1 shadow-[0_12px_30px_rgba(15,42,67,0.13)]">
        {matched.map((item, idx) => <button type="button" key={item} role="option" aria-selected={idx === focusedIndex}
          onMouseDown={(e) => e.preventDefault()} onClick={() => choose(item)}
          className={`block w-full px-4 py-3 text-left text-sm font-semibold ${idx === focusedIndex ? "bg-[#eaf2ff] text-[#1769d2]" : "text-[#29445d] hover:bg-[#f0f6ff]"}`}>{item}</button>)}
      </div> : null}
      <FieldError>{error}</FieldError>
      <p className="mt-2 text-xs leading-5 text-[#8496a8]">목록에 없는 학교는 직접 입력할 수 있어요. 고등학교도 가능합니다.</p>
    </div>
  );
}

const AGE_MIN = 20;
const AGE_MAX = 55;
function AgeRangePicker({ min, max, onChange }) {
  const direct = Boolean(min !== "" && max !== "" && min != null && max != null);
  const low = direct ? Math.min(AGE_MAX, Math.max(AGE_MIN, Number(min))) : 27;
  const high = direct ? Math.min(AGE_MAX, Math.max(low, Number(max))) : 42;
  const start = ((low - AGE_MIN) / (AGE_MAX - AGE_MIN)) * 100;
  const end = ((high - AGE_MIN) / (AGE_MAX - AGE_MIN)) * 100;
  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3">
        <button type="button" aria-pressed={!direct} onClick={() => onChange("", "")}
          className={`min-h-12 rounded-xl border text-sm font-bold ${!direct ? "border-[#2d6cdf] bg-[#eff5ff] text-[#1d55ad]" : "border-[#dce3eb] text-[#506781]"}`}>상관없어요</button>
        <button type="button" aria-pressed={direct} onClick={() => { if (!direct) onChange(String(low), String(high)); }}
          className={`min-h-12 rounded-xl border text-sm font-bold ${direct ? "border-[#2d6cdf] bg-[#eff5ff] text-[#1d55ad]" : "border-[#dce3eb] text-[#506781]"}`}>범위 선택하기</button>
      </div>
      {direct ? <div className="rounded-xl border border-[#e0e6ef] bg-[#fafbfe] px-5 py-6">
        <div className="flex items-center justify-between gap-4 text-center">
          <div><div className="text-xs font-semibold text-[#8190a1]">최소 나이</div><div className="mt-1 text-xl font-extrabold text-[#1769d2]">{low}세</div></div>
          <div className="text-sm font-bold text-[#9aa9b8]">~</div>
          <div><div className="text-xs font-semibold text-[#8190a1]">최대 나이</div><div className="mt-1 text-xl font-extrabold text-[#1769d2]">{high}세</div></div>
        </div>
        <div className="tw-age-range relative mb-7 mt-8 h-7" aria-label="희망 연령 범위">
          <div className="absolute inset-x-0 top-[12px] h-[5px] rounded-full bg-[#dfe6ee]" />
          <div className="absolute top-[12px] h-[5px] rounded-full bg-[#2d6cdf]" style={{ left: `${start}%`, width: `${Math.max(0, end - start)}%` }} />
          <input type="range" min={AGE_MIN} max={AGE_MAX} value={low} aria-label="희망 최소 나이" onChange={(e) => onChange(String(Math.min(Number(e.target.value), high)), String(high))}
            className="tw-age-input absolute inset-x-0 top-0 z-[5] w-full" />
          <input type="range" min={AGE_MIN} max={AGE_MAX} value={high} aria-label="희망 최대 나이" onChange={(e) => onChange(String(low), String(Math.max(Number(e.target.value), low)))}
            className="tw-age-input absolute inset-x-0 top-0 z-[6] w-full" style={{ zIndex: high - low < 2 ? 4 : 6 }} />
        </div>
        <div className="flex justify-between text-xs font-semibold text-[#9baab9]"><span>{AGE_MIN}세</span><span>{AGE_MAX}세</span></div>
        <style jsx>{`
          .tw-age-input { appearance: none; -webkit-appearance: none; background: transparent; height: 30px; pointer-events: none; }
          .tw-age-input::-webkit-slider-thumb { appearance: none; -webkit-appearance: none; height: 22px; width: 22px; border-radius: 50%; background: #fff; border: 5px solid #2d6cdf; box-shadow: 0 2px 8px #102a4329; cursor: grab; pointer-events: auto; }
          .tw-age-input::-moz-range-thumb { height: 13px; width: 13px; border-radius: 50%; background: #fff; border: 5px solid #2d6cdf; box-shadow: 0 2px 8px #102a4329; cursor: grab; pointer-events: auto; }
          .tw-age-input::-moz-range-track { background: transparent; }
        `}</style>
      </div> : <p className="rounded-xl bg-[#f5f8fc] px-4 py-3 text-sm font-medium leading-6 text-[#6b8097]">연령을 지정하지 않으면 폭넓게 소개 후보를 검토할 수 있어요.</p>}
    </div>
  );
}

function ProfileSummary({ form, compact = false }) {
  const age = formatFullAgeLabel({ birth: form.identityVerifiedData?.birth, birthYear: form.birthYear });
  const photoUrl = useObjectUrl(form.representativePhoto);
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e1e7f0] bg-white shadow-[0_10px_28px_rgba(15,42,67,0.06)]">
      <div className="flex gap-4 bg-[#f5f8fe] p-4 sm:p-5">
        {photoUrl ? (
          <img src={photoUrl} alt="내 대표사진" className="h-[125px] w-[100px] shrink-0 rounded-xl object-cover sm:h-[145px] sm:w-[116px]" />
        ) : (
          <div className="flex h-[125px] w-[100px] shrink-0 items-center justify-center rounded-xl bg-[#e4ecf9] text-3xl">💙</div>
        )}
        <div className="flex min-w-0 flex-col justify-center gap-2">
          <span className="text-[11px] font-extrabold tracking-[0.15em] text-[#3268d9]">MY PROFILE</span>
          <div className="break-words text-xl font-extrabold text-[#142b40]">{form.nickname || form.name || "나의 프로필"}</div>
          <div className="text-sm font-semibold text-[#697e94]">{age}{form.height ? ` · ${form.height}cm` : ""}</div>
          {form.introduction ? <div className="line-clamp-2 text-xs leading-5 text-[#607589]">{form.introduction}</div> : null}
        </div>
      </div>
      <div className="grid gap-2.5 p-4 text-sm font-semibold text-[#536b80] sm:p-5">
        {form.jobCategory ? <div>💼 {form.jobCategory}</div> : null}
        {form.activityAreas?.length ? <div>📍 {form.activityAreas.join(" · ")}</div> : null}
        {form.availableTimeSlots?.length ? <div>☕ {form.availableTimeSlots.join(" · ")}</div> : null}
        {!compact && form.preferredStyles?.length ? <div>💙 {form.preferredStyles.join(" · ")}</div> : null}
      </div>
    </div>
  );
}

function Frame({ screen, form, title, description, children, onBack, onNext, nextLabel = "계속하기", nextDisabled = false, optional = false, onSkip }) {
  const stageIndex = Math.max(0, STAGE_META.findIndex((stage) => stage.screens.includes(screen)));
  const showProgress = screen !== "welcome";

  return (
    <main className="flex min-h-[calc(100dvh-64px)] bg-[#f4f6f8] md:min-h-[calc(100dvh-72px)] sm:px-5">
      <div className="mx-auto flex min-h-[calc(100dvh-64px)] w-full max-w-[640px] flex-col md:min-h-[calc(100dvh-72px)]">
        {showProgress ? (
          <div className="sticky top-[64px] z-20 border-b border-[#e5eaf0] bg-[#f4f6f8]/96 px-3 py-3 backdrop-blur md:top-[72px] sm:px-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-[#d7dee7] bg-white text-[#405a72] transition hover:border-[#9eb7d7]"
                aria-label="이전"
              >
                <FiArrowLeft />
              </button>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex justify-between text-[11px] font-bold text-[#748596]">
                  <span>{stageIndex + 1}. {STAGE_META[stageIndex]?.label}</span>
                  <span>{stageIndex + 1}/5</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#dfe5ec]">
                  <div
                    className="h-full rounded-full bg-[#2d6cdf] transition-all duration-500"
                    style={{ width: `${(REGISTER_SCREENS.indexOf(screen) / (REGISTER_SCREENS.length - 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <section
          key={screen}
          className="register-panel-enter flex flex-1 flex-col bg-white px-3 py-5 sm:my-2 sm:rounded-[14px] sm:border sm:border-[#e1e7ee] sm:px-5 sm:py-5 sm:shadow-[0_10px_30px_rgba(15,42,67,0.05)] "
        >
          <div>
            {optional ? (
              <span className="mb-3 inline-flex rounded-[8px] bg-[#f0f4f8] px-2.5 py-1 text-xs font-bold text-[#5d7185]">
                선택사항
              </span>
            ) : null}
            <h1 className="whitespace-pre-line break-keep text-[26px] font-extrabold leading-[1.24] tracking-[-0.04em] text-[#102a43] sm:text-[30px]">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 whitespace-pre-line break-keep text-sm font-medium leading-6 text-[#687b8e] sm:text-[15px]">
                {description}
              </p>
            ) : null}
            <WickyGuide screen={screen} form={form} />
          </div>

          <div className="mt-6">{children}</div>

          <div className="mt-auto flex gap-3 pt-8">
            {optional && onSkip ? (
              <button
                type="button"
                onClick={onSkip}
                className="h-14 flex-1 rounded-[10px] border border-[#d5dde6] bg-white font-bold text-[#5d7185] transition border-solid  hover:bg-[#f8fafc]"
              >
                건너뛰기
              </button>
            ) : null}
            {onNext ? (
              <button
                type="button"
                disabled={nextDisabled}
                onClick={onNext}
                className="flex h-14 flex-[1.6] items-center justify-center gap-2 rounded-[10px] bg-[#1769d2] font-extrabold text-white transition hover:bg-[#1259b5] active:translate-y-px disabled:cursor-not-allowed disabled:bg-[#b8c4d0]"
              >
                {nextLabel}<FiChevronRight />
              </button>
            ) : null}
          </div>
        </section>
      </div>

      <style jsx global>{`
        @keyframes registerPanelIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .register-panel-enter { animation: registerPanelIn .28s cubic-bezier(.2,.75,.25,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .register-panel-enter { animation: none !important; }
        }
      `}</style>
    </main>
  );
}

export default function ConversationalRegisterFlow({
  screen, form, setForm, errors, onBack, onNext, onIdentityVerify, identityLoading, identityError,
  existingApplication = false, existingApplicationReason = "phone", onOpenDashboard, onResetIdentity, onSubmit, submitting,
}) {
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateConsents = (changes) => setForm((prev) => ({ ...prev, consents: { ...prev.consents, ...changes } }));
  const age = formatFullAgeLabel({ birth: form.identityVerifiedData?.birth, birthYear: form.birthYear });
  const verified = form.phoneVerified === true && form.identityVerifiedData?.verified === true;
  const hasRequiredConsents = ["privacy", "profileContact", "noShowDeposit", "falseInfo"].every((key) => form.consents?.[key] === true);

  if (screen === "welcome") return (
    <Frame form={form}
      screen={screen}
      title={"우리동네 사는 내 스타일,\n실제 만남까지."}
      onNext={onNext}
      nextLabel="본인인증부터 시작하기"
    />
  );

  if (screen === "identity") return (
    <Frame form={form}
      screen={screen}
      title="휴대폰 번호로 본인인증을 진행해주세요."
      onBack={onBack}
      onNext={existingApplication ? undefined : (verified ? onNext : onIdentityVerify)}
      nextLabel={verified ? "계속하기" : identityLoading ? "인증 준비 중..." : "본인인증하기"}
      nextDisabled={identityLoading}
    >
      {existingApplication ? (
        <div className="rounded-[12px] border border-[#dfe5ec] bg-[#f8fafc] p-5">
          <div className="text-base font-extrabold text-[#102a43]">
            {existingApplicationReason === "identity" ? "이전에 등록된 본인인증 정보가 있어요." : "이미 신청한 연락처예요."}
          </div>
          <p className="mt-2 break-keep text-sm leading-6 text-[#62778a]">
            {existingApplicationReason === "identity"
              ? "번호를 변경한 이력이 있다면 기존 신청서 확인이 필요해요. 신청현황에서 조회되지 않을 경우 고객센터로 문의해주세요."
              : "기존 신청현황에서 확인해주세요. 조회되지 않으면 고객센터에 문의해주세요."}
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {existingApplicationReason === "identity" ? (
              <a href="https://open.kakao.com/o/sAJwMNCe" target="_blank" rel="noopener noreferrer"
                className="flex h-12 items-center justify-center rounded-[10px] bg-[#1769d2] text-sm font-extrabold text-white">신청 내역 문의하기</a>
            ) : (
              <button type="button" onClick={onOpenDashboard} className="h-12 rounded-[10px] bg-[#1769d2] text-sm font-extrabold text-white">신청 현황 조회</button>
            )}
            <button type="button" onClick={onResetIdentity} className="h-12 rounded-[10px] border border-[#d5dde6] bg-white text-sm font-bold text-[#405a72]">번호 다시 입력</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-2 text-sm font-bold text-[#2f475e]">휴대폰 번호</div>
          <TextField
            value={form.phone}
            onChange={(value) => update("phone", formatPhone(value))}
            placeholder="010-0000-0000"
            inputMode="numeric"
            disabled={verified}
            error={errors.phone || errors.phoneVerify || identityError}
          />
          {verified ? <p className="mt-3 text-sm font-semibold text-[#1769d2]">본인인증 완료</p> : null}
        </div>
      )}
    </Frame>
  );

  if (screen === "basic") return (
    <Frame form={form} screen={screen} title="기본정보를 확인해볼게요." onBack={onBack} onNext={onNext}>
      <div className="rounded-2xl border border-[#e2e9f3] bg-[#f8fafc] p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold text-[#537293]"><FiCheck /> 본인인증 정보</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <div className="mb-1.5 text-xs text-[#8999aa]">이름</div>
            {form.identityVerifiedData?.name ? <div className="font-extrabold text-[#223951]">{form.name}</div>
              : <TextField value={form.name} onChange={(v) => update("name", v)} placeholder="이름" error={errors.name} />}
          </div>
          <div>
            <div className="mb-1.5 text-xs text-[#8999aa]">성별</div>
            {form.identityVerifiedData?.gender ? <div className="font-extrabold text-[#223951]">{form.gender === "male" ? "남성" : "여성"}</div>
              : <><ChoiceGrid options={[{ label: "남성", value: "male" }, { label: "여성", value: "female" }]} value={form.gender} onChange={(v) => update("gender", v)} /><FieldError>{errors.gender}</FieldError></>}
          </div>
          <div>
            <div className="mb-1.5 text-xs text-[#8999aa]">출생연도</div>
            {form.identityVerifiedData?.birth ? <div className="font-extrabold text-[#223951]">{form.birthYear}년생</div>
              : <TextField value={form.birthYear} onChange={(v) => update("birthYear", v.replace(/[^0-9]/g, "").slice(0, 4))} placeholder="출생연도" inputMode="numeric" error={errors.birthYear} />}
          </div>
        </div>
      </div>
      <div className="mt-6" data-tw-field="true">
        <div className="mb-2 text-sm font-bold text-[#29445d]">키 <span className="text-[#3268d9]">· 필수</span></div>
        <div className="relative">
          <input type="text" inputMode="numeric" maxLength={3} value={form.height || ""}
            onChange={(e) => update("height", e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
            placeholder="예: 175"
            className="h-14 w-full rounded-xl border border-[#d5dde6] bg-white px-4 pr-12 text-base font-semibold text-[#142b40] outline-none transition focus:border-[#2d6cdf] focus:ring-2 focus:ring-[#2d6cdf]/10" />
          <span className="pointer-events-none absolute right-4 top-4 font-bold text-[#75899d]">cm</span>
        </div>
        <FieldError>{errors.height}</FieldError>
      </div>
      <div className="mt-6">
        <div className="mb-3 text-sm font-bold text-[#29445d]">현재 미혼·싱글이신가요?</div>
        <ChoiceGrid columns={1} options={[{ label: "네, 미혼·싱글입니다", value: "single" }]} value={form.maritalStatus} onChange={(v) => update("maritalStatus", v)} />
        <FieldError>{errors.maritalStatus}</FieldError>
      </div>
    </Frame>
  );

  if (screen === "profile") return (
    <Frame form={form} screen={screen} title="어떤 사진으로 소개할까요?" onBack={onBack} onNext={onNext}>
      <PhotoUploadGrid representativePhoto={form.representativePhoto} additionalPhotos={form.additionalPhotos}
        setForm={setForm} error={errors.representativePhoto || errors.additionalPhotos} />
    </Frame>
  );

  if (screen === "introduction") return (
    <Frame form={form} screen={screen} title="나를 어떻게 소개할까요?" onBack={onBack} onNext={onNext}>
      <div data-tw-field="true">
        <div className="mb-2 text-sm font-bold text-[#29445d]">닉네임</div>
        <TextField value={form.nickname} onChange={(v) => update("nickname", v)} placeholder="상대방에게 보여줄 이름" maxLength={20} error={errors.nickname} />
      </div>
      <div className="mt-7" data-tw-field="true">
        <div className="mb-2 text-sm font-bold text-[#29445d]">짧은 자기소개</div>
        <textarea value={form.introduction || ""} onChange={(e) => update("introduction", e.target.value)} maxLength={80} rows={3}
          placeholder="예: 퇴근 후 산책과 맛집 탐방을 좋아해요 :)"
          className="resize-none rounded-xl border border-[#d5dde6] bg-white p-4 text-sm font-semibold leading-6 outline-none focus:border-[#2d6cdf] w-[stretch]" />
        <div className="mt-1 text-right text-xs font-medium text-[#8a9aab]">{(form.introduction || "").length}/80</div>
        <FieldError>{errors.introduction}</FieldError>
      </div>
    </Frame>
  );

  if (screen === "job") return (
    <Frame form={form} screen={screen} title="어떤 일을 하고 계세요?" onBack={onBack} onNext={onNext}>
      <ChoiceGrid options={JOB_CATEGORIES} value={form.jobCategory} onChange={(v) => update("jobCategory", v)} />
      <FieldError>{errors.jobCategory}</FieldError>
      {form.jobCategory === "회사원" ? (
        <div className="mt-6"><div className="mb-3 text-sm font-bold text-[#29445d]">어떤 회사에서 근무하세요?</div>
          <ChoiceGrid options={COMPANY_SCALE_OPTIONS} value={form.companyScale} onChange={(v) => update("companyScale", v)} />
          <FieldError>{errors.companyScale}</FieldError>
        </div>
      ) : null}
    </Frame>
  );

  if (screen === "jobProof") return (
    <Frame form={form} screen={screen} title="직업정보를 확인할게요." description="인증자료는 상대에게 공개되지 않아요." onBack={onBack} onNext={onNext}>
      <div className="mb-5"><div className="mb-2 text-sm font-bold text-[#29445d]">회사·기관·직업 상세</div>
        <TextField value={form.organizationName} onChange={(v) => update("organizationName", v)} placeholder="회사 또는 활동명" maxLength={60} error={errors.organizationName} />
      </div>
      <div data-tw-field="true">
        <div className="mb-2 text-sm font-bold text-[#29445d]">직업 인증자료</div>
        <label className="block cursor-pointer rounded-xl border border-dashed border-[#aac0dc] bg-[#f8fafc] p-5 text-center transition hover:bg-[#edf4ff]">
          <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={(e) => update("verificationDocument", e.target.files?.[0] || null)} />
          <div className="font-extrabold text-[#216b9f]">{form.verificationDocument?.name || "인증자료 선택하기"}</div>
          <div className="mt-2 text-xs font-medium leading-5 text-[#698094]">명함·사원증·재직증명서·사업자등록증 등</div>
        </label>
        <FieldError>{errors.verificationDocument}</FieldError>
      </div>
    </Frame>
  );

  if (screen === "education") return (
    <Frame form={form} screen={screen} title="어느 학교를 다니셨나요?" onBack={onBack} onNext={onNext}>
      <div className="mb-6"><div className="mb-3 text-sm font-bold text-[#29445d]">최종학력 <span className="text-[#3268d9]">· 필수</span></div>
        <ChoiceGrid options={EDUCATION_OPTIONS} value={form.educationLevel} onChange={(value) => update("educationLevel", value)} />
        <FieldError>{errors.educationLevel}</FieldError>
      </div>
      <SchoolAutocomplete value={form.schoolName} onChange={(value) => update("schoolName", value)} error={errors.schoolName} />
    </Frame>
  );

  if (screen === "traits") return (
    <Frame form={form} screen={screen} title="어떤 취향을 갖고 계세요?" optional onSkip={onNext} onBack={onBack} onNext={onNext}>
      <MbtiPicker value={form.mbti} draft={form.mbtiDraft} onChange={(values) => setForm((prev) => ({ ...prev, ...values }))} />
      <div className="mt-7"><InterestPicker value={form.interests} onChange={(value) => update("interests", value)} /></div>
    </Frame>
  );

  if (screen === "meeting") return (
    <Frame form={form} screen={screen} title="어디에서 만나면 편하세요?" onBack={onBack} onNext={onNext}>
      <div className="mb-3 flex items-center justify-between gap-2"><div className="text-xs font-semibold text-[#8192a5]">가능한 지역을 골라주세요 · 최대 5개</div>
        <button type="button" className="text-xs font-extrabold text-[#1769d2]" onClick={() => setForm((prev) => ({ ...prev, activityAreas: [...ACTIVITY_AREAS], preferredArea: ACTIVITY_AREAS.includes(prev.preferredArea) ? prev.preferredArea : "강남구" }))}>전체 선택</button></div>
      <ChoiceGrid options={ACTIVITY_AREAS} value={form.activityAreas} multiple max={5}
        onChange={(v) => setForm((prev) => ({ ...prev, activityAreas: v, preferredArea: v.includes(prev.preferredArea) ? prev.preferredArea : (v[0] || "") }))} />
      <FieldError>{errors.activityAreas}</FieldError>
      {form.activityAreas?.length > 1 ? (
        <div className="mt-7"><div className="mb-3 text-sm font-bold text-[#29445d]">그중 가장 편한 지역은?</div>
          <ChoiceGrid options={form.activityAreas} value={form.preferredArea} onChange={(v) => update("preferredArea", v)} />
          <FieldError>{errors.preferredArea}</FieldError>
        </div>
      ) : null}
    </Frame>
  );

  if (screen === "availability") return (
    <Frame form={form} screen={screen} title="언제가 가장 편하세요?" onBack={onBack} onNext={onNext}>
      <div className="mb-3 flex justify-end"><button type="button" onClick={() => update("availableTimeSlots", [...TIME_SLOTS])} className="text-xs font-extrabold text-[#1769d2]">전체 선택</button></div>
      <ChoiceGrid columns={1} options={TIME_SLOTS} value={form.availableTimeSlots} multiple onChange={(v) => update("availableTimeSlots", v)} />
      <FieldError>{errors.availableTimeSlots}</FieldError>
    </Frame>
  );

  if (screen === "midpoint") return <Frame form={form} screen={screen} title="내 소개가 이만큼 완성됐어요!" onBack={onBack} onNext={onNext}><ProfileSummary form={form} compact /></Frame>;

  const valueScreens = {
    marriage: ["결혼은 어떻게 생각하세요?", MARRIAGE_PLAN_OPTIONS, "marriagePlan"],
    children: ["자녀 계획은 어떻게 생각하세요?", CHILDREN_PLAN_OPTIONS, "childrenPlan"],
    smoking: ["흡연 여부를 알려주세요.", SMOKING_OPTIONS, "smoking"],
    religion: ["종교가 있으신가요?", RELIGION_OPTIONS, "religion"],
    drinking: ["음주는 얼마나 자주 하시나요?", DRINKING_FREQUENCY_OPTIONS, "drinkingFrequency"],
  };
  if (valueScreens[screen]) {
    const [title, options, key] = valueScreens[screen];
    return <Frame form={form} screen={screen} title={title} onBack={onBack} onNext={onNext}>
      <ChoiceGrid columns={1} options={options} value={form[key]} onChange={(value) => update(key, value)} />
      <FieldError>{errors[key]}</FieldError>
    </Frame>;
  }

  if (screen === "preference") return (
    <Frame form={form} screen={screen} title="어느 연령대가 편하세요?" optional onSkip={onNext} onBack={onBack} onNext={onNext}>
      <AgeRangePicker min={form.preferredAgeMin} max={form.preferredAgeMax}
        onChange={(min, max) => setForm((prev) => ({ ...prev, preferredAgeMin: min, preferredAgeMax: max }))} />
    </Frame>
  );

  if (screen === "preferenceLifestyle") return (
    <Frame form={form} screen={screen} title="상대의 생활 습관은요?" optional onSkip={onNext} onBack={onBack} onNext={onNext}>
      <div className="mb-7">
        <div className="mb-3 text-sm font-bold text-[#29445d]">상대의 흡연은 어디까지 괜찮으세요?</div>
        <ChoiceGrid columns={1} options={SMOKING_PREFERENCE_OPTIONS} value={form.smokingPreference} onChange={(value) => update("smokingPreference", value)} />
      </div>
      <div>
        <div className="mb-3 text-sm font-bold text-[#29445d]">상대의 음주는 어디까지 괜찮으세요?</div>
        <ChoiceGrid columns={1} options={DRINKING_PREFERENCE_OPTIONS} value={form.preferredDrinking} onChange={(value) => update("preferredDrinking", value)} />
      </div>
    </Frame>
  );

  if (screen === "preferenceReligion") return (
    <Frame form={form} screen={screen} title="상대의 종교는 어떤가요?" optional onSkip={onNext} onBack={onBack} onNext={onNext}>
      <ChoiceGrid columns={1} options={RELIGION_PREFERENCE_OPTIONS} value={form.religionPreference} onChange={(value) => update("religionPreference", value)} />
    </Frame>
  );

  if (screen === "preferenceStyle") return (
    <Frame form={form} screen={screen} title="어떤 사람에게 마음이 가나요?" description="마음에 드는 스타일을 최대 3개 골라주세요." optional onSkip={onNext} onBack={onBack} onNext={onNext}>
      <ChoiceGrid options={PREFERRED_STYLE_OPTIONS} value={form.preferredStyles} multiple max={3} onChange={(v) => update("preferredStyles", v)} />
      <details className="mt-6 rounded-xl border border-[#e2e9f0] bg-[#fafbfd] px-4 py-4">
        <summary className="cursor-pointer text-sm font-bold text-[#49637a]">선호 직업·추가 조건도 알려주기 <span className="ml-1 text-xs font-medium text-[#90a0af]">(선택)</span></summary>
        <div className="mt-5"><div className="mb-3 text-sm font-bold text-[#29445d]">선호 직업군 최대 2개</div>
          <ChoiceGrid options={JOB_CATEGORIES} value={form.preferredJobCategories} multiple max={2} onChange={(v) => update("preferredJobCategories", v)} />
          <div className="mb-2 mt-5 text-sm font-bold text-[#29445d]">추가로 바라는 점</div>
          <textarea value={form.additionalPreference || ""} onChange={(e) => update("additionalPreference", e.target.value)} maxLength={300} rows={3}
            placeholder="예: 주말에 같이 산책할 수 있는 분이면 좋겠어요."
            className="w-full resize-none rounded-xl border border-[#d5dde6] bg-white p-4 text-sm font-semibold leading-6 outline-none focus:border-[#2d6cdf]" />
        </div>
      </details>
      <p className="mt-4 text-xs leading-5 text-[#8b9cac]">희망 조건은 소개할 분을 검토할 때 참고해요. 모든 조건의 일치를 보장하지는 않아요.</p>
    </Frame>
  );

  if (screen === "source") return <Frame form={form} screen={screen} title="투윅스를 어떻게 알게 되셨나요?" optional onSkip={onNext} onBack={onBack} onNext={onNext}><select value={form.selfReportedSource || ""} onChange={(event) => update("selfReportedSource", event.target.value)} className="h-14 w-full rounded-[10px] border border-[#d5dde6] bg-white px-4 font-bold outline-none focus:border-[#2d6cdf]"><option value="">알게 된 경로 (선택)</option>{SELF_REPORTED_SOURCE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>{form.selfReportedSource === "other" ? <div className="mt-3"><TextField value={form.selfReportedSourceDetail} onChange={(value) => update("selfReportedSourceDetail", value)} placeholder="알게 된 경로" maxLength={60} /></div> : null}<div className="mt-6 rounded-[12px] border border-[#dce3eb] bg-[#f8fafc] p-4"><div className="font-extrabold text-[#29445d]">추천인이 있으신가요?</div><p className="mt-1 text-xs font-semibold leading-5 text-[#698094]">추천인이 있다면 이름과 연락처 뒤 4자리를 입력해주세요.</p><ChoiceGrid options={[{ label: "없어요", value: "no" }, { label: "추천인이 있어요", value: "yes" }]} value={form.hasReferrer ? "yes" : "no"} onChange={(value) => update("hasReferrer", value === "yes")} />{form.hasReferrer ? <div className="mt-3 grid gap-3 sm:grid-cols-2"><TextField value={form.referrerName} onChange={(value) => update("referrerName", value)} placeholder="추천인 이름·닉네임" maxLength={30} /><TextField value={form.referrerPhoneLast4} onChange={(value) => update("referrerPhoneLast4", value.replace(/[^0-9]/g, "").slice(0, 4))} placeholder="연락처 뒤 4자리" inputMode="numeric" /></div> : null}</div></Frame>;

  if (screen === "consent") return (
    <Frame form={form} screen={screen} title="마지막으로, 약관을 확인해주세요." onBack={onBack} onNext={onNext}
      nextLabel="내 프로필 확인하기" nextDisabled={!hasRequiredConsents}>
      <ConsentAgreementPanel consents={form.consents} onChange={updateConsents} error={errors.consents} gender={form.gender} />
      <div className="mt-5 flex items-start gap-2 break-keep text-[11px] font-semibold leading-5 text-[#8192a5]">
        <FiShield className="mt-0.5 shrink-0" /> 인증자료와 연락처는 공개 프로필에 포함되지 않아요.
      </div>
    </Frame>
  );

  return <Frame form={form} screen="review" title="내 소개가 완성됐어요!" onBack={onBack} onNext={onSubmit} nextLabel={submitting ? "안전하게 저장 중..." : "내 소개 준비 완료하기"} nextDisabled={submitting}><ProfileSummary form={form} /></Frame>;
}
