const { assert, test } = require('../support/test.cjs');
const { readFileSync } = require('node:fs');
const { dirname, join } = require('node:path');
const { resolvePackages } = require('../../scripts/android-sdk-packages.cjs');
const catalog = (sdk, tools) =>
  `[versions]\ncompileSdk = "${sdk}"\nbuildTools = "${tools}"\n[libraries]\n`;
const listing = (...packages) => packages.map((name) => `  ${name} | 1 | SDK package`).join('\n');
test('supports API 36 packages and the API 37 minor-version package name', () => {
  for (const [sdk, platform] of [
    ['36', '36'],
    ['37', '37.0'],
    ['37.1', '37.1'],
  ]) {
    assert.deepEqual(
      resolvePackages(
        catalog(sdk, '37.0.0'),
        listing(`platforms;android-${platform}`, 'build-tools;37.0.0'),
      ),
      [`platforms;android-${platform}`, 'build-tools;37.0.0'],
    );
  }
});
test('uses the installed React Native catalog', () => {
  const source = readFileSync(
    join(dirname(require.resolve('react-native/package.json')), 'gradle/libs.versions.toml'),
    'utf8',
  );
  const sdk = source.match(/^compileSdk = "([0-9.]+)"/m)[1];
  const tools = source.match(/^buildTools = "([0-9.]+)"/m)[1];
  const platform = `platforms;android-${sdk}`;
  assert.deepEqual(resolvePackages(source, listing(platform, `build-tools;${tools}`)), [
    platform,
    `build-tools;${tools}`,
  ]);
});
test('does not silently downgrade the framework SDK or select a preview', () => {
  assert.throws(
    () =>
      resolvePackages(
        catalog('37', '37.0.0'),
        listing('platforms;android-36', 'platforms;android-37.0-ext1', 'build-tools;37.0.0'),
      ),
    /No stable Android platform for compileSdk 37/,
  );
  assert.throws(
    () =>
      resolvePackages(
        catalog('37', '37.0.0'),
        listing('platforms;android-37.0', 'build-tools;37.0.0-rc1'),
      ),
    /package unavailable/,
  );
});
test('fails explicitly if the framework catalog format changes', () => {
  assert.throws(
    () => resolvePackages('[versions]\n[libraries]\ncompileSdk = "37"', ''),
    /Missing compileSdk/,
  );
});
