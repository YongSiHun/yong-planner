export function commonPrefixLength(before: string, after: string): number {
  const maximum = Math.min(before.length, after.length);
  let length = 0;

  while (length < maximum && before[length] === after[length]) {
    length++;
  }

  return length;
}

export function commonSuffixLength(
  before: string,
  after: string,
  prefix = commonPrefixLength(before, after),
): number {
  const maximum = Math.min(before.length, after.length) - prefix;
  let length = 0;

  while (length < maximum && before.at(-length - 1) === after.at(-length - 1)) {
    length++;
  }

  return length;
}
