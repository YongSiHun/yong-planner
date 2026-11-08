export function monthSelection(year: string, month: string) {
  const yearError = integerError(year, 9999, '연도는 1~9999 사이의 정수로 입력해 주세요.');
  const monthError = integerError(month, 12, '월은 1~12 사이의 정수로 입력해 주세요.');
  const valid = yearError === null && monthError === null;
  const date = valid ? year.padStart(4, '0') + '-' + month.padStart(2, '0') + '-01' : null;

  return { yearError, monthError, date };
}

function integerError(value: string, maximum: number, message: string): string | null {
  const digits = /^\d+$/.test(value);
  const number = Number(value);
  const inRange = number >= 1 && number <= maximum;
  const validFormat = digits && value.length <= String(maximum).length;
  const valid = validFormat && inRange;

  return valid ? null : message;
}
