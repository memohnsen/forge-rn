import { ClerkLoaded, ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { createClerkSupabaseClient } from '@/services/supabase';
import { SplashScreen } from '@/components/SplashScreen';
import { View } from 'react-native';

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
  const [hasCompletedPreAuthOnboarding, setHasCompletedPreAuthOnboarding] =
    useState<boolean | null>(null);
  const [splashMinDone, setSplashMinDone] = useState(false);
  const [targetGroup, setTargetGroup] = useState<string | null>(null);
  const [routeReady, setRouteReady] = useState(false);

  // User-scoped key to prevent cross-account onboarding status leaks
  const getOnboardingKey = useCallback(
    (uid: string) => `hasSeenOnboarding_${uid}`,
    []
  );
  const getForceOnboardingKey = useCallback(
    (uid: string) => `forceOnboarding_${uid}`,
    []
  );
  const preAuthOnboardingKey = 'hasSeenOnboarding_device';

  const checkPreAuthOnboardingStatus = useCallback(async () => {
    try {
      const cachedStatus = await SecureStore.getItemAsync(preAuthOnboardingKey);
      setHasCompletedPreAuthOnboarding(cachedStatus === 'true');
    } catch (err) {
      console.error('Error checking pre-auth onboarding status:', err);
      setHasCompletedPreAuthOnboarding(false);
    } finally {
      setIsCheckingOnboarding(false);
    }
  }, []);

  const checkOnboardingStatus = useCallback(async () => {
    if (!userId) {
      setIsCheckingOnboarding(false);
      return;
    }

    const onboardingKey = getOnboardingKey(userId);
    const forceOnboardingKey = getForceOnboardingKey(userId);

    try {
      const forceOnboarding = await SecureStore.getItemAsync(forceOnboardingKey);
      if (forceOnboarding === 'true') {
        setHasCompletedOnboarding(false);
        setIsCheckingOnboarding(false);
        return;
      }

      // First check local storage for cached onboarding status (user-scoped)
      const cachedStatus = await SecureStore.getItemAsync(onboardingKey);
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
        await SecureStore.setItemAsync(onboardingKey, 'true');
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
  }, [userId, getToken, getOnboardingKey]);

  useEffect(() => {
    if (isSignedIn && userId) {
      checkOnboardingStatus();
    } else {
      setHasCompletedOnboarding(null);
      checkPreAuthOnboardingStatus();
    }
  }, [isSignedIn, userId, checkOnboardingStatus, checkPreAuthOnboardingStatus]);

  // Keep splash visible for at least 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashMinDone(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoaded || isCheckingOnboarding) return;

    if (isSignedIn) {
      if (hasCompletedOnboarding === false) {
        setTargetGroup('(onboarding)');
      } else if (hasCompletedOnboarding === true) {
        setTargetGroup('(tabs)');
      } else {
        setTargetGroup(null);
      }
    } else {
      if (hasCompletedPreAuthOnboarding === true) {
        setTargetGroup('(auth)');
      } else {
        setTargetGroup('(onboarding)');
      }
    }
  }, [
    isLoaded,
    isSignedIn,
    isCheckingOnboarding,
    hasCompletedOnboarding,
    hasCompletedPreAuthOnboarding,
  ]);

  useEffect(() => {
    if (!targetGroup) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (targetGroup === '(auth)') {
      if (!inAuthGroup) router.replace('/(auth)/sign-in');
    } else if (targetGroup === '(onboarding)') {
      if (!inOnboardingGroup) router.replace('/(onboarding)');
    } else if (targetGroup === '(tabs)') {
      if (!inTabsGroup) router.replace('/(tabs)');
    }

    if (
      (targetGroup === '(auth)' && inAuthGroup) ||
      (targetGroup === '(onboarding)' && inOnboardingGroup) ||
      (targetGroup === '(tabs)' && inTabsGroup)
    ) {
      setRouteReady(true);
    } else {
      setRouteReady(false);
    }
  }, [segments, targetGroup]);

  const showSplashOverlay = !isLoaded || isCheckingOnboarding || !splashMinDone || !routeReady;

  return (
    <View style={{ flex: 1 }}>
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
      {showSplashOverlay ? <SplashScreen /> : null}
    </View>
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
