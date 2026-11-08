const JOINING_MARK = /^[\p{Mark}\uFE0F\u200D]$/u;
const EMOJI_MODIFIER = /^[\u{1F3FB}-\u{1F3FF}]$/u;
const ZERO_WIDTH = /^[\p{Mark}\u200D\uFE0F]+$/u;
const WIDE_CHARACTER =
  /[\p{Extended_Pictographic}\p{Regional_Indicator}\u20E3\u1100-\u115F\u2329\u232A\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE10-\uFE19\uFE30-\uFE6F\uFF01-\uFF60\uFFE0-\uFFE6]/u;

function appendGrapheme(result: string[], character: string): void {
  const lastIndex = result.length - 1;
  const previous = result[lastIndex] ?? '';
  const isContinuation =
    JOINING_MARK.test(character) || previous.endsWith('\u200D') || EMOJI_MODIFIER.test(character);
  const canJoin = result.length > 0 && isContinuation;

  if (canJoin) {
    result[lastIndex] += character;

    return;
  }

  result.push(character);
}

export function graphemes(text: string): string[] {
  const supportsSegmenter = typeof Intl.Segmenter === 'function';

  if (supportsSegmenter) {
    const segments = new Intl.Segmenter('ko', { granularity: 'grapheme' }).segment(text);

    return Array.from(segments, (segment) => segment.segment);
  }

  const result: string[] = [];

  Array.from(text).forEach((character) => appendGrapheme(result, character));

  return result;
}

function characterWidth(character: string): number {
  const isZeroWidth = ZERO_WIDTH.test(character);

  if (isZeroWidth) {
    return 0;
  }

  const isTab = character === '\t';

  if (isTab) {
    return 4;
  }

  return WIDE_CHARACTER.test(character) ? 2 : 1;
}

export function displayWidth(text: string): number {
  return graphemes(text).reduce((width, character) => width + characterWidth(character), 0);
}

interface WrappedLines {
  lines: string[];
  line: string;
  width: number;
}

function endLine(state: WrappedLines): void {
  state.lines.push(state.line);
  state.line = '';
  state.width = 0;
}

function appendWrappedCharacter(state: WrappedLines, character: string, limit: number): void {
  const isNewline = character === '\n';

  if (isNewline) {
    endLine(state);

    return;
  }

  const width = characterWidth(character);
  const shouldWrap = state.width + width > limit && state.line.length > 0;

  if (shouldWrap) {
    endLine(state);
  }

  state.line += character;
  state.width += width;
}

// 출력: UI 줄바꿈·원문 분리.
export function wrapText(text: string, firstPrefix: string, columns = 72): string {
  const prefixWidth = displayWidth(firstPrefix);
  const indent = ' '.repeat(prefixWidth);
  const limit = Math.max(2, columns - prefixWidth);
  const state: WrappedLines = { lines: [], line: '', width: 0 };
  const normalizedText = text.replace(/\r\n?/g, '\n');

  graphemes(normalizedText).forEach((character) => appendWrappedCharacter(state, character, limit));
  endLine(state);

  return state.lines.map((line, index) => (index === 0 ? firstPrefix : indent) + line).join('\n');
}

export function csvCell(value: string): string {
  return '"' + value.replace(/"/g, '""') + '"';
}
