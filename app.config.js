const { withGradleProperties } = require('expo/config-plugins');

function withCmakePathLimit(config) {
  return withGradleProperties(config, (modConfig) => {
    const propertyName = 'expo.android.cmakeObjectPathMax';
    const properties = modConfig.modResults.filter((entry) => entry.key !== propertyName);
    const isWindows = process.platform === 'win32';

    // 긴 개체 파일 경로를 해시로 줄여 Windows Ninja의 경로 제한을 피한다.
    if (isWindows) {
      properties.push({ type: 'property', key: propertyName, value: '240' });
    }

    modConfig.modResults = properties;

    return modConfig;
  });
}

function getBuildNumber(value) {
  const hasBuildNumber = value !== undefined;

  if (!hasBuildNumber) {
    return undefined;
  }

  const buildNumber = Number(value);
  const isInteger = Number.isInteger(buildNumber);
  const isInRange = buildNumber >= 1 && buildNumber <= 2100000000;
  const isValid = isInteger && isInRange;

  if (!isValid) {
    throw new Error('BUILD는 1 이상 2100000000 이하의 정수여야 합니다.');
  }

  return buildNumber;
}

module.exports = function configureApp({ config }) {
  const nativeConfig = withCmakePathLimit(config);
  const buildNumber = getBuildNumber(process.env.BUILD);
  const hasBuildNumber = buildNumber !== undefined;

  if (!hasBuildNumber) {
    return nativeConfig;
  }

  return {
    ...nativeConfig,
    ios: { ...config.ios, buildNumber: String(buildNumber) },
    android: { ...config.android, versionCode: buildNumber },
  };
};
