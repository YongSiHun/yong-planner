import { NOTE_SEPARATOR, noteEditText } from './noteText';

export function initialScheduleEdit(
  note: string,
  times: readonly (string | null)[],
  index?: number,
  slot?: number,
) {
  const text = noteEditText(note, times).replace(/,[ \t]*/g, ', ');

  return { text, caret: partCaret(text, slot ?? index, slot !== undefined) };
}

// Separator padding belongs to the editor display, not the stored schedule content.
export function scheduleEditorValue(text: string): string {
  return text.replace(/,[ \t]*/g, NOTE_SEPARATOR);
}

function partCaret(text: string, index: number | undefined, atStart: boolean): number {
  const atEnd = index === undefined;

  if (atEnd) {
    return text.length;
  }
  const parts = text.split(NOTE_SEPARATOR);
  const target = Math.max(0, Math.min(index, parts.length));
  const start = parts.slice(0, target).reduce((offset, part) => offset + part.length + 1, 0);
  const padding = Number(target > 0 && parts[target]?.startsWith(' ') === true);
  const offset = atStart ? padding : (parts[target]?.length ?? 0);

  return Math.min(text.length, start + offset);
}
