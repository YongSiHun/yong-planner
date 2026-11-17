import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';
import { title as headerTitle } from '../../../components/navigation/AppHeader.styles';

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

export function titleInput(theme: Theme) {
  return {
    ...headerTitle(theme),
    width: '100%',
    minHeight: design.touchTarget,
    paddingVertical: 0,
    paddingHorizontal: design.space.xs,
  } as const;
}

export const headingTarget = {
  paddingLeft: design.space.xs,
  paddingRight: design.space.sm,
  flex: 1,
  minHeight: design.touchTarget,
  justifyContent: 'center',
} as const;

export const heading = headerTitle;
