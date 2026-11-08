import type { PlannerData } from '../types';
import { dailyNoteItems, mergeNoteOrder } from './note';

export function moveDailyNote(
  data: PlannerData,
  date: string,
  from: number,
  boundary: number,
): PlannerData {
  const items = dailyNoteItems(data, date);
  const valid = validPosition(from, items.length - 1) && validPosition(boundary, items.length);

  if (!valid) {
    return data;
  }
  const destination = boundary - Number(boundary > from);
  const unchanged = from === destination;

  if (unchanged) {
    return data;
  }
  const moved = items.splice(from, 1)[0]!;

  items.splice(destination, 0, moved);
  const existing = data.dailyPlanOrders.find((order) => order.date === date);
  const itemIds = mergeNoteOrder(
    existing?.itemIds ?? [],
    items.map((item) => 'daily:' + item.id),
  );

  return {
    ...data,
    dailyPlanOrders: [
      ...data.dailyPlanOrders.filter((order) => order.date !== date),
      { date, itemIds },
    ],
  };
}

function validPosition(value: number, maximum: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= maximum;
}
