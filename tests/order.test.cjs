require('./register.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { defaultSort, reconcileOrder } = require('../src/features/planner/services/order.ts');
function previousOrder(entries, custom) {
  const base = defaultSort(entries);
  const byId = new Map(base.map((entry) => [entry.id, entry]));
  const ids = [...new Set(custom)].filter((id) => byId.has(id));
  base.forEach((entry, index) => {
    if (ids.includes(entry.id)) return;
    const previous = base
      .slice(0, index)
      .reverse()
      .find((candidate) => ids.includes(candidate.id));
    ids.splice(previous ? ids.indexOf(previous.id) + 1 : 0, 0, entry.id);
  });
  return ids.map((id) => byId.get(id));
}
test('single-pass reconciliation retains prior ordering across duplicates, missing IDs and inserted schedules', () => {
  const entries = Array.from({ length: 40 }, (_, index) => ({
    id: 'daily:' + index,
    sourceId: String(index),
    kind: 'daily',
    content: '일정 ' + index,
    time: null,
    sortKey: String(index).padStart(3, '0'),
  }));
  for (let shift = 0; shift < 40; shift++) {
    const custom = entries
      .filter((_, index) => (index + shift) % 3 !== 0)
      .map((entry) => entry.id)
      .reverse();
    custom.push('deleted', custom[0]);
    assert.deepEqual(reconcileOrder(entries, custom), previousOrder(entries, custom));
  }
});
