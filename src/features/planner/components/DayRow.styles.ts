import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export function screenPressableStyle(theme: Theme, isToday: boolean) {
  return {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: design.space.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.line,
    backgroundColor: isToday ? theme.selected : 'transparent',
  } as const;
}

export const screenViewStyle = { flex: 1, minWidth: 0, paddingVertical: 2 } as const;

export const screenViewStyle2 = {
  flexDirection: 'row',
  alignItems: 'center',
  flexWrap: 'wrap',
} as const;

export function screenTextStyle(theme: Theme) {
  return {
    fontFamily: design.font.regular,
    fontSize: design.type.caption,
    lineHeight: design.lineHeights.caption,
    color: theme.muted,
  } as const;
}
