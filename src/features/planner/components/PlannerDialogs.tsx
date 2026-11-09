import type { ExportFormat } from '../../../services/export/files';
import type { TimeFormat } from '../types';
import { timeOverwriteMessage } from '../services/time';
import type { NoteSelectionModel, PlannerGuideModel } from '../types/presentation';
import { DeleteSchedules } from './DeleteSchedules';
import { MonthPicker } from './MonthPicker';
import { PlannerGuide } from './PlannerGuide';
import { PlannerMenu, type PlannerMenuType } from './PlannerMenu';
import { TimePicker } from './TimePicker';

export function PlannerDialogs({
  guide,
  selection,
  timeFormat,
  monthPickerOpen,
  month,
  menu,
  onCloseMonth,
  onChooseMonth,
  onCloseMenu,
  onShowExport,
  onExport,
}: {
  guide: PlannerGuideModel;
  selection: NoteSelectionModel;
  timeFormat: TimeFormat;
  monthPickerOpen: boolean;
  month: string;
  menu: PlannerMenuType | null;
  onCloseMonth(): void;
  onChooseMonth(date: string): void;
  onCloseMenu(): void;
  onShowExport(): void;
  onExport(format: ExportFormat): void;
}) {
  return (
    <>
      <SelectionDialogs selection={selection} timeFormat={timeFormat} />
      {monthPickerOpen ? (
        <MonthPicker month={month} onClose={onCloseMonth} onChoose={onChooseMonth} />
      ) : null}
      {guide.guideOpen ? (
        <PlannerGuide
          onClose={guide.closeGuide}
          dontShowAgain={guide.dontShowAgain}
          onDontShowAgainChange={guide.setDontShowAgain}
        />
      ) : null}
      {menu ? (
        <PlannerMenu
          type={menu}
          month={month}
          onClose={onCloseMenu}
          onShowExport={onShowExport}
          onExport={onExport}
        />
      ) : null}
    </>
  );
}

function SelectionDialogs({
  selection,
  timeFormat,
}: {
  selection: NoteSelectionModel;
  timeFormat: TimeFormat;
}) {
  return (
    <>
      <SelectedTimePicker selection={selection} timeFormat={timeFormat} />
      {selection.deleteCount > 0 ? (
        <DeleteSchedules
          count={selection.deleteCount}
          onCancel={selection.cancelDelete}
          onConfirm={selection.deleteSelected}
        />
      ) : null}
    </>
  );
}

function SelectedTimePicker({
  selection,
  timeFormat,
}: {
  selection: NoteSelectionModel;
  timeFormat: TimeFormat;
}) {
  const item = selection.timeSource;
  const hasItem = item !== undefined;

  if (!hasItem) {
    return null;
  }

  return (
    <TimePicker
      item={item}
      items={selection.selectedItems}
      title={selection.alarmSetting ? '알람 설정' : '시간 설정'}
      count={selection.selected.size}
      hasExistingTime={
        selection.alarmSetting ? selection.hasSelectedAlarm : selection.hasSelectedTime
      }
      clearTitle={selection.alarmSetting ? '알람 지우기' : '시간 지우기'}
      overwriteMessage={timeOverwriteMessage(
        selection.alarmSetting,
        selection.selectedItems,
        selection.hasSelectedAlarm,
      )}
      format={timeFormat}
      onClose={selection.closeTime}
      onSave={selection.saveTime}
    />
  );
}
