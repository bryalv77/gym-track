// iOS 27 asserts at launch unless the app adopts the UIScene lifecycle.
// Expo's template doesn't do it yet: wire in Expo's EXExpoAppSceneDelegate.
// shortcut: remove once expo-template-bare-minimum ships scene support.
const { withInfoPlist, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = (config) => {
  config = withInfoPlist(config, (c) => {
    c.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          { UISceneConfigurationName: 'Default Configuration', UISceneDelegateClassName: 'EXExpoAppSceneDelegate' },
        ],
      },
    };
    return c;
  });
  return withDangerousMod(config, [
    'ios',
    (c) => {
      const file = path.join(c.modRequest.platformProjectRoot, c.modRequest.projectName, 'AppDelegate.swift');
      let src = fs.readFileSync(file, 'utf8');
      if (src.includes('ExpoReactNativeFactoryProvider')) return c;
      const next = src
        .replace('class AppDelegate: ExpoAppDelegate {', 'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {')
        .replace(/#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow[\s\S]*?#endif\n\n?/, '// The scene delegate creates the window and starts React Native.\n');
      if (next === src || next.includes('startReactNative')) {
        throw new Error('ios-scene-lifecycle: AppDelegate.swift template changed, update the plugin');
      }
      fs.writeFileSync(file, next);
      return c;
    },
  ]);
};
