// 중앙 이동: 스크롤 범위 내 제한.
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
