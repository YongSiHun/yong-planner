import type { DailyPlanItem, PlannerData } from '../types';
import { reconcileOrder } from './order';
import { dailyItemsForDate } from './plans';
import { parseScheduleTimePrefix } from './time';

export const NOTE_SEPARATOR = ',';

export function dailyNoteItems(data: PlannerData, date: string): DailyPlanItem[] {
  const items = dailyItemsForDate(data, date);
  const byId = new Map(items.map((item) => [item.id, item]));
  const entries = items.map((item) => ({
    id: 'daily:' + item.id,
    sourceId: item.id,
    kind: 'daily' as const,
    content: item.content,
    time: item.time ?? null,
    sortKey: item.createdAt + ':' + item.id,
  }));
  const custom = data.dailyPlanOrders.find((order) => order.date === date)?.itemIds;

  return reconcileOrder(entries, custom).map((entry) => byId.get(entry.sourceId)!);
}

// 공백·빈 구간 보존: 구분자 삭제 시 원문 병합.
export function splitNote(text: string): string[] {
  const isEmpty = text.length === 0;

  return isEmpty ? [] : text.split(NOTE_SEPARATOR);
}

export function applyDailyNote(
  data: PlannerData,
  date: string,
  text: string,
  createId: () => string,
  replaceTimes = false,
): PlannerData {
  const existing = dailyNoteItems(data, date);
  const parsed = splitNote(text).map(parseScheduleTimePrefix);
  const contents = parsed.map((item) => item.content);
  const isUnchanged =
    contents.length === existing.length &&
    contents.every((content, index) =>
      matchesSavedNote(existing[index]!, content, parsed[index]!.time, replaceTimes),
    );

  if (isUnchanged) {
    return data;
  }

  const preserved = preserveNoteItems(existing, contents);
  const latest = latestForNewItems(data, preserved);
  const items = contents.map((content, index) => ({
    ...preserved[index],
    id: preserved[index]?.id ?? createId(),
    date,
    content,
    ...parsedTime(parsed[index]!.time, replaceTimes),
    createdAt: preserved[index]?.createdAt ?? new Date(latest + index + 1).toISOString(),
  }));
  const previousOrder = data.dailyPlanOrders.find((order) => order.date === date)?.itemIds ?? [];
  const itemIds = mergeNoteOrder(
    previousOrder,
    items.map((item) => 'daily:' + item.id),
  );

  return {
    ...data,
    dailyPlanItems: [...data.dailyPlanItems.filter((item) => item.date !== date), ...items],
    dailyPlanOrders: [
      ...data.dailyPlanOrders.filter((order) => order.date !== date),
      { date, itemIds },
    ],
  };
}

// 메모 입력 순서·반복 일정 상대 위치 유지.
export function mergeNoteOrder(previous: string[], dailyIds: string[]): string[] {
  let index = 0;
  const replaced = previous.flatMap((id) => {
    const isDaily = id.startsWith('daily:');

    if (!isDaily) {
      return [id];
    }

    const replacement = dailyIds[index++];
    const hasReplacement = replacement !== undefined;

    return hasReplacement ? [replacement] : [];
  });

  return [...replaced, ...dailyIds.slice(index)];
}

export interface NoteEdit {
  text: string;
  index: number;
  caret?: number;
  draftSlot?: boolean;
}

function sharedPrefixLength(before: string, after: string): number {
  let length = 0;
  const maximum = Math.min(before.length, after.length);

  while (length < maximum && before[length] === after[length]) {
    length++;
  }

  return length;
}

function sharedSuffixLength(before: string, after: string): number {
  let length = 0;
  const maximum = Math.min(before.length, after.length) - sharedPrefixLength(before, after);

  while (
    length < maximum &&
    before[before.length - length - 1] === after[after.length - length - 1]
  ) {
    length++;
  }

  return length;
}

export function replaceNotePart(text: string, index: number, value: string): NoteEdit {
  const parts = text.split(NOTE_SEPARATOR);
  const inserted = value.split(NOTE_SEPARATOR);
  const suffix = sharedSuffixLength(parts[index] ?? '', value);
  const hasSeparator = inserted.length > 1;
  const caret = hasSeparator
    ? Math.max(0, value.length - suffix - value.lastIndexOf(NOTE_SEPARATOR) - 1)
    : undefined;

  return {
    text: [...parts.slice(0, index), ...inserted, ...parts.slice(index + 1)].join(NOTE_SEPARATOR),
    index: index + inserted.length - 1,
    caret,
  };
}

export function mergeNotePart(text: string, index: number): NoteEdit | null {
  const parts = text.split(NOTE_SEPARATOR);
  const canMerge = index > 0 && index < parts.length;

  if (!canMerge) {
    return null;
  }

  const previous = parts[index - 1]!;

  parts.splice(index - 1, 2, previous + parts[index]!);

  return { text: parts.join(NOTE_SEPARATOR), index: index - 1, caret: previous.length };
}

// Native 전용 U+200B: 백스페이스를 단일 변경으로 처리.
// DB·내보내기에서 제외.
export const NOTE_INPUT_BOUNDARY = '\u200B';
export function noteInputValue(edit: NoteEdit): string {
  const prefix = edit.index > 0 ? NOTE_INPUT_BOUNDARY : '';

  return prefix + edit.text.split(NOTE_SEPARATOR)[edit.index]!;
}

