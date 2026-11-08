import { Platform } from 'react-native';
import { createHolidayService } from '../../../services/holiday';
import { useNotificationStore as ui } from '../../../stores/notifications';
import { usePlanner } from '../../../stores/planner';
import {
  askExactAlarmPermission,
  askNotificationPermission,
  configureNotificationPresentation,
  createNativeNotificationPort,
  prepareNotificationChannels,
  readNotificationPermissions,
} from '../data/native';
import { loadNotificationPreferences, saveNotificationPreferences } from '../data/preferences';
import { buildNotificationPlan } from '../services/plan';
import { reconcileNotifications } from '../services/reconcile';
import type { NotificationPreferences } from '../types';

let initialization: Promise<void> | undefined;
let tail: Promise<void> = Promise.resolve();
let timer: ReturnType<typeof setTimeout> | undefined;

class PermissionError extends Error {}

function reportFailure(error: unknown): Error {
  const message =
    error instanceof PermissionError
      ? error.message
      : '알림을 적용하지 못했어요. 앱 업데이트 후 다시 시도해 주세요.';

  ui.setState({ error: message });

  return new Error(message);
}
export function initializeNotifications(): Promise<void> {
  const ready = ui.getState().ready;

  if (ready) {
    return Promise.resolve();
  }
  initialization ??= loadNotificationPreferences()
    .then((preferences) => {
      ui.setState({ preferences, ready: true, error: null });
    })
    .catch((error: unknown) => {
      initialization = undefined;
      throw reportFailure(error);
    });

  return initialization;
}

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
  const task = tail.then(synchronize).catch((error: unknown) => {
    throw reportFailure(error);
  });

  tail = task.catch(() => {});

  return task;
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
  const unsubscribe = usePlanner.subscribe((state, previous) => {
    const changed = state.ready && (state.data !== previous.data || !previous.ready);

    if (changed) {
      scheduleSync(true);
    }
  });
  const interval = setInterval(scheduleSync, 60_000);

  void initializeNotifications()
    .then(() => scheduleSync())
    .catch(() => {});

  return () => {
    unsubscribe();
    clearInterval(interval);
    clearTimeout(timer);
  };
}

async function ensurePermission(next: NotificationPreferences): Promise<void> {
  await prepareNotificationChannels(next);
  const permission = await askNotificationPermission(next.alarms);

  ui.setState({ permission });
  const denied = !permission.granted;

  if (denied) {
    throw new PermissionError(
      '알림 권한을 허용해 주세요. 다시 요청할 수 없으면 기기 알림 설정에서 켜 주세요.',
    );
  }
}

async function ensureExactPermission(): Promise<void> {
  const android = Platform.OS === 'android';

  if (!android) {
    return;
  }
  const permission = await askExactAlarmPermission();

  ui.setState({ permission });
  const denied = !permission.exact;

  if (denied) {
    throw new PermissionError('정확한 알람 권한을 허용해 주세요.');
  }
}
export async function changeNotificationPreference(
  key: keyof NotificationPreferences,
  enabled: boolean,
): Promise<void> {
  await initializeNotifications();
  const busy = ui.getState().busy;

  if (busy) {
    return;
  }
  ui.setState({ busy: true, error: null });
  try {
    const next = await preparePreferenceChange(key, enabled);

    await saveNotificationPreferences(next);
    ui.setState({ preferences: next });
    await syncNotifications();
  } catch (error) {
    throw reportFailure(error);
  } finally {
    ui.setState({ busy: false });
  }
}
export async function refreshNotificationPermissions(): Promise<void> {
  try {
    await initializeNotifications();
    ui.setState({ permission: await readNotificationPermissions() });
    const preferences = ui.getState().preferences;
    const enabled =
      preferences.summary ||
      preferences.alarms ||
      usePlanner.getState().data.dailyPlanItems.some((item) => item.alarm);

    if (enabled) {
      await syncNotifications();
    }
  } catch (error) {
    throw reportFailure(error);
  }
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

async function preparePreferenceChange(
  key: keyof NotificationPreferences,
  enabled: boolean,
): Promise<NotificationPreferences> {
  const next = { ...ui.getState().preferences, [key]: enabled };
  const needsPermission = enabled && ['summary', 'alarms'].includes(key);

  if (needsPermission) {
    await ensurePermission(next);
  }
  const needsExact = enabled && key === 'exact';

  if (needsExact) {
    await ensureExactPermission();
  }

  return normalizePreferences(next);
}

function normalizePreferences(preferences: NotificationPreferences): NotificationPreferences {
  return { ...preferences, exact: preferences.exact && preferences.alarms };
}

export function flushEnabledNotifications(): Promise<void> {
  const preferences = ui.getState().preferences;
  const enabled =
    preferences.summary ||
    preferences.alarms ||
    usePlanner.getState().data.dailyPlanItems.some((item) => item.alarm);

  return enabled ? syncNotifications() : Promise.resolve();
}

let startupPermission: Promise<void> | undefined;

export function requestStartupNotificationPermission(): Promise<void> {
  startupPermission ??= initializeNotifications()
    .then(() => ensurePermission({ ...ui.getState().preferences, alarms: true }))
    .catch((error: unknown) => {
      throw reportFailure(error);
    });

  return startupPermission;
}

export async function authorizeScheduleAlarm(): Promise<void> {
  await initializeNotifications();
  await ensurePermission({ ...ui.getState().preferences, alarms: true });
  const permission = ui.getState().permission;
  const needsExact = Platform.OS === 'android' && !permission?.exact;

  if (needsExact) {
    ui.setState({ permission: await askExactAlarmPermission() });
  }
  const next = {
    ...ui.getState().preferences,
    alarms: true,
    exact: ui.getState().permission?.exact === true,
  };

  await saveNotificationPreferences(next);
  ui.setState({ preferences: next });
}
