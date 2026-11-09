import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export const todayButtonViewStyle = {
  position: 'absolute',
  bottom: design.space.md,
  right: design.layout.pagePadding,
} as const;

export function todayButtonPressableStyle(theme: Theme) {
  return ({ pressed }: import('react-native').PressableStateCallbackType) =>
    ({
      backgroundColor: theme.accent,
      borderRadius: design.radius.medium,
      borderWidth: 1,
      borderColor: theme.accent,
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: design.touchTarget,
      paddingHorizontal: design.space.md,
      justifyContent: 'center',
      opacity: pressed ? 0.8 : 1,
    }) as const;
}

export function todayButtonTextStyle(theme: Theme) {
  return {
    color: theme.onAccent,
    fontSize: design.type.small,
    lineHeight: design.lineHeights.small,
    fontFamily: design.font.medium,
  } as const;
}
