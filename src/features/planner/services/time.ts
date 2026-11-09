import type { DailyPlanItem, PlanEntry, TimeFormat } from '../types';

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

export function parseScheduleTimePrefix(text: string): { content: string; time?: string } {
  const match =
    /^(?:([01]?\d|2[0-3]):([0-5]\d)|([01]?\d|2[0-3])시(?:\s*([0-5]?\d)분)?)\s+([\s\S]*\S[\s\S]*)$/.exec(
      text,
    );
  const hasTime = match !== null && !/^\d+분/.test(match[5]!);

  if (!hasTime) {
    return { content: text };
  }
  const hour = match[1] ?? match[3]!;
  const minute = match[2] ?? match[4] ?? '00';

  return { content: match[5]!, time: hour.padStart(2, '0') + ':' + minute.padStart(2, '0') };
}

export function boundedClockInput(
  text: string,
  previous: string,
  minimum: number,
  maximum: number,
): string {
  const empty = text === '';

  if (empty) {
    return '';
  }
  const integer = /^-?\d+$/.test(text);

  if (!integer) {
    return previous;
  }

  return String(Math.max(minimum, Math.min(maximum, Number(text))));
}

export function timeOverwriteMessage(
  alarm: boolean,
  items: readonly Pick<DailyPlanItem, 'time'>[],
  hasAlarm: boolean,
): string | undefined {
  const times = items.flatMap((item) => (item.time ? [item.time] : []));
  const hasDifferentTimes = new Set(times).size > 1;
  const hasExistingValues = alarm ? times.length > 0 || hasAlarm : hasDifferentTimes;

  if (!hasExistingValues) {
    return undefined;
  }

  return alarm
    ? '선택한 일정의 시간과 알람을 덮어쓸까요?'
    : '이미 시간이 설정된 일정이 있습니다. 덮어쓰시겠어요?';
}
