import type { Memo } from '../../planner/types';

export interface MemoAccess {
  busy: boolean;
  disabled: boolean;
}
export interface MemoEditorModel extends MemoAccess {
  editing: Memo | null | undefined;
  title: string;
  content: string;
  validationError: string | null;
  lengthError: string | null;
  limitNotice: string | null;
  editorMenuOpen: boolean;
  open(memo: Memo | null): void;
  closeEditor(): void;
  save(): Promise<void>;
  setTitle(value: string): void;
  setContent(value: string): void;
  openEditorMenu(): void;
  closeEditorMenu(): void;
  requestEditorDelete(): void;
}
export interface MemoSelectionModel extends MemoAccess {
  selecting: boolean;
  selected: ReadonlySet<string>;
  cancelSelection(): void;
  toggleSelection(id: string): void;
  requestDelete(): void;
}
export interface MemoState extends MemoEditorModel, MemoSelectionModel {
  memos: Memo[];
  error: string | null;
  trashOpen: boolean;
  listMenuOpen: boolean;
  openTrash(): void;
  closeTrash(): void;
  openListMenu(): void;
  closeListMenu(): void;
  restore(): Promise<void>;
}

export interface MemoOperation {
  disabled: boolean;
  isRunning(): boolean;
  run(action: () => Promise<void>): Promise<void>;
}

export interface MemoListModel extends MemoSelectionModel {
  memos: Memo[];
  trashOpen: boolean;
  open(memo: Memo | null): void;
  restore(): Promise<void>;
}
export type MemoRowModel = Pick<
  MemoListModel,
  'selected' | 'selecting' | 'disabled' | 'toggleSelection' | 'open'
>;
