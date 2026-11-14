import { fitsUtf8Limit } from '../../utils/utf8';
import type { PlannerData } from '../../features/planner/types';
import { backupMonth, monthData, type PlannerBackup } from './month';
import { ensureValid, readRecord, readTimestamp, validateData } from './validation';
export { mergeMonthBackup, type PlannerBackup } from './month';

export { validateData } from './validation';

export const MAX_BACKUP_BYTES = 50 * 1024 * 1024;

export function parseBackup(json: string): PlannerBackup {
  const hasValidSize = fitsUtf8Limit(json, MAX_BACKUP_BYTES);

  ensureValid(hasValidSize, '백업 파일은 50MB 이하여야 합니다.');

  const root = readRecord(JSON.parse(json));
  const isSupportedVersion =
    [1, 2, 3, 4, 5, 6].includes(Number(root.version)) && typeof root.version === 'number';

  ensureValid(isSupportedVersion, '지원하지 않는 백업 버전입니다.');
  readTimestamp(root.exportedAt);

  const data = validateData(root);
  const isMonthly = root.version === 5;

  ensureValid(isMonthly || root.month === undefined, '지원하지 않는 월별 백업 형식입니다.');

  return backupContent(root, data, isMonthly);
}

function backupContent(
  root: Record<string, unknown>,
  data: PlannerData,
  isMonthly: boolean,
): PlannerBackup {
  const notes = root.version === 6 && root.kind === 'notes';

  if (notes) {
    return { ...data, kind: 'notes' };
  }

  return isMonthly ? monthData(data, backupMonth(root.month)) : data;
}

export function createBackup(data: PlannerData, month?: string): string {
  const validated = validateData(data);
  const content = month === undefined ? validated : monthData(validated, month);
  const backup = {
    version: month === undefined ? 6 : 5,
    exportedAt: new Date().toISOString(),
    ...content,
  };

  return JSON.stringify(backup, null, 2);
}
