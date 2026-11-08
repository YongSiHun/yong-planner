import { fontFaces } from './typography';

// 공통 UI 토큰; 색상은 light/dark 테마.
export const design = {
  space: { xs: 4, sm: 8, md: 12, lg: 16 },
  font: fontFaces,
  type: { caption: 12, small: 13, action: 14, date: 15, body: 15, title: 18, display: 24 },
  lineHeight: 22,
  radius: { small: 6, medium: 10, dialog: 20, pill: 24 },
  touchTarget: 44,
  rowMinHeight: 38,
} as const;
