import { backupFile, chooseBackup } from '../../../services/export/files';
import { mergeMonthBackup, type PlannerBackup } from '../../../services/backup';
import { usePlanner } from '../../../stores/planner';
import { flushPlanner, restorePlanner } from '../../planner/controllers/planner';

export async function backupPlanner(): Promise<void> {
  await flushPlanner();
  await backupFile(usePlanner.getState().data);
}

export const choosePlannerBackup = chooseBackup;
export async function restorePlannerBackup(backup: PlannerBackup): Promise<void> {
  const data =
    backup.month === undefined ? backup : mergeMonthBackup(usePlanner.getState().data, backup);

  await restorePlanner(data);
}
