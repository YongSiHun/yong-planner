import { NOTIFICATION_PREFIX } from './plan';
import type { NotificationPlan, PlannedNotification } from '../types';

export interface StoredNotification {
  id: string;
  fingerprint: string;
}
export interface NotificationPort {
  pending(): Promise<StoredNotification[]>;
  presented(): Promise<StoredNotification[]>;
  cancel(id: string): Promise<void>;
  dismiss(id: string): Promise<void>;
  schedule(item: PlannedNotification, fingerprint: string): Promise<void>;
}
export function notificationFingerprint(item: PlannedNotification, mode: string): string {
  return JSON.stringify([item, mode]);
}
export async function reconcileNotifications(
  port: NotificationPort,
  plan: NotificationPlan,
  mode: string,
): Promise<void> {
  const existing = await port.pending();
  const desired = new Map(
    plan.pending.map((item) => [item.id, notificationFingerprint(item, mode)]),
  );
  const previous = new Map(existing.map((item) => [item.id, item.fingerprint]));
  const obsolete = existing.filter(
    (item) => item.id.startsWith(NOTIFICATION_PREFIX) && desired.get(item.id) !== item.fingerprint,
  );

  await completeOperations(obsolete.map((item) => port.cancel(item.id)));
  const changed = plan.pending.filter((item) => previous.get(item.id) !== desired.get(item.id));

  await completeOperations(changed.map((item) => port.schedule(item, desired.get(item.id)!)));
  await reconcileSummary(port, plan.summary, mode);
}

async function reconcileSummary(
  port: NotificationPort,
  summary: PlannedNotification | null,
  mode: string,
): Promise<void> {
  const presented = await port.presented();
  const old = presented.filter(
    (item) => item.id.startsWith(NOTIFICATION_PREFIX + 'summary:') && item.id !== summary?.id,
  );

  await completeOperations(old.map((item) => port.dismiss(item.id)));
  if (!summary) {
    return;
  }
  const fingerprint = notificationFingerprint(summary, mode);
  const unchanged = presented.some(
    (item) => item.id === summary.id && item.fingerprint === fingerprint,
  );

  if (unchanged) {
    return;
  }
  await port.schedule(summary, fingerprint);
}

async function completeOperations(tasks: Promise<void>[]): Promise<void> {
  const results = await Promise.allSettled(tasks);
  const failure = results.find((result) => result.status === 'rejected');

  if (failure) {
    throw failure.reason;
  }
}
