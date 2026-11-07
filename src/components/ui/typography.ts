import type { TextStyle } from 'react-native';

export const fontFaces = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
} as const;

const weightFaces: Record<string, string> = {
  normal: fontFaces.regular,
  bold: fontFaces.bold,
  '400': fontFaces.regular,
  '500': fontFaces.medium,
  '600': fontFaces.semibold,
  '700': fontFaces.bold,
  '800': fontFaces.bold,
  '900': fontFaces.bold,
};

export function fontForWeight(weight?: TextStyle['fontWeight']): string {
  return weightFaces[String(weight ?? '400')] ?? fontFaces.regular;
}
