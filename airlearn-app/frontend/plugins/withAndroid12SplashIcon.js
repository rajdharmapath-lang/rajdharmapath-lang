const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('@expo/config-plugins');

module.exports = (config) => withDangerousMod(config, [
  'android',
  async (modConfig) => {
    const resourceDirectory = path.join(
      modConfig.modRequest.platformProjectRoot,
      'app',
      'src',
      'main',
      'res'
    );
    const drawableDirectory = path.join(resourceDirectory, 'drawable-nodpi');
    const defaultDrawableDirectory = path.join(resourceDirectory, 'drawable');
    const stylesDirectory = path.join(resourceDirectory, 'values-v31');

    fs.mkdirSync(defaultDrawableDirectory, { recursive: true });
    fs.mkdirSync(stylesDirectory, { recursive: true });
    fs.rmSync(path.join(drawableDirectory, 'launch_splash_icon.png'), { force: true });
    fs.writeFileSync(
      path.join(defaultDrawableDirectory, 'launch_splash_icon.xml'),
      `<vector xmlns:android="http://schemas.android.com/apk/res/android"
  android:width="1dp"
  android:height="1dp"
  android:viewportWidth="1"
  android:viewportHeight="1">
  <path android:fillColor="#00000000" android:pathData="M0,0h1v1h-1z" />
</vector>
`
    );
    fs.writeFileSync(
      path.join(stylesDirectory, 'styles.xml'),
      `<resources>
  <style name="Theme.App.SplashScreen" parent="AppTheme">
    <item name="android:windowBackground">@drawable/splashscreen</item>
    <item name="android:windowSplashScreenBackground">#FDF9F6</item>
    <item name="android:windowSplashScreenAnimatedIcon">@drawable/launch_splash_icon</item>
  </style>
</resources>
`
    );

    return modConfig;
  },
]);
