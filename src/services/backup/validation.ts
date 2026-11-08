import type {
  DailyPlanItem,
  DailyPlanOrder,
  HolidayOverride,
  HolidayPolicy,
  PlannerData,
  RecurringPlan,
  RecurringPlanException,
  Settings,
} from '../../features/planner/types';
import { parseDate, validTime } from '../../utils/date';

type BackupRecord = Record<string, unknown>;

// 검증 실패: 즉시 중단.
export function ensureValid(isValid: boolean, message: string): asserts isValid {
  if (isValid) {
    return;
  }

  throw new Error(message);
}

export function readRecord(value: unknown): BackupRecord {
  const isRecord = value !== null && typeof value === 'object' && !Array.isArray(value);

  ensureValid(isRecord, '백업 객체가 올바르지 않습니다.');

  return value as BackupRecord;
}

export function readText(value: unknown): string {
  const isText = typeof value === 'string';

  ensureValid(isText, '문자열 필드가 올바르지 않습니다.');

  return value;
}

function readTitle(value: unknown): string {
  const title = readText(value);
  const hasTitle = title.trim().length > 0;

  ensureValid(hasTitle, '일정 제목이 비어 있습니다.');

  return title;
}

function readIdentifier(value: unknown): string {
  const identifier = readText(value);
  const hasValidLength = identifier.length > 0 && identifier.length <= 200;

  ensureValid(hasValidLength, 'ID가 올바르지 않습니다.');

  return identifier;
}

function readDate(value: unknown): string {
  const date = readText(value);

  parseDate(date);

  return date;
}

export function readTimestamp(value: unknown): string {
  const timestamp = readText(value);
  const isTimestamp = Number.isFinite(Date.parse(timestamp));

  ensureValid(isTimestamp, '생성 시간이 올바르지 않습니다.');

  return timestamp;
}

function readCreatedAt(value: unknown): string {
  const timestamp = readTimestamp(value);
  const hasDatePrefix = /^\d{4}-\d{2}-\d{2}T/.test(timestamp);

  ensureValid(hasDatePrefix, '작성 시간이 올바르지 않습니다.');

  return timestamp;
}

function readTime(value: unknown): string | null {
  const isValidTime = validTime(value);

  ensureValid(isValidTime, '시간이 올바르지 않습니다.');

  return value;
}

function readArray(value: unknown): unknown[] {
  const isArray = Array.isArray(value);

  ensureValid(isArray, '배열이 올바르지 않습니다.');

  const hasValidLength = value.length <= 500000;

  ensureValid(hasValidLength, '배열이 너무 큽니다.');

  return value;
}

function ensureUnique(values: string[]): void {
  const isUnique = new Set(values).size === values.length;

  ensureValid(isUnique, '중복된 식별자가 있습니다.');
}

function readUniqueList<T>(
  value: unknown,
  parse: (item: unknown) => T,
  key: (item: T) => string,
): T[] {
  const items = readArray(value).map(parse);

  ensureUnique(items.map(key));

  return items;
}

function optionalDailyTime(value: unknown): { time?: string | null } {
  const time = readOptionalTime(value);

  return time === undefined ? {} : { time };
}

function readDailyItem(value: unknown): DailyPlanItem {
  const item = readRecord(value);

  return {
    id: readIdentifier(item.id),
    date: readDate(item.date),
    content: readText(item.content),
    createdAt: readCreatedAt(item.createdAt),
    ...optionalDailyTime(item.time),
    ...optionalDailyImportance(item.important),
  };
}

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

function readRecurringPlan(value: unknown): RecurringPlan {
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

function readOptionalTime(value: unknown): string | null | undefined {
  const isMissing = value === undefined;

  if (isMissing) {
    return undefined;
  }

  return readTime(value);
}

function readException(value: unknown, recurringIds: Set<string>): RecurringPlanException {
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

function readOrderIdentifier(value: unknown): string {
  const identifier = readText(value);
  const isOrderIdentifier = /^(daily|recurring):.+$/.test(identifier);

  ensureValid(isOrderIdentifier, '정렬 데이터가 올바르지 않습니다.');

  return identifier;
}

function readOrder(value: unknown): DailyPlanOrder {
  const order = readRecord(value);
  const itemIds = readArray(order.itemIds).map(readOrderIdentifier);

  ensureUnique(itemIds);

  return { date: readDate(order.date), itemIds };
}

function readOverride(value: unknown): HolidayOverride {
  const override = readRecord(value);
  const isRemoved = override.name === null;

  return { date: readDate(override.date), name: isRemoved ? null : readTitle(override.name) };
}

function readSettings(value: unknown): Settings {
  const settings = readRecord(value);
  const theme = settings.theme;
  const isTheme = theme === 'system' || theme === 'light' || theme === 'dark';

  ensureValid(isTheme, '테마가 올바르지 않습니다.');

  const timeFormat = readTimeFormat(settings.timeFormat);

  return timeFormat === undefined ? { theme } : { theme, timeFormat };
}

// 복사: 검증 필드만 반영.
export function validateData(input: unknown): PlannerData {
  const root = readRecord(input);
  const recurringPlans = readUniqueList(root.recurringPlans, readRecurringPlan, (plan) => plan.id);
  const recurringIds = new Set(recurringPlans.map((plan) => plan.id));
  const readLinkedException = (value: unknown) => readException(value, recurringIds);
  const exceptionKey = (item: RecurringPlanException) =>
    JSON.stringify([item.recurringPlanId, item.date]);

  return {
    dailyPlanItems: readUniqueList(root.dailyPlanItems, readDailyItem, (item) => item.id),
    recurringPlans,
    recurringPlanExceptions: readUniqueList(
      root.recurringPlanExceptions,
      readLinkedException,
      exceptionKey,
    ),
    dailyPlanOrders: readUniqueList(root.dailyPlanOrders, readOrder, (order) => order.date),
    settings: readSettings(root.settings ?? { theme: 'system' }),
    holidayOverrides: readUniqueList(
      root.holidayOverrides ?? [],
      readOverride,
      (override) => override.date,
    ),
  };
}

function readTimeFormat(value: unknown): Settings['timeFormat'] {
  const validFormat = value === undefined || value === '12h' || value === '24h';

  ensureValid(validFormat, '시간 표시 형식이 올바르지 않습니다.');

  return value;
}

function optionalDailyImportance(value: unknown): { important?: boolean } {
  const omitted = value === undefined;

  if (omitted) {
    return {};
  }
  const valid = typeof value === 'boolean';

  ensureValid(valid, '중요 일정 값이 올바르지 않습니다.');

  return value ? { important: true } : {};
}
