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
    summary: input.summary === true,
    alarms,
    lockScreen: input.lockScreen !== false,
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
