import { Alert } from 'react-native';
import { useNotificationStore as ui } from '../../../stores/notifications';
import { openSystemNotificationSettings, readNotificationPermissions } from '../data/native';
import { saveNotificationPreferences } from '../data/preferences';
import { runPreferenceChange } from './notificationChanges';
import { ensureExactPermission, ensurePermission } from './notificationPermissions';
import { PermissionError } from './notificationState';

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
