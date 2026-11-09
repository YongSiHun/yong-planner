import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export function copyBarViewStyle(theme: Theme) {
  return {
    paddingHorizontal: design.space.sm,
    paddingVertical: design.space.sm,
    backgroundColor: theme.bg,
    borderTopWidth: 1,
    borderTopColor: theme.line,
    gap: design.space.sm,
  } as const;
}

export const copyBarViewStyle2 = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: design.space.sm,
} as const;

export function copyBarTextStyle(theme: Theme) {
  return {
    flex: 1,
    minWidth: 0,
    fontFamily: design.font.medium,
    color: theme.text,
    fontSize: design.type.small,
    lineHeight: design.lineHeights.small,
  } as const;
}

export const copyBarLabelStyle = {
  fontSize: design.type.small,
  lineHeight: design.lineHeights.small,
} as const;

export function copyBarButtonStyle(theme: Theme) {
  return { backgroundColor: theme.accent } as const;
}
