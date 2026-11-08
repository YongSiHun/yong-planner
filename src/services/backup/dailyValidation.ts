import type { DailyPlanItem, DailyPlanOrder } from '../../features/planner/types';
import {
  readOptionalTime,
  readRecord,
  readIdentifier,
  readDate,
  readText,
  readCreatedAt,
  ensureValid,
  readArray,
  ensureUnique,
} from './readers';

function optionalDailyTime(value: unknown): { time?: string | null } {
  const time = readOptionalTime(value);

  return time === undefined ? {} : { time };
}

export function readDailyItem(value: unknown): DailyPlanItem {
  const item = readRecord(value);

  return {
    id: readIdentifier(item.id),
    date: readDate(item.date),
    content: readText(item.content),
    createdAt: readCreatedAt(item.createdAt),
    ...optionalDailyTime(item.time),
    ...optionalDailyImportance(item.important),
    ...optionalDailyAlarm(item.alarm),
  };
}

function readOrderIdentifier(value: unknown): string {
  const identifier = readText(value);
  const isOrderIdentifier = /^(daily|recurring):.+$/.test(identifier);

  ensureValid(isOrderIdentifier, '정렬 데이터가 올바르지 않습니다.');

  return identifier;
}

export function readOrder(value: unknown): DailyPlanOrder {
  const order = readRecord(value);
  const itemIds = readArray(order.itemIds).map(readOrderIdentifier);

  ensureUnique(itemIds);

  return { date: readDate(order.date), itemIds };
}

function optionalDailyImportance(value: unknown): { important?: boolean } {
  const omitted = value === undefined;

  if (omitted) {
    return {};
  }
  const valid = typeof value === 'boolean';

  ensureValid(valid, '중요 일정 값이 올바르지 않습니다.');

  return value ? { important: true } : {};
}

function optionalDailyAlarm(value: unknown): { alarm?: boolean } {
  const omitted = value === undefined;

  if (omitted) {
    return {};
  }
  ensureValid(typeof value === 'boolean', '알람 값이 올바르지 않습니다.');

  return value ? { alarm: true } : {};
}
