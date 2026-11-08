import type {
  HolidayPolicy,
  RecurringPlan,
  RecurringPlanException,
} from '../../features/planner/types';
import {
  ensureValid,
  readArray,
  ensureUnique,
  readDate,
  readRecord,
  readIdentifier,
  readTitle,
  readTime,
  readOptionalTime,
} from './readers';

function readHolidayPolicy(value: unknown): HolidayPolicy {
  const isPolicy = value === 'include' || value === 'exclude' || value === 'only';

  ensureValid(isPolicy, '공휴일 정책이 올바르지 않습니다.');

  return value;
}

function readWeekday(value: unknown): number {
  const isWeekday =
    typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 6;

  ensureValid(isWeekday, '요일이 올바르지 않습니다.');

  return value;
}

function readWeekdays(value: unknown, policy: HolidayPolicy): number[] {
  const days = readArray(value).map(readWeekday);

  ensureUnique(days.map(String));

  const hasRequiredDays = policy === 'only' || days.length > 0;

  ensureValid(hasRequiredDays, '반복 요일을 선택해 주세요.');

  return days;
}

function readEndDate(value: unknown, startDate: string): string | null {
  const hasNoEndDate = value === null;

  if (hasNoEndDate) {
    return null;
  }

  const endDate = readDate(value);
  const isValidRange = endDate >= startDate;

  ensureValid(isValidRange, '종료일이 시작일보다 이릅니다.');

  return endDate;
}

export function readRecurringPlan(value: unknown): RecurringPlan {
  const plan = readRecord(value);
  const startDate = readDate(plan.startDate);
  const holidayPolicy = readHolidayPolicy(plan.holidayPolicy);

  return {
    id: readIdentifier(plan.id),
    title: readTitle(plan.title),
    time: readTime(plan.time),
    startDate,
    endDate: readEndDate(plan.endDate, startDate),
    weekdays: readWeekdays(plan.weekdays, holidayPolicy),
    holidayPolicy,
  };
}

function readOptionalTitle(value: unknown): string | undefined {
  const isMissing = value === undefined;

  if (isMissing) {
    return undefined;
  }

  return readTitle(value);
}

export function readException(value: unknown, recurringIds: Set<string>): RecurringPlanException {
  const exception = readRecord(value);
  const recurringPlanId = readIdentifier(exception.recurringPlanId);
  const hasValidParent = recurringIds.has(recurringPlanId);
  const isCancelledFlag = typeof exception.cancelled === 'boolean';

  ensureValid(hasValidParent && isCancelledFlag, '반복 예외가 올바르지 않습니다.');

  const title = readOptionalTitle(exception.title);
  const time = readOptionalTime(exception.time);

  return {
    recurringPlanId,
    date: readDate(exception.date),
    cancelled: exception.cancelled as boolean,
    ...(title === undefined ? {} : { title }),
    ...(time === undefined ? {} : { time }),
  };
}
