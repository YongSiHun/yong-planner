import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { monthTxt, monthCsv } from './index';
import { createBackup, parseBackup } from '../backup';
import { createHolidayService } from '../holiday';
import { usePlanner } from '../../stores/planner';
import { today } from '../../utils/date';
export async function shareFile(name: string, content: string, mimeType: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync()))
    throw new Error('이 기기에서 파일 공유를 사용할 수 없습니다.');
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  file.write(content);
  await Sharing.shareAsync(file.uri, {
    mimeType,
    UTI:
      mimeType === 'application/json'
        ? 'public.json'
        : mimeType === 'text/csv'
          ? 'public.comma-separated-values-text'
          : 'public.plain-text',
  });
}
export async function exportMonth(
  month: string,
  format: 'txt' | 'csv' | 'clipboard',
): Promise<void> {
  await usePlanner.getState().flush();
  const data = usePlanner.getState().data;
  const holidays = createHolidayService(data.holidayOverrides);
  const content =
    format === 'csv' ? monthCsv(data, month, holidays) : monthTxt(data, month, holidays);
  if (format === 'clipboard') {
    await Clipboard.setStringAsync(content);
    return;
  }
  await shareFile(
    'yong_planner_' + month.slice(0, 7).replace('-', '_') + '.' + format,
    content,
    format === 'csv' ? 'text/csv' : 'text/plain',
  );
}
export async function backupFile(): Promise<void> {
  await usePlanner.getState().flush();
  await shareFile(
    'yong_planner_backup_' + today().replace(/-/g, '') + '.json',
    createBackup(usePlanner.getState().data),
    'application/json',
  );
}
export async function chooseBackup() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', 'application/octet-stream'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0]!;
  if (asset.size && asset.size > 50 * 1024 * 1024)
    throw new Error('백업 파일은 50MB 이하여야 합니다.');
  return parseBackup(await new File(asset.uri).text());
}
