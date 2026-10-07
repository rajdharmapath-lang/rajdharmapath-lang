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
    const stylesDirectory = path.join(resourceDirectory, 'values-v31');

    fs.mkdirSync(drawableDirectory, { recursive: true });
    fs.mkdirSync(stylesDirectory, { recursive: true });
    fs.copyFileSync(
      path.join(modConfig.modRequest.projectRoot, 'assets', 'adaptive-icon.png'),
      path.join(drawableDirectory, 'launch_splash_icon.png')
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
