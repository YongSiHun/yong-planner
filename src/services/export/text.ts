export function graphemes(text: string): string[] {
  if (typeof Intl.Segmenter === 'function')
    return Array.from(
      new Intl.Segmenter('ko', { granularity: 'grapheme' }).segment(text),
      (s) => s.segment,
    );
  const result: string[] = [];
  for (const c of text) {
    if (
      result.length &&
      (/^[\p{Mark}\uFE0F\u200D]$/u.test(c) ||
        result[result.length - 1]!.endsWith('\u200D') ||
        /^[\u{1F3FB}-\u{1F3FF}]$/u.test(c))
    )
      result[result.length - 1] += c;
    else result.push(c);
  }
  return result;
}
export function displayWidth(text: string): number {
  return graphemes(text).reduce((sum, c) => {
    if (/^[\p{Mark}\u200D\uFE0F]+$/u.test(c)) return sum;
    if (c === '\t') return sum + 4;
    return (
      sum +
      (/[\p{Extended_Pictographic}\p{Regional_Indicator}\u20E3\u1100-\u115F\u2329\u232A\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE10-\uFE19\uFE30-\uFE6F\uFF01-\uFF60\uFFE0-\uFFE6]/u.test(
        c,
      )
        ? 2
        : 1)
    );
  }, 0);
}
export function wrapText(text: string, firstPrefix: string, columns = 72): string {
  const indent = ' '.repeat(displayWidth(firstPrefix));
  const limit = Math.max(2, columns - displayWidth(firstPrefix));
  const lines: string[] = [];
  let line = '';
  let width = 0;
  for (const c of graphemes(text.replace(/\r\n?/g, '\n'))) {
    if (c === '\n') {
      lines.push(line);
      line = '';
      width = 0;
      continue;
    }
    const n = displayWidth(c);
    if (width + n > limit && line) {
      lines.push(line);
      line = '';
      width = 0;
    }
    line += c;
    width += n;
  }
  lines.push(line);
  return lines.map((v, i) => (i === 0 ? firstPrefix : indent) + v).join('\n');
}
export function csvCell(value: string): string {
  return '"' + value.replace(/"/g, '""') + '"';
}
