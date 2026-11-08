import { useNotificationStore as ui } from '../../../stores/notifications';
import { usePlanner } from '../../../stores/planner';
import { readNotificationPermissions } from '../data/native';
import { saveNotificationPreferences } from '../data/preferences';
import type { NotificationPreferences } from '../types';
import { initializeNotifications, reportFailure } from './notificationState';
import { syncNotifications } from './notificationSync';
import { ensurePermission, ensureExactPermission } from './notificationPermissions';

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
