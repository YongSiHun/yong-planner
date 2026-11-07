import { fontFaces } from './typography';

// 화면 밀도·글자 크기·모서리의 공통 기준. 색상은 light/dark 테마를 따른다.
export const design = {
  space: { xs: 4, sm: 8, md: 12, lg: 16 },
  font: fontFaces,
  type: { caption: 11, small: 13, body: 15, title: 18 },
  lineHeight: 22,
  radius: { small: 6, medium: 10, pill: 24 },
  touchTarget: 44,
  rowMinHeight: 38,
} as const;
