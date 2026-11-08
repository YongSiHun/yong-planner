import { Linking, Platform } from 'react-native';
import type * as Notifications from 'expo-notifications';
import type {
  NotificationPreferences,
  NotificationPermissionState,
  PlannedNotification,
} from '../types';
import type { NotificationPort, StoredNotification } from '../services/reconcile';

let runtime: Promise<typeof Notifications> | undefined;

export async function notificationRuntime(): Promise<typeof Notifications> {
  runtime ??= import('expo-notifications').catch((error: unknown) => {
    runtime = undefined;
    throw error;
  });

  return runtime;
}
export function channelId(kind: 'summary' | 'alarm', visible: boolean): string {
  return 'yong-' + kind + '-' + (visible ? 'public' : 'hidden') + '-v1';
}
export async function prepareNotificationChannels(
  preferences: NotificationPreferences,
): Promise<void> {
  const android = Platform.OS === 'android';

  if (!android) {
    return;
  }
  const native = await notificationRuntime();
  const visibility = preferences.lockScreen
    ? native.AndroidNotificationVisibility.PUBLIC
    : native.AndroidNotificationVisibility.SECRET;

  await native.setNotificationChannelAsync(channelId('summary', preferences.lockScreen), {
    name: '오늘 일정',
    importance: native.AndroidImportance.LOW,
    sound: null,
    enableVibrate: false,
    showBadge: false,
    lockscreenVisibility: visibility,
  });
  await native.setNotificationChannelAsync(channelId('alarm', preferences.lockScreen), {
    name: '일정 알람',
    importance: native.AndroidImportance.HIGH,
    enableVibrate: false,
    showBadge: false,
    lockscreenVisibility: visibility,
    bypassDnd: false,
  });
}
export async function readNotificationPermissions(): Promise<NotificationPermissionState> {
  const native = await notificationRuntime();
  const permission = await native.getPermissionsAsync();
  const exact = await native.getExactAlarmPermissionsAsync();

  return {
    granted: permission.granted,
    canAskAgain: permission.canAskAgain,
    exact: exact.granted,
    sound: permission.ios?.allowsSound !== false,
    lockScreen: permission.ios?.allowsDisplayOnLockScreen === true,
  };
}
export async function askNotificationPermission(
  sound: boolean,
): Promise<NotificationPermissionState> {
  const native = await notificationRuntime();
  const current = await readNotificationPermissions();
  const needsPrompt = needsNotificationPrompt(current, sound);
  const mayRequest = current.canAskAgain || current.granted;
  const canPrompt = needsPrompt && mayRequest;

  if (canPrompt) {
    await native.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowSound: sound,
        allowBadge: false,
        allowCriticalAlerts: false,
        allowProvisional: false,
      },
    });
  }

  return readNotificationPermissions();
}
export async function askExactAlarmPermission(): Promise<NotificationPermissionState> {
  const native = await notificationRuntime();

  await native.requestExactAlarmPermissionsAsync();

  return readNotificationPermissions();
}
export async function configureNotificationPresentation(): Promise<void> {
  const native = await notificationRuntime();

  native.setNotificationHandler({
    handleNotification: async (notification) => {
      const alarm = notification.request.content.data?.kind === 'alarm';

      return {
        shouldShowBanner: alarm,
        shouldShowList: true,
        shouldPlaySound: alarm,
        shouldSetBadge: false,
      };
    },
  });
}

function stored(request: Notifications.NotificationRequest): StoredNotification {
  const fingerprint = request.content.data?.fingerprint;

  return {
    id: request.identifier,
    fingerprint: typeof fingerprint === 'string' ? fingerprint : '',
  };
}

function triggerFor(
  native: typeof Notifications,
  item: PlannedNotification,
  preferences: NotificationPreferences,
): Notifications.NotificationTriggerInput {
  const channel = channelId(item.kind, preferences.lockScreen);
  const immediate = item.at === null;

  if (immediate) {
    return immediateTrigger(channel);
  }

  return {
    type: native.SchedulableTriggerInputTypes.DATE,
    date: item.at!,
    channelId: channel,
    delivery: preferences.exact && item.kind === 'alarm' ? 'alarmClock' : 'bestEffort',
  };
}
export async function createNativeNotificationPort(
  preferences: NotificationPreferences,
): Promise<NotificationPort> {
  const native = await notificationRuntime();

  return {
    pending: async () => (await native.getAllScheduledNotificationsAsync()).map(stored),
    presented: async () =>
      (await native.getPresentedNotificationsAsync()).map((item) => stored(item.request)),
    cancel: (id) => native.cancelScheduledNotificationAsync(id),
    dismiss: (id) => native.dismissNotificationAsync(id),
    schedule: async (item, fingerprint) => {
      await native.scheduleNotificationAsync({
        identifier: item.id,
        content: {
          title: item.title,
          body: item.body,
          sound: item.kind === 'alarm',
          data: { kind: item.kind, date: item.date, fingerprint },
          threadIdentifier: 'yong-' + item.kind,
        },
        trigger: triggerFor(native, item, preferences),
      });
    },
  };
}
export function openSystemNotificationSettings(): Promise<void> {
  return Linking.openSettings();
}

function immediateTrigger(channel: string): Notifications.NotificationTriggerInput {
  return Platform.OS === 'android' ? { channelId: channel } : null;
}

function needsNotificationPrompt(permission: NotificationPermissionState, sound: boolean): boolean {
  return !permission.granted || (sound && !permission.sound);
}
