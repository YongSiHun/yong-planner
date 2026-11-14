require('../support/register.cjs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { emptyData } = require('../../src/features/planner/types/index.ts');
const {
  searchPlans,
  groupSearchResults,
} = require('../../src/features/planner/services/search.ts');
const { createHolidayService } = require('../../src/services/holiday/index.ts');
const holidays = createHolidayService([]);
const daily = (id, date, content) => ({ id, date, content, createdAt: '2026-01-01T00:00:00Z' });

function fixture() {
  const data = emptyData();
  data.dailyPlanItems = [
    daily('past', '2020-01-04', 'Project 오래된 회의'),
    daily('now', '2026-11-04', 'Project 회의'),
    daily('next', '2026-12-04', 'Project 다음 달'),
    daily('future', '2035-09-12', 'Project 미래 계획'),
    daily('other', '2026-12-04', '운동'),
  ];
  data.recurringPlans = [
    {
      id: 'repeat',
      title: 'Project 정기회의',
      time: '09:00',
      startDate: '2026-11-02',
      endDate: null,
      weekdays: [1],
      holidayPolicy: 'include',
    },
  ];
  data.recurringPlanExceptions = [
    { recurringPlanId: 'repeat', date: '2026-11-09', cancelled: true, title: '취소한 Project' },
    {
      recurringPlanId: 'repeat',
      date: '2026-11-16',
      cancelled: false,
      title: '변경한 Project 회의',
      time: '10:00',
    },
    {
      recurringPlanId: 'repeat',
      date: '2026-11-17',
      cancelled: false,
      title: '반복 요일 밖 Project',
    },
    { recurringPlanId: 'missing', date: '2026-11-16', cancelled: false, title: '없는 Project' },
  ];
  return data;
}

test('search spans every stored month and year, newest first, with no current-month argument', () => {
  const results = searchPlans(fixture(), ' PROJECT ', holidays);
  assert.deepEqual(
    results.filter((item) => item.kind === 'daily').map((item) => item.date),
    ['2035-09-12', '2026-12-04', '2026-11-04', '2020-01-04'],
  );
  assert.equal(new Set(results.map((entry) => entry.key)).size, results.length);
  assert.deepEqual(searchPlans(fixture(), '   ', holidays), []);
  assert.deepEqual(searchPlans(fixture(), '없는 검색어', holidays), []);
});

test('open-ended series remain finite and preserve their period; only visible overrides are returned', () => {
  const results = searchPlans(fixture(), 'project', holidays);
  const series = results.filter((item) => item.kind === 'recurring');
  assert.equal(series.length, 1);
  assert.equal(series[0].recurringId, 'repeat');
  assert.equal(series[0].endDate, null);
  const exceptions = results.filter((item) => item.kind === 'exception');
  assert.deepEqual(
    exceptions.map((item) => item.date),
    ['2026-11-16'],
  );
  assert.equal(exceptions[0].time, '10:00');
  assert.equal(searchPlans(fixture(), '변경한', holidays).length, 1);
});

test('results group by month without dropping same-day entries or restricting the year range', () => {
  const data = emptyData();
  data.dailyPlanItems = [
    daily('a', '0001-01-01', '검색'),
    daily('b', '9999-12-31', '검색'),
    daily('c', '9999-12-31', '검색'),
  ];
  const sections = groupSearchResults(searchPlans(data, '검색', holidays));
  assert.deepEqual(
    sections.map((section) => section.month),
    ['9999-12', '0001-01'],
  );
  assert.deepEqual(
    sections.map((section) => section.data.length),
    [2, 1],
  );
});
