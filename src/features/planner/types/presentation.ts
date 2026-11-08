import type { ComponentRef, ReactNode } from 'react';
import type { LayoutChangeEvent, TextInput } from 'react-native';
import type { DailyPlanItem, PlanEntry, RecurringPlanException, TimeFormat } from './index';

export interface NoteSelectionModel {
  active: boolean;
  selected: ReadonlySet<string>;
  copySource: DailyPlanItem | undefined;
  timeSource: DailyPlanItem | undefined;
  copyDates: ReadonlySet<string>;
  deleteCount: number;
  toggle(date: string, index: number, begin?: boolean): void;
  clear(): void;
  editSelected(): void;
  deleteSelected(): void;
  requestDelete(): void;
  cancelDelete(): void;
  copySelected(): void;
  openCopy(): void;
  closeCopy(): void;
  toggleCopyDate(date: string): void;
  saveTime(time: string | null): void;
  openTime(): void;
  closeTime(): void;
}

export interface PlannerGuideModel {
  guideOpen: boolean;
  dontShowAgain: boolean;
  closeGuide(): void;
  openGuide(): void;
  setDontShowAgain(value: boolean): void;
}

export interface DayRowProps {
  date: string;
  note: string;
  noteIds: string[];
  noteTimes: (string | null)[];
  timeFormat: TimeFormat;
  selectedIds: ReadonlySet<string>;
  selecting: boolean;
  copying: boolean;
  copyTarget: boolean;
  copySourceDate?: string;
  onCopyDate(date: string): void;
  editingIndex?: number;
  onSelect(date: string, index: number, begin?: boolean): void;
  recurring: PlanEntry[];
  exceptions: RecurringPlanException[];
  holidayName: string | null;
  isToday: boolean;
  isEditing: boolean;
  onEdit(date: string): void;
  onFinish(date: string): void;
  onMeasure(date: string, position: number, height: number): void;
  onInputFocus(input: ComponentRef<typeof TextInput> | null): void;
  onInputLayout(): void;
}

export interface ScheduleInputProps {
  date: string;
  note: string;
  initialIndex?: number;
  noteTimes?: readonly (string | null)[];
  timeFormat?: TimeFormat;
  initialSlot?: number;
  onSelect?(index: number, begin?: boolean): void;
  onBlur(): void;
  onEditPart(index: number): void;
  onInputFocus(input: ComponentRef<typeof TextInput> | null): void;
  onInputLayout(): void;
}

export interface SchedulePreviewProps {
  note: string;
  noteTimes?: readonly (string | null)[];
  timeFormat?: TimeFormat;
  date: string;
  onEdit(index?: number): void;
  onArm?(index: number): void;
  onChipLayout?(index: number, event: LayoutChangeEvent): void;
  draggingIndex?: number | null;
  overlay?: ReactNode;
  onInsert?(boundary: number): void;
  selecting?: boolean;
  selectedIndexes?: ReadonlySet<number>;
  onSelect?(index: number, begin?: boolean): void;
}
