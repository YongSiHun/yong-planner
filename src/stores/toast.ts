import { create } from 'zustand';

export const useToastStore = create<{ message: string; revision: number }>(() => ({
  message: '',
  revision: 0,
}));
