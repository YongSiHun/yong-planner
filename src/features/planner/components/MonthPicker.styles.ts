import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';
import { filledButton } from '../../../components/ui/settings.styles';

export const monthPickerViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: design.space.md,
} as const;

export const monthPickerViewStyle2 = { flex: 1, minWidth: 0 } as const;

export const monthPickerInputStyle = {
  textAlign: 'center',
  fontSize: design.type.action,
  lineHeight: design.lineHeights.action,
  fontFamily: design.font.medium,
  minHeight: design.touchTarget,
  paddingHorizontal: design.space.sm,
  paddingVertical: design.space.sm,
} as const;
export const unit = {
  fontSize: design.type.action,
  lineHeight: design.lineHeights.action,
  fontFamily: design.font.medium,
} as const;

export function validation(theme: Theme) {
  return {
    color: theme.red,
    fontSize: design.type.small,
    lineHeight: design.lineHeights.small,
    marginTop: design.space.xs,
  } as const;
}

export function moveAction(theme: Theme) {
  return { ...filledButton(theme), alignSelf: 'flex-end' } as const;
}
