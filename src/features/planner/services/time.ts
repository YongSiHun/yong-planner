import type { PlanEntry, TimeFormat } from '../types';

export function formatScheduleTime(
  time: string | null | undefined,
  format: TimeFormat = '24h',
): string {
  const hasTime = Boolean(time);

  if (!hasTime) {
    return '';
  }
  const [hour, minute] = time!.split(':').map(Number) as [number, number];
  const minutes = minute === 0 ? '' : ' ' + minute + '분';

  return hourLabel(hour, format) + minutes;
}

function hourLabel(hour: number, format: TimeFormat): string {
  const is24 = format === '24h';

  if (is24) {
    return hour + '시';
  }
  const period = hour < 12 ? '오전 ' : '오후 ';

  return period + (hour % 12 || 12) + '시';
}

export function formatScheduleContent(
  content: string,
  time: string | null | undefined,
  format: TimeFormat = '24h',
): string {
  const label = formatScheduleTime(time, format);

  return label ? label + ' ' + content : content;
}

export function displayPlanEntry(entry: PlanEntry, format: TimeFormat = '24h'): string {
  const rawPrefix = entry.time ? Number(entry.time.slice(0, 2)) + entry.time.slice(2) + ' ' : '';
  const hasLegacyPrefix =
    entry.kind === 'recurring' && rawPrefix.length > 0 && entry.content.startsWith(rawPrefix);
  const content = hasLegacyPrefix ? entry.content.slice(rawPrefix.length) : entry.content;

  return formatScheduleContent(content, entry.time, format);
}

function clockNumber(text: string, minimum: number, maximum: number): number | null {
  const value = Number(text);
  const valid = /^\d{1,2}$/.test(text) && value >= minimum && value <= maximum;

  return valid ? value : null;
}

function canonicalHour(text: string, period: 'am' | 'pm', format: TimeFormat): number | null {
  const is12 = format === '12h';
  const hour = clockNumber(text, is12 ? 1 : 0, is12 ? 12 : 23);
  const valid = hour !== null;

  if (!valid) {
    return null;
  }

  return is12 ? (hour % 12) + Number(period === 'pm') * 12 : hour;
}

export function timeFromFields(
  hour: string,
  minute: string,
  period: 'am' | 'pm',
  format: TimeFormat,
): string | null {
  const hours = canonicalHour(hour, period, format);
  const minutes = clockNumber(minute, 0, 59);
  const valid = hours !== null && minutes !== null;

  if (!valid) {
    return null;
  }

  return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
}
