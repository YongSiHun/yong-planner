require('../support/register.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { usePlannerEditing } = require('../../src/stores/plannerEditing.ts');
const {
  editPlannerDate,
  finishPlannerDate,
  closePlannerEditor,
} = require('../../src/features/planner/controllers/editing.ts');

test('editing only invalidates the previous and next date selectors, and delayed blur cannot close another editor', () => {
  const dates = ['2026-11-01', '2026-11-02', '2026-11-03'];
  const changed = [];
  const stop = usePlannerEditing.subscribe((next, previous) => {
    changed.push(dates.filter((date) => (next.date === date) !== (previous.date === date)));
  });
  editPlannerDate(dates[0]);
  editPlannerDate(dates[1]);
  finishPlannerDate(dates[0]);
  assert.equal(usePlannerEditing.getState().date, dates[1]);
  editPlannerDate(dates[1]);
  finishPlannerDate(dates[1]);
  assert.deepEqual(changed, [[dates[0]], [dates[0], dates[1]], [], [dates[1]]]);
  closePlannerEditor();
  stop();
});
