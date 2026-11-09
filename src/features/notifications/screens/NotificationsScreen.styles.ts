import { layout } from '../../../components/ui/layout.styles';
import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export function screen(theme: Theme) {
  return [layout.page, { backgroundColor: theme.bg } as const] as const;
}
export const content = layout.pageContent;
export const row = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: design.space.md,
  minHeight: design.controlHeight,
} as const;
export const title = {
  flex: 1,
  minWidth: 0,
  fontFamily: design.font.medium,
  fontSize: design.type.body,
  lineHeight: design.lineHeights.body,
} as const;
export const heading = { fontFamily: design.font.bold, fontSize: design.type.body } as const;
export const error = layout.section;
export const textAction = layout.textAction;
export const note = { fontSize: design.type.small } as const;
export function track(theme: Theme) {
  return { false: theme.line, true: theme.accent };
}
export function divider(theme: Theme) {
  return { height: 1, backgroundColor: theme.line, width: '100%' } as const;
}
export function errorLabel(theme: Theme) {
  return { color: theme.red, fontSize: design.type.action } as const;
}
