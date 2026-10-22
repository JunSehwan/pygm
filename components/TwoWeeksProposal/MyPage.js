import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  FiArrowLeft, FiChevronRight, FiCheckCircle, FiClock, FiGift,
  FiLogOut, FiMapPin,
  FiShield, FiUser, FiCreditCard, FiSettings, FiExternalLink, FiAlertCircle,
} from "react-icons/fi";
import { profileCompletion } from "./dashboardHomeState";
import { getMyMatchingControl } from "./myPageModel.mjs";
import { getDepositBalance, getDepositTopUpRequiredAmount, formatWon } from "../TwoWeeksShared/depositPolicy";
import { MATCHING_OPTION_LABELS } from "../TwoWeeksShared/matchingCompatibility";

const MENU = {
  profile: "내 프로필", conditions: "나의 소개조건", availability: "활동지역 · 가능시간",
  status: "신청 · 인증현황", deposit: "만남 보증금", invite: "친구 초대",
  withdrawal: "회원 탈퇴",
};
const CARD = "rounded-[13px] border border-solid border-[#e7edf5] bg-white px-4 py-4 shadow-[0_4px_18px_rgba(31,59,102,.025)] sm:px-5";
const POLICY_LINKS = [
  { name: "공지사항", href: "https://delightful-quokka-ae8.notion.site/3fffb004cc258013b3f0f9a15a439b90?pvs=74" },
  { name: "자주 묻는 질문", href: "https://delightful-quokka-ae8.notion.site/3fffb004cc2580f5a2b1e4f46aac82ad?v=3fffb004cc2580369f8c000c982563e6&source=copy_link" },
  { name: "문의하기", href: "https://open.kakao.com/o/sAJwMNCe" },
];
const list = (value) => Array.isArray(value) ? value.filter(Boolean).join(" · ") : "";
function parseAge(basic) {
  const raw = String(basic.birthDate || "").replace(/\D/g, "");
  const year = Number(raw.slice(0, 4) || basic.birthYear || 0);
  if (!year) return basic.age ? `만 ${basic.age}세` : "나이 미입력";
  const now = new Date();
  let age = now.getFullYear() - year;
  if (raw.length >= 8) {
    const m = Number(raw.slice(4, 6)); const d = Number(raw.slice(6, 8));
    if (m > now.getMonth() + 1 || (m === now.getMonth() + 1 && d > now.getDate())) age -= 1;
  }
  return `만 ${age}세`;
}
function verificationInfo(application) {
  const identityOk = application?.phoneIdentityVerification?.verified === true || application?.basic?.phoneVerified === true;
  const state = String(application?.verificationReview?.status || "");
  return {
    identity: identityOk ? "완료" : "확인 필요",
    job: state === "approved" ? "완료" : ["needs_review", "pending", "reviewing"].includes(state) ? "확인 중" : state === "revision_requested" ? "보완 요청" : "확인 불가",
  };
}
function depositLabel(deposit = {}) {
  const balance = getDepositBalance(deposit);
  const topup = getDepositTopUpRequiredAmount(deposit);
  if (deposit.status === "exempt" || deposit.exempted === true) return "면제";
  if (deposit.refundRequest?.status === "requested" || deposit.refundRequest?.status === "pending") return "반환 처리 중";
  if (deposit.status === "refunded" || deposit.refundRequest?.status === "completed") return "반환 완료";
  if (deposit.status === "confirmed") return `${formatWon(balance)} 유지 중`;
  if (topup > 0 && deposit.status === "topup_required") return `추가 ${formatWon(topup)} 필요`;
  if (deposit.requestStage === "later" && deposit.status === "pending") return "추후 안내";
  if (deposit.requestStage === "requested") return "입금 안내 확인";
  return "확인 중";
}
function Pair({ name, value }) {
  return <div className="flex items-center justify-between gap-4 border-b border-solid border-[#eef2f8] py-3 last:border-b-0">
    <dt className="shrink-0 text-[13px] font-semibold text-[#778ba3]">{name}</dt>
    <dd className="min-w-0 break-keep text-right text-[14px] font-bold leading-6 text-[#1d3755]">{value || "미입력"}</dd>
  </div>;
}
function DetailCard({ title, children }) {
  return <section className={CARD}><h3 className="mb-3 text-[16px] font-black text-[#142c46]">{title}</h3><dl>{children}</dl></section>;
}
function MenuItem({ title, detail, Icon, onClick }) {
  return <button type="button" onClick={onClick} className="flex min-h-[56px] w-full items-center gap-3 border-b border-[#edf1f6] py-3 text-left transition-colors last:border-b-0 hover:text-[#2467c9] focus-visible:rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#326bda]">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f2f6fc] text-[#4776b9]"><Icon size={18} /></span>
    <span className="min-w-0 flex-1"><span className="block text-[14px] font-bold text-[#19334f]">{title}</span>{detail ? <span className="mt-0.5 block break-keep text-[12px] leading-5 text-[#788ba1]">{detail}</span> : null}</span>
    <FiChevronRight className="shrink-0 text-[#9aabbc]" aria-hidden="true" />
  </button>;
}
function MyProfilePhoto({ src }) {
  const [state, setState] = useState(src ? "loading" : "empty");
  const imageRef = useRef(null);
  useEffect(() => {
    if (!src) { setState("empty"); return; }
    const image = imageRef.current;
    if (image?.complete) setState(image.naturalWidth > 0 ? "loaded" : "error");
    else setState("loading");
  }, [src]);
  if (!src) return <div className="flex h-[88px] w-[77px] shrink-0 items-center justify-center rounded-2xl bg-[#e9f1fc] text-[#477ac4]"><FiUser size={30}/></div>;
  return <div className="relative h-[88px] w-[77px] shrink-0 overflow-hidden rounded-2xl bg-[#e7edf5]">
    {state !== "loaded" ? <div className="absolute inset-0 z-10 flex items-center justify-center" role="status" aria-label={state === "error" ? "사진을 불러오지 못했습니다" : "프로필 사진을 불러오는 중입니다"}>
      {state === "error" ? <FiUser size={26} className="text-[#91a5b9]"/> : <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-[#c6d9f5] border-t-[#326bda] motion-reduce:animate-none"/>}
    </div> : null}
    <img ref={imageRef} src={src} alt="내 대표사진" className={`h-full w-full object-cover transition-opacity duration-200 ${state === "loaded" ? "opacity-100" : "opacity-0"}`} onLoad={() => setState("loaded")} onError={() => setState("error")}/>
  </div>;
}
function MatchingSettings({ application, busy, onChange, onViewIntro }) {
  const control = getMyMatchingControl(application);
  const disabled = busy || !control.action;
  return <section className={CARD}>
    <div className="flex items-center justify-between gap-3">
      <div><h3 className="text-[16px] font-black text-[#142c46]">새로운 소개 받기</h3><p className="mt-1 text-[13px] text-[#7389a2]">{control.label}</p></div>
      <button type="button" role="switch" aria-label="새로운 소개 받기" aria-checked={control.active} disabled={disabled} title={disabled ? control.reason : control.active ? "새 소개 받기 쉬기" : "새 소개 다시 받기"}
        onClick={() => onChange?.(control.action)} className={`relative h-[34px] w-[61px] rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${control.active ? "bg-[#326bda]" : "bg-[#c4cfdd]"}`}>
        <span className={`absolute top-[4px] h-[26px] w-[26px] rounded-full bg-white shadow-sm transition-all ${control.active ? "left-[31px]" : "left-[4px]"}`} />
      </button>
    </div>
    {busy ? <p role="status" className="mt-3 text-xs text-[#567ba9]">설정을 확인하고 있어요.</p> : null}
    {!busy && !control.action && control.reason ? <p className="mt-3 break-keep text-[13px] leading-5 text-[#667c95]">{control.reason}</p> : null}
    {control.inProgress ? <button type="button" onClick={onViewIntro} className="mt-2 text-[13px] font-bold text-[#326bda] hover:underline">현재 소개 보기 →</button> : null}
  </section>;
}
function Conditions({ application, onEdit }) {
  const prefs = application?.matchingPreferences || application?.basic?.matchingPreferences || {};
  const basic = application?.basic || {};
  const named = (group, key) => MATCHING_OPTION_LABELS?.[group]?.[key] || (key ? String(key).replace(/_/g, " ") : "미입력");
  const age = prefs.preferredAgeRange;
  const ageLabel = age?.min && age?.max ? `${age.min}~${age.max}세` : "등록된 연령 조건 없음";
  return <div className="space-y-4">
    <DetailCard title="원하는 상대 조건">
      <Pair name="희망 연령" value={ageLabel} />
      <Pair name="상대 흡연" value={named("smokingPreference", prefs.smokingPreference)} />
      <Pair name="상대 종교" value={named("religionPreference", prefs.religionPreference)} />
      {prefs.drinkingPreference ? <Pair name="상대 음주" value={named("drinkingPreference", prefs.drinkingPreference)} /> : null}
      {Array.isArray(prefs.preferredStyles) && prefs.preferredStyles.length ? <Pair name="원하는 스타일" value={list(prefs.preferredStyles)} /> : null}
    </DetailCard>
    <DetailCard title="만남 가능한 지역과 시간">
      <Pair name="활동지역" value={list(basic.activityAreas)} />
      <Pair name="가장 편한 지역" value={basic.preferredArea} />
      <Pair name="가능시간" value={list(basic.availableTimeSlots)} />
    </DetailCard>
    <p className="px-1 text-xs leading-5 text-[#74879d]">현재 소개조건은 실제 저장된 값만 표시해요. 수정은 기존 프로필 편집 권한 및 제한 정책을 따릅니다.</p>
    <button type="button" onClick={onEdit} className="w-full rounded-xl border border-[#a9c3ec] bg-white px-4 py-3 text-sm font-bold text-[#326bda]">수정 가능한 항목 확인하기</button>
  </div>;
}
export default function MyPage({
  application, view = "overview", onNavigate, onGoIntro, onLogout, busyMatching, onMatchingChange,
  profileContent, depositContent, statusContent, inviteContent, withdrawalContent,
}) {
  const basic = application?.basic || {};
  const identity = application?.identity || {};
  const completed = useMemo(() => profileCompletion(application), [application]);
  const verification = verificationInfo(application);
  const imageSrc = identity?.representativePhoto?.previewUrl || identity?.representativePhoto?.url || "";
  const myView = MENU[view] ? view : "overview";
  return <div className="space-y-2 pb-3">
    {myView === "overview" ? <>
      <button type="button" onClick={() => onNavigate("profile")} className={`${CARD} block w-full text-left`}>
        <div className="flex items-center gap-4">
          <MyProfilePhoto src={imageSrc}/>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1"><h2 className="truncate text-[21px] font-black text-[#142c46]">{basic.nickname || basic.name || "내 프로필"}</h2><FiChevronRight className="shrink-0 text-[#8599b0]" /></div>
            <p className="mt-1 break-keep text-[13px] font-semibold leading-5 text-[#6b8097]">{parseAge(basic)} · {identity.jobCategory || "직업 미입력"}</p>
            <p className="mt-1 line-clamp-1 text-xs text-[#8a9bac]">{list(basic.activityAreas) || "지역 미입력"}</p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between"><span className="text-xs font-bold text-[#6b8097]">프로필 완성도</span><strong className="text-sm text-[#326bda]">{completed.percent}%</strong></div>
        <div role="progressbar" aria-valuenow={completed.percent} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-2 overflow-hidden rounded-full bg-[#e7eef8]"><div className="h-full rounded-full bg-[#326bda]" style={{ width: `${completed.percent}%` }} /></div>
      </button>
      <section className={CARD}>
        <h3 className="mb-1 text-[15px] mb-2 font-black text-[#1e3b5a]">내 정보</h3>
        <MenuItem title="나의 소개조건" Icon={FiSettings} onClick={() => onNavigate("conditions")} />
        <MenuItem title="활동지역 · 가능시간" Icon={FiMapPin} onClick={() => onNavigate("availability")} />
        <MenuItem title="신청 · 인증현황" Icon={FiShield} onClick={() => onNavigate("status")} />
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-[#eef2f7] pt-3 text-xs font-semibold text-[#66809d]">
          <span>본인인증 <strong className="text-[#2c658b]">{verification.identity}</strong></span>
          <span>직업인증 <strong className="text-[#2c658b]">{verification.job}</strong></span>
        </div>
      </section>
      <MatchingSettings application={application} busy={busyMatching} onChange={onMatchingChange} onViewIntro={onGoIntro} />
      <section className={CARD}><h3 className="text-[15px] mb-2 font-black text-[#1e3b5a]">만남 보증금</h3><MenuItem title="보증금 현황 · 이용내역 · 반환" detail={depositLabel(application?.deposit)} Icon={FiCreditCard} onClick={() => onNavigate("deposit")} /></section>
      <section className={CARD}><h3 className="text-[15px] mb-2 font-black text-[#1e3b5a]">혜택</h3><MenuItem title="친구 초대" detail="초대 링크 및 혜택 확인" Icon={FiGift} onClick={() => onNavigate("invite")} /></section>
      <section className={CARD}><h3 className="text-[15px] mb-2 font-black text-[#1e3b5a]">고객지원</h3>
        {POLICY_LINKS.map(({ name, href }) => <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-between border-b border-[#edf1f6] text-sm font-bold text-[#1e3b5a] last:border-b-0">{name}<FiExternalLink className="text-[#9aacc0]" /></a>)}
        <Link href="/about/service" className="flex min-h-12 items-center justify-between border-b border-[#edf1f6] text-sm font-bold text-[#1e3b5a]">이용약관<FiChevronRight className="text-[#9aacc0]" /></Link>
        <Link href="/about/privacy" className="flex min-h-12 items-center justify-between text-sm font-bold text-[#1e3b5a]">개인정보처리방침<FiChevronRight className="text-[#9aacc0]" /></Link>
      </section>
      <section className={CARD}><h3 className="text-[15px] mb-2 font-black text-[#1e3b5a]">계정</h3>
        <MenuItem title="로그아웃" Icon={FiLogOut} onClick={onLogout} />
        <MenuItem title="회원 탈퇴" Icon={FiAlertCircle} onClick={() => onNavigate("withdrawal")} />
      </section>
    </> : <>

      {myView === "profile" ? <>{profileContent}</> : null}
      {myView === "conditions" ? <Conditions application={application} onEdit={() => onNavigate("profile")} /> : null}
      {myView === "availability" ? <div className="space-y-4"><DetailCard title="현재 가능한 만남 조건"><Pair name="활동지역" value={list(basic.activityAreas)} /><Pair name="가장 편한 지역" value={basic.preferredArea} /><Pair name="가능시간" value={list(basic.availableTimeSlots)} /></DetailCard><button type="button" onClick={() => onNavigate("profile")} className="w-full rounded-xl bg-[#326bda] px-4 py-3 text-sm font-bold text-white">프로필에서 수정하기</button></div> : null}
      {myView === "status" ? statusContent : null}
      {myView === "deposit" ? depositContent : null}
      {myView === "invite" ? inviteContent : null}
      {myView === "withdrawal" ? withdrawalContent : null}
    </>}
  </div>;
}
