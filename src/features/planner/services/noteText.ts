import { parseScheduleTimePrefix } from './time';

export const NOTE_SEPARATOR = ',';

// 공백·빈 구간 보존: 구분자 삭제 시 원문 병합.
export function splitNote(text: string): string[] {
  const isEmpty = text.length === 0;

  return isEmpty ? [] : text.split(NOTE_SEPARATOR);
}

export function noteEditText(note: string, times: readonly (string | null)[]): string {
  return splitNote(note)
    .map((content, index) => {
      const time = times[index];
      const hasPrefix = parseScheduleTimePrefix(content).time !== undefined;
      const addTime = Boolean(time) && !hasPrefix;

      return addTime ? time + ' ' + content : content;
    })
    .join(NOTE_SEPARATOR);
}
