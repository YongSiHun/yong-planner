const assert = require('node:assert/strict');
const { test } = require('node:test');
const { renderGuide, state } = require('../support/planner.cjs');

test('closing without opting out shows the guide on the next launch', async () => {
  renderGuide();
  await Promise.resolve();
  let guide = renderGuide();
  assert.equal(guide.guideOpen, true);
  guide.closeGuide();
  assert.equal(state.preferences['planner.guide.v1.hidden'], '0');
  state.slots = [];
  renderGuide();
  await Promise.resolve();
  guide = renderGuide();
  assert.equal(guide.guideOpen, true);
});

test('opting out hides the launch guide and the header can still reopen it', async () => {
  renderGuide();
  await Promise.resolve();
  let guide = renderGuide();
  guide.setDontShowAgain(true);
  guide = renderGuide();
  guide.closeGuide();
  state.slots = [];
  renderGuide();
  await Promise.resolve();
  guide = renderGuide();
  assert.equal(guide.guideOpen, false);
  guide.openGuide();
  guide = renderGuide();
  assert.equal(guide.guideOpen, true);
  guide.setDontShowAgain(false);
  guide = renderGuide();
  guide.closeGuide();
  assert.equal(state.preferences['planner.guide.v1.hidden'], '0');
});
