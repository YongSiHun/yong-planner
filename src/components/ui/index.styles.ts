import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { Theme } from './/palette';
import { design } from './/tokens';

export function label(
  fontFamily: string,
  muted: boolean,
  theme: Theme,
  style: StyleProp<TextStyle> | undefined,
) {
  return [
    {
      color: muted ? theme.muted : theme.text,
      fontSize: design.type.body,
      lineHeight: design.lineHeight,
    } as const,
    style,
    { fontFamily, fontWeight: 'normal' } as const,
  ] as const;
}

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
        minHeight: 44,
        minWidth: 44,
        paddingHorizontal: compact ? design.space.sm : design.space.md,
        paddingVertical: compact ? design.space.xs : 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
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
  compact: boolean,
  selected: boolean,
  bold: boolean,
) {
  return {
    color: textColor ?? (danger ? theme.red : theme.accent),
    fontSize: labelSize ?? (compact ? design.type.small : design.type.body),
    fontFamily: selected || bold ? design.font.bold : design.font.medium,
  } as const;
}

export function input(
  theme: Theme,
  propsMultiline: boolean | undefined,
  contentHeight: number,
  propsStyle: StyleProp<TextStyle> | undefined,
) {
  return [
    {
      color: theme.text,
      backgroundColor: theme.bg,
      borderColor: theme.line,
      borderWidth: 1,
      borderRadius: 9,
      padding: 12,
      minHeight: 48,
      height: propsMultiline ? contentHeight : undefined,
      fontSize: design.type.body,
      fontFamily: design.font.regular,
      textAlignVertical: 'top',
    } as const,
    propsStyle,
  ] as const;
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
