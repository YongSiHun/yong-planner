import { useDeferredValue, useMemo, useState } from 'react';
import { usePlanner } from '../../../stores/planner';
import { groupSearchResults, searchPlans } from '../services/search';
import { useHolidays } from './useHolidays';

export function usePlannerSearch() {
  const [query, setQuery] = useState('');
  const searchQuery = useDeferredValue(query);
  const data = usePlanner((state) => state.data);
  const holidays = useHolidays();
  const results = useMemo(
    () => searchPlans(data, searchQuery, holidays),
    [data, searchQuery, holidays],
  );
  const sections = useMemo(() => groupSearchResults(results), [results]);

  return {
    query,
    setQuery,
    sections,
    searching: query !== searchQuery,
    hasQuery: searchQuery.trim().length > 0,
  };
}
