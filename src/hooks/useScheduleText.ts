import { useCallback } from 'react';
import { showToast } from '../components/ui';
import { scheduleLengthError } from '../services/schedule';

export function useScheduleText(onChange: (value: string) => void) {
  return useCallback(
    (value: string) => {
      const error = scheduleLengthError(value);

      if (error) {
        showToast(error);

        return;
      }
      onChange(value);
    },
    [onChange],
  );
}
