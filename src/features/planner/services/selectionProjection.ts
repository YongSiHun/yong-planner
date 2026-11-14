import type { DailyPlanItem } from '../types';

type IndexedItem = { item: DailyPlanItem; position: number };
const itemIndexes = new WeakMap<DailyPlanItem[], Map<string, IndexedItem>>();

function itemIndex(items: DailyPlanItem[]) {
  const cached = itemIndexes.get(items);

  if (cached) {
    return cached;
  }
  const index = new Map(items.map((item, position) => [item.id, { item, position }]));

  itemIndexes.set(items, index);

  return index;
}

export function selectedDailyItems(
  items: DailyPlanItem[] | undefined,
  selected: ReadonlySet<string>,
): DailyPlanItem[] {
  if (!items) {
    return [];
  }
  const index = itemIndex(items);

  return [...selected]
    .map((id) => index.get(id))
    .filter((entry): entry is IndexedItem => entry !== undefined)
    .sort((a, b) => a.position - b.position)
    .map((entry) => entry.item);
}

function sameIds(before: ReadonlySet<string> | undefined, after: ReadonlySet<string>): boolean {
  return before?.size === after.size && [...after].every((id) => before.has(id));
}

// Only changed dates receive a new Set, so other memoized rows retain their props.
export function createSelectedDateIndex() {
  let previous = new Map<string, ReadonlySet<string>>();

  return (items: DailyPlanItem[]) => {
    const grouped = new Map<string, Set<string>>();

    items.forEach((item) => {
      const ids = grouped.get(item.date) ?? new Set<string>();

      ids.add(item.id);
      grouped.set(item.date, ids);
    });
    const result = new Map<string, ReadonlySet<string>>();

    grouped.forEach((ids, date) => {
      const old = previous.get(date);

      result.set(date, sameIds(old, ids) ? old! : ids);
    });
    previous = result;

    return result;
  };
}
