import { useRevenueCatContext } from '@/contexts/RevenueCatContext';
import {
  trackScreenView,
  trackSubscriptionRestored,
  trackSubscriptionStarted,
} from '@/utils/analytics';
import { useAuth } from '@clerk/clerk-expo';
import { usePathname, useRouter } from 'expo-router';
import RevenueCatUI from 'react-native-purchases-ui';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function PaywallScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const {
    hasProAccess,
    isEntitlementsLoading,
    isRevenueCatEnabled,
    refreshCustomerInfo,
    updateCustomerInfo,
  } = useRevenueCatContext();
  const hasTrackedView = useRef(false);
  const [dismissMessage, setDismissMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!hasTrackedView.current) {
      trackScreenView('paywall');
      hasTrackedView.current = true;
    }
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      router.replace('/(auth)/sign-in');
      return;
    }

    if (!isRevenueCatEnabled) {
      router.replace('/(tabs)');
      return;
    }

    if (hasProAccess) {
      router.replace('/(tabs)');
    }
  }, [hasProAccess, isRevenueCatEnabled, isSignedIn, router]);

  if (!isRevenueCatEnabled) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Subscriptions are unavailable on this platform.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isEntitlementsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : (
        <RevenueCatUI.Paywall
          options={{ displayCloseButton: false }}
          onPurchaseCompleted={({ customerInfo }) => {
            updateCustomerInfo(customerInfo);
            trackSubscriptionStarted('pro');
            router.replace('/(tabs)');
          }}
          onRestoreCompleted={({ customerInfo }) => {
            updateCustomerInfo(customerInfo);
            trackSubscriptionRestored();
            router.replace('/(tabs)');
          }}
          onDismiss={() => {
            refreshCustomerInfo().then((hasAccess) => {
              if (hasAccess) {
                if (pathname !== '/(tabs)') {
                  router.replace('/(tabs)');
                }
              } else {
                if (pathname !== '/(paywall)') {
                  router.replace('/(paywall)');
                } else {
                  setDismissMessage(
                    'You need an active subscription to continue. Please try again when you are back online.'
                  );
                }
              }
            });
          }}
        />
      )}
      {dismissMessage ? (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{dismissMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#000000',
  },
  fallbackText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  messageContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
});
