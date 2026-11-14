import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export const frame = {
  flex: 1,
  width: '100%',
  maxWidth: design.layout.contentMaxWidth,
  alignSelf: 'center',
} as const;
export const searchBox = { padding: design.layout.pagePadding } as const;
export const list = { flexGrow: 1, paddingBottom: 32 } as const;
export const empty = {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  padding: 24,
} as const;
export const resultContent = { flex: 1, gap: 8 } as const;
export const date = { fontSize: design.type.small } as const;
export function screen(theme: Theme) {
  return { flex: 1, backgroundColor: theme.bg } as const;
}
export function month(theme: Theme) {
  return {
    paddingHorizontal: design.layout.pagePadding,
    paddingVertical: 10,
    backgroundColor: theme.surface,
    color: theme.accent,
    fontFamily: design.font.medium,
    lineHeight: design.lineHeights.small,
    fontSize: design.type.small,
  } as const;
}
export function result(theme: Theme) {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: design.layout.pagePadding,
    paddingVertical: design.space.lg,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
  } as const;
}
export function content(theme: Theme) {
  return {
    color: theme.text,
    fontFamily: design.font.regular,
    fontSize: design.type.body,
    lineHeight: design.lineHeights.body,
  } as const;
}
