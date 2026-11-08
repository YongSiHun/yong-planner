require('./register.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { emptyData } = require('../src/features/planner/types/index.ts');
const {
  plansForDate,
  hasPlansForDate,
  occursOn,
} = require('../src/features/planner/services/plans.ts');
const { reconcileOrder } = require('../src/features/planner/services/order.ts');
const { monthDates, weekday } = require('../src/utils/date.ts');
const { createHolidayService } = require('../src/services/holiday/index.ts');
const { validateData } = require('../src/services/backup/validation.ts');
const dates = monthDates('2026-11-01');
const holidays = createHolidayService([{ date: '2026-11-09', name: '사용자 휴일' }]);

function fixture() {
  const data = emptyData();
  data.dailyPlanItems = dates.map((date, index) => ({
    id: 'daily-' + index,
    date,
    content: index ? '일정 ' + index : '',
    createdAt: '2026-10-01T00:00:00.000Z',
  }));
  data.recurringPlans = ['include', 'exclude', 'only'].map((holidayPolicy, index) => ({
    id: 'repeat-' + index,
    title: holidayPolicy,
    time: index === 1 ? null : '09:00',
    startDate: '2026-11-03',
    endDate: '2026-11-28',
    weekdays: [1, 2, 3, 4, 5],
    holidayPolicy,
  }));
  data.recurringPlanExceptions = [
    { recurringPlanId: 'repeat-0', date: '2026-11-09', cancelled: true },
    {
      recurringPlanId: 'repeat-1',
      date: '2026-11-10',
      cancelled: false,
      time: '08:00',
      title: '수정',
    },
    { recurringPlanId: 'repeat-0', date: '2026-11-10', cancelled: false, time: null },
  ];
  data.dailyPlanOrders = [
    { date: '2026-11-10', itemIds: ['daily:daily-9', 'recurring:repeat-1', 'recurring:repeat-0'] },
  ];
  return data;
}

// 기존 전체 검색 결과와 비교.
function referencePlans(data, date) {
  const daily = data.dailyPlanItems
    .filter((item) => item.date === date)
    .map((item) => ({
      id: 'daily:' + item.id,
      sourceId: item.id,
      kind: 'daily',
      content: item.content,
      time: null,
      sortKey: item.createdAt + ':' + item.id,
    }));
  const recurring = data.recurringPlans.flatMap((plan) => {
    const active = date >= plan.startDate && (plan.endDate === null || date <= plan.endDate);
    const holiday = holidays.isHoliday(date);
    const matches =
      plan.holidayPolicy === 'only'
        ? holiday
        : plan.weekdays.includes(weekday(date)) && !(plan.holidayPolicy === 'exclude' && holiday);
    const exception = data.recurringPlanExceptions.find(
      (item) => item.recurringPlanId === plan.id && item.date === date,
    );
    if (!active || !matches || exception?.cancelled) return [];
    const time = exception?.time !== undefined ? exception.time : plan.time;
    return [
      {
        id: 'recurring:' + plan.id,
        sourceId: plan.id,
        kind: 'recurring',
        time,
        content:
          (time ? Number(time.slice(0, 2)) + time.slice(2) + ' ' : '') +
          (exception?.title ?? plan.title),
        sortKey: plan.id,
      },
    ];
  });
  return reconcileOrder(
    [...daily, ...recurring],
    data.dailyPlanOrders.find((item) => item.date === date)?.itemIds,
  );
}

test('indexed plans preserve recurrence, exceptions, time overrides and custom order', () => {
  const data = fixture();
  for (const date of dates) {
    assert.deepEqual(plansForDate(data, date, holidays), referencePlans(data, date));
    assert.equal(hasPlansForDate(data, date, holidays), referencePlans(data, date).length > 0);
  }
});

test('indexes refresh after editing, deletion, exception changes, reordering and restore', () => {
  let data = fixture();
  plansForDate(data, dates[9], holidays);
  const changes = [
    (value) => ({
      ...value,
      dailyPlanItems: value.dailyPlanItems.map((item) => ({ ...item, content: '변경' })),
    }),
    (value) => ({ ...value, dailyPlanItems: [] }),
    (value) => ({
      ...value,
      recurringPlanExceptions: [{ recurringPlanId: 'repeat-0', date: dates[9], cancelled: true }],
    }),
    (value) => ({
      ...value,
      dailyPlanOrders: [{ date: dates[9], itemIds: ['recurring:repeat-1', 'recurring:repeat-0'] }],
    }),
    (value) => validateData(value),
    () => emptyData(),
  ];
  for (const change of changes) {
    data = change(data);
    for (const date of dates) {
      const expected = referencePlans(data, date);
      assert.deepEqual(plansForDate(data, date, holidays), expected);
      assert.equal(hasPlansForDate(data, date, holidays), expected.length > 0);
    }
  }
});

test('include policy and blank daily plans skip unnecessary holiday queries', () => {
  const unexpectedHolidayQuery = {
    isHoliday() {
      throw new Error('unexpected holiday query');
    },
  };
  const data = fixture();
  assert.equal(occursOn(data.recurringPlans[0], '2026-11-09', unexpectedHolidayQuery), true);
  assert.equal(hasPlansForDate(data, dates[0], unexpectedHolidayQuery), true);
});

test('shared base holidays keep each service override independent', () => {
  const base = createHolidayService();
  const removed = createHolidayService([{ date: '2026-01-01', name: null }]);
  const renamed = createHolidayService([{ date: '2026-01-01', name: '개인 휴일' }]);
  assert.ok(base.getHolidayName('2026-01-01'));
  assert.equal(removed.getHolidayName('2026-01-01'), null);
  assert.equal(renamed.getHolidayName('2026-01-01'), '개인 휴일');
  for (let year = 2000; year < 2018; year++) base.getHolidayName(year + '-01-01');
  assert.ok(base.getHolidayName('2026-01-01'));
  assert.equal(removed.getHolidayName('2026-01-01'), null);
});
