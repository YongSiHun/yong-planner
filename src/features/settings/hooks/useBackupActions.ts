import { backupPlanner, choosePlannerBackup, restorePlannerBackup } from '../controllers/backup';

const actions = {
  backup: backupPlanner,
  choose: choosePlannerBackup,
  restore: restorePlannerBackup,
};

export function useBackupActions() {
  return actions;
}
