import React from 'react';
import { NuggetSDKProvider } from './components/NuggetSDKProvider';
import { AppNavigator } from './navigation';

export default function App() {
  return (
    <NuggetSDKProvider nameSpace="example-namespace">
      <AppNavigator />
    </NuggetSDKProvider>
  );
}
