import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';
export { action } from '../../../components/ui/Dialog.styles';

export const dialogHeight = design.layout.pickerHeight;

export const timePickerViewStyle = {
  flexDirection: 'row',
  flexShrink: 0,
  gap: design.space.xs,
} as const;
export const period = { minWidth: design.touchTarget, paddingHorizontal: 0 } as const;

export const timePickerViewStyle2 = {
  flexDirection: 'row',
  flexShrink: 0,
  alignItems: 'center',
  gap: design.space.sm,
} as const;

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
    flexShrink: 1,
    minHeight: 0,
    overflow: 'hidden',
    backgroundColor: theme.surface,
    borderRadius: design.radius.medium,
    padding: design.space.md,
    gap: design.space.sm,
  } as const;
}

export const previewScroll = {
  height:
    design.lineHeights.body * design.layout.previewRows +
    design.space.sm * (design.layout.previewRows - 1),
  flexShrink: 1,
  minHeight: 0,
  flexGrow: 0,
} as const;

export const previewContent = { gap: design.space.sm, paddingRight: design.space.sm } as const;

export function alarmNotice(theme: Theme) {
  return {
    color: theme.red,
    fontSize: design.type.small,
    lineHeight: design.lineHeights.small,
  } as const;
}
