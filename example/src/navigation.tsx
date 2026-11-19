import React, { useMemo } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import type { LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNuggetSDK } from './components/NuggetSDKProvider';
import NuggetMockScreen from './NuggetMockScreen';

/** The app's screens, and the params each one takes. */
type RootStackParamList = {
  Home: undefined;
};

/**
 * The scheme of this app's deeplinks, registered in `Info.plist` (iOS) and `AndroidManifest.xml`
 * (Android).
 */
const APP_PREFIX = 'nuggetrnexample://';

/**
 * Maps this app's deeplinks to its screens: `nuggetrnexample://home` opens `Home`.
 *
 * React Navigation listens for incoming links and navigates on its own.
 */
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [APP_PREFIX],
  config: {
    screens: {
      Home: 'home',
    },
  },
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/** The app's screens, with deeplinks routed to them. Render it inside `NuggetSDKProvider`. */
export function AppNavigator() {
  const { sdk } = useNuggetSDK();

  // A link tapped inside the Nugget chat arrives like any other link. On iOS the chat sits above
  // every React Native screen, so close it before React Navigation navigates, or the screen opens
  // hidden underneath it. `subscribe` replaces React Navigation's link listener to do that.
  const linkingThatClosesChat = useMemo<LinkingOptions<RootStackParamList>>(
    () => ({
      ...linking,
      subscribe(listener) {
        const subscription = Linking.addEventListener('url', async ({ url }) => {
          if (url.startsWith(APP_PREFIX)) {
            // Resolves to false, and does nothing, when no chat is open and on Android.
            await sdk.closeNuggetSDK();
          }
          // Hand the link to React Navigation, which navigates to its screen.
          listener(url);
        });
        return () => subscription.remove();
      },
    }),
    [sdk]
  );

  return (
    <NavigationContainer linking={linkingThatClosesChat}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={NuggetMockScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
