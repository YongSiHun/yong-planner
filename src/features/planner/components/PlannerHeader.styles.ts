import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export function icon(
  edge: 'left' | 'right' | undefined,
  theme: Theme,
  disabled: boolean,
  feedback = true,
) {
  return ({ pressed }: import('react-native').PressableStateCallbackType) =>
    ({
      width: 36,
      height: design.touchTarget,
      alignItems: headerIconAlignment(edge),
      paddingHorizontal: edge ? 6 : 0,
      justifyContent: 'center',
      borderRadius: design.radius.small,
      backgroundColor: pressed && feedback ? theme.selected : 'transparent',
      flexShrink: 0,
      opacity: disabled ? 0.35 : 1,
    }) as const;
}

export function header(theme: Theme) {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: design.space.md,
    paddingRight: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
  } as const;
}

export const navigation = {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
  minWidth: 0,
} as const;

export function monthArrow(theme: Theme) {
  return {
    fontSize: design.type.display,
    lineHeight: design.lineHeights.display,
    fontFamily: design.font.bold,
    color: theme.muted,
  } as const;
}

export const monthTrigger = {
  flex: 1,
  minWidth: 0,
  minHeight: design.touchTarget,
  justifyContent: 'center',
} as const;

export function monthTitle(theme: Theme) {
  return {
    color: theme.accent,
    fontSize: design.type.title,
    lineHeight: design.lineHeights.title,
    fontFamily: design.font.bold,
    textAlign: 'center',
    fontVariant: ['tabular-nums'] as const,
  } as const;
}

export function plannerHeaderTextStyle3(theme: Theme) {
  return {
    fontSize: design.type.display,
    lineHeight: design.lineHeights.display,
    fontFamily: design.font.bold,
    color: theme.muted,
  } as const;
}

export const menuLines = { gap: 4 } as const;

export function menuLine(theme: Theme) {
  return { width: 18, height: 2, borderRadius: 1, backgroundColor: theme.accent } as const;
}

function headerIconAlignment(edge: 'left' | 'right' | undefined) {
  const alignment = { left: 'flex-start', right: 'flex-end' } as const;

  return edge ? alignment[edge] : 'center';
}
