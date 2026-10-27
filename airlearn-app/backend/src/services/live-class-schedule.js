const LIVE_WINDOW_START_DAY = 1;
const LIVE_WINDOW_END_DAY = 10;
const LIVE_START_MINUTE = 18 * 60;
const LIVE_END_MINUTE = 20 * 60;
const LIVE_TIME_ZONE = 'Asia/Kolkata';

function getIndiaDateParts(date) {
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

function isLiveClassWindowOpen(now = new Date()) {
  const { day, hour, minute } = getIndiaDateParts(now);
  const minuteOfDay = hour * 60 + minute;

  return (
    day >= LIVE_WINDOW_START_DAY &&
    day <= LIVE_WINDOW_END_DAY &&
    minuteOfDay >= LIVE_START_MINUTE &&
    minuteOfDay < LIVE_END_MINUTE
  );
}

module.exports = { isLiveClassWindowOpen };
