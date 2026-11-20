function selectedDevice(args) {
  const inline = args.find((arg) => arg.startsWith('--device='));
  if (inline) return inline.slice('--device='.length);
  const index = args.findIndex((arg) => arg === '--device' || arg === '-d');
  if (index < 0) return undefined;
  const value = args[index + 1];
  return value && !value.startsWith('-') ? value : null;
}

function withDevice(args, serial) {
  const result = args.filter((arg, index) => {
    if (arg.startsWith('--device=')) return false;
    if (arg === '--device' || arg === '-d') return false;
    return args[index - 1] !== '--device' && args[index - 1] !== '-d';
  });
  return [...result, '--device', serial];
}

module.exports = { selectedDevice, withDevice };
