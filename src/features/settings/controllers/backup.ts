import { chooseBackup, exportFullBackup } from '../../../services/export/files';
import { mergeNotesBackup } from '../../../services/backup/notes';
import { flushPlanner } from '../../planner/controllers/persistence';
import { mergeMonthBackup, type PlannerBackup } from '../../../services/backup';
import { usePlanner } from '../../../stores/planner';
import { restorePlanner } from '../../planner/controllers/planner';

export const choosePlannerBackup = chooseBackup;
export async function restorePlannerBackup(backup: PlannerBackup): Promise<void> {
  await flushPlanner();
  const current = usePlanner.getState().data;
  const data = restoredData(current, backup);

  await restorePlanner(data);
}

function restoredData(current: PlannerBackup, backup: PlannerBackup) {
  const notes = backup.kind === 'notes';

  if (notes) {
    return mergeNotesBackup(current, backup);
  }

  return backup.month === undefined ? backup : mergeMonthBackup(current, backup);
}

export async function backupAllPlannerData(): Promise<void> {
  await flushPlanner();
  await exportFullBackup(usePlanner.getState().data);
}
