// Timezone utility — ensures all date calculations use Europe/Amsterdam
// Vercel runs in UTC; this module converts to Amsterdam time consistently.

const TZ = 'Europe/Amsterdam';

// Get current date/time in Amsterdam timezone as a Date-like object
// Returns { year, month (0-based), day, hours, minutes, seconds, dayOfWeek }
export function getAmsterdamNow() {
  const now = new Date();
  // Format in Amsterdam timezone to extract components
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
  }).formatToParts(now);

  const get = (type) => parts.find(p => p.type === type)?.value;

  return {
    year: parseInt(get('year')),
    month: parseInt(get('month')) - 1, // 0-based like JS Date
    day: parseInt(get('day')),
    hours: parseInt(get('hour')),
    minutes: parseInt(get('minute')),
    seconds: parseInt(get('second')),
    dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')),
  };
}

// Get a proper Date object for the start of the current month in Amsterdam timezone
export function getAmsterdamMonthStart() {
  const { year, month } = getAmsterdamNow();
  // Create a date string that represents midnight in Amsterdam, then parse it
  // Using Intl to get the correct UTC offset for that moment
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-01T00:00:00`;
  return dateInAmsterdam(dateStr);
}

// Get a proper Date object for the start of today in Amsterdam timezone
export function getAmsterdamTodayStart() {
  const { year, month, day } = getAmsterdamNow();
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00`;
  return dateInAmsterdam(dateStr);
}

// Get the Amsterdam month key (e.g. "2026-02") for cache keys
export function getAmsterdamMonthKey() {
  const { year, month } = getAmsterdamNow();
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

// Convert a local Amsterdam datetime string (without TZ) to a UTC Date object
// Input: "2026-02-01T00:00:00" → Date object representing that moment in Amsterdam
export function dateInAmsterdam(localDateStr) {
  // Create a temporary date to figure out the Amsterdam UTC offset at that time
  // We use a two-step approach because DST offset depends on the date itself
  const rough = new Date(localDateStr + 'Z'); // treat as UTC temporarily

  // Get the UTC offset for Amsterdam at roughly this time
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    timeZoneName: 'longOffset',
  });
  const parts = formatter.formatToParts(rough);
  const tzPart = parts.find(p => p.type === 'timeZoneName')?.value || '+01:00';
  // Parse offset like "GMT+01:00" or "GMT+02:00"
  const match = tzPart.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!match) {
    // Fallback: assume CET (+01:00)
    return new Date(localDateStr + '+01:00');
  }
  const sign = match[1] === '+' ? -1 : 1; // reverse: to get UTC from local, subtract offset
  const offsetHours = parseInt(match[2]);
  const offsetMinutes = parseInt(match[3]);
  const offsetMs = sign * (offsetHours * 3600000 + offsetMinutes * 60000);

  return new Date(rough.getTime() + offsetMs);
}

// Format a Date as ISO string for Amsterdam timezone display
// Returns "2026-02-01T00:00:00.000" in Amsterdam local time
export function formatAmsterdamISO(date) {
  const d = date instanceof Date ? date : new Date(date);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const get = (type) => parts.find(p => p.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}.000`;
}
