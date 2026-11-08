import { layout as layoutStyles } from '../../../components/ui/layout.styles';
import type { Theme } from '../../../components/ui/palette';

export function recurringRowViewStyle(theme: Theme) {
  return { paddingVertical: 16, borderBottomWidth: 1, borderColor: theme.line } as const;
}

export const recurringRowButtonStyle = { alignItems: 'flex-start' } as const;

export function recurringContentKeyboardAvoidingViewStyle(theme: Theme) {
  return [layoutStyles.page, { backgroundColor: theme.bg } as const] as const;
}

export const recurringContentScrollViewContentContainerStyle = { paddingBottom: 32 } as const;

export const recurringContentLabelStyle = { marginVertical: 16 } as const;

export const recurringContentLabelStyle2 = { marginVertical: 32 } as const;
