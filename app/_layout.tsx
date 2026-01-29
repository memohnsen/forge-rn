import { ClerkLoaded, ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { createClerkSupabaseClient } from '@/services/supabase';

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
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  const checkOnboardingStatus = useCallback(async () => {
    if (!userId) {
      setIsCheckingOnboarding(false);
      return;
    }

    try {
      // First check local storage for cached onboarding status
      const cachedStatus = await SecureStore.getItemAsync('hasSeenOnboarding');
      if (cachedStatus === 'true') {
        setHasCompletedOnboarding(true);
        setIsCheckingOnboarding(false);
        return;
      }

      // Check if user exists in database (meaning they've completed onboarding)
      const supabase = createClerkSupabaseClient(async () => {
        return getToken({ template: 'supabase', skipCache: true });
      });

      const { data, error } = await supabase
        .from('journal_users')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      if (data && !error) {
        // User exists in DB, they've completed onboarding
        await SecureStore.setItemAsync('hasSeenOnboarding', 'true');
        setHasCompletedOnboarding(true);
      } else {
        // User doesn't exist, needs onboarding
        setHasCompletedOnboarding(false);
      }
    } catch (err) {
      console.error('Error checking onboarding status:', err);
      setHasCompletedOnboarding(false);
    } finally {
      setIsCheckingOnboarding(false);
    }
  }, [userId, getToken]);

  useEffect(() => {
    if (isSignedIn && userId) {
      checkOnboardingStatus();
    } else {
      setIsCheckingOnboarding(false);
      setHasCompletedOnboarding(null);
    }
  }, [isSignedIn, userId, checkOnboardingStatus]);

  useEffect(() => {
    if (!isLoaded || isCheckingOnboarding) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (isSignedIn) {
      if (hasCompletedOnboarding === false && !inOnboardingGroup) {
        // Signed in but hasn't completed onboarding
        router.replace('/(onboarding)');
      } else if (hasCompletedOnboarding === true && (inAuthGroup || inOnboardingGroup)) {
        // Signed in and completed onboarding, go to main app
        router.replace('/(tabs)');
      }
    } else if (!inAuthGroup) {
      // Not signed in and not on auth screen, redirect to sign in
      router.replace('/(auth)/sign-in');
    }
  }, [isLoaded, isSignedIn, segments, isCheckingOnboarding, hasCompletedOnboarding]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
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
