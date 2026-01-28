import { ClerkLoaded, ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import Purchases from 'react-native-purchases';

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
}

function InitialLayout() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isRevenueCatConfigured, setIsRevenueCatConfigured] = useState(false);

  // Initialize RevenueCat
  useEffect(() => {
    const revenuecatKey = process.env.EXPO_PUBLIC_REVENUECAT_KEY;
    if (revenuecatKey) {
      try {
        Purchases.configure({ apiKey: revenuecatKey });
        setIsRevenueCatConfigured(true);
      } catch (error) {
        console.error('Error configuring RevenueCat:', error);
      }
    } else {
      console.warn('Missing EXPO_PUBLIC_REVENUECAT_KEY; skipping RevenueCat configuration.');
    }
  }, []);

  // Login user to RevenueCat when authenticated
  useEffect(() => {
    if (userId && isRevenueCatConfigured) {
      Purchases.logIn(userId)
        .then(({ customerInfo, created }) => {
          console.log('Logged in to RevenueCat with user ID:', userId);
          console.log('New user created:', created);
        })
        .catch((error) => {
          console.error('Error logging in to RevenueCat:', error);
        });
    }
  }, [userId, isRevenueCatConfigured]);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isSignedIn && inAuthGroup) {
      // Signed in but on auth screen, redirect to main app
      router.replace('/(tabs)');
    } else if (!isSignedIn && !inAuthGroup) {
      // Not signed in and not on auth screen, redirect to sign in
      router.replace('/(auth)/sign-in');
    }
  }, [isLoaded, isSignedIn, segments]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="check-in" options={{ presentation: 'card' }} />
      <Stack.Screen name="workout" options={{ presentation: 'card' }} />
      <Stack.Screen name="competition" options={{ presentation: 'card' }} />
      <Stack.Screen name="history" options={{ presentation: 'card' }} />
      <Stack.Screen name="trends" options={{ presentation: 'card' }} />
      <Stack.Screen name="exercises" options={{ presentation: 'card' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <InitialLayout />
      </ClerkLoaded>
    </ClerkProvider>
  );
}