export function changeNoteInput(edit: NoteEdit, value: string): NoteEdit {
  const hasBoundary = edit.index > 0;
  const keepsBoundary = value.startsWith(NOTE_INPUT_BOUNDARY);
  const content = value.replaceAll(NOTE_INPUT_BOUNDARY, '');

  if (!hasBoundary) {
    return replaceNotePart(edit.text, edit.index, content);
  }

  if (keepsBoundary) {
    return replaceNotePart(edit.text, edit.index, content);
  }

  const previous = edit.text.split(NOTE_SEPARATOR)[edit.index - 1]!;
  const merged = mergeNotePart(edit.text, edit.index)!;
  const next = replaceNotePart(merged.text, merged.index, previous + content);

  return { ...next, caret: next.caret ?? previous.length };
}

export function startNoteEdit(note: string, initialIndex?: number): NoteEdit {
  const needsEmptyInput =
    initialIndex === undefined && note.length > 0 && !note.endsWith(NOTE_SEPARATOR);
  const text = needsEmptyInput ? note + NOTE_SEPARATOR : note;
  const parts = text.split(NOTE_SEPARATOR);
  const index = Math.max(0, Math.min(initialIndex ?? parts.length - 1, parts.length - 1));

  return { text, index, caret: parts[index]!.length, draftSlot: needsEmptyInput };
}

export function noteInputCaret(edit: NoteEdit): number | undefined {
  const hasCaret = edit.caret !== undefined;

  if (!hasCaret) {
    return undefined;
  }
  const prefixLength = edit.index > 0 ? NOTE_INPUT_BOUNDARY.length : 0;

  return edit.caret! + prefixLength;
}

export function insertNoteSlot(edit: NoteEdit, boundary: number): NoteEdit {
  const prepared = removeDraftSlot(edit, boundary);
  const parts = prepared.text.split(NOTE_SEPARATOR);
  const index = Math.max(0, Math.min(prepared.boundary, parts.length));
  const hasEmptySlot = parts[index] === '';

  if (!hasEmptySlot) {
    parts.splice(index, 0, '');
  }

  return { text: parts.join(NOTE_SEPARATOR), index, caret: 0, draftSlot: !hasEmptySlot };
}

function removeDraftSlot(edit: NoteEdit, boundary: number) {
  const hasDraft = edit.draftSlot === true;

  if (!hasDraft) {
    return { text: edit.text, boundary };
  }
  const parts = edit.text.split(NOTE_SEPARATOR);

  parts.splice(edit.index, 1);

  return { text: parts.join(NOTE_SEPARATOR), boundary: boundary - Number(boundary > edit.index) };
}

export function storedNoteIndex(edit: NoteEdit, index: number): number {
  const isAfterDraft = edit.draftSlot === true && index > edit.index;

  return index - Number(isAfterDraft);
}

export function selectNotePart(edit: NoteEdit, index: number): NoteEdit {
  const prepared = removeDraftSlot(edit, index);
  const content = prepared.text.split(NOTE_SEPARATOR)[prepared.boundary] ?? '';

  return { text: prepared.text, index: prepared.boundary, caret: content.length };
}

function preserveNoteItems(
  existing: DailyPlanItem[],
  contents: string[],
): (DailyPlanItem | undefined)[] {
  const before = existing.map((item) => item.content);
  const prefix = sharedPartPrefix(before, contents);
  const suffix = sharedPartSuffix(before, contents, prefix);

  return contents.map((_, index) =>
    existingNoteForIndex(existing, index, contents.length, prefix, suffix),
  );
}

function sharedPartPrefix(before: string[], after: string[]): number {
  let index = 0;
  const maximum = Math.min(before.length, after.length);

  while (index < maximum && before[index] === after[index]) {
    index++;
  }

  return index;
}

function sharedPartSuffix(before: string[], after: string[], prefix: number): number {
  let length = 0;
  const maximum = Math.min(before.length, after.length) - prefix;

  while (
    length < maximum &&
    before[before.length - length - 1] === after[after.length - length - 1]
  ) {
    length++;
  }

  return length;
}

function existingNoteForIndex(
  existing: DailyPlanItem[],
  index: number,
  size: number,
  prefix: number,
  suffix: number,
): DailyPlanItem | undefined {
  const isPrefix = index < prefix;

  if (isPrefix) {
    return existing[index];
  }
  const isSuffix = index >= size - suffix;

  if (isSuffix) {
    return existing[existing.length - (size - index)];
  }
  const oldMiddleSize = existing.length - prefix - suffix;
  const canReuse = index - prefix < oldMiddleSize;

  return canReuse ? existing[index] : undefined;
}

function matchesSavedNote(
  item: DailyPlanItem,
  content: string,
  time: string | undefined,
  replaceTimes: boolean,
): boolean {
  const unchangedTime = replaceTimes
    ? (time ?? null) === (item.time ?? null)
    : time === undefined || time === item.time;

  return item.content === content && unchangedTime;
}

function parsedTime(
  time: string | undefined,
  replaceTimes: boolean,
): { time?: string | null; alarm?: undefined } {
  const clearTime = replaceTimes && time === undefined;

  if (clearTime) {
    return { time: null, alarm: undefined };
  }
  const hasTime = time !== undefined;

  return hasTime ? { time } : {};
}

function latestForNewItems(data: PlannerData, preserved: (DailyPlanItem | undefined)[]): number {
  const hasNewItem = preserved.some((item) => item === undefined);

  if (!hasNewItem) {
    return 0;
  }

  return data.dailyPlanItems.reduce(
    (value, item) => Math.max(value, Date.parse(item.createdAt)),
    Date.now(),
  );
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
