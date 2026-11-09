import { showToast } from '../../../components/ui';
import {
  clearScheduleAlarms,
  changeNotificationPreference,
  refreshNotificationPermissions,
  syncNotifications,
} from '../controllers/notifications';
import { openSystemNotificationSettings } from '../data/native';
import type { NotificationPreferences } from '../types';

async function run(action: () => Promise<void>): Promise<void> {
  try {
    await action();
  } catch (error) {
    const message = error instanceof Error ? error.message : '알림 설정을 확인해 주세요.';

    showToast(message);
  }
}
const actions = {
  clearAlarms: clearScheduleAlarms,
  change: (key: keyof NotificationPreferences, enabled: boolean) =>
    run(() => changeNotificationPreference(key, enabled)),
  refresh: () => run(refreshNotificationPermissions),
  retry: () => run(syncNotifications),
  openSettings: () => run(openSystemNotificationSettings),
};

export function useNotificationActions() {
  return actions;
}
