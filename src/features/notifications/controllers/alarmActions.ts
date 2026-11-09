import { usePlanner } from '../../../stores/planner';
import { flushPlanner, updatePlanner } from '../../planner/controllers/persistence';
import { updateDailyAlarms } from '../../planner/services/alarms';
import { removeAlarmNotifications } from './notificationSync';

export async function clearScheduleAlarms(ids?: ReadonlySet<string>): Promise<void> {
  const state = usePlanner.getState();
  const unavailable = !state.ready || state.restoring;

  if (unavailable) {
    throw new Error('일정을 불러온 후 다시 시도해 주세요.');
  }
  const selected = ids ?? new Set(state.data.dailyPlanItems.map((item) => item.id));

  updatePlanner((data) => updateDailyAlarms(data, selected, false), true);
  await flushPlanner();
  await removeAlarmNotifications(ids);
}
