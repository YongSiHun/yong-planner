import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';
export { action } from '../../../components/ui/Dialog.styles';

export function guideStepViewStyle(theme: Theme) {
  return {
    padding: design.space.lg,
    gap: design.space.sm,
    borderRadius: design.radius.medium,
    backgroundColor: theme.selected,
  } as const;
}

export const guideStepLabelStyle = {
  fontSize: design.type.action,
  lineHeight: design.lineHeights.action,
  fontFamily: design.font.bold,
} as const;

export const plannerGuideLabelStyle = { fontSize: design.type.small } as const;

export const splitExampleScrollViewContentContainerStyle = {
  alignItems: 'center',
  gap: 6,
  paddingVertical: 2,
} as const;

export function splitExampleTextStyle(theme: Theme) {
  return {
    fontFamily: design.font.regular,
    fontSize: design.type.small,
    lineHeight: design.lineHeights.small,
    color: theme.muted,
  } as const;
}

export function splitExampleTextStyle2(theme: Theme) {
  return {
    fontFamily: design.font.regular,
    fontSize: design.type.small,
    lineHeight: design.lineHeights.small,
    color: theme.text,
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: design.radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 5,
  } as const;
}

export const guideFooterViewStyle = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: design.space.xs,
} as const;

export const guideFooterPressableStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: design.space.sm,
  minHeight: design.touchTarget,
} as const;

export const guideContent = {
  gap: design.space.sm,
  paddingBottom: design.space.sm,
} as const;

export const dontShowAgainLabel = {
  fontSize: design.type.small,
  lineHeight: design.lineHeights.small,
} as const;
