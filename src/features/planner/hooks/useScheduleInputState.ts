import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import type { TextInput, TextInputChangeEvent } from 'react-native';
import { showToast } from '../../../components/ui';
import { ScheduleEditSession } from '../services/ScheduleEditSession';
import type { ScheduleInputProps } from '../types/presentation';
import { useNativeInputBuffer } from './useNativeInputBuffer';
import { useScheduleDraft } from './useScheduleDraft';

// Presentation adapter: native events, focus and structural render snapshots only.
export function useScheduleInputState(props: ScheduleInputProps) {
  const { onInputFocus } = props;
  const [model] = useState(() => new ScheduleEditSession(props));
  const [editor, setEditor] = useState(() => model.view());
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const blurFrame = useRef<number | null>(null);
  const { stage, finish } = useScheduleDraft(props.date, model);
  const {
    value: nativeValue,
    defaultValue: initialValue,
    accept,
    replace,
  } = useNativeInputBuffer(editor.text);
  const cancelBlur = useCallback(() => {
    const pending = blurFrame.current !== null;

    if (pending) {
      cancelAnimationFrame(blurFrame.current!);
      blurFrame.current = null;
    }
  }, []);

  useEffect(() => cancelBlur, [cancelBlur]);
  const handleChange = useCallback(
    (event: TextInputChangeEvent) => {
      const native = event.nativeEvent;
      const change = model.change(native.text, native.eventCount, editor.session);

      if (!change) {
        return;
      }
      const invalid = 'error' in change;

      if (invalid) {
        showToast(change.error);
        replace(model.text());

        return;
      }
      stage();
      const split = change.split;

      if (split) {
        replace(change.text);
        setEditor(model.view());

        return;
      }
      accept(native.text, change.text);
    },
    [model, editor.session, stage, replace, accept],
  );
  const activate = useCallback(
    (target: number, insert = false) => {
      cancelBlur();
      const changed = model.activate(target, insert);

      if (!changed) {
        input.current?.focus();

        return;
      }
      stage();
      replace(model.text());
      setEditor(model.view());
    },
    [model, cancelBlur, stage, replace],
  );
  const activateEntry = useCallback(
    (key: number, mode: 'edit' | 'before' | 'after') => {
      const index = model.view().entries.findIndex((entry) => entry.key === key);
      const found = index >= 0;

      if (found) {
        activate(index + Number(mode === 'after'), mode !== 'edit');
      }
    },
    [model, activate],
  );

  const handleFocus = useCallback(() => {
    cancelBlur();
    onInputFocus(input.current);
  }, [cancelBlur, onInputFocus]);

  function handleBlur() {
    const previous = !model.isCurrent(editor.session);

    if (previous) {
      return;
    }
    cancelBlur();
    blurFrame.current = requestAnimationFrame(() => {
      blurFrame.current = null;
      finish();
      props.onInputFocus(null);
      props.onBlur();
    });
  }

  return {
    input,
    initialValue,
    nativeValue,
    handleChange,
    handleBlur,
    handleFocus,
    entries: editor.entries,
    session: editor.session,
    active: editor.active,
    activate,
    activateEntry,
  };
}
