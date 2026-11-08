import { Platform } from 'react-native';
import { useNotificationStore as ui } from '../../../stores/notifications';
import {
  askExactAlarmPermission,
  askNotificationPermission,
  prepareNotificationChannels,
} from '../data/native';
import { saveNotificationPreferences } from '../data/preferences';
import type { NotificationPreferences } from '../types';
import { PermissionError, initializeNotifications, reportFailure } from './notificationState';

export async function ensurePermission(next: NotificationPreferences): Promise<void> {
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

export async function ensureExactPermission(): Promise<void> {
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

let startupPermission: Promise<void> | undefined;

export function requestStartupNotificationPermission(): Promise<void> {
  startupPermission ??= initializeNotifications()
    .then(async () => {
      await ensurePermission({ ...ui.getState().preferences, alarms: true });
      await requestMissingExactPermission();
    })
    .catch((error: unknown) => {
      throw reportFailure(error);
    });

  return startupPermission;
}

export async function authorizeScheduleAlarm(): Promise<void> {
  await initializeNotifications();
  await ensurePermission({ ...ui.getState().preferences, alarms: true });
  await requestMissingExactPermission();
  const next = {
    ...ui.getState().preferences,
    alarms: true,
    exact: ui.getState().permission?.exact === true,
  };

  await saveNotificationPreferences(next);
  ui.setState({ preferences: next });
}

async function requestMissingExactPermission(): Promise<void> {
  const permission = ui.getState().permission;
  const needsExact = Platform.OS === 'android' && !permission?.exact;

  if (needsExact) {
    ui.setState({ permission: await askExactAlarmPermission() });
  }
}
