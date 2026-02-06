import { Platform } from 'react-native';

const legacyKey = process.env.EXPO_PUBLIC_REVENUECAT_KEY;
const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

export const revenueCatApiKey = Platform.select({
  ios: iosKey ?? legacyKey,
  android: androidKey ?? legacyKey,
  default: undefined,
});
