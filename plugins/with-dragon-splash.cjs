const fs = require('node:fs/promises');
const path = require('node:path');
const {
  withAndroidStyles,
  withDangerousMod,
  withInfoPlist,
  AndroidConfig,
  IOSConfig,
} = require('expo/config-plugins');

function withAndroidTheme(config) {
  return withAndroidStyles(config, (mod) => {
    const items = {
      'android:windowBackground': '@drawable/yong_splash_background',
      'android:windowSplashScreenBackground': '#F7FBFF',
      'android:windowSplashScreenAnimatedIcon': '@drawable/yong_splash_mark',
    };

    Object.entries(items).forEach(([name, value]) => {
      mod.modResults = AndroidConfig.Styles.assignStylesValue(mod.modResults, {
        add: true,
        value,
        name,
        parent: AndroidConfig.Styles.getAppThemeGroup(),
      });
      mod.modResults = AndroidConfig.Styles.assignStylesValue(mod.modResults, {
        add: true,
        value,
        name,
        parent: { name: 'Theme.App.SplashScreen' },
      });
    });

    return mod;
  });
}

function withAndroidAssets(config) {
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const resources = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res');

      await fs.mkdir(path.join(resources, 'drawable-nodpi'), { recursive: true });
      await fs.mkdir(path.join(resources, 'drawable'), { recursive: true });
      await fs.copyFile(
        path.join(mod.modRequest.projectRoot, 'assets/mark-dragon.png'),
        path.join(resources, 'drawable-nodpi/yong_splash_mark.png'),
      );
      await fs.writeFile(
        path.join(resources, 'drawable/yong_splash_background.xml'),
        '<layer-list xmlns:android="http://schemas.android.com/apk/res/android"><item android:drawable="@color/yong_splash_background"/><item android:width="240dp" android:height="240dp" android:gravity="center" android:drawable="@drawable/yong_splash_mark"/></layer-list>',
      );
      await fs.writeFile(
        path.join(resources, 'values/yong_splash_colors.xml'),
        '<resources><color name="yong_splash_background">#F7FBFF</color></resources>',
      );

      return mod;
    },
  ]);
}

function withIosAssets(config) {
  return withDangerousMod(config, [
    'ios',
    async (mod) => {
      const name = IOSConfig.XcodeUtils.getProjectName(mod.modRequest.projectRoot);
      const project = path.join(mod.modRequest.platformProjectRoot, name);
      const images = path.join(project, 'Images.xcassets/YongSplash.imageset');

      await fs.mkdir(images, { recursive: true });
      await fs.copyFile(
        path.join(mod.modRequest.projectRoot, 'assets/mark-dragon.png'),
        path.join(images, 'mark.png'),
      );
      await fs.writeFile(
        path.join(images, 'Contents.json'),
        JSON.stringify({
          images: [{ filename: 'mark.png', idiom: 'universal' }],
          info: { author: 'xcode', version: 1 },
        }),
      );
      await fs.copyFile(
        path.join(mod.modRequest.projectRoot, 'plugins/YongSplash.storyboard'),
        path.join(project, 'SplashScreen.storyboard'),
      );

      return mod;
    },
  ]);
}

function withIosStoryboard(config) {
  return withInfoPlist(config, (mod) => {
    mod.modResults.UILaunchStoryboardName = 'SplashScreen';

    return mod;
  });
}

module.exports = function withDragonSplash(config) {
  config = withAndroidTheme(config);
  config = withAndroidAssets(config);
  config = withIosAssets(config);

  return withIosStoryboard(config);
};
