import { Platform } from 'react-native';
import { useNotificationStore as ui } from '../../../stores/notifications';
import {
  askExactAlarmPermission,
  askNotificationPermission,
  prepareNotificationChannels,
  readNotificationPermissions,
} from '../data/native';
import type { NotificationPreferences } from '../types';
import { PermissionError } from './notificationState';

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
  const current = await readNotificationPermissions();

  ui.setState({ permission: current });
  const alreadyGranted = current.exact;

  if (alreadyGranted) {
    return;
  }
  const permission = await askExactAlarmPermission();

  ui.setState({ permission });
  const denied = !permission.exact;

  if (denied) {
    throw new PermissionError('정확한 알람 권한을 허용해 주세요.');
  }
}
