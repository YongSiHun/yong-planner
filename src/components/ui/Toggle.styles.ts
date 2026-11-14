import type { Animated } from 'react-native';
import type { Theme } from './palette';
import { design } from './tokens';

export function control(disabled: boolean) {
  return {
    width: 48,
    minHeight: design.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    opacity: disabled ? 0.4 : 1,
  } as const;
}

export function track(theme: Theme, enabled: boolean) {
  return {
    width: 48,
    height: 28,
    padding: 3,
    borderWidth: 1,
    borderRadius: design.radius.pill,
    borderColor: enabled ? theme.accent : theme.line,
    backgroundColor: enabled ? theme.accent : theme.surface,
  } as const;
}

export function thumb(position: Animated.Value, theme: Theme) {
  return {
    width: 20,
    height: 20,
    borderRadius: design.radius.pill,
    backgroundColor: theme.toggleThumb,
    transform: [{ translateX: position.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }],
  } as const;
}
