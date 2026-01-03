import React, { useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, setNavigationRef } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator'; // Import the main navigator
import { SafeAreaProvider } from 'react-native-safe-area-context'; // Recommended provider
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/navigation/navigationRef';
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "https://09d1d686c05d44f9838987ab68b2e77e@o4509909415034880.ingest.us.sentry.io/4509909425651712",
  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,
});


export default function App() {

  return (
    <SafeAreaProvider>{/* Recommended for handling safe areas */}
      <AuthProvider>
        <NavigationContainer 
          ref={navigationRef}
        >
          <AppNavigator />
        </NavigationContainer>
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}