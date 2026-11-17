import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
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
  initialSlot,
  onBlur,
  onInputFocus,
}: ScheduleInputProps) {
  const { stageDailyNote, finishDailyNote, flush } = usePlannerActions();
  const [initial] = useState(() => initialScheduleEdit(note, noteTimes, initialIndex, initialSlot));
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const draft = useRef(initial.text);
  const eventCount = useRef(-1);
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

  useEffect(() => finish, [finish]);
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => {
      const untouched = eventCount.current === -1;

      if (untouched) {
        input.current?.setSelection(initial.caret, initial.caret);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [initial]);

  function handleChange(event: TextInputChangeEvent) {
    const native = event.nativeEvent;
    const stale = native.eventCount <= eventCount.current;

    if (stale) {
      return;
    }
    eventCount.current = native.eventCount;
    const text = normalizeScheduleLineEndings(native.text);
    const value = scheduleEditorValue(text);
    const error = noteLengthError(value);
    const invalid = error !== null;

    if (invalid) {
      showToast(error);
      replace(draft.current);

      return;
    }
    accept(native.text, text);
    draft.current = text;
    finalized.current = false;
    stageDailyNote(date, value, true);
  }

  function handleBlur() {
    finish();
    onInputFocus(null);
    onBlur();
  }

  return { input, initialValue, nativeValue, handleChange, handleBlur };
}
