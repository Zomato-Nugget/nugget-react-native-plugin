import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import type { LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

/** The app's screens, with deeplinks routed to them. */
export function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={NuggetMockScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
