import type { Theme } from '../ui/palette';
import { design } from '../ui/tokens';

export const HEADER_HEIGHT = 44;
export const bar = {
  minHeight: HEADER_HEIGHT,
  width: '100%',
  maxWidth: design.layout.contentMaxWidth,
  alignSelf: 'center',
  flexDirection: 'row',
  alignItems: 'center',
  paddingLeft: design.space.md,
} as const;
export const heading = { flex: 1, minWidth: 0, justifyContent: 'center' } as const;
export const actions = { flexDirection: 'row', alignItems: 'center', minWidth: 36 } as const;
export const back = {
  width: 36,
  height: 44,
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingLeft: 6,
} as const;
export function safeArea(theme: Theme) {
  return { backgroundColor: theme.bg } as const;
}
export function surface(theme: Theme) {
  return {
    backgroundColor: theme.bg,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
  } as const;
}
export function title(theme: Theme) {
  return {
    color: theme.accent,
    fontFamily: design.font.bold,
    fontSize: design.type.title,
    lineHeight: design.lineHeights.title,
  } as const;
}
