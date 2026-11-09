// 서로게이트 쌍은 4바이트, 단독 서로게이트는 대체 문자처럼 3바이트다.
function characterBytes(character: string): number {
  const code = character.codePointAt(0)!;

  return 1 + Number(code > 0x7f) + Number(code > 0x7ff) + Number(code > 0xffff);
}

export function fitsUtf8Limit(value: string, maximum: number): boolean {
  let bytes = 0;

  for (const character of value) {
    bytes += characterBytes(character);
    const exceedsLimit = bytes > maximum;

    if (exceedsLimit) {
      return false;
    }
  }

  return true;
}
