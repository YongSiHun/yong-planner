import { useLayoutEffect, useRef, type ComponentRef, type RefObject } from 'react';
import type { TextInput, TextInputSelectionChangeEvent } from 'react-native';

export function useInputCaret<T>({
  value,
  currentValue,
  position,
  onRelease,
  onAcknowledge,
  onLayout,
}: {
  value: T;
  currentValue: RefObject<T>;
  position: number | undefined;
  onRelease(value: T): void;
  onAcknowledge(): void;
  onLayout(): void;
}) {
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const selectionRequest = useRef<{ value: T; applied: boolean } | null>(null);

  useLayoutEffect(() => {
    const hasPosition = position !== undefined;

    if (!hasPosition) {
      return;
    }
    const request = { value, applied: false };

    selectionRequest.current = request;
    let releaseFrame: number | undefined;
    const frame = requestAnimationFrame(() => {
      const isCurrent = currentValue.current === request.value;

      if (!isCurrent) {
        return;
      }
      input.current?.focus();
      input.current?.setSelection(position, position);
      request.applied = true;
      releaseFrame = requestAnimationFrame(() => {
        const stillCurrent = currentValue.current === request.value;

        if (stillCurrent) {
          onRelease(request.value);
        }
      });
      onLayout();
    });

    return () => {
      cancelAnimationFrame(frame);
      const hasReleaseFrame = releaseFrame !== undefined;

      if (hasReleaseFrame) {
        cancelAnimationFrame(releaseFrame);
      }
    };
  }, [value, currentValue, position, onRelease, onLayout]);

  function handleSelection(event: TextInputSelectionChangeEvent) {
    const selection = event.nativeEvent.selection;
    const reachedCaret = position === selection.start && position === selection.end;
    const request = selectionRequest.current;
    const isCurrentRequest = request?.value === currentValue.current;
    const canRelease = request?.applied === true && isCurrentRequest && reachedCaret;

    if (canRelease) {
      onAcknowledge();
      onRelease(currentValue.current);
    }
  }

  return {
    input,
    requestedSelection: position === undefined ? undefined : { start: position, end: position },
    handleSelection,
  };
}
