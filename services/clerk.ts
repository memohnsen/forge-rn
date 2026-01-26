import * as SecureStore from 'expo-secure-store';

const key = 'clerk-token-cache';

export const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

export const clerkTokenCache = {
  async getToken() {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // ignore cache errors
    }
  },
};
