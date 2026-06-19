package com.nuggetrn

import android.app.Activity
import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise;
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import org.json.JSONException
import org.json.JSONObject
import com.zomato.chatsdk.chatcorekit.init.ChatSdkAccessTokenData
import com.zomato.chatsdk.chatcorekit.init.ChatSdkInitConfig
import com.zomato.chatsdk.chatcorekit.network.request.BusinessContext
import com.zomato.chatsdk.init.ChatSDKInitCommunicator
import com.zomato.chatsdk.init.ChatSdk
import com.zomato.sushilib.annotations.FontWeight
import android.app.Application
import android.util.Log
import com.zomato.chatsdk.activities.ChatSDKDeepLinkRouter
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import android.os.Handler
import android.os.Looper
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.ConcurrentHashMap
import com.facebook.react.bridge.ReadableArray
import android.content.Context
import android.os.Bundle
import com.zomato.ui.atomiclib.data.ColorData
import androidx.appcompat.app.AppCompatDelegate
import com.zomato.chatsdk.utils.ChatFCMTokenManager
import com.zomato.chatsdk.chatcorekit.init.ChatSdkNotificationsData
import com.zomato.chatsdk.chatuikit.init.ChatUiKit
import com.zomato.chatsdk.notification.ChatSdkNotificationUtil

class NuggetRN(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), ActivityEventListener {

  private val pendingResponses = ConcurrentHashMap<String, CompletableDeferred<ReadableMap>>()

  private var channelHandle: String? = null
  private var ticketGroupingId: String? = null
  private var ticketID: Long? = null
  private var ticketProperties: HashMap<String, ArrayList<String>>? = null
  private var botProperties: HashMap<String, ArrayList<String>>? = null
  private var themeId: String? = null
  private var nameSpace: String? = null

  private var handleDeeplinkInsideTheApp: Boolean? = null
  private var lightModeAccentColorTint: String? = null
  private var lightModeAccentColorType: String? = null
  private var lightModeAccentColorHex: String? = null

  private var darkModeAccentColorTint: String? = null
  private var darkModeAccentColorType: String? = null
  private var darkModeAccentColorHex: String? = null

  private var currentAccessToken: String? = null
  private var httpCode: Int? = null
  private var notificationToken: String? = null
  private var notificationAllowed: Boolean = true
  private var notificationPayload: HashMap<String, String>? = null

  private var isInitialized = false

  private var isDarkModeEnabledForClient = false
  private var shouldToggleThemeDelegate = true

  companion object {
    const val NAME = "NuggetRN"
  }

  init {
    reactContext.addActivityEventListener(this)
  }

  override fun getName(): String {
    return NAME
  }

