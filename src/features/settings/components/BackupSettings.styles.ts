import type { PressableStateCallbackType } from 'react-native';
import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export function helpButton(theme: Theme) {
  return ({ pressed }: PressableStateCallbackType) =>
    ({
      width: design.lineHeights.title,
      height: design.lineHeights.title,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: design.radius.small,
      backgroundColor: pressed ? theme.selected : 'transparent',
    }) as const;
}
