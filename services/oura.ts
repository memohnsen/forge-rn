import * as SecureStore from 'expo-secure-store';

const tokenKey = 'oura-refresh-token';

export const storeOuraToken = async (token: string) => {
  await SecureStore.setItemAsync(tokenKey, token);
};

export const getOuraToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(tokenKey);
};

export const clearOuraToken = async () => {
  await SecureStore.deleteItemAsync(tokenKey);
};
