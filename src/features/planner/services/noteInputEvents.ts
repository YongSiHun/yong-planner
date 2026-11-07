import { changeNoteInput, noteInputValue, type NoteEdit } from './note';

type Transition = { kind: 'split' | 'merge' | 'select'; before: string; after: string };

// Native input can emit more edits against its old buffer before a JS text update arrives.
export class NoteInputEvents {
  private eventCount = -1;
  private lastRaw: string | null = null;
  private transition: Transition | null = null;

  select(before: string, after: string) {
    this.transition = { kind: 'select', before, after };
  }

  acknowledge() {
    this.transition = null;
    this.lastRaw = null;
  }

  change(edit: NoteEdit, raw: string, eventCount: number): NoteEdit | null {
    const canProcess = this.canProcess(raw, eventCount);

    if (!canProcess) {
      return null;
    }
    const value = this.normalize(raw);

    const hasValue = value !== null;

    if (!hasValue) {
      return null;
    }
    this.lastRaw = raw;
    const next = changeNoteInput(edit, value);
    const after = noteInputValue(next);

    this.updateTransition(edit, next, raw, value, after);

    return next;
  }

  private updateTransition(
    edit: NoteEdit,
    next: NoteEdit,
    raw: string,
    value: string,
    after: string,
  ) {
    const needsTransform = after !== value;

    if (needsTransform) {
      this.transition = { kind: next.index > edit.index ? 'split' : 'merge', before: raw, after };
    } else {
      this.finishTransition(raw, value);
    }
  }

  private canProcess(raw: string, eventCount: number): boolean {
    const isOld = eventCount <= this.eventCount;

    if (isOld) {
      return false;
    }
    this.eventCount = eventCount;
    const isRepeated = this.transition !== null && raw === this.lastRaw;

    return !isRepeated;
  }

  private finishTransition(raw: string, value: string) {
    const isNativeBufferUpdated = raw === value;

    if (isNativeBufferUpdated) {
      this.transition = null;
    }
  }

  private normalize(raw: string): string | null {
    const transition = this.transition;

    if (!transition) {
      return raw;
    }
    const isSelection = transition.kind === 'select';

    if (isSelection) {
      return normalizeSelection(raw, transition);
    }

    return transition.kind === 'split'
      ? normalizeSplit(raw, transition)
      : normalizeMerge(raw, transition);
  }
}

function normalizeSplit(raw: string, transition: Transition): string {
  const usesOldBuffer = raw.startsWith(transition.before);

  if (usesOldBuffer) {
    return transition.after + raw.slice(transition.before.length);
  }
  const isOldBoundaryDeleted =
    !raw.startsWith(transition.after) && raw.length < transition.before.length;

  return isOldBoundaryDeleted ? '' : raw;
}

function normalizeMerge(raw: string, transition: Transition): string {
  const prefix = transition.after.slice(0, transition.after.length - transition.before.length);
  const usesNewBuffer = raw.startsWith(prefix);

  return usesNewBuffer ? raw : prefix + raw;
}

function normalizeSelection(raw: string, transition: Transition): string | null {
  const repeatsOldBuffer = raw === transition.before && raw !== transition.after;

  return repeatsOldBuffer ? null : raw;
}
