import type { PlanEntry } from '../types';
export function defaultSort(entries: PlanEntry[]): PlanEntry[] {
  const group = (e: PlanEntry) => (e.kind === 'daily' ? 2 : e.time !== null ? 0 : 1);
  return [...entries].sort(
    (a, b) =>
      group(a) - group(b) ||
      (group(a) === 0 ? (a.time ?? '').localeCompare(b.time ?? '') : 0) ||
      a.sortKey.localeCompare(b.sortKey) ||
      a.id.localeCompare(b.id),
  );
}
// Preserve the relative order of all surviving custom entries. Insert new entries next
// to the closest preceding entry in the default order; stale ids remain stored for
// rules/exceptions that may become active again, but are never rendered.
export function reconcileOrder(entries: PlanEntry[], custom?: string[]): PlanEntry[] {
  const base = defaultSort(entries);
  if (!custom) return base;
  const byId = new Map(base.map((e) => [e.id, e]));
  const ids = [...new Set(custom)].filter((id) => byId.has(id));
  for (let i = 0; i < base.length; i++) {
    const entry = base[i]!;
    if (ids.includes(entry.id)) continue;
    const previous = base
      .slice(0, i)
      .reverse()
      .find((e) => ids.includes(e.id));
    ids.splice(previous ? ids.indexOf(previous.id) + 1 : 0, 0, entry.id);
  }
  return ids.map((id) => byId.get(id)!);
}
export function moveEntry<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  if (from < 0 || from >= items.length || to < 0 || to >= items.length) return next;
  const [entry] = next.splice(from, 1);
  next.splice(to, 0, entry!);
  return next;
}

// Retain temporarily hidden occurrence identifiers when a visible list is dragged.
export function mergeOrderIds(previous: string[], visible: string[]): string[] {
  const next = [...new Set(visible)];
  for (let index = 0; index < previous.length; index++) {
    const id = previous[index]!;
    if (next.includes(id)) continue;
    const before = previous
      .slice(0, index)
      .reverse()
      .find((key) => next.includes(key));
    const after = previous.slice(index + 1).find((key) => next.includes(key));
    const position = before ? next.indexOf(before) + 1 : after ? next.indexOf(after) : next.length;
    next.splice(position, 0, id);
  }
  return next;
}
