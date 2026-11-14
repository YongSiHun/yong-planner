import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useTheme } from '../ui';
import * as styles from './AppHeader.styles';

export function HeaderBar({ children }: { children: ReactNode }) {
  const theme = useTheme();

  return (
    <View style={styles.surface(theme)}>
      <View style={styles.bar}>{children}</View>
    </View>
  );
}
