// 날짜 시작을 화면 위쪽 20% 지점에 맞추되 스크롤 범위 내로 제한한다.
export function centeredDateOffset(
  position: number,
  _rowHeight: number,
  viewportHeight: number,
  contentHeight: number,
): number {
  const maximum = Math.max(0, contentHeight - viewportHeight);
  const centered = position - viewportHeight * 0.2;

  return Math.min(maximum, Math.max(0, centered));
}
