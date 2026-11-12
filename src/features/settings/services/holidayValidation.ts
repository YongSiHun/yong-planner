import { MAX_SCHEDULE_LENGTH } from '../../../services/schedule';
import { parseDate } from '../../../utils/date';
import { monthSelection } from '../../planner/services/monthSelection';

export function holidayDateSelection(value: string): { date: string | null; error: string | null } {
  const parts = value.split('-');
  const validParts = parts.length === 3;

  if (!validParts) {
    return { date: null, error: '날짜는 YYYY-MM-DD 형식으로 입력해 주세요.' };
  }
  const [year = '', month = '', day = ''] = parts;
  const selection = monthSelection(year, month);
  const error = selection.yearError ?? selection.monthError ?? dayError(day);

  if (error) {
    return { date: null, error };
  }
  const date = year.padStart(4, '0') + '-' + month.padStart(2, '0') + '-' + day.padStart(2, '0');

  try {
    parseDate(date);

    return { date, error: null };
  } catch {
    return { date: null, error: '해당 월에 존재하는 날짜를 입력해 주세요.' };
  }
}

function dayError(value: string): string | null {
  const valid = /^\d{1,2}$/.test(value) && Number(value) >= 1 && Number(value) <= 31;

  return valid ? null : '일은 1~31 사이의 정수로 입력해 주세요.';
}

export function holidayNameError(value: string): string | null {
  const blank = value.length > 0 && value.trim().length === 0;

  if (blank) {
    return '공휴일 이름을 입력하거나 완전히 비워 주세요.';
  }
  const tooLong = Array.from(value).length > MAX_SCHEDULE_LENGTH;

  return tooLong ? '공휴일 이름은 255자까지 입력할 수 있어요.' : null;
}
