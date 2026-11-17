import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';
import { heading as sectionHeading } from '../../../components/ui/settings.styles';

export const page = { flex: 1 } as const;

export const empty = {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  gap: design.space.md,
  padding: design.layout.pagePadding,
} as const;

export const emptyTitle = { ...sectionHeading, marginTop: design.space.sm } as const;

export const listContent = {
  flexGrow: 1,
  paddingHorizontal: 0,
  paddingBottom: design.floatingActionSize + design.layout.pagePadding * 2,
} as const;

export const listFooter = { flexGrow: 1 } as const;

export const blankSpace = { flex: 1, minHeight: design.touchTarget } as const;

export function selectionBar(theme: Theme) {
  return {
    backgroundColor: theme.bg,
    borderTopWidth: 1,
    borderTopColor: theme.line,
    paddingHorizontal: design.space.sm,
    paddingTop: design.space.xs,
    paddingBottom: design.space.xs,
  } as const;
}

export function deleteAction(disabled: boolean) {
  return {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: design.touchTarget,
    paddingVertical: design.space.sm,
    gap: design.space.xs,
    opacity: disabled ? 0.4 : 1,
  } as const;
}

export function floatingAction(theme: Theme, disabled: boolean) {
  return {
    position: 'absolute',
    right: design.layout.pagePadding,
    bottom: design.layout.pagePadding,
    width: design.floatingActionSize,
    height: design.floatingActionSize,
    borderRadius: design.radius.dialog,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.accent,
    opacity: disabled ? 0.35 : 1,
    elevation: 4,
  } as const;
}
