const { readFileSync } = require('node:fs');
const { dirname, join } = require('node:path');

// Expo's Gradle plugin uses this same catalog. Keep CI aligned with the
// locked React Native version instead of maintaining another SDK version.
function resolvePackages(catalog, listing) {
  const versions = catalog.match(/^\[versions\]\s*\r?\n([\s\S]*?)(?=^\[|$(?![\s\S]))/m)?.[1];
  const version = (name) => {
    const value = versions?.match(new RegExp(`^${name}\\s*=\\s*"([0-9.]+)"`, 'm'))?.[1];
    if (!value) throw new Error(`Missing ${name} in React Native's version catalog`);
    return value;
  };
  const available = new Set(listing.split(/\r?\n/).map((line) => line.split('|')[0].trim()));
  const compileSdk = version('compileSdk');
  const candidates = [`platforms;android-${compileSdk}`];
  if (!compileSdk.includes('.')) candidates.push(`platforms;android-${compileSdk}.0`);
  const platform = candidates.find((name) => available.has(name));
  if (!platform) {
    throw new Error(
      `No stable Android platform for compileSdk ${compileSdk}: ${candidates.join(', ')}`,
    );
  }
  const buildTools = `build-tools;${version('buildTools')}`;
  if (!available.has(buildTools)) throw new Error(`Android SDK package unavailable: ${buildTools}`);
  return [platform, buildTools];
}

if (require.main === module) {
  const catalog = join(
    dirname(require.resolve('react-native/package.json')),
    'gradle/libs.versions.toml',
  );
  try {
    process.stdout.write(
      resolvePackages(readFileSync(catalog, 'utf8'), readFileSync(0, 'utf8')).join('\n') + '\n',
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { resolvePackages };
