const LOCALE = 'en-GB';
const DAY_MS = 86_400_000;

const timeFormat = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' });
const weekdayFormat = new Intl.DateTimeFormat(LOCALE, { weekday: 'short' });
const shortDayFormat = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' });
const longDayFormat = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long' });
const fullDateFormat = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
const numericDateFormat = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', year: '2-digit' });

function startOfDay(timestamp: number) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

const daysAgo = (timestamp: number) => Math.round((startOfDay(Date.now()) - startOfDay(timestamp)) / DAY_MS);
const isThisYear = (timestamp: number) => new Date(timestamp).getFullYear() === new Date().getFullYear();

export const isSameDay = (a: number, b: number) => startOfDay(a) === startOfDay(b);

export const formatTime = (timestamp: number) => timeFormat.format(timestamp);

export function formatDayLabel(timestamp: number) {
  const days = daysAgo(timestamp);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return isThisYear(timestamp) ? longDayFormat.format(timestamp) : fullDateFormat.format(timestamp);
}

export function formatListDate(timestamp: number) {
  const days = daysAgo(timestamp);
  if (days === 0) return timeFormat.format(timestamp);
  if (days < 7) return weekdayFormat.format(timestamp);
  return isThisYear(timestamp) ? shortDayFormat.format(timestamp) : numericDateFormat.format(timestamp);
}
