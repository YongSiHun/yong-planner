import type { Animated } from 'react-native';
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
