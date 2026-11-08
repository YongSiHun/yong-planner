import type { DailyPlanItem } from '../types';

export function preserveNoteItems(
  existing: DailyPlanItem[],
  contents: string[],
): (DailyPlanItem | undefined)[] {
  const before = existing.map((item) => item.content);
  const prefix = sharedPartPrefix(before, contents);
  const suffix = sharedPartSuffix(before, contents, prefix);

  return contents.map((_, index) =>
    existingNoteForIndex(existing, index, contents.length, prefix, suffix),
  );
}

function sharedPartPrefix(before: string[], after: string[]): number {
  let index = 0;
  const maximum = Math.min(before.length, after.length);

  while (index < maximum && before[index] === after[index]) {
    index++;
  }

  return index;
}

function sharedPartSuffix(before: string[], after: string[], prefix: number): number {
  let length = 0;
  const maximum = Math.min(before.length, after.length) - prefix;

  while (
    length < maximum &&
    before[before.length - length - 1] === after[after.length - length - 1]
  ) {
    length++;
  }

  return length;
}

function existingNoteForIndex(
  existing: DailyPlanItem[],
  index: number,
  size: number,
  prefix: number,
  suffix: number,
): DailyPlanItem | undefined {
  const isPrefix = index < prefix;

  if (isPrefix) {
    return existing[index];
  }
  const isSuffix = index >= size - suffix;

  if (isSuffix) {
    return existing[existing.length - (size - index)];
  }
  const oldMiddleSize = existing.length - prefix - suffix;
  const canReuse = index - prefix < oldMiddleSize;

  return canReuse ? existing[index] : undefined;
}
