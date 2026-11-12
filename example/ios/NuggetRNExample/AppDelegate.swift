import React
import UIKit

/// Starts React Native. All window and UI setup lives in `SceneDelegate`.
@main
class AppDelegate: UIResponder, UIApplicationDelegate {

  /// The scene's window, set by `SceneDelegate`.
  ///
  /// React Native 0.73 reads `UIApplication.delegate.window` (for appearance, alerts, LogBox and
  /// RedBox), and NuggetRN reads it to find where to show chat.
  var window: UIWindow?

  /// The React Native bridge. It lives as long as the app, so a reconnected scene doesn't reload
  /// the JS bundle.
  private(set) var bridge: RCTBridge?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    bridge = RCTBridge(delegate: self, launchOptions: launchOptions)
    return true
  }
}

// MARK: - RCTBridgeDelegate

extension AppDelegate: RCTBridgeDelegate {

  func sourceURL(for bridge: RCTBridge) -> URL? {
    #if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
