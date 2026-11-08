export const MAX_SCHEDULE_LENGTH = 255;
export const SCHEDULE_LENGTH_MESSAGE = '일정은 255자까지 입력할 수 있어요.';

export function scheduleLengthError(value: string): string | null {
  const tooLong = Array.from(value).length > MAX_SCHEDULE_LENGTH;

  return tooLong ? SCHEDULE_LENGTH_MESSAGE : null;
}

export function noteLengthError(value: string): string | null {
  const tooLong = value.split(',').some((part) => scheduleLengthError(part) !== null);

  return tooLong ? SCHEDULE_LENGTH_MESSAGE : null;
}

export function normalizeNoteSeparators(value: string): string {
  return value.replace(/\r\n|[\r\n]/g, ',');
}
