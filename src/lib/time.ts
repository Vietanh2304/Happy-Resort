import type { Phase } from './content';

export interface LocalTime {
  date: string;   // YYYY-MM-DD theo giờ địa phương
  hour: number;
  minute: number;
  month: number;
}

const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function localTime(tz: string | null | undefined, at = new Date()): LocalTime {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = fmt(tz || browserTz).formatToParts(at);
  } catch {
    parts = fmt(browserTz).formatToParts(at);
  }
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '0';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    hour: Number(get('hour')) % 24,
    minute: Number(get('minute')),
    month: Number(get('month')),
  };
}

function fmt(timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
}

export function phaseOf(hour: number): Phase {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'sunset';
  return 'night';
}

export const phaseLabel: Record<Phase, string> = {
  dawn: 'Bình minh', day: 'Ban ngày', sunset: 'Hoàng hôn', night: 'Ban đêm',
};

export function clock(t: LocalTime) {
  return `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
}

/** Số ngày từ mốc 1970-01-01 của một chuỗi YYYY-MM-DD */
export function dayNumber(date: string) {
  return Math.floor(Date.parse(date + 'T00:00:00Z') / 86400000);
}
