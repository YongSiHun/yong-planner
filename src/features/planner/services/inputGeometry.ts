export interface InputMetrics {
  fontSize: number;
  lineHeight: number;
  minimumHeight: number;
}

export interface InputLine {
  width: number;
  text?: string;
  height?: number;
}

// 저장 칩과 같은 좌우 여백(16)·테두리(2)에 커서 여유만 추가한다.
export function reserveMeasuredWidth(width: number, scale: number): number {
  return Math.ceil(width + 18 + 2 * scale);
}

export function reserveInputWidth(text: string, scale: number, metrics: InputMetrics): number {
  const units = text
    .split('\n')
    .reduce((maximum, line) => Math.max(maximum, line.replace(/[^\x00-\x7F]/g, 'xx').length), 0);
  const estimatedWidth = units * metrics.fontSize * scale * 0.5;

  return reserveMeasuredWidth(estimatedWidth, scale);
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

  return { width: reserveMeasuredWidth(width, scale), height };
}

export function matchesMeasuredContent(lines: readonly InputLine[], content: string): boolean {
  const hasText = lines.some((line) => line.text !== undefined);
  const blank = content.length === 0;

  const skipComparison = !hasText || blank;

  if (skipComparison) {
    return true;
  }
  const measured = lines
    .map((line) => line.text ?? '')
    .join('')
    .replace(/\r?\n/g, '');

  return measured === content.replace(/\r?\n/g, '');
}
