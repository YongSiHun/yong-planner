import { useCallback, useRef, useState } from 'react';
import { report } from '../components/ui';

// UI operations share one synchronous lock so rapid taps cannot start duplicate writes.
export function useAsyncOperation(unavailable = false) {
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const isRunning = useCallback(() => running.current, []);
  const run = useCallback(
    async (action: () => Promise<void>) => {
      const blocked = running.current || unavailable;

      if (blocked) {
        return;
      }
      running.current = true;
      setBusy(true);
      try {
        await action();
      } catch (error) {
        report(error);
      } finally {
        running.current = false;
        setBusy(false);
      }
    },
    [unavailable],
  );

  return { busy, run, isRunning };
}
