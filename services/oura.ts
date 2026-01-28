import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';

// MARK: - Types

export interface OuraTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

export interface OuraUserInfo {
  id: string;
  age?: number;
  weight?: number;
  height?: number;
  biological_sex?: string;
  email?: string;
}

export interface OuraSleep {
  id: string;
  average_breath?: number;
  average_heart_rate?: number;
  average_hrv?: number;
  awake_time?: number;
  bedtime_end?: string;
  bedtime_start?: string;
  day: string;
  deep_sleep_duration?: number;
  efficiency?: number;
  latency?: number;
  light_sleep_duration?: number;
  lowest_heart_rate?: number;
  rem_sleep_duration?: number;
  restless_periods?: number;
  total_sleep_duration?: number;
  time_in_bed?: number;
  readiness?: OuraReadinessData;
  readiness_score_delta?: number;
}

export interface OuraReadinessData {
  contributors?: OuraReadinessContributors;
  score?: number;
  temperature_deviation?: number;
  temperature_trend_deviation?: number;
}

export interface OuraReadinessContributors {
  activity_balance?: number;
  body_temperature?: number;
  hrv_balance?: number;
  previous_day_activity?: number;
  previous_night?: number;
  recovery_index?: number;
  resting_heart_rate?: number;
  sleep_balance?: number;
  sleep_regularity?: number;
}

export interface OuraDataResponse<T> {
  data: T[];
}

export interface OuraDailyData {
  date: string;
  sleepDurationHours?: number;
  hrv?: number;
  averageHeartRate?: number;
  readinessScore?: number;
}

// MARK: - Constants

const OURA_CLIENT_ID = process.env.EXPO_PUBLIC_OURA_CLIENT_ID || '';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY || '';
const REDIRECT_URI = 'forge://oauth/callback';
const OURA_SCOPES = 'email personal daily heartrate tag workout session spo2 ring_configuration stress heart_health';

// Keychain keys
const ACCESS_TOKEN_KEY = 'oura_access_token';
const REFRESH_TOKEN_KEY = 'oura_refresh_token';

// MARK: - Helper Functions

const getSecureKey = (baseKey: string, userId: string) => `${baseKey}_${userId}`;

export const getOuraAccessToken = async (userId: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(getSecureKey(ACCESS_TOKEN_KEY, userId));
  } catch {
    console.error('[Oura] Failed to get access token from secure store');
    return null;
  }
};

export const getOuraRefreshToken = async (userId: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(getSecureKey(REFRESH_TOKEN_KEY, userId));
  } catch {
    console.error('[Oura] Failed to get refresh token from secure store');
    return null;
  }
};

const saveOuraAccessToken = async (token: string, userId: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(getSecureKey(ACCESS_TOKEN_KEY, userId), token);
  } catch {
    console.error('[Oura] Failed to save access token to secure store');
  }
};

const saveOuraRefreshToken = async (token: string, userId: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(getSecureKey(REFRESH_TOKEN_KEY, userId), token);
  } catch {
    console.error('[Oura] Failed to save refresh token to secure store');
  }
};

export const deleteOuraTokens = async (userId: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(getSecureKey(ACCESS_TOKEN_KEY, userId));
    await SecureStore.deleteItemAsync(getSecureKey(REFRESH_TOKEN_KEY, userId));
  } catch {
    console.error('[Oura] Failed to delete tokens from secure store');
  }
};

export const isOuraConnected = async (userId: string): Promise<boolean> => {
  const token = await getOuraAccessToken(userId);
  return token !== null;
};

// MARK: - OAuth Flow

const buildAuthorizationURL = (): string => {
  const params = new URLSearchParams({
    client_id: OURA_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: OURA_SCOPES,
  });
  return `https://cloud.ouraring.com/oauth/authorize?${params.toString()}`;
};

const exchangeCodeForToken = async (
  code: string,
  clerkToken: string
): Promise<OuraTokenResponse> => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/oura-token-exchange`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clerkToken}`,
      apikey: SUPABASE_KEY,
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${errorText}`);
  }

  return response.json();
};

export const authenticateOura = async (
  userId: string,
  getClerkToken: () => Promise<string | null>
): Promise<boolean> => {
  try {
    const clerkToken = await getClerkToken();
    if (!clerkToken) {
      throw new Error('No Clerk token available');
    }

    const authUrl = buildAuthorizationURL();
    const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);

    if (result.type !== 'success') {
      console.log('[Oura] Auth session cancelled or failed');
      return false;
    }

    const url = Linking.parse(result.url);
    const code = url.queryParams?.code as string | undefined;

    if (!code) {
      throw new Error('No authorization code received');
    }

    const tokenResponse = await exchangeCodeForToken(code, clerkToken);

    await saveOuraAccessToken(tokenResponse.access_token, userId);
    if (tokenResponse.refresh_token) {
      await saveOuraRefreshToken(tokenResponse.refresh_token, userId);
    }

    console.log('[Oura] Authentication successful');
    return true;
  } catch (error) {
    console.error('[Oura] Authentication failed:', error);
    throw error;
  }
};

// MARK: - Token Refresh

export const refreshOuraToken = async (
  userId: string,
  getClerkToken: () => Promise<string | null>
): Promise<boolean> => {
  try {
    const refreshToken = await getOuraRefreshToken(userId);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const clerkToken = await getClerkToken();
    if (!clerkToken) {
      throw new Error('No Clerk token available');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/oura-token-exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerkToken}`,
        apikey: SUPABASE_KEY,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const tokenResponse: OuraTokenResponse = await response.json();

    await saveOuraAccessToken(tokenResponse.access_token, userId);
    if (tokenResponse.refresh_token) {
      await saveOuraRefreshToken(tokenResponse.refresh_token, userId);
    }

    return true;
  } catch (error) {
    console.error('[Oura] Token refresh failed:', error);
    return false;
  }
};

