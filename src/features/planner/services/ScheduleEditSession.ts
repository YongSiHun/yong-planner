import { normalizeScheduleLineEndings, noteLengthError } from '../../../services/schedule';
import { initialScheduleEdit, scheduleEditorValue } from './noteEditor';
import { parseScheduleTimePrefix } from './time';

export interface EditorEntry {
  readonly key: number;
  readonly content: string;
  readonly important: boolean;
  readonly alarm: boolean;
}

export interface EditorSnapshot {
  readonly entries: readonly EditorEntry[];
  readonly active: number;
  readonly session: number;
  readonly text: string;
}

export interface ScheduleEditOptions {
  note: string;
  noteTimes?: readonly (string | null)[];
  noteImportant?: readonly boolean[];
  noteAlarms?: readonly boolean[];
  initialIndex?: number;
  initialSlot?: number;
}

export type EditorChange = { text: string; split: boolean } | { error: string } | null;

// Domain state machine. Native typing updates only the active draft, not the chip snapshot.
export class ScheduleEditSession {
  private snapshot: EditorSnapshot;
  private draft: string;
  private eventCount = -1;
  private nextKey = 0;

  constructor(options: ScheduleEditOptions) {
    const initial = initialScheduleEdit(
      options.note,
      options.noteTimes ?? [],
      options.initialIndex,
      options.initialSlot,
    );
    const storedCount = options.note.length ? options.note.split(',').length : 0;
    const inserted = initial.parts.length > storedCount;
    const entries = initial.parts.map((content, index) => {
      const placeholder = inserted && index === initial.active;
      const original = index - Number(inserted && index > initial.active);

      return this.entry(
        content,
        !placeholder && Boolean(options.noteImportant?.[original]),
        !placeholder && Boolean(options.noteAlarms?.[original]),
      );
    });

    this.snapshot = { entries, active: initial.active, session: 0, text: initial.text };
    this.draft = initial.text;
  }

  view(): EditorSnapshot {
    return this.snapshot;
  }

  text(): string {
    return this.draft;
  }

  isCurrent(session: number): boolean {
    return session === this.snapshot.session;
  }

  serialize(): string {
    return this.snapshot.entries
      .map((entry, index) => (index === this.snapshot.active ? this.draft : entry.content))
      .join(',');
  }

  change(nativeText: string, count: number, session: number): EditorChange {
    const stale = !this.isCurrent(session) || count <= this.eventCount;

    if (stale) {
      return null;
    }
    this.eventCount = count;
    const text = normalizeScheduleLineEndings(nativeText);
    const error = noteLengthError(text);

    if (error) {
      return { error };
    }
    const split = text.includes(',');

    if (split) {
      this.split(scheduleEditorValue(text).split(','));

      return { text: this.draft, split: true };
    }
    this.draft = text;

    return { text, split: false };
  }

  activate(target: number, insert = false): boolean {
    const same = !insert && target === this.snapshot.active;

    if (same) {
      return false;
    }
    const { entries, active } = this.snapshot;
    const next = [...entries];
    const committed = this.commit(entries[active]!, this.draft.trim());
    const empty = committed.content.length === 0;

    const replacement = [committed].filter((entry) => entry.content.length > 0);

    next.splice(active, 1, ...replacement);
    target -= Number(empty && target > active);
    target = Math.max(0, Math.min(target, next.length));

    if (insert) {
      next.splice(target, 0, this.entry(''));
    }
    this.transition(next, target);

    return true;
  }

  private split(parts: string[]) {
    const { entries, active } = this.snapshot;
    const source = entries[active]!;
    const last = parts.length - 1;
    const meaningful = parts.filter((part, index) => index === last || part.trim().length > 0);
    const replacements = meaningful.map((part, index) =>
      index === 0 ? this.commit(source, part) : this.entry(part),
    );
    const next = [...entries.slice(0, active), ...replacements, ...entries.slice(active + 1)];

    this.transition(next, active + replacements.length - 1);
  }

  private transition(entries: readonly EditorEntry[], active: number) {
    this.draft = entries[active]?.content ?? '';
    this.eventCount = -1;
    this.snapshot = { entries, active, session: this.snapshot.session + 1, text: this.draft };
  }

  private commit(entry: EditorEntry, content: string): EditorEntry {
    const sameTime =
      parseScheduleTimePrefix(entry.content).time === parseScheduleTimePrefix(content).time;

    return { ...entry, content, alarm: entry.alarm && sameTime };
  }

  private entry(content: string, important = false, alarm = false): EditorEntry {
    return { key: this.nextKey++, content, important, alarm };
  }
}
