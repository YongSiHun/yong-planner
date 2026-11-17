import type { StyleProp, TextStyle } from 'react-native';
import type { Theme } from './palette';
import { lineHeightForSize } from './tokens';

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
