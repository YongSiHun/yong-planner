import type { DailyPlanItem, DailyPlanOrder, PlannerData } from '../types';
import { reconcileOrder } from './order';
import { dailyItemsForDate } from './plans';
import { orderIndex } from './planIndex';
import { parseScheduleTimePrefix } from './time';
import { splitNote } from './noteText';
import { preserveNoteItems } from './noteIdentity';

const orderedNotes = new WeakMap<
  DailyPlanItem[],
  { order: DailyPlanOrder | undefined; result: DailyPlanItem[] }
>();

export function dailyNoteItems(data: PlannerData, date: string): DailyPlanItem[] {
  const items = dailyItemsForDate(data, date);
  const empty = items.length === 0;

  if (empty) {
    return items;
  }
  const order = orderIndex(data.dailyPlanOrders).get(date)?.[0];
  const cached = orderedNotes.get(items);
  const unchanged = cached !== undefined && cached.order === order;

  if (unchanged) {
    return cached.result;
  }
  const result = sortedDailyNotes(items, order?.itemIds);

  orderedNotes.set(items, { order, result });

  return result;
}

function sortedDailyNotes(items: DailyPlanItem[], custom: string[] | undefined): DailyPlanItem[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const entries = items.map((item) => ({
    id: 'daily:' + item.id,
    sourceId: item.id,
    kind: 'daily' as const,
    content: item.content,
    time: item.time ?? null,
    sortKey: item.createdAt + ':' + item.id,
  }));

  return reconcileOrder(entries, custom).map((entry) => byId.get(entry.sourceId)!);
}

export function applyDailyNote(
  data: PlannerData,
  date: string,
  text: string,
  createId: () => string,
  replaceTimes = false,
): PlannerData {
  const existing = dailyNoteItems(data, date);
  const parsed = splitNote(text).map(parseScheduleTimePrefix);
  const contents = parsed.map((item) => item.content);
  const isUnchanged =
    contents.length === existing.length &&
    contents.every((content, index) =>
      matchesSavedNote(existing[index]!, content, parsed[index]!.time, replaceTimes),
    );

  if (isUnchanged) {
    return data;
  }

  const preserved = preserveNoteItems(existing, contents);
  const latest = latestForNewItems(data, preserved);
  const items = contents.map((content, index) => ({
    ...preserved[index],
    id: preserved[index]?.id ?? createId(),
    date,
    content,
    ...parsedTime(parsed[index]!.time, replaceTimes),
    createdAt: preserved[index]?.createdAt ?? new Date(latest + index + 1).toISOString(),
  }));
  const previousOrder = data.dailyPlanOrders.find((order) => order.date === date)?.itemIds ?? [];
  const itemIds = mergeNoteOrder(
    previousOrder,
    items.map((item) => 'daily:' + item.id),
  );

  return {
    ...data,
    dailyPlanItems: [...data.dailyPlanItems.filter((item) => item.date !== date), ...items],
    dailyPlanOrders: [
      ...data.dailyPlanOrders.filter((order) => order.date !== date),
      { date, itemIds },
    ],
  };
}

// 메모 입력 순서·반복 일정 상대 위치 유지.
export function mergeNoteOrder(previous: string[], dailyIds: string[]): string[] {
  let index = 0;
  const replaced = previous.flatMap((id) => {
    const isDaily = id.startsWith('daily:');

    if (!isDaily) {
      return [id];
    }

    const replacement = dailyIds[index++];
    const hasReplacement = replacement !== undefined;

    return hasReplacement ? [replacement] : [];
  });

  return [...replaced, ...dailyIds.slice(index)];
}

function matchesSavedNote(
  item: DailyPlanItem,
  content: string,
  time: string | undefined,
  replaceTimes: boolean,
): boolean {
  const unchangedTime = replaceTimes
    ? (time ?? null) === (item.time ?? null)
    : time === undefined || time === item.time;

  return item.content === content && unchangedTime;
}

function parsedTime(
  time: string | undefined,
  replaceTimes: boolean,
): { time?: string | null; alarm?: undefined } {
  const clearTime = replaceTimes && time === undefined;

  if (clearTime) {
    return { time: null, alarm: undefined };
  }
  const hasTime = time !== undefined;

  return hasTime ? { time } : {};
}

function latestForNewItems(data: PlannerData, preserved: (DailyPlanItem | undefined)[]): number {
  const hasNewItem = preserved.some((item) => item === undefined);

  if (!hasNewItem) {
    return 0;
  }

  return data.dailyPlanItems.reduce(
    (value, item) => Math.max(value, Date.parse(item.createdAt)),
    Date.now(),
  );
}

export function finalizeDailyNote(data: PlannerData, date: string): PlannerData {
  const existing = dailyItemsForDate(data, date);
  const committed = new Map(existing.map((item) => [item.id, committedItem(item)]));
  const changed = existing.some((item) => committed.get(item.id) !== item);

  if (!changed) {
    return data;
  }
  const removed = new Set(
    [...committed].filter(([, item]) => item === null).map(([id]) => 'daily:' + id),
  );

  return {
    ...data,
    dailyPlanItems: data.dailyPlanItems.flatMap((item) => committedItems(item, committed)),
    dailyPlanOrders: data.dailyPlanOrders.map((order) => committedOrder(order, date, removed)),
  };
}

function committedItem(item: DailyPlanItem): DailyPlanItem | null {
  const content = item.content.trim();
  const empty = content.length === 0;

  if (empty) {
    return null;
  }

  return content === item.content ? item : { ...item, content };
}

function committedItems(
  item: DailyPlanItem,
  committed: ReadonlyMap<string, DailyPlanItem | null>,
): DailyPlanItem[] {
  const next = committed.get(item.id);
  const empty = next === null;

  return empty ? [] : [next ?? item];
}

function committedOrder(
  order: DailyPlanOrder,
  date: string,
  removed: ReadonlySet<string>,
): DailyPlanOrder {
  const otherDate = order.date !== date;

  if (otherDate) {
    return order;
  }
  const itemIds = order.itemIds.filter((id) => !removed.has(id));
  const unchanged = itemIds.length === order.itemIds.length;

  return unchanged ? order : { ...order, itemIds };
}
