import { addDays, addMonths, format, getDaysInMonth } from 'date-fns';
export const weekdays = ['일', '월', '화', '수', '목', '금', '토'] as const;
// Local noon avoids most daylight-saving midnight transitions. No date-only UTC conversion.
export function parseDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('날짜는 YYYY-MM-DD 형식이어야 합니다.');
  const [y, m, d] = value.split('-').map(Number) as [number, number, number];
  const result = new Date(2000, m - 1, d, 12);
  result.setFullYear(y);
  if (
    y < 1 ||
    y > 9999 ||
    result.getFullYear() !== y ||
    result.getMonth() !== m - 1 ||
    result.getDate() !== d
  )
    throw new Error('유효하지 않은 날짜입니다.');
  return result;
}
export function dateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
export function today(): string {
  return dateKey(new Date());
}
export function shiftDate(date: string, days: number): string {
  const next = dateKey(addDays(parseDate(date), days));
  parseDate(next);
  return next;
}
export function shiftMonth(date: string, months: number): string {
  const next = dateKey(addMonths(parseDate(date), months));
  parseDate(next);
  return next;
}
export function monthDates(date: string): string[] {
  const first = parseDate(date.slice(0, 7) + '-01');
  return Array.from({ length: getDaysInMonth(first) }, (_, i) => dateKey(addDays(first, i)));
}
export function weekday(date: string): number {
  return parseDate(date).getDay();
}
export function monthLabel(date: string): string {
  const d = parseDate(date);
  return d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월';
}
export function dayLabel(date: string): string {
  const d = parseDate(date);
  return d.getMonth() + 1 + '월 ' + d.getDate() + '일 ' + weekdays[d.getDay()] + '요일';
}
export function validTime(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value));
}
