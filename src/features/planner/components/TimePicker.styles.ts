import type { Theme } from '../../../components/ui/palette';

export const timePickerViewStyle = { flexDirection: 'row' } as const;

export const timePickerViewStyle2 = { flexDirection: 'row', alignItems: 'center', gap: 8 } as const;

export const timePickerViewStyle3 = { flex: 1 } as const;

export const timePickerInputStyle = { textAlign: 'center' } as const;

export function primaryAction(theme: Theme) {
  return { backgroundColor: theme.accent } as const;
}
