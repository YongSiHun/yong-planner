import { fontFaces } from './typography';

// 공통 UI 토큰; 색상은 light/dark 테마.
export const design = {
  space: { xs: 4, sm: 8, md: 12, lg: 16 },
  font: fontFaces,
  type: { caption: 12, small: 13, action: 16, date: 15, body: 15, title: 18, display: 24 },
  lineHeight: 22,
  lineHeights: { caption: 18, small: 20, action: 22, body: 22, title: 26, display: 32 },
  radius: { small: 6, medium: 10, dialog: 20, pill: 24 },
  layout: {
    contentMaxWidth: 480,
    dialogMaxWidth: 360,
    menuMaxWidth: 248,
    pagePadding: 16,
    pageGap: 24,
    bottomSpace: 32,
    pickerHeight: 380,
    previewRows: 4,
  },
  icon: { header: 20 },
  controlHeight: 48,
  touchTarget: 44,
  rowMinHeight: 38,
} as const;

export function lineHeightForSize(size: number): number {
  const heights: Record<number, number> = {
    [design.type.caption]: design.lineHeights.caption,
    [design.type.small]: design.lineHeights.small,
    [design.type.action]: design.lineHeights.action,
    [design.type.body]: design.lineHeights.body,
    [design.type.title]: design.lineHeights.title,
    [design.type.display]: design.lineHeights.display,
  };

  return heights[size] ?? design.lineHeights.body;
}
