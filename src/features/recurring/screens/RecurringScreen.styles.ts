import { layout as layoutStyles } from '../../../components/ui/layout.styles';
import { design } from '../../../components/ui/tokens';
import type { Theme } from '../../../components/ui/palette';

export function recurringRowViewStyle(theme: Theme) {
  return {
    paddingBottom: design.space.lg,
    gap: design.space.sm,
    borderBottomWidth: 1,
    borderColor: theme.line,
  } as const;
}

export const recurringRowButtonStyle = layoutStyles.textAction;

export function recurringContentKeyboardAvoidingViewStyle(theme: Theme) {
  return [layoutStyles.page, { backgroundColor: theme.bg } as const] as const;
}

export const recurringContentScrollViewContentContainerStyle = layoutStyles.pageContent;

export const recurringContentLabelStyle = { fontSize: design.type.small } as const;

export const recurringContentLabelStyle2 = {
  paddingVertical: design.space.lg,
  fontSize: design.type.small,
} as const;
