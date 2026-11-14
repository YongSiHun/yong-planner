const { spawn } = require('node:child_process');
const { stripVTControlCharacters } = require('node:util');

// Fingerprint embedding is optional development metadata. Avoid the Windows
// config-loader subprocess failure and its hashing cost on every native build.
// Set EXPO_SKIP_FINGERPRINT_EMBED=0 to explicitly enable it for diagnostics.
const env = { ...process.env };
if (process.platform === 'win32') {
  env.EXPO_SKIP_FINGERPRINT_EMBED ??= '1';
}
const cli = require.resolve('expo/bin/cli');
const requestedArgs = process.argv.slice(2);

function runExpo(args) {
  return new Promise((resolve) => {
    // Keep stdout attached to the terminal so Metro's interactive UI still works.
    // Tee stderr live, retaining only a bounded tail for this specific failure.
    const child = spawn(process.execPath, [cli, 'run:android', ...args], {
      env,
      stdio: ['inherit', 'inherit', 'pipe'],
    });
    let stderr = '';
    let spawnError;
    child.stderr.on('data', (chunk) => {
      process.stderr.write(chunk);
      stderr = (stderr + chunk.toString()).slice(-32768);
    });
    child.once('error', (error) => {
      spawnError = error;
      console.error(error);
    });
    child.once('close', (code, signal) => resolve({ code, signal, stderr, spawnError }));
  });
}

async function main() {
  const first = await runExpo(requestedArgs);
  const failed = first.code !== null && first.code !== 0 && !first.spawnError;
  const changedTransport =
    /CommandError: Device (emulator-\d+) was replaced after discovery \(transport \d+ became \d+\)/.exec(
      stripVTControlCharacters(first.stderr),
    );
  if (!failed || !changedTransport) {
    return first.code ?? 1;
  }

  console.warn('에뮬레이터의 ADB 연결이 바뀌었습니다. 기기를 다시 탐색해 한 번 재시도합니다.');
  const hasDevice = requestedArgs.some((arg) => /^(?:--device|-d)(?:=|$)/.test(arg));
  const retryArgs = hasDevice ? requestedArgs : [...requestedArgs, '--device', changedTransport[1]];
  const retry = await runExpo(retryArgs);

  return retry.code ?? 1;
}

main().then(
  (status) => process.exit(status),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
