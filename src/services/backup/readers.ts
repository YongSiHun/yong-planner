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

export function readTitle(value: unknown): string {
  const title = readText(value);
  const hasTitle = title.trim().length > 0;

  ensureValid(hasTitle, '일정 제목이 비어 있습니다.');

  return title;
}

export function readIdentifier(value: unknown): string {
  const identifier = readText(value);
  const hasValidLength = identifier.length > 0 && identifier.length <= 200;

  ensureValid(hasValidLength, 'ID가 올바르지 않습니다.');

  return identifier;
}

export function readDate(value: unknown): string {
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

export function readCreatedAt(value: unknown): string {
  const timestamp = readTimestamp(value);
  const hasDatePrefix = /^\d{4}-\d{2}-\d{2}T/.test(timestamp);

  ensureValid(hasDatePrefix, '작성 시간이 올바르지 않습니다.');

  return timestamp;
}

export function readTime(value: unknown): string | null {
  const isValidTime = validTime(value);

  ensureValid(isValidTime, '시간이 올바르지 않습니다.');

  return value;
}

export function readArray(value: unknown): unknown[] {
  const isArray = Array.isArray(value);

  ensureValid(isArray, '배열이 올바르지 않습니다.');

  const hasValidLength = value.length <= 500000;

  ensureValid(hasValidLength, '배열이 너무 큽니다.');

  return value;
}

export function ensureUnique(values: string[]): void {
  const isUnique = new Set(values).size === values.length;

  ensureValid(isUnique, '중복된 식별자가 있습니다.');
}

export function readUniqueList<T>(
  value: unknown,
  parse: (item: unknown) => T,
  key: (item: T) => string,
): T[] {
  const items = readArray(value).map(parse);

  ensureUnique(items.map(key));

  return items;
}

export function readOptionalTime(value: unknown): string | null | undefined {
  const isMissing = value === undefined;

  if (isMissing) {
    return undefined;
  }

  return readTime(value);
}
