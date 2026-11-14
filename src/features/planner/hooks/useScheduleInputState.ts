import { useCallback, useRef, useState } from 'react';
import type { TextInputChangeEvent } from 'react-native';
import { showToast } from '../../../components/ui';
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
import { useInputGeometry } from './useInputGeometry';
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
  const { saveDailyNote, finishDailyNote } = usePlannerActions();
  const [edit, setEdit] = useState<NoteEdit>(() =>
    initialNoteEdit(noteEditText(note, noteTimes), initialIndex, initialSlot),
  );
  const currentEdit = useRef(edit);
  const inputEvents = useRef(new NoteInputEvents(showToast));
  const parts = edit.text.split(NOTE_SEPARATOR);
  const content = parts[edit.index]!;
  const getContent = useCallback(() => currentContent(currentEdit.current), []);
  const { resize, ...geometry } = useInputGeometry({
    content,
    initiallyEmpty: edit.text.length === 0,
    getContent,
  });
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

  function applyEdit(next: NoteEdit, persist = true) {
    const changedIndex =
      next.index !== currentEdit.current.index ||
      currentContent(currentEdit.current).trim().length === 0;

    resize(currentContent(next), changedIndex);
    currentEdit.current = next;
    setEdit(next);
    if (persist) {
      saveDailyNote(date, next.text, true);
    }
  }

  function handleChange(event: TextInputChangeEvent) {
    const { text, eventCount } = event.nativeEvent;
    const next = inputEvents.current.change(currentEdit.current, text, eventCount);
    const hasChange = next !== null;

    if (hasChange) {
      applyEdit(next);
    }
  }

  function handleBlur() {
    finishDailyNote(date);
    onInputFocus(null);
    onBlur();
  }

  function selectEdit(next: NoteEdit) {
    resize(currentContent(next), true);
    inputEvents.current.select(noteInputValue(currentEdit.current), noteInputValue(next));
    applyEdit(next, false);
  }

  function handlePartPress(index: number) {
    const next = selectNotePart(currentEdit.current, index);

    selectEdit(next);
    onEditPart(next.index);
  }

  return {
    edit,
    parts,
    content,
    ...geometry,
    ...caret,
    handleChange,
    handleBlur,
    insertAt: (boundary: number) => selectEdit(insertNoteSlot(currentEdit.current, boundary)),
    handlePartPress,
    handleLongPress: (index: number) => onSelect(storedNoteIndex(currentEdit.current, index), true),
  };
}

function currentContent(edit: NoteEdit): string {
  return edit.text.split(NOTE_SEPARATOR)[edit.index] ?? '';
}

function initialNoteEdit(
  note: string,
  index: number | undefined,
  slot: number | undefined,
): NoteEdit {
  const hasSlot = slot !== undefined;

  return hasSlot ? insertNoteSlot({ text: note, index: 0 }, slot) : startNoteEdit(note, index);
}
