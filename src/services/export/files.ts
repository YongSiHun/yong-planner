import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import type { PlannerData } from '../../features/planner/types';
import { today } from '../../utils/date';
import { monthTxt, monthCsv } from './index';
import { createBackup, MAX_BACKUP_BYTES, parseBackup } from '../backup';
import { createHolidayService } from '../holiday';

export type ExportFormat = 'txt' | 'csv' | 'clipboard';

const fileTypes: Record<string, string> = {
  'application/json': 'public.json',
  'text/csv': 'public.comma-separated-values-text',
};

export async function shareFile(name: string, content: string, mimeType: string): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    throw new Error('이 기기에서 파일 공유를 사용할 수 없습니다.');
  }

  const file = new File(Paths.cache, name);

  file.create({ overwrite: true });
  file.write(content);

  await Sharing.shareAsync(file.uri, { mimeType, UTI: fileTypes[mimeType] ?? 'public.plain-text' });
}

// 공유: 저장 시점은 호출자가 결정.
export async function exportMonth(
  data: PlannerData,
  month: string,
  format: ExportFormat,
): Promise<void> {
  const holidays = createHolidayService(data.holidayOverrides);
  const isCsv = format === 'csv';
  const content = isCsv ? monthCsv(data, month, holidays) : monthTxt(data, month, holidays);
  const isClipboard = format === 'clipboard';

  if (isClipboard) {
    await Clipboard.setStringAsync(content);

    return;
  }

  const filename = 'yong_planner_' + month.slice(0, 7).replace('-', '_') + '.' + format;

  await shareFile(filename, content, isCsv ? 'text/csv' : 'text/plain');
}

export async function backupFile(data: PlannerData): Promise<void> {
  const filename = 'yong_planner_backup_' + today().replace(/-/g, '') + '.json';

  await shareFile(filename, createBackup(data), 'application/json');
}

export async function chooseBackup(): Promise<PlannerData | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', 'application/octet-stream'],
    copyToCacheDirectory: true,
  });
  const isCancelled = result.canceled;

  if (isCancelled) {
    return null;
  }

  const asset = result.assets[0]!;
  const exceedsSizeLimit = (asset.size ?? 0) > MAX_BACKUP_BYTES;

  if (exceedsSizeLimit) {
    throw new Error('백업 파일은 50MB 이하여야 합니다.');
  }

  return parseBackup(await new File(asset.uri).text());
}
