import { useNotificationStore as ui } from '../../../stores/notifications';
import { claimStartupPermissionRequest } from '../data/preferences';
import { runPreferenceChange } from './notificationChanges';
import { ensurePermission } from './notificationPermissions';

let startupPermission: Promise<void> | undefined;

export function requestStartupNotificationPermission(): Promise<void> {
  startupPermission ??= runPreferenceChange(async () => {
    const firstRequest = await claimStartupPermissionRequest();

    if (!firstRequest) {
      return;
    }
    await ensurePermission({ ...ui.getState().preferences, alarms: true });
  });

  return startupPermission;
}
