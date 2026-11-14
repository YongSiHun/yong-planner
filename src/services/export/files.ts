import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { PlannerData } from '../../features/planner/types';
import { createBackup, MAX_BACKUP_BYTES, parseBackup, type PlannerBackup } from '../backup';
import { createHolidayService } from '../holiday';
import { monthCsv, monthTxt } from './index';
import { zipJson, unzipJson } from '../backup/zip';

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
} satisfies Record<string, MonthExporter>;

function monthFilename(month: string, extension: string): string {
  return 'yongplanner-' + month.slice(0, 7) + '.' + extension;
}

const fileTypes: Record<string, string> = {
  'application/json': 'public.json',
  'application/zip': 'public.zip-archive',
  'text/csv': 'public.comma-separated-values-text',
};

export async function shareFile(
  name: string,
  content: string | Uint8Array,
  mimeType: string,
): Promise<void> {
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

export async function chooseBackup(): Promise<PlannerBackup | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      'application/json',
      'application/zip',
      'application/x-zip-compressed',
      'text/plain',
      'application/octet-stream',
    ],
    copyToCacheDirectory: true,
  });
  const isCancelled = result.canceled;

  if (isCancelled) {
    return null;
  }

  const asset = result.assets[0]!;
  const file = new File(asset.uri);
  const zipped = asset.name.toLowerCase().endsWith('.zip');
  const limit = zipped ? MAX_BACKUP_BYTES + 1024 * 1024 : MAX_BACKUP_BYTES;
  const exceedsSizeLimit = file.size > limit;

  if (exceedsSizeLimit) {
    throw new Error('백업 파일은 50MB 이하여야 합니다.');
  }

  if (zipped) {
    return readFullZip(file);
  }

  return parseBackup(await file.text());
}

export async function exportFullBackup(data: PlannerData): Promise<void> {
  // Sparse months stay sparse; recurring rules remain intact, including open-ended rules.
  const months = [...new Set(data.dailyPlanItems.map((item) => item.date.slice(0, 7)))].sort();
  const json = JSON.stringify({ ...JSON.parse(createBackup(data)), months });

  await shareFile('yongplanner-backup.zip', zipJson(json), 'application/zip');
}

async function readFullZip(file: File): Promise<PlannerBackup> {
  const backup = parseBackup(unzipJson(await file.bytes()));
  const entire = backup.month === undefined && backup.kind !== 'notes';

  if (!entire) {
    throw new Error('전체 백업 ZIP 파일을 선택해 주세요.');
  }

  return { ...backup, kind: 'full' };
}
