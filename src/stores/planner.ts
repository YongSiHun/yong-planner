import { create } from 'zustand';
import { randomUUID } from 'expo-crypto';
import {
  emptyData,
  type PlannerData,
  type RecurringPlan,
  type RecurringPlanException,
} from '../features/planner/types';
import { loadData } from '../database/repositories/planner';
import { persistData, restoreData } from '../database/repositories/persist';
import { WriteQueue } from './writeQueue';
import { mergeOrderIds } from '../features/planner/services/order';
import { validateData } from '../services/backup';

interface State {
  data: PlannerData;
  ready: boolean;
  saving: boolean;
  dirty: boolean;
  restoring: boolean;
  error: string | null;
  revision: number;
  initialize(): Promise<void>;
  update(change: (data: PlannerData) => PlannerData, immediate?: boolean): void;
  flush(): Promise<void>;
  restore(data: PlannerData): Promise<void>;
}
const queue = new WriteQueue();
let timer: ReturnType<typeof setTimeout> | undefined;
let initializing: Promise<void> | undefined;

export const usePlanner = create<State>((set, get) => ({
  data: emptyData(),
  ready: false,
  saving: false,
  dirty: false,
  restoring: false,
  error: null,
  revision: 0,
  initialize: () => {
    const isReady = get().ready;

    if (isReady) {
      return Promise.resolve();
    }

    const pendingInitialization = initializing;
    const isInitializing = pendingInitialization !== undefined;

    if (isInitializing) {
      return pendingInitialization;
    }

    initializing = loadData()
      .then((data) => {
        set({ data, ready: true, error: null });
      })
      .catch((error: unknown) => {
        set({ error: String(error) });
        throw error;
      })
      .finally(() => {
        initializing = undefined;
      });

    return initializing;
  },
  update: (change, immediate = false) => {
    const state = get();
    const isUnavailable = !state.ready || state.restoring;

    if (isUnavailable) {
      return;
    }
    const data = change(get().data);

    set({ data, dirty: true, revision: get().revision + 1 });
    clearTimeout(timer);
    if (immediate) {
      void get()
        .flush()
        .catch(() => {});

      return;
    }

    timer = setTimeout(() => {
      void get()
        .flush()
        .catch(() => {});
    }, 500);
  },
  flush: async () => {
    clearTimeout(timer);
    await queue.enqueue(async () => {
      const hasPendingChanges = get().dirty;

      if (!hasPendingChanges) {
        return;
      }
      set({ saving: true });
      try {
        // 저장: 진행 중 추가된 입력까지 커밋한 뒤 날짜 이동 허용.
        while (get().dirty) {
          const snapshot = get();

          await persistData(snapshot.data);
          set({ dirty: get().revision !== snapshot.revision, error: null });
        }
      } catch (error) {
        set({ error: '저장하지 못했습니다. 입력은 유지되어 있습니다. 다시 저장해 주세요.' });
        throw error;
      } finally {
        set({ saving: false });
      }
    });
  },
  restore: async (input) => {
    const data = validateData(input);
    const isRestoring = get().restoring;

    if (isRestoring) {
      throw new Error('이미 복원 중입니다.');
    }
    set({ restoring: true });
    try {
      await get().flush();
      await queue.enqueue(async () => {
        await restoreData(data);
        set({ data, dirty: false, error: null, revision: get().revision + 1 });
      });
    } finally {
      set({ restoring: false });
    }
  },
}));

let lastCreated = 0;

export function addDaily(date: string): string {
  const id = randomUUID();
  const stored = usePlanner
    .getState()
    .data.dailyPlanItems.reduce((latest, item) => Math.max(latest, Date.parse(item.createdAt)), 0);

  lastCreated = Math.max(Date.now(), lastCreated + 1, stored + 1);
  usePlanner.getState().update(
    (data) => ({
      ...data,
      dailyPlanItems: [
        ...data.dailyPlanItems,
        {
          id,
          date,
          content: '',
          createdAt: new Date(lastCreated).toISOString(),
        },
      ],
    }),
    true,
  );

  return id;
}
export function editDaily(id: string, content: string): void {
  usePlanner.getState().update((data) => ({
    ...data,
    dailyPlanItems: data.dailyPlanItems.map((item) =>
      item.id === id ? { ...item, content } : item,
    ),
  }));
}
export function deleteDaily(id: string): void {
  usePlanner.getState().update(
    (data) => ({
      ...data,
      dailyPlanItems: data.dailyPlanItems.filter((item) => item.id !== id),
    }),
    true,
  );
}
export function saveOrder(date: string, itemIds: string[] | null): void {
  usePlanner.getState().update(
    (data) => ({
      ...data,
      dailyPlanOrders: [
        ...data.dailyPlanOrders.filter((order) => order.date !== date),
        ...(itemIds
          ? [
              {
                date,
                itemIds: mergeOrderIds(
                  data.dailyPlanOrders.find((order) => order.date === date)?.itemIds ?? [],
                  itemIds,
                ),
              },
            ]
          : []),
      ],
    }),
    true,
  );
}
export function saveRecurring(plan: RecurringPlan): void {
  usePlanner.getState().update(
    (data) =>
      validateData({
        ...data,
        recurringPlans: [...data.recurringPlans.filter((item) => item.id !== plan.id), plan],
      }),
    true,
  );
}
export function deleteRecurring(id: string): void {
  usePlanner.getState().update(
    (data) => ({
      ...data,
      recurringPlans: data.recurringPlans.filter((plan) => plan.id !== id),
      recurringPlanExceptions: data.recurringPlanExceptions.filter(
        (item) => item.recurringPlanId !== id,
      ),
    }),
    true,
  );
}
export function saveException(
  id: string,
  date: string,
  value: RecurringPlanException | null,
): void {
  usePlanner.getState().update(
    (data) =>
      validateData({
        ...data,
        recurringPlanExceptions: [
          ...data.recurringPlanExceptions.filter(
            (item) => !(item.recurringPlanId === id && item.date === date),
          ),
          ...(value ? [value] : []),
        ],
      }),
    true,
  );
}
