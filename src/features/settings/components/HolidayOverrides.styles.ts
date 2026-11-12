import { design } from '../../../components/ui/tokens';
import { heading, filledButton } from '../../../components/ui/settings.styles';
export { section, row, button } from '../../../components/ui/settings.styles';
export { action } from '../../../components/ui/Dialog.styles';
export const holidayOverridesLabelStyle = heading;

export const holidayOverridesLabelStyle2 = { flex: 1, minWidth: 0 } as const;

export const addButton = filledButton;

export const description = {
  fontSize: design.type.small,
  lineHeight: design.lineHeights.small,
} as const;

export const dateRow = { flexDirection: 'row', gap: design.space.sm } as const;
export const dateField = { flex: 1, minWidth: 0, gap: design.space.xs } as const;
export const yearField = { ...dateField, flex: 2 } as const;
