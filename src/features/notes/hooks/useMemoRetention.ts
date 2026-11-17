import { useEffect } from 'react';
import { AppState } from 'react-native';
import { usePlanner } from '../../../stores/planner';
import { MEMO_RETENTION_MS } from '../services/trash';
import { useMemoActions } from './useMemoActions';

export function useMemoRetention() {
  const memos = usePlanner((state) => state.data.memos);
  const ready = usePlanner((state) => state.ready && !state.restoring);
  const { purgeMemoTrash } = useMemoActions();

  useEffect(() => {
    if (!ready) {
      return;
    }
    const purge = () => {
      void purgeMemoTrash().catch(() => {});
    };
    const deadlines = (memos ?? []).flatMap((memo) =>
      memo.deletedAt ? [Date.parse(memo.deletedAt) + MEMO_RETENTION_MS] : [],
    );
    const nextExpiry = deadlines.reduce(
      (earliest, deadline) => Math.min(earliest, deadline),
      Infinity,
    );
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      const delay = nextExpiry - Date.now();
      const hasDeadline = Number.isFinite(delay);

      if (!hasDeadline) {
        return;
      }
      timer = setTimeout(
        () => {
          purge();
          schedule();
        },
        Math.max(1000, Math.min(delay, 2147483647)),
      );
    };

    schedule();
    const subscription = AppState.addEventListener('change', (state) => {
      const active = state === 'active';

      if (active) {
        purge();
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [memos, ready, purgeMemoTrash]);
}
