import { useCallback, useEffect, useRef } from 'react';
import type { GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import { dropTarget, type ChipBounds } from '../services/dragGeometry';
import type { EditorEntry } from '../services/ScheduleEditSession';

export function useScheduleChipLayout(
  entries: readonly EditorEntry[],
  activate: (index: number, insert: boolean) => void,
) {
  const boxes = useRef(new Map<number, ChipBounds>());

  useEffect(() => {
    const retained = new Set(entries.map((entry) => entry.key));

    boxes.current.forEach((_, key) => {
      const removed = !retained.has(key);

      if (removed) {
        boxes.current.delete(key);
      }
    });
  }, [entries]);
  const record = useCallback((key: number, event: LayoutChangeEvent) => {
    boxes.current.set(key, event.nativeEvent.layout);
  }, []);
  const handleBlankPress = useCallback(
    (event?: GestureResponderEvent) => {
      const bounds = new Map<number, ChipBounds>();

      entries.forEach((entry, index) => {
        const box = boxes.current.get(entry.key);

        if (box) {
          bounds.set(index, box);
        }
      });
      const target =
        event && dropTarget(bounds, event.nativeEvent.locationX, event.nativeEvent.locationY);

      activate(target?.boundary ?? entries.length, true);
    },
    [entries, activate],
  );

  return { record, handleBlankPress };
}
