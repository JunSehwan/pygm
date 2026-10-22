export const TWOWEEKS_TIME_ZONE = "Asia/Seoul";
export const TWOWEEKS_SCHEDULE_POLICY_VERSION = "next_weekend_kst_v1";
export const TWOWEEKS_PROPOSAL_RESPONSE_DUE_HOURS = 48;
export const TWOWEEKS_SCHEDULE_STAGE_DUE_HOURS = 24;
export const TWOWEEKS_SCHEDULE_TOTAL_DUE_HOURS = 48;

const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const MANAGED_TIME_SLOTS = [
  { dayOffset: 0, key: "friday_evening", slotLabel: "금요일 저녁", hour: 19, minute: 30 },
  { dayOffset: 1, key: "saturday_afternoon", slotLabel: "토요일 낮", hour: 14, minute: 0 },
  { dayOffset: 1, key: "saturday_evening", slotLabel: "토요일 저녁", hour: 19, minute: 0 },
  { dayOffset: 2, key: "sunday_afternoon", slotLabel: "일요일 낮", hour: 14, minute: 0 },
  { dayOffset: 2, key: "sunday_evening", slotLabel: "일요일 저녁", hour: 19, minute: 0 },
];

function pad2(value) {
  return String(value).padStart(2, "0");
}

export function getScheduleTimeMs(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

export function addScheduleHoursClient(hours = 0, value = Date.now()) {
  const baseMs = getScheduleTimeMs(value) || Date.now();
  return new Date(baseMs + Number(hours || 0) * HOUR_MS).toISOString();
}

export function getProposalResponseDueAtClient(match = {}) {
  const createdAtMs = getScheduleTimeMs(match?.createdAt);
  if (createdAtMs) {
    return addScheduleHoursClient(TWOWEEKS_PROPOSAL_RESPONSE_DUE_HOURS, createdAtMs);
  }

  return String(match?.responseDueAtClient || match?.proposalDueAtClient || "");
}

export function getScheduleStageDueAtClient(schedule = {}, status = "") {
  const counterpartStep = ["waiting_counterpart", "needs_final_choice"].includes(
    String(status || schedule?.status || "")
  );
  const authoritativeAnchor = counterpartStep
    ? schedule?.firstSelectedAt
    : schedule?.serverPolicyInitializedAt || schedule?.openedAt;
  const authoritativeAnchorMs = getScheduleTimeMs(authoritativeAnchor);

  if (authoritativeAnchorMs) {
    return addScheduleHoursClient(
      TWOWEEKS_SCHEDULE_STAGE_DUE_HOURS,
      authoritativeAnchorMs
    );
  }

  return String(
    counterpartStep
      ? schedule?.counterpartDueAtClient || schedule?.dueAtClient || ""
      : schedule?.dueAtClient || schedule?.counterpartDueAtClient || ""
  );
}

function getSeoulCalendarParts(value) {
  const ms = getScheduleTimeMs(value) || Date.now();
  const shifted = new Date(ms + SEOUL_OFFSET_MS);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    weekDay: shifted.getUTCDay(),
  };
}

function addCalendarDays(parts, days) {
  const value = new Date(Date.UTC(parts.year, parts.month - 1, parts.day) + days * DAY_MS);

  return {
    year: value.getUTCFullYear(),
    month: value.getUTCMonth() + 1,
    day: value.getUTCDate(),
    weekDay: value.getUTCDay(),
  };
}

function getDateKey(parts) {
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

function getDateLabel(parts) {
  const weekDayLabels = ["일", "월", "화", "수", "목", "금", "토"];
  return `${parts.month}. ${parts.day}. (${weekDayLabels[parts.weekDay]})`;
}

function getSeoulStartIso(parts, hour, minute) {
  return new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute) - SEOUL_OFFSET_MS
  ).toISOString();
}

function buildTimeOption(fridayParts, slot) {
  const dateParts = addCalendarDays(fridayParts, slot.dayOffset);
  const dateKey = getDateKey(dateParts);
  const dateLabel = getDateLabel(dateParts);

  return {
    id: `${dateKey}_${slot.key}`,
    dateKey,
    dateLabel,
    dayLabel: dateLabel,
    timeSlotKey: slot.key,
    slotLabel: slot.slotLabel,
    timeLabel: `${pad2(slot.hour)}:${pad2(slot.minute)}`,
    startAtClient: getSeoulStartIso(dateParts, slot.hour, slot.minute),
  };
}

