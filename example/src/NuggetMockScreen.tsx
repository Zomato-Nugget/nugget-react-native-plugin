import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Image,
  PermissionsAndroid,
  Platform,
  Linking,
} from 'react-native';
import { NuggetSDK } from 'nugget-rn';
import { useNuggetSDK } from './components/NuggetSDKProvider';
import { styles } from './NuggetMockScreen.styles';
import { colors } from './theme';

function GradientBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.purpleDark }]} />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: colors.purpleMid,
            opacity: 0.6,
            borderBottomLeftRadius: 300,
            borderBottomRightRadius: 300,
            top: -100,
          },
        ]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: colors.purpleLight,
            opacity: 0.25,
            borderRadius: 400,
            top: -200,
            left: -80,
            right: -80,
          },
        ]}
      />
    </View>
  );
}

interface ActionButtonProps {
  label: string;
  sublabel?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
}

function ActionButton({ label, sublabel, onPress, variant = 'primary' }: ActionButtonProps) {
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';
  return (
    <TouchableOpacity
      style={[styles.button, isPrimary ? styles.buttonPrimary : isGhost ? styles.buttonGhost : styles.buttonSecondary]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.buttonText, isGhost && styles.buttonTextGhost]}>{label}</Text>
      {sublabel ? <Text style={styles.buttonSublabel}>{sublabel}</Text> : null}
    </TouchableOpacity>
  );
}

export default function NuggetMockScreen() {
  const [result, setResult] = useState<string>('');
  const [lastToken, setLastToken] = useState<string>('Not updated yet');
  const [permissionStatus, setPermissionStatus] = useState<'allowed' | 'denied' | 'unknown'>(
    'unknown'
  );
  const { sdk } = useNuggetSDK();
  const chatDeeplink =
    'nugget://unified-support/conversation?flowType=ticketing&omniTicketingFlow=true';

  const openNuggetSDKPush = async () => {
    try {
      const opened = await sdk.openNuggetSDK(chatDeeplink, false);
      setResult(opened ? 'Opened via push' : 'Failed to open SDK');
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const openNuggetSDKPresent = async () => {
    try {
      const opened = await sdk.openNuggetSDK(chatDeeplink, true);
      setResult(opened ? 'Opened via present' : 'Failed to open SDK');
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const verifyDeeplink = async () => {
    try {
      const canOpen = await sdk.canOpenDeeplink(chatDeeplink);
      setResult(`Deeplink valid: ${canOpen}`);
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const updateToken = () => {
    const mockToken = `sample-token-${Date.now()}`;
    NuggetSDK.updateNotificationToken(mockToken);
    setLastToken(mockToken);
    setResult('Notification token updated');
    console.log(`[NuggetMockScreen] Token updated: ${mockToken}`);
  };

  const setNotificationPermission = (allowed: boolean) => {
    if (Platform.OS !== 'android') {
      setResult('Notification permission handling from this screen is Android-only');
      console.log('[NuggetMockScreen] Ignored permission update on non-Android platform');
      return;
    }
    NuggetSDK.updateNotificationPermissionStatus(allowed);
    setPermissionStatus(allowed ? 'allowed' : 'denied');
    setResult(`Notification permission: ${allowed ? 'allowed' : 'denied'}`);
    console.log(`[NuggetMockScreen] Permission updated: ${allowed ? 'allowed' : 'denied'}`);
  };

  const allowNotifications = async () => {
    if (Platform.OS !== 'android') return;

    if (Platform.Version < 33) {
      setNotificationPermission(true);
      console.log('[NuggetMockScreen] Android < 13, POST_NOTIFICATIONS not required');
      return;
    }

    try {
      const postNotificationsPermission = 'android.permission.POST_NOTIFICATIONS';
      const alreadyGranted = await PermissionsAndroid.check(postNotificationsPermission as any);
      console.log(
        `[NuggetMockScreen] Android POST_NOTIFICATIONS already granted: ${alreadyGranted}`
      );

      if (alreadyGranted) {
        setNotificationPermission(true);
        setResult('Notification permission already granted');
        return;
      }

      const status = await PermissionsAndroid.request(postNotificationsPermission as any);
      const allowed = status === PermissionsAndroid.RESULTS.GRANTED;
      setNotificationPermission(allowed);
      console.log(`[NuggetMockScreen] Android POST_NOTIFICATIONS result: ${status}`);

      if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        setResult('Notifications blocked with "Don’t ask again". Open app settings to enable.');
        console.log('[NuggetMockScreen] Notification permission set to never_ask_again');
        Linking.openSettings();
      }
    } catch (error) {
      console.log('[NuggetMockScreen] Permission request failed', error);
      setResult('Failed to request Android notification permission');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <GradientBackground />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Image
                source={require('./assets/nugget_logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>nugget</Text>
            <Text style={styles.subtitle}>by Zomato</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>SDK Playground</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Open Chat Screen</Text>
            <Text style={styles.cardDesc}>Choose how to navigate to the Nugget chat</Text>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.halfButton, styles.buttonPrimary]} onPress={openNuggetSDKPush} activeOpacity={0.75}>
                <Text style={styles.halfButtonIcon}>⬅</Text>
                <Text style={styles.buttonText}>Push</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.halfButton, styles.buttonAccent]} onPress={openNuggetSDKPresent} activeOpacity={0.75}>
                <Text style={styles.halfButtonIcon}>⬆</Text>
                <Text style={styles.buttonText}>Present</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Utilities</Text>
            <ActionButton label="Verify Deeplink" sublabel="Check if deeplink is valid" onPress={verifyDeeplink} variant="secondary" />
            <ActionButton
              label="Update Push Token"
              sublabel={`Token: ${lastToken}`}
              onPress={updateToken}
              variant="ghost"
            />
            <ActionButton
              label="Allow Notifications"
            sublabel={
              Platform.OS === 'android'
                ? `Permission status: ${permissionStatus}`
                : 'Android only'
            }
              onPress={allowNotifications}
              variant="ghost"
            />
            <ActionButton
              label="Deny Notifications"
            sublabel={
              Platform.OS === 'android'
                ? `Permission status: ${permissionStatus}`
                : 'Android only'
            }
              onPress={() => setNotificationPermission(false)}
              variant="ghost"
            />
          </View>

          {result !== '' && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultDot}>●</Text>
              <Text style={styles.resultText}>{result}</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
