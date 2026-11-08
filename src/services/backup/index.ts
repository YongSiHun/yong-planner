import type { PlannerData } from '../../features/planner/types';
import { ensureValid, readRecord, readTimestamp, validateData } from './validation';

export { validateData } from './validation';

export const MAX_BACKUP_BYTES = 50 * 1024 * 1024;

export function parseBackup(json: string): PlannerData {
  const hasValidSize = json.length <= MAX_BACKUP_BYTES;

  ensureValid(hasValidSize, '백업 파일은 50MB 이하여야 합니다.');

  const root = readRecord(JSON.parse(json));
  const isSupportedVersion =
    [1, 2, 3, 4].includes(Number(root.version)) && typeof root.version === 'number';

  ensureValid(isSupportedVersion, '지원하지 않는 백업 버전입니다.');
  readTimestamp(root.exportedAt);

  return validateData(root);
}

export function createBackup(data: PlannerData): string {
  const backup = { version: 4, exportedAt: new Date().toISOString(), ...validateData(data) };

  return JSON.stringify(backup, null, 2);
}
