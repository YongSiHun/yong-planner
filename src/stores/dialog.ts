import { create } from 'zustand';

export interface DialogAction {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?(): void;
}
export interface DialogRequest {
  title: string;
  message: string;
  actions: DialogAction[];
}

export const useDialogStore = create<{ request: DialogRequest | null }>(() => ({ request: null }));
