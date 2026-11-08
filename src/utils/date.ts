import { addDays, addMonths, format, getDaysInMonth } from 'date-fns';

export const weekdays = ['일', '월', '화', '수', '목', '금', '토'] as const;

function matchesDateParts(date: Date, year: number, month: number, day: number): boolean {
  const isSupportedYear = year >= 1 && year <= 9999;
  const hasSameYear = date.getFullYear() === year;
  const hasSameMonth = date.getMonth() === month - 1;
  const hasSameDay = date.getDate() === day;

  return isSupportedYear && hasSameYear && hasSameMonth && hasSameDay;
}

// 현지 정오: 자정 시차 회피.
export function parseDate(value: string): Date {
  const hasDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(value);

  if (!hasDateFormat) {
    throw new Error('날짜는 YYYY-MM-DD 형식이어야 합니다.');
  }

  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  const result = new Date(2000, month - 1, day, 12);

  result.setFullYear(year);

  const isValidDate = matchesDateParts(result, year, month, day);

  if (!isValidDate) {
    throw new Error('유효하지 않은 날짜입니다.');
  }

  return result;
}

export function dateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function today(): string {
  return dateKey(new Date());
}

function validatedDateKey(date: Date): string {
  const supported = date.getFullYear() >= 1 && date.getFullYear() <= 9999;

  if (!supported) {
    throw new Error('연도는 1~9999 범위여야 합니다.');
  }
  const key = dateKey(date);

  parseDate(key);

  return key;
}

export function shiftMonth(date: string, months: number): string {
  return validatedDateKey(addMonths(parseDate(date), months));
}

export function monthDates(date: string): string[] {
  const first = parseDate(date.slice(0, 7) + '-01');

  return Array.from({ length: getDaysInMonth(first) }, (_, index) =>
    dateKey(addDays(first, index)),
  );
}

export function weekday(date: string): number {
  return parseDate(date).getDay();
}

export function monthLabel(date: string): string {
  const parsedDate = parseDate(date);

  return parsedDate.getFullYear() + '년 ' + (parsedDate.getMonth() + 1) + '월';
}

export function validTime(value: unknown): value is string | null {
  const hasNoTime = value === null;

  if (hasNoTime) {
    return true;
  }

  const isText = typeof value === 'string';

  return isText && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function safeShiftMonth(date: string, amount: number): string | null {
  try {
    return shiftMonth(date, amount);
  } catch {
    return null;
  }
}
