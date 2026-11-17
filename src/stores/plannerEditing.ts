import { create } from 'zustand';

export const usePlannerEditing = create<{ date: string | null }>(() => ({ date: null }));
