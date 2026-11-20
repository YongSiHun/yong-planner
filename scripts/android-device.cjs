const { execFile, spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { promisify } = require('node:util');
const { setTimeout: delay } = require('node:timers/promises');
const { selectedDevice, withDevice } = require('./device-args.cjs');

const exec = promisify(execFile);
const BOOT_TIMEOUT_MS = 5 * 60 * 1000;

function parseDevices(output) {
  return output.split(/\r?\n/).flatMap((line) => {
    const match = /^(\S+)\s+(device|offline|unauthorized)\b/.exec(line);
    return match ? [{ serial: match[1], state: match[2] }] : [];
  });
}

function launchEmulator(command, name, logPath) {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  const fd = fs.openSync(logPath, 'w');
  let child;
  try {
    child = spawn(command, ['-avd', name], {
      detached: true,
      windowsHide: true,
      stdio: ['ignore', fd, fd],
    });
  } finally {
    fs.closeSync(fd);
  }
  const state = {};
  child.once('error', (error) => {
    state.error = error;
  });
  child.once('exit', (code) => {
    state.error = new Error('Emulator exited before boot (code ' + code + ').');
  });
  child.unref();
  return state;
}

// Prepare Windows devices outside Expo 58's changed discovery/boot path.
// Do not restart the shared ADB server, wipe an AVD, or change its configuration.
async function prepareAndroidDevice(args, options = {}) {
  const {
    env = process.env,
    query = exec,
    launch = launchEmulator,
    sleep = delay,
    now = Date.now,
    timeoutMs = BOOT_TIMEOUT_MS,
    log = console.log,
  } = options;
  const target = selectedDevice(args);
  const help = args.includes('--help') || args.includes('-h');
  if (help) return args;
  const sdk =
    env.ANDROID_HOME ||
    env.ANDROID_SDK_ROOT ||
    path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk');
  const adb = path.join(sdk, 'platform-tools', 'adb.exe');
  const emulator = path.join(sdk, 'emulator', 'emulator.exe');
  const run = async (command, values) =>
    (
      await query(command, values, {
        encoding: 'utf8',
        timeout: 15000,
        windowsHide: true,
        env,
      })
    ).stdout.trim();
  const adbRun = (...values) => run(adb, values);

  // Expo 55 starts the server explicitly; Expo 58 relies on implicit negotiation.
  await adbRun('start-server');
  // Preserve Expo's interactive device picker.
  if (target === null) return args;
  const devices = parseDevices(await adbRun('devices', '-l'));
  let device = devices.find((item) => item.serial === target);
  if (!target)
    device =
      devices.find((item) => item.state === 'device') ||
      devices.find((item) => item.serial.startsWith('emulator-'));
  if (target && !device) device = await findAvd(devices, target, adbRun);
  if (device?.state === 'unauthorized')
    throw new Error('USB 디버깅 권한을 기기에서 허용해 주세요: ' + device.serial);
  const logPath = path.join(process.cwd(), '.cache', 'android-emulator.log');
  let launched;
  let avd = target;
  if (!device) {
    const avds = (await run(emulator, ['-list-avds']))
      .split(/\r?\n/)
      .filter((name) => name && !/\s/.test(name));
    avd = target || avds[0];
    if (!avd || !avds.includes(avd))
      throw new Error('실행할 Android 기기를 찾지 못했습니다: ' + (target || 'AVD 없음'));
    log('에뮬레이터 부팅을 준비합니다: ' + avd + '\n시작 로그: ' + logPath);
    launched = launch(emulator, avd, logPath);
  }
  const deadline = now() + timeoutMs;
  log('Android 기기가 준비될 때까지 기다립니다…');
  let lastError;
  while (now() < deadline) {
    if (launched?.error) throw bootError(launched.error.message, logPath);
    try {
      const attached = parseDevices(await adbRun('devices', '-l'));
      device = device
        ? attached.find((item) => item.serial === device.serial) || device
        : await findAvd(attached, avd, adbRun);
      if (device?.state === 'device') {
        const completed = await adbRun(
          '-s',
          device.serial,
          'shell',
          'getprop',
          'sys.boot_completed',
        );
        if (completed === '1') {
          log('Android 부팅 완료: ' + device.serial);
          return withDevice(args, device.serial);
        }
      }
    } catch (error) {
      lastError = error.message;
    }
    await sleep(1000);
  }
  throw bootError(
    lastError || 'Android 기기가 5분 안에 부팅되지 않았습니다.',
    launched ? logPath : undefined,
  );
}

async function findAvd(devices, name, adbRun) {
  for (const device of devices.filter((item) => item.serial.startsWith('emulator-'))) {
    try {
      const output = await adbRun('-s', device.serial, 'emu', 'avd', 'name');
      if (output.split(/\r?\n/)[0].trim() === name) return device;
    } catch {
      // A booting emulator may not have its console ready yet.
    }
  }
  return undefined;
}

function bootError(message, logPath) {
  const detail = logPath ? '\n에뮬레이터 시작 로그: ' + logPath : '';
  return new Error(message + detail);
}

module.exports = { prepareAndroidDevice, parseDevices, selectedDevice };
