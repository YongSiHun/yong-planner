import { useRef, useState } from 'react';
import { useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { design } from '../../../components/ui/tokens';

// Stack only for a multiline chip; ordinary overflow keeps the natural wrapped rows.
export function useChipColumn(contentKey: string) {
  const { fontScale } = useWindowDimensions();
  const key = JSON.stringify([contentKey, fontScale]);
  const [columnKey, setColumnKey] = useState<string | null>(null);
  const column = columnKey === key;
  const width = useRef(0);

  function measureContainer(event: LayoutChangeEvent) {
    const nextWidth = event.nativeEvent.layout.width;
    const resized = width.current > 0 && Math.abs(width.current - nextWidth) > 1;

    width.current = nextWidth;
    if (resized) {
      setColumnKey(null);
    }
  }

  function measureChip(_index: number, event: LayoutChangeEvent) {
    if (column) {
      return;
    }

    // Label line height plus vertical padding and borders (2px each).
    const singleLineHeight = design.lineHeight * fontScale + 4;
    const multiline = event.nativeEvent.layout.height > singleLineHeight + 1;

    if (multiline) {
      setColumnKey(key);
    }
  }

  return { column, measureContainer, measureChip };
}
