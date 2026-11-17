require('./register.cjs');
const { emptyData } = require('../../src/features/planner/types/index.ts');
const { applyDailyNote } = require('../../src/features/planner/services/note.ts');
const holidays = { isHoliday: () => false, getHolidayName: () => null };
const now = new Date(2026, 10, 8, 8, 0);

function seed() {
  let id = 0;

  const data = applyDailyNote(emptyData(), '2026-11-08', '09:10 회의,밥먹기,07:30 지난 일정', () =>
    String(++id),
  );
  data.dailyPlanItems[0].alarm = true;
  return data;
}

module.exports = { holidays, now, seed };
