const { withGradleProperties } = require('expo/config-plugins');

const appConfig = {
  name: '용플래너',
  slug: 'yong-planner',
  version: '1.0.1',
  scheme: 'yongplanner',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.yongplanner.app',
    icon: './assets/icon-dragon.png',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.yongplanner.app',
    softwareKeyboardLayoutMode: 'resize',
    allowBackup: false,
    adaptiveIcon: {
      foregroundImage: './assets/mark-dragon.png',
      backgroundColor: '#F7FBFF',
    },
    permissions: ['android.permission.SCHEDULE_EXACT_ALARM', 'android.permission.USE_EXACT_ALARM'],
    blockedPermissions: [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.VIBRATE',
    ],
  },
  plugins: [
    'expo-router',
    './plugins/with-gradle-download-timeout.cjs',
    'expo-sqlite',
    'expo-document-picker',
    'expo-sharing',
    './plugins/with-dragon-splash.cjs',
    './plugins/with-planner-notifications.cjs',
    [
      'expo-notifications',
      {
        color: '#1F6EAC',
        enableRemoteNotifications: false,
        enableBackgroundRemoteNotifications: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  icon: './assets/icon-dragon.png',
  primaryColor: '#1F6EAC',
  orientation: 'default',
  extra: {
    eas: {
      projectId: 'ec9b10b4-1ac7-45c0-b445-da0f7ae5e1eb',
    },
  },
};

function withCmakePathLimit(config) {
  return withGradleProperties(config, (modConfig) => {
    const propertyName = 'expo.android.cmakeObjectPathMax';
    const properties = modConfig.modResults.filter((entry) => entry.key !== propertyName);

    const isWindows = process.platform === 'win32';

    // 경로 해시: Win Ninja 길이 제한 회피.
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
  config = { ...config, ...appConfig };
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
