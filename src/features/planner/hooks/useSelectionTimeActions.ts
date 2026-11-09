import { useCallback, useRef } from 'react';
import { report } from '../../../components/ui';
import {
  authorizeScheduleAlarm,
  clearScheduleAlarms,
} from '../../notifications/controllers/notifications';
import { useNoteSelectionStore as ui } from '../../../stores/noteSelection';
import { usePlanner } from '../../../stores/planner';
import { usePlannerActions } from './usePlannerActions';

export function useSelectionTimeActions(clear: () => void) {
  const { saveDailyTimes, setDailyAlarms } = usePlannerActions();
  const savingAlarm = useRef(false);
  const saveAlarm = useCallback(
    async (time: string | null) => {
      const unavailable = savingAlarm.current;

      if (unavailable) {
        return;
      }
      const selected = new Set(ui.getState().selected);

      savingAlarm.current = true;
      try {
        await applyAlarm(selected, time, setDailyAlarms);
        clear();
      } catch (error) {
        report(error);
      } finally {
        savingAlarm.current = false;
      }
    },
    [clear, setDailyAlarms],
  );
  const saveTime = useCallback(
    (time: string | null) => {
      const alarmSetting = ui.getState().alarmSetting;

      if (alarmSetting) {
        void saveAlarm(time);

        return;
      }
      const id = ui.getState().timeId;
      const hasItem = id !== null;

      if (hasItem) {
        saveDailyTimes(ui.getState().selected, time);
      }
      clear();
    },
    [clear, saveDailyTimes, saveAlarm],
  );

  return {
    saveTime,
    openTime: useCallback(
      () => ui.setState({ timeId: [...ui.getState().selected][0] ?? null, alarmSetting: false }),
      [],
    ),
    toggleAlarm: useCallback(() => {
      const selected = ui.getState().selected;
      const items = selectedItems(selected);

      const empty = items.length === 0;

      if (empty) {
        return;
      }
      ui.setState({ timeId: items[0]!.id, alarmSetting: true });
    }, []),
    closeTime: useCallback(() => ui.setState({ timeId: null, alarmSetting: false }), []),
  };
}

function selectedItems(ids = ui.getState().selected) {
  return usePlanner.getState().data.dailyPlanItems.filter((item) => ids.has(item.id));
}

async function applyAlarm(
  ids: ReadonlySet<string>,
  time: string | null,
  save: (ids: ReadonlySet<string>, alarm: boolean, time: string) => void,
) {
  const removing = time === null;

  if (removing) {
    await clearScheduleAlarms(ids);

    return;
  }
  await authorizeScheduleAlarm();
  save(ids, true, time);
}