// MARK: - Token Revocation

export const revokeOuraToken = async (userId: string): Promise<void> => {
  try {
    const accessToken = await getOuraAccessToken(userId);
    if (!accessToken) {
      await deleteOuraTokens(userId);
      return;
    }

    await fetch('https://api.ouraring.com/oauth/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${accessToken}`,
      },
      body: `token=${encodeURIComponent(accessToken)}`,
    });

    await deleteOuraTokens(userId);
    console.log('[Oura] Token revoked successfully');
  } catch (error) {
    console.error('[Oura] Token revocation failed:', error);
    await deleteOuraTokens(userId);
  }
};

// MARK: - API Methods

export const fetchOuraSleep = async (
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<OuraSleep[]> => {
  const accessToken = await getOuraAccessToken(userId);
  if (!accessToken) {
    throw new Error('No access token available');
  }

  const params = new URLSearchParams();
  if (startDate) {
    params.append('start_date', startDate.toISOString().split('T')[0]);
  }
  if (endDate) {
    params.append('end_date', endDate.toISOString().split('T')[0]);
  }

  const url = `https://api.ouraring.com/v2/usercollection/sleep${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Oura API error (${response.status}): ${errorText}`);
  }

  const data: OuraDataResponse<OuraSleep> = await response.json();
  return data.data;
};

// MARK: - Combined Daily Data

const getSleepDurationHours = (sleep: OuraSleep): number | undefined => {
  if (sleep.total_sleep_duration) {
    return sleep.total_sleep_duration / 3600;
  }

  if (sleep.bedtime_start && sleep.bedtime_end) {
    const start = new Date(sleep.bedtime_start);
    const end = new Date(sleep.bedtime_end);
    const durationMs = end.getTime() - start.getTime();
    return durationMs / 1000 / 3600;
  }

  return undefined;
};

const toLocalDateKey = (isoString: string): string => {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getOuraDateKey = (sleep: OuraSleep): string => {
  if (sleep.bedtime_end) {
    return toLocalDateKey(sleep.bedtime_end);
  }
  if (sleep.bedtime_start) {
    return toLocalDateKey(sleep.bedtime_start);
  }
  return sleep.day;
};

export const fetchOuraDailyData = async (
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<OuraDailyData[]> => {
  const now = new Date();
  const finalEndDate = endDate || now;
  const finalStartDate = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    const sleepData = await fetchOuraSleep(userId, finalStartDate, finalEndDate);

    const dailyData: OuraDailyData[] = sleepData.map((sleep) => ({
      date: getOuraDateKey(sleep),
      sleepDurationHours: getSleepDurationHours(sleep),
      hrv: sleep.average_hrv,
      averageHeartRate: sleep.average_heart_rate,
      readinessScore: sleep.readiness?.score,
    }));

    // Sort by date ascending
    dailyData.sort((a, b) => a.date.localeCompare(b.date));

    console.log(`[Oura] Fetched ${dailyData.length} daily data records`);
    return dailyData;
  } catch (error) {
    console.error('[Oura] Failed to fetch daily data:', error);
    throw error;
  }
};

// MARK: - Token Storage Sync

export const syncOuraRefreshTokenToDatabase = async (
  userId: string,
  shouldStore: boolean,
  getClerkToken: () => Promise<string | null>
): Promise<void> => {
  try {
    const clerkToken = await getClerkToken();
    if (!clerkToken) {
      throw new Error('No Clerk token available');
    }

    let refreshToken: string | null = null;
    if (shouldStore) {
      refreshToken = await getOuraRefreshToken(userId);
    }

    await fetch(`${SUPABASE_URL}/rest/v1/journal_users?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerkToken}`,
        apikey: SUPABASE_KEY,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ oura_refresh_token: refreshToken }),
    });

    console.log('[Oura] Synced refresh token to database');
  } catch (error) {
    console.error('[Oura] Failed to sync refresh token to database:', error);
  }
};

export const updateStoreTokenPreference = async (
  userId: string,
  shouldStore: boolean,
  getClerkToken: () => Promise<string | null>
): Promise<void> => {
  try {
    const clerkToken = await getClerkToken();
    if (!clerkToken) {
      throw new Error('No Clerk token available');
    }

    await fetch(`${SUPABASE_URL}/rest/v1/journal_users?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerkToken}`,
        apikey: SUPABASE_KEY,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ store_token: shouldStore }),
    });

    console.log('[Oura] Updated store token preference');
  } catch (error) {
    console.error('[Oura] Failed to update store token preference:', error);
  }
};

export const loadStoreTokenPreference = async (
  userId: string,
  getClerkToken: () => Promise<string | null>
): Promise<boolean> => {
  try {
    const clerkToken = await getClerkToken();
    if (!clerkToken) {
      return false;
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/journal_users?user_id=eq.${userId}&select=store_token`,
      {
        headers: {
          Authorization: `Bearer ${clerkToken}`,
          apikey: SUPABASE_KEY,
        },
      }
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data?.[0]?.store_token ?? false;
  } catch (error) {
    console.error('[Oura] Failed to load store token preference:', error);
    return false;
  }
};
