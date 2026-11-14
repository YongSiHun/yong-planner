import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export const page = { flex: 1 } as const;
export const content = { padding: design.space.md, gap: design.space.md } as const;
export const toolbar = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
} as const;
export const grid = { flexDirection: 'row', flexWrap: 'wrap', gap: 12 } as const;
export const editor = { minHeight: 180 } as const;
export const actions = { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 } as const;
export const timestamp = { fontSize: 12 } as const;
export function card(theme: Theme, wide: boolean) {
  return {
    width: wide ? '31%' : '47%',
    minHeight: 150,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: design.radius.small,
    backgroundColor: theme.selected,
    justifyContent: 'space-between',
  } as const;
}
export function screen(theme: Theme) {
  return { flex: 1, backgroundColor: theme.bg } as const;
}
export function text(theme: Theme) {
  return {
    color: theme.text,
    fontFamily: design.font.regular,
    fontSize: design.type.body,
    lineHeight: design.lineHeight,
  } as const;
}
