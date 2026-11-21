import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import type { TextInput, TextInputChangeEvent } from 'react-native';
import { report, showToast } from '../../../components/ui';
import { normalizeScheduleLineEndings, noteLengthError } from '../../../services/schedule';
import { initialScheduleEdit, scheduleEditorValue } from '../services/noteEditor';
import type { ScheduleInputProps } from '../types/presentation';
import { useNativeInputBuffer } from './useNativeInputBuffer';
import { usePlannerActions } from './usePlannerActions';

export function useScheduleInputState({
  date,
  note,
  initialIndex,
  noteTimes = [],
  noteImportant = [],
  noteAlarms = [],
  initialSlot,
  onBlur,
  onInputFocus,
}: ScheduleInputProps) {
  const { stageDailyNote, finishDailyNote, flush } = usePlannerActions();
  const [initial] = useState(() => {
    const value = initialScheduleEdit(note, noteTimes, initialIndex, initialSlot);

    return {
      ...value,
      session: 0,
      marks: initialScheduleMarks(
        note,
        noteImportant,
        noteAlarms,
        value.active,
        value.parts.length,
      ),
    };
  });
  const [editor, setEditor] = useState(initial);
  const current = useRef(initial);
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const draft = useRef(initial.text);
  const eventCount = useRef(-1);
  const blurFrame = useRef<number | null>(null);
  const finalized = useRef(false);
  const {
    value: nativeValue,
    defaultValue: initialValue,
    accept,
    replace,
  } = useNativeInputBuffer(initial.text);
  const finish = useCallback(() => {
    const isFinalized = finalized.current;

    if (isFinalized) {
      return;
    }
    finalized.current = true;
    finishDailyNote(date);
    void flush().catch(report);
  }, [date, finishDailyNote, flush]);

  useEffect(
    () => () => {
      const pendingBlur = blurFrame.current !== null;

      if (pendingBlur) {
        cancelAnimationFrame(blurFrame.current!);
      }
      finish();
    },
    [finish],
  );

  function publish(parts: string[]) {
    finalized.current = false;
    stageDailyNote(date, parts.join(','), true);
  }

  function handleChange(event: TextInputChangeEvent) {
    const native = event.nativeEvent;
    const stale = isStaleInput(
      editor.session,
      current.current.session,
      native.eventCount,
      eventCount.current,
    );

    if (stale) {
      return;
    }
    eventCount.current = native.eventCount;
    const text = normalizeScheduleLineEndings(native.text);
    const segments = scheduleEditorValue(text).split(',');
    const { parts, active, marks } = current.current;
    const next = [...parts.slice(0, active), ...segments, ...parts.slice(active + 1)];
    const error = noteLengthError(next.join(','));
    const invalid = error !== null;

    if (invalid) {
      showToast(error);
      replace(draft.current);

      return;
    }
    const split = segments.length > 1;
    const tail = segments[segments.length - 1]!;
    const nextActive = active + segments.length - 1;

    const nextMarks = [...marks];

    nextMarks.splice(
      active + 1,
      0,
      ...segments.slice(1).map(() => ({ important: false, alarm: false })),
    );
    current.current = {
      session: current.current.session + Number(split),
      parts: next,
      active: nextActive,
      text: tail,
      caret: tail.length,
      marks: nextMarks,
    };
    draft.current = tail;
    publish(next);
    if (split) {
      eventCount.current = -1;
      replace(tail);
      setEditor(current.current);
    } else {
      accept(native.text, text);
    }
  }

  function activate(target: number, insert = false) {
    const pendingBlur = blurFrame.current !== null;

    if (pendingBlur) {
      cancelAnimationFrame(blurFrame.current!);
      blurFrame.current = null;
    }
    const { parts, active, marks } = current.current;
    const sameChip = !insert && target === active;

    if (sameChip) {
      input.current?.focus();

      return;
    }
    const next = [...parts];
    const nextMarks = [...marks];

    next[active] = draft.current.trim();
    target = removeEmptyActive(next, nextMarks, active, target);
    target = Math.max(0, Math.min(target, next.length));
    if (insert) {
      next.splice(target, 0, '');
      nextMarks.splice(target, 0, { important: false, alarm: false });
    }
    const text = next[target] ?? '';

    current.current = {
      parts: next,
      active: target,
      text,
      caret: text.length,
      marks: nextMarks,
      session: current.current.session + 1,
    };
    eventCount.current = -1;
    draft.current = text;
    publish(next);
    replace(text);
    setEditor(current.current);
  }

  function handleBlur() {
    const previousSession = editor.session !== current.current.session;

    if (previousSession) {
      return;
    }
    // A chip press in this row can cancel the blur and move the editor first.
    blurFrame.current = requestAnimationFrame(() => {
      blurFrame.current = null;
      finish();
      onInputFocus(null);
      onBlur();
    });
  }

  return {
    input,
    initialValue,
    nativeValue,
    handleChange,
    handleBlur,
    marks: editor.marks,
    session: editor.session,
    parts: editor.parts,
    active: editor.active,
    activate,
  };
}

function removeEmptyActive(
  parts: string[],
  marks: { important?: boolean; alarm?: boolean }[],
  active: number,
  target: number,
): number {
  const hasContent = Boolean(parts[active]);

  if (hasContent) {
    return target;
  }
  parts.splice(active, 1);
  marks.splice(active, 1);

  return target - Number(target > active);
}

function initialScheduleMarks(
  note: string,
  important: readonly boolean[],
  alarms: readonly boolean[],
  active: number,
  count: number,
) {
  const items = note.length
    ? note.split(',').map((_, index) => ({
        important: important[index],
        alarm: alarms[index],
      }))
    : [];
  const inserting = count > items.length;

  if (inserting) {
    items.splice(active, 0, { important: false, alarm: false });
  }

  return items;
}

function isStaleInput(session: number, currentSession: number, count: number, latest: number) {
  return session !== currentSession || count <= latest;
}