  @ReactMethod
  fun initializeNuggetFactory(
    jumboConfiguration: ReadableMap?,
    businessContext: ReadableMap?,
    handleDeeplinkInsideApp: Boolean?,
    lightModeAccentColorData: ReadableMap?,
    darkModeAccentColorData: ReadableMap?,
    fontData: ReadableMap?,
    isDarkModeEnabled: Boolean?,
    shouldToggleThemeDelegate: Boolean?,
    promise: Promise
  ) {
    try {
      // Call actual SDK initialization using app context
      val context = reactContext.applicationContext

      requestAuthInfo("requiresAuthInfo")

      Log.i("ChatSampleApp", "Initialising NuggetSDK method called")

      nameSpace = jumboConfiguration?.getString("nameSpace") ?: ""

      updateBusinessContext(businessContext = businessContext)

      handleDeeplinkInsideTheApp = (handleDeeplinkInsideApp == true)

      lightModeAccentColorTint = lightModeAccentColorData?.getString("tint") ?: null
      lightModeAccentColorType = lightModeAccentColorData?.getString("type") ?: null
      lightModeAccentColorHex = lightModeAccentColorData?.getString("hex") ?: null

      darkModeAccentColorTint = darkModeAccentColorData?.getString("tint") ?: null
      darkModeAccentColorType = darkModeAccentColorData?.getString("type") ?: null
      darkModeAccentColorHex = darkModeAccentColorData?.getString("hex") ?: null

      isDarkModeEnabledForClient = isDarkModeEnabled ?: false
      this.shouldToggleThemeDelegate = shouldToggleThemeDelegate ?: true

      val fontMapping = fontData?.getMap("fontMapping")

      if (isInitialized) return

      ChatSdk.initialize(
        context as Application, initInterface = object : ChatSDKInitCommunicator {
          override suspend fun getAccessTokenData(payloadArgs: HashMap<String, String>?): ChatSdkAccessTokenData {
            return ChatSdkAccessTokenData(
              currentAccessToken ?: "",
              httpCode ?: -1
            )
          }

          override fun getBusinessContext(payloadArgs: HashMap<String, String>?): BusinessContext {
            return BusinessContext(
              channelHandle = channelHandle,
              ticketGroupingId = ticketGroupingId,
              ticketID = ticketID,
              ticketProperties = ticketProperties,
              botProperties = botProperties
            )
          }

          override suspend fun getRefreshToken(payloadArgs: HashMap<String, String>?): String {
            return currentAccessToken ?: ""
          }

          override fun getTextAppearance(fontWeight: Int): Int? {

            if (fontMapping == null || reactContext.currentActivity == null) return null

            val styleName = when (fontWeight) {
              100 -> fontMapping.getString("thin")
              200 -> fontMapping.getString("extralight")
              300 -> fontMapping.getString("light")
              400 -> fontMapping.getString("regular")
              500 -> fontMapping.getString("medium")
              600 -> fontMapping.getString("semibold")
              700 -> fontMapping.getString("bold")
              800 -> fontMapping.getString("extrabold")
              else -> null
            }

            Log.i("ChatSampleApp", "Style name : ${styleName}")

            val resolvedStyle =
              getStyleResourceId(reactContext.currentActivity, styleName?.replace(Regex("[^A-Za-z0-9]"), ""))
            return resolvedStyle
          }

          override fun triggerDeeplinkInApp(context: Context, url: String?, bundle: Bundle?) {
            triggerDeeplinkInApp(context, url, bundle, "triggerDeeplinkInApp")
          }

          override fun isDarkModeEnabled(): Boolean {

            if (shouldToggleThemeDelegate == true) {
              Log.i("ChatSampleApp", "Setting AppCompatDelegate to $isDarkModeEnabledForClient")
              when (isDarkModeEnabledForClient) {
                true -> {
                  AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES)
                }
                else -> {
                  AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO)
                }
              }
            }

            Log.i("ChatSampleApp", "Returning isDarkModeEnabledForClient: $isDarkModeEnabledForClient")
            return isDarkModeEnabledForClient
          }

          override fun onChatExit(isChatResolved: Boolean, lastChatDeeplink: String) {
            sendEventToJS(method = "onChatScreenClosed")
          }

        }, initConfig = ChatSdkInitConfig(
          namespace = nameSpace ?: "",
          handleDeeplinkInApp = handleDeeplinkInsideTheApp ?: false,
          lightModeAccentColorData = ColorData(
            type = lightModeAccentColorType,
            tint = lightModeAccentColorTint,
            hex = lightModeAccentColorHex
          ),
          darkModeAccentColorData = ColorData(
            type = darkModeAccentColorType,
            tint = darkModeAccentColorTint,
            hex = darkModeAccentColorHex
          )
        )
      )

