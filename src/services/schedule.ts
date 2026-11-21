export const MAX_SCHEDULE_LENGTH = 255;
export const SCHEDULE_LENGTH_MESSAGE = '일정은 255자까지 입력할 수 있어요.';

function exceedsLimit(value: string, separated: boolean): boolean {
  let length = 0;

  for (const character of value) {
    const separator = separated && character === ',';

    length = (length + 1) * Number(!separator);
    const tooLong = length > MAX_SCHEDULE_LENGTH;

    if (tooLong) {
      return true;
    }
  }

  return false;
}

// Constant extra memory, bounded work for oversized individual schedules.
export function scheduleLengthError(value: string): string | null {
  return exceedsLimit(value, false) ? SCHEDULE_LENGTH_MESSAGE : null;
}

export function noteLengthError(value: string): string | null {
  return exceedsLimit(value, true) ? SCHEDULE_LENGTH_MESSAGE : null;
}

export function normalizeScheduleLineEndings(value: string): string {
  return value.replace(/\r\n?/g, '\n');
}

export function ensureScheduleLength(value: string): void {
  const error = scheduleLengthError(value);

  if (error) {
    throw new Error(error);
  }
}
