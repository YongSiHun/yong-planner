const { assert, test } = require('../support/test.cjs');
const { prepareIosDevice } = require('../../scripts/ios-device.cjs');
const phone = { name: 'iPhone 17', udid: 'PHONE-UDID', state: 'Shutdown', isAvailable: true };
const tablet = { name: 'iPad', udid: 'TABLET-UDID', state: 'Booted', isAvailable: true };

function harness({
  devices = [phone],
  preferred,
  failedCommand,
  failure = new Error('simctl failed'),
} = {}) {
  const calls = [];
  const recorded = [];
  const options = {
    platform: 'darwin',
    env: { DEVELOPER_DIR: '/Applications/Xcode.app/Contents/Developer' },
    record: (message) => recorded.push(message),
    log() {},
    query: async (command, args, settings) => {
      calls.push({ command, args, settings });
      if (args.includes(failedCommand)) throw failure;
      let stdout = '';
      if (args.includes('list'))
        stdout = JSON.stringify({
          devices: {
            'com.apple.CoreSimulator.SimRuntime.iOS-26-0': devices,
            'com.apple.CoreSimulator.SimRuntime.tvOS-26-0': [
              { name: 'Apple TV', udid: 'TV', isAvailable: true, state: 'Booted' },
            ],
          },
        });
      if (command === 'defaults') {
        if (!preferred) throw new Error('No default simulator saved');
        stdout = preferred;
      }
      if (args.includes('bootstatus')) stdout = 'Boot completed';
      return { stdout, stderr: '' };
    },
  };
  return { options, calls, recorded };
}

test('default launch waits for boot services and passes a specific UDID to Expo', async () => {
  const h = harness();
  const args = await prepareIosDevice(['--configuration', 'Release', '--no-bundler'], h.options);
  assert.deepEqual(args, ['--configuration', 'Release', '--no-bundler', '--device', phone.udid]);
  const boot = h.calls.find((call) => call.args.includes('bootstatus'));
  assert.deepEqual(boot.args, ['simctl', 'bootstatus', phone.udid, '-b']);
  assert.equal(boot.settings.timeout, 300000);
  assert.equal(boot.settings.env, h.options.env);
  assert.deepEqual(h.calls.at(-1).args, [
    '-a',
    'Simulator',
    '--args',
    '-CurrentDeviceUDID',
    phone.udid,
  ]);
  assert.ok(h.recorded.includes('Boot completed'));
  assert.ok(!h.calls.some((call) => call.args.includes('erase') || call.args.includes('shutdown')));
});

test('an already booted iOS simulator is reused and still checked for readiness', async () => {
  const h = harness({ devices: [phone, tablet] });
  assert.deepEqual(await prepareIosDevice([], h.options), ['--device', tablet.udid]);
  assert.ok(!h.calls.some((call) => call.command === 'defaults'));
  assert.equal(h.calls.filter((call) => call.args.includes('bootstatus')).length, 1);
});

test('remembered simulator is preferred when no simulator is booted', async () => {
  const h = harness({ devices: [phone, { ...tablet, state: 'Shutdown' }], preferred: tablet.udid });
  assert.deepEqual(await prepareIosDevice([], h.options), ['--device', tablet.udid]);
});

test('an unavailable remembered simulator is ignored', async () => {
  const h = harness({
    devices: [phone, { ...tablet, isAvailable: false }],
    preferred: tablet.udid,
  });
  assert.deepEqual(await prepareIosDevice([], h.options), ['--device', phone.udid]);
});

test('explicit names, UDIDs and device flag forms select the intended simulator', async () => {
  for (const selection of [
    ['--device', 'iphone 17'],
    ['-d', 'phone-udid'],
    ['--device=iPhone 17'],
  ]) {
    const h = harness({ devices: [phone, tablet] });
    assert.deepEqual(await prepareIosDevice([...selection, '--binary', 'app.app'], h.options), [
      '--binary',
      'app.app',
      '--device',
      phone.udid,
    ]);
  }
});

test('physical device identifiers are delegated without booting a simulator', async () => {
  const h = harness();
  const args = ['--device', 'physical-iphone', '--configuration', 'Release'];
  assert.deepEqual(await prepareIosDevice(args, h.options), args);
  assert.equal(h.calls.length, 1);
});

test('interactive selection, generic builds and help are passed through', async () => {
  for (const args of [
    ['--device'],
    ['-d'],
    ['--device', 'generic'],
    ['--device=generic'],
    ['--help'],
  ]) {
    const h = harness();
    assert.deepEqual(await prepareIosDevice(args, h.options), args);
    assert.equal(h.calls.length, 0);
  }
});

test('empty runtime inventory fails without launching another platform simulator', async () => {
  const h = harness({ devices: [] });
  await assert.rejects(prepareIosDevice([], h.options), /사용 가능한 iOS 시뮬레이터가 없습니다/);
  assert.ok(!h.calls.some((call) => call.args.includes('bootstatus')));
});

test('boot errors and timeouts retain diagnostic output with the log path and do not retry', async () => {
  for (const failure of [
    new Error('CoreSimulator service failed'),
    Object.assign(new Error('killed'), { killed: true }),
  ]) {
    failure.stderr = 'Boot service diagnostics';
    const h = harness({ failedCommand: 'bootstatus', failure });
    await assert.rejects(prepareIosDevice([], h.options), /ios-simulator.log/);
    assert.ok(h.recorded.includes(failure.stderr));
    assert.equal(h.calls.filter((call) => call.args.includes('bootstatus')).length, 1);
    assert.ok(!h.calls.some((call) => call.command === 'open'));
  }
});

test('malformed simctl output reports the diagnostic log', async () => {
  const h = harness();
  h.options.query = async () => ({ stdout: 'simctl unavailable', stderr: '' });
  await assert.rejects(prepareIosDevice([], h.options), /ios-simulator.log/);
});

test('Windows and Linux fail before querying Xcode while help remains available', async () => {
  for (const platform of ['win32', 'linux']) {
    const h = harness();
    h.options.platform = platform;
    await assert.rejects(prepareIosDevice([], h.options), /macOS/);
    assert.deepEqual(await prepareIosDevice(['--help'], h.options), ['--help']);
    assert.equal(h.calls.length, 0);
  }
});
