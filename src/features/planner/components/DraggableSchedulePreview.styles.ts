import type { Animated } from 'react-native';
import type { Theme } from '../../../components/ui/palette';
import type { ChipBounds } from '../services/dragGeometry';

export function overlay(
  box: ChipBounds,
  transform: ReturnType<Animated.ValueXY['getTranslateTransform']>,
) {
  return {
    position: 'absolute',
    left: box.x,
    top: box.y,
    width: box.width,
    transform,
    zIndex: 10,
    elevation: 8,
  } as const;
}

export function marker(
  theme: Theme,
  height: Animated.Value,
  transform: ReturnType<Animated.ValueXY['getTranslateTransform']>,
) {
  return {
    position: 'absolute',
    left: -1.5,
    top: 0,
    width: 3,
    height,
    borderRadius: 2,
    backgroundColor: theme.accent,
    transform,
    zIndex: 20,
    elevation: 9,
  } as const;
}
