import { Platform } from 'react-native';
import { useNotificationStore as ui } from '../../../stores/notifications';
import { askExactAlarmPermission } from '../data/native';
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
    await requestMissingExactPermission();
  });

  return startupPermission;
}

async function requestMissingExactPermission(): Promise<void> {
  const permission = ui.getState().permission;
  const needsExact = Platform.OS === 'android' && !permission?.exact;

  if (needsExact) {
    ui.setState({ permission: await askExactAlarmPermission() });
  }
}
