import { useMemo } from 'react';
import { usePlanner } from '../../../stores/planner';
import { createHolidayService } from '../../../services/holiday';

export function useHolidays() {
  const overrides = usePlanner((state) => state.data.holidayOverrides);

  return useMemo(() => createHolidayService(overrides), [overrides]);
}
