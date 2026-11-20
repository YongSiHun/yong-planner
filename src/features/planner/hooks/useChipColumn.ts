import { useRef, useState } from 'react';
import { useWindowDimensions, type LayoutChangeEvent } from 'react-native';

// Measure the natural rows once; keep the column until content or available space changes.
export function useChipColumn(contentKey: string) {
  const { fontScale } = useWindowDimensions();
  const key = JSON.stringify([contentKey, fontScale]);
  const [columnKey, setColumnKey] = useState<string | null>(null);
  const column = columnKey === key;
  const width = useRef(0);
  const rows = useRef({ key: '', positions: new Map<number, number>() });

  function measureContainer(event: LayoutChangeEvent) {
    const nextWidth = event.nativeEvent.layout.width;
    const resized = width.current > 0 && Math.abs(width.current - nextWidth) > 1;

    width.current = nextWidth;
    if (resized) {
      rows.current.positions.clear();
      setColumnKey(null);
    }
  }

  function measureChip(index: number, event: LayoutChangeEvent) {
    if (column) {
      return;
    }

    const changedContent = rows.current.key !== key;

    if (changedContent) {
      rows.current = { key, positions: new Map() };
    }
    rows.current.positions.set(index, event.nativeEvent.layout.y);
    const positions = [...rows.current.positions.values()];
    const wrapped = Math.max(...positions) - Math.min(...positions) > 1;

    if (wrapped) {
      setColumnKey(key);
    }
  }

  return { column, measureContainer, measureChip };
}
