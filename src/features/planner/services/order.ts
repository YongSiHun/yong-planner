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

export function moveEntry<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const hasValidSource = from >= 0 && from < items.length;
  const hasValidTarget = to >= 0 && to < items.length;
  const canMove = hasValidSource && hasValidTarget;

  if (!canMove) {
    return next;
  }

  const [entry] = next.splice(from, 1);

  next.splice(to, 0, entry!);

  return next;
}

function getHiddenInsertionIndex(previous: string[], next: string[], index: number): number {
  const before = previous
    .slice(0, index)
    .reverse()
    .find((id) => next.includes(id));
  const hasPrevious = before !== undefined;

  if (hasPrevious) {
    return next.indexOf(before) + 1;
  }

  const after = previous.slice(index + 1).find((id) => next.includes(id));

  return after === undefined ? next.length : next.indexOf(after);
}

function retainHiddenEntry(previous: string[], next: string[], index: number): void {
  const id = previous[index]!;
  const isVisible = next.includes(id);

  if (isVisible) {
    return;
  }

  next.splice(getHiddenInsertionIndex(previous, next, index), 0, id);
}

// 예외: 숨겨진 반복 ID도 재정렬 시 보존.
export function mergeOrderIds(previous: string[], visible: string[]): string[] {
  const next = [...new Set(visible)];

  previous.forEach((_, index) => retainHiddenEntry(previous, next, index));

  return next;
}
