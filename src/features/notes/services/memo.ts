import type { Memo } from '../../planner/types';

// Older memos stored their title as the first line of the content.
export function memoFields(memo: Memo | null | undefined) {
  const hasSeparateTitle = memo?.title !== undefined;

  if (hasSeparateTitle) {
    return { title: memo.title ?? '', body: memo.content };
  }
  const [title = '', ...lines] = (memo?.content ?? '').split(/\r?\n/);

  return { title, body: lines.join('\n') };
}
