import type { EditorEntry } from '../services/ScheduleEditSession';
import type { ComponentRef, ReactNode, RefObject } from 'react';
import type { LayoutChangeEvent, TextInput, TextInputChangeEvent } from 'react-native';
import type { DailyPlanItem, PlanEntry, RecurringPlanException, TimeFormat } from './index';

export interface NoteSelectionModel {
  active: boolean;
  selected: ReadonlySet<string>;
  selectedItems: readonly DailyPlanItem[];
  selectedByDate: ReadonlyMap<string, ReadonlySet<string>>;
  copySource: DailyPlanItem | undefined;
  copySourceDate: string | undefined;
  hasSelectedTime: boolean;
  allImportant: boolean;
  hasSelectedAlarm: boolean;
  alarmSetting: boolean;
  toggleAlarm(): void;
  toggleImportant(): void;
  timeSource: DailyPlanItem | undefined;
  copyDates: ReadonlySet<string>;
  deleteCount: number;
  toggle(date: string, index: number, begin?: boolean): void;
  clear(): void;
  selectAll(month: string): void;
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
  noteImportant?: readonly boolean[];
  noteAlarms?: readonly boolean[];
  timeFormat: TimeFormat;
  selectedIds: ReadonlySet<string>;
  selecting: boolean;
  copying: boolean;
  copyTarget: boolean;
  copySourceDate?: string;
  onCopyDate(date: string): void;
  onSelect(date: string, index: number, begin?: boolean): void;
  onOutsidePress?(): void;
  onChipScrollLock?(locked: boolean): void;
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
  initialSlot?: number;
  noteImportant?: readonly boolean[];
  noteAlarms?: readonly boolean[];
  timeFormat?: TimeFormat;
  onBlur(): void;
  onInputFocus(input: ComponentRef<typeof TextInput> | null): void;
  onInputLayout(): void;
}

export interface SchedulePreviewProps {
  note: string;
  noteTimes?: readonly (string | null)[];
  noteImportant?: readonly boolean[];
  noteAlarms?: readonly boolean[];
  timeFormat?: TimeFormat;
  date: string;
  onEdit(index?: number): void;
  onArm?(index: number): void;
  onOutsidePress?(): void;
  onChipLayout?(index: number, event: LayoutChangeEvent): void;
  draggingIndex?: number | null;
  overlay?: ReactNode;
  onInsert?(boundary: number): void;
  selecting?: boolean;
  selectedIndexes?: ReadonlySet<number>;
  onSelect?(index: number, begin?: boolean): void;
}

export type PlannerMenuType = 'menu' | 'export';

export interface ScheduleTextFieldProps {
  date: string;
  inputRef: RefObject<ComponentRef<typeof TextInput> | null>;
  initialValue: string;
  nativeValue?: string;
  onChange(event: TextInputChangeEvent): void;
  onBlur(): void;
  onFocus(input: ComponentRef<typeof TextInput> | null): void;
  onLayout(event: LayoutChangeEvent): void;
}

export interface ScheduleInputChipProps {
  entry: EditorEntry;
  timeFormat?: TimeFormat;
  onActivate(key: number, mode: 'edit' | 'before' | 'after'): void;
  onRecord(key: number, event: LayoutChangeEvent): void;
}
