export interface ChipBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function dropBoundary(
  bounds: ReadonlyMap<number, ChipBounds>,
  x: number,
  y: number,
): number | null {
  let nearest: number | null = null;
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
    nearest = index + Number(x >= box.x + box.width / 2);
  });

  return nearest;
}
