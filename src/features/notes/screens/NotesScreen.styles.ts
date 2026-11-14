import { title as headerTitle } from '../../../components/navigation/AppHeader.styles';
import { heading as sectionHeading } from '../../../components/ui/settings.styles';
import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export const page = { flex: 1 } as const;
export const rowContent = { flex: 1, gap: design.space.xs } as const;
export const timestamp = {
  fontFamily: design.font.regular,
  fontSize: design.type.caption,
  lineHeight: design.lineHeights.caption,
  marginTop: 0,
} as const;
export const notice = { padding: design.layout.pagePadding } as const;
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
  paddingBottom: design.space.sm,
} as const;
export function screen(theme: Theme) {
  return { flex: 1, backgroundColor: theme.bg } as const;
}

export function headerAction(disabled = false, textAction = false, trailing = false) {
  return {
    minWidth: 36,
    paddingHorizontal: textAction ? design.space.md : 0,
    marginRight: trailing ? design.space.sm : 0,
    flexShrink: 0,
    minHeight: design.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.35 : 1,
  } as const;
}
export function actionText(theme: Theme) {
  return {
    color: theme.accent,
    fontFamily: design.font.medium,
    fontSize: design.type.action,
    lineHeight: design.lineHeights.action,
  } as const;
}
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
export function titleInput(theme: Theme) {
  return {
    ...headerTitle(theme),
    width: '100%',
    minHeight: design.touchTarget,
    paddingVertical: 0,
    paddingHorizontal: design.space.xs,
  } as const;
}
export function editor(theme: Theme) {
  return {
    flex: 1,
    padding: design.layout.pagePadding,
    color: theme.text,
    fontFamily: design.font.regular,
    fontSize: design.type.body,
    lineHeight: design.lineHeights.body,
  } as const;
}

export function validation(theme: Theme, error: boolean) {
  return {
    paddingHorizontal: design.layout.pagePadding,
    paddingVertical: design.space.sm,
    fontSize: design.type.small,
    fontFamily: design.font.regular,
    lineHeight: design.lineHeights.small,
    color: error ? theme.red : theme.muted,
  } as const;
}

export const listFooter = { flexGrow: 1 } as const;
export const blankSpace = { flex: 1, minHeight: design.touchTarget } as const;
export const headingTarget = {
  paddingLeft: design.space.xs,
  paddingRight: design.space.sm,
  flex: 1,
  minHeight: design.touchTarget,
  justifyContent: 'center',
} as const;
export const heading = headerTitle;
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
