import { layout as layoutStyles } from '../../../components/ui/layout.styles';
import type { Theme } from '../../../components/ui/palette';

export const weekdayHeadingViewStyle = {
  width: '14.2857%',
  alignItems: 'center',
  paddingVertical: 8,
} as const;

export function weekdayHeadingLabelStyle(color: string) {
  return { color } as const;
}

export const calendarDateViewStyle = { width: '14.2857%', padding: 1 } as const;

export function calendarDateButtonStyle(isToday: boolean, theme: Theme) {
  return {
    paddingHorizontal: 0,
    minWidth: 0,
    paddingBottom: 14,
    borderWidth: isToday ? 1 : 0,
    borderColor: theme.accent,
  } as const;
}

export function calendarDateViewStyle2(theme: Theme) {
  return {
    position: 'absolute',
    bottom: 7,
    alignSelf: 'center',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.accent,
  } as const;
}

export const calendarCellViewStyle = { width: '14.2857%' } as const;

export const calendarViewStyle = [
  layoutStyles.row,
  { justifyContent: 'space-between' } as const,
] as const;

export const calendarViewStyle2 = { flexDirection: 'row' } as const;

export const calendarViewStyle3 = { flexDirection: 'row', flexWrap: 'wrap' } as const;
