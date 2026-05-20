import Foundation
import NuggetSDK
import React

fileprivate struct ClientSideNuggetChatBusinessContext: NuggetChatBusinessContext {
  var type: String?
  var ticketID: Int?
  var channelHandle: String?
  var ticketGroupingId: String?
  var ticketProperties: [String : [String]]?
  var botProperties: [String : [String]]?

  init(channelHandle: String? = nil,
       ticketGroupingId: String? = nil,
       ticketProperties: [String : [String]]? = nil,
       botProperties: [String : [String]]? = nil) {
    self.channelHandle = channelHandle
    self.ticketGroupingId = ticketGroupingId
    self.ticketProperties = ticketProperties
    self.botProperties = botProperties
  }
}

fileprivate class ClientSideNuggetChatBusinessContextProvider: NuggetBusinessContextProviderDelegate {
  private let params: [String: Any]?
  init(params: [String: Any]?) {
    self.params = params
  }

  private func createChatSupportBusinessContextFromDictionary() -> NuggetChatBusinessContext {
    guard let params else { return ClientSideNuggetChatBusinessContext() }
    let channelHandle: String? = params["channelHandle"] as? String
    let ticketGroupingId: String? = params["ticketGroupingId"] as? String
    let ticketProperties: [String: [String]]? = params["ticketProperties"] as? [String: [String]]
    let botProperties: [String: [String]]? = params["botProperties"] as? [String: [String]]
    return ClientSideNuggetChatBusinessContext(channelHandle: channelHandle,
                                               ticketGroupingId: ticketGroupingId,
                                               ticketProperties: ticketProperties,
                                               botProperties: botProperties)
  }

  func chatSupportBusinessContext() -> NuggetChatBusinessContext {
    return createChatSupportBusinessContextFromDictionary()
  }
}

fileprivate class ClientSideNuggetThemeProvider: NuggetThemeProviderDelegate {
  var defaultLightModeAccentHexColor: String {
    lightModeAccentColorData?["hex"] as? String ?? "#4E44E4"
  }

  var defaultDarkModeAccentHexColor: String {
    darkModeAccentColorData?["hex"] as? String ?? "#4E44E4"
  }
  var deviceInterfaceStyle: UIUserInterfaceStyle {
    isDarkModeEnabled?.boolValue == true ? .dark : .light
  }

  private let lightModeAccentColorData: [String: Any]?
  private let darkModeAccentColorData: [String: Any]?
  private let isDarkModeEnabled: NSNumber?

  init (lightModeAccentColorData: [String: Any]?,
        darkModeAccentColorData: [String: Any]?,
        isDarkModeEnabled: NSNumber?) {
    self.lightModeAccentColorData = lightModeAccentColorData
    self.darkModeAccentColorData = darkModeAccentColorData
    self.isDarkModeEnabled = isDarkModeEnabled
  }
}

@objc(NuggetRN)
class NuggetRN: RCTEventEmitter {
  var pendingCompletions: [String: (Any) -> Void] = [:]
  var nuggetFactory: NuggetFactory?

  // Required for RCTEventEmitter
  override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  // Required override for RCTEventEmitter
  override func supportedEvents() -> [String]! {
    return ["OnNativeRequest"]
  }

  // Required override for RCTEventEmitter
  override init() {

    super.init()
  }

  @objc
  func canOpenDeeplink(_ deeplink: String,
   resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let canOpenDeeplink = NuggetFactory.canOpenDeeplink(deeplink: deeplink)
    resolve(["canOpenDeeplink": canOpenDeeplink])
  }

  fileprivate var clientSideNuggetChatBusinessContextDelegate :ClientSideNuggetChatBusinessContextProvider?
  fileprivate var clientSideThemeProviderDelegate :NuggetThemeProviderDelegate?
  fileprivate var clientNuggetSDKConfiguration :NuggetSDKConfigurationDelegate = ClientNuggetSDKConfiguration()
  fileprivate var nuggetPushNotificationsListener: NuggetPushNotificationsListener = NuggetPushNotificationsListener()

