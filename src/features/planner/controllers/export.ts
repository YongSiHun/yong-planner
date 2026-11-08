import { exportMonth, type ExportFormat } from '../../../services/export/files';
import { usePlanner } from '../../../stores/planner';
import { flushPlanner } from './planner';

export async function exportPlannerMonth(month: string, format: ExportFormat): Promise<void> {
  await flushPlanner();
  await exportMonth(usePlanner.getState().data, month, format);
}
