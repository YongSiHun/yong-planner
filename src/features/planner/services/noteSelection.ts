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
  const source = data.dailyPlanItems.find((item) => item.id === sourceId);
  const hasSource = source !== undefined;

  if (!hasSource) {
    return data;
  }
  const targets = [...new Set(dates)].filter((date) => date !== source.date);

  targets.forEach(parseDate);
  const hasTargets = targets.length > 0;

  if (!hasTargets) {
    return data;
  }
  const latest = data.dailyPlanItems.reduce(
    (value, item) => Math.max(value, Date.parse(item.createdAt)),
    Date.now(),
  );
  const copies = targets.map((date, index) => ({
    ...source,
    id: createId(),
    date,
    createdAt: new Date(latest + index + 1).toISOString(),
  }));
  const targetSet = new Set(targets);
  const ordersByDate = new Map(data.dailyPlanOrders.map((order) => [order.date, order]));
  const orders = copies.map((item) => {
    const existing = ordersByDate.get(item.date);
    const itemIds =
      existing?.itemIds ?? dailyNoteItems(data, item.date).map((note) => 'daily:' + note.id);

    return { date: item.date, itemIds: [...itemIds, 'daily:' + item.id] };
  });

  return {
    ...data,
    dailyPlanItems: [...data.dailyPlanItems, ...copies],
    dailyPlanOrders: [
      ...data.dailyPlanOrders.filter((order) => !targetSet.has(order.date)),
      ...orders,
    ],
  };
}

function removeOrderIds(order: PlannerData['dailyPlanOrders'][number], ids: ReadonlySet<string>) {
  const itemIds = order.itemIds.filter((id) => !ids.has(id));
  const unchanged = itemIds.length === order.itemIds.length;

  return unchanged ? order : { ...order, itemIds };
}
