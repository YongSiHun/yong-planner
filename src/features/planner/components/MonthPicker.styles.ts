import type { Theme } from '../../../components/ui/palette';

export function monthPickerButtonStyle(theme: Theme) {
  return { backgroundColor: theme.accent } as const;
}

export const monthPickerViewStyle = { flexDirection: 'row', alignItems: 'center', gap: 8 } as const;

export const monthPickerViewStyle2 = { flex: 1 } as const;

export const monthPickerInputStyle = { textAlign: 'center' } as const;

export function validation(theme: Theme) {
  return { color: theme.red, fontSize: 13, marginTop: 4 } as const;
}
