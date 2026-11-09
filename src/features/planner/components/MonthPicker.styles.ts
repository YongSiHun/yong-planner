import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';
export { action } from '../../../components/ui/Dialog.styles';

export const monthPickerViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: design.space.sm,
} as const;

export const monthPickerViewStyle2 = { flex: 1 } as const;

export const monthPickerInputStyle = { textAlign: 'center' } as const;

export function validation(theme: Theme) {
  return {
    color: theme.red,
    fontSize: design.type.small,
    lineHeight: design.lineHeights.small,
    marginTop: design.space.xs,
  } as const;
}
