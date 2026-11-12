import React
import UIKit

/// Builds the app's window and React Native root view when the system connects the scene.
///
/// Apps built with the iOS 27 SDK must adopt the UIScene life cycle, or UIKit terminates them at
/// launch.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {

  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let bridge = appDelegate.bridge
    else {
      return
    }

    let rootView = RCTRootView(bridge: bridge, moduleName: "NuggetRNExample", initialProperties: nil)
    rootView.backgroundColor = .systemBackground
    let reactViewController = UIViewController()
    reactViewController.view = rootView

    // NuggetRN pushes the chat screen onto a navigation controller, so host React inside one.
    let navigationController = UINavigationController(rootViewController: reactViewController)
    navigationController.isNavigationBarHidden = true

    let window = UIWindow(windowScene: windowScene)
    window.rootViewController = navigationController
    self.window = window
    appDelegate.window = window
    window.makeKeyAndVisible()
  }

  // MARK: - Geometry changes

  // React Native updates `Dimensions` (e.g. on rotation) when RCTWindowFrameDidChangeNotification
  // is posted. With a scene delegate, UIKit reports geometry changes here.

  @available(iOS 26.0, *)
  func windowScene(
    _ windowScene: UIWindowScene,
    didUpdateEffectiveGeometry previousEffectiveGeometry: UIWindowScene.Geometry
  ) {
    postWindowFrameDidChange()
  }

  func windowScene(
    _ windowScene: UIWindowScene,
    didUpdate previousCoordinateSpace: UICoordinateSpace,
    interfaceOrientation previousInterfaceOrientation: UIInterfaceOrientation,
    traitCollection previousTraitCollection: UITraitCollection
  ) {
    if #available(iOS 26.0, *) {
      // Handled by windowScene(_:didUpdateEffectiveGeometry:).
      return
    }
    postWindowFrameDidChange()
  }

  private func postWindowFrameDidChange() {
    NotificationCenter.default.post(name: .RCTWindowFrameDidChange, object: self)
  }
}
