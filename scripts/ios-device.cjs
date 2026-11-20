const { execFile } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { promisify } = require('node:util');
const { selectedDevice, withDevice } = require('./device-args.cjs');

const exec = promisify(execFile);
const BOOT_TIMEOUT_MS = 5 * 60 * 1000;

function availableSimulators(inventory) {
  return Object.entries(inventory.devices).flatMap(([runtime, devices]) => {
    if (!runtime.includes('.SimRuntime.iOS-')) return [];
    return devices.filter((device) => device.isAvailable !== false && !device.availabilityError);
  });
}

function createRecorder(logPath) {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.writeFileSync(logPath, '');
  return (message) => fs.appendFileSync(logPath, message + '\n');
}

async function prepareIosDevice(args, options = {}) {
  const {
    platform = process.platform,
    env = process.env,
    query = exec,
    record: customRecord,
    log = console.log,
    timeoutMs = BOOT_TIMEOUT_MS,
  } = options;
  const help = args.includes('--help') || args.includes('-h');
  if (help) return args;
  if (platform !== 'darwin')
    throw new Error('iOS 로컬 실행은 Xcode가 설치된 macOS에서만 가능합니다.');
  const target = selectedDevice(args);
  // Expo owns interactive selection, physical devices, and generic build-only destinations.
  if (target === null || target === 'generic') return args;
  const logPath = path.join(process.cwd(), '.cache', 'ios-simulator.log');
  const record = customRecord || createRecorder(logPath);
  const run = async (command, values, timeout = 15000) => {
    record('$ ' + [command, ...values].join(' '));
    try {
      const result = await query(command, values, {
        encoding: 'utf8',
        env,
        timeout,
        maxBuffer: 1024 * 1024,
      });
      record(result.stdout || '');
      record(result.stderr || '');
      return result.stdout.trim();
    } catch (error) {
      record(error.stdout || '');
      record(error.stderr || '');
      record(error.message);
      throw error;
    }
  };

  try {
    const inventory = JSON.parse(
      await run('xcrun', ['simctl', 'list', 'devices', 'available', '--json']),
    );
    const devices = availableSimulators(inventory);
    let device;
    if (target) {
      const value = target.toLowerCase();
      device = devices.find(
        (item) => item.udid.toLowerCase() === value || item.name.toLowerCase() === value,
      );
      // An unmatched name/UDID may identify a physical iPhone; let Expo resolve it.
      if (!device) return args;
    } else {
      device = devices.find((item) => item.state === 'Booted');
      if (!device) device = await defaultSimulator(devices, run);
    }
    if (!device)
      throw new Error(
        '사용 가능한 iOS 시뮬레이터가 없습니다. Xcode에서 iOS 런타임과 기기를 설치해 주세요.',
      );
    log('iOS 시뮬레이터 부팅을 준비합니다: ' + device.name + '\n시작 로그: ' + logPath);
    // -b boots only if needed, and waits for boot services/data migration to finish.
    await run('xcrun', ['simctl', 'bootstatus', device.udid, '-b'], timeoutMs);
    await run('open', ['-a', 'Simulator', '--args', '-CurrentDeviceUDID', device.udid]);
    log('iOS 부팅 완료: ' + device.udid);
    return withDevice(args, device.udid);
  } catch (error) {
    const detail = error.killed ? 'iOS 시뮬레이터 준비 대기 시간을 초과했습니다.' : error.message;
    throw new Error(detail + '\niOS 시뮬레이터 시작 로그: ' + logPath);
  }
}

async function defaultSimulator(devices, run) {
  try {
    const udid = await run('defaults', ['read', 'com.apple.iphonesimulator', 'CurrentDeviceUDID']);
    const preferred = devices.find((device) => device.udid === udid);
    if (preferred) return preferred;
  } catch {
    // Simulator.app may not have a saved default on a new Mac.
  }
  return devices.find((device) => device.name.startsWith('iPhone')) || devices[0];
}

module.exports = { prepareIosDevice, availableSimulators };
