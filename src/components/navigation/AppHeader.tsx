import Feather from '@expo/vector-icons/Feather';
import type { NativeStackHeaderProps } from 'expo-router/native-stack';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { design, useTheme } from '../ui';
import { HeaderBar } from './HeaderBar';
import * as styles from './AppHeader.styles';

export function AppHeader({ back, options, navigation, route }: NativeStackHeaderProps) {
  const theme = useTheme();
  const title = options.title ?? route.name;
  const props = { tintColor: theme.accent, canGoBack: Boolean(back) };
  const left = options.headerLeft ? (
    options.headerLeft(props)
  ) : (
    <BackButton visible={Boolean(back)} onPress={() => navigation.goBack()} />
  );
  const heading =
    typeof options.headerTitle === 'function' ? (
      options.headerTitle({ children: title, tintColor: theme.accent })
    ) : (
      <Text numberOfLines={1} accessibilityRole="header" style={styles.title(theme)}>
        {title}
      </Text>
    );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea(theme)}>
      <HeaderBar>
        {left}
        <View style={styles.heading}>{heading}</View>
        <View style={styles.actions}>{options.headerRight?.(props)}</View>
      </HeaderBar>
    </SafeAreaView>
  );
}

function BackButton({ visible, onPress }: { visible: boolean; onPress(): void }) {
  const theme = useTheme();

  if (!visible) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="뒤로"
      onPress={onPress}
      style={styles.back}
    >
      <Feather name="chevron-left" size={design.icon.header} color={theme.accent} />
    </Pressable>
  );
}