export function buildTwoWeeksSchedulePolicy(anchor = Date.now()) {
  const anchorMs = getScheduleTimeMs(anchor) || Date.now();
  const anchorParts = getSeoulCalendarParts(anchorMs);
  const daysSinceMonday = (anchorParts.weekDay + 6) % 7;
  const nextWeekFriday = addCalendarDays(anchorParts, 11 - daysSinceMonday);
  const timeOptions = MANAGED_TIME_SLOTS.map((slot) => buildTimeOption(nextWeekFriday, slot));

  return {
    version: TWOWEEKS_SCHEDULE_POLICY_VERSION,
    timeZone: TWOWEEKS_TIME_ZONE,
    anchorAtClient: new Date(anchorMs).toISOString(),
    meetingWeekRule: "next_calendar_week",
    windowStartDateKey: timeOptions[0].dateKey,
    windowEndDateKey: timeOptions[timeOptions.length - 1].dateKey,
    firstSelectionDueHours: TWOWEEKS_SCHEDULE_STAGE_DUE_HOURS,
    counterpartSelectionDueHours: TWOWEEKS_SCHEDULE_STAGE_DUE_HOURS,
    totalSelectionDueHours: TWOWEEKS_SCHEDULE_TOTAL_DUE_HOURS,
    allowedTimeOptionIds: timeOptions.map((option) => option.id),
    timeOptionStartAtById: Object.fromEntries(
      timeOptions.map((option) => [option.id, option.startAtClient])
    ),
    timeOptions,
  };
}

function getFallbackAnchorMs(match = {}) {
  const directCandidates = [
    match?.createdAt,
    match?.createdAtClient,
    match?.securePhotoPolicy?.createdAtClient,
    match?.compatibilityConflictReview?.reviewedAtClient,
  ];

  for (const candidate of directCandidates) {
    const value = getScheduleTimeMs(candidate);
    if (value) return value;
  }

  const responseDueMs = getScheduleTimeMs(
    match?.responseDueAtClient || match?.proposalDueAtClient
  );
  if (responseDueMs) return responseDueMs - TWOWEEKS_PROPOSAL_RESPONSE_DUE_HOURS * HOUR_MS;

  return Date.now();
}

export function isValidTwoWeeksSchedulePolicy(policy = {}) {
  const options = Array.isArray(policy?.timeOptions) ? policy.timeOptions : [];
  const allowedIds = Array.isArray(policy?.allowedTimeOptionIds)
    ? policy.allowedTimeOptionIds
    : [];
  const optionIds = options.map((option) => String(option?.id || "")).filter(Boolean);
  const startAtById = policy?.timeOptionStartAtById || {};

  return (
    policy?.version === TWOWEEKS_SCHEDULE_POLICY_VERSION &&
    policy?.timeZone === TWOWEEKS_TIME_ZONE &&
    options.length === MANAGED_TIME_SLOTS.length &&
    optionIds.length === MANAGED_TIME_SLOTS.length &&
    new Set(optionIds).size === MANAGED_TIME_SLOTS.length &&
    optionIds.every((id) => allowedIds.includes(id)) &&
    options.every(
      (option) =>
        Boolean(option?.dateKey && option?.startAtClient) &&
        startAtById[option.id] === option.startAtClient
    )
  );
}

export function getMatchSchedulePolicy(match = {}) {
  if (isValidTwoWeeksSchedulePolicy(match?.schedulePolicy)) {
    return match.schedulePolicy;
  }

  return buildTwoWeeksSchedulePolicy(getFallbackAnchorMs(match));
}

export function getMatchScheduleTimeOptions(match = {}) {
  return getMatchSchedulePolicy(match).timeOptions;
}

export function canonicalizeScheduleTimeChoices(value = [], match = {}) {
  const requestedIds = Array.from(
    new Set(
      (Array.isArray(value) ? value : [])
        .map((item) => String(item?.id || item || "").trim())
        .filter(Boolean)
    )
  );
  const options = getMatchScheduleTimeOptions(match);
  const optionById = new Map(options.map((option) => [option.id, option]));

  return requestedIds.map((id) => optionById.get(id)).filter(Boolean);
}
