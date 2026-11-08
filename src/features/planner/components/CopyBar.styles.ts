import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export function copyBarViewStyle(theme: Theme) {
  return {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.bg,
    borderTopWidth: 1,
    borderTopColor: theme.line,
    gap: 4,
  } as const;
}

export const copyBarViewStyle2 = { flexDirection: 'row', alignItems: 'center', gap: 8 } as const;

export function copyBarTextStyle(theme: Theme) {
  return {
    flex: 1,
    fontFamily: design.font.medium,
    color: theme.text,
    fontSize: design.type.small,
  } as const;
}

export const copyBarLabelStyle = { fontSize: design.type.small, lineHeight: 18 } as const;

export function copyBarButtonStyle(theme: Theme) {
  return { backgroundColor: theme.accent } as const;
}
