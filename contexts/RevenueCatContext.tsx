import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@clerk/clerk-expo';
import Purchases, { CustomerInfo, CustomerInfoUpdateListener } from 'react-native-purchases';
import { useRevenueCat } from '@/hooks/use-revenuecat';
import { devConfig } from '@/constants/dev-config';

type RevenueCatContextValue = {
  customerInfo: CustomerInfo | null;
  hasProAccess: boolean;
  isEntitlementsLoading: boolean;
  isRevenueCatEnabled: boolean;
  errorMessage: string | null;
  refreshCustomerInfo: () => Promise<boolean>;
  updateCustomerInfo: (info: CustomerInfo) => boolean;
};

const RevenueCatContext = createContext<RevenueCatContextValue | undefined>(undefined);

const revenueCatApiKey = process.env.EXPO_PUBLIC_REVENUECAT_KEY;

const hasActiveEntitlements = (info?: CustomerInfo | null) => {
  if (!info) return false;
  const active = info.entitlements?.active ?? {};
  return Object.keys(active).length > 0;
};

export const RevenueCatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn, userId } = useAuth();
  useRevenueCat();

  const isRevenueCatEnabled = Platform.OS !== 'web' && Boolean(revenueCatApiKey);
  const hasDevSubOverride = devConfig.subStatusOverride !== null;
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [hasProAccess, setHasProAccess] = useState(devConfig.subStatusOverride ?? false);
  const [isEntitlementsLoading, setIsEntitlementsLoading] = useState(isRevenueCatEnabled);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const previousUserIdRef = useRef<string | null>(null);

  const getCacheKey = useCallback((uid: string) => `cachedHasProAccess_${uid}`, []);

  const updateCustomerInfo = useCallback(
    (info: CustomerInfo) => {
      const active = hasActiveEntitlements(info);
      setCustomerInfo(info);
      setHasProAccess(active);
      if (userId) {
        SecureStore.setItemAsync(getCacheKey(userId), active ? 'true' : 'false').catch(() => {});
      }
      return active;
    },
    [getCacheKey, userId]
  );

  const refreshCustomerInfo = useCallback(async () => {
    if (hasDevSubOverride) {
      return devConfig.subStatusOverride ?? false;
    }
    if (!isRevenueCatEnabled) return true;
    if (!userId) return false;

    setIsEntitlementsLoading(true);
    setErrorMessage(null);

    try {
      const info = await Purchases.getCustomerInfo();
      return updateCustomerInfo(info);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to load subscription status.';
      setErrorMessage(message);
      return hasProAccess;
    } finally {
      setIsEntitlementsLoading(false);
    }
  }, [hasDevSubOverride, hasProAccess, isRevenueCatEnabled, updateCustomerInfo, userId]);

  useEffect(() => {
    if (!isLoaded) return;

    const previousUserId = previousUserIdRef.current;
    if (previousUserId && previousUserId !== userId) {
      SecureStore.deleteItemAsync(getCacheKey(previousUserId)).catch(() => {});
    }

    previousUserIdRef.current = userId ?? null;

    if (!isSignedIn || !userId) {
      setCustomerInfo(null);
      setHasProAccess(devConfig.subStatusOverride ?? false);
      setIsEntitlementsLoading(false);
      return;
    }

    if (hasDevSubOverride) {
      setHasProAccess(devConfig.subStatusOverride ?? false);
      setIsEntitlementsLoading(false);
      return;
    }

    if (!isRevenueCatEnabled) {
      setHasProAccess(true);
      setIsEntitlementsLoading(false);
      return;
    }

    setIsEntitlementsLoading(true);
    let isActive = true;

    (async () => {
      try {
        const cached = await SecureStore.getItemAsync(getCacheKey(userId));
        if (isActive && cached != null) {
          setHasProAccess(cached === 'true');
        }
      } catch {
        // Ignore cache read errors.
      }

      if (isActive) {
        await refreshCustomerInfo();
      }
    })().finally(() => {
      if (isActive) {
        setIsEntitlementsLoading(false);
      }
    });

    return () => {
      isActive = false;
    };
  }, [getCacheKey, hasDevSubOverride, isLoaded, isRevenueCatEnabled, isSignedIn, refreshCustomerInfo, userId]);

  useEffect(() => {
    if (hasDevSubOverride) return;
    if (!isRevenueCatEnabled) return;
    if (!userId) return;

    const listener: CustomerInfoUpdateListener = (info) => {
      updateCustomerInfo(info);
    };

    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [hasDevSubOverride, isRevenueCatEnabled, updateCustomerInfo, userId]);

  const value = useMemo(
    () => ({
      customerInfo,
      hasProAccess,
      isEntitlementsLoading,
      isRevenueCatEnabled,
      errorMessage,
      refreshCustomerInfo,
      updateCustomerInfo,
    }),
    [
      customerInfo,
      errorMessage,
      hasProAccess,
      isEntitlementsLoading,
      isRevenueCatEnabled,
      refreshCustomerInfo,
      updateCustomerInfo,
    ]
  );

  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>;
};

export const useRevenueCatContext = () => {
  const context = useContext(RevenueCatContext);
  if (!context) {
    throw new Error('useRevenueCatContext must be used within a RevenueCatProvider');
  }
  return context;
};
