import { addDays } from 'date-fns';
import type { HolidayService } from '../../../services/holiday';
import { dateKey, parseDate } from '../../../utils/date';
import { plansForDate } from '../../planner/services/plans';
import { displayPlanEntry } from '../../planner/services/time';
import type { PlanEntry, PlannerData } from '../../planner/types';
import type { NotificationPlan, NotificationPreferences, PlannedNotification } from '../types';

export const NOTIFICATION_PREFIX = 'yong-planner:';
export const MAX_PENDING_NOTIFICATIONS = 60;
const SUMMARY_DAYS = 7;
const ALARM_DAYS = 30;

function dateAtOffset(now: Date, offset: number): string | null {
  const date = addDays(now, offset);
  const supported = date.getFullYear() >= 1 && date.getFullYear() <= 9999;

  return supported ? dateKey(date) : null;
}

function datesAhead(now: Date, count: number): string[] {
  return Array.from({ length: count }, (_, offset) => dateAtOffset(now, offset)).filter(
    (date): date is string => date !== null,
  );
}

function summaryForDate(
  data: PlannerData,
  date: string,
  holidays: HolidayService,
  at: number | null,
): PlannedNotification {
  const lines = plansForDate(data, date, holidays)
    .filter((item) => item.content.trim())
    .map((item) => {
      const alarmMark = item.alarm ? '⏰ ' : '';

      return alarmMark + displayPlanEntry(item, data.settings.timeFormat);
    });
  const body = lines.length > 0 ? lines.join('\n') : '등록된 일정이 없어요.';

  return {
    id: NOTIFICATION_PREFIX + 'summary:' + date,
    kind: 'summary',
    date,
    title: date + ' 일정',
    body: body.slice(0, 3000),
    at,
  };
}

function alarmForEntry(
  entry: PlanEntry,
  date: string,
  data: PlannerData,
): PlannedNotification | null {
  const hasTime = entry.alarm === true && entry.time !== null && entry.content.trim().length > 0;

  if (!hasTime) {
    return null;
  }
  const [hour, minute] = entry.time!.split(':').map(Number);
  const at = parseDate(date);

  at.setHours(hour!, minute!, 0, 0);

  return {
    id: NOTIFICATION_PREFIX + 'alarm:' + date + ':' + encodeURIComponent(entry.id),
    kind: 'alarm',
    date,
    title: '일정 알람',
    body: displayPlanEntry(entry, data.settings.timeFormat),
    at: at.getTime(),
  };
}

function futureAlarms(
  data: PlannerData,
  now: Date,
  holidays: HolidayService,
): PlannedNotification[] {
  return datesAhead(now, ALARM_DAYS)
    .flatMap((date) =>
      plansForDate(data, date, holidays).map((entry) => alarmForEntry(entry, date, data)),
    )
    .filter((item): item is PlannedNotification => item !== null && item.at! > now.getTime())
    .sort((a, b) => a.at! - b.at! || a.id.localeCompare(b.id));
}

function futureSummaries(
  data: PlannerData,
  now: Date,
  holidays: HolidayService,
): PlannedNotification[] {
  return datesAhead(now, SUMMARY_DAYS + 1)
    .slice(1)
    .map((date) => {
      const at = parseDate(date);

      at.setHours(0, 0, 0, 0);

      return summaryForDate(data, date, holidays, at.getTime());
    });
}
export function buildNotificationPlan(
  data: PlannerData,
  preferences: NotificationPreferences,
  now: Date,
  holidays: HolidayService,
): NotificationPlan {
  const showSummary = preferences.summary || preferences.lockScreen;
  const summaries = showSummary ? futureSummaries(data, now, holidays) : [];
  const alarms = preferences.alarms ? futureAlarms(data, now, holidays) : [];
  const available = MAX_PENDING_NOTIFICATIONS - summaries.length;

  return {
    summary: showSummary ? summaryForDate(data, dateKey(now), holidays, null) : null,
    pending: [...summaries, ...alarms.slice(0, available)].sort((a, b) => a.at! - b.at!),
    truncated: alarms.length > available,
  };
}
