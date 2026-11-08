import { emptySelection, useNoteSelectionStore } from '../../../stores/noteSelection';
import { persistData, restoreData } from '../../../database/repositories/persist';
import { loadData } from '../../../database/repositories/planner';
import { validateData } from '../../../services/backup';
import { usePlanner } from '../../../stores/planner';
import { type PlannerData } from '../types';
import { WriteQueue } from './WriteQueue';

const queue = new WriteQueue();

let timer: ReturnType<typeof setTimeout> | undefined;

let initializing: Promise<void> | undefined;

export const initializePlanner = () => {
  const isReady = usePlanner.getState().ready;

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
      usePlanner.setState({ data, ready: true, error: null });
    })
    .catch((error: unknown) => {
      usePlanner.setState({ error: String(error) });
      throw error;
    })
    .finally(() => {
      initializing = undefined;
    });

  return initializing;
};

export const updatePlanner = (change: (data: PlannerData) => PlannerData, immediate = false) => {
  const state = usePlanner.getState();
  const isUnavailable = !state.ready || state.restoring;

  if (isUnavailable) {
    return;
  }
  const data = change(state.data);
  const isUnchanged = data === state.data;

  if (isUnchanged) {
    return;
  }

  usePlanner.setState({ data, dirty: true, revision: usePlanner.getState().revision + 1 });
  clearTimeout(timer);
  if (immediate) {
    void flushPlanner().catch(() => {});

    return;
  }

  timer = setTimeout(() => {
    void flushPlanner().catch(() => {});
  }, 500);
};

export const flushPlanner = async () => {
  clearTimeout(timer);
  await queue.enqueue(async () => {
    const hasPendingChanges = usePlanner.getState().dirty;

    if (!hasPendingChanges) {
      return;
    }
    usePlanner.setState({ saving: true });
    try {
      // 날짜 이동 전 추가 입력까지 커밋.
      while (usePlanner.getState().dirty) {
        const snapshot = usePlanner.getState();

        await persistData(snapshot.data);
        usePlanner.setState({
          dirty: usePlanner.getState().revision !== snapshot.revision,
          error: null,
        });
      }
    } catch (error) {
      usePlanner.setState({
        error: '저장하지 못했습니다. 입력은 유지되어 있습니다. 다시 저장해 주세요.',
      });
      throw error;
    } finally {
      usePlanner.setState({ saving: false });
    }
  });
};

export const restorePlanner = async (input: unknown) => {
  const data = validateData(input);
  const isRestoring = usePlanner.getState().restoring;

  if (isRestoring) {
    throw new Error('이미 복원 중입니다.');
  }
  usePlanner.setState({ restoring: true });
  try {
    await flushPlanner();
    await queue.enqueue(async () => {
      await restoreData(data);
      usePlanner.setState({
        data,
        dirty: false,
        error: null,
        revision: usePlanner.getState().revision + 1,
      });
      useNoteSelectionStore.setState(emptySelection());
    });
  } finally {
    usePlanner.setState({ restoring: false });
  }
};
