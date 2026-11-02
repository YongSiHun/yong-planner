module.exports = ({ config }) => {
  const rawBuild = process.env.BUILD;
  const build = rawBuild === undefined ? undefined : Number(rawBuild);
  if (build !== undefined && (!Number.isInteger(build) || build < 1 || build > 2100000000)) {
    throw new Error('BUILD must be a positive integer no greater than 2100000000.');
  }
  return {
    ...config,
    ios: { ...config.ios, ...(build === undefined ? {} : { buildNumber: String(build) }) },
    android: { ...config.android, ...(build === undefined ? {} : { versionCode: build }) },
  };
};
