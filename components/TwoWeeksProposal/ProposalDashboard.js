import { useEffect, useMemo, useState } from "react";
import MyProfileEditModal from "./MyProfileEditModal";
import LoadingSpinner from "../TwoWeeksShared/LoadingSpinner";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getBasic(application = {}) {
  return application?.basic || {};
}

function getIdentity(application = {}) {
  return application?.identity || {};
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
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

  return labels[status] || status || "-";
}

function getDepositStatusLabel(application = {}) {
  const status = String(application?.deposit?.status || "pending");

  const labels = {
    pending: "입금 대기",
    confirmed: "입금 확인",
    refunded: "환불",
  };

  return labels[status] || status || "-";
}

function getMatchingStatusLabel(application = {}) {
  const status = String(application?.matchingStatus || "not_started");

  const labels = {
    not_started: "매칭 대기",
    proposed: "후보 제안 도착",
    accepted: "응답 완료",
    declined: "응답 완료",
    confirmed: "만남 확정",
    completed: "만남 완료",
    cancelled: "취소",
    failed: "매칭 실패",
  };

  return labels[status] || status || "-";
}

function getResponseLabel(value = "") {
  const labels = {
    accepted: "만남 진행 의사 전달",
    declined: "이번 만남 보류",
    pending: "응답 대기",
    confirmed: "확정",
  };

  return labels[value] || value || "응답 전";
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
    if (status === "refunded") return "bad";
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

function getPhotos(application = {}) {
  const identity = getIdentity(application);
  const photos = [];

  if (identity.representativePhoto?.url) {
    photos.push({
      label: "대표",
      url: identity.representativePhoto.url,
    });
  }

  normalizeArray(identity.additionalPhotos).forEach((photo, index) => {
    if (photo?.url) {
      photos.push({
        label: `Sub ${index + 1}`,
        url: photo.url,
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
  if (["confirmed", "completed"].includes(matchingStatus)) return false;
  if (["confirmed", "completed"].includes(scheduleStatus)) return false;
  if (["confirmed", "completed"].includes(proposalStatus)) return false;

  return true;
}

function Row({ label, value, large = false }) {
  return (
    <div className="grid grid-cols-[84px_1fr] items-center gap-3 border-solid border-t border-[#edf0f3] py-3 first:border-t-0 sm:grid-cols-[110px_1fr]">
      <div className="text-[13px] font-semibold leading-5 text-[#65676b]">{label}</div>
      <div
        className={cx(
          "break-keep font-semibold tracking-[-0.015em] text-[#1c1e21]",
          large ? "text-[16px] leading-7 sm:text-[17px]" : "text-[15px] leading-6 sm:text-[16px]"
        )}
      >
        {value || "-"}
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
    neutral: "border-[#dfe3e8] bg-white text-[#1c1e21]",
    blue: "border-blue-100 bg-blue-50 text-blue-800",
    good: "border-emerald-100 bg-emerald-50 text-emerald-800",
    warn: "border-amber-100 bg-amber-50 text-amber-800",
    orange: "border-orange-100 bg-orange-50 text-orange-800",
    bad: "border-rose-100 bg-rose-50 text-rose-800",
  }[tone] || "border-[#dfe3e8] bg-white text-[#1c1e21]";

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
    <section className="rounded-xl border border-[#dfe3e8] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow ? (
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-500">
              {eyebrow}
            </div>
          ) : null}
          <h2 className="mt-1.5 text-[24px] font-bold tracking-[-0.045em] text-[#1c1e21] sm:text-[28px]">
            {title}
          </h2>
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function BlurNotice() {
  return (
    <div className="mt-3 rounded-lg bg-[#f0f2f5] px-3 py-3 text-[13px] font-medium leading-6 text-[#65676b]">
      만남이 확정되면, 운영 안내와 함께 상대방의 사진 및 만남 관련 정보가 안내됩니다.
    </div>
  );
}


function PhotoStrip({
  photos = [],
  blurred = false,
  compact = false,
  showBlurNotice = false,
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loadedUrls, setLoadedUrls] = useState({});
  const safePhotos = Array.isArray(photos) ? photos.filter((photo) => photo?.url) : [];
  const photoKey = safePhotos.map((photo) => photo.url).join("|");

  useEffect(() => {
    setSelectedIndex(0);
    setLoadedUrls({});
  }, [photoKey]);

  const markLoaded = (url) => {
    setLoadedUrls((prev) => ({ ...prev, [url]: true }));
  };

  if (!safePhotos.length) {
    return (
      <div
        className={cx(
          "flex items-center justify-center rounded-xl border border-[#dfe3e8] bg-[#f0f2f5] text-sm font-semibold text-[#65676b]",
          compact ? "min-h-[180px]" : "min-h-[260px]"
        )}
      >
        사진 확인 중
      </div>
    );
  }

  const selectedPhoto = safePhotos[selectedIndex] || safePhotos[0];

  return (
    <div className={cx("w-full", compact ? "max-w-[260px]" : "max-w-[360px]")}>
      <div className="overflow-hidden rounded-xl border border-[#dfe3e8] bg-[#f0f2f5]">
        <div className="relative aspect-[4/5]">
          {!loadedUrls[selectedPhoto.url] ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#f0f2f5]">
              <LoadingSpinner size="md" tone="blue" />
            </div>
          ) : null}
          <img
            src={selectedPhoto.url}
            alt={selectedPhoto.label || "프로필 사진"}
            onLoad={() => markLoaded(selectedPhoto.url)}
            className={cx(
              "h-full w-full object-cover",
              !loadedUrls[selectedPhoto.url] ? "opacity-0" : "opacity-100",
              blurred ? "scale-105 blur-[6px] brightness-95" : ""
            )}
          />
          <div className="absolute left-3 top-3 rounded-md bg-black/65 px-2.5 py-1 text-[11px] font-bold text-white">
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
                  {!loadedUrls[photo.url] ? (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#f0f2f5]">
                      <LoadingSpinner size="sm" tone="blue" />
                    </div>
                  ) : null}
                  <img
                    src={photo.url}
                    alt={photo.label || `프로필 사진 ${index + 1}`}
                    onLoad={() => markLoaded(photo.url)}
                    className={cx(
                      "h-full w-full object-cover",
                      !loadedUrls[photo.url] ? "opacity-0" : "opacity-100",
                      blurred ? "scale-105 blur-[8px] brightness-95" : ""
                    )}
                  />
                  <div
                    className={cx(
                      "absolute inset-x-0 bottom-0 px-1 py-1 text-center text-[10px] font-bold text-white",
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

      {showBlurNotice ? <BlurNotice /> : null}
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
  const status = getScheduleStatus(bestMatch);
  const matchStatus = String(bestMatch?.match?.status || "");

  return (
    SCHEDULE_OPEN_STATUSES.includes(status) &&
    (bestMatch?.bothAccepted === true || ["mutualAccepted", "confirmed"].includes(matchStatus))
  );
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

function isPhotoRevealed(application = {}, bestMatch = {}) {
  const status = getScheduleStatus(bestMatch);
  return (
    application?.photoRevealStatus === "revealed" ||
    application?.currentProposal?.photoRevealStatus === "revealed" ||
    bestMatch?.photoRevealStatus === "revealed" ||
    bestMatch?.match?.photoRevealStatus === "revealed" ||
    ["place_pending", "confirmed"].includes(status)
  );
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

function getCafeOptions(area = "") {
  return CAFE_POOLS[area] || CAFE_POOLS[MANAGED_AREAS[0]] || [];
}

function getCafeById(area = "", cafeId = "") {
  const cafes = getCafeOptions(area);
  return cafes.find((cafe) => cafe.id === cafeId) || cafes[0] || null;
}

function getCafeMapUrl(cafe = {}) {
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
  return [choice.dateLabel, choice.timeLabel].filter(Boolean).join(" · ") || "-";
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

function CafeSelectGrid({ area, selectedCafeIds = [], onToggle, maxCount = 3 }) {
  const cafes = getCafeOptions(area);
  const selectedIds = Array.isArray(selectedCafeIds) ? selectedCafeIds : [];

  if (!cafes.length) return null;

  return (
    <div className="mt-5 rounded-2xl border-solid border border-[#dfe3e8] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[17px] font-bold tracking-[-0.04em] text-[#1c1e21]">3. 장소 후보 3개 선택</div>
          <p className="mt-1 break-keep text-[13px] font-semibold leading-5 text-[#65676b]">
            구를 바꿔가며 카페 후보를 총 3개까지 선택할 수 있습니다.
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
                "group rounded-2xl border-solid border p-4 text-left transition",
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

const TABS = [
  { id: "candidate", label: "대상후보" },
  { id: "schedule", label: "일정조율" },
  { id: "status", label: "신청현황" },
  { id: "profile", label: "내 프로필" },
  { id: "result", label: "결과보기" },
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
  if (!type) return null;

  const isAccept = type === "accepted";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[440px] rounded-2xl bg-white p-5 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
        <div className="text-[22px] font-bold tracking-[-0.04em] text-[#1c1e21]">
          {isAccept ? "이 만남을 진행할까요?" : "이번 만남을 쉬어갈까요?"}
        </div>

        {isAccept ? (
          <div className="mt-3 space-y-2 text-[14px] font-medium leading-6 text-[#65676b]">
            <p>진행 의사를 보내면 운영자가 상대 응답과 가능 일정을 확인합니다.</p>
            <p>이후 카페 장소, 시간 조율, 만남 전 안내가 순서대로 전달됩니다.</p>
            <p>연락처는 만남 후 서로 연결을 희망할 때 공개됩니다.</p>
          </div>
        ) : (
          <div className="mt-3 space-y-2 text-[14px] font-medium leading-6 text-[#65676b]">
            <p>이번 만남은 패스 처리됩니다.</p>
            <p>반복적인 패스/보류는 추후 매칭 노출이 줄어들 수 있습니다.</p>
            <p>상대에게는 상세 사유가 공개되지 않습니다.</p>
          </div>
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
            onClick={() => onConfirm(type)}
            disabled={saving}
            className={cx(
              "h-12 rounded-lg text-[15px] font-bold text-white disabled:opacity-60",
              isAccept ? "bg-[#1877f2] hover:bg-[#166fe5]" : "bg-[#1c1e21] hover:bg-black"
            )}
          >
            {isAccept ? "진행 의사 보내기" : "보류하기"}
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
            label="입금 상태"
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
          <Row label="예치금" value={`${deposit.amount ? `${deposit.amount.toLocaleString()}원` : "-"} · ${getDepositStatusLabel(application)}`} />
          <Row label="회차" value={application?.roundLabel || application?.roundId || "-"} />
          <Row label="신청일" value={formatDateTime(application?.submittedAt || application?.createdAt || application?.completedAtClient)} />
        </div>
      </SectionCard>
    </div>
  );
}

function ProfileTab({
  application,
  savingProfile,
  profileUploadProgress,
  onSaveProfile,
}) {
  const [editOpen, setEditOpen] = useState(false);
  const basic = getBasic(application);
  const identity = getIdentity(application);
  const photos = getPhotos(application);
  const editable = isProfileEditable(application);

  const handleSave = async (form) => {
    await onSaveProfile?.(form);
    setEditOpen(false);
  };

  return (
    <>
      <SectionCard
        eyebrow="my profile"
        title="내 프로필"
        action={
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            disabled={!editable}
            className="h-10 rounded-lg bg-[#1877f2] px-4 text-[14px] font-semibold text-white transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:bg-[#dfe3e8] disabled:text-[#65676b]"
          >
            {editable ? "프로필 수정" : "수정 잠금"}
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-[260px_1fr] md:items-start">
          <PhotoStrip photos={photos} compact />

          <div className="rounded-xl border-solid border border-[#dfe3e8] p-4">
            <Row label="닉네임" value={basic.nickname} />
            <Row label="나이" value={formatAgeBirth(basic)} />
            <Row label="직업군" value={identity.jobCategory} />
            <Row label="회사/학교" value={identity.organizationName} />
            <Row label="활동 지역" value={normalizeArray(basic.activityAreas).join(" · ")} />
            <Row label="선호 지역" value={basic.preferredArea} />
            <Row label="가능 시간" value={normalizeArray(basic.availableTimeSlots).join(" · ")} />
            <Row label="키" value={basic.height ? `${basic.height}cm` : "-"} />
            <Row label="소개" value={basic.introduction} large />
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
    return (
      <SectionCard eyebrow="candidate" title="대상후보">
        <div className="rounded-xl bg-[#f0f2f5] p-8 text-center">
          <div className="text-[22px] font-bold tracking-[-0.04em] text-[#1c1e21]">
아직 제안된 후보가 없습니다
          </div>
          <p className="mt-2 break-keep text-[15px] leading-7 text-[#65676b]">
            운영자가 후보를 제안하면 이곳에서 확인할 수 있습니다.
          </p>
        </div>
      </SectionCard>
    );
  }

  const basic = getBasic(candidate);
  const identity = getIdentity(candidate);
  const photos = getPhotos(candidate);
  const photoRevealed = isPhotoRevealed(application, bestMatch);
  const scheduleStatus = getScheduleStatus(bestMatch);
  const scheduleOpen = isScheduleOpen(bestMatch);
  const showOrganization = scheduleOpen;
  const responseDueAt = getProposalDueAt(application, bestMatch);
  const hasFinalResponse = isFinalProposalResponse(responseStatus);
  const responseExpired = !hasFinalResponse && isDueExpired(responseDueAt);

  return (
    <SectionCard eyebrow="candidate" title="대상후보">
      <div className="grid gap-5 lg:grid-cols-[320px_1fr] lg:items-start">
        <PhotoStrip photos={photos} blurred={!photoRevealed} showBlurNotice={!photoRevealed} />

        <div className="rounded-xl border-solid border border-[#dfe3e8] p-4">
          <Row label="나이" value={formatAgeBirth(basic)} />
          <Row label="직업군" value={identity.jobCategory} />
          {showOrganization ? <Row label="회사/학교" value={identity.organizationName} /> : null}
          <Row label="활동 지역" value={normalizeArray(basic.activityAreas).join(" · ")} />
          <Row label="가능 시간" value={normalizeArray(basic.availableTimeSlots).join(" · ")} />
          <Row label="키" value={basic.height ? `${basic.height}cm` : "-"} />
          <Row label="소개" value={basic.introduction} large />
        </div>
      </div>

      {responseDueAt && !scheduleOpen && !hasFinalResponse ? (
        <div className="mt-4">
          <CountdownBadge dueAt={responseDueAt} label="응답 가능 시간" />
          <p className="mt-2 text-[13px] font-semibold leading-5 text-rose-600">
            기한 내 선택하지 않으면 이번 제안은 보류 의사로 간주됩니다.
          </p>
        </div>
      ) : null}

      {responseExpired ? (
        <div className="mt-4 rounded-xl bg-rose-50 p-3 text-center text-[15px] font-semibold leading-7 text-rose-700">
          응답 기한이 종료되어 이번 제안은 보류 의사로 간주됩니다.
        </div>
      ) : hasFinalResponse ? (
        <div className="mt-4 whitespace-pre-line rounded-xl bg-pink-100 p-3 text-center text-[15px] font-semibold leading-7 text-pink-800">
          {responseStatus === "accepted"
            ? scheduleOpen
              ? "만남 진행됩니다. 일정조율 탭에서 일정/지역 선택 상태를 확인해주세요."
              : isDueExpired(responseDueAt)
              ? "상대 응답 기한이 지났습니다.\n운영자가 재매칭 여부를 검토합니다."
              : "만남 진행 의사가 전달되었습니다.\n상대방 응답 시 만남이 확정됩니다."
            : "이번 만남은 패스 처리되었습니다.\n반복적인 패스/보류는 추후 매칭 노출이 줄어들 수 있습니다."}
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onRequestRespond?.("accepted")}
            disabled={savingResponse || responseExpired}
            className="h-13 min-h-[52px] rounded-lg bg-[#1877f2] px-5 text-[15px] font-bold text-white transition hover:bg-[#166fe5] disabled:opacity-60"
          >
            이 만남 진행할래요
          </button>
          <button
            type="button"
            onClick={() => onRequestRespond?.("declined")}
            disabled={savingResponse || responseExpired}
            className="h-13 min-h-[52px] rounded-lg border border-solid border-[#dfe3e8] px-5 text-[15px] font-semibold text-[#1c1e21] transition hover:bg-[#f0f2f5] disabled:opacity-60"
          >
            이번 만남은 쉬어갈게요
          </button>
          <div className="sm:col-span-2 rounded-lg bg-amber-50 px-3 py-2 text-[12px] font-semibold leading-5 text-amber-800">
            반복적인 패스/보류는 추후 매칭 노출이 줄어들 수 있습니다.
          </div>
        </div>
      )}
    </SectionCard>
  );
}


function ScheduleTab({
  application,
  bestMatch,
  savingSchedule,
  savingPreMeetingNote,
  savingAttendance,
  onSaveScheduleChoices,
  onSaveFinalScheduleChoice,
  onSavePreMeetingNote,
  onSaveMeetingAttendance,
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
  const availableAreas = useMemo(
    () => getAvailableAreas(application, candidate),
    [application, candidate]
  );

  const [selectedTimeIds, setSelectedTimeIds] = useState([]);
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [finalTimeId, setFinalTimeId] = useState("");
  const [finalPlaceId, setFinalPlaceId] = useState("");
  const [preMeetingNoteText, setPreMeetingNoteText] = useState("");

  const preMeetingNotes = bestMatch?.match?.preMeetingNotes || {};
  const myPreMeetingNote = application?.id ? preMeetingNotes[application.id] : null;
  const counterpartPreMeetingNote = candidate?.id ? preMeetingNotes[candidate.id] : null;
  const meetingAttendance = bestMatch?.match?.meetingAttendance || {};
  const myAttendance = application?.id ? meetingAttendance[application.id] : null;
  const counterpartAttendance = candidate?.id ? meetingAttendance[candidate.id] : null;

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

  if (!candidate) {
    return (
      <SectionCard eyebrow="schedule" title="일정조율">
        <div className="rounded-xl bg-[#f0f2f5] p-6 text-center text-[15px] font-semibold text-[#65676b]">
          후보가 준비되면 일정조율을 진행할 수 있습니다.
        </div>
      </SectionCard>
    );
  }

  if (!scheduleOpen) {
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

  return (
    <SectionCard eyebrow="schedule" title={isMeetingConfirmed ? "만남 확정 안내" : "일정조율"}>
      {!isMeetingConfirmed ? (
        <div className="overflow-hidden rounded-2xl border-solid border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-orange-50 shadow-sm">
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
            <div className="rounded-2xl border-solid border border-blue-100 bg-white p-4 text-center shadow-sm">
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
          <div className="rounded-2xl border-solid border border-[#dfe3e8] bg-white p-4 shadow-sm sm:p-5">
            <div className="text-[17px] font-bold tracking-[-0.04em] text-slate-600">1. 가능한 일시 3개 선택</div>
            <p className="mt-1 text-[13px] font-semibold leading-5 text-[#65676b]">
              카드 전체를 눌러 선택할 수 있습니다.
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
                    "group w-full rounded-2xl border-solid border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-45 sm:p-5",
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
                          {option.timeLabel}
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

          <div className="mt-5 rounded-2xl border-solid border border-[#dfe3e8] bg-white p-4 shadow-sm sm:p-5">
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
          />

          {selectedPlaces.length ? (
            <div className="mt-4 rounded-2xl border-solid border border-[#dfe3e8] bg-white p-4 shadow-sm">
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
        <div className="mt-5 rounded-2xl bg-[#f0f2f5] p-5">
          <div className="text-[19px] font-bold tracking-[-0.04em] text-[#1c1e21]">
            선택 완료
          </div>
          <p className="mt-2 break-keep text-[14px] font-semibold leading-6 text-[#65676b]">
            상대방이 일시 1개와 장소 1개를 선택할 때까지 기다려주세요.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-4">
              <div className="text-[14px] font-bold text-[#1c1e21]">제안한 일시</div>
              <div className="mt-3 grid gap-2">
                {timeChoices.map((choice, index) => (
                  <div key={choice.id} className="rounded-lg border-solid border border-[#dfe3e8] px-3 py-3 text-[13px] font-bold text-[#1c1e21]">
                    {index + 1}. {formatTimeChoice(choice)}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4">
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
          <div className="rounded-2xl border border-[#dfe3e8] bg-white p-4 sm:p-5">
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
                    "w-full rounded-2xl border-solid border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md",
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

          <div className="mt-5 rounded-2xl border border-[#dfe3e8] bg-white p-4 sm:p-5">
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
                    "rounded-2xl border-solid border bg-white p-4 transition",
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
        <div className="mt-5 rounded-2xl bg-[#f0f2f5] p-5">
          <div className="text-[19px] font-bold tracking-[-0.04em] text-[#1c1e21]">
            일시/장소가 선택되었습니다
          </div>
          <p className="mt-2 break-keep text-[14px] font-semibold leading-6 text-[#65676b]">
서로 일시/장소 선택이 완료되었습니다. 곧 자동 확정 안내가 문자로 발송됩니다.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-4">
              <div className="text-[12px] font-bold tracking-[0.16em] text-[#65676b]">일시</div>
              <div className="mt-2 text-[15px] font-bold text-[#1c1e21]">
                {formatTimeChoice(finalTimeChoice || finalChoice)}
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4">
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
          <div className="rounded-2xl border-solid border border-emerald-100 bg-emerald-50 p-5">
            <div className="text-[20px] font-bold tracking-[-0.04em] text-emerald-900">
              만남의 일시와 장소가 확정되었습니다
            </div>
            <p className="mt-2 break-keep text-[14px] font-semibold leading-6 text-emerald-800">
              상대 프로필, 온전한 이미지는 [대상후보]탭에서 바로 확인할 수 있습니다. <br/>아래 안내를 확인하고 약속 시간에 맞춰 방문해주세요.
            </p>
            <div
              className={cx(
                "mt-4 rounded-2xl border-solid border p-3",
                attendanceConfirmed ? "border-emerald-100 bg-white" : "border-orange-200 bg-orange-50"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className={cx("text-[15px] font-bold", attendanceConfirmed ? "text-emerald-800" : "text-orange-800")}>
                    {attendanceConfirmed ? "참석 확인이 완료되었습니다" : "참석 확인을 눌러주세요"}
                  </div>
                  <p className="mt-1 break-keep text-[12px] font-semibold leading-5 text-[#65676b]">
                    상대 프로필은 참석 확인 전에도 바로 확인할 수 있습니다. 참석 확인은 노쇼 방지와 만남 준비 확인용입니다.
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

            <div className="mt-4 rounded-2xl bg-white px-4 py-3 shadow">
              <Row label="일정" value={formatTimeChoice(finalMeeting || finalTimeChoice || finalChoice)} />
              <Row label="장소" value={finalMeeting?.placeName || formatPlaceChoice(finalMeeting || finalPlaceChoice || finalChoice)} />
              <Row label="지도" value={<MapLinkButton href={confirmedMapUrl} />} />
              <Row label="만남 방식" value="카페에서 60분 정도 가볍게 대화" />
              <Row label="결제" value={finalMeeting?.paymentNote || "음료 등 개인 주문 비용은 각자 부담입니다."} />
            </div>
          </div>

          <div className="rounded-2xl border-solid border border-[#dfe3e8] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[18px] font-bold tracking-[-0.04em] text-[#1c1e21]">
                  만남 전 한마디
                </div>
                <p className="mt-1 break-keep text-[13px] font-semibold leading-5 text-[#65676b]">
                  자유채팅은 열지 않고, 서로를 찾기 위한 짧은 안내만 남깁니다.
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
              복장, 가방/소지품, 카페 안에서 기다릴 위치를 1~2문장으로 적어주세요.
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
        </div>
      ) : null}
    </SectionCard>
  );
}

function ResultTab({ application, responseStatus }) {
  const proposal = application?.currentProposal || {};
  const schedule = application?.schedule || application?.meetingSchedule || {};
  const feedback = application?.feedback || application?.meetingFeedback || {};
  const response = isFinalProposalResponse(responseStatus)
    ? responseStatus
    : isFinalProposalResponse(proposal.response)
    ? proposal.response
    : isFinalProposalResponse(proposal.status)
    ? proposal.status
    : "";

  return (
    <SectionCard eyebrow="result" title="결과보기">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatusBox label="내 응답" value={getResponseLabel(response)} tone="blue" />
        <StatusBox label="상대 응답" value={getResponseLabel(proposal.counterpartResponse || proposal.partnerResponse)} />
        <StatusBox label="매칭 결과" value={getMatchingStatusLabel(application)} tone={getStatusTone("matching", application?.matchingStatus)} />
        <StatusBox label="일정" value={schedule.status ? schedule.status : "대기"} />
      </div>

      <div className="mt-4 rounded-xl border-solid border border-[#dfe3e8] p-4">
        <Row label="만남 일시" value={formatDateTime(schedule.date || schedule.datetime || schedule.confirmedAt)} />
        <Row label="장소" value={schedule.placeName || schedule.location || "-"} />
        <Row label="연락처 공개" value={application?.contactOpenStatus ? application.contactOpenStatus : "상호 희망 시 공개"} />
        <Row label="피드백" value={feedback.status ? feedback.status : "대기"} />
      </div>
    </SectionCard>
  );
}

export default function ProposalDashboard({
  verifiedProfile,
  application,
  bestMatch,
  loading,
  responseStatus,
  savingResponse,
  savingSchedule,
  savingPreMeetingNote,
  savingAttendance,
  savingProfile,
  profileUploadProgress,
  onRespond,
  onSaveScheduleChoices,
  onSaveFinalScheduleChoice,
  onSavePreMeetingNote,
  onSaveMeetingAttendance,
  onSaveProfile,
  onResetIdentity,
}) {
  const [activeTab, setActiveTab] = useState("candidate");
  const [confirmType, setConfirmType] = useState("");

  const proposalDueAt = getProposalDueAt(application, bestMatch);
  const schedule = getScheduleFromMatch(bestMatch);
  const scheduleStatus = getScheduleStatus(bestMatch);
  const scheduleOpen = isScheduleOpen(bestMatch);
  const scheduleDueAt = scheduleOpen ? getScheduleDueAtByStatus(schedule, scheduleStatus) : "";
  const hasCandidate = Boolean(bestMatch?.candidate);
  const hasFinalResponse = isFinalProposalResponse(responseStatus);
  const proposalExpired = proposalDueAt ? isDueExpired(proposalDueAt) : false;
  const scheduleActionRequired = isScheduleActionRequiredForMe(application, bestMatch);

  const tabMeta = {
    candidate:
      hasCandidate && !hasFinalResponse
        ? {
            badge: proposalExpired ? "기한종료" : "NEW",
            dueAt: proposalDueAt,
            urgent: !proposalExpired,
          }
        : null,
    schedule:
      scheduleOpen && scheduleActionRequired
        ? {
            badge: "선택필요",
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
  };

  useEffect(() => {
    if (scheduleOpen && scheduleActionRequired) {
      setActiveTab("schedule");
    }
  }, [
    scheduleOpen,
    scheduleActionRequired,
    bestMatch?.matchId,
    bestMatch?.match?.scheduleStatus,
    bestMatch?.match?.schedule?.status,
  ]);

  const handleConfirmResponse = async (type) => {
    await onRespond?.(type);
    setConfirmType("");
  };

  return (
    <main className="min-h-[calc(100svh-64px)] bg-[#f0f2f5] px-2 py-3 sm:px-4 md:min-h-[calc(100svh-80px)] md:px-8 md:py-6">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-[-0.055em] text-[#1c1e21] sm:text-[36px]">
              신청 현황 조회
            </h1>
            <p className="mt-1.5 break-keep text-[14px] leading-6 text-[#65676b] sm:text-[15px]">
              {verifiedProfile?.name ? `${verifiedProfile.name}님, ` : ""}
              이번 회차 후보와 신청 상태를 확인해주세요.
            </p>
          </div>

          <button
            type="button"
            onClick={onResetIdentity}
            className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#1c1e21] shadow-sm transition hover:bg-slate-50 sm:px-4"
          >
            로그아웃
          </button>
        </div>

        <TabNav activeTab={activeTab} onChange={setActiveTab} tabMeta={tabMeta} />

        {loading ? (
          <div className="mt-4 rounded-xl border-solid border border-[#dfe3e8] bg-white p-8 text-center sm:mt-5">
            <LoadingSpinner size="lg" tone="blue" className="mx-auto" />
          </div>
        ) : application ? (
          <div className="mt-4 sm:mt-5">
            {activeTab === "candidate" ? (
              <CandidateTab
                application={application}
                bestMatch={bestMatch}
                responseStatus={responseStatus}
                savingResponse={savingResponse}
                onRequestRespond={setConfirmType}
              />
            ) : null}
            {activeTab === "schedule" ? (
              <ScheduleTab
                application={application}
                bestMatch={bestMatch}
                savingSchedule={savingSchedule}
                savingPreMeetingNote={savingPreMeetingNote}
                savingAttendance={savingAttendance}
                onSaveScheduleChoices={onSaveScheduleChoices}
                onSaveFinalScheduleChoice={onSaveFinalScheduleChoice}
                onSavePreMeetingNote={onSavePreMeetingNote}
                onSaveMeetingAttendance={onSaveMeetingAttendance}
              />
            ) : null}
            {activeTab === "status" ? <StatusTab application={application} /> : null}
            {activeTab === "profile" ? (
              <ProfileTab
                application={application}
                savingProfile={savingProfile}
                profileUploadProgress={profileUploadProgress}
                onSaveProfile={onSaveProfile}
              />
            ) : null}
            {activeTab === "result" ? (
              <ResultTab application={application} responseStatus={responseStatus} />
            ) : null}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border-solid border border-[#dfe3e8] bg-white p-8 text-center">
            <h2 className="text-[22px] font-bold tracking-[-0.04em] text-[#1c1e21]">
              신청내역이 없습니다.
            </h2>
          </div>
        )}
      </div>

      <ResponseConfirmModal
        type={confirmType}
        saving={savingResponse}
        onClose={() => setConfirmType("")}
        onConfirm={handleConfirmResponse}
      />
    </main>
  );
}
