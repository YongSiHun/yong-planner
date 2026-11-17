import { useCallback, useRef, useState } from 'react';
import type { TextInputContentSizeChangeEvent } from 'react-native';

// Native measures wrapping and font scaling; React only updates when the height changes.
export function useInputHeight() {
  const [height, setHeight] = useState<number>();
  const currentHeight = useRef<number | undefined>(undefined);
  const handleContentSize = useCallback((event: TextInputContentSizeChangeEvent) => {
    const next = Math.ceil(event.nativeEvent.contentSize.height);
    const changed = next > 0 && next !== currentHeight.current;

    if (changed) {
      currentHeight.current = next;
      setHeight(next);
    }
  }, []);

  return { height, handleContentSize };
}
