// 가운데로 이동하되 실제 스크롤 가능한 내용 범위를 넘지 않는다.
export function centeredDateOffset(
  position: number,
  rowHeight: number,
  viewportHeight: number,
  contentHeight: number,
): number {
  const maximum = Math.max(0, contentHeight - viewportHeight);
  const centered = position + rowHeight / 2 - viewportHeight / 2;

  return Math.min(maximum, Math.max(0, centered));
}
