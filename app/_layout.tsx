import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { clerkPublishableKey, clerkTokenCache } from '@/services/clerk';

if (!clerkPublishableKey) {
  console.warn('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={clerkTokenCache}>
          <ClerkLoaded>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            </Stack>
            <StatusBar style="auto" />
          </ClerkLoaded>
        </ClerkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
