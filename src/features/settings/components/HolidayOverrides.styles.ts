import { design } from '../../../components/ui/tokens';
import { filledButton } from '../../../components/ui/settings.styles';
export { section, row, button } from '../../../components/ui/settings.styles';
export { action } from '../../../components/ui/Dialog.styles';
export { heading } from '../../../components/ui/settings.styles';

export const itemLabel = { flex: 1, minWidth: 0 } as const;

export const addButton = filledButton;

export const description = {
  fontSize: design.type.small,
  lineHeight: design.lineHeights.small,
} as const;

export function validation(theme: import('../../../components/ui/palette').Theme) {
  return {
    color: theme.red,
    fontSize: design.type.small,
    lineHeight: design.lineHeights.small,
  } as const;
}
