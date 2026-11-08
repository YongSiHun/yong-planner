import { useMemo } from 'react';
import { createHolidayService } from '../../../services/holiday';
import { usePlanner } from '../../../stores/planner';

export function useHolidays() {
  const overrides = usePlanner((state) => state.data.holidayOverrides);

  return useMemo(() => createHolidayService(overrides), [overrides]);
}
