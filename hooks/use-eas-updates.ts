import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Updates from 'expo-updates';

export const useEasUpdates = () => {
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    if (__DEV__) return;
    if (Platform.OS === 'web') return;
    if (!Updates.isEnabled) return;

    const runUpdateCheck = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (!update.isAvailable) return;

        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      } catch (error) {
        console.warn('[EAS Updates] Failed to check/apply update', error);
      }
    };

    void runUpdateCheck();
  }, []);
};
