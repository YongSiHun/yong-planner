import type { Theme } from '../../../components/ui/palette';
import { design } from '../../../components/ui/tokens';

export function dayDatePressableStyle(
  copyTarget: boolean,
  theme: Theme,

  disabled: boolean,
) {
  return {
    width: 56,
    minHeight: design.touchTarget,
    paddingTop: 9,
    paddingRight: 6,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'flex-start',
    borderRadius: 6,
    backgroundColor: copyTarget ? theme.accent : 'transparent',
    opacity: copyDateOpacity(disabled),
  } as const;
}

export function dayDateTextStyle(
  color: string,

  isToday: boolean,
) {
  return {
    color,
    fontSize: design.type.date,
    fontFamily: dateFont(isToday),
    fontVariant: ['tabular-nums'] as const,
    textAlign: 'right',
    width: 26,
  } as const;
}

export function dayDateTextStyle2(color: string) {
  return {
    color,
    fontFamily: design.font.regular,
    fontSize: design.type.caption,
    paddingTop: 1,
  } as const;
}

export function dateDotViewStyle(theme: Theme) {
  return {
    position: 'absolute',
    top: 3,
    left: 20,
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.accent,
  } as const;
}

function copyDateOpacity(disabled: boolean) {
  return disabled ? 0.5 : 1;
}

function dateFont(isToday: boolean) {
  return isToday ? design.font.bold : design.font.medium;
}
