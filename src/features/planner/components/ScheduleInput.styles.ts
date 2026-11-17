import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export const field = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  gap: design.space.xs,
} as const;

export function input(theme: Theme, height?: number) {
  return {
    fontFamily: design.font.regular,
    fontSize: design.type.body,
    lineHeight: design.lineHeights.body,
    includeFontPadding: true,
    color: theme.text,
    paddingHorizontal: 0,
    paddingVertical: 2,
    height,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 80,
    maxWidth: '100%',
  } as const;
}
