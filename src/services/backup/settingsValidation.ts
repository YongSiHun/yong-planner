import type { HolidayOverride, Settings } from '../../features/planner/types';
import { readRecord, readDate, readTitle, ensureValid } from './readers';

export function readOverride(value: unknown): HolidayOverride {
  const override = readRecord(value);
  const isRemoved = override.name === null;

  return { date: readDate(override.date), name: isRemoved ? null : readTitle(override.name) };
}

export function readSettings(value: unknown): Settings {
  const settings = readRecord(value);
  const theme = settings.theme;
  const isTheme = theme === 'system' || theme === 'light' || theme === 'dark';

  ensureValid(isTheme, '테마가 올바르지 않습니다.');

  const timeFormat = readTimeFormat(settings.timeFormat);

  return timeFormat === undefined ? { theme } : { theme, timeFormat };
}

function readTimeFormat(value: unknown): Settings['timeFormat'] {
  const validFormat = value === undefined || value === '12h' || value === '24h';

  ensureValid(validFormat, '시간 표시 형식이 올바르지 않습니다.');

  return value;
}
