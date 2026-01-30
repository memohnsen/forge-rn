import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import Purchases from 'react-native-purchases';

const revenueCatApiKey = process.env.EXPO_PUBLIC_REVENUECAT_KEY;

export const useRevenueCat = () => {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const configuredRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!isLoaded) return;
    if (!revenueCatApiKey) {
      if (__DEV__) {
        console.warn('[RevenueCat] Missing EXPO_PUBLIC_REVENUECAT_KEY');
      }
      return;
    }

    if (!configuredRef.current) {
      Purchases.configure({ apiKey: revenueCatApiKey });
      configuredRef.current = true;
    }

    if (isSignedIn && userId) {
      Purchases.logIn(userId).catch((error) => {
        console.warn('[RevenueCat] logIn failed', error);
      });
    } else if (configuredRef.current) {
      Purchases.logOut().catch((error) => {
        console.warn('[RevenueCat] logOut failed', error);
      });
    }
  }, [isLoaded, isSignedIn, userId]);
};
