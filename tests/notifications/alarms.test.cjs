const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  authorizeScheduleAlarm,
  changeNotificationPreference,
  clearScheduleAlarms,
  defaultNotificationPreferences,
  emptyData,
  events,
  pending,
  presented,
  state,
  syncNotifications,
  useNotificationStore,
  usePlanner,
} = require('../support/notifications.cjs');

test('native alarm requests use canonical times and fall back when exact access is revoked', async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const { dateKey } = require('../../src/utils/date.ts');
  const data = emptyData();
  data.settings.timeFormat = '12h';
  data.dailyPlanItems = [
    {
      id: 'alarm',
      alarm: true,
      date: dateKey(tomorrow),
      content: '회의',
      time: '13:10',
      createdAt: new Date().toISOString(),
    },
  ];
  usePlanner.setState({ data });
  state.granted = true;
  state.exact = true;
  useNotificationStore.setState({
    preferences: { ...defaultNotificationPreferences, summary: false, alarms: true, exact: true },
  });
  await syncNotifications();
  let request = [...pending.values()][0];
  assert.equal(request.trigger.delivery, 'alarmClock');
  assert.equal(request.trigger.type, 'date');
  assert.equal(request.trigger.repeats, undefined);
  assert.equal(new Date(request.trigger.date).getHours(), 13);
  assert.equal(new Date(request.trigger.date).getMinutes(), 10);
  assert.equal(request.content.body, '오후 1시 10분 회의');
  assert.equal(request.content.sound, true);
  const handler = events.find((event) => event.type === 'handler').handler;
  assert.equal((await handler.handleNotification({ request })).shouldPlaySound, true);
  assert.equal(
    (await handler.handleNotification({ request: { content: { data: { kind: 'summary' } } } }))
      .shouldShowBanner,
    false,
  );
  state.exact = false;
  await syncNotifications();
  request = [...pending.values()][0];
  assert.equal(request.trigger.delivery, 'bestEffort');
  assert.equal(pending.size, 1);
});

test('chip alarm setup requests required access and denied notifications stop setup', async () => {
  state.allowPrompt = false;
  await assert.rejects(authorizeScheduleAlarm(), /알림 권한/);
  assert.equal(useNotificationStore.getState().preferences.alarms, false);
  assert.equal(
    events.some((event) => event.type === 'exact'),
    false,
  );
  state.allowPrompt = true;
  await authorizeScheduleAlarm();
  assert.equal(useNotificationStore.getState().preferences.alarms, true);
  assert.equal(useNotificationStore.getState().permission.exact, true);
  const prompts = events.filter((event) => event.type === 'permission').length;
  const exacts = events.filter((event) => event.type === 'exact').length;
  await authorizeScheduleAlarm();
  assert.equal(events.filter((event) => event.type === 'permission').length, prompts);
  assert.equal(events.filter((event) => event.type === 'exact').length, exacts);
});

test('alarm channels use the SDK default instead of resolving a custom default sound file', async () => {
  await authorizeScheduleAlarm();
  const channels = events.filter((event) => event.type === 'channel');
  const alarm = channels.find((event) => event.id.includes('-alarm-'));
  const summary = channels.find((event) => event.id.includes('-summary-'));
  assert.equal(Object.hasOwn(alarm.config, 'sound'), false);
  assert.equal(summary.config.sound, null);
});

test('clearing selected alarms cancels pending and delivered alarms while preserving times and other alarms', async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const { dateKey } = require('../../src/utils/date.ts');
  const date = dateKey(tomorrow);
  const data = emptyData();
  data.dailyPlanItems = ['a:/한글', 'b'].map((id) => ({
    id,
    date,
    content: id,
    time: '13:10',
    alarm: true,
    createdAt: new Date().toISOString(),
  }));
  usePlanner.setState({ data });
  state.granted = true;
  await syncNotifications();
  const requests = [...pending.values()];
  requests.forEach((request) => presented.set(request.identifier, request));
  const removed = requests.find((request) =>
    request.identifier.endsWith(encodeURIComponent('daily:a:/한글')),
  );
  const kept = requests.find((request) => request !== removed);
  await clearScheduleAlarms(new Set(['a:/한글']));
  assert.equal(pending.has(removed.identifier), false);
  assert.equal(presented.has(removed.identifier), false);
  assert.equal(pending.has(kept.identifier), true);
  assert.equal(presented.has(kept.identifier), true);
  assert.deepEqual(
    usePlanner.getState().data.dailyPlanItems.map((item) => item.time),
    ['13:10', '13:10'],
  );
  assert.deepEqual(
    usePlanner.getState().data.dailyPlanItems.map((item) => Boolean(item.alarm)),
    [false, true],
  );
  assert.ok(events.includes('flush-planner'));
});

