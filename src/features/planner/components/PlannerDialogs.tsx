import { TimePicker } from './TimePicker';
import type { useNoteSelection } from '../hooks/useNoteSelection';
import type { TimeFormat } from '../types';
import type { usePlannerGuide } from '../hooks/usePlannerGuide';
import type { ExportFormat } from '../../../services/export/files';
import { PlannerGuide } from './PlannerGuide';
import { PlannerMenu, type PlannerMenuType } from './PlannerMenu';
import { MonthPicker } from './MonthPicker';

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
  guide: ReturnType<typeof usePlannerGuide>;
  selection: ReturnType<typeof useNoteSelection>;
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
      {selection.timeSource ? (
        <TimePicker
          item={selection.timeSource}
          format={timeFormat}
          onClose={selection.closeTime}
          onSave={selection.saveTime}
        />
      ) : null}
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
