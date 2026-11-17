import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TextInputChangeEvent } from 'react-native';
import { report, showToast } from '../../../components/ui';
import {
  insertNoteSlot,
  NOTE_SEPARATOR,
  noteInputCaret,
  noteInputValue,
  noteEditText,
  selectNotePart,
  startNoteEdit,
  storedNoteIndex,
  type NoteEdit,
} from '../services/note';
import { NoteInputEvents } from '../services/noteInputEvents';
import type { ScheduleInputProps } from '../types/presentation';
import { useInputCaret } from './useInputCaret';
import { useNativeInputBuffer } from './useNativeInputBuffer';
import { usePlannerActions } from './usePlannerActions';

export function useScheduleInputState({
  date,
  note,
  initialIndex,
  noteTimes = [],
  initialSlot,
  onSelect = () => {},
  onBlur,
  onEditPart,
  onInputFocus,
  onInputLayout,
}: ScheduleInputProps) {
  const { stageDailyNote, finishDailyNote, flush } = usePlannerActions();
  const finalized = useRef(false);
  const finish = useCallback(() => {
    const isFinalized = finalized.current;

    if (isFinalized) {
      return;
    }
    finalized.current = true;
    finishDailyNote(date);
    void flush().catch(report);
  }, [date, finishDailyNote, flush]);

  useEffect(() => finish, [finish]);
  const [edit, setEdit] = useState<NoteEdit>(() =>
    initialNoteEdit(noteEditText(note, noteTimes), initialIndex, initialSlot),
  );
  const currentEdit = useRef(edit);
  const {
    value: nativeValue,
    defaultValue: initialValue,
    accept,
    replace,
  } = useNativeInputBuffer(noteInputValue(edit));
  const inputEvents = useRef(new NoteInputEvents(showToast));
  const releaseCaret = useCallback((current: NoteEdit) => {
    const next = { ...current, caret: undefined };

    currentEdit.current = next;
    setEdit(next);
  }, []);
  const acknowledge = useCallback(() => inputEvents.current.acknowledge(), []);
  const caret = useInputCaret({
    value: edit,
    currentValue: currentEdit,
    position: noteInputCaret(edit),
    onRelease: releaseCaret,
    onAcknowledge: acknowledge,
    onLayout: onInputLayout,
  });

  const applyEdit = useCallback(
    (next: NoteEdit, persist = true) => {
      const current = currentEdit.current;
      const changedStructure = next.index !== current.index || current.caret !== undefined;

      currentEdit.current = next;
      if (changedStructure) {
        setEdit(next);
      }
      if (persist) {
        finalized.current = false;
        stageDailyNote(date, next.text, true);
      }
    },
    [date, stageDailyNote],
  );

  function handleChange(event: TextInputChangeEvent) {
    const { text, eventCount } = event.nativeEvent;
    const next = inputEvents.current.change(currentEdit.current, text, eventCount);
    const ignored = next === null;

    if (ignored) {
      restoreRejectedInput();

      return;
    }
    accept(text, noteInputValue(next));
    applyEdit(next);
  }

  function restoreRejectedInput() {
    const rejected = inputEvents.current.rejected;

    if (rejected) {
      replace(noteInputValue(currentEdit.current));
    }
  }

  function handleBlur() {
    finish();
    onInputFocus(null);
    onBlur();
  }

  const selectEdit = useCallback(
    (next: NoteEdit) => {
      inputEvents.current.select(noteInputValue(currentEdit.current), noteInputValue(next));
      replace(noteInputValue(next));
      currentEdit.current = next;
      setEdit(next);
    },
    [replace],
  );
  const handlePartPress = useCallback(
    (index: number) => {
      const next = selectNotePart(currentEdit.current, index);

      selectEdit(next);
      onEditPart(next.index);
    },
    [selectEdit, onEditPart],
  );
  const insertAt = useCallback(
    (boundary: number) => selectEdit(insertNoteSlot(currentEdit.current, boundary)),
    [selectEdit],
  );
  const handleLongPress = useCallback(
    (index: number) => onSelect(storedNoteIndex(currentEdit.current, index), true),
    [onSelect],
  );

  const parts = useMemo(() => edit.text.split(NOTE_SEPARATOR), [edit.text]);

  return {
    edit,
    parts,
    nativeValue,
    initialValue,
    ...caret,
    handleChange,
    handleBlur,
    insertAt,
    handlePartPress,
    handleLongPress,
  };
}

function initialNoteEdit(
  note: string,
  index: number | undefined,
  slot: number | undefined,
): NoteEdit {
  const hasSlot = slot !== undefined;

  return hasSlot ? insertNoteSlot({ text: note, index: 0 }, slot) : startNoteEdit(note, index);
}
