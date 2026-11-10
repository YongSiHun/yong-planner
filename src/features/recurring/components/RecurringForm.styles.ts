import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export const recurringFormViewStyle = {
  gap: design.space.md,
} as const;

export function recurringFormLabelStyle(theme: Theme) {
  return {
    flex: 1,
    minWidth: 0,
    color: theme.accent,
    fontFamily: design.font.bold,
    fontSize: design.type.title,
    lineHeight: design.lineHeights.title,
  } as const;
}

export const recurringFormViewStyle2 = { gap: design.space.sm } as const;

export const calendarTitle = { flex: 1 } as const;
