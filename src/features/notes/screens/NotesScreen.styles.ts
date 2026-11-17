import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export function screen(theme: Theme) {
  return { flex: 1, backgroundColor: theme.bg } as const;
}

export const frame = {
  flex: 1,
  width: '100%',
  maxWidth: design.layout.contentMaxWidth,
  alignSelf: 'center',
} as const;

export const notice = { padding: design.layout.pagePadding } as const;
