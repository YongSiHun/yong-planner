import type { StyleProp, TextStyle } from 'react-native';
import type { Theme } from './palette';
import { design } from './tokens';

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
