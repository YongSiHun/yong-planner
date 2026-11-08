export function toggled(
  current: ReadonlySet<string>,
  id: string,
  begin: boolean,
): ReadonlySet<string> {
  const next = new Set(current);
  const shouldRemove = current.has(id) && !begin;

  if (!shouldRemove) {
    next.add(id);

    return next;
  }
  next.delete(id);

  return next;
}