test('clearing all alarms removes orphan reservations and delivered alarms while preserving summaries', async () => {
  state.granted = true;
  await changeNotificationPreference('summary', true);
  const alarm = 'yong-planner:alarm:2099-01-01:daily%3Aorphan';
  const unrelated = 'another-app:alarm';
  for (const id of [alarm, unrelated]) {
    const request = { identifier: id, content: { data: {} } };
    pending.set(id, request);
    presented.set(id, request);
  }
  const data = emptyData();
  data.dailyPlanItems = [
    { id: 'old', date: '2000-01-01', content: '지난 일정', time: '09:00', alarm: true },
  ];
  usePlanner.setState({ data });
  await clearScheduleAlarms();
  assert.equal(pending.has(alarm), false);
  assert.equal(presented.has(alarm), false);
  assert.equal(pending.has(unrelated), true);
  assert.equal(presented.has(unrelated), true);
  assert.ok([...pending.keys()].some((id) => id.startsWith('yong-planner:summary:')));
  assert.ok([...presented.keys()].some((id) => id.startsWith('yong-planner:summary:')));
  assert.equal(usePlanner.getState().data.dailyPlanItems[0].alarm, undefined);
  assert.equal(usePlanner.getState().data.dailyPlanItems[0].time, '09:00');
  await syncNotifications();
  assert.equal(pending.has(alarm), false);
});

test('past one-shot alarms are not rescheduled on the following day', async () => {
  state.granted = true;
  const data = emptyData();
  data.dailyPlanItems = [
    { id: 'past', date: '2000-01-01', content: '지난 알람', time: '09:00', alarm: true },
  ];
  usePlanner.setState({ data });
  await syncNotifications();
  await syncNotifications();
  assert.equal(pending.size, 0);
});

test('alarm deletion is blocked during restoration', async () => {
  usePlanner.setState({ restoring: true });
  await assert.rejects(clearScheduleAlarms(), /불러온 후/);
  assert.equal(events.includes('flush-planner'), false);
});

test('changing a schedule time cancels its old alarm instead of moving it to the new time', async () => {
  const { dateKey } = require('../../src/utils/date.ts');
  const { timeChangeClearsAlarm } = require('../../src/features/planner/services/alarms.ts');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const data = emptyData();
  data.dailyPlanItems = ['a', 'b'].map((id) => ({
    id,
    date: dateKey(tomorrow),
    content: id,
    time: '13:00',
    alarm: true,
  }));
  usePlanner.setState({ data });
  state.granted = true;
  await syncNotifications();
  const idFor = (id) =>
    [...pending.keys()].find((key) => key.endsWith(encodeURIComponent('daily:' + id)));
  const removed = idFor('a');
  const kept = idFor('b');
  usePlanner.setState({
    data: {
      ...data,
      dailyPlanItems: data.dailyPlanItems.map((item) =>
        item.id === 'a'
          ? {
              ...item,
              time: '14:00',
              alarm: timeChangeClearsAlarm(item, '14:00') ? undefined : item.alarm,
            }
          : item,
      ),
    },
  });
  await syncNotifications();
  assert.equal(pending.has(removed), false);
  assert.equal(pending.has(kept), true);
  assert.equal(pending.size, 1);
});

test('canceling the permission modal does not request or save an alarm', async () => {
  state.acceptPermission = false;
  await assert.rejects(authorizeScheduleAlarm(), /저장하지/);
  assert.equal(state.storedPreferences, null);
  assert.equal(useNotificationStore.getState().preferences.alarms, false);
  assert.equal(
    events.some((event) => event.type === 'permission'),
    false,
  );
});

test('denied exact alarm permission prevents saving alarm preferences and permits retry', async () => {
  state.granted = true;
  state.allowExact = false;
  const preferences = useNotificationStore.getState().preferences;
  await assert.rejects(authorizeScheduleAlarm(), /정확한 알람 권한/);
  assert.equal(useNotificationStore.getState().preferences, preferences);
  assert.equal(state.storedPreferences, null);
  assert.equal(useNotificationStore.getState().busy, false);
  state.allowExact = true;
  await authorizeScheduleAlarm();
  assert.equal(useNotificationStore.getState().preferences.alarms, true);
  assert.equal(useNotificationStore.getState().preferences.exact, true);
});
