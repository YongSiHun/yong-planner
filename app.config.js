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
  const buildNumber = getBuildNumber(process.env.BUILD);
  const hasBuildNumber = buildNumber !== undefined;

  if (!hasBuildNumber) {
    return config;
  }

  return {
    ...config,
    ios: { ...config.ios, buildNumber: String(buildNumber) },
    android: { ...config.android, versionCode: buildNumber },
  };
};
