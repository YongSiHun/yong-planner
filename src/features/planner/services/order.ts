import type { PlanEntry } from '../types';

function getEntryGroup(entry: PlanEntry): number {
  const isDaily = entry.kind === 'daily';

  if (isDaily) {
    return 2;
  }

  const hasTime = entry.time !== null;

  return hasTime ? 0 : 1;
}

function compareEntries(first: PlanEntry, second: PlanEntry): number {
  const firstGroup = getEntryGroup(first);
  const groupDifference = firstGroup - getEntryGroup(second);
  const hasDifferentGroups = groupDifference !== 0;

  if (hasDifferentGroups) {
    return groupDifference;
  }

  const isTimedGroup = firstGroup === 0;
  const timeDifference = isTimedGroup ? (first.time ?? '').localeCompare(second.time ?? '') : 0;

  return (
    timeDifference ||
    first.sortKey.localeCompare(second.sortKey) ||
    first.id.localeCompare(second.id)
  );
}

export function defaultSort(entries: PlanEntry[]): PlanEntry[] {
  return [...entries].sort(compareEntries);
}

// ID 연결: 사용자 순서 유지·신규 항목 1회 순회 삽입.
export function reconcileOrder(entries: PlanEntry[], custom?: string[]): PlanEntry[] {
  const base = defaultSort(entries);
  const hasCustomOrder = custom !== undefined;

  if (!hasCustomOrder) {
    return base;
  }
  const byId = new Map(base.map((entry) => [entry.id, entry]));
  const ids = [...new Set(custom)].filter((id) => byId.has(id));
  const next = new Map<string | null, string | null>();

  next.set(null, ids[0] ?? null);
  ids.forEach((id, index) => next.set(id, ids[index + 1] ?? null));
  let previous: string | null = null;

  base.forEach((entry) => {
    const isMissing = !next.has(entry.id);

    if (isMissing) {
      next.set(entry.id, next.get(previous) ?? null);
      next.set(previous, entry.id);
    }
    previous = entry.id;
  });

  return orderedEntries(next, byId);
}

function orderedEntries(
  next: Map<string | null, string | null>,
  byId: Map<string, PlanEntry>,
): PlanEntry[] {
  const result: PlanEntry[] = [];
  let id = next.get(null) ?? null;

  while (id !== null) {
    result.push(byId.get(id)!);
    id = next.get(id) ?? null;
  }

  return result;
}
