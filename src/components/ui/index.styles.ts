import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { Theme } from './palette';
import { design, lineHeightForSize } from './tokens';

export function label(
  fontFamily: string,
  fontSize: number,
  muted: boolean,
  theme: Theme,
  style: StyleProp<TextStyle> | undefined,
) {
  return [
    {
      color: muted ? theme.muted : theme.text,
      fontSize,
      lineHeight: lineHeightForSize(fontSize),
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
  compact: boolean,
  selected: boolean,
  bold: boolean,
) {
  const fontSize = labelSize ?? (compact ? design.type.small : design.type.body);

  return {
    color: textColor ?? (danger ? theme.red : theme.accent),
    fontSize,
    lineHeight: lineHeightForSize(fontSize),
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
      borderRadius: design.radius.medium,
      padding: design.space.md,
      minHeight: design.controlHeight,
      height: propsMultiline ? contentHeight : undefined,
      fontSize: design.type.body,
      lineHeight: design.lineHeights.body,
      fontFamily: design.font.regular,
      textAlignVertical: propsMultiline ? 'top' : 'center',
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
