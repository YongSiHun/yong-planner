import { showToast } from '../../../components/ui';
import { useLayoutEffect, useRef, useState, type ComponentRef } from 'react';
import {
  useWindowDimensions,
  type LayoutChangeEvent,
  type TextInput,
  type TextInputChangeEvent,
  type TextInputSelectionChangeEvent,
  type TextLayoutEvent,
} from 'react-native';
import { design } from '../../../components/ui/tokens';
import {
  insertNoteSlot,
  NOTE_SEPARATOR,
  noteInputCaret,
  noteInputValue,
  notePartTime,
  selectNotePart,
  startNoteEdit,
  storedNoteIndex,
  type NoteEdit,
} from '../services/note';
import { NoteInputEvents } from '../services/noteInputEvents';
import { formatScheduleTime, parseScheduleTimePrefix } from '../services/time';
import type { TimeFormat } from '../types';
import type { ScheduleInputProps } from '../types/presentation';
import { usePlannerActions } from './usePlannerActions';

export function useScheduleInputState({
  date,
  note,
  initialIndex,
  noteTimes = [],
  timeFormat = '24h',
  initialSlot,
  onSelect = () => {},
  onBlur,
  onEditPart,
  onInputFocus,
  onInputLayout,
}: ScheduleInputProps) {
  const { saveDailyNote } = usePlannerActions();
  const { height: windowHeight, width: windowWidth, fontScale } = useWindowDimensions();
  const maximumHeight = Math.max(80, Math.min(240, windowHeight * 0.32));
  const minimumHeight = Math.max(design.rowMinHeight, design.lineHeight * (fontScale ?? 1) + 8);
  const [edit, setEdit] = useState<NoteEdit>(() =>
    initialNoteEdit(note, initialIndex, initialSlot),
  );
  const [height, setHeight] = useState<number>(minimumHeight);
  const [availableWidth, setAvailableWidth] = useState(Math.max(30, windowWidth - 68));
  const [textWidth, setTextWidth] = useState({ text: '', width: 0 });
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const currentEdit = useRef(edit);
  const inputEvents = useRef(new NoteInputEvents(showToast));
  const selectionRequest = useRef<{ edit: NoteEdit; applied: boolean } | null>(null);
  const parts = edit.text.split(NOTE_SEPARATOR);
  const content = parts[edit.index]!;
  const activeTime = activeTimeLabel(
    content,
    notePartTime(noteTimes, edit, edit.index),
    timeFormat,
  );
  const estimatedWidth = estimateInputWidth(content, fontScale ?? 1);
  const measuredWidth = Math.max(estimatedWidth, textWidth.width);
  const inputWidth =
    edit.text.length === 0
      ? availableWidth
      : Math.min(availableWidth, Math.max(30, measuredWidth + 18));
  const caret = noteInputCaret(edit);
  const requestedSelection = caret === undefined ? undefined : { start: caret, end: caret };

  useLayoutEffect(() => {
    const hasCaret = caret !== undefined;

    if (!hasCaret) {
      return;
    }
    const request = { edit, applied: false };

    selectionRequest.current = request;
    let releaseFrame: number | undefined;
    const frame = requestAnimationFrame(() => {
      const isCurrent = currentEdit.current === request.edit;

      if (!isCurrent) {
        return;
      }
      input.current?.focus();
      input.current?.setSelection(caret, caret);
      request.applied = true;
      releaseFrame = requestAnimationFrame(() => {
        const stillCurrent = currentEdit.current === request.edit;

        if (!stillCurrent) {
          return;
        }
        const next = { ...currentEdit.current, caret: undefined };

        currentEdit.current = next;
        setEdit(next);
      });
      onInputLayout();
    });

    return () => {
      cancelAnimationFrame(frame);
      const hasReleaseFrame = releaseFrame !== undefined;

      if (hasReleaseFrame) {
        cancelAnimationFrame(releaseFrame);
      }
    };
  }, [caret, edit, onInputLayout]);

  function applyEdit(next: NoteEdit, persist = true) {
    const changedIndex = next.index !== currentEdit.current.index;

    if (changedIndex) {
      setHeight(minimumHeight);
      const nextContent = next.text.split(NOTE_SEPARATOR)[next.index] ?? '';

      setTextWidth({ text: nextContent, width: estimateInputWidth(nextContent, fontScale ?? 1) });
    }
    currentEdit.current = next;
    setEdit(next);
    if (persist) {
      saveDailyNote(date, next.text);
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

  function handleSelection(event: TextInputSelectionChangeEvent) {
    const current = currentEdit.current;
    const expected = noteInputCaret(current);
    const selection = event.nativeEvent.selection;
    const reachedCaret = expected === selection.start && expected === selection.end;
    const request = selectionRequest.current;
    const isCurrentRequest = request?.edit === current;
    const hasAppliedRequest = request?.applied === true && isCurrentRequest;
    const canReleaseCaret = hasAppliedRequest && reachedCaret;

    if (canReleaseCaret) {
      inputEvents.current.acknowledge();
      const next = { ...current, caret: undefined };

      currentEdit.current = next;
      setEdit(next);
    }
    onInputLayout();
  }

  function handleBlur() {
    onInputFocus(null);
    onBlur();
  }

  function selectEdit(next: NoteEdit) {
    const nextContent = next.text.split(NOTE_SEPARATOR)[next.index] ?? '';

    setHeight(minimumHeight);
    setTextWidth({ text: nextContent, width: estimateInputWidth(nextContent, fontScale ?? 1) });
    inputEvents.current.select(noteInputValue(currentEdit.current), noteInputValue(next));
    applyEdit(next, false);
  }

  function insertAt(boundary: number) {
    selectEdit(insertNoteSlot(currentEdit.current, boundary));
  }

  function handleTextLayout(event: TextLayoutEvent) {
    const current = currentEdit.current;
    const currentContent = current.text.split(NOTE_SEPARATOR)[current.index] ?? '';
    const isCurrent = currentContent === content;

    if (!isCurrent) {
      return;
    }
    const width = event.nativeEvent.lines.reduce(
      (maximum, line) => Math.max(maximum, line.width),
      0,
    );

    setHeight(
      Math.max(
        design.rowMinHeight,
        event.nativeEvent.lines.reduce(
          (total, line) => total + Math.max(line.height ?? 0, design.lineHeight * (fontScale ?? 1)),
          0,
        ) + 8,
      ),
    );
    setTextWidth((previous) => {
      const unchanged = previous.text === content && previous.width === width;

      return unchanged ? previous : { text: content, width };
    });
  }

  function handlePartPress(index: number) {
    const next = selectNotePart(currentEdit.current, index);

    selectEdit(next);
    onEditPart(next.index);
  }

  function handleLongPress(index: number) {
    onSelect(storedNoteIndex(currentEdit.current, index), true);
  }

  function handleFlowLayout(event: LayoutChangeEvent) {
    setAvailableWidth(Math.max(30, event.nativeEvent.layout.width - 10));
  }

  return {
    edit,
    parts,
    content,
    activeTime,
    input,
    availableWidth,
    requestedSelection,
    height,
    maximumHeight,
    inputWidth,
    handleChange,
    handleSelection,
    handleBlur,
    insertAt,
    handlePartPress,
    handleLongPress,
    handleTextLayout,
    handleFlowLayout,
  };
}

function estimateInputWidth(text: string, scale: number): number {
  const units = text
    .split('\n')
    .reduce((maximum, line) => Math.max(maximum, line.replace(/[^\x00-\x7F]/g, 'xx').length), 0);

  return units * design.type.body * scale * 0.5;
}

function activeTimeLabel(content: string, time: string | null, format: TimeFormat): string {
  const includesTime = parseScheduleTimePrefix(content).time !== undefined;

  return includesTime ? '' : formatScheduleTime(time, format);
}

function initialNoteEdit(
  note: string,
  index: number | undefined,
  slot: number | undefined,
): NoteEdit {
  const hasSlot = slot !== undefined;

  return hasSlot ? insertNoteSlot({ text: note, index: 0 }, slot) : startNoteEdit(note, index);
}
