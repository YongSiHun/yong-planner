export interface ChipBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ChipDropTarget {
  boundary: number;
  x: number;
  y: number;
  height: number;
}

export function dropTarget(
  bounds: ReadonlyMap<number, ChipBounds>,
  x: number,
  y: number,
): ChipDropTarget | null {
  let nearest: ChipDropTarget | null = null;
  let distance = Infinity;

  bounds.forEach((box, index) => {
    const dx = Math.max(box.x - x, 0, x - box.x - box.width);
    const dy = Math.max(box.y - y, 0, y - box.y - box.height);
    const next = dx * dx + dy * dy;
    const isNearer = next < distance;

    if (!isNearer) {
      return;
    }
    distance = next;
    const after = x >= box.x + box.width / 2;

    nearest = {
      boundary: index + Number(after),
      x: box.x + (after ? box.width + 3 : -3),
      y: box.y,
      height: box.height,
    };
  });

  return nearest;
}

export function dropBoundary(
  bounds: ReadonlyMap<number, ChipBounds>,
  x: number,
  y: number,
): number | null {
  return dropTarget(bounds, x, y)?.boundary ?? null;
}
