import { useEffect, useState } from 'react';
import { Keyboard, Platform, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore } from '../../stores/toast';
import { useTheme } from './index';
import * as styles from './ToastHost.styles';

export function ToastHost() {
  const theme = useTheme();
  const message = useToastStore((state) => state.message);
  const revision = useToastStore((state) => state.revision);
  const [keyboardTop, setKeyboardTop] = useState(Infinity);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow',
      (event) => setKeyboardTop(event.endCoordinates.screenY),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardTop(Infinity));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => useToastStore.setState({ message: '' }), 2500);

    return () => clearTimeout(timer);
  }, [revision]);

  if (!message) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={styles.position(Math.max(insets.bottom, height - keyboardTop))}
    >
      <Text
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={styles.message(theme)}
      >
        {message}
      </Text>
    </View>
  );
}