      isInitialized = true
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("NUGGET_SDK_INIT_ERROR", e.message, e)
    }
  }

  private fun getStyleResourceId(context: Context?, styleName: String?): Int? {
    if (context == null || styleName == null) return null
    return context.resources.getIdentifier(styleName, "style", context.packageName)
  }

  private fun triggerDeeplinkInApp(
    context: Context,
    url: String?,
    bundle: Bundle?,
    method: String
  ) {
    val deferred = CompletableDeferred<ReadableMap>()
    pendingResponses[method] = deferred

    val payload = Arguments.createMap().apply {
      putString("deeplink", url)
    }
    sendEventToJS(method, payload)
  }

  private fun requestAuthInfo(method: String) {
    val deferred = CompletableDeferred<ReadableMap>()
    pendingResponses[method] = deferred
    sendEventToJS(method)
  }

  private fun sendEventToJS(method: String, payload: WritableMap? = null) {
    val params = Arguments.createMap().apply {
      putString("method", method)
      if (payload != null) putMap("payload", payload)
    }

    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("OnNativeRequest", params)
  }

  @ReactMethod
  fun onJsResponse(method: String, payload: ReadableMap) {
    Log.i("ChatSampleApp", "Received response for method: ${method} and payload : ${payload}")

    if (method == "requiresAuthInfo") {
      this.currentAccessToken = payload?.getString("accessToken") ?: ""
      this.httpCode = payload?.getInt("httpCode") ?: -1
      Log.i(
        "ChatSampleApp",
        "Received access token as : ${this.currentAccessToken} , httpcode as : ${this.httpCode}"
      )
    }

    pendingResponses[method]?.complete(payload)
    pendingResponses.remove(method)
  }

  @ReactMethod
  fun updateNotificationToken(token: String) {
    notificationToken = token
    syncFcmToken()
  }

  @ReactMethod
  fun updateNotificationPermissionStatus(notificationAllowed: Boolean) {
    this.notificationAllowed = notificationAllowed
  }

  private fun syncFcmToken() {
    if (notificationToken.isNullOrBlank()) {
      Log.i("ChatSampleApp", "Skipping notification sync: token is null/blank")
      return
    }
    Log.i(
      "ChatSampleApp",
      "Synced notification state to SDK. token=$notificationToken enabled=$notificationAllowed"
    )
    ChatFCMTokenManager.syncFCMTokenWithServer(
      notificationData = ChatSdkNotificationsData(
        token = notificationToken,
        notificationEnabled = notificationAllowed
      )
    )
  }

  @ReactMethod
  fun sendNotificationPayload(payload: ReadableMap) {
    try {
      val result = HashMap<String, String>()
      val iterator = payload.keySetIterator()

      while (iterator.hasNextKey()) {
        val key = iterator.nextKey()

        payload.getString(key)?.let {
          result[key] = it
        }
      }

      notificationPayload = result
      syncNotificationPayload()

    } catch (throwable: Throwable) {
      Log.e(
        "ChatSampleApp",
        "Failed to process notification payload: ${throwable.message}",
        throwable
      )
    }
  }

  private fun syncNotificationPayload() {
    if (notificationPayload.isNullOrEmpty()) {
      Log.i("ChatSampleApp", "Skipping notification payload sync: payload is null/empty")
      return
    }

    val payload = notificationPayload ?: hashMapOf()
    if (!ChatSdkNotificationUtil.isChatSdkNotification(payload)) {
      Log.i(
        "ChatSampleApp",
        "Skipping notification payload sync: not a Nugget notification (payload=$payload)"
      )
      return
    }

    Log.i(
      "ChatSampleApp",
      "Sent notification payload to SDK. payload=$payload"
    )

    val context = reactContext.applicationContext
    val deeplink = payload["deeplink"]
    val nuggetDeeplinkRouter = Intent(context, ChatSDKDeepLinkRouter::class.java).apply {
      putExtra("uri", deeplink)
    }
    val appIcon = context.applicationInfo.icon

    ChatSdkNotificationUtil.generateNotification(
      context = context,
      data = payload,
      clientDeeplinkRouter = nuggetDeeplinkRouter,
      smallIcon = appIcon,
      largeIcon = appIcon,
      color = ChatUiKit.getColor(context, com.zomato.chatsdk.R.color.sushi_zred)
    )
  }

  @ReactMethod
  fun openNuggetSDK(deeplink: String, shouldPresent: Boolean, promise: Promise) {
    try {
      val activity = reactContext.currentActivity ?: run {
        promise.reject("NO_ACTIVITY", "Current activity is null")
        return
      }

      Log.i("ChatSampleApp", "Launching NuggetSDK from $activity")

      val intent = Intent(activity, ChatSDKDeepLinkRouter::class.java).apply {
        putExtra("uri", deeplink)
      }
      activity.startActivity(intent)
      promise.resolve(true)
    } catch (e: Exception) {
      Log.e("ChatSampleApp", "Error opening chat: ${e.message}", e)
      promise.reject("OPEN_SDK_ERROR", "Failed to open Nugget SDK", e)
    }
  }


  @ReactMethod
  fun updateBusinessContext(businessContext: ReadableMap?) {
    channelHandle = businessContext?.getString("channelHandle")
    ticketGroupingId = businessContext?.getString("ticketGroupingId")
    ticketID = getTicketIdFromBusinessContext(businessContext)
    botProperties = resolveCustomProperties(key = "botProperties", map = businessContext)
    ticketProperties = resolveCustomProperties(key = "ticketProperties", map = businessContext)
    themeId = businessContext?.getString("themeId")
    Log.i(
      "ChatSampleApp",
      "Bot properties from business context : ${botProperties} ticketProperties : ${ticketProperties} ticketID : ${ticketID} themeId : ${themeId}"
    )
  }

  private fun getTicketIdFromBusinessContext(businessContext: ReadableMap?): Long? {
    return if (businessContext?.hasKey("ticketID") == true && !businessContext.isNull("ticketID")) {
      businessContext.getDouble("ticketID").toLong()
    } else {
      null
    }
  }

  @ReactMethod
  fun canOpenDeeplink(deeplink: String) {
    // no-op
  }

  override fun onActivityResult(
    activity: Activity,
    requestCode: Int,
    resultCode: Int,
    data: Intent?
  ) {
  }

  override fun onNewIntent(intent: Intent) {}

  private fun resolveCustomProperties(
    key: String,
    map: ReadableMap?
  ): HashMap<String, ArrayList<String>> {

    val outerMap: ReadableMap? = map?.getMap(key)

    if (outerMap == null) return hashMapOf()

    val iterator = outerMap.keySetIterator()
    val resultMap = hashMapOf<String, ArrayList<String>>()

    while (iterator.hasNextKey()) {
      val key = iterator.nextKey()
      val readableArray: ReadableArray? = outerMap.getArray(key)

      if (readableArray != null) {
        val list = ArrayList<String>()
        for (i in 0 until readableArray.size()) {
          val item = readableArray.getString(i)
          if (item != null) {
            list.add(item)
          }
        }
        resultMap[key] = list
      }
    }

    return resultMap

  }

}
