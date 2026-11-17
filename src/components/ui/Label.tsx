import type { ReactNode } from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { fontForWeight } from './typography';
import * as styles from './Label.styles';
import { useTheme } from './theme';
import { design } from './tokens';

export function Label({
  children,
  muted = false,
  style,
}: {
  children: ReactNode;
  muted?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const theme = useTheme();
  const flattened = StyleSheet.flatten(style);
  const fontFamily = flattened?.fontFamily ?? fontForWeight(flattened?.fontWeight);

  return (
    <Text
      style={styles.label(fontFamily, flattened?.fontSize ?? design.type.body, muted, theme, style)}
    >
      {children}
    </Text>
  );
}
