import { useCallback, useLayoutEffect, useRef, useState } from 'react';

// Native owns ordinary typing. Only invalid input or line-ending normalization needs a write.
export function useNativeInputBuffer(initialText: string) {
  const [buffer, setBuffer] = useState(() => ({ text: initialText, replacing: false }));
  const replacement = useRef<typeof buffer | null>(null);
  const replace = useCallback((text: string) => {
    const next = { text, replacing: true };

    replacement.current = next;
    setBuffer(next);
  }, []);
  const accept = useCallback(
    (nativeText: string, nextText: string) => {
      const transformed = nativeText !== nextText;

      if (transformed) {
        replace(nextText);

        return;
      }
      const pending = replacement.current !== null;

      if (pending) {
        replacement.current = null;
        setBuffer({ text: nextText, replacing: false });
      }
    },
    [replace],
  );

  useLayoutEffect(() => {
    const replacing = buffer.replacing;

    if (replacing) {
      const frame = requestAnimationFrame(() => {
        const current = replacement.current === buffer;

        if (current) {
          replacement.current = null;
          setBuffer({ ...buffer, replacing: false });
        }
      });

      return () => cancelAnimationFrame(frame);
    }
  }, [buffer]);

  return {
    defaultValue: buffer.text,
    value: buffer.replacing ? buffer.text : undefined,
    replace,
    accept,
  };
}
