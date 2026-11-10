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
