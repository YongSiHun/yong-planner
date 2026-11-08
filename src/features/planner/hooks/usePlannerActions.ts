import {
  copyDailyNote,
  copyDailyNotes,
  saveDailyTimes,
  saveDailyContents,
  setDailyImportant,
  setDailyAlarms,
  deleteDailyNotes,
  deleteRecurring,
  flushPlanner,
  initializePlanner,
  moveDailyNote,
  removeHolidayOverride,
  saveDailyNote,
  saveDailyTime,
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
  saveDailyContents,
  setDailyImportant,
  setDailyAlarms,
  saveDailyNote,
  saveDailyTime,
  copyDailyNote,
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
