import { useCallback, useEffect, useRef } from 'react';
import { report } from '../../../components/ui';
import type { ScheduleEditSession } from '../services/ScheduleEditSession';
import { usePlannerActions } from './usePlannerActions';

// Application boundary: serialization is deferred until the staged command commits.
export function useScheduleDraft(date: string, session: ScheduleEditSession) {
  const { stageDailyNote, finishDailyNote, flush } = usePlannerActions();
  const finalized = useRef(false);
  const stage = useCallback(() => {
    finalized.current = false;
    stageDailyNote(date, () => session.serialize(), true);
  }, [date, session, stageDailyNote]);
  const finish = useCallback(() => {
    const done = finalized.current;

    if (done) {
      return;
    }
    finalized.current = true;
    finishDailyNote(date);
    void flush().catch(report);
  }, [date, finishDailyNote, flush]);

  useEffect(() => finish, [finish]);

  return { stage, finish };
}
