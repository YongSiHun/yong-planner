import {
  copyDailyNotes,
  saveDailyTimes,
  setDailyImportant,
  setDailyAlarms,
  deleteDailyNotes,
  deleteRecurring,
  flushPlanner,
  initializePlanner,
  moveDailyNote,
  removeHolidayOverride,
  saveDailyNote,
  stageDailyNote,
  commitPlannerChanges,
  finishDailyNote,
  saveException,
  saveHolidayOverride,
  saveRecurring,
  setTheme,
  setTimeFormat,
} from '../controllers/planner';

// 모듈 명령: 참조 고정·구독 및 렌더 시 래퍼 생성 없음.
const actions = {
  initialize: initializePlanner,
  flush: flushPlanner,
  copyDailyNotes,
  saveDailyTimes,
  setDailyImportant,
  setDailyAlarms,
  saveDailyNote,
  stageDailyNote,
  commitPlannerChanges,
  finishDailyNote,
  deleteDailyNotes,
  saveRecurring,
  deleteRecurring,
  saveException,
  moveDailyNote,
  setTheme,
  setTimeFormat,
  saveHolidayOverride,
  removeHolidayOverride,
};

export function usePlannerActions() {
  return actions;
}
