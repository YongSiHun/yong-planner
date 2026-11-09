import { WriteQueue } from '../../../services/WriteQueue';
import { createHolidayService } from '../../../services/holiday';
import { useNotificationStore as ui } from '../../../stores/notifications';
import { usePlanner } from '../../../stores/planner';
import {
  configureNotificationPresentation,
  createNativeNotificationPort,
  prepareNotificationChannels,
  readNotificationPermissions,
} from '../data/native';
import { buildNotificationPlan } from '../services/plan';
import { reconcileNotifications } from '../services/reconcile';
import type { NotificationPreferences } from '../types';
import { initializeNotifications, reportFailure } from './notificationState';

const queue = new WriteQueue();

let timer: ReturnType<typeof setTimeout> | undefined;

async function synchronize(): Promise<void> {
  await initializeNotifications();
  const planner = usePlanner.getState();
  const ready = planner.ready && !planner.restoring;

  if (!ready) {
    return;
  }
  const preferences = ui.getState().preferences;
  const permission = await readNotificationPermissions();
  const scheduling = effectivePreferences(preferences, permission);

  await configureNotificationPresentation();
  await prepareNotificationChannels(scheduling);
  const holidays = createHolidayService(planner.data.holidayOverrides);
  const plan = buildNotificationPlan(planner.data, scheduling, new Date(), holidays);
  const port = await createNativeNotificationPort(scheduling);

  await reconcileNotifications(port, plan, JSON.stringify(scheduling));
  ui.setState({ permission, count: plan.pending.length, truncated: plan.truncated, error: null });
}

export function syncNotifications(): Promise<void> {
  clearTimeout(timer);

  return queue.enqueue(synchronize).catch((error: unknown) => {
    throw reportFailure(error);
  });
}

function scheduleSync(force = false): void {
  clearTimeout(timer);
  const preferences = ui.getState().preferences;
  const enabled =
    preferences.summary ||
    preferences.alarms ||
    usePlanner.getState().data.dailyPlanItems.some((item) => item.alarm);

  const shouldSkip = !enabled && !force;

  if (shouldSkip) {
    return;
  }
  timer = setTimeout(() => {
    void syncNotifications().catch(() => {});
  }, 1000);
}

export function startNotificationSync(): () => void {
  let disposed = false;

  const unsubscribe = usePlanner.subscribe((state, previous) => {
    const changed = state.ready && (state.data !== previous.data || !previous.ready);

    if (changed) {
      scheduleSync(true);
    }
  });
  const interval = setInterval(scheduleSync, 60_000);

  void initializeNotifications()
    .then(() => {
      if (!disposed) {
        scheduleSync();
      }
    })
    .catch(() => {});

  return () => {
    disposed = true;
    unsubscribe();
    clearInterval(interval);
    clearTimeout(timer);
  };
}

function effectivePreferences(
  preferences: NotificationPreferences,
  permission: { granted: boolean; exact: boolean },
): NotificationPreferences {
  return {
    ...preferences,
    summary: preferences.summary && permission.granted,
    alarms: permission.granted,
    exact: preferences.exact && permission.exact,
  };
}

export function flushEnabledNotifications(): Promise<void> {
  const preferences = ui.getState().preferences;
  const enabled =
    preferences.summary ||
    preferences.alarms ||
    usePlanner.getState().data.dailyPlanItems.some((item) => item.alarm);

  return enabled ? syncNotifications() : Promise.resolve();
}
