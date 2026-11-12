import { Alert, Platform } from 'react-native';
import { useNotificationStore as ui } from '../../../stores/notifications';
import {
  askExactAlarmPermission,
  askNotificationPermission,
  prepareNotificationChannels,
  readNotificationPermissions,
  openSystemNotificationSettings,
} from '../data/native';
import { claimStartupPermissionRequest, saveNotificationPreferences } from '../data/preferences';
import type { NotificationPreferences } from '../types';
import { PermissionError } from './notificationState';
import { runPreferenceChange } from './notificationChanges';

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

export async function authorizeScheduleAlarm(): Promise<void> {
  await runPreferenceChange(async () => {
    await offerAlarmPermission();
    await ensurePermission({ ...ui.getState().preferences, alarms: true });
    await ensureExactPermission();
    const next = {
      ...ui.getState().preferences,
      alarms: true,
      exact: ui.getState().permission?.exact === true,
    };

    await saveNotificationPreferences(next);
    ui.setState({ preferences: next });
  });
}

async function requestMissingExactPermission(): Promise<void> {
  const permission = ui.getState().permission;
  const needsExact = Platform.OS === 'android' && !permission?.exact;

  if (needsExact) {
    ui.setState({ permission: await askExactAlarmPermission() });
  }
}

function confirmAlarmPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      '알림 권한 설정',
      '알람을 저장하려면 알림 권한이 필요해요. 알림을 허용할까요?',
      [
        { text: '취소', style: 'cancel', onPress: () => resolve(false) },
        { text: '설정하기', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

async function offerAlarmPermission(): Promise<void> {
  const permission = await readNotificationPermissions();

  ui.setState({ permission });
  const granted = permission.granted;

  if (granted) {
    return;
  }
  const accepted = await confirmAlarmPermission();

  if (!accepted) {
    throw new PermissionError('알림 권한이 없어 알람을 저장하지 않았어요.');
  }
  const canAskAgain = permission.canAskAgain;

  if (canAskAgain) {
    return;
  }
  await openSystemNotificationSettings();
  // 설정 앱에서 복귀한 뒤 저장을 다시 시도한다.
  throw new PermissionError('알림 권한을 허용한 후 다시 저장해 주세요.');
}
