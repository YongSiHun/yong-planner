import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';
import type { PlannerData } from '../../features/planner/types';
import { monthLabel, today } from '../../utils/date';
import { createBackup, MAX_BACKUP_BYTES, parseBackup, type PlannerBackup } from '../backup';
import { createHolidayService } from '../holiday';
import { monthCsv, monthTxt } from './index';

export type ExportFormat = keyof typeof monthExporters;
type MonthExporter = (
  data: PlannerData,
  month: string,
  holidays: ReturnType<typeof createHolidayService>,
) => Promise<unknown>;

const monthExporters = {
  json: async (data, month) =>
    shareFile(monthFilename(month, 'json'), createBackup(data, month), 'application/json'),
  txt: async (data, month, holidays) =>
    shareFile(monthFilename(month, 'txt'), monthTxt(data, month, holidays), 'text/plain'),
  csv: async (data, month, holidays) =>
    shareFile(monthFilename(month, 'csv'), monthCsv(data, month, holidays), 'text/csv'),
  clipboard: async (data, month, holidays) =>
    Clipboard.setStringAsync(monthTxt(data, month, holidays)),
  share: async (data, month, holidays) =>
    Share.share({ title: monthLabel(month) + ' 일정', message: monthTxt(data, month, holidays) }),
} satisfies Record<string, MonthExporter>;

function monthFilename(month: string, extension: string): string {
  return 'yongplanner-' + month.slice(0, 7) + '.' + extension;
}

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

// 공유 전 저장: 호출자 담당.
export async function exportMonth(
  data: PlannerData,
  month: string,
  format: ExportFormat,
): Promise<void> {
  const holidays = createHolidayService(data.holidayOverrides);

  await monthExporters[format](data, month, holidays);
}

export async function backupFile(data: PlannerData): Promise<void> {
  const filename = 'yongplanner-' + today().slice(0, 7) + '.json';

  await shareFile(filename, createBackup(data), 'application/json');
}

export async function chooseBackup(): Promise<PlannerBackup | null> {
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
