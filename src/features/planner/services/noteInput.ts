import { normalizeNoteSeparators } from '../../../services/schedule';
import { NOTE_SEPARATOR } from './noteText';

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
  const content = normalizeNoteSeparators(value.replaceAll(NOTE_INPUT_BOUNDARY, ''));

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
