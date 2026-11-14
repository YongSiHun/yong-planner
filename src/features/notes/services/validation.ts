export const MEMO_TITLE_MAX_LENGTH = 1000;
export const MEMO_MAX_LENGTH = 100000;

export function memoLengthError(content: string, title = ''): string | null {
  const titleTooLong = title.length > MEMO_TITLE_MAX_LENGTH;

  if (titleTooLong) {
    return '메모 제목은 최대 1,000자까지 입력할 수 있어요.';
  }
  const tooLong = title.length + content.length > MEMO_MAX_LENGTH;

  if (tooLong) {
    return '메모 제목과 본문은 합쳐서 최대 100,000자까지 입력할 수 있어요.';
  }

  return null;
}

export function memoInputError(content: string, title = ''): string | null {
  const lengthError = memoLengthError(content, title);
  const empty = (title + content).trim().length === 0;

  return lengthError ?? (empty ? '메모 제목이나 본문을 입력해 주세요.' : null);
}

export function memoLimitNotice(content: string, title: string): string | null {
  const titleAtLimit = title.length === MEMO_TITLE_MAX_LENGTH;
  const totalAtLimit = title.length + content.length === MEMO_MAX_LENGTH;

  if (totalAtLimit) {
    return '제목과 본문 합계 100,000자에 도달했어요.';
  }

  return titleAtLimit ? '제목 최대 길이 1,000자에 도달했어요.' : null;
}
