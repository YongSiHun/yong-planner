import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export { actions, action } from '../../../components/ui/Dialog.styles';

export function message(theme: Theme) {
  return {
    color: theme.text,
    fontFamily: design.font.regular,
    fontSize: design.type.body,
    lineHeight: design.lineHeight,
  } as const;
}
