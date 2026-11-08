import type { Theme } from '../../../components/ui/palette';

export function monthPickerButtonStyle(theme: Theme) {
  return { backgroundColor: theme.accent } as const;
}

export const monthPickerViewStyle = { flexDirection: 'row', alignItems: 'center', gap: 8 } as const;

export const monthPickerViewStyle2 = { flex: 1 } as const;

export const monthPickerInputStyle = { textAlign: 'center' } as const;

export const monthPickerViewStyle3 = { flexDirection: 'row', flexWrap: 'wrap' } as const;

export const monthPickerButtonStyle2 = { width: '25%' } as const;
