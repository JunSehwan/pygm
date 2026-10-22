import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { FiCheck, FiChevronRight } from "react-icons/fi";
import HomeTab from "./HomeTab";
import IntroJourneyTab from "./IntroJourneyTab";
import { resolveIntroJourney } from "./introJourneyState";
import { loadRecentIntroHistory } from "./proposalService";
import DashboardBottomNav from "./DashboardBottomNav";
import { sectionForTab } from "./dashboardNavigation";
import MyFriendInviteTab from "./MyFriendInviteTab";
import MyPage from "./MyPage";
import WithdrawalModal from "./WithdrawalModal";
import MyProfileEditModal from "./MyProfileEditModal";
import LoadingSpinner from "../TwoWeeksShared/LoadingSpinner";
import {
  TWOWEEKS_DECLINE_REASON_OPTIONS,
  normalizeTwoWeeksDeclineReason,
} from "../TwoWeeksShared/declineReasons";
import { MATCHING_OPTION_LABELS } from "../TwoWeeksShared/matchingCompatibility";
import {
  TWOWEEKS_DEPOSIT_BANK,
  formatWon,
  getDepositBalance,
  getDepositHistory,
  getDepositRequiredBalance,
  getDepositTopUpRequiredAmount,
} from "../TwoWeeksShared/depositPolicy";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const SUPPORT_CHANNEL_URL =
  process.env.NEXT_PUBLIC_TWOWEEKS_KAKAO_CHANNEL_URL || "https://open.kakao.com/o/sAJwMNCe";

function getBasic(application = {}) {
  return application?.basic || {};
}

function getIdentity(application = {}) {
  return application?.identity || {};
}

function getMatchingPreferences(application = {}) {
  return application?.matchingPreferences || application?.basic?.matchingPreferences || {};
}

function getMatchingOptionLabel(group = "", value = "") {
  return MATCHING_OPTION_LABELS?.[group]?.[value] || "미입력";
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function formatTimeSlotLabel(value = "") {
  if (value === "평일 저녁") return "금요일 저녁";
  return value || "";
}

function formatTimeSlots(values = []) {
  return normalizeArray(values).map(formatTimeSlotLabel).filter(Boolean).join(" · ");
}

function getTimeSlotLabelByKey(key = "") {
  const labels = {
    friday_evening: "금요일 저녁",
    saturday_afternoon: "토요일 낮",
    saturday_evening: "토요일 저녁",
    sunday_afternoon: "일요일 낮",
    sunday_evening: "일요일 저녁",
  };

  return labels[key] || "";
}

function getGenderLabel(value = "") {
  if (value === "male") return "남성";
  if (value === "female") return "여성";
  return "-";
}

function getShortBirthYear(value) {
  const year = Number(value || 0);
  if (!year) return "";
  return `${String(year).slice(-2)}년생`;
}

function parseBirthDate(value = "") {
  const digits = String(value || "").replace(/[^0-9]/g, "");
  if (digits.length < 8) return null;

  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));

  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;

  return { year, month, day };
}

function getFullAge(basic = {}) {
  const parsed = parseBirthDate(basic.birthDate || basic.birth || "");
  const birthYear = Number(basic.birthYear || 0);
  const now = new Date();

  if (parsed) {
    let age = now.getFullYear() - parsed.year;
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    if (currentMonth < parsed.month || (currentMonth === parsed.month && currentDay < parsed.day)) {
      age -= 1;
    }

    return age;
  }

  if (birthYear) return now.getFullYear() - birthYear;

  return Number(basic.age || 0) || null;
}

function formatAgeBirth(basic = {}) {
  const age = getFullAge(basic);
  const birth = getShortBirthYear(basic.birthYear);

  if (age && birth) return `만 ${age}세(${birth})`;
  if (age) return `만 ${age}세`;
  if (birth) return birth;
  return "-";
}

function getApplicationStatusLabel(application = {}) {
  const status = String(application?.status || "");

  if (!application?.id) return "미신청";
  if (["cancelled", "withdrawn"].includes(status)) return "신청 취소";
  if (status === "rejected") return "신청 반려";
  return "신청 완료";
}

function getReviewStatusLabel(application = {}) {
  const status = String(application?.reviewStatus || "pending");

  const labels = {
    pending: "검토 대기",
    reviewing: "검토 중",
    approved: "검토 완료",
    rejected: "반려",
    waitlisted: "대기풀",
  };

  return labels[status] || "상태 확인 중";
}

function getDepositStatusLabel(application = {}) {
  const status = String(application?.deposit?.status || "pending");

  const labels = {
    pending: application?.deposit?.requestStage === "later" ? "추후 안내" : "입금 대기",
    confirmed: "예치 완료",
    topup_required: "추가 예치 필요",
    refund_requested: "반환 요청",
    refunded: "반환 완료",
  };

  return labels[status] || "상태 확인 중";
}

function getMatchingStatusLabel(application = {}) {
  const status = String(application?.matchingStatus || "not_started");
  const nextRoundStatus = String(application?.nextRoundStatus || "");
  const currentMatchId = String(application?.currentProposal?.matchId || "");

  // 이전 버전에서 만남 종료 후 matchingStatus만 completed로 남은 데이터도
  // 다음 회차 준비 상태라면 고객 화면에서는 매칭 대기로 표시한다.
  if (!currentMatchId && ["ready", "queued"].includes(nextRoundStatus)) {
    return "매칭 대기";
  }

  const labels = {
    not_ready: "매칭 준비 전",
    not_started: "매칭 대기",
    proposed: "후보 제안 도착",
    accepted: "응답 완료",
    declined: "응답 완료",
    confirmed: "만남 확정",
    completed: "만남 완료",
    cancelled: "취소",
    failed: "매칭 실패",
    paused: "운영자 검토",
    admin_review: "운영자 검토",
    ready: "매칭 준비 완료",
    mutualAccepted: "양쪽 수락",
    feedback_requested: "피드백 요청",
  };

  return labels[status] || "상태 확인 중";
}

function getResponseLabel(value = "") {
  const labels = {
    accepted: "만남 진행 의사 전달",
    declined: "이번 만남 보류",
    pending: "응답 대기",
    confirmed: "확정",
    no_response: "무응답",
    proposal_expired: "제안 종료",
  };

  return labels[value] || "응답 전";
}

function isFinalProposalResponse(value = "") {
  return ["accepted", "declined"].includes(String(value || ""));
}

function getStatusTone(type, value) {
  const status = String(value || "");

  if (type === "application") {
    if (["cancelled", "withdrawn", "rejected"].includes(status)) return "bad";
    return "blue";
  }

  if (type === "review") {
    if (status === "approved") return "good";
    if (status === "rejected") return "bad";
    return "warn";
  }

  if (type === "deposit") {
    if (status === "confirmed") return "good";
    if (status === "refund_requested") return "warn";
    if (status === "refunded") return "neutral";
    return "warn";
  }

  if (type === "matching") {
    if (status === "proposed") return "orange";
    if (["confirmed", "completed"].includes(status)) return "good";
    if (["failed", "cancelled"].includes(status)) return "bad";
    return "neutral";
  }

  return "neutral";
}

function formatPhone(value = "") {
  const digits = String(value || "").replace(/[^0-9]/g, "");

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  return value || "-";
}

function formatDateTime(value) {
  if (!value) return "-";

  let date = null;

  if (typeof value?.toDate === "function") {
    date = value.toDate();
  } else if (typeof value?.seconds === "number") {
    date = new Date(value.seconds * 1000);
  } else if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) date = new Date(parsed);
  }

  if (!date) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getPhotoPreviewUrl(photo = {}) {
  return photo?.securePreviewUrl || photo?.blurredUrl || photo?.previewUrl || photo?.thumbnailUrl || "";
}

function getPhotos(application = {}) {
  const identity = getIdentity(application);
  const photos = [];

  if (identity.representativePhoto?.url || getPhotoPreviewUrl(identity.representativePhoto)) {
    photos.push({
      label: "대표",
      url: identity.representativePhoto?.url || "",
      previewUrl: getPhotoPreviewUrl(identity.representativePhoto),
      originalRedacted: identity.representativePhoto?.originalRedacted === true,
      securePreviewMissing: identity.representativePhoto?.securePreviewMissing === true,
    });
  }

  normalizeArray(identity.additionalPhotos).forEach((photo, index) => {
    if (photo?.url || getPhotoPreviewUrl(photo)) {
      photos.push({
        label: `Sub ${index + 1}`,
        url: photo?.url || "",
        previewUrl: getPhotoPreviewUrl(photo),
        originalRedacted: photo?.originalRedacted === true,
        securePreviewMissing: photo?.securePreviewMissing === true,
      });
    }
  });

  return photos.slice(0, 5);
}

function isProfileEditable(application = {}) {
  const status = String(application?.status || "");
  const matchingStatus = String(application?.matchingStatus || "");
  const scheduleStatus = String(application?.scheduleStatus || application?.meetingStatus || "");
  const proposalStatus = String(application?.currentProposal?.status || "");

  if (["cancelled", "withdrawn", "rejected"].includes(status)) return false;
  // Never unlock profile editing while an active proposal or meeting is in progress.
  // The Cloud Function performs the final authoritative active-match check.
  if (["proposed", "accepted", "mutualAccepted", "confirmed"].includes(matchingStatus)) return false;
  if (["ready", "needs_first_choice", "waiting_counterpart", "needs_final_choice", "place_pending", "confirmed"].includes(scheduleStatus) && application?.currentProposal?.matchId) return false;
  if (["proposed", "accepted", "mutualAccepted", "confirmed"].includes(proposalStatus)) return false;

  return true;
}

function Row({ label, value, large = false }) {
  return (
    <div className="grid grid-cols-[64px_1fr] items-center gap-2 border-solid border-t border-[#edf0f3] py-3 first:border-t-0 sm:grid-cols-[110px_1fr]">
      <div className="text-[13px] font-semibold leading-5 text-[#65676b]">{label}</div>
      <div
        className={cx(
          "break-keep font-semibold tracking-[-0.015em] text-[#1c1e21]",
          large ? "text-[13px] leading-7 sm:text-[13px]" : "text-[13px] leading-6 sm:text-[13px]"
        )}
      >
        {value || "-"}
      </div>
    </div>
  );
}

function MatchingSignalRow({ number, label, value, detail = "", large = false, wide = false }) {
  return (
    <div
      className={cx(
        "rounded-xl border border-solid border-[#e4e8ed] bg-[#f8f9fb] p-3.5",
        wide ? "sm:col-span-2" : ""
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#1c1e21] px-1 text-[12px] font-bold text-white">
          {number}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold leading-5 text-[#65676b]">{label}</div>
          <div
            className={cx(
              "mt-1 break-keep font-semibold tracking-[-0.015em] text-[#1c1e21]",
              large ? "whitespace-pre-wrap text-[15px] leading-7" : "text-[14px] leading-6 sm:text-[15px]"
            )}
          >
            {value || "미입력"}
          </div>
          {detail ? (
            <div className="mt-1.5 break-keep rounded-lg bg-white px-2.5 py-2 text-[11px] font-semibold leading-5 text-[#65676b]">
              {detail}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}


function MapLinkButton({ href }) {
  if (!href) return "-";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-full items-center justify-center rounded-lg border-solid border border-[#dfe3e8] bg-white px-3 py-2 text-[13px] font-bold text-[#1877f2] transition hover:bg-blue-50"
    >
      네이버지도 보기
    </a>
  );
}


function StatusBox({ label, value, tone = "neutral" }) {
  const toneClass = {
    neutral: "border-solid border-[#dfe3e8] bg-white text-[#1c1e21]",
    blue: "border-solid border-blue-100 bg-blue-50 text-blue-800",
    good: "border-solid border-emerald-100 bg-emerald-50 text-emerald-800",
    warn: "border-solid border-amber-100 bg-amber-50 text-amber-800",
    orange: "border-solid border-orange-100 bg-orange-50 text-orange-800",
    bad: "border-solid border-rose-100 bg-rose-50 text-rose-800",
  }[tone] || "border-solid border-[#dfe3e8] bg-white text-[#1c1e21]";

  return (
    <div className={cx("rounded-xl border p-4", toneClass)}>
      <div className="text-[12px] font-semibold text-[#65676b]">{label}</div>
      <div className="mt-1 break-keep text-[17px] font-bold tracking-[-0.03em]">
        {value || "-"}
      </div>
    </div>
  );
}

function SectionCard({ eyebrow, title, action, children }) {
  return (
    <section className="rounded-[20px] border border-[#e5ebf4] bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow ? (
            <div className="sr-only">
              {eyebrow}
            </div>
          ) : null}
          <h2 className="text-[18px] font-extrabold tracking-[-0.025em] text-[#172f4c] sm:text-[20px]">
            {title}
          </h2>
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ProfilePhotoImage({ photo, alt, className = "", spinnerSize = "md" }) {
  const url = photo?.url || "";
  const imageRef = useRef(null);
  const [loadState, setLoadState] = useState(url ? "loading" : "empty");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setRetryCount(0);
    setLoadState(url ? "loading" : "empty");
  }, [url]);

  useEffect(() => {
    if (!url) return;

    const image = imageRef.current;
    if (image?.complete) {
      setLoadState(image.naturalWidth > 0 ? "loaded" : "error");
    }
  }, [url, retryCount]);

  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#f0f2f5] text-sm font-semibold text-[#65676b]">
        사진 확인 중
      </div>
    );
  }

  const src = retryCount ? `${url}${url.includes("?") ? "&" : "?"}tw_retry=${retryCount}` : url;
  const failed = loadState === "error";
  const loaded = loadState === "loaded";

  return (
    <>
      {!loaded ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#f0f2f5]/85 px-3 text-center">
          {failed ? (
            <>
              <div className="text-[12px] font-bold leading-5 text-[#65676b]">
                사진을 불러오지 못했습니다.
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setLoadState("loading");
                  setRetryCount((prev) => prev + 1);
                }}
                className="mt-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-[#1877f2] shadow-sm"
              >
                다시 불러오기
              </button>
            </>
          ) : (
            <LoadingSpinner size={spinnerSize} tone="blue" />
          )}
        </div>
      ) : null}

      <img
        ref={imageRef}
        src={src}
        alt={alt}
        loading="eager"
        decoding="async"
        onLoad={() => setLoadState("loaded")}
        onError={() => setLoadState("error")}
        className={cx(
          className,
          "transition-opacity duration-200",
          failed ? "opacity-20" : "opacity-100"
        )}
      />
    </>
  );
}

