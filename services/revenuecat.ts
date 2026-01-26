import Purchases, { type CustomerInfo } from 'react-native-purchases';

const revenueCatKey = process.env.EXPO_PUBLIC_REVENUECAT_KEY ?? '';

export const configureRevenueCat = async (userId?: string) => {
  if (!revenueCatKey) return;
  Purchases.configure({ apiKey: revenueCatKey, appUserID: userId });
};

export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
};
