import { useEffect, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useTheme } from './index';
import * as styles from './Toggle.styles';

export function Toggle({
  value,
  disabled = false,
  accessibilityLabel,
  onValueChange,
}: {
  value: boolean;
  disabled?: boolean;
  accessibilityLabel: string;
  onValueChange(value: boolean): void;
}) {
  const theme = useTheme();
  const [position] = useState(() => new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    const animation = Animated.timing(position, {
      toValue: value ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [position, value]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={styles.control(disabled)}
    >
      <View pointerEvents="none" style={styles.track(theme, value)}>
        <Animated.View style={styles.thumb(position, theme)} />
      </View>
    </Pressable>
  );
}
