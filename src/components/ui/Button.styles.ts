import type { ViewStyle } from 'react-native';
import type { Theme } from './palette';
import { design, lineHeightForSize } from './tokens';

export function button(
  compact: boolean,
  selected: boolean,
  theme: Theme,
  disabled: boolean,
  style: ViewStyle | undefined,
) {
  return ({ pressed }: import('react-native').PressableStateCallbackType) =>
    [
      {
        minHeight: design.touchTarget,
        maxWidth: '100%',
        minWidth: design.touchTarget,
        paddingHorizontal: compact ? design.space.sm : design.space.md,
        paddingVertical: compact ? design.space.xs : design.space.sm,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: design.radius.medium,
        backgroundColor: selected ? theme.selected : 'transparent',
        opacity: getButtonOpacity(disabled, pressed),
      } as const,
      style,
    ] as const;
}

export function buttonLabel(
  textColor: string | undefined,
  danger: boolean,
  theme: Theme,
  labelSize: number | undefined,
  selected: boolean,
  bold: boolean,
) {
  const fontSize = labelSize ?? design.type.action;

  return {
    color: textColor ?? (danger ? theme.red : theme.accent),
    fontSize,
    lineHeight: lineHeightForSize(fontSize),
    fontFamily: selected || bold ? design.font.bold : design.font.medium,
  } as const;
}

function getButtonOpacity(isDisabled: boolean, isPressed: boolean): number {
  if (isDisabled) {
    return 0.4;
  }
  if (isPressed) {
    return 0.6;
  }

  return 1;
}
