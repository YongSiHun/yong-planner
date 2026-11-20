const { assert, test } = require('../support/test.cjs');
const { prepareAndroidDevice, parseDevices } = require('../../scripts/android-device.cjs');

function harness({
  devices = '',
  bootAfter = 0,
  avds = 'Small_Phone',
  name = 'Small_Phone',
  bootError = false,
  launchError,
} = {}) {
  let ticks = 0;
  let launched = false;
  const calls = [];
  const launches = [];
  const options = {
    env: { ANDROID_HOME: 'sdk' },
    timeoutMs: 3000,
    now: () => ticks * 1000,
    sleep: async () => {
      ticks++;
    },
    log() {},
    launch: (...args) => {
      launched = true;
      launches.push(args);
      return { error: launchError };
    },
    query: async (command, args, settings) => {
      calls.push({ command, args, settings });
      let stdout = '';
      if (args[0] === 'devices')
        stdout = launched
          ? 'emulator-5554 device transport_id:2'
          : typeof devices === 'function'
            ? devices(ticks)
            : devices;
      if (args[0] === '-list-avds') stdout = avds;
      if (args.includes('emu')) stdout = name + '\nOK';
      if (args.includes('sys.boot_completed')) {
        if (bootError && ticks === 0) throw new Error('device offline');
        stdout = ticks >= bootAfter ? '1' : '0';
      }
      return { stdout };
    },
  };
  return { options, calls, launches };
}

test('ADB server starts explicitly and a ready attached device is reused by serial', async () => {
  const h = harness({
    devices: 'List of devices attached\nUSB123 device model:Phone transport_id:7',
  });
  const args = await prepareAndroidDevice(['--variant', 'release'], h.options);
  assert.deepEqual(args, ['--variant', 'release', '--device', 'USB123']);
  assert.deepEqual(h.calls[0].args, ['start-server']);
  assert.equal(h.launches.length, 0);
  assert.ok(h.calls.every((call) => call.settings.windowsHide && call.settings.timeout === 15000));
  assert.ok(!h.calls.some((call) => call.args.includes('kill-server')));
});

test('cold emulator launches once and waits for Android boot completion before Expo', async () => {
  const h = harness({ bootAfter: 2 });
  const args = await prepareAndroidDevice([], h.options);
  assert.deepEqual(args, ['--device', 'emulator-5554']);
  assert.equal(h.launches.length, 1);
  assert.equal(h.launches[0][1], 'Small_Phone');
  assert.match(h.launches[0][2], /android-emulator.log$/);
  assert.equal(h.calls.filter((call) => call.args.includes('sys.boot_completed')).length, 3);
});

test('explicit AVD name resolves to existing serial while other command arguments are preserved', async () => {
  for (const target of [
    ['--device', 'Small_Phone'],
    ['-d', 'Small_Phone'],
    ['--device=Small_Phone'],
  ]) {
    const h = harness({ devices: 'emulator-5554 device' });
    const args = await prepareAndroidDevice(
      [...target, '--variant', 'release', '--binary', 'app.apk'],
      h.options,
    );
    assert.deepEqual(args, [
      '--variant',
      'release',
      '--binary',
      'app.apk',
      '--device',
      'emulator-5554',
    ]);
    assert.equal(h.launches.length, 0);
  }
});

test('offline attached emulator is waited on without starting a duplicate AVD', async () => {
  const h = harness({ devices: 'emulator-5554 offline' });
  await assert.rejects(prepareAndroidDevice([], h.options), /부팅되지/);
  assert.equal(h.launches.length, 0);
});

test('a transient boot query failure is retried without rebooting the emulator', async () => {
  const h = harness({ devices: 'emulator-5554 device', bootError: true });
  assert.deepEqual(await prepareAndroidDevice([], h.options), ['--device', 'emulator-5554']);
  assert.equal(h.launches.length, 0);
});

test('early emulator exit and boot timeout report the startup log without launching again', async () => {
  for (const extra of [
    { launchError: new Error('GPU initialization failed') },
    { bootAfter: 99 },
  ]) {
    const h = harness(extra);
    await assert.rejects(prepareAndroidDevice([], h.options), /android-emulator.log/);
    assert.equal(h.launches.length, 1);
  }
});

test('interactive picker and help preserve Expo behavior; unknown and unauthorized targets fail clearly', async () => {
  const h = harness();
  assert.deepEqual(await prepareAndroidDevice(['--help'], h.options), ['--help']);
  assert.equal(h.calls.length, 0);
  assert.deepEqual(await prepareAndroidDevice(['--device'], h.options), ['--device']);
  assert.equal(h.calls.length, 1);
  await assert.rejects(prepareAndroidDevice(['--device', 'Missing'], h.options), /Missing/);
  const locked = harness({ devices: 'USB123 unauthorized' });
  await assert.rejects(prepareAndroidDevice(['--device', 'USB123'], locked.options), /USB 디버깅/);
  assert.equal(locked.launches.length, 0);
});

test('ADB daemon messages are excluded from device records', () => {
  assert.deepEqual(
    parseDevices(
      '* daemon started successfully\nList of devices attached\nemulator-5554 offline transport_id:1\nphone unauthorized',
    ),
    [
      { serial: 'emulator-5554', state: 'offline' },
      { serial: 'phone', state: 'unauthorized' },
    ],
  );
});

test('a booting attached emulator becomes ready without a second launch', async () => {
  const h = harness({
    devices: (ticks) => 'emulator-5554 ' + (ticks > 0 ? 'device' : 'offline'),
    bootAfter: 2,
  });
  assert.deepEqual(await prepareAndroidDevice([], h.options), ['--device', 'emulator-5554']);
  assert.equal(h.launches.length, 0);
});
