export interface InputMetrics {
  fontSize: number;
  lineHeight: number;
  minimumHeight: number;
  widthStep: number;
}

export interface InputLine {
  width: number;
  height?: number;
}

// 한글 조합 중 지연된 측정값 때문에 입력창 폭이 번갈아 줄지 않도록 여유 폭 확보.
export function reserveMeasuredWidth(width: number, scale: number, metrics: InputMetrics): number {
  const headroom = metrics.fontSize * scale * 2;

  return Math.ceil((width + 18 + headroom) / metrics.widthStep) * metrics.widthStep;
}

export function reserveInputWidth(text: string, scale: number, metrics: InputMetrics): number {
  const units = text
    .split('\n')
    .reduce((maximum, line) => Math.max(maximum, line.replace(/[^\x00-\x7F]/g, 'xx').length), 0);
  const estimatedWidth = units * metrics.fontSize * scale * 0.5;

  return reserveMeasuredWidth(estimatedWidth, scale, metrics);
}

export function measureInputLines(
  lines: readonly InputLine[],
  scale: number,
  metrics: InputMetrics,
) {
  const width = lines.reduce((maximum, line) => Math.max(maximum, line.width), 0);
  const height = Math.max(
    metrics.minimumHeight,
    lines.reduce(
      (total, line) => total + Math.max(line.height ?? 0, metrics.lineHeight * scale),
      0,
    ) + 8,
  );

  return { width: reserveMeasuredWidth(width, scale, metrics), height };
}
