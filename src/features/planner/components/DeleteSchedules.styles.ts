import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export const actions = { flexDirection: 'row', gap: design.space.sm } as const;

export const action = {
  flex: 1,
  minHeight: design.touchTarget,
  paddingHorizontal: design.space.md,
  paddingVertical: design.space.sm,
  backgroundColor: 'transparent',
} as const;

export function message(theme: Theme) {
  return {
    color: theme.text,
    fontFamily: design.font.regular,
    fontSize: design.type.body,
    lineHeight: design.lineHeight,
  } as const;
}
