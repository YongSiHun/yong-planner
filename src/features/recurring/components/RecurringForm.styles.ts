import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export const recurringFormViewStyle = {
  gap: design.space.sm,
  paddingVertical: design.space.sm,
} as const;

export function recurringFormLabelStyle(theme: Theme) {
  return { flex: 1, color: theme.accent, fontFamily: design.font.bold } as const;
}

export const recurringFormViewStyle2 = { gap: design.space.xs } as const;

export const calendarTitle = { flex: 1 } as const;
