const fs = require('node:fs/promises');
const path = require('node:path');
const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('expo/config-plugins');

module.exports = function withPlannerNotifications(config) {
  config = withAndroidManifest(config, (mod) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults);

    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      application,
      'expo.modules.notifications.default_notification_icon',
      '@drawable/yong_notification',
      'resource',
    );

    return mod;
  });

  return withDangerousMod(config, [
    'android',
    async (mod) => {
      await require('./patch-notification-presentation.cjs')(mod.modRequest.projectRoot);
      const folder = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res/drawable');

      await fs.mkdir(folder, { recursive: true });
      await fs.writeFile(
        path.join(folder, 'yong_notification.xml'),
        '<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24"><path android:fillColor="#00000000" android:strokeColor="#FFFFFFFF" android:strokeWidth="1.8" android:strokeLineCap="round" android:strokeLineJoin="round" android:pathData="M6,3 L17,3 Q19,3 19,5 L19,20 L5,20 L5,5 Q5,3 6,3 M8,2 L8,5 M12,2 L12,5 M16,2 L16,5 M8,9 L15,9 M8,13 L13,13 M8,17 L11,17"/></vector>',
      );

      return mod;
    },
  ]);
};
