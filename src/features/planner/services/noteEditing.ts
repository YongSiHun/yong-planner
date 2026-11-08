import { noteLengthError } from '../../../services/schedule';
import type { DailyPlanItem, PlannerData } from '../types';
import { dailyNoteItems, mergeNoteOrder } from './note';
import { parseScheduleTimePrefix } from './time';

export function editDailyContents(
  data: PlannerData,
  changes: ReadonlyMap<string, string>,
  createId: () => string,
): PlannerData {
  changes.forEach((value) => {
    const error = noteLengthError(value);

    if (error) {
      throw new Error(error);
    }
  });
  const replacements = new Map<string, DailyPlanItem[]>();
  const dates = new Set<string>();
  let sequence = data.dailyPlanItems.reduce(
    (latest, item) => Math.max(latest, Date.parse(item.createdAt)),
    Date.now(),
  );
  const items = data.dailyPlanItems.flatMap((item) => {
    const text = changes.get(item.id);
    const changed = text !== undefined && text !== item.content;

    if (!changed) {
      return [item];
    }
    const replacement = text.split(',').map((part, index) => {
      const parsed = parseScheduleTimePrefix(part);
      const first = index === 0;

      return {
        ...item,
        id: first ? item.id : createId(),
        content: parsed.content,
        time: parsed.time ?? item.time,
        createdAt: first ? item.createdAt : new Date(++sequence).toISOString(),
      };
    });

    replacements.set(item.id, replacement);
    dates.add(item.date);

    return replacement;
  });

  const unchanged = dates.size === 0;

  if (unchanged) {
    return data;
  }
  const existingOrders = new Map(data.dailyPlanOrders.map((order) => [order.date, order.itemIds]));
  const orders = [...dates].map((date) => {
    const ids = dailyNoteItems(data, date).flatMap((item) =>
      (replacements.get(item.id) ?? [item]).map((note) => 'daily:' + note.id),
    );

    return { date, itemIds: mergeNoteOrder(existingOrders.get(date) ?? [], ids) };
  });

  return {
    ...data,
    dailyPlanItems: items,
    dailyPlanOrders: [...data.dailyPlanOrders.filter((order) => !dates.has(order.date)), ...orders],
  };
}
