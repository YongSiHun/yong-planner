export interface DragBounds {
  top: number;
  height: number;
}
export interface RowGeometry {
  y: number;
  height: number;
}
export interface DragSession {
  index: number;
  startOffset: number;
  dy: number;
  pointer: number;
  target: number;
}
export interface DragVisual {
  index: number;
  dy: number;
  target: number;
}

export function getScrollDirection(pointer: number, bounds: DragBounds): number {
  const isNearTop = pointer < bounds.top + 50;

  if (isNearTop) {
    return -1;
  }

  const isNearBottom = pointer > bounds.top + bounds.height - 50;

  if (isNearBottom) {
    return 1;
  }

  return 0;
}

export function getScrollOffset(
  offset: number,
  direction: number,
  contentHeight: number,
  viewportHeight: number,
): number {
  return Math.max(0, Math.min(contentHeight - viewportHeight, offset + direction * 12));
}

function getRowDistance(row: RowGeometry | undefined, center: number): number {
  const hasRow = row !== undefined;

  if (!hasRow) {
    return Infinity;
  }

  return Math.abs(row.y + row.height / 2 - center);
}

function findNearestRow<T>(
  items: T[],
  getItemId: (item: T) => string,
  rows: Map<string, RowGeometry>,
  center: number,
  fallback: number,
): number {
  const candidates = items.map((item, index) => ({
    index,
    distance: getRowDistance(rows.get(getItemId(item)), center),
  }));
  const nearest = candidates.reduce(
    (closest, candidate) => (candidate.distance < closest.distance ? candidate : closest),
    { index: fallback, distance: Infinity },
  );

  return nearest.index;
}

// 계산: 스크롤 이동량을 드래그 좌표에 합산.
export function calculateDrag<T>(
  items: T[],
  getItemId: (item: T) => string,
  rows: Map<string, RowGeometry>,
  session: DragSession,
  offset: number,
): DragVisual | null {
  const item = items[session.index];
  const hasItem = item !== undefined;

  if (!hasItem) {
    return null;
  }

  const row = rows.get(getItemId(item));
  const hasRow = row !== undefined;

  if (!hasRow) {
    return null;
  }

  const delta = session.dy + offset - session.startOffset;
  const center = row.y + row.height / 2 + delta;
  const target = findNearestRow(items, getItemId, rows, center, session.index);

  return { index: session.index, dy: delta, target };
}
