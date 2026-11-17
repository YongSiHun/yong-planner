import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export const rowContent = { flex: 1, gap: design.space.xs } as const;

export const timestamp = {
  fontFamily: design.font.regular,
  fontSize: design.type.caption,
  lineHeight: design.lineHeights.caption,
  marginTop: 0,
} as const;

export function memoRow(theme: Theme, selected: boolean) {
  return ({ pressed }: import('react-native').PressableStateCallbackType) =>
    ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: design.space.md,
      paddingVertical: design.space.sm,
      paddingHorizontal: design.layout.pagePadding,
      borderBottomWidth: 1,
      borderBottomColor: theme.line,
      backgroundColor: selected || pressed ? theme.selected : theme.bg,
    }) as const;
}

export function memoTitle(theme: Theme) {
  return {
    color: theme.text,
    fontFamily: design.font.medium,
    fontSize: design.type.action,
    lineHeight: design.lineHeights.action,
  } as const;
}

export function preview(theme: Theme) {
  return {
    color: theme.muted,
    fontFamily: design.font.regular,
    fontSize: design.type.body,
    lineHeight: design.lineHeights.body,
  } as const;
}

export function selectionMark(theme: Theme, selected: boolean) {
  return {
    width: 24,
    height: 24,
    borderRadius: design.radius.small,
    borderWidth: 1.5,
    borderColor: selected ? theme.accent : theme.muted,
    backgroundColor: selected ? theme.accent : theme.bg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  } as const;
}
