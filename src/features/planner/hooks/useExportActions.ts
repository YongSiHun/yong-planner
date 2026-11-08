import { exportPlannerMonth } from '../controllers/export';

const actions = { exportMonth: exportPlannerMonth };

export function useExportActions() {
  return actions;
}
