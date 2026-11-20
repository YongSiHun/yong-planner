const { spawn } = require('node:child_process');
const { prepareIosDevice } = require('./ios-device.cjs');

async function main() {
  const args = await prepareIosDevice(process.argv.slice(2));
  const cli = require.resolve('expo/bin/cli');
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, 'run:ios', ...args], {
      env: process.env,
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('close', (code) => resolve(code ?? 1));
  });
}

main().then(
  (status) => process.exit(status),
  (error) => {
    console.error(error.message);
    process.exit(1);
  },
);
