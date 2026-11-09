import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';
export { action } from '../../../components/ui/Dialog.styles';

export const dialogHeight = 380;

export const timePickerViewStyle = { flexDirection: 'row' } as const;

export const timePickerViewStyle2 = { flexDirection: 'row', alignItems: 'center', gap: 8 } as const;

export const timePickerViewStyle3 = { flex: 1 } as const;

export const timePickerInputStyle = { textAlign: 'center' } as const;

export const footer = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: design.space.lg,
} as const;
export const clearSlot = { flexGrow: 1, flexDirection: 'row' } as const;

export function preview(theme: Theme) {
  return {
    backgroundColor: theme.surface,
    borderRadius: design.radius.medium,
    padding: design.space.md,
    gap: design.space.sm,
  } as const;
}

export const previewScroll = {
  height: design.lineHeights.body * 4 + design.space.sm * 3,
  flexShrink: 0,
  flexGrow: 0,
} as const;

export const previewContent = { gap: design.space.sm, paddingRight: design.space.sm } as const;
