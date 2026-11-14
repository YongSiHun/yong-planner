import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export const overlay = { flex: 1 } as const;
export const backdrop = { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 } as const;
export const item = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: design.space.md,
  minHeight: design.touchTarget,
  paddingHorizontal: design.space.lg,
  paddingVertical: design.space.sm,
} as const;
export function menu(theme: Theme, top: number, right: number) {
  return {
    position: 'absolute',
    top,
    right,
    minWidth: 160,
    paddingVertical: design.space.xs,
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: design.radius.medium,
    elevation: 6,
    boxShadow: `0px 4px 16px ${theme.scrim}`,
  } as const;
}
export function deleteText(theme: Theme) {
  return {
    color: theme.red,
    fontFamily: design.font.medium,
    fontSize: design.type.action,
    lineHeight: design.lineHeights.action,
  } as const;
}
