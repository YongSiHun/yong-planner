import { validTime } from '../../../utils/date';
import type { DailyPlanItem, PlannerData } from '../types';

function applyAlarm(item: DailyPlanItem, alarm: boolean, time?: string): DailyPlanItem {
  const selectedTime = time ?? item.time;
  const missingTime = alarm && !selectedTime;

  if (missingTime) {
    throw new Error('알람 시간을 설정해 주세요.');
  }

  return { ...item, time: selectedTime, alarm: alarm || undefined };
}

export function updateDailyAlarms(
  data: PlannerData,
  ids: ReadonlySet<string>,
  alarm: boolean,
  time?: string,
): PlannerData {
  const invalidTime = time !== undefined && !validTime(time);

  if (invalidTime) {
    throw new Error('시간을 확인해 주세요.');
  }

  return {
    ...data,
    dailyPlanItems: data.dailyPlanItems.map((item) =>
      ids.has(item.id) ? applyAlarm(item, alarm, time) : item,
    ),
  };
}

export function timeChangeClearsAlarm(
  item: Pick<DailyPlanItem, 'alarm' | 'time'>,
  time: string | null,
): boolean {
  return Boolean(item.alarm) && (!time || item.time !== time);
}
