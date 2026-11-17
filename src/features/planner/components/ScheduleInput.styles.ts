import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export function field(theme: Theme) {
  return {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: design.space.xs,
    padding: design.space.xs,
    minHeight: design.touchTarget,
    backgroundColor: theme.selected,
    borderRadius: design.radius.small,
  } as const;
}

export function input(theme: Theme) {
  return {
    fontFamily: design.font.regular,
    fontSize: design.type.body,
    lineHeight: design.lineHeights.body,
    includeFontPadding: true,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.accent,
    borderRadius: design.radius.medium,
    backgroundColor: theme.bg,
    padding: design.space.md,
    marginVertical: design.space.xs,
    height: design.lineHeights.body * 4 + design.space.md * 2 + 2,
    width: '100%',
  } as const;
}
