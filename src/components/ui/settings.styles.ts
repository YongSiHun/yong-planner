import { layout } from './layout.styles';
import type { Theme } from './palette';
import { design } from './tokens';

export const content = {
  ...layout.pageContent,
  paddingTop: design.space.xs,
  gap: 0,
} as const;

export const section = { ...layout.section, gap: design.space.sm } as const;
export const headingRow = layout.row;
export const row = { ...layout.row, minHeight: design.touchTarget } as const;
export const footer = { ...row, marginTop: design.space.lg } as const;

export function divider(theme: Theme) {
  return {
    width: '100%',
    height: 1,
    backgroundColor: theme.line,
    marginTop: design.space.sm,
    marginBottom: design.space.sm,
  } as const;
}

export const heading = {
  fontFamily: design.font.bold,
  fontSize: design.type.title,
  lineHeight: design.lineHeights.title,
} as const;
export const button = {
  minHeight: design.touchTarget,
  paddingHorizontal: design.space.md,
  paddingVertical: design.space.sm,
  borderRadius: design.radius.medium,
} as const;
export const option = { ...button, flex: 1 } as const;

export function filledButton(theme: Theme) {
  return { ...button, backgroundColor: theme.selected } as const;
}

export const buttonLabelSize = design.type.action;
