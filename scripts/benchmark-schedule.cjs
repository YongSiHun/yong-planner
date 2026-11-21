const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
require('../tests/support/register.cjs');
const { ScheduleEditSession } = require('../src/features/planner/services/ScheduleEditSession.ts');
const { scheduleLengthError } = require('../src/services/schedule.ts');
const edits = 200;
const rounds = 7;
const texts = Array.from({ length: edits }, (_, index) => '한글 입력 '.repeat((index % 20) + 1));
const median = (values) => values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
function measure(create) {
  return median(
    Array.from({ length: rounds }, () => {
      const run = create();
      const start = performance.now();
      run();
      return performance.now() - start;
    }),
  );
}
const results = [10, 1000, 10000].map((count) => {
  const original = Array.from({ length: count }, (_, index) => '일정 ' + index);
  const active = Math.floor(count / 2);
  const before = measure(() => {
    let parts = original;
    return () =>
      texts.forEach((text) => {
        parts = [...parts.slice(0, active), text, ...parts.slice(active + 1)];
        assert.equal(
          parts
            .join(',')
            .split(',')
            .some((part) => Array.from(part).length > 255),
          false,
        );
        parts.join(',');
      });
  });
  const after = measure(() => {
    const model = new ScheduleEditSession({ note: original.join(','), initialIndex: active });
    const snapshot = model.view();
    return () => {
      texts.forEach((text, index) => model.change(text, index + 1, 0));
      assert.equal(model.view(), snapshot);
    };
  });
  return {
    schedules: count,
    events: edits,
    previousMs: +before.toFixed(3),
    currentMs: +after.toFixed(3),
  };
});
console.table(results);
const oversized = '가'.repeat(1_000_000);
assert.ok(scheduleLengthError(oversized));
console.log(
  'Synthetic JS median of ' +
    rounds +
    ' rounds; construction excluded. Native frame rate is not measured.',
);
