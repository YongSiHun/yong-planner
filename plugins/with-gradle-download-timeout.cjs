const fs = require('node:fs/promises');
const path = require('node:path');
const { withDangerousMod } = require('expo/config-plugins');

module.exports = function withGradleDownloadTimeout(config) {
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const file = path.join(
        mod.modRequest.platformProjectRoot,
        'gradle/wrapper/gradle-wrapper.properties',
      );
      const content = await fs.readFile(file, 'utf8');
      const lines = content.split(/\r?\n/).filter((line) => !/^\s*networkTimeout\s*=/.test(line));

      // Gradle 배포 파일: CI의 일시적인 다운로드 지연 허용.
      await fs.writeFile(file, lines.join('\n').trimEnd() + '\nnetworkTimeout=120000\n');

      return mod;
    },
  ]);
};
