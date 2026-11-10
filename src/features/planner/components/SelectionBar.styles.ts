import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export function container(theme: Theme) {
  return {
    backgroundColor: theme.bg,
    borderTopWidth: 1,
    borderTopColor: theme.line,
    width: '100%',
    flexShrink: 0,
    paddingTop: design.space.sm,
    paddingBottom: design.space.xs,
    paddingHorizontal: design.space.sm,
  } as const;
}

export const actions = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'stretch',
  gap: design.space.xs,
} as const;

export function label(theme: Theme) {
  return {
    color: theme.accent,
    fontFamily: design.font.medium,
    fontSize: design.type.small,
    lineHeight: design.lineHeights.small,
    textAlign: 'center',
    alignSelf: 'stretch',
  } as const;
}

export function actionState(disabled: boolean, theme: Theme) {
  return ({ pressed }: import('react-native').PressableStateCallbackType) => {
    const activeOpacity = pressed ? 0.6 : 1;

    return {
      flex: 1,
      minWidth: design.touchTarget,
      minHeight: design.controlHeight + design.space.lg,
      paddingHorizontal: design.space.xs,
      paddingVertical: design.space.sm,
      borderRadius: design.radius.medium,
      backgroundColor: pressed ? theme.selected : 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      gap: design.space.xs,
      opacity: disabled ? 0.4 : activeOpacity,
    } as const;
  };
}
