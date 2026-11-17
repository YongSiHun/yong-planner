export function toggled<T>(current: ReadonlySet<T>, id: T, begin = false): ReadonlySet<T> {
  const next = new Set(current);
  const shouldRemove = current.has(id) && !begin;

  if (!shouldRemove) {
    next.add(id);

    return next;
  }
  next.delete(id);

  return next;
}
