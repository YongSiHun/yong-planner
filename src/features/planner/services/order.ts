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

function insertNewEntry(ids: string[], base: PlanEntry[], index: number): void {
  const entry = base[index]!;
  const isPresent = ids.includes(entry.id);

  if (isPresent) {
    return;
  }

  const previous = base
    .slice(0, index)
    .reverse()
    .find((candidate) => ids.includes(candidate.id));
  const insertionIndex = previous ? ids.indexOf(previous.id) + 1 : 0;

  ids.splice(insertionIndex, 0, entry.id);
}

// 정렬: 기존 상대 순서를 유지하고 새 항목만 삽입.
export function reconcileOrder(entries: PlanEntry[], custom?: string[]): PlanEntry[] {
  const base = defaultSort(entries);
  const hasCustomOrder = custom !== undefined;

  if (!hasCustomOrder) {
    return base;
  }

  const entriesById = new Map(base.map((entry) => [entry.id, entry]));
  const ids = [...new Set(custom)].filter((id) => entriesById.has(id));

  base.forEach((_, index) => insertNewEntry(ids, base, index));

  return ids.map((id) => entriesById.get(id)!);
}
