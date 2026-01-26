import * as SecureStore from 'expo-secure-store';

const tokenKey = 'whoop-refresh-token';

export const storeWhoopToken = async (token: string) => {
  await SecureStore.setItemAsync(tokenKey, token);
};

export const getWhoopToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(tokenKey);
};

export const clearWhoopToken = async () => {
  await SecureStore.deleteItemAsync(tokenKey);
};
