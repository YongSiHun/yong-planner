import { noteEditText, splitNote } from './noteText';

export function initialScheduleEdit(
  note: string,
  times: readonly (string | null)[],
  index?: number,
  slot?: number,
) {
  const parts = splitNote(noteEditText(note, times));
  const active = Math.max(0, Math.min(slot ?? index ?? parts.length, parts.length));
  const inserting = slot !== undefined || active === parts.length;

  if (inserting) {
    parts.splice(active, 0, '');
  }
  const text = parts[active] ?? '';

  return { parts, active, text, caret: text.length };
}

// Separator padding belongs to the editor display, not the stored schedule content.
export function scheduleEditorValue(text: string): string {
  return text.replace(/,[ \t]*/g, ',');
}