  @objc
  func initializeNuggetFactory(_ sdkConfiguration: [String: Any],
                               chatSupportBusinessContext: [String: Any],
                               handleDeeplinkInsideApp: NSNumber?,
                               lightModeAccentColorData: [String: Any]?,
                               darkModeAccentColorData: [String: Any]?,
                               fontData: [String: Any]?,
                               isDarkModeEnabled: NSNumber?) {
    clientNuggetSDKConfiguration = ClientNuggetSDKConfiguration(configuration: sdkConfiguration, handleDeeplinkInsideApp: handleDeeplinkInsideApp, accentColorData: lightModeAccentColorData, fontData: fontData, onChatScreenClosed: { [weak self] in
     self?.requestValueFromJS(method: "onChatScreenClosed", payload: [:], completion: nil)
    })
    clientSideNuggetChatBusinessContextDelegate = ClientSideNuggetChatBusinessContextProvider(params: chatSupportBusinessContext)
    clientSideThemeProviderDelegate = ClientSideNuggetThemeProvider(lightModeAccentColorData: lightModeAccentColorData, darkModeAccentColorData: darkModeAccentColorData, isDarkModeEnabled: isDarkModeEnabled)
    nuggetFactory = NuggetSDK.initializeNuggetFactory(
      authDelegate: self,
      sdkConfigurationDelegate: clientNuggetSDKConfiguration,
      notificationDelegate: nuggetPushNotificationsListener,
      chatBusinessContextDelegate: clientSideNuggetChatBusinessContextDelegate,
      customThemeProviderDelegate: clientSideThemeProviderDelegate
    )
  }

  @objc
    func sendNotificationPayload(_ payload: NSDictionary) {

    }

  @objc
  func updateNotificationToken(_ token: String) {
    nuggetPushNotificationsListener.tokenUpdated(to: token)
  }

  @objc
  func updateNotificationPermissionStatus(_ notificationAllowed: Bool) {
    let notificationPermissionStatus: UNAuthorizationStatus = notificationAllowed ? .authorized : .denied
    nuggetPushNotificationsListener.permissionStatusUpdated(to: notificationPermissionStatus)
  }

  @objc
  func openNuggetSDK(_ deeplink: String, shouldPresent: Bool, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
        guard let viewController = self.nuggetFactory?.contentViewController(deeplink: deeplink) else {
            reject("NO_VIEW_CONTROLLER", "Could not get Nugget SDK view controller", nil)
            return
        }

        let rootVC = UIApplication.shared.delegate?.window??.rootViewController
            ?? self.getRootViewControllerFromWindowScene()

        guard let rootVC else {
            reject("NO_VIEW_CONTROLLER", "Could not find root view controller", nil)
            return
        }

        // Traverse to the topmost presented view controller
        var topVC = rootVC
        while let presented = topVC.presentedViewController {
            topVC = presented
        }

        let chatNavigationController = UINavigationController(rootViewController: viewController)
        chatNavigationController.modalPresentationStyle = .fullScreen

        if shouldPresent {
            topVC.present(chatNavigationController, animated: true)
            resolve(["nuggetSDKResult": true])
        } else if let navController = topVC as? UINavigationController {
            navController.pushViewController(chatNavigationController, animated: true)
            resolve(["nuggetSDKResult": true])
        } else if let navController = topVC.navigationController {
            navController.pushViewController(chatNavigationController, animated: true)
            resolve(["nuggetSDKResult": true])
        } else {
            reject("NO_NAVIGATION_CONTROLLER", "Could not find a navigation controller to push onto", nil)
        }
    }
}

  @MainActor @available(iOS 13.0, *)
  private func getRootViewControllerFromWindowScene() -> UIViewController? {
    guard
      let windowScene = UIApplication.shared.connectedScenes
        .filter({ $0.activationState == .foregroundActive })
        .first as? UIWindowScene
    else {
      return nil
    }

    if #available(iOS 15.0, *) {
      let keyWindowVC = windowScene.windows.first?.windowScene?.keyWindow?.rootViewController
      if keyWindowVC != nil {
        return keyWindowVC
      }
    }

    return windowScene.windows.first?.rootViewController
  }

  func requestValueFromJS(
    method: String, payload: [String: Any], completion: ((Any) -> Void)? = nil
  ) {
    if let completion {
      pendingCompletions[method] = completion
    }
    sendEvent(
      withName: "OnNativeRequest",
      body: [
        "method": method,
        "payload": payload,
      ])
  }

  @objc
  func onJsResponse(_ method: String, result: Any) {
    if let completion = pendingCompletions[method] {
      completion(result)
      pendingCompletions.removeValue(forKey: method)
    }
  }
}