function PhotoStrip({ photos = [], compact = false }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const rawPhotos = Array.isArray(photos)
    ? photos.filter((photo) => photo?.url || photo?.previewUrl || photo?.securePreviewMissing)
    : [];
  const safePhotos = rawPhotos.map((photo) => ({
    ...photo,
    displayUrl: photo.url || photo.previewUrl || "",
    url: photo.url || photo.previewUrl || "",
  }));
  const photoKey = safePhotos.map((photo) => photo.displayUrl || photo.url || photo.label).join("|");

  useEffect(() => {
    setSelectedIndex(0);
  }, [photoKey]);

  if (!safePhotos.length) {
    return (
      <div
        className={cx(
          "flex flex-col items-center justify-center rounded-xl border border-[#dfe3e8] bg-[#f0f2f5] text-sm font-semibold text-[#65676b]",
          compact ? "min-h-[180px]" : "min-h-[260px]"
        )}
      >
        <LoadingSpinner size="md" tone="blue" />
        <div className="mt-3">사진 확인 중</div>
      </div>
    );
  }

  const selectedPhoto = safePhotos[selectedIndex] || safePhotos[0];

  return (
    <div className={cx("w-full", compact ? "max-w-[320px]" : "max-w-[420px]")}>
      <div className="overflow-hidden rounded-xl border border-[#dfe3e8] bg-[#f0f2f5]">
        <div className="relative aspect-[4/5]">
          <ProfilePhotoImage
            photo={selectedPhoto}
            alt={selectedPhoto.label || "프로필 사진"}
            spinnerSize="md"
            className="h-full w-full object-cover"
          />
          <div className="absolute left-3 top-3 z-20 rounded-md bg-black/65 px-2.5 py-1 text-[11px] font-bold text-white">
            {selectedPhoto.label || "사진"}
          </div>
        </div>
      </div>

      {safePhotos.length > 1 ? (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {safePhotos.map((photo, index) => {
            const active = index === selectedIndex;

            return (
              <button
                key={`${photo.url}_${index}`}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={cx(
                  "overflow-hidden rounded-lg border bg-[#f0f2f5] transition",
                  active
                    ? "border-[#1877f2] ring-2 ring-[#1877f2]/20"
                    : "border-[#dfe3e8] hover:border-[#1877f2]/60"
                )}
                aria-label={`${photo.label || `사진 ${index + 1}`} 보기`}
              >
                <div className="relative aspect-[4/5]">
                  <ProfilePhotoImage
                    photo={photo}
                    alt={photo.label || `프로필 사진 ${index + 1}`}
                    spinnerSize="sm"
                    className="h-full w-full object-cover"
                  />
                  <div
                    className={cx(
                      "absolute inset-x-0 bottom-0 z-20 px-1 py-1 text-center text-[10px] font-bold text-white",
                      active ? "bg-[#1877f2]" : "bg-black/45"
                    )}
                  >
                    {index + 1}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

    </div>
  );
}


const MANAGED_AREAS = ["강남구", "서초구", "동작구", "관악구", "영등포구"];

const CAFE_POOLS = {
  강남구: [
    {
      id: "gangnam_alver",
      name: "알베르 강남역",
      station: "신논현/강남",
      ratingLabel: "영업 확인 후보",
      reason: "강남역권 대형 카페 · 접근성 좋음",
      mapQuery: "알베르 강남역",
    },
    {
      id: "gangnam_upper_under",
      name: "어퍼앤언더 강남역",
      station: "강남/신논현",
      ratingLabel: "영업 확인 후보",
      reason: "디저트 카페 · 데이트/대화 무드",
      mapQuery: "어퍼앤언더 강남역",
    },
    {
      id: "gangnam_selected_nix",
      name: "셀렉티드 닉스 강남역",
      station: "강남역",
      ratingLabel: "영업 확인 후보",
      reason: "강남 시내뷰 · 분위기형 카페",
      mapQuery: "셀렉티드 닉스 강남역",
    },
  ],
  서초구: [
    {
      id: "seocho_apenz",
      name: "아펜즈커피 서초교대점",
      station: "교대",
      ratingLabel: "영업 확인 후보",
      reason: "1,2층 넓은 공간 · 교대역 접근성",
      mapQuery: "아펜즈커피 서초교대점",
    },
    {
      id: "seocho_beanbrothers",
      name: "빈브라더스 파미에스테이션",
      station: "고속터미널",
      ratingLabel: "영업 확인 후보",
      reason: "파미에스테이션 내 접근성 · 좌석 안정",
      mapQuery: "빈브라더스 파미에스테이션",
    },
    {
      id: "seocho_starbucks_famiepark",
      name: "스타벅스 파미에파크R점",
      station: "고속터미널",
      ratingLabel: "영업 확인 후보",
      reason: "상징성 있는 대형 매장 · 위치 찾기 쉬움",
      mapQuery: "스타벅스 파미에파크R점",
    },
  ],
  동작구: [
    {
      id: "dongjak_nakta",
      name: "낙타날다",
      station: "사당",
      ratingLabel: "영업 확인 후보",
      reason: "사당역권 카페 · 모임/대화 후보",
      mapQuery: "낙타날다 사당",
    },
    {
      id: "dongjak_largo",
      name: "카페 라르고",
      station: "사당",
      ratingLabel: "영업 확인 후보",
      reason: "1,2층 카페 · 조용한 대화 후보",
      mapQuery: "카페 라르고 사당",
    },
    {
      id: "dongjak_starbucks_isu13",
      name: "스타벅스 이수역13번출구점",
      station: "이수",
      ratingLabel: "영업 확인 후보",
      reason: "이수역 접근성 · 위치 설명 쉬움",
      mapQuery: "스타벅스 이수역13번출구점",
    },
  ],
  관악구: [
    {
      id: "gwanak_timhortons_snu",
      name: "팀홀튼 서울대입구역점",
      station: "서울대입구",
      ratingLabel: "영업 확인 후보",
      reason: "공간 넓은 편 · 서울대입구역 접근성",
      mapQuery: "팀홀튼 서울대입구역점",
    },
    {
      id: "gwanak_starbucks_snu8",
      name: "스타벅스 서울대입구역8번출구점",
      station: "서울대입구",
      ratingLabel: "영업 확인 후보",
      reason: "넓은 매장 후보 · 위치 찾기 쉬움",
      mapQuery: "스타벅스 서울대입구역8번출구점",
    },
    {
      id: "gwanak_butterrum",
      name: "카페 버터럼 서울대입구역",
      station: "서울대입구",
      ratingLabel: "영업 확인 후보",
      reason: "데이트 무드 · 디저트/카이막 후보",
      mapQuery: "카페 버터럼 서울대입구역",
    },
  ],
  영등포구: [
    {
      id: "yeongdeungpo_teddybeurre",
      name: "테디뵈르하우스 더현대서울점",
      station: "여의도",
      ratingLabel: "영업 확인 후보",
      reason: "더현대서울 내 위치 · 찾기 쉬움",
      mapQuery: "테디뵈르하우스 더현대서울점",
    },
    {
      id: "yeongdeungpo_keepthat",
      name: "킵댓 여의도점",
      station: "여의도",
      ratingLabel: "영업 확인 후보",
      reason: "여의도 로스터리 카페 · 데이트 후보",
      mapQuery: "킵댓 여의도점",
    },
    {
      id: "yeongdeungpo_coffeebean_hyundai",
      name: "커피빈 현대자동차여의도점",
      station: "여의도",
      ratingLabel: "영업 확인 후보",
      reason: "체인형 안정성 · 여의도 접근성",
      mapQuery: "커피빈 현대자동차여의도점",
    },
  ],
};

function pad2(value) {
  return String(value).padStart(2, "0");
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatKoreanDateLabel(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function makeScheduleOption(baseDate, dayOffset, hour, minute, timeSlotKey, timeLabel) {
  const start = addDays(baseDate, dayOffset);
  start.setHours(hour, minute, 0, 0);

  const dateKey = formatDateKey(start);

  return {
    id: `${dateKey}_${timeSlotKey}`,
    dateKey,
    dateLabel: formatKoreanDateLabel(start),
    dayLabel: formatKoreanDateLabel(start),
    timeSlotKey,
    slotLabel: getTimeSlotLabelByKey(timeSlotKey),
    timeLabel,
    startAtClient: start.toISOString(),
  };
}

function buildAutoScheduleOptions(now = new Date()) {
  const day = now.getDay();
  const shouldUseNextWeekend = [0, 5, 6].includes(day);
  const daysUntilFriday = (5 - day + 7) % 7;
  const friday = addDays(now, daysUntilFriday + (shouldUseNextWeekend ? 7 : 0));
  friday.setHours(0, 0, 0, 0);

  return [
    makeScheduleOption(friday, 0, 19, 30, "friday_evening", "19:30"),
    makeScheduleOption(friday, 1, 14, 0, "saturday_afternoon", "14:00"),
    makeScheduleOption(friday, 1, 19, 0, "saturday_evening", "19:00"),
    makeScheduleOption(friday, 2, 14, 0, "sunday_afternoon", "14:00"),
    makeScheduleOption(friday, 2, 19, 0, "sunday_evening", "19:00"),
  ];
}

function getScheduleFromMatch(bestMatch = {}) {
  return bestMatch?.match?.schedule || bestMatch?.schedule || {};
}

function getScheduleStatus(bestMatch = {}) {
  return (
    bestMatch?.match?.scheduleStatus ||
    bestMatch?.match?.schedule?.status ||
    bestMatch?.schedule?.status ||
    ""
  );
}

const SCHEDULE_OPEN_STATUSES = [
  "ready",
  "needs_first_choice",
  "waiting_counterpart",
  "needs_final_choice",
  "place_pending",
  "confirmed",
];

function isScheduleOpen(bestMatch = {}) {
  const schedule = getScheduleFromMatch(bestMatch);
  const status = getScheduleStatus(bestMatch);
  const matchStatus = String(bestMatch?.match?.status || bestMatch?.status || "");
  const proposal = bestMatch?.viewerApplication?.currentProposal || bestMatch?.currentProposal || {};
  const proposalResponse = String(proposal?.response || "");
  const candidateResponse = String(bestMatch?.candidateApplication?.currentProposal?.response || "");
  const finalMeeting = bestMatch?.finalMeeting || bestMatch?.match?.finalMeeting || schedule?.finalMeeting || null;
  const photoRevealStatus =
    bestMatch?.match?.photoRevealStatus ||
    bestMatch?.viewerApplication?.photoRevealStatus ||
    bestMatch?.viewerApplication?.currentProposal?.photoRevealStatus ||
    "";

  const hasScheduleData =
    Boolean(schedule?.firstSelectorApplicationId) ||
    Boolean(schedule?.counterpartApplicationId) ||
    normalizeArray(schedule?.timeChoices).length > 0 ||
    normalizeArray(schedule?.placeChoices).length > 0 ||
    Boolean(schedule?.finalChoice) ||
    Boolean(schedule?.finalMeeting) ||
    Boolean(finalMeeting);

  const confirmedLike =
    status === "confirmed" ||
    matchStatus === "confirmed" ||
    Boolean(finalMeeting) ||
    photoRevealStatus === "revealed";

  const mutualAcceptedLike =
    bestMatch?.bothAccepted === true ||
    matchStatus === "mutualAccepted" ||
    matchStatus === "confirmed" ||
    proposalResponse === "accepted" ||
    candidateResponse === "accepted" ||
    hasScheduleData ||
    confirmedLike;

  return SCHEDULE_OPEN_STATUSES.includes(status) && (mutualAcceptedLike || confirmedLike);
}


function isScheduleActionRequiredForMe(application = {}, bestMatch = {}) {
  if (!isScheduleOpen(bestMatch)) return false;

  const schedule = getScheduleFromMatch(bestMatch);
  const status = getScheduleStatus(bestMatch);
  const timeChoices = getTimeChoicesFromSchedule(schedule);
  const placeChoices = getPlaceChoicesFromSchedule(schedule);

  if (["ready", "needs_first_choice"].includes(status) && (!timeChoices.length || !placeChoices.length)) {
    return true;
  }

  if (["waiting_counterpart", "needs_final_choice"].includes(status)) {
    return schedule.firstSelectorApplicationId !== application?.id;
  }

  return false;
}

function getAvailableAreas(application = {}, candidate = {}) {
  const myAreas = normalizeArray(getBasic(application).activityAreas);
  const candidateAreas = normalizeArray(getBasic(candidate).activityAreas);
  const overlap = myAreas.filter((area) => candidateAreas.includes(area));

  return Array.from(
    new Set([
      ...overlap,
      getBasic(application).preferredArea,
      getBasic(candidate).preferredArea,
      ...myAreas,
      ...candidateAreas,
      ...MANAGED_AREAS,
    ].filter(Boolean))
  ).slice(0, 8);
}

function normalizeManagedCafe(cafe = {}) {
  const cafeId = cafe.id || cafe.cafeId || cafe.placeId || "";
  const name = cafe.name || cafe.cafeName || "";

  return {
    id: cafeId,
    cafeId,
    name,
    station: cafe.station || cafe.cafeStation || "",
    ratingLabel: cafe.ratingLabel || cafe.cafeRatingLabel || cafe.verificationStatusLabel || "운영자 확인 후보",
    reason: cafe.reason || cafe.cafeReason || "",
    mapQuery: cafe.mapQuery || cafe.cafeMapQuery || name,
    mapUrl: cafe.mapUrl || cafe.cafeMapUrl || "",
    status: cafe.status || "active",
  };
}

function getCafeOptions(area = "", cafeCandidates = []) {
  const managed = normalizeArray(cafeCandidates)
    .filter((cafe) => cafe?.status === "active" && cafe?.area === area)
    .map(normalizeManagedCafe)
    .filter((cafe) => cafe.id && cafe.name);

  if (managed.length) return managed;

  return CAFE_POOLS[area] || CAFE_POOLS[MANAGED_AREAS[0]] || [];
}

function getCafeById(area = "", cafeId = "", cafeCandidates = []) {
  const cafes = getCafeOptions(area, cafeCandidates);
  return cafes.find((cafe) => cafe.id === cafeId) || cafes[0] || null;
}

function getCafeMapUrl(cafe = {}) {
  if (cafe?.mapUrl) return cafe.mapUrl;
  if (!cafe?.mapQuery) return "";
  return `https://map.naver.com/p/search/${encodeURIComponent(cafe.mapQuery)}`;
}

function buildCafeSnapshot(cafe = {}, area = "") {
  if (!cafe?.id) return {};

  return {
    id: cafe.id,
    placeId: cafe.id,
    area: area || cafe.area || "",
    cafeId: cafe.id,
    cafeName: cafe.name,
    cafeStation: cafe.station,
    cafeRatingLabel: cafe.ratingLabel,
    cafeReason: cafe.reason,
    cafeMapQuery: cafe.mapQuery,
    cafeMapUrl: getCafeMapUrl(cafe),
  };
}

function getTimeChoicesFromSchedule(schedule = {}) {
  if (Array.isArray(schedule.timeChoices)) return schedule.timeChoices;
  if (Array.isArray(schedule.firstChoices)) return schedule.firstChoices;
  return [];
}

function getPlaceChoicesFromSchedule(schedule = {}) {
  if (Array.isArray(schedule.placeChoices)) return schedule.placeChoices;
  const firstChoices = Array.isArray(schedule.firstChoices) ? schedule.firstChoices : [];
  return firstChoices
    .filter((choice) => choice?.cafeId || choice?.cafeName || choice?.placeId)
    .map((choice) => ({
      id: choice.placeId || choice.cafeId || choice.id,
      placeId: choice.placeId || choice.cafeId || choice.id,
      area: choice.area || "",
      cafeId: choice.cafeId || choice.placeId || "",
      cafeName: choice.cafeName || "",
      cafeStation: choice.cafeStation || "",
      cafeRatingLabel: choice.cafeRatingLabel || "",
      cafeReason: choice.cafeReason || "",
      cafeMapQuery: choice.cafeMapQuery || "",
      cafeMapUrl: choice.cafeMapUrl || "",
    }));
}

function formatTimeChoice(choice = {}) {
  const slotLabel = choice.slotLabel || getTimeSlotLabelByKey(choice.timeSlotKey);
  const timeText = [slotLabel, choice.timeLabel].filter(Boolean).join(" ");
  return [choice.dateLabel, timeText].filter(Boolean).join(" · ") || "-";
}

function formatPlaceChoice(choice = {}) {
  return [choice.area, choice.cafeName].filter(Boolean).join(" · ") || "-";
}

function formatScheduleChoice(choice = {}) {
  if (choice?.timeChoice || choice?.placeChoice) {
    return [formatTimeChoice(choice.timeChoice), formatPlaceChoice(choice.placeChoice)]
      .filter((value) => value && value !== "-")
      .join(" / ") || "-";
  }

  if (choice?.finalTimeChoice || choice?.finalPlaceChoice) {
    return [formatTimeChoice(choice.finalTimeChoice), formatPlaceChoice(choice.finalPlaceChoice)]
      .filter((value) => value && value !== "-")
      .join(" / ") || "-";
  }

  return [choice.dateLabel, choice.timeLabel, choice.area, choice.cafeName].filter(Boolean).join(" · ") || "-";
}

function CafeSelectGrid({ area, selectedCafeIds = [], onToggle, maxCount = 3, cafeCandidates = [] }) {
  const cafes = getCafeOptions(area, cafeCandidates);
  const selectedIds = Array.isArray(selectedCafeIds) ? selectedCafeIds : [];

  if (!cafes.length) return null;

  return (
    <div className="mt-5 rounded-md border-solid border border-[#dfe3e8] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[17px] font-bold tracking-[-0.04em] text-[#1c1e21]">3. 장소 후보 3개 선택</div>
          <p className="mt-1 break-keep text-[13px] font-semibold leading-5 text-[#65676b]">
            구를 바꿔가며 카페 후보를 총 3개까지 선택할 수 있습니다. (상대방 거주지역도 고려하여 선택해주세요.)
          </p>
        </div>
        <span className="rounded-full bg-[#f0f2f5] px-3 py-1 text-[11px] font-bold text-[#65676b]">
          {selectedIds.length}/{maxCount} 선택
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {cafes.map((cafe) => {
          const active = selectedIds.includes(cafe.id);
          const disabled = !active && selectedIds.length >= maxCount;
          const mapUrl = getCafeMapUrl(cafe);

          return (
            <div
              key={cafe.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (!disabled) onToggle?.(cafe, area);
              }}
              onKeyDown={(event) => {
                if ((event.key === "Enter" || event.key === " ") && !disabled) {
                  event.preventDefault();
                  onToggle?.(cafe, area);
                }
              }}
              className={cx(
                "group rounded-md border-solid border p-4 text-left transition",
                disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer hover:-translate-y-0.5 hover:shadow-md",
                active
                  ? "border-[#1877f2] bg-blue-50 shadow-sm ring-2 ring-[#1877f2]/15"
                  : "border-[#dfe3e8] bg-white hover:border-[#1877f2]/40"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[16px] font-bold leading-6 tracking-[-0.035em] text-[#1c1e21]">
                    {cafe.name}
                  </div>
                  <div className="mt-1 text-[12px] font-bold text-[#65676b]">{area} · {cafe.station}</div>
                </div>
                <span
                  className={cx(
                    "shrink-0 rounded-full px-2 py-1 text-[10px] font-bold",
                    active ? "bg-[#1877f2] text-white" : "bg-[#f0f2f5] text-[#65676b]"
                  )}
                >
                  {active ? "선택됨" : "선택"}
                </span>
              </div>

              <div className="mt-3 inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-600">
                {cafe.ratingLabel}
              </div>
              <div className="mt-2 min-h-[40px] text-[12px] font-semibold leading-5 text-[#65676b]">
                {cafe.reason}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!disabled) onToggle?.(cafe, area);
                  }}
                  className={cx(
                    "h-10 rounded-lg border-solid border px-3 text-[12px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
                    active
                      ? "border-[#1877f2] bg-[#1877f2] text-white"
                      : "border-[#dfe3e8] bg-white text-[#1c1e21] hover:bg-[#f0f2f5]"
                  )}
                >
                  {active ? "선택 해제" : "장소 선택"}
                </button>
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="flex h-10 items-center justify-center rounded-lg border-solid border border-[#dfe3e8] bg-white px-3 text-center text-[12px] font-bold text-[#1c1e21] transition hover:bg-[#f0f2f5]"
                >
                  네이버지도
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDueDate(value) {
  const text = formatDateTime(value);
  return text === "-" ? "2일 내" : text;
}


function getTimeMs(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function getSeoulDateKey(value) {
  const ms = getTimeMs(value);
  if (!ms) return "";

  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(ms));
  } catch {
    return "";
  }
}

function useNowMs(intervalMs = 1000) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return nowMs;
}

function formatRemainingTime(ms) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}일 ${hours}시간`;
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  if (minutes > 0) return `${minutes}분 ${seconds}초`;
  return `${seconds}초`;
}

function CountdownBadge({ dueAt, label = "남은 시간" }) {
  const nowMs = useNowMs(1000);
  const dueMs = getTimeMs(dueAt);

  if (!dueMs) return null;

  const remainingMs = dueMs - nowMs;
  const expired = remainingMs <= 0;

  return (
    <div
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-bold",
        expired ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700"
      )}
    >
      {label}: {expired ? "기한 종료" : formatRemainingTime(remainingMs)}
    </div>
  );
}

function isDueExpired(dueAt, nowMs = Date.now()) {
  const dueMs = getTimeMs(dueAt);
  return Boolean(dueMs && dueMs <= nowMs);
}

function getProposalDueAt(application = {}, bestMatch = {}) {
  return (
    application?.currentProposal?.responseDueAtClient ||
    bestMatch?.match?.responseDueAtClient ||
    bestMatch?.viewerResponse?.responseDueAtClient ||
    ""
  );
}

function getScheduleDueAtByStatus(schedule = {}, status = "") {
  if (status === "waiting_counterpart" || status === "needs_final_choice") {
    return schedule.counterpartDueAtClient || schedule.dueAtClient || "";
  }

  if (status === "place_pending") {
    return schedule.placeConfirmDueAtClient || "";
  }

  if (status === "confirmed") return "";

  return schedule.dueAtClient || schedule.counterpartDueAtClient || "";
}

const TAB_LOADING_MESSAGES = {
  candidate: {
    title: "대상 후보를 불러오는 중입니다",
    desc: "후보 프로필과 응답 상태를 확인하고 있습니다.",
  },
  schedule: {
    title: "일정조율 정보를 불러오는 중입니다",
    desc: "확정된 일정, 장소 후보, 참석 상태를 확인하고 있습니다.",
  },
  status: {
    title: "신청현황을 불러오는 중입니다",
    desc: "승인과 매칭 진행 상태를 확인하고 있습니다.",
  },
  deposit: {
    title: "예치금 정보를 불러오는 중입니다",
    desc: "잔액과 입금·차감·반환 내역을 확인하고 있습니다.",
  },
  profile: {
    title: "프로필 정보를 불러오는 중입니다",
    desc: "등록한 사진과 기본 정보를 준비하고 있습니다.",
  },
  result: {
    title: "결과 정보를 불러오는 중입니다",
    desc: "만남 후 피드백과 매칭 재개 상태를 확인하고 있습니다.",
  },
};

function DashboardLoadingPanel({
  title = "신청현황을 불러오는 중입니다",
  desc = "잠시만 기다려주세요.",
}) {
  return (
    <div
      className="mt-4 rounded-md border-solid border border-[#dfe3e8] bg-white p-6 text-center shadow-sm sm:mt-5 sm:p-8"
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size="lg" tone="blue" className="mx-auto" />
      <div className="mt-5 text-[20px] font-bold tracking-[-0.04em] text-[#1c1e21]">
        {title}
      </div>
      <p className="mt-2 break-keep text-[14px] font-semibold leading-6 text-[#65676b]">
        {desc}
      </p>

      <div className="mx-auto mt-6 grid max-w-xl gap-3 text-left">
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-[#f0f2f5]" />
        <div className="h-4 w-full animate-pulse rounded-full bg-[#f0f2f5]" />
        <div className="h-4 w-5/6 animate-pulse rounded-full bg-[#f0f2f5]" />
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="h-14 animate-pulse rounded-xl bg-[#f0f2f5]" />
          <div className="h-14 animate-pulse rounded-xl bg-[#f0f2f5]" />
          <div className="h-14 animate-pulse rounded-xl bg-[#f0f2f5]" />
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { id: "candidate", label: "대상후보" },
  { id: "schedule", label: "일정조율" },
  { id: "status", label: "신청현황" },
  { id: "deposit", label: "예치금" },
  { id: "profile", label: "내 프로필" },
  { id: "result", label: "결과보기" },
  { id: "invite", label: "친구초대" },
];

function TabNav({ activeTab, onChange, tabMeta = {} }) {
  const nowMs = useNowMs(1000);

  return (
    <div className="sticky top-0 z-40 -mx-2 mt-4 border-solid border-y border-[#dfe3e8] bg-[#f0f2f5]/95 px-2 py-2 backdrop-blur sm:mx-0 sm:px-0">
      <div className="overflow-x-auto">
        <div className="mb-4 flex min-w-max gap-1 rounded-xl border-solid border border-[#dfe3e8] bg-white p-1 shadow-sm">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const meta = tabMeta[tab.id] || {};
            const dueMs = getTimeMs(meta.dueAt);
            const expired = Boolean(dueMs && dueMs <= nowMs);
            const remainingText = dueMs ? (expired ? "기한종료" : formatRemainingTime(dueMs - nowMs)) : "";
            const badge = expired ? "기한종료" : meta.badge;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                className={cx(
                  "relative min-h-10 rounded-lg px-4 py-2 text-left text-[14px] font-semibold transition sm:px-5",
                  active
                    ? "bg-[#1877f2] text-white"
                    : meta.urgent
                    ? "text-[#1c1e21] ring-1 ring-inset ring-[#1877f2]/25 hover:bg-blue-50"
                    : "text-[#65676b] hover:bg-[#f0f2f5] hover:text-[#1c1e21]"
                )}
              >
                <span className="flex items-center gap-2">
                  {meta.urgent && !active ? (
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#1877f2]"
                    />
                  ) : null}
                  {tab.label}
                  {badge ? (
                    <span
                      className={cx(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        active
                          ? "bg-white/20 text-white"
                          : expired
                          ? "bg-rose-50 text-rose-700"
                          : "bg-[#1877f2] text-white"
                      )}
                    >
                      {badge}
                    </span>
                  ) : null}
                </span>
                {remainingText ? (
                  <span className={cx("mt-0.5 block text-[11px] font-bold", active ? "text-white/80" : "text-[#1877f2]")}>
                    {remainingText}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ResponseConfirmModal({ type, onClose, onConfirm, saving }) {
  const [declineReasonCode, setDeclineReasonCode] = useState("");
  const [declineReasonText, setDeclineReasonText] = useState("");
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    if (!type) {
      setDeclineReasonCode("");
      setDeclineReasonText("");
      setValidationMessage("");
    }
  }, [type]);

  if (!type) return null;

  const isAccept = type === "accepted";
  const normalizedReason = normalizeTwoWeeksDeclineReason({
    code: declineReasonCode,
    text: declineReasonText,
  });

  const handleConfirm = () => {
    if (isAccept) {
      onConfirm(type, null);
      return;
    }

    if (!normalizedReason.valid) {
      setValidationMessage(normalizedReason.message);
      return;
    }

    onConfirm(type, {
      code: normalizedReason.code,
      label: normalizedReason.label,
      text: normalizedReason.text,
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[calc(100svh-48px)] w-full max-w-[520px] overflow-y-auto rounded-md bg-white p-5 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
        <div className="text-2xl font-bold tracking-[-0.04em] text-[#1c1e21]">
          {isAccept ? "이 만남을 진행할까요?" : "이번 만남을 쉬어갈까요?"}
        </div>

        {isAccept ? (
          <div className="mt-3 space-y-1 text-[14px] font-medium leading-6 text-[#65676b]">
            <p>진행 의사를 보내면 운영자가 상대 응답과 가능 일정을 확인합니다.</p>
            <p>이후 카페 장소, 시간 조율, 만남 전 안내가 순서대로 전달됩니다.</p>
            <p>연락처는 만남 후 서로 연결을 희망할 때 공개됩니다.</p>
          </div>
        ) : (
          <>
            <div className="mt-3 space-y-2 text-[14px] font-medium leading-6 text-[#65676b]">
              <p>서비스 개선을 위해 가장 가까운 사유를 한 가지 선택해주세요.</p>
              <p>선택한 사유와 작성 내용은 운영자만 확인하며 상대에게 공개되지 않습니다.</p>
            </div>

            <div className="mt-4 grid gap-2" role="radiogroup" aria-label="만남 거절 사유">
              {TWOWEEKS_DECLINE_REASON_OPTIONS.map((option) => {
                const selected = declineReasonCode === option.code;

                return (
                  <button
                    key={option.code}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setDeclineReasonCode(option.code);
                      setValidationMessage("");
                      if (option.code !== "other") setDeclineReasonText("");
                    }}
                    disabled={saving}
                    className={cx(
                      "min-h-[48px] rounded-xl border border-solid px-4 py-3 text-left text-[14px] font-semibold leading-5 transition disabled:opacity-60",
                      selected
                        ? "border-[#1877f2] bg-blue-50 text-[#145dbf] ring-2 ring-[#1877f2]/10"
                        : "border-[#dfe3e8] bg-white text-[#1c1e21] hover:bg-[#f8f9fa]"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            {declineReasonCode === "other" ? (
              <div className="mt-3">
                <label htmlFor="twoweeks-decline-other" className="text-[13px] font-bold text-[#1c1e21]">
                  기타 사유 <span className="text-rose-600">필수</span>
                </label>
                <textarea
                  id="twoweeks-decline-other"
                  value={declineReasonText}
                  onChange={(event) => {
                    setDeclineReasonText(event.target.value.slice(0, 300));
                    setValidationMessage("");
                  }}
                  maxLength={300}
                  rows={4}
                  placeholder="운영자만 확인합니다. 개선에 참고할 수 있도록 간단히 작성해주세요."
                  disabled={saving}
                  className="mt-2 w-full rounded-xl border border-solid border-[#dfe3e8] px-4 py-3 text-[14px] font-semibold leading-6 text-[#1c1e21] outline-none transition focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/10 disabled:bg-[#f0f2f5]"
                />
                <div className="mt-1 text-right text-[11px] font-semibold text-[#65676b]">
                  {declineReasonText.length}/300
                </div>
              </div>
            ) : null}

            {validationMessage ? (
              <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[13px] font-bold text-rose-700">
                {validationMessage}
              </div>
            ) : null}

            <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[12px] font-semibold leading-5 text-amber-800">
              반복적인 패스/보류는 추후 매칭 노출이 줄어들 수 있습니다.
            </div>
          </>
        )}

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-12 rounded-lg border-solid border border-[#dfe3e8] text-[15px] font-semibold text-[#1c1e21] hover:bg-[#f0f2f5] disabled:opacity-60"
          >
            다시 볼게요
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving || (!isAccept && !normalizedReason.valid)}
            className={cx(
              "h-12 rounded-lg text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50",
              isAccept ? "bg-[#1877f2] hover:bg-[#166fe5]" : "bg-[#1c1e21] hover:bg-black"
            )}
          >
            {saving ? "처리 중..." : isAccept ? "진행 의사 보내기" : "이 사유로 보류하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusTab({ application }) {
  const basic = getBasic(application);
  const deposit = application?.deposit || {};
  const auth = application?.phoneIdentityVerification || {};
  const balance = getDepositBalance(deposit);
  const requiredBalance = getDepositRequiredBalance(deposit);

  return (
    <div className="grid gap-4">
      <SectionCard eyebrow="status" title="신청 현황">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatusBox
            label="신청 상태"
            value={getApplicationStatusLabel(application)}
            tone={getStatusTone("application", application?.status)}
          />
          <StatusBox
            label="검토 상태"
            value={getReviewStatusLabel(application)}
            tone={getStatusTone("review", application?.reviewStatus)}
          />
          <StatusBox
            label="예치금 상태"
            value={getDepositStatusLabel(application)}
            tone={getStatusTone("deposit", deposit.status)}
          />
          <StatusBox
            label="매칭 상태"
            value={getMatchingStatusLabel(application)}
            tone={getStatusTone("matching", application?.matchingStatus)}
          />
        </div>

        <div className="mt-4 rounded-xl border-solid border border-[#dfe3e8] p-4">
          <Row label="신청자" value={`${basic.nickname || basic.name || "-"} · ${getGenderLabel(basic.gender)} · ${formatAgeBirth(basic)}`} />
          <Row label="연락처" value={formatPhone(basic.phone || basic.phoneNormalized || auth.phone)} />
          <Row label="예치금" value={`${formatWon(balance)} / 기준 ${formatWon(requiredBalance)}`} />
          <Row label="회차" value={application?.roundLabel || application?.roundId || "-"} />
          <Row label="신청일" value={formatDateTime(application?.submittedAt || application?.createdAt || application?.completedAtClient)} />
        </div>
      </SectionCard>
    </div>
  );
}

function DepositTab({ application, requestingDepositRefund, onRequestDepositRefund }) {
  const deposit = application?.deposit || {};
  const basic = getBasic(application);
  const balance = getDepositBalance(deposit);
  const requiredBalance = getDepositRequiredBalance(deposit);
  const topUpRequired = getDepositTopUpRequiredAmount(deposit);
  const isTopUpRequired = deposit.status === "topup_required" || deposit.noShowResolution === "deducted_top_up_required";
  const refundRequest = deposit?.refundRequest || {};
  const refundPending = refundRequest.status === "requested" || deposit.status === "refund_requested";
  const refundCompleted = refundRequest.status === "completed" || deposit.status === "refunded";
  const [refundFormOpen, setRefundFormOpen] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const accountHolder = basic.name || "";

  const history = getDepositHistory(deposit)
    .slice()
    .sort((a, b) => String(b?.createdAtClient || "").localeCompare(String(a?.createdAtClient || "")));

  const historyTypeLabel = (item = {}) => {
    if (item.type === "deduction") return "예치금 차감";
    if (item.type === "top_up") return "추가 예치";
    if (item.type === "initial_deposit") return "최초 예치";
    if (item.type === "refund_request") return "반환 요청";
    if (item.type === "refund") return "반환 완료";
    return "예치금 변동";
  };

  const handleRefundRequest = async () => {
    const cleanBank = String(bankName || "").trim();
    const cleanAccount = String(accountNumber || "").trim();
    const cleanHolder = String(accountHolder || "").trim();

    if (!cleanBank || !cleanAccount || !cleanHolder) {
      alert("반환받을 은행, 계좌번호, 예금주를 모두 입력해주세요.");
      return;
    }

    if (!confirm(`현재 예치금 잔액 ${formatWon(balance)}의 반환을 요청할까요? 반환 요청 후 다음 매칭은 중지됩니다.`)) {
      return;
    }

    const result = await onRequestDepositRefund?.({
      bankName: cleanBank,
      accountNumber: cleanAccount,
      accountHolder: cleanHolder,
    });

    if (result) {
      setRefundFormOpen(false);
      alert("예치금 반환을 요청하였습니다. 접수 후 3일 이내 입력하신 계좌로 반환됩니다.");
    }
  };

  return (
    <div className="grid gap-4">
      <SectionCard eyebrow="deposit" title="예치금">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border-solid border border-[#dfe3e8] bg-white p-4">
            <div className="text-[12px] font-bold text-[#65676b]">현재 예치금 잔액</div>
            <div className="mt-2 text-[24px] font-bold tracking-[-0.04em] text-[#1c1e21]">{formatWon(balance)}</div>
          </div>
          <div className="rounded-md border-solid border border-[#dfe3e8] bg-white p-4">
            <div className="text-[12px] font-bold text-[#65676b]">누적 차감</div>
            <div className="mt-2 text-[24px] font-bold tracking-[-0.04em] text-rose-600">{formatWon(deposit.totalDeducted || 0)}</div>
          </div>
          <div className={cx("rounded-md border-solid border p-4", isTopUpRequired ? "border-rose-200 bg-rose-50" : deposit.status === "confirmed" ? "border-emerald-200 bg-emerald-50" : "border-[#dfe3e8] bg-white")}>
            <div className={cx("text-[12px] font-bold", isTopUpRequired ? "text-rose-600" : deposit.status === "confirmed" ? "text-emerald-700" : "text-[#65676b]")}>{isTopUpRequired ? "다음 매칭 추가 필요" : "기준 예치금"}</div>
            <div className={cx("mt-2 text-[24px] font-bold tracking-[-0.04em]", isTopUpRequired ? "text-rose-700" : "text-[#1c1e21]")}>{formatWon(isTopUpRequired ? topUpRequired : requiredBalance)}</div>
          </div>
        </div>

        {isTopUpRequired ? (
          <div className="mt-4 rounded-md border-solid border border-rose-200 bg-rose-50 p-5">
            <div className="text-[17px] font-bold text-rose-900">추가 예치 후 다음 매칭에 참여할 수 있습니다</div>
            <p className="mt-2 break-keep text-[13px] font-semibold leading-6 text-rose-800">
              현재 잔액이 기준 예치금보다 부족합니다. 부족 금액 {formatWon(topUpRequired)}의 입금 확인 전에는 다음 매칭이 진행되지 않습니다.
            </p>
            <div className="mt-4 rounded-xl bg-white px-4 py-3 text-[13px] font-bold leading-6 text-[#1c1e21]">
              {TWOWEEKS_DEPOSIT_BANK.bankName} {TWOWEEKS_DEPOSIT_BANK.accountNumber} · 예금주 {TWOWEEKS_DEPOSIT_BANK.accountHolder}
            </div>
          </div>
        ) : deposit.status === "confirmed" ? (
          <div className="mt-4 rounded-md border-solid border border-emerald-200 bg-emerald-50 p-4 text-[13px] font-bold leading-6 text-emerald-800">
            기준 예치금이 충족되어 다음 매칭 참여가 가능합니다.
          </div>
        ) : deposit.status === "pending" && deposit.requestStage === "later" ? (
          <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 p-5">
            <div className="text-[16px] font-bold text-[#234c89]">만남보증금은 추후 별도 안내드려요</div>
            <p className="mt-2 break-keep text-[13px] font-semibold leading-6 text-[#57749b]">
              지금은 입금하실 필요 없어요. 프로필 검토 후 필요한 시점에 안내해 드릴게요.
            </p>
          </div>
        ) : deposit.status === "pending" ? (
          <div className="mt-4 rounded-md border-solid border border-[#dfe3e8] bg-[#f0f2f5] p-5">
            <div className="text-[16px] font-bold text-[#1c1e21]">최초 예치금 입금 확인 전입니다</div>
            <p className="mt-2 break-keep text-[13px] font-semibold leading-6 text-[#65676b]">
              매칭 참여를 위해 예치금 {formatWon(requiredBalance)}의 입금 확인이 필요합니다.
            </p>
            <div className="mt-3 rounded-xl bg-white px-4 py-3 text-[13px] font-bold text-[#1c1e21]">
              {TWOWEEKS_DEPOSIT_BANK.bankName} {TWOWEEKS_DEPOSIT_BANK.accountNumber} · 예금주 {TWOWEEKS_DEPOSIT_BANK.accountHolder}
            </div>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard eyebrow="refund" title="예치금 반환">
        {refundPending ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-5">
            <div className="text-[18px] font-bold text-amber-900">예치금 반환을 요청하였습니다</div>
            <p className="mt-2 break-keep text-[13px] font-semibold leading-6 text-amber-800">
              접수 후 3일 이내 입력하신 계좌로 반환됩니다. 반환 완료 전까지 다음 매칭은 진행되지 않습니다.
            </p>
            <div className="mt-4 grid gap-2 rounded-xl bg-white px-4 py-3 text-[13px] font-semibold text-[#1c1e21] sm:grid-cols-2">
              <div>반환 예정액 <b>{formatWon(refundRequest.requestedAmount || balance)}</b></div>
              <div>요청일 <b>{formatDateTime(refundRequest.requestedAtClient)}</b></div>
              <div className="sm:col-span-2">반환 계좌 <b>{refundRequest.bankName ? `${refundRequest.bankName}${refundRequest.accountLast4 ? ` · 끝 ${refundRequest.accountLast4}` : ""}` : "요청 시 입력한 계좌"}</b></div>
            </div>
          </div>
        ) : refundCompleted ? (
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-5">
            <div className="text-[18px] font-bold text-[#1c1e21]">예치금 반환이 완료되었습니다</div>
            <p className="mt-2 text-[13px] font-semibold leading-6 text-[#65676b]">
              반환 완료 금액 {formatWon(refundRequest.completedAmount || deposit.lastRefundAmount || 0)} · {formatDateTime(refundRequest.completedAtClient || deposit.lastRefundedAtClient)}
            </p>
          </div>
        ) : balance > 0 ? (
          <div>
            <div className="rounded-md border border-[#dfe3e8] bg-white p-5">
              <div className="text-[17px] font-bold text-[#1c1e21]">서비스 이용을 중단하고 예치금을 돌려받을 수 있습니다</div>
              <p className="mt-2 break-keep text-[13px] font-semibold leading-6 text-[#65676b]">
                반환 요청 시 다음 매칭은 중지됩니다. 진행 중인 제안·확정 일정이나 운영자 확인이 필요한 건이 있으면 해당 건을 먼저 정리한 뒤 요청할 수 있습니다.
              </p>
              <button
                type="button"
                onClick={() => setRefundFormOpen((value) => !value)}
                disabled={requestingDepositRefund}
                className="mt-4 h-11 rounded-xl border border-solid shadow border-[#dfe3e8] bg-white px-4 text-[13px] font-bold text-[#1c1e21] transition hover:border-[#1c1e21] disabled:opacity-50"
              >
                예치금 반환 요청
              </button>
            </div>

            {refundFormOpen ? (
              <div className="mt-3 rounded-md border border-[#dfe3e8] bg-[#f8f9fa] p-5">
                <div className="text-[15px] font-bold text-[#1c1e21]">반환 계좌 입력</div>
                <p className="mt-1 break-keep text-[12px] font-semibold leading-5 text-[#65676b]">
                  통장사본은 제출하지 않습니다. 정확한 반환을 위해 본인 명의 계좌정보만 입력해주세요.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3 items-start">
                  <label className="grid gap-1 text-[12px] font-bold text-[#65676b]">
                    은행명
                    <input
                      value={bankName}
                      onChange={(event) => setBankName(event.target.value.slice(0, 30))}
                      placeholder="예: 국민은행"
                      className="h-11 rounded-xl border border-[#dfe3e8] bg-white px-3 text-[14px] font-semibold text-[#1c1e21] outline-none focus:border-[#1877f2]"
                    />
                  </label>
                  <label className="grid gap-1 text-[12px] font-bold text-[#65676b]">
                    계좌번호
                    <input
                      value={accountNumber}
                      onChange={(event) => setAccountNumber(event.target.value.replace(/[^0-9-]/g, "").slice(0, 40))}
                      placeholder="숫자와 - 입력"
                      inputMode="numeric"
                      className="h-11 rounded-xl border border-[#dfe3e8] bg-white px-3 text-[14px] font-semibold text-[#1c1e21] outline-none focus:border-[#1877f2]"
                    />
                  </label>
                  <label className="grid gap-1 text-[12px] font-bold text-[#65676b]">
                    예금주
                    <input
                      value={accountHolder}
                      readOnly
                      aria-readonly="true"
                      className="h-11 rounded-xl border border-[#dfe3e8] bg-[#f0f2f5] px-3 text-[14px] font-semibold text-[#1c1e21] outline-none"
                    />
                    <span className="text-[11px] font-semibold text-[#8a8d91]">신청자 본인 명의 계좌만 반환할 수 있습니다.</span>
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRefundFormOpen(false)}
                    disabled={requestingDepositRefund}
                    className="h-11 rounded-xl border border-[#dfe3e8] bg-white px-4 text-[13px] font-bold text-[#65676b]"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleRefundRequest}
                    disabled={requestingDepositRefund}
                    className="h-11 rounded-xl bg-[#1c1e21] px-5 text-[13px] font-bold text-white disabled:opacity-50"
                  >
                    {requestingDepositRefund ? "요청 중..." : `${formatWon(balance)} 반환 요청하기`}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-md border border-[#dfe3e8] bg-[#f8f9fa] p-5 text-[13px] font-semibold leading-6 text-[#65676b]">
            현재 반환 가능한 예치금 잔액이 없습니다.
          </div>
        )}
      </SectionCard>

      <SectionCard eyebrow="history" title="예치금 이용 내역">
        <div className="overflow-hidden rounded-md border-solid border border-[#dfe3e8] bg-white">
          <div className="border-b border-solid border-[#eef0f3] px-4 py-3 text-[13px] font-bold text-[#1c1e21]">입금 · 차감 · 반환 히스토리</div>
          {history.length ? (
            <div>
              {history.map((item) => (
                <div key={item.id || `${item.type}-${item.createdAtClient}`} className="grid gap-1 border-b border-solid border-[#eef0f3] px-4 py-3 last:border-b-0 sm:grid-cols-[110px_1fr_auto] sm:items-center">
                  <div className="text-[12px] font-bold text-[#1c1e21]">{historyTypeLabel(item)}</div>
                  <div className="break-keep text-[12px] font-semibold leading-5 text-[#65676b]">
                    {item.note || item.reason || "예치금 변동"} · 잔액 {formatWon(item.balanceAfter || 0)}
                  </div>
                  <div className="text-[11px] font-semibold text-[#8a8d91]">{item.createdAtClient ? formatDateTime(item.createdAtClient) : "-"}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-[12px] font-semibold text-[#8a8d91]">아직 예치금 이용 내역이 없습니다.</div>
          )}
        </div>
      </SectionCard>
      <div className="rounded-[22px] border border-[#e0e9f5] bg-white px-5 py-4">
        <Link href="/about/service" className="flex items-center justify-between text-sm font-bold text-[#326bda]">만남 보증금 이용안내 <FiChevronRight aria-hidden="true"/></Link>
      </div>
    </div>
  );
}

function ProfileTab({
  application,
  savingProfile,
  profileUploadProgress,
  onSaveProfile,
  onSubmitVerificationDocument,
}) {
  const [editOpen, setEditOpen] = useState(false);
  const basic = getBasic(application);
  const identity = getIdentity(application);
  const photos = getPhotos(application);
  const editable = isProfileEditable(application);

  const handleSave = async (form) => {
    const result = await onSaveProfile?.(form);
    if (result !== false) setEditOpen(false);
  };

  return (
    <>
      <SectionCard
        eyebrow="my profile"
        title="나의 기본정보"
        action={
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="h-10 rounded-xl bg-[#326bda] px-4 text-[14px] font-semibold text-white transition hover:bg-[#285db6]"
          >
            {editable ? "수정" : "인증자료 보완"}
          </button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-[185px_1fr] sm:items-start">
          <PhotoStrip photos={photos} compact />

          <div className="min-w-0">
            <Row label="닉네임" value={basic.nickname} />
            <Row label="나이" value={formatAgeBirth(basic)} />
            <Row label="직업군" value={identity.jobCategory} />
            <Row label="회사/학교" value={identity.organizationName} />
            <Row label="활동 지역" value={normalizeArray(basic.activityAreas).join(" · ")} />
            <Row label="선호 지역" value={basic.preferredArea} />
            <Row label="가능 시간" value={formatTimeSlots(basic.availableTimeSlots)} />
            <Row label="키" value={basic.height ? `${basic.height}cm` : "-"} />
            <Row label="소개" value={basic.introduction} large />
            <Row label="학력" value={identity.educationLevel} />
            <Row label="학교" value={identity.schoolName} />
            <Row label="MBTI" value={application?.profileTraits?.mbti} />
            <Row label="관심사" value={normalizeArray(application?.profileTraits?.interests).join(" · ")} />
            <Row label="회사 유형" value={identity.companyScale} />
            <Row label="결혼 의향" value={getMatchingOptionLabel("marriagePlan", getMatchingPreferences(application).marriagePlan)} />
            <Row label="자녀 계획" value={getMatchingOptionLabel("childrenPlan", getMatchingPreferences(application).childrenPlan)} />
            <Row label="종교" value={getMatchingOptionLabel("religion", getMatchingPreferences(application).religion)} />
            <Row label="흡연" value={getMatchingOptionLabel("smoking", getMatchingPreferences(application).smoking)} />
            <Row label="음주" value={getMatchingOptionLabel("drinkingFrequency", getMatchingPreferences(application).drinkingFrequency)} />
          </div>
        </div>
      </SectionCard>

      <MyProfileEditModal
        open={editOpen}
        application={application}
        editable={editable}
        saving={savingProfile}
        uploadProgress={profileUploadProgress}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
        onSubmitVerification={onSubmitVerificationDocument}
      />
    </>
  );
}

function CandidateTab({
  application,
  bestMatch,
  responseStatus,
  savingResponse,
  onRequestRespond,
}) {
  const candidate = bestMatch?.candidate;

  if (!candidate) {
    const matchingStatus = String(application?.matchingStatus || "");
    const nextRoundStatus = String(application?.nextRoundStatus || "");
    const currentMatchId = String(application?.currentProposal?.matchId || "");
    const waitingForCandidate =
      !currentMatchId &&
      (matchingStatus === "not_started" || application?.matchingAvailability === "active") &&
      ["", "ready", "queued"].includes(nextRoundStatus);

    return (
      <SectionCard eyebrow="candidate" title="대상후보">
        <div className="relative overflow-hidden rounded-[24px] border border-solid border-blue-100 bg-gradient-to-br from-blue-50 via-white to-emerald-50/70 px-5 py-10 text-center sm:px-8 sm:py-12">
          <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/70" />
          <div className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-white/60" />

          <div className="relative mx-auto flex max-w-2xl flex-col items-center">
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white text-[34px] shadow-sm ring-1 ring-inset ring-blue-100" aria-hidden="true">
              {waitingForCandidate ? "💌" : "🌿"}
            </div>
            <div className="mt-5 rounded-full bg-blue-100 px-3 py-1 text-[11px] font-black tracking-[0.15em] text-blue-700">
              {waitingForCandidate ? "MATCHING WAIT" : "CURRENT STATUS"}
            </div>
            <div className="mt-3 break-keep text-[24px] font-black tracking-[-0.045em] text-[#1c1e21] sm:text-[28px]">
              {waitingForCandidate ? "좋은 만남을 준비하고 있어요" : "아직 제안된 후보가 없어요"}
            </div>
            <p className="mt-3 break-keep text-[14px] font-semibold leading-6 text-[#65676b] sm:text-[15px]">
              {waitingForCandidate
                ? "회원님의 조건과 가능한 일정을 살펴 신중하게 후보를 찾고 있습니다. 회차별 참여 인원과 남녀 구성에 따라 조금 기다릴 수 있어요."
                : "현재 매칭 상태는 신청현황 탭에서 확인할 수 있습니다."}
            </p>

            {waitingForCandidate ? (
              <div className="mt-6 flex items-center gap-2 rounded-xl border border-solid border-blue-100 bg-white/90 px-4 py-3 text-left shadow-sm">
                <span className="text-[22px]" aria-hidden="true">🔔</span>
                <div>
                  <div className="text-[13px] font-black text-[#1c1e21]">후보가 준비되면 바로 알려드려요</div>
                  <div className="mt-0.5 text-[12px] font-semibold text-[#65676b]">등록한 휴대폰 번호로 문자 안내가 발송됩니다.</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </SectionCard>
    );
  }

  const basic = getBasic(candidate);
  const identity = getIdentity(candidate);
  const matchingPreferences = getMatchingPreferences(candidate);
  const photos = getPhotos(candidate);
  const scheduleStatus = getScheduleStatus(bestMatch);
  const scheduleOpen = isScheduleOpen(bestMatch);
  const showOrganization = scheduleOpen;
  const responseDueAt = getProposalDueAt(application, bestMatch);
  const hasFinalResponse = isFinalProposalResponse(responseStatus);
  const match = bestMatch?.match || {};
  const counterpartResponse = bestMatch?.counterpartResponse || null;
  const counterpartDeclined =
    counterpartResponse?.response === "declined" ||
    (String(match?.status || "") === "declined" &&
      String(match?.declinedByApplicationId || "") &&
      String(match?.declinedByApplicationId || "") !== String(application?.id || ""));
  const responseExpired = !hasFinalResponse && !counterpartDeclined && isDueExpired(responseDueAt);

  return (
    <SectionCard title="상대 프로필">
      <div className="grid gap-5 lg:grid-cols-[320px_1fr] lg:items-start">
        <PhotoStrip photos={photos} />

        <div>
          <div className="min-w-0">
            <Row label="나이" value={formatAgeBirth(basic)} />
            <Row label="직업군" value={identity.jobCategory} />
            {showOrganization ? <Row label="회사/학교" value={identity.organizationName} /> : null}
            <Row label="활동 지역" value={normalizeArray(basic.activityAreas).join(" · ")} />
            <Row label="가능 시간" value={formatTimeSlots(basic.availableTimeSlots)} />
          </div>

          <div className="mt-5">
      {Array.isArray(bestMatch?.score?.reasons) && bestMatch.score.reasons.filter(Boolean).length ? (
        <div className="mt-5 rounded-[18px] bg-[#f1f6ff] px-4 py-4 sm:px-5">
          <h3 className="text-[15px] font-extrabold text-[#2d5fa6]">왜 이 분을 소개했나요?</h3>
          <ul className="mt-3 space-y-2">
            {bestMatch.score.reasons.filter(Boolean).slice(0, 3).map((reason, index) => <li key={`${index}-${reason}`} className="flex items-start gap-2 text-[13px] font-semibold leading-6 text-[#3d628c]"><FiCheck className="mt-1 shrink-0 text-[#256bd4]"/>{reason}</li>)}
          </ul>
        </div>
      ) : null}
      <div className="mt-5">
      {counterpartDeclined ? (
        <div className="mb-4 rounded-md border border-solid border-blue-100 bg-blue-50 p-5 text-center">
          <div className="text-[19px] font-bold tracking-[-0.04em] text-blue-900">
            이번 제안은 아쉽게 연결되지 않았어요
          </div>
          <p className="mt-2 break-keep text-[14px] font-semibold leading-6 text-blue-800">
            한 번의 선택이 회원님의 매력이나 가치를 뜻하는 것은 아닙니다.
            <br />투윅스가 더 잘 맞는 다음 만남을 신중하게 준비하겠습니다.
          </p>
          <p className="mt-3 text-[12px] font-semibold leading-5 text-blue-700">
            상대방의 상세 거절 사유는 공개되지 않습니다.
          </p>
        </div>
      ) : responseExpired ? (
        <div className="mb-4 rounded-xl bg-rose-50 p-3 text-center text-[15px] font-semibold leading-7 text-rose-700">
          응답 기한이 종료되어 이번 제안은 보류 의사로 간주됩니다.
        </div>
      ) : hasFinalResponse ? null : (
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onRequestRespond?.("accepted")}
            disabled={savingResponse || responseExpired}
            className="h-13 min-h-[52px] rounded-lg bg-[#1877f2] px-5 text-[15px] font-bold text-white transition hover:bg-[#166fe5] disabled:opacity-60"
          >
            만나보고 싶어요
          </button>
          <button
            type="button"
            onClick={() => onRequestRespond?.("declined")}
            disabled={savingResponse || responseExpired}
            className="h-13 min-h-[52px] rounded-lg border border-solid border-[#dfe3e8] px-5 text-[15px] font-semibold text-[#1c1e21] transition hover:bg-[#f0f2f5] disabled:opacity-60"
          >
            이번에는 패스
          </button>
          <div className="sm:col-span-2 rounded-lg bg-amber-50 px-3 py-2 text-[12px] font-semibold leading-5 text-amber-800">
            거절 의사가 반복될 경우 추후 매칭에 제한이 있을 수 있습니다.
          </div>
        </div>
      )}
      </div>
          </div>
          <details className="group mt-5 overflow-hidden rounded-[18px] border border-[#dce6f3] bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-[14px] font-extrabold text-[#2d5fa6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#326bda]">
              상대 프로필 더 보기
              <span aria-hidden="true" className="text-lg group-open:rotate-180">⌄</span>
            </summary>
            <div className="border-t border-[#edf0f5] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#1877f2]">
                  PROFILE
                </div>
                <div className="mt-1 text-[18px] font-bold tracking-[-0.04em] text-[#1c1e21]">
                  조금 더 알아보는 일곱 가지 이야기
                </div>
                <p className="mt-1 break-keep text-[12px] font-semibold leading-5 text-[#65676b]">
                  서로 알아두면 좋은 내용이에요.
                </p>
              </div>
              <div className="rounded-full bg-[#e7f3ff] px-3 py-1 text-[11px] font-bold text-[#1877f2]">
                핵심 정보
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MatchingSignalRow
                number="1"
                label="결혼 의향"
                value={getMatchingOptionLabel("marriagePlan", matchingPreferences.marriagePlan)}
              />
              <MatchingSignalRow
                number="2"
                label="자녀 계획"
                value={getMatchingOptionLabel("childrenPlan", matchingPreferences.childrenPlan)}
              />
              <MatchingSignalRow
                number="3"
                label="종교"
                value={getMatchingOptionLabel("religion", matchingPreferences.religion)}
                detail={`상대방 종교에 대한 생각 · ${getMatchingOptionLabel("religionPreference", matchingPreferences.religionPreference)}`}
                wide
              />
              <MatchingSignalRow
                number="4"
                label="흡연"
                value={getMatchingOptionLabel("smoking", matchingPreferences.smoking)}
                detail={`상대방 흡연 허용 범위 · ${getMatchingOptionLabel("smokingPreference", matchingPreferences.smokingPreference)}`}
                wide
              />
              <MatchingSignalRow
                number="5"
                label="음주 빈도"
                value={getMatchingOptionLabel("drinkingFrequency", matchingPreferences.drinkingFrequency)}
              />
              <MatchingSignalRow
                number="6"
                label="키"
                value={basic.height ? `${basic.height}cm` : "미입력"}
              />
              <MatchingSignalRow
                number="7"
                label="짧은 자기소개"
                value={basic.introduction || "미입력"}
                large
                wide
              />
            </div>
            </div>
          </details>
        </div>
      </div>
    </SectionCard>
  );
}


function getKstDateKeyFromMs(ms = 0) {
  if (!ms) return "";
  const date = new Date(ms + 9 * 60 * 60 * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMatchCancellationPreview(bestMatch = {}) {
  const match = bestMatch?.match || {};
  const status = String(match?.status || "");
  const scheduleStatus = String(match?.scheduleStatus || match?.schedule?.status || "");
  const finalMeeting = bestMatch?.finalMeeting || match?.finalMeeting || match?.schedule?.finalMeeting || {};
  const meetingStartMs = getTimeMs(
    finalMeeting?.startAtClient ||
      finalMeeting?.finalTimeChoice?.startAtClient ||
      finalMeeting?.timeChoice?.startAtClient ||
      ""
  );

  const cancellable =
    ["mutualAccepted", "confirmed"].includes(status) ||
    ["ready", "waiting_counterpart", "needs_final_choice", "place_pending", "confirmed"].includes(scheduleStatus);

  if (!cancellable || ["completed", "cancelled", "canceled", "failed"].includes(status)) return null;

  const scheduleConfirmed =
    status === "confirmed" || scheduleStatus === "confirmed" || Boolean(match?.finalMeeting || match?.schedule?.finalMeeting);

  if (!scheduleConfirmed) {
    return { amount: 9000, label: "일정·장소 확정 전 취소" };
  }

  if (meetingStartMs && getKstDateKeyFromMs(Date.now()) === getKstDateKeyFromMs(meetingStartMs)) {
    return { amount: 30000, label: "만남 당일 취소" };
  }

  if (meetingStartMs && Date.now() > meetingStartMs) {
    return { amount: 30000, label: "만남 당일 취소" };
  }

  return { amount: 15000, label: "일정·장소 확정 후 취소" };
}

function ScheduleTab({
  application,
  bestMatch,
  cafeCandidates = [],
  savingSchedule,
  savingPreMeetingNote,
  savingAttendance,
  sendingMissingArrivalAlert,
  savingProofPhoto,
  proofUploadProgress,
  cancellingMatch,
  onSaveScheduleChoices,
  onSaveFinalScheduleChoice,
  onSavePreMeetingNote,
  onSaveMeetingAttendance,
  onSendMissingArrivalAlert,
  onSaveMeetingProofPhoto,
  onCancelMatch,
}) {
  const candidate = bestMatch?.candidate;
  const schedule = getScheduleFromMatch(bestMatch);
  const status = getScheduleStatus(bestMatch);
  const scheduleOpen = isScheduleOpen(bestMatch);
  const timeChoices = getTimeChoicesFromSchedule(schedule);
  const placeChoices = getPlaceChoicesFromSchedule(schedule);
  const finalTimeChoice = schedule.finalTimeChoice || schedule.finalChoice?.timeChoice || schedule.selectedChoice?.timeChoice || schedule.finalChoice || null;
  const finalPlaceChoice = schedule.finalPlaceChoice || schedule.finalChoice?.placeChoice || schedule.selectedChoice?.placeChoice || null;
  const finalChoice = schedule.finalChoice || schedule.selectedChoice || null;
  const finalMeeting = bestMatch?.finalMeeting || bestMatch?.match?.finalMeeting || schedule.finalMeeting || null;
  const isMeetingConfirmed =
    status === "confirmed" ||
    bestMatch?.match?.status === "confirmed" ||
    bestMatch?.status === "confirmed" ||
    Boolean(finalMeeting);
  const scheduleDueAt = getScheduleDueAtByStatus(schedule, status);
  const scheduleExpired = isDueExpired(scheduleDueAt);

  const options = useMemo(() => buildAutoScheduleOptions(), []);
  const safeCafeCandidates = Array.isArray(cafeCandidates) ? cafeCandidates : [];

  const availableAreas = useMemo(() => {
    const baseAreas = getAvailableAreas(application, candidate);
    const cafeAreas = normalizeArray(safeCafeCandidates)
      .filter((cafe) => cafe?.status === "active" && cafe?.area)
      .map((cafe) => cafe.area);

    return Array.from(new Set([...baseAreas, ...cafeAreas]));
  }, [application, candidate, cafeCandidates]);

  const [selectedTimeIds, setSelectedTimeIds] = useState([]);
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [finalTimeId, setFinalTimeId] = useState("");
  const [finalPlaceId, setFinalPlaceId] = useState("");
  const [preMeetingNoteText, setPreMeetingNoteText] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState("");
  const [expandedProofPhotoUrl, setExpandedProofPhotoUrl] = useState("");

  const preMeetingNotes = bestMatch?.match?.preMeetingNotes || {};
  const myPreMeetingNote = application?.id ? preMeetingNotes[application.id] : null;
  const counterpartPreMeetingNote = candidate?.id ? preMeetingNotes[candidate.id] : null;

  const meetingArrival = bestMatch?.match?.meetingArrival || {};
  const myArrival = application?.id ? meetingArrival[application.id] : null;
  const counterpartArrival = candidate?.id ? meetingArrival[candidate.id] : null;
  const meetingAttendance = bestMatch?.match?.meetingAttendance || {};
  const myAttendance = application?.id ? meetingAttendance[application.id] : null;
  const counterpartAttendance = candidate?.id ? meetingAttendance[candidate.id] : null;
  const meetingProofs = bestMatch?.match?.meetingProofs || {};
  const myMeetingProof = application?.id ? meetingProofs[application.id] || application?.schedule?.meetingProof : null;
  const counterpartMeetingProof = candidate?.id ? meetingProofs[candidate.id] : null;
  const missingArrivalAlerts = bestMatch?.match?.missingArrivalAlerts || {};
  const myMissingArrivalAlert = application?.id ? missingArrivalAlerts[application.id] : null;
  const missingArrivalAlertSent = myMissingArrivalAlert?.status === "sent";
  const missingArrivalAlertSending = myMissingArrivalAlert?.status === "sending";
  const nowMs = useNowMs(15000);
  const meetingStartMs = getTimeMs(
    finalMeeting?.startAtClient ||
      finalMeeting?.finalTimeChoice?.startAtClient ||
      finalMeeting?.timeChoice?.startAtClient ||
      finalTimeChoice?.startAtClient ||
      finalChoice?.timeChoice?.startAtClient
  );
  const meetingDayKey = getSeoulDateKey(meetingStartMs);
  const todaySeoulKey = getSeoulDateKey(nowMs);
  const isMeetingDay = Boolean(meetingDayKey && todaySeoulKey && meetingDayKey === todaySeoulKey);
  const missingAlertAvailableAtMs = meetingStartMs ? meetingStartMs + 5 * 60 * 1000 : 0;
  const missingAlertWindowEndsAtMs = meetingStartMs ? meetingStartMs + 6 * 60 * 60 * 1000 : 0;
  const missingAlertAvailable = Boolean(
    missingAlertAvailableAtMs &&
      nowMs >= missingAlertAvailableAtMs &&
      (!missingAlertWindowEndsAtMs || nowMs <= missingAlertWindowEndsAtMs)
  );
  const cancellationPreview = getMatchCancellationPreview(bestMatch);

  useEffect(() => {
    setSelectedTimeIds([]);
    setSelectedArea("");
    setSelectedPlaces([]);
    setFinalTimeId("");
    setFinalPlaceId("");
  }, [status, bestMatch?.matchId]);

  useEffect(() => {
    setPreMeetingNoteText(myPreMeetingNote?.note || "");
  }, [myPreMeetingNote?.note, bestMatch?.matchId]);

  useEffect(() => {
    if (!expandedProofPhotoUrl) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setExpandedProofPhotoUrl("");
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [expandedProofPhotoUrl]);

  useEffect(() => {
    if (!proofFile) {
      setProofPreviewUrl("");
      return undefined;
    }

    const nextUrl = URL.createObjectURL(proofFile);
    setProofPreviewUrl(nextUrl);

    return () => URL.revokeObjectURL(nextUrl);
  }, [proofFile]);

  if (!candidate) {
    return (
      <SectionCard eyebrow="schedule" title="일정조율">
        <div className="rounded-xl bg-[#f0f2f5] p-6 text-center text-[15px] font-semibold text-[#65676b]">
          후보가 준비되면 일정조율을 진행할 수 있습니다.
        </div>
      </SectionCard>
    );
  }

  const hasAnyScheduleProgress =
    normalizeArray(timeChoices).length > 0 ||
    normalizeArray(placeChoices).length > 0 ||
    Boolean(finalChoice) ||
    Boolean(finalMeeting) ||
    status === "confirmed" ||
    status === "waiting_counterpart" ||
    status === "needs_final_choice" ||
    status === "place_pending";

  if (!scheduleOpen && !hasAnyScheduleProgress) {
    return (
      <SectionCard eyebrow="schedule" title="일정조율">
        <div className="rounded-xl bg-[#f0f2f5] p-6">
          <div className="text-[20px] font-bold tracking-[-0.04em] text-[#1c1e21]">
            상대 응답을 기다리고 있습니다
          </div>
          <p className="mt-2 break-keep text-[14px] leading-6 text-[#65676b]">
            양쪽 모두 만남 진행 의사를 선택하면 일정/장소 조율 화면이 열립니다. 아직은 선택할 수 없습니다.
          </p>
        </div>
      </SectionCard>
    );
  }

  const isFirstSelectionStep =
    !isMeetingConfirmed &&
    (!timeChoices.length || !placeChoices.length) &&
    !["waiting_counterpart", "needs_final_choice", "place_pending", "confirmed"].includes(status);

  const isWaitingCounterpart =
    !isMeetingConfirmed &&
    status === "waiting_counterpart" &&
    schedule.firstSelectorApplicationId === application?.id;

  const needsFinalChoice =
    !isMeetingConfirmed &&
    timeChoices.length > 0 &&
    placeChoices.length > 0 &&
    status !== "place_pending" &&
    status !== "confirmed" &&
    schedule.firstSelectorApplicationId !== application?.id;

  const scheduleActionRequired = isScheduleActionRequiredForMe(application, bestMatch);
  const scheduleActionGuide = isFirstSelectionStep
    ? {
        title: "지금 일정 후보 작성이 필요합니다",
        desc: "가능한 일시 3개와 장소 3개를 선택한 뒤 상대에게 전달해주세요.",
      }
    : needsFinalChoice
    ? {
        title: "지금 최종 일정 선택이 필요합니다",
        desc: "상대가 제안한 후보 중 일시 1개와 장소 1개를 선택해주세요.",
      }
    : null;

  const defaultArea = selectedArea || availableAreas[0] || "강남구";
  const selectedFinalTime = timeChoices.find((item) => item.id === finalTimeId) || null;
  const selectedFinalPlace = placeChoices.find((item) => (item.placeId || item.cafeId || item.id) === finalPlaceId) || null;
  const confirmedMapUrl =
    finalMeeting?.mapUrl ||
    finalMeeting?.cafeMapUrl ||
    finalPlaceChoice?.cafeMapUrl ||
    finalChoice?.cafeMapUrl ||
    "";
  const attendanceConfirmed = myAttendance?.status === "attending";
  const counterpartAttendanceConfirmed = counterpartAttendance?.status === "attending";
  const arrivalConfirmed = myArrival?.status === "arrived";
  const counterpartArrivalConfirmed = counterpartArrival?.status === "arrived";

  const toggleTimeOption = (optionId) => {
    setSelectedTimeIds((prev) => {
      if (prev.includes(optionId)) return prev.filter((id) => id !== optionId);
      if (prev.length >= 3) return prev;
      return [...prev, optionId];
    });
  };

  const togglePlace = (cafe, area) => {
    const snapshot = buildCafeSnapshot(cafe, area);
    const placeId = snapshot.placeId || snapshot.cafeId || snapshot.id;

    setSelectedPlaces((prev) => {
      const exists = prev.some((item) => (item.placeId || item.cafeId || item.id) === placeId);
      if (exists) {
        return prev.filter((item) => (item.placeId || item.cafeId || item.id) !== placeId);
      }
      if (prev.length >= 3) return prev;
      return [...prev, snapshot];
    });
  };

  const submitChoices = () => {
    const selectedTimes = options.filter((option) => selectedTimeIds.includes(option.id));

    onSaveScheduleChoices?.({
      timeChoices: selectedTimes,
      placeChoices: selectedPlaces.slice(0, 3),
    });
  };

  const submitFinalChoice = () => {
    if (!selectedFinalTime || !selectedFinalPlace) return;

    onSaveFinalScheduleChoice?.({
      timeChoice: selectedFinalTime,
      placeChoice: selectedFinalPlace,
    });
  };

  const selectedPlaceIds = selectedPlaces.map((item) => item.placeId || item.cafeId || item.id).filter(Boolean);

  const submitMeetingProofPhoto = async () => {
    if (!proofFile || savingProofPhoto) return;

    if (!isMeetingDay) {
      window.alert("현장사진과 도착 확인은 약속 당일에만 사용할 수 있습니다.");
      return;
    }

    const saved = await onSaveMeetingProofPhoto?.({
      file: proofFile,
    });

    if (saved) {
      setProofFile(null);
      setProofPreviewUrl("");
    }
  };

  return (
    <SectionCard title={isMeetingConfirmed ? "확정된 약속" : "일정과 장소"}>
      {scheduleActionRequired && scheduleActionGuide && !scheduleExpired ? (
        <div className="mb-4 rounded-md border border-solid border-[#1877f2] bg-blue-50 p-4 shadow-sm ring-4 ring-blue-100/70 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="mt-1 h-3 w-3 shrink-0 animate-pulse rounded-full bg-[#1877f2]" />
            <div>
              <div className="text-[17px] font-bold tracking-[-0.04em] text-[#1558b0]">
                {scheduleActionGuide.title}
              </div>
              <p className="mt-1 break-keep text-[13px] font-semibold leading-6 text-[#315f91]">
                {scheduleActionGuide.desc}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {!isMeetingConfirmed ? (
        <div className="overflow-hidden rounded-md border-solid border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-orange-50 shadow-sm">
        <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#1877f2] shadow-sm">
                일시 3개 · 장소 3개
              </span>
            </div>
            <div className="mt-3 text-[22px] font-bold tracking-[-0.06em] text-[#1c1e21] sm:text-[26px]">
              일시와 장소를 따로 선택해주세요
            </div>
            <p className="mt-2 break-keep text-[14px] font-semibold leading-6 text-[#65676b]">
              1차 선택자는 일시 후보 3개와 장소 후보 3개를 제안하고, 상대는 그중 일시 1개와 장소 1개를 선택합니다.
            </p>
          </div>

          {scheduleDueAt ? (
            <div className="rounded-md border-solid border border-blue-100 bg-white p-4 text-center shadow-sm">
              <div className="text-[11px] font-bold tracking-[0.16em] text-[#65676b]">남은 시간</div>
              <div className="mt-2">
                <CountdownBadge dueAt={scheduleDueAt} label="일정 선택" />
              </div>
            </div>
          ) : null}
        </div>
      </div>
      ) : null}

      {scheduleExpired && !isMeetingConfirmed ? (
        <div className="mt-4 rounded-xl bg-rose-50 p-4 text-[14px] font-semibold leading-6 text-rose-700">
          일정 선택 기한이 종료되었습니다. 운영자가 재매칭 또는 일정 재안내를 검토합니다.
        </div>
      ) : null}

      {isFirstSelectionStep ? (
        <div className="mt-5">
          <div className="rounded-md border-solid border border-[#dfe3e8] bg-white p-4 shadow-sm sm:p-5">
            <div className="text-[17px] font-bold tracking-[-0.04em] text-slate-600">1. 가능한 일시 3개 선택</div>
            <p className="mt-1 text-[13px] font-semibold leading-5 text-[#65676b]">
              카드 전체를 눌러 선택할 수 있습니다.<br/>(상대 선호시간대를 고려하여 선택해주세요!)
            </p>
          </div>

          <div className="mt-4 grid gap-3">
            {options.map((option) => {
              const selected = selectedTimeIds.includes(option.id);
              const disabled = !selected && selectedTimeIds.length >= 3;

              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleTimeOption(option.id)}
                  className={cx(
                    "group w-full rounded-md border-solid border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-45 sm:p-5",
                    selected
                      ? "border-[#1877f2] bg-blue-50 shadow-sm ring-2 ring-[#1877f2]/15"
                      : "border-[#dfe3e8] bg-white hover:border-[#1877f2]/40"
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <span
                        className={cx(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-solid border text-[14px] font-bold",
                          selected
                            ? "border-[#1877f2] bg-[#1877f2] text-white"
                            : "border-[#ccd0d5] bg-white text-transparent group-hover:text-[#ccd0d5]"
                        )}
                      >
                        ✓
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[18px] font-bold tracking-[-0.04em] text-[#1c1e21]">
                          {option.dateLabel}
                        </span>
                        <span className="mt-1 block text-[15px] font-bold text-[#1877f2]">
                          {[option.slotLabel, option.timeLabel].filter(Boolean).join(" ")}
                        </span>
                      </span>
                    </div>
                    <span className={cx(
                      "shrink-0 rounded-full px-3 py-1 text-[11px] font-bold",
                      selected ? "bg-[#1877f2] text-white" : "bg-[#f0f2f5] text-[#65676b]"
                    )}>
                      {selected ? "선택됨" : "선택"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-md border-solid border border-[#dfe3e8] bg-white p-4 shadow-sm sm:p-5">
            <div className="text-[17px] font-bold tracking-[-0.04em] text-[#1c1e21]">2. 구 선택</div>
            <p className="mt-1 text-[13px] font-semibold leading-5 text-[#65676b]">
              구를 선택한 뒤 카페 후보를 고르세요. 구를 바꿔도 이미 선택한 장소 후보는 유지됩니다.
            </p>
            <select
              value={defaultArea}
              onChange={(event) => setSelectedArea(event.target.value)}
              className="mt-4 h-12 w-full rounded-xl border-solid border border-[#dfe3e8] bg-white px-4 text-[15px] font-bold text-[#1c1e21] outline-none transition focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/10 sm:max-w-[260px]"
            >
              {availableAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          <CafeSelectGrid
            area={defaultArea}
            selectedCafeIds={selectedPlaceIds}
            onToggle={togglePlace}
            maxCount={3}
            cafeCandidates={safeCafeCandidates}
          />

          {selectedPlaces.length ? (
            <div className="mt-4 rounded-md border-solid border border-[#dfe3e8] bg-white p-4 shadow-sm">
              <div className="text-[15px] font-bold text-[#1c1e21]">선택한 장소 후보</div>
              <div className="mt-3 grid gap-2">
                {selectedPlaces.map((place, index) => (
                  <div key={place.placeId || place.cafeId || place.id} className="rounded-xl bg-[#f0f2f5] px-3 py-3 text-[13px] font-bold text-[#1c1e21]">
                    {index + 1}. {formatPlaceChoice(place)}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            disabled={selectedTimeIds.length !== 3 || selectedPlaces.length !== 3 || savingSchedule || scheduleExpired}
            onClick={submitChoices}
            className="mt-5 h-13 min-h-[52px] w-full rounded-xl bg-[#1877f2] px-6 text-[15px] font-bold text-white shadow-sm transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            일시 3개 / 장소 3개 보내기
          </button>
        </div>
      ) : null}

      {isWaitingCounterpart ? (
        <div className="mt-5 rounded-md bg-[#f0f2f5] p-5">
          <div className="text-[19px] font-bold tracking-[-0.04em] text-[#1c1e21]">
            선택 완료
          </div>
          <p className="mt-2 break-keep text-[14px] font-semibold leading-6 text-[#65676b]">
            상대방이 일시 1개와 장소 1개를 선택할 때까지 기다려주세요.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-md bg-white p-4">
              <div className="text-[14px] font-bold text-[#1c1e21]">제안한 일시</div>
              <div className="mt-3 grid gap-2">
                {timeChoices.map((choice, index) => (
                  <div key={choice.id} className="rounded-lg border-solid border border-[#dfe3e8] px-3 py-3 text-[13px] font-bold text-[#1c1e21]">
                    {index + 1}. {formatTimeChoice(choice)}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-md bg-white p-4">
              <div className="text-[14px] font-bold text-[#1c1e21]">제안한 장소</div>
              <div className="mt-3 grid gap-2">
                {placeChoices.map((choice, index) => (
                  <div key={choice.placeId || choice.cafeId || choice.id} className="rounded-lg border-solid border border-[#dfe3e8] px-3 py-3 text-[13px] font-bold text-[#1c1e21]">
                    {index + 1}. {formatPlaceChoice(choice)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {needsFinalChoice ? (
        <div className="mt-5">
          <div className="rounded-md border border-[#dfe3e8] bg-white p-4 sm:p-5">
            <div className="text-[17px] font-bold tracking-[-0.04em] text-pink-600">1. 가능한 일시 1개 선택</div>
            <p className="mt-1 text-[13px] font-semibold leading-5 text-[#65676b]">
              상대가 제안한 일시 후보 중 가능한 시간을 선택해주세요.
            </p>
          </div>

          <div className="mt-4 grid gap-3">
            {timeChoices.map((choice) => {
              const selected = finalTimeId === choice.id;

              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => setFinalTimeId(choice.id)}
                  className={cx(
                    "w-full rounded-md border-solid border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md",
                    selected
                      ? "border-[#1877f2] bg-blue-50 shadow-sm ring-2 ring-[#1877f2]/15"
                      : "border-[#dfe3e8] bg-white hover:border-[#1877f2]/40"
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[18px] font-bold tracking-[-0.04em] text-[#1c1e21]">
                        {formatTimeChoice(choice)}
                      </div>
                      <div className="mt-1 text-[13px] font-bold text-[#65676b]">
                        일시 선택
                      </div>
                    </div>
                    <span className={cx(
                      "shrink-0 rounded-full px-3 py-1 text-[11px] font-bold",
                      selected ? "bg-[#1877f2] text-white" : "bg-[#f0f2f5] text-[#65676b]"
                    )}>
                      {selected ? "선택됨" : "선택"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-md border border-[#dfe3e8] bg-white p-4 sm:p-5">
            <div className="text-[17px] font-bold tracking-[-0.04em] text-pink-600">2. 장소 1개 선택</div>
            <p className="mt-1 text-[13px] font-semibold leading-5 text-[#65676b]">
              상대가 제안한 장소 후보 중 가장 편한 곳을 선택해주세요.
            </p>
          </div>

          <div className="mt-4 grid gap-3">
            {placeChoices.map((choice) => {
              const choiceId = choice.placeId || choice.cafeId || choice.id;
              const selected = finalPlaceId === choiceId;
              const mapUrl = choice.cafeMapUrl || getCafeMapUrl(choice);

              return (
                <div
                  key={choiceId}
                  className={cx(
                    "rounded-md border-solid border bg-white p-4 transition",
                    selected ? "border-[#1877f2] bg-blue-50 ring-2 ring-[#1877f2]/15" : "border-[#dfe3e8]"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-[17px] font-bold tracking-[-0.04em] text-[#1c1e21]">
                        {formatPlaceChoice(choice)}
                      </div>
                      <div className="mt-1 text-[13px] font-bold text-[#65676b]">
                        {choice.cafeStation || choice.cafeRatingLabel || "운영 추천"}
                      </div>
                      {choice.cafeReason ? (
                        <div className="mt-2 text-[12px] font-semibold leading-5 text-[#65676b]">
                          {choice.cafeReason}
                        </div>
                      ) : null}
                    </div>
                    <span className={cx(
                      "rounded-full px-3 py-1 text-[11px] font-bold",
                      selected ? "bg-[#1877f2] text-white" : "bg-[#f0f2f5] text-[#65676b]"
                    )}>
                      {selected ? "선택됨" : "선택"}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFinalPlaceId(choiceId)}
                      className={cx(
                        "h-10 rounded-lg border-solid border text-[12px] font-bold",
                        selected ? "border-[#1877f2] bg-[#1877f2] text-white" : "border-[#dfe3e8] bg-white text-[#1c1e21]"
                      )}
                    >
                      {selected ? "장소 선택 완료" : "이 장소 선택"}
                    </button>
                    {mapUrl ? (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-10 items-center justify-center rounded-lg border-solid border border-[#dfe3e8] bg-white text-[12px] font-bold text-[#1c1e21]"
                      >
                        네이버지도
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            disabled={!selectedFinalTime || !selectedFinalPlace || savingSchedule || scheduleExpired}
            onClick={submitFinalChoice}
            className="mt-5 h-13 min-h-[52px] w-full rounded-xl bg-[#1877f2] px-6 text-[15px] font-bold text-white shadow-sm transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            일시 1개 / 장소 1개 선택 완료
          </button>
        </div>
      ) : null}

      {status === "place_pending" && !isMeetingConfirmed ? (
        <div className="mt-5 rounded-md bg-[#f0f2f5] p-5">
          <div className="text-[19px] font-bold tracking-[-0.04em] text-[#1c1e21]">
            일시/장소가 선택되었습니다
          </div>
          <p className="mt-2 break-keep text-[14px] font-semibold leading-6 text-[#65676b]">
서로 일시/장소 선택이 완료되었습니다. 곧 자동 확정 안내가 문자로 발송됩니다.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-md bg-white p-4">
              <div className="text-[12px] font-bold tracking-[0.16em] text-[#65676b]">일시</div>
              <div className="mt-2 text-[15px] font-bold text-[#1c1e21]">
                {formatTimeChoice(finalTimeChoice || finalChoice)}
              </div>
            </div>
            <div className="rounded-md bg-white p-4">
              <div className="text-[12px] font-bold tracking-[0.16em] text-[#65676b]">장소</div>
              <div className="mt-2 text-[15px] font-bold text-[#1c1e21]">
                {formatPlaceChoice(finalPlaceChoice || finalChoice)}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isMeetingConfirmed ? (
        <div className="mt-5 grid gap-4">
          <div className="rounded-md border-solid border border-emerald-100 bg-emerald-50 p-5">
            <div className="text-[20px] font-bold tracking-[-0.04em] text-emerald-900">
              만남의 일시와 장소가 확정되었습니다
            </div>
            <p className="mt-2 break-keep text-[14px] font-semibold leading-6 text-emerald-800">
              상대 프로필은 [대상후보]탭에서 바로 확인할 수 있습니다. <br/>아래 안내를 확인하고 약속 시간에 맞춰 방문해주세요.
              <br/>약속은 중요합니다. 약속을 파기하고 만나지 않을 시, 이용규칙에 따라 예치금이 차감될 수 있습니다.
            </p>
            <div
              className={cx(
                "mt-4 rounded-md border-solid border p-3",
                attendanceConfirmed ? "border-emerald-100 bg-white" : "border-orange-200 bg-orange-50"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className={cx("text-[15px] font-bold", attendanceConfirmed ? "text-emerald-800" : "text-orange-800")}>
                    {attendanceConfirmed ? "참석 확인이 완료되었습니다" : "참석 확인을 눌러주세요"}
                  </div>
                  <p className="mt-1 break-keep text-[12px] font-semibold leading-5 text-[#65676b]">
                    상대 프로필은 참석 확인 전에도 바로 확인할 수 있습니다. 참석 확인은 최종 만남 안내와 노쇼 방지를 위한 필수 확인 단계입니다.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={savingAttendance || attendanceConfirmed}
                  onClick={() => onSaveMeetingAttendance?.()}
                  className={cx(
                    "py-2 min-h-[48px] rounded-xl px-5 text-[14px] font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60",
                    attendanceConfirmed ? "bg-emerald-600" : "bg-orange-500 hover:bg-orange-600 ring-4 ring-orange-100"
                  )}
                >
                  {attendanceConfirmed ? "참석 확인 완료" : savingAttendance ? "저장 중..." : "참석 확인하기"}
                </button>
              </div>

              {/* <div className="mt-3 rounded-xl bg-white/80 px-2 py-2 text-[12px] font-bold text-[#65676b]">
                {counterpartAttendanceConfirmed ? "상대도 참석을 확인했습니다." : "상대 참석 확인은 아직 없습니다."}
              </div> */}
            </div>

            <div className="mt-4 rounded-md bg-white px-4 py-3 shadow">
              <Row label="일정" value={formatTimeChoice(finalMeeting || finalTimeChoice || finalChoice)} />
              <Row label="장소" value={finalMeeting?.placeName || formatPlaceChoice(finalMeeting || finalPlaceChoice || finalChoice)} />
              <Row label="지도" value={<MapLinkButton href={confirmedMapUrl} />} />
              <Row label="만남 방식" value="카페에서 60분 정도 가볍게 대화" />
              <Row label="결제" value={finalMeeting?.paymentNote || "음료 등 개인 주문 비용은 각자 부담입니다."} />
            </div>
          </div>

          <div className="rounded-md border-solid border border-[#dfe3e8] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[18px] font-bold tracking-[-0.04em] text-[#1c1e21]">
                  만남 전 한마디
                </div>
                <p className="mt-1 break-keep text-[13px] font-semibold leading-5 text-[#65676b]">
                  자유채팅은 열지 않고, 이 영역에서 서로를 찾기 위한 짧은 안내만 주고받습니다.
                </p>
              </div>
              {myPreMeetingNote?.note ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                  작성 완료
                </span>
              ) : null}
            </div>

            <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-[13px] font-bold leading-6 text-blue-800">
              {/* 예시: “남색 셔츠에 검정 가방을 들고 갈게요. 카페 입구 오른쪽 자리에서 기다리겠습니다.”
              <br /> */}
              복장, 가방/소지품, 카페 안에서 기다릴 위치를 1~2문장으로 적어주세요. 이 한마디가 만남 전 소통 역할을 합니다.
            </div>

            {counterpartPreMeetingNote?.note ? (
              <div className="mt-4 rounded-xl border-solid border border-[#dfe3e8] bg-[#f0f2f5] px-4 py-3">
                <div className="text-[12px] font-bold tracking-[0.16em] text-[#65676b]">상대 한마디</div>
                <div className="mt-2 whitespace-pre-line text-[14px] font-bold leading-6 text-[#1c1e21]">
                  {counterpartPreMeetingNote.note}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-[#f0f2f5] px-4 py-3 text-[13px] font-bold text-[#65676b]">
                아직 상대가 남긴 한마디는 없습니다.
              </div>
            )}

            <textarea
              value={preMeetingNoteText}
              maxLength={160}
              onChange={(event) => setPreMeetingNoteText(event.target.value)}
              rows={4}
              placeholder="예시) 베이지색 자켓에 검정 백팩을 메고 갈게요. 카페 입구 근처에서 기다리겠습니다."
              className="mt-4 w-full rounded-xl border-solid border border-[#dfe3e8] bg-white px-4 py-3 text-[14px] font-semibold leading-6 text-[#1c1e21] outline-none transition focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/10"
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[12px] font-bold text-[#65676b]">
                {preMeetingNoteText.trim().length}/160자
              </div>
              <button
                type="button"
                disabled={savingPreMeetingNote || !preMeetingNoteText.trim()}
                onClick={() => onSavePreMeetingNote?.(preMeetingNoteText)}
                className="h-11 rounded-xl bg-[#1877f2] px-5 text-[13px] font-bold text-white transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingPreMeetingNote ? "저장 중..." : myPreMeetingNote?.note ? "한마디 수정하기" : "한마디 남기기"}
              </button>
            </div>
          </div>

          {isMeetingDay ? (
          <div className="rounded-md border-solid border border-[#dfe3e8] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[18px] font-bold tracking-[-0.04em] text-[#1c1e21]">
                  현장 도착 확인
                </div>
                <p className="mt-1 break-keep text-[13px] font-semibold leading-5 text-[#65676b]">
                  카페에 도착하면 현재 앉아 있는 자리나 테이블 주변을 촬영해 올려주세요. 사진 업로드와 함께 도착 확인이 완료되고, 상대방도 사진을 확인할 수 있습니다.
                </p>
              </div>
              {arrivalConfirmed && myMeetingProof?.photo?.url ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                  도착 확인 완료
                </span>
              ) : null}
            </div>

            <div className="mt-4 rounded-xl border-solid border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-bold leading-6 text-amber-900">
              상대가 노쇼를 신고하더라도 현장사진이 있으면 도착 여부를 확인하는 자료로 활용할 수 있습니다. 현장사진이 없으면 도착 사실 확인이 어려울 수 있으니 반드시 현장에서 촬영해 업로드해주세요.
            </div>

            <div className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-[12px] font-semibold leading-5 text-blue-800">
              서로 쉽게 찾을 수 있도록 내 자리·음료·테이블·매장 일부를 촬영해주세요. 상대방 얼굴이나 다른 고객은 촬영하지 말아주세요.
            </div>

            {counterpartMeetingProof?.photo?.url ? (
              <div className="mt-4 rounded-xl border-solid border border-blue-100 bg-blue-50 p-3">
                <div className="text-[12px] font-bold tracking-[0.14em] text-blue-700">상대 현장 사진</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[160px_1fr] sm:items-center">
                  <button
                    type="button"
                    onClick={() => setExpandedProofPhotoUrl(counterpartMeetingProof.photo.url)}
                    className="group relative w-full overflow-hidden rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-[160px]"
                    aria-label="상대 현장 사진 크게 보기"
                  >
                    <img
                      src={counterpartMeetingProof.photo.url}
                      alt="상대 현장 사진"
                      className="aspect-[4/3] w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-black/65 px-2 py-1.5 text-center text-[11px] font-bold text-white">
                      사진 크게 보기
                    </span>
                  </button>
                  <div>
                    <div className="text-[14px] font-bold text-blue-950">
                      상대방도 현장에 도착해 사진을 등록했어요.
                    </div>
                    <div className="mt-1 break-keep text-[12px] font-semibold leading-5 text-blue-800">
                      사진 속 자리와 상대의 만남 전 한마디를 함께 확인해 서로를 찾아주세요.
                    </div>
                    {counterpartMeetingProof?.uploadedAtClient ? (
                      <div className="mt-2 text-[11px] font-semibold text-blue-700">
                        등록 {formatDateTime(counterpartMeetingProof.uploadedAtClient)}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : counterpartArrivalConfirmed ? (
              <div className="mt-4 rounded-xl border-solid border border-emerald-100 bg-emerald-50 px-4 py-3">
                <div className="text-[12px] font-bold text-emerald-800">
                  상대방은 도착 확인을 완료했습니다.
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-[#f0f2f5] px-4 py-3 text-[13px] font-bold text-[#65676b]">
                아직 상대방의 현장사진은 등록되지 않았습니다.
              </div>
            )}

            {myMeetingProof?.photo?.url ? (
              <div className="mt-4 rounded-xl border-solid border border-emerald-100 bg-emerald-50 p-3">
                <div className="grid gap-3 sm:grid-cols-[120px_1fr] sm:items-center">
                  <img
                    src={myMeetingProof.photo.url}
                    alt="내 현장 사진"
                    className="aspect-[4/3] w-full rounded-lg object-cover sm:w-[120px]"
                  />
                  <div>
                    <div className="text-[13px] font-bold text-emerald-900">내 현장사진이 등록되었습니다.</div>
                    <div className="mt-1 break-keep text-[12px] font-semibold leading-5 text-emerald-800">
                      상대방도 이 사진을 확인할 수 있으며, 노쇼 분쟁이 생기면 운영자가 도착 여부 확인 자료로 참고합니다.
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="block">
                <span className="mb-2 block text-[12px] font-bold text-[#65676b]">현장사진 선택</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setProofFile(event.target.files?.[0] || null)}
                  disabled={savingProofPhoto}
                  className="block w-full rounded-xl border-solid border border-[#dfe3e8] bg-white px-3 py-3 text-[13px] font-semibold text-[#1c1e21] file:mr-3 file:rounded-lg file:border-0 file:bg-[#1877f2] file:px-3 file:py-2 file:text-[12px] file:font-bold file:text-white disabled:opacity-50"
                />
              </label>
              <button
                type="button"
                disabled={!proofFile || savingProofPhoto}
                onClick={submitMeetingProofPhoto}
                className="min-h-[44px] rounded-xl bg-[#1877f2] px-5 text-[13px] font-bold text-white transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingProofPhoto
                  ? `업로드 중 ${proofUploadProgress || 0}%`
                  : arrivalConfirmed
                  ? "현장사진 다시 올리기"
                  : "업로드 및 도착확인 완료"}
              </button>
            </div>

            {proofPreviewUrl ? (
              <div className="mt-3 overflow-hidden rounded-xl border-solid border border-[#dfe3e8] bg-[#f8f9fa] p-3">
                <img src={proofPreviewUrl} alt="선택한 현장 사진 미리보기" className="max-h-[260px] w-full rounded-lg object-contain" />
              </div>
            ) : null}

            {(missingArrivalAlertSent || missingArrivalAlertSending || (missingAlertAvailable && !counterpartArrivalConfirmed)) ? (
              <div className={cx(
                "mt-5 rounded-md border-solid border p-4",
                missingArrivalAlertSent
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-rose-200 bg-rose-50"
              )}>
                <div className={cx(
                  "text-[15px] font-bold tracking-[-0.03em]",
                  missingArrivalAlertSent ? "text-emerald-900" : "text-rose-900"
                )}>
                  {missingArrivalAlertSent
                    ? "상대방에게 도착 확인을 요청했어요"
                    : missingArrivalAlertSending
                    ? "상대방에게 안내 중이에요"
                    : "상대가 아직 도착하지 않았나요?"}
                </div>

                {missingArrivalAlertSent ? (
                  <p className="mt-1 break-keep text-[12px] font-semibold leading-5 text-emerald-800">
                    상대방에게 현재 기다리고 있다는 안내 문자를 보냈습니다. 상대가 도착하면 서로의 현장사진과 위치를 확인해주세요.
                    {myMissingArrivalAlert?.sentAtClient ? ` · ${formatDateTime(myMissingArrivalAlert.sentAtClient)}` : ""}
                  </p>
                ) : missingArrivalAlertSending ? (
                  <p className="mt-1 break-keep text-[12px] font-semibold leading-5 text-rose-800">
                    상대방에게 안내 문자를 보내고 있습니다.
                  </p>
                ) : (
                  <>
                    <p className="mt-1 break-keep text-[12px] font-semibold leading-5 text-rose-800">
                      아직 상대를 만나지 못했다면 상대방에게 현재 기다리고 있다는 안내 문자를 보낼 수 있어요.
                    </p>

                    {!arrivalConfirmed ? (
                      <div className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-[12px] font-bold text-rose-800">
                        먼저 현장사진을 업로드해 도착 확인을 완료해주세요.
                      </div>
                    ) : null}

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        disabled={
                          sendingMissingArrivalAlert ||
                          missingArrivalAlertSending ||
                          !arrivalConfirmed ||
                          missingArrivalAlertSent ||
                          counterpartArrivalConfirmed
                        }
                        onClick={() => onSendMissingArrivalAlert?.()}
                        className="min-h-[44px] rounded-xl bg-rose-600 px-5 text-[13px] font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {sendingMissingArrivalAlert ? "안내 중..." : "상대가 아직 도착하지 않았어요"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
          ) : (
            <div className="rounded-md border-solid border border-[#dfe3e8] bg-[#f8f9fa] p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[15px] font-bold text-blue-700">
                  D
                </div>
                <div>
                  <div className="text-[16px] font-bold tracking-[-0.04em] text-[#1c1e21]">
                    현장 도착 확인은 만남 당일에 열립니다
                  </div>
                  <p className="mt-1 break-keep text-[13px] font-semibold leading-6 text-[#65676b]">
                    약속 당일이 되면 현장사진 업로드와 도착 확인 기능이 이곳에 자동으로 표시됩니다. 미리 눌러 잘못 도착 처리되는 일은 없습니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md border-solid border border-[#dfe3e8] bg-[#f8f9fa] p-5">
            <div className="text-[16px] font-bold tracking-[-0.04em] text-[#1c1e21]">
              현장 문의 안내
            </div>
            <p className="mt-2 break-keep text-[13px] font-semibold leading-6 text-[#65676b]">
              장소에서 상대를 찾기 어렵거나 안전상 불편한 상황이 있으면 먼저 도착 확인과 상대 한마디를 확인해주세요. 그래도 해결이 어렵다면 운영자에게 문의해주세요.
            </p>
            {SUPPORT_CHANNEL_URL ? (
              <a
                href={SUPPORT_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex h-10 items-center justify-center rounded-xl border-solid border border-[#dfe3e8] bg-white px-4 text-[13px] font-bold text-[#1c1e21]"
              >
                운영자에게 문의하기
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {expandedProofPhotoUrl ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="상대 현장 사진 확대 보기"
          onClick={() => setExpandedProofPhotoUrl("")}
        >
          <button
            type="button"
            onClick={() => setExpandedProofPhotoUrl("")}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[24px] font-light leading-none text-zinc-900 shadow-lg sm:right-6 sm:top-6"
            aria-label="확대 사진 닫기"
          >
            ×
          </button>
          <div
            className="flex max-h-[92vh] max-w-[96vw] items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={expandedProofPhotoUrl}
              alt="상대 현장 사진 확대"
              className="max-h-[90vh] max-w-[94vw] rounded-xl bg-black object-contain shadow-2xl"
            />
          </div>
        </div>
      ) : null}

      {cancellationPreview ? (
        <div className="mt-5 rounded-md border border-solid border-rose-200 bg-rose-50 p-4 sm:p-5">
          <div className="text-[15px] font-bold text-rose-900">부득이하게 이번 만남을 취소해야 하나요?</div>
          <p className="mt-1 break-keep text-[12px] font-semibold leading-5 text-rose-800">
            현재 취소 시 예치금 {formatWon(cancellationPreview.amount)}이 차감됩니다. 취소가 완료되면 상대방에게도 바로 안내됩니다.
          </p>
          <button
            type="button"
            disabled={cancellingMatch}
            onClick={() => {
              const confirmed = window.confirm(
                `이번 만남을 취소하시겠습니까?\n현재 취소 시 예치금 ${formatWon(cancellationPreview.amount)}이 차감됩니다.`
              );
              if (confirmed) onCancelMatch?.();
            }}
            className="mt-3 h-10 rounded-xl border border-rose-300 bg-white px-4 text-[12px] font-bold text-rose-700 disabled:opacity-50"
          >
            {cancellingMatch ? "취소 처리 중..." : "이번 만남 취소"}
          </button>
        </div>
      ) : null}

    </SectionCard>
  );
}

function getResultScheduleLabel(status = "", matchStatus = "") {
  if (String(matchStatus || "") === "completed") return "만남 완료";

  const labels = {
    ready: "일정 선택 전",
    needs_first_choice: "일정 선택 중",
    waiting_counterpart: "상대 일정 확인 중",
    needs_final_choice: "최종 일정 선택 중",
    place_pending: "장소 확정 중",
    confirmed: "일정 확정",
    schedule_confirmed: "일정 확정",
    completed: "만남 완료",
    feedback_requested: "피드백 요청",
    paused: "진행 보류",
    cancelled: "취소",
    canceled: "취소",
  };

  return labels[String(status || "")] || (status ? "진행 중" : "대기");
}

function getResultMatchLabel(match = {}, application = {}) {
  const status = String(match?.status || application?.matchingStatus || "");
  const labels = {
    proposed: "후보 제안",
    mutualAccepted: "양쪽 수락",
    confirmed: "만남 확정",
    completed: "만남 완료",
    declined: "이번 제안 종료",
    failed: "매칭 종료",
    cancelled: "취소",
    canceled: "취소",
  };

  return labels[status] || getMatchingStatusLabel(application);
}

function getResultFeedbackLabel({ match = {}, viewerFeedback = null } = {}) {
  if (viewerFeedback?.meetingResult && viewerFeedback.meetingResult !== "met") return "운영자 확인 중";
  if (viewerFeedback?.submittedAtClient || viewerFeedback?.meetingResult) return "제출 완료";

  const labels = {
    waiting: "피드백 대기",
    partial: "피드백 대기",
    completed: "제출 완료",
    issue_reported: "운영자 확인 중",
    timeout_processed: "미응답 기한 종료",
    reviewed: "검토 완료",
  };

  return labels[String(match?.feedbackStatus || "")] || "피드백 대기";
}

function getResultNextRoundLabel({ application = {}, viewerFeedback = null, match = {} } = {}) {
  const nextRoundStatus = String(application?.nextRoundStatus || "");
  const matchingStatus = String(application?.matchingStatus || "");
  const requestStatus = String(match?.nextRoundRequests?.[application?.id]?.status || "");

  if (nextRoundStatus === "top_up_required" || requestStatus === "top_up_required") return "추가 예치 필요";
  if (nextRoundStatus === "refund_requested") return "예치금 반환 처리 중";
  if (nextRoundStatus === "refunded") return "서비스 이용 종료";
  if (nextRoundStatus === "feedback_overdue" || requestStatus === "feedback_overdue") return "피드백 확인 필요";
  if (nextRoundStatus === "admin_review" || requestStatus === "admin_review") return "운영자 확인 중";
  if (nextRoundStatus === "contact_connected" || requestStatus === "contact_connected") return "연락처 공개 후 일시정지";
  if (nextRoundStatus === "user_paused" || requestStatus === "user_paused") return "매칭 일시정지";
  if (nextRoundStatus === "paused" || requestStatus === "paused") return "매칭 일시정지";
  if (nextRoundStatus === "ready" || requestStatus === "queued" || matchingStatus === "not_started") return "다음 매칭 대기";

  if (viewerFeedback?.meetingResult && viewerFeedback.meetingResult !== "met") return "운영자 확인 중";
  if (viewerFeedback?.meetingResult === "met" && String(match?.feedbackStatus || "") === "partial") return "상대 피드백 확인 대기";

  if (matchingStatus === "completed") return "피드백 완료 후 마무리 중";
  return getMatchingStatusLabel(application);
}

function getResultContactLabel(value = "") {
  const labels = {
    mutual_open: "서로에게 공개 완료",
    opened: "서로에게 공개 완료",
    pending: "상호 동의 시 공개",
    hidden: "비공개",
  };

  return labels[String(value || "")] || (value || "상호 동의 시 공개");
}

function hasFeedbackContactConsent(feedback = {}) {
  if (feedback?.meetingResult !== "met") return false;
  const intent = String(feedback?.continueMeetingIntent || feedback?.meetAgainIntent || "");
  if (typeof feedback?.contactShareConsent === "boolean") {
    return intent === "yes" && feedback.contactShareConsent;
  }
  return intent === "yes";
}

function getPostMeetingResultNotice({ application = {}, match = {}, viewerFeedback = null, mutualContact = null } = {}) {
  const matchId = String(match?.id || "");
  const activeMatchId = String(application?.currentProposal?.matchId || "");

  // 다음 매칭이 시작되면 이전 만남의 결과 안내를 새 매칭 화면에 노출하지 않는다.
  if (!matchId || (activeMatchId && activeMatchId !== matchId)) return null;

  const participantIds = [match?.maleApplicationId, match?.femaleApplicationId].filter(Boolean);
  const feedbacks = match?.feedbacks || {};
  const submittedFeedbacks = participantIds.map((id) => feedbacks[id]).filter(Boolean);
  const feedbackStatus = String(match?.feedbackStatus || "");
  const hasPostMeetingContext =
    String(match?.status || "") === "completed" ||
    submittedFeedbacks.length > 0 ||
    ["partial", "completed", "issue_reported", "timeout_processed", "reviewed"].includes(feedbackStatus);

  if (!hasPostMeetingContext) return null;

  const hasIssue =
    feedbackStatus === "issue_reported" ||
    submittedFeedbacks.some((feedback) => feedback?.meetingResult && feedback.meetingResult !== "met");

  if (hasIssue) {
    return {
      label: "RESULT CHECK",
      icon: "🔎",
      title: "만남 내용을 운영자가 확인하고 있어요",
      description: "노쇼·불참 등 확인이 끝나면 결과와 다음 매칭 상태를 안내해드릴게요.",
      className: "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 text-amber-950",
      badgeClassName: "bg-amber-100 text-amber-800",
      iconClassName: "bg-white text-amber-900 ring-amber-200",
    };
  }

  if (feedbackStatus === "timeout_processed") {
    return {
      label: "RESULT CLOSED",
      icon: "🕊️",
      title: "이번 만남은 연락처 공개 없이 마무리됐어요",
      description: "피드백 응답기한이 종료되어 다음 매칭을 준비합니다.",
      className: "border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-slate-50 text-zinc-900",
      badgeClassName: "bg-zinc-200/70 text-zinc-700",
      iconClassName: "bg-white text-zinc-800 ring-zinc-200",
    };
  }

  const bothSubmitted = participantIds.length === 2 && submittedFeedbacks.length === 2;
  if (!bothSubmitted) {
    return {
      label: "RESULT WAITING",
      icon: "💬",
      title: "피드백 결과를 기다리고 있어요",
      description: viewerFeedback
        ? "내 피드백은 제출됐습니다. 상대 피드백이 도착하면 최종 결과를 알려드릴게요."
        : "피드백을 제출하면 두 분의 응답이 모두 도착한 뒤 최종 결과를 알려드릴게요.",
      className: "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-sky-50 text-blue-950",
      badgeClassName: "bg-blue-100 text-blue-700",
      iconClassName: "bg-white text-blue-900 ring-blue-200",
    };
  }

  const mutualSuccess =
    Boolean(mutualContact?.phone) ||
    Boolean(match?.feedbackSummary?.mutualContactConsent) ||
    String(match?.contactOpenStatus || "") === "mutual_open" ||
    submittedFeedbacks.every((feedback) => hasFeedbackContactConsent(feedback));

  if (mutualSuccess) {
    return {
      label: "IT'S A MATCH",
      icon: "🎉",
      title: "서로의 마음이 연결됐어요",
      description: "두 분 모두 만남 이어가기를 선택해 연락처가 공개됩니다.",
      className: "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-blue-50 text-emerald-950 shadow-[0_18px_50px_-28px_rgba(5,150,105,0.55)]",
      badgeClassName: "bg-emerald-100 text-emerald-700",
      iconClassName: "bg-white text-emerald-900 ring-emerald-200",
    };
  }

  return {
    label: "NEXT CHANCE",
    icon: "✨",
    title: "이번 만남은 여기까지예요",
    description: "연락처는 공개되지 않으며, 더 잘 맞는 다음 만남을 준비합니다.",
    className: "border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-blue-50/60 text-zinc-900",
    badgeClassName: "bg-zinc-200/70 text-zinc-700",
    iconClassName: "bg-white text-zinc-800 ring-zinc-200",
  };
}

function getFinalMeetingDateTime(finalMeeting = {}) {
  const time = finalMeeting.finalTimeChoice || finalMeeting.timeChoice || finalMeeting.selectedChoice || {};
  const startAtClient = finalMeeting.startAtClient || time.startAtClient || "";

  if (startAtClient) return formatDateTime(startAtClient);
  return [time.dateLabel || finalMeeting.dateLabel, time.timeLabel || finalMeeting.timeLabel].filter(Boolean).join(" ") || "-";
}

function getFinalMeetingPlace(finalMeeting = {}, schedule = {}) {
  const place = finalMeeting.finalPlaceChoice || finalMeeting.placeChoice || finalMeeting.selectedChoice || {};
  return (
    finalMeeting.placeName ||
    place.cafeName ||
    place.placeName ||
    schedule.placeName ||
    schedule.location ||
    "-"
  );
}

function ResultTab({
  application,
  responseStatus,
  bestMatch,
  mutualContact,
  openingReview,
  updatingMatchingAvailability,
  onOpenReview,
  onSetMatchingAvailability,
}) {
  const proposal = application?.currentProposal || {};
  const match = bestMatch?.match || {};
  const schedule = match?.schedule || application?.schedule || application?.meetingSchedule || {};
  const finalMeeting = bestMatch?.finalMeeting || match?.finalMeeting || schedule?.finalMeeting || {};
  const storedLastFeedback = application?.lastFeedback || null;
  const viewerFeedback =
    match?.feedbacks?.[application?.id] ||
    (storedLastFeedback?.matchId && String(storedLastFeedback.matchId) === String(match?.id || "")
      ? storedLastFeedback
      : null);
  const response = isFinalProposalResponse(responseStatus)
    ? responseStatus
    : isFinalProposalResponse(bestMatch?.viewerResponse?.response)
    ? bestMatch.viewerResponse.response
    : isFinalProposalResponse(proposal.response)
    ? proposal.response
    : isFinalProposalResponse(proposal.status)
    ? proposal.status
    : "";
  const counterpartResponse =
    bestMatch?.counterpartResponse?.response ||
    proposal.counterpartResponse ||
    proposal.partnerResponse ||
    "";
  const counterpartDeclined = counterpartResponse === "declined";
  const viewerContactClosed = Boolean(
    match?.id &&
      (String(application?.lastClosedContactMatchId || "") === String(match.id) ||
        String(match?.contactVisibilityByApplicationId?.[application?.id]?.status || "") === "hidden")
  );
  const viewerContactStatus = viewerContactClosed
    ? "hidden"
    : mutualContact?.phone
    ? "mutual_open"
    : application?.contactOpenStatus || match?.contactOpenStatus || "";

  const postMeetingResultNotice = getPostMeetingResultNotice({
    application,
    match,
    viewerFeedback,
    mutualContact,
  });

  const scheduleStatus = String(
    match?.meetingStatus ||
      match?.scheduleStatus ||
      schedule?.status ||
      application?.meetingStatus ||
      application?.scheduleStatus ||
      ""
  );

  return (
    <SectionCard title="이번 소개의 결과">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatusBox label="내 응답" value={getResponseLabel(response)} tone="blue" />
        <StatusBox label="상대 응답" value={getResponseLabel(counterpartResponse)} />
        <StatusBox label="만남 결과" value={getResultMatchLabel(match, application)} tone={match?.status === "completed" ? "good" : getStatusTone("matching", application?.matchingStatus)} />
        <StatusBox label="다음 매칭" value={getResultNextRoundLabel({ application, viewerFeedback, match })} />
      </div>

      {postMeetingResultNotice ? (
        <div
          className={`relative mt-5 overflow-hidden rounded-[24px] border border-solid px-5 py-8 text-center sm:px-8 sm:py-10 ${postMeetingResultNotice.className}`}
          role="status"
        >
          <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/55" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/45" />
          <div className="relative mx-auto flex max-w-2xl flex-col items-center">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full text-[32px] shadow-sm ring-1 ring-inset sm:h-[72px] sm:w-[72px] sm:text-[36px] ${postMeetingResultNotice.iconClassName}`}
              aria-hidden="true"
            >
              {postMeetingResultNotice.icon}
            </div>
            <div className={`mt-5 rounded-full px-3 py-1 text-[11px] font-black tracking-[0.16em] ${postMeetingResultNotice.badgeClassName}`}>
              {postMeetingResultNotice.label}
            </div>
            <div className="mt-3 break-keep text-[24px] font-black tracking-[-0.045em] sm:text-[30px]">
              {postMeetingResultNotice.title}
            </div>
            <p className="mt-2 break-keep text-[13px] font-semibold leading-6 opacity-80 sm:text-[14px]">
              {postMeetingResultNotice.description}
            </p>
          </div>
        </div>
      ) : null}

      {counterpartDeclined ? (
        <div className="mt-4 rounded-xl border border-solid border-blue-100 bg-blue-50 p-4 text-center">
          <div className="text-[16px] font-bold text-blue-900">이번 제안은 아쉽게 연결되지 않았어요</div>
          <p className="mt-1 text-[13px] font-semibold leading-5 text-blue-800">
            한 번의 선택이 회원님의 매력이나 가치를 뜻하는 것은 아닙니다. 더 잘 맞는 다음 만남을 준비하겠습니다.
          </p>
        </div>
      ) : null}

      <div className="mt-4 rounded-xl border-solid border border-[#dfe3e8] p-4">
        <Row label="일정 상태" value={getResultScheduleLabel(scheduleStatus, match?.status)} />
        <Row label="만남 일시" value={getFinalMeetingDateTime(finalMeeting)} />
        <Row label="장소" value={getFinalMeetingPlace(finalMeeting, schedule)} />
        <Row label="연락처 공개" value={getResultContactLabel(viewerContactStatus)} />
        <Row label="피드백" value={getResultFeedbackLabel({ match, viewerFeedback })} />
      </div>


      {mutualContact?.phone && !viewerContactClosed ? (
        <div className="mt-4 rounded-md border border-solid border-emerald-200 bg-emerald-50 p-5">
          <div className="text-[17px] font-bold text-emerald-900">상대방 연락처</div>
          <p className="mt-1 text-[13px] font-semibold leading-6 text-emerald-800">
            서로 연락처 공개에 동의해 상대 연락처가 공개되었습니다.
          </p>
          <div className="mt-3 rounded-xl bg-white px-4 py-3">
            <div className="text-[12px] font-bold text-[#65676b]">{mutualContact.name || "상대방"}</div>
            <div className="mt-1 text-[20px] font-bold tracking-[-0.03em] text-[#1c1e21]">{formatPhone(mutualContact.phone)}</div>
          </div>
        </div>
      ) : null}

      {viewerFeedback?.meetingResult === "met" ? (
        <div className="mt-4 rounded-xl border border-solid border-orange-200 bg-orange-50 p-4">
          <div className="text-[15px] font-bold text-orange-950">이번 투윅스 경험을 한 줄로 남겨주세요.</div>
          <p className="mt-1 break-keep text-[12px] font-semibold leading-5 text-orange-900/80">
            실제 후기가 쌓일수록 투윅스를 믿고 참여하는 좋은 회원이 늘고, 다음 매칭의 선택지도 더 좋아질 수 있습니다. 후기는 선택이며 공개 여부도 직접 정할 수 있습니다.
          </p>
          <button
            type="button"
            disabled={openingReview}
            onClick={() => onOpenReview?.()}
            className="mt-3 min-h-[44px] rounded-xl border border-solid border-orange-300 bg-white px-4 py-3 text-[13px] font-bold text-orange-800 transition hover:border-orange-500 disabled:opacity-50"
          >
            {openingReview ? "후기 페이지 준비 중..." : "1분 후기 남기기 · 선택"}
          </button>
        </div>
      ) : null}

      {viewerFeedback?.meetingResult === "met" ? (
        <div className="mt-4 rounded-xl border border-solid border-[#dfe3e8] bg-[#f8f9fa] p-4">
          <div className="text-[13px] font-bold text-[#1c1e21]">매칭 상태</div>
          {["user_paused", "contact_connected"].includes(String(application?.nextRoundStatus || "")) && String(application?.matchingStatus || "") === "paused" ? (
            <>
              <p className="mt-1 break-keep text-[13px] font-semibold leading-6 text-[#65676b]">
                {String(application?.nextRoundStatus || "") === "contact_connected"
                  ? "두 분의 연락처가 서로 공개되어 새로운 매칭은 잠시 쉬고 있습니다. 다시 소개를 받고 싶을 때 아래 버튼을 눌러주세요."
                  : "새로운 매칭을 잠시 쉬고 있습니다. 다시 소개를 받고 싶을 때 아래 버튼을 눌러주세요."}
              </p>
              <button
                type="button"
                disabled={updatingMatchingAvailability}
                onClick={() => onSetMatchingAvailability?.("resume")}
                className="mt-3 min-h-[46px] rounded-xl bg-[#1877f2] px-4 py-3 text-[14px] font-bold text-white disabled:opacity-50"
              >
                {updatingMatchingAvailability ? "변경 중..." : "매칭 다시 시작하기"}
              </button>
            </>
          ) : String(application?.nextRoundStatus || "") === "ready" && String(application?.matchingStatus || "") === "not_started" ? (
            <>
              <p className="mt-1 break-keep text-[13px] font-semibold leading-6 text-[#65676b]">
                현재 새로운 매칭을 받을 수 있는 상태입니다. 잠시 쉬고 싶다면 일시정지할 수 있습니다.
              </p>
              <button
                type="button"
                disabled={updatingMatchingAvailability}
                onClick={() => onSetMatchingAvailability?.("pause")}
                className="mt-3 min-h-[46px] rounded-xl border border-solid border-[#dfe3e8] bg-white px-4 py-3 text-[14px] font-bold text-[#1c1e21] disabled:opacity-50"
              >
                {updatingMatchingAvailability ? "변경 중..." : "매칭 잠시 쉬기"}
              </button>
            </>
          ) : String(match?.feedbackStatus || "") === "partial" ? (
            <p className="mt-1 break-keep text-[13px] font-semibold leading-6 text-[#65676b]">
              내 피드백은 제출되었습니다. 상대 피드백까지 확인되면 상호 연락처 공개가 성립한 경우에만 새 매칭이 일시정지되고, 그 외에는 다음 매칭 대기로 자동 전환됩니다.
            </p>
          ) : String(application?.nextRoundStatus || "") === "top_up_required" ? (
            <p className="mt-1 break-keep text-[13px] font-semibold leading-6 text-[#65676b]">
              다음 매칭을 시작하려면 예치금 추가 확인이 필요합니다. 예치금 탭을 확인해주세요.
            </p>
          ) : (
            <p className="mt-1 break-keep text-[13px] font-semibold leading-6 text-[#65676b]">
              현재 상태 확인이 필요한 경우 운영자 안내를 확인해주세요.
            </p>
          )}
        </div>
      ) : null}
    </SectionCard>
  );
}

export default function ProposalDashboard({
  requestedTab = "",
  requestedSection = "",
  verifiedProfile,
  application,
  bestMatch,
  cafeCandidates = [],
  loading,
  responseStatus,
  savingResponse,
  savingSchedule,
  savingPreMeetingNote,
  savingAttendance,
  sendingMissingArrivalAlert,
  savingProofPhoto,
  proofUploadProgress,
  savingProfile,
  profileUploadProgress,
  requestingDepositRefund,
  mutualContact,
  cancellingMatch,
  openingFeedback,
  openingReview,
  updatingMatchingAvailability,
  onRespond,
  onSaveScheduleChoices,
  onSaveFinalScheduleChoice,
  onSavePreMeetingNote,
  onSaveMeetingAttendance,
  onSendMissingArrivalAlert,
  onSaveMeetingProofPhoto,
  onSaveProfile,
  onSubmitVerificationDocument,
  onRequestDepositRefund,
  onLoadWithdrawalPreview,
  onRequestWithdrawal,
  submittingWithdrawal,
  onCancelMatch,
  onOpenFeedback,
  onOpenReview,
  onSetMatchingAvailability,
  onResetIdentity,
  onDashboardLogout,
}) {
  const router = useRouter();
  const tabSection = sectionForTab;
  const allowedSections = new Set(["home", "intro", "my"]);
  const [activeSection, setActiveSection] = useState(() =>
    allowedSections.has(requestedSection) ? requestedSection : requestedTab ? tabSection(requestedTab) : "home"
  );
  const [activeTab, setActiveTab] = useState(() => requestedTab || (requestedSection === "my" ? "overview" : "candidate"));
  const [tabLoading, setTabLoading] = useState(false);
  const tabLoadingTimerRef = useRef(null);
  const [confirmType, setConfirmType] = useState("");
  const dashboardNowMs = useNowMs(15000);
  const [introHistory, setIntroHistory] = useState([]);
  const [introHistoryLoading, setIntroHistoryLoading] = useState(false);
  const [introHistoryError, setIntroHistoryError] = useState(false);
  const introHistoryLoadedRef = useRef("");
  const introHistoryPendingRef = useRef(false);

  const feedbackMatch = bestMatch?.match || {};
  const feedbackFinalMeeting =
    bestMatch?.finalMeeting ||
    feedbackMatch?.finalMeeting ||
    feedbackMatch?.schedule?.finalMeeting ||
    {};
  const feedbackMeetingStartMs = getTimeMs(
    feedbackFinalMeeting?.startAtClient ||
      feedbackFinalMeeting?.finalTimeChoice?.startAtClient ||
      feedbackFinalMeeting?.timeChoice?.startAtClient ||
      feedbackFinalMeeting?.selectedChoice?.startAtClient
  );
  const viewerFeedback = application?.id ? feedbackMatch?.feedbacks?.[application.id] : null;
  const feedbackMatchStatus = String(feedbackMatch?.status || "");
  const feedbackMeetingStatus = String(
    feedbackMatch?.meetingStatus || feedbackMatch?.meetingLifecycleStatus || ""
  );
  const bestMatchId = String(feedbackMatch?.id || bestMatch?.matchId || "");
  const currentProposalMatchId = String(application?.currentProposal?.matchId || "");
  const lastCompletedMatchId = String(application?.lastCompletedMatchId || "");
  const storedLastFeedback = application?.lastFeedback || null;
  const feedbackReady = Boolean(
    application?.id &&
      bestMatchId &&
      lastCompletedMatchId === bestMatchId &&
      feedbackMatchStatus === "completed" &&
      feedbackMeetingStatus === "feedback_requested" &&
      feedbackMeetingStartMs &&
      dashboardNowMs >= feedbackMeetingStartMs + 60 * 60 * 1000 &&
      !viewerFeedback &&
      !(storedLastFeedback?.matchId === bestMatchId && storedLastFeedback?.status === "completed")
  );

  const terminalMatchStatuses = new Set([
    "completed",
    "failed",
    "expired",
    "declined",
    "counterpart_expired",
    "cancelled",
    "canceled",
    "proposal_expired",
    "schedule_expired",
  ]);
  const activeBestMatch =
    currentProposalMatchId &&
    currentProposalMatchId === bestMatchId &&
    !terminalMatchStatuses.has(feedbackMatchStatus)
      ? bestMatch
      : null;

  const proposalDueAt = getProposalDueAt(application, activeBestMatch);
  const schedule = getScheduleFromMatch(activeBestMatch);
  const scheduleStatus = getScheduleStatus(activeBestMatch);
  const scheduleOpen = isScheduleOpen(activeBestMatch);
  const scheduleDueAt = scheduleOpen ? getScheduleDueAtByStatus(schedule, scheduleStatus) : "";
  const hasCandidate = Boolean(activeBestMatch?.candidate);
  const hasFinalResponse = isFinalProposalResponse(responseStatus);
  const counterpartDeclined =
    activeBestMatch?.counterpartResponse?.response === "declined" ||
    (String(activeBestMatch?.match?.status || "") === "declined" &&
      String(activeBestMatch?.match?.declinedByApplicationId || "") &&
      String(activeBestMatch?.match?.declinedByApplicationId || "") !== String(application?.id || ""));
  const proposalExpired = proposalDueAt ? isDueExpired(proposalDueAt) : false;
  const scheduleActionRequired = isScheduleActionRequiredForMe(application, activeBestMatch);
  const introJourney = resolveIntroJourney({
    application, bestMatch: activeBestMatch, responseStatus, feedbackReady,
    scheduleActionRequired, scheduleOpen, proposalExpired,
    proposalDueAt, scheduleDueAt, nowMs: dashboardNowMs,
  });

  useEffect(() => {
    introHistoryLoadedRef.current = "";
    introHistoryPendingRef.current = false;
    setIntroHistory([]);
    setIntroHistoryError(false);
  }, [application?.id, application?.lastCompletedMatchId, application?.currentProposal?.matchId]);

  const loadIntroHistory = async () => {
    const id = String(application?.id || "");
    if (!id || introHistoryLoadedRef.current === id || introHistoryPendingRef.current) return;
    introHistoryPendingRef.current = true;
    setIntroHistoryLoading(true);
    setIntroHistoryError(false);
    try {
      const history = await loadRecentIntroHistory(id, "");
      if (String(application?.id || "") !== id) return;
      setIntroHistory(history);
      introHistoryLoadedRef.current = id;
    } catch (error) {
      console.warn("[TwoWeeksIntro] history unavailable:", error?.code || error?.message);
      setIntroHistoryError(true);
    } finally {
      introHistoryPendingRef.current = false;
      setIntroHistoryLoading(false);
    }
  };

  // Fetch allowed result summaries when entering 소개, not only after opening a hidden history section.
  useEffect(() => {
    if (activeSection === "intro" && application?.id && introHistoryLoadedRef.current !== application.id && !introHistoryPendingRef.current) {
      loadIntroHistory();
    }
  }, [activeSection, application?.id]);

  const tabMeta = {
    candidate:
      hasCandidate && !hasFinalResponse && !counterpartDeclined
        ? {
            badge: proposalExpired ? "기한종료" : "NEW",
            dueAt: proposalDueAt,
            urgent: !proposalExpired,
          }
        : null,
    schedule:
      scheduleOpen && scheduleActionRequired
        ? {
            badge: "작성필요",
            dueAt: scheduleDueAt,
            urgent: true,
          }
        : scheduleOpen
        ? {
            badge: scheduleStatus === "confirmed" ? "확정" : "",
            dueAt: scheduleDueAt,
            urgent: false,
          }
        : null,
    result: feedbackReady
      ? {
          badge: "피드백",
          dueAt: "",
          urgent: true,
        }
      : null,
  };

  const currentLoadingMessage = TAB_LOADING_MESSAGES[activeTab] || TAB_LOADING_MESSAGES.status;

  useEffect(() => {
    return () => {
      if (tabLoadingTimerRef.current) {
        clearTimeout(tabLoadingTimerRef.current);
      }
    };
  }, []);

  const changeDestination = (section, tab = "") => {
    const safeSection = allowedSections.has(section) ? section : "home";
    const safeTab = ["candidate", "schedule", "result", "profile", "status", "deposit", "invite", "overview", "conditions", "availability", "withdrawal"].includes(tab) ? tab : "";
    setActiveSection(safeSection);
    if (safeTab) setActiveTab(safeTab);
    const query = { ...router.query, section: safeSection };
    if (safeTab) query.tab = safeTab;
    else delete query.tab;
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true }).catch(console.error);
  };

  const handleTabChange = (nextTab) => {
    if (!nextTab || nextTab === activeTab) return;

    if (tabLoadingTimerRef.current) {
      clearTimeout(tabLoadingTimerRef.current);
    }

    setActiveTab(nextTab);
    setTabLoading(true);

    tabLoadingTimerRef.current = setTimeout(() => {
      setTabLoading(false);
      tabLoadingTimerRef.current = null;
    }, 220);
  };

  useEffect(() => {
    const allowedTabs = [...TABS.map((tab) => tab.id), "overview", "conditions", "availability", "withdrawal"];
    const nextTab = String(requestedTab || "");

    if (!allowedTabs.includes(nextTab) || nextTab === activeTab) return;
    if (!allowedSections.has(requestedSection)) setActiveSection(tabSection(nextTab));
    setActiveTab(nextTab);
    setTabLoading(true);

    if (tabLoadingTimerRef.current) {
      clearTimeout(tabLoadingTimerRef.current);
    }

    tabLoadingTimerRef.current = setTimeout(() => {
      setTabLoading(false);
      tabLoadingTimerRef.current = null;
    }, 220);
  }, [requestedTab]);

  useEffect(() => {
    if (allowedSections.has(requestedSection)) {
      setActiveSection(requestedSection);
      if (!requestedTab && requestedSection === "my") setActiveTab("overview");
      if (!requestedTab && requestedSection === "intro") setActiveTab("candidate");
    } else if (requestedTab) setActiveSection(tabSection(requestedTab));
  }, [requestedSection, requestedTab]);

  const handleConfirmResponse = async (type, declineReason = null) => {
    const saved = await onRespond?.(type, declineReason);
    if (saved !== false) setConfirmType("");
  };

  return (
    <main className="min-h-[calc(100svh-64px)] bg-[#f7f8f6] px-4 pb-28 pt-5 text-[#122841] sm:px-5 md:min-h-[calc(100svh-80px)] md:pt-7">
      <div className="mx-auto w-full max-w-[640px]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="mt-2 text-[27px] font-black leading-tight tracking-[-0.055em] text-[#122841] sm:text-[32px]">
              {activeSection === "home" ? "오늘의 투윅스" : activeSection === "intro" ? "나의 소개" : activeTab !== "overview" ? ({profile:"내 프로필",conditions:"나의 소개조건",availability:"활동지역·가능시간",status:"신청·인증현황",deposit:"만남 보증금",invite:"친구 초대",withdrawal:"회원 탈퇴"}[activeTab] || "마이페이지") : "마이페이지"}
            </h1>
            {/* <p className="mt-1.5 break-keep text-[13px] leading-6 text-[#71829a]">
              {activeSection === "home" ? "내 만남 진행 상태" : activeSection === "intro" ? "이번 소개와 만남 기록" : activeTab !== "overview" ? "" : "내 정보와 설정"}
            </p> */}
          </div>
          {activeSection === "my" && activeTab !== "overview" ? <button type="button" onClick={() => changeDestination("my","overview")} className="mt-1 shrink-0 rounded-full border shadow border-[#dce4ee] bg-white px-4 py-2 text-[13px] font-bold text-[#426d9e] transition hover:border-[#a2bede] hover:bg-[#edf4ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#326bda]">← MY</button> : null}
        </div>

        {loading ? (
          <DashboardLoadingPanel
            title="신청현황을 다시 불러오는 중입니다"
            desc="최신 매칭, 일정, 문자 발송 상태를 확인하고 있습니다."
          />
        ) : tabLoading ? (
          <DashboardLoadingPanel
            title={currentLoadingMessage.title}
            desc={currentLoadingMessage.desc}
          />
        ) : application ? (
          activeSection === "home" ? <div className="mt-5"><HomeTab
            application={application} bestMatch={activeBestMatch} responseStatus={responseStatus}
            feedbackReady={feedbackReady} scheduleActionRequired={scheduleActionRequired} scheduleOpen={scheduleOpen} counterpartDeclined={counterpartDeclined}
            proposalExpired={proposalExpired} proposalDueAt={proposalDueAt} scheduleDueAt={scheduleDueAt}
            nowMs={dashboardNowMs} introJourney={introJourney} onNavigate={(tab) => changeDestination(tabSection(tab), tab)} onOpenFeedback={onOpenFeedback}
          /></div> :
          <div className="mt-4 sm:mt-5">
            {activeSection === "intro" ? (
              <IntroJourneyTab
                journey={introJourney}
                nowMs={dashboardNowMs}
                application={application}
                activeTab={activeTab}
                onChangeTab={(tab) => changeDestination("intro", tab)}
                onOpenFeedback={onOpenFeedback}
                onGoMy={(tab) => changeDestination("my", tab)}
                historyItems={introHistory}
                historyLoading={introHistoryLoading}
                historyError={introHistoryError}
                onLoadHistory={loadIntroHistory}
              >
                {{
                  candidate: (<CandidateTab
                application={application}
                bestMatch={activeBestMatch}
                responseStatus={responseStatus}
                savingResponse={savingResponse}
                onRequestRespond={setConfirmType}
              />),
                  schedule: (<ScheduleTab
                application={application}
                bestMatch={activeBestMatch}
                cafeCandidates={cafeCandidates}
                savingSchedule={savingSchedule}
                savingPreMeetingNote={savingPreMeetingNote}
                savingAttendance={savingAttendance}
                sendingMissingArrivalAlert={sendingMissingArrivalAlert}
                savingProofPhoto={savingProofPhoto}
                proofUploadProgress={proofUploadProgress}
                cancellingMatch={cancellingMatch}
                onSaveScheduleChoices={onSaveScheduleChoices}
                onSaveFinalScheduleChoice={onSaveFinalScheduleChoice}
                onSavePreMeetingNote={onSavePreMeetingNote}
                onSaveMeetingAttendance={onSaveMeetingAttendance}
                onSendMissingArrivalAlert={onSendMissingArrivalAlert}
                onSaveMeetingProofPhoto={onSaveMeetingProofPhoto}
                onCancelMatch={onCancelMatch}
              />),
                  result: (<ResultTab
                application={application}
                responseStatus={responseStatus}
                bestMatch={bestMatch}
                mutualContact={mutualContact}
                openingReview={openingReview}
                updatingMatchingAvailability={updatingMatchingAvailability}
                onOpenReview={onOpenReview}
                onSetMatchingAvailability={onSetMatchingAvailability}
              />),
                }}
              </IntroJourneyTab>
            ) : null}
            {activeSection === "my" ? <MyPage
              application={application}
              view={activeTab}
              onNavigate={(tab) => changeDestination("my", tab)}
              onGoIntro={() => changeDestination("intro", "candidate")}
              onLogout={onDashboardLogout || onResetIdentity}
              busyMatching={updatingMatchingAvailability}
              onMatchingChange={onSetMatchingAvailability}
              profileContent={<ProfileTab application={application} savingProfile={savingProfile} profileUploadProgress={profileUploadProgress} onSaveProfile={onSaveProfile} onSubmitVerificationDocument={onSubmitVerificationDocument}/>}
              statusContent={<StatusTab application={application}/>}
              depositContent={<DepositTab application={application} requestingDepositRefund={requestingDepositRefund} onRequestDepositRefund={onRequestDepositRefund}/>}
              inviteContent={<MyFriendInviteTab application={application}/>}
              withdrawalContent={<WithdrawalModal open={activeTab === "withdrawal"} application={application} submitting={submittingWithdrawal} onClose={() => changeDestination("my", "overview")} onLoadPreview={onLoadWithdrawalPreview} onSubmit={onRequestWithdrawal}/>}
            /> : null}

          </div>
        ) : (
          <div className="mt-5 rounded-xl border-solid border border-[#dfe3e8] bg-white p-8 text-center">
            <h2 className="text-[22px] font-bold tracking-[-0.04em] text-[#1c1e21]">
              신청내역이 없습니다.
            </h2>
          </div>
        )}
      </div>

      <DashboardBottomNav activeSection={activeSection} onChange={(section) => changeDestination(section, section === "intro" ? (introJourney.target === "schedule" ? "schedule" : introJourney.target === "result" || introJourney.target === "feedback" ? "result" : "candidate") : section === "my" ? "overview" : "")} />
      <ResponseConfirmModal
        type={confirmType}
        saving={savingResponse}
        onClose={() => setConfirmType("")}
        onConfirm={handleConfirmResponse}
      />
    </main>
  );
}
