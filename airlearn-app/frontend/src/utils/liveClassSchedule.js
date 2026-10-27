const LIVE_WINDOW_START_DAY = 1;
const LIVE_WINDOW_END_DAY = 10;
const LIVE_START_MINUTE = 18 * 60;
const LIVE_END_MINUTE = 20 * 60;
const LIVE_TIME_ZONE = 'Asia/Kolkata';

function getDateParts(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: LIVE_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);

  return parts.reduce((result, part) => {
    if (part.type !== 'literal') {
      result[part.type] = Number(part.value);
    }
    return result;
  }, {});
}

function createCalendarDate(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function formatWindow(year, month) {
  const date = createCalendarDate(year, month, LIVE_WINDOW_START_DAY);
  const monthAndYear = new Intl.DateTimeFormat('en-IN', {
    timeZone: LIVE_TIME_ZONE,
    month: 'long',
    year: 'numeric',
  }).format(date);

  return `${LIVE_WINDOW_START_DAY}–${LIVE_WINDOW_END_DAY} ${monthAndYear}`;
}

function formatLiveDate(year, month, day) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: LIVE_TIME_ZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(createCalendarDate(year, month, day));
}

function getNextLiveDate(year, month, day, minuteOfDay) {
  if (day >= LIVE_WINDOW_START_DAY && day <= LIVE_WINDOW_END_DAY) {
    if (minuteOfDay < LIVE_START_MINUTE) {
      return { year, month, day };
    }
    if (minuteOfDay >= LIVE_END_MINUTE && day < LIVE_WINDOW_END_DAY) {
      return { year, month, day: day + 1 };
    }
  }

  if (day < LIVE_WINDOW_START_DAY) {
    return { year, month, day: LIVE_WINDOW_START_DAY };
  }

  const nextMonth = new Date(Date.UTC(year, month, 1));
  return {
    year: nextMonth.getUTCFullYear(),
    month: nextMonth.getUTCMonth() + 1,
    day: LIVE_WINDOW_START_DAY,
  };
}

export function getLiveClassSchedule(now = new Date()) {
  const { year, month, day, hour, minute } = getDateParts(now);
  const minuteOfDay = hour * 60 + minute;
  const isWithinLiveDays = day >= LIVE_WINDOW_START_DAY && day <= LIVE_WINDOW_END_DAY;
  const isAvailable =
    isWithinLiveDays &&
    minuteOfDay >= LIVE_START_MINUTE &&
    minuteOfDay < LIVE_END_MINUTE;

  if (isAvailable) {
    return {
      isAvailable,
      status: 'Available',
      scheduleLabel: `Live window: ${formatWindow(year, month)}, 6–8 PM IST`,
    };
  }

  const nextLiveDate = getNextLiveDate(year, month, day, minuteOfDay);
  return {
    isAvailable,
    status: 'Upcoming',
    scheduleLabel: `Next live time: ${formatLiveDate(
      nextLiveDate.year,
      nextLiveDate.month,
      nextLiveDate.day
    )}, 6–8 PM IST`,
  };
}