// MARK: Auth requirements
extension NuggetRN: NuggetAuthProviderDelegate {

  private func createAuthObjectFromDictionary(dictionary: [String: Any]) -> NuggetAuthUserInfo? {
    print("createAuthObjectFromDictionary", dictionary)
    guard let accessToken = dictionary["accessToken"] as? String else { return nil }
    return ClientAuthToken(accessToken: accessToken)
  }

  func authManager(requiresAuthInfo completion: @escaping ((NuggetAuthUserInfo)?, (Error)?) -> Void) {
    requestValueFromJS(method: "requiresAuthInfo", payload: [:]) { result in
      guard let passesValue = result as? [String: Any],
            let authInfo = self.createAuthObjectFromDictionary(dictionary: passesValue) else {
        completion(nil, NSError(domain: "NuggetRN", code: 0, userInfo: nil))
        return
      }
      completion(authInfo, nil)
    }
  }

  func authManager(requestRefreshAuthInfo completion: @escaping ((any NuggetAuthUserInfo)?, (any Error)?) -> Void) {
    requestValueFromJS(method: "requestRefreshAuthInfo", payload: [:]) { result in
      guard let passesValue = result as? [String: Any],
            let authInfo = self.createAuthObjectFromDictionary(dictionary: passesValue) else {
        completion(nil, NSError(domain: "NuggetRN", code: 0, userInfo: nil))
        return
      }
      completion(authInfo, nil)
    }
  }

  struct ClientAuthToken: NuggetAuthUserInfo {
    var clientID: Int = 1
    var accessToken: String
    var userName: String? = nil
    var userID: String = .init()
    var photoURL: String = .init()

    init(accessToken: String) {
      self.accessToken = accessToken
    }
  }
}

// MARK: SDK config requirements
private struct ClientNuggetSDKConfiguration: NuggetSDKConfigurationDelegate {
  func chatScreenClosedCallback() {
    self.onChatScreenClosed?()
  }

  init() { }

  private var configuration: [String: Any]?
  private var handleDeeplinkInsideApp: NSNumber?
  private var accentColorData: [String: Any]?
  private var fontData: [String: Any]?
  private var onChatScreenClosed: (() -> Void)?

  init(configuration: [String: Any], handleDeeplinkInsideApp: NSNumber?, accentColorData: [String: Any]?, fontData: [String: Any]?, onChatScreenClosed: (() -> Void)?) {
    self.configuration = configuration
    self.handleDeeplinkInsideApp = handleDeeplinkInsideApp
    self.accentColorData = accentColorData
    self.fontData = fontData
    self.onChatScreenClosed = onChatScreenClosed
  }

  private func createSDKConfigObjectFromDictionary( dictionary: [String: Any]?) -> NuggetJumboConfiguration {
    let nameSpace = dictionary?["nameSpace"] as? String ?? ""
    let jumboUrl = dictionary?["jumboUrl"] as? String
    return NuggetJumboConfiguration(nameSpace: nameSpace, jumboUrl: jumboUrl)
  }

  func jumboConfiguration(completion: @escaping (NuggetJumboConfiguration) -> Void) {
    let configObject = self.createSDKConfigObjectFromDictionary(dictionary: configuration)
    completion(configObject)
  }

  func getHandleDeeplinkInsideApp() -> Bool? {
      return handleDeeplinkInsideApp?.boolValue
  }

  func getAccentColorData() -> [String: Any]? {
      return accentColorData
  }

  func getFontData() -> [String: Any]? {
      return fontData
  }

}
