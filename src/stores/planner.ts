import { create } from 'zustand';
import { emptyData, type PlannerData } from '../features/planner/types';

export interface PlannerState {
  data: PlannerData;
  ready: boolean;
  saving: boolean;
  dirty: boolean;
  restoring: boolean;
  error: string | null;
  revision: number;
}

// Store: 데이터·setState 전담.
export const usePlanner = create<PlannerState>(() => ({
  data: emptyData(),
  ready: false,
  saving: false,
  dirty: false,
  restoring: false,
  error: null,
  revision: 0,
}));
