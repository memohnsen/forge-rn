import { SplashScreen } from '@/components/SplashScreen';
import { RevenueCatProvider, useRevenueCatContext } from '@/contexts/RevenueCatContext';
import { useEasUpdates } from '@/hooks/use-eas-updates';
import {
  identifyUser,
  posthog,
  resetAnalytics,
  trackAppOpened,
  trackTabSwitched,
  trackUserSignedOut,
} from '@/utils/analytics';
import { ClerkLoaded, ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { ConvexReactClient, useQuery } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { api } from '@/convex/_generated/api';

export const convexClient = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL!
);
import * as Sentry from '@sentry/react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { PostHogProvider } from 'posthog-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

Sentry.init({
  dsn: 'https://83000146970b6f3f4b2b92bfa83d998c@o4510884729847808.ingest.us.sentry.io/4510909168680960',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
  // We recommend adjusting this value in production.
  tracesSampleRate: 1.0,
  // profilesSampleRate is relative to tracesSampleRate.
  // Here, we'll capture profiles for 100% of transactions.
  profilesSampleRate: 1.0,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

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
  const { hasProAccess, isEntitlementsLoading, isRevenueCatEnabled } = useRevenueCatContext();
  const segments = useSegments();
  const router = useRouter();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [hasCompletedPreAuthOnboarding, setHasCompletedPreAuthOnboarding] =
    useState<boolean | null>(null);

  // Reactive Convex query — returns undefined while loading, null if not found
  const convexUser = useQuery(
    api.users.getByUserId,
    isSignedIn && userId ? { userId } : 'skip'
  );
  const [splashMinDone, setSplashMinDone] = useState(false);
  const [targetGroup, setTargetGroup] = useState<string | null>(null);
  const [routeReady, setRouteReady] = useState(false);
  const lastTabRef = useRef<string | null>(null);
  const prevSignedInRef = useRef<boolean | null>(null);
  const hasTrackedAppOpenRef = useRef(false);

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

      // convexUser is still loading — wait for it to resolve
      if (convexUser === undefined) return;

      if (convexUser !== null) {
        // User exists in Convex, they've completed onboarding
        await SecureStore.setItemAsync(onboardingKey, 'true');
        setHasCompletedOnboarding(true);
      } else {
        // User doesn't exist yet, needs onboarding
        setHasCompletedOnboarding(false);
      }
    } catch (err) {
      console.error('Error checking onboarding status:', err);
      setHasCompletedOnboarding(false);
    } finally {
      setIsCheckingOnboarding(false);
    }
  }, [userId, getOnboardingKey, getForceOnboardingKey, convexUser]);

  useEffect(() => {
    if (isSignedIn && userId) {
      checkOnboardingStatus();
    } else {
      setHasCompletedOnboarding(null);
      checkPreAuthOnboardingStatus();
    }
  }, [isSignedIn, userId, checkOnboardingStatus, checkPreAuthOnboardingStatus]);

  useEffect(() => {
    if (!hasTrackedAppOpenRef.current) {
      trackAppOpened(false);
      hasTrackedAppOpenRef.current = true;
    }
  }, []);

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
        if (!isRevenueCatEnabled) {
          setTargetGroup('(tabs)');
        } else if (isEntitlementsLoading) {
          setTargetGroup(null);
        } else {
          setTargetGroup(hasProAccess ? '(tabs)' : '(paywall)');
        }
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
    hasCompletedOnboarding,
    hasCompletedPreAuthOnboarding,
    hasProAccess,
    isCheckingOnboarding,
    isEntitlementsLoading,
    isLoaded,
    isRevenueCatEnabled,
    isSignedIn,
  ]);

  useEffect(() => {
    if (!targetGroup) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inPaywallGroup = segments[0] === '(paywall)';
    const inAuthedGroup =
      segments[0] === '(tabs)' ||
      segments[0] === 'check-in' ||
      segments[0] === 'workout' ||
      segments[0] === 'competition' ||
      segments[0] === 'history' ||
      segments[0] === 'trends' ||
      segments[0] === 'exercises' ||
      segments[0] === 'settings' ||
      segments[0] === 'profile';

    if (targetGroup === '(auth)') {
      if (!inAuthGroup) router.replace('/(auth)/sign-in');
    } else if (targetGroup === '(onboarding)') {
      if (!inOnboardingGroup) router.replace('/(onboarding)');
    } else if (targetGroup === '(paywall)') {
      if (!inPaywallGroup) router.replace('/(paywall)');
    } else if (targetGroup === '(tabs)') {
      if (!inAuthedGroup) router.replace('/(tabs)');
    }

    if (
      (targetGroup === '(auth)' && inAuthGroup) ||
      (targetGroup === '(onboarding)' && inOnboardingGroup) ||
      (targetGroup === '(paywall)' && inPaywallGroup) ||
      (targetGroup === '(tabs)' && inAuthedGroup)
    ) {
      setRouteReady(true);
    } else {
      setRouteReady(false);
    }
  }, [segments, targetGroup]);

  useEffect(() => {
    if (!isLoaded) return;
    const previous = prevSignedInRef.current;
    if (previous === null) {
      prevSignedInRef.current = isSignedIn;
    } else if (previous !== isSignedIn) {
      if (isSignedIn) {
        identifyUser(userId ?? undefined);
      } else {
        trackUserSignedOut();
        resetAnalytics();
      }
      prevSignedInRef.current = isSignedIn;
    } else if (isSignedIn && userId) {
      identifyUser(userId);
    }
  }, [isLoaded, isSignedIn, userId]);

  useEffect(() => {
    if (segments[0] !== '(tabs)') return;
    const currentTab = segments[1] ?? 'index';
    const previousTab = lastTabRef.current;
    if (previousTab && previousTab !== currentTab) {
      trackTabSwitched(previousTab, currentTab);
    }
    lastTabRef.current = currentTab;
  }, [segments]);

  const isCheckingSubscription =
    isSignedIn && hasCompletedOnboarding === true && isRevenueCatEnabled && isEntitlementsLoading;
  const showSplashOverlay =
    !isLoaded || isCheckingOnboarding || isCheckingSubscription || !splashMinDone || !routeReady;

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(paywall)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="check-in" options={{ presentation: 'card' }} />
        <Stack.Screen name="workout" options={{ presentation: 'card' }} />
        <Stack.Screen name="competition" options={{ presentation: 'card' }} />
        <Stack.Screen name="history" options={{ presentation: 'card' }} />
        <Stack.Screen name="trends" options={{ presentation: 'card' }} />
        <Stack.Screen name="exercises" options={{ presentation: 'card' }} />
        <Stack.Screen name="profile" options={{ presentation: 'card' }} />
      </Stack>
      {showSplashOverlay ? (
        <View style={styles.splashOverlay}>
          <SplashScreen />
        </View>
      ) : null}
    </View>
  );
}

export default Sentry.wrap(function RootLayout() {
  useEasUpdates();

  const content = (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
          <RevenueCatProvider>
            <InitialLayout />
          </RevenueCatProvider>
        </ConvexProviderWithClerk>
      </ClerkLoaded>
    </ClerkProvider>
  );

  if (!posthog) {
    return content;
  }

  return <PostHogProvider client={posthog}>{content}</PostHogProvider>;
});

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});