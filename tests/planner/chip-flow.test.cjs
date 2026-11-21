const { assert, test } = require('../support/test.cjs');
const { hooks, SchedulePreview } = require('../support/planner.cjs');
const render = () => {
  hooks.beginRender();
  return SchedulePreview({ note: '여러 줄\n긴 일정,운동,식사', date: '2026-11-21', onEdit() {} });
};

test('a multiline chip never forces other chips into a single column', () => {
  let tree = render();
  assert.equal(tree.props.style.flexDirection, 'row');
  assert.equal(tree.props.style.flexWrap, 'wrap');
  const writes = hooks.getStateWrites();
  tree.props.children[0][0].props.onLayout({
    nativeEvent: { layout: { x: 0, y: 4, width: 120, height: 100 } },
  });
  tree = render();
  assert.equal(tree.props.style.flexDirection, 'row');
  assert.equal(tree.props.style.flexWrap, 'wrap');
  assert.equal(hooks.getStateWrites(), writes);
});
