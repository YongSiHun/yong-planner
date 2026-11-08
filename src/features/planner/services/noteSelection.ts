import { parseDate } from '../../../utils/date';
import type { PlannerData } from '../types';
import { dailyNoteItems } from './note';

export function deleteSelectedNotes(data: PlannerData, ids: ReadonlySet<string>): PlannerData {
  const items = data.dailyPlanItems.filter((item) => !ids.has(item.id));
  const isUnchanged = items.length === data.dailyPlanItems.length;

  if (isUnchanged) {
    return data;
  }
  const orderIds = new Set([...ids].map((id) => 'daily:' + id));

  return {
    ...data,
    dailyPlanItems: items,
    dailyPlanOrders: data.dailyPlanOrders.map((order) => removeOrderIds(order, orderIds)),
  };
}

export function copyNoteToDates(
  data: PlannerData,
  sourceId: string,
  dates: string[],
  createId: () => string,
): PlannerData {
  return copyNotesToDates(data, new Set([sourceId]), dates, createId);
}

export function copyNotesToDates(
  data: PlannerData,
  ids: ReadonlySet<string>,
  dates: string[],
  createId: () => string,
): PlannerData {
  const sourceDates = [
    ...new Set(data.dailyPlanItems.filter((item) => ids.has(item.id)).map((item) => item.date)),
  ].sort();
  const sources = sourceDates.flatMap((date) =>
    dailyNoteItems(data, date).filter((item) => ids.has(item.id)),
  );
  const targets = [...new Set(dates)];

  targets.forEach(parseDate);
  let sequence = data.dailyPlanItems.reduce(
    (latest, item) => Math.max(latest, Date.parse(item.createdAt)),
    Date.now(),
  );
  const copies = targets.flatMap((date) =>
    sources
      .filter((source) => source.date !== date)
      .map((source) => ({
        ...source,
        id: createId(),
        date,
        createdAt: new Date(++sequence).toISOString(),
      })),
  );

  const noCopies = copies.length === 0;

  if (noCopies) {
    return data;
  }
  const addedByDate = new Map<string, string[]>();

  copies.forEach((item) => {
    const ids = addedByDate.get(item.date) ?? [];

    ids.push('daily:' + item.id);
    addedByDate.set(item.date, ids);
  });
  const ordersByDate = new Map(data.dailyPlanOrders.map((order) => [order.date, order]));
  const orders = [...addedByDate].map(([date, ids]) => {
    const existing = ordersByDate.get(date);
    const itemIds = existing?.itemIds ?? [];
    const orderedIds = new Set(itemIds);
    const missingIds = dailyNoteItems(data, date)
      .map((note) => 'daily:' + note.id)
      .filter((id) => !orderedIds.has(id));

    return { date, itemIds: [...itemIds, ...missingIds, ...ids] };
  });

  return {
    ...data,
    dailyPlanItems: [...data.dailyPlanItems, ...copies],
    dailyPlanOrders: [
      ...data.dailyPlanOrders.filter((order) => !addedByDate.has(order.date)),
      ...orders,
    ],
  };
}

function removeOrderIds(order: PlannerData['dailyPlanOrders'][number], ids: ReadonlySet<string>) {
  const itemIds = order.itemIds.filter((id) => !ids.has(id));
  const unchanged = itemIds.length === order.itemIds.length;

  return unchanged ? order : { ...order, itemIds };
}
