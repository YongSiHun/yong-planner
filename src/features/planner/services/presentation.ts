import { weekday } from '../../../utils/date';

interface DateColors {
  red: string;
  blue: string;
}

export function getDateColor(
  date: string,
  isHoliday: boolean,
  colors: DateColors,
  defaultColor: string,
): string {
  const day = weekday(date);
  const isRedDate = isHoliday || day === 0;

  if (isRedDate) {
    return colors.red;
  }

  const isSaturday = day === 6;

  if (isSaturday) {
    return colors.blue;
  }

  return defaultColor;
}
