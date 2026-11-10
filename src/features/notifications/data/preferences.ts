import storage from 'expo-sqlite/kv-store';
import { defaultNotificationPreferences, type NotificationPreferences } from '../types';
const KEY = 'notification-preferences-v1';

export async function loadNotificationPreferences(): Promise<NotificationPreferences> {
  const raw = await storage.getItem(KEY);
  const absent = raw === null;

  if (absent) {
    return { ...defaultNotificationPreferences };
  }
  const input = readRecord(raw);
  const alarms = input.alarms === true;

  return {
    summary:
      typeof input.summary === 'boolean' ? input.summary : defaultNotificationPreferences.summary,
    alarms,
    lockScreen: input.lockScreen === true,
    exact: alarms && input.exact === true,
  };
}

function readRecord(raw: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(raw);
    const record = typeof value === 'object' && value !== null;

    return record ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function saveNotificationPreferences(value: NotificationPreferences): Promise<void> {
  await storage.setItem(KEY, JSON.stringify(value));
}

const STARTUP_KEY = 'notification-startup-requested-v1';

export async function claimStartupPermissionRequest(): Promise<boolean> {
  const requested = await storage.getItem(STARTUP_KEY);

  if (requested) {
    return false;
  }
  await storage.setItem(STARTUP_KEY, 'true');

  return true;
}
