import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';

// MARK: - Types

export interface WhoopTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

export interface WhoopSleep {
  id: string;
  cycle_id?: number;
  v1_id?: number;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  start: string;
  end: string;
  timezone_offset?: string;
  nap?: boolean;
  score_state?: string;
  score?: WhoopSleepScore;
}

export interface WhoopSleepScore {
  stage_summary?: WhoopStageSummary;
  sleep_needed?: WhoopSleepNeeded;
  respiratory_rate?: number;
  sleep_performance_percentage?: number;
  sleep_consistency_percentage?: number;
  sleep_efficiency_percentage?: number;
}

export interface WhoopStageSummary {
  total_in_bed_time_milli?: number;
  total_awake_time_milli?: number;
  total_no_data_time_milli?: number;
  total_light_sleep_time_milli?: number;
  total_slow_wave_sleep_time_milli?: number;
  total_rem_sleep_time_milli?: number;
  sleep_cycle_count?: number;
  disturbance_count?: number;
}

export interface WhoopSleepNeeded {
  baseline_milli?: number;
  need_from_sleep_debt_milli?: number;
  need_from_recent_strain_milli?: number;
  need_from_recent_nap_milli?: number;
}

export interface WhoopRecovery {
  id: string;
  cycle_id?: number;
  v1_id?: number;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  start: string;
  end: string;
  timezone_offset?: string;
  score_state?: string;
  score?: WhoopRecoveryScore;
}

export interface WhoopRecoveryScore {
  recovery_score?: number;
  resting_heart_rate?: number;
  hrv_rmssd_milli?: number;
}

export interface WhoopCycle {
  id: number;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  start: string;
  end: string;
  timezone_offset?: string;
  score_state?: string;
  score?: WhoopCycleScore;
}

export interface WhoopCycleScore {
  strain?: number;
  kilojoule?: number;
  average_heart_rate?: number;
  max_heart_rate?: number;
}

export interface WhoopDailyData {
  id: string;
  date: string;
  recoveryScore?: number;
  sleepDurationHours?: number;
  sleepPerformance?: number;
  sleepConsistency?: number;
  sleepEfficiency?: number;
  strainScore?: number;
  hrvMs?: number;
  restingHeartRate?: number;
  respiratoryRate?: number;
}

export interface WhoopDataResponse<T> {
  records: T[];
}

// MARK: - Constants

const WHOOP_CLIENT_ID = process.env.EXPO_PUBLIC_WHOOP_CLIENT_ID || '';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY || '';
const REDIRECT_URI = 'forge://oauth/callback';
const WHOOP_SCOPES = 'read:recovery read:sleep read:cycles offline';

// Keychain keys
const ACCESS_TOKEN_KEY = 'whoop_access_token';
const REFRESH_TOKEN_KEY = 'whoop_refresh_token';
const STATE_KEY = 'whoop_auth_state';

// MARK: - Helper Functions

const getSecureKey = (baseKey: string, userId: string) => `${baseKey}_${userId}`;

export const getWhoopAccessToken = async (userId: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(getSecureKey(ACCESS_TOKEN_KEY, userId));
  } catch {
    console.error('[Whoop] Failed to get access token from secure store');
    return null;
  }
};

export const getWhoopRefreshToken = async (userId: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(getSecureKey(REFRESH_TOKEN_KEY, userId));
  } catch {
    console.error('[Whoop] Failed to get refresh token from secure store');
    return null;
  }
};

const saveWhoopAccessToken = async (token: string, userId: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(getSecureKey(ACCESS_TOKEN_KEY, userId), token);
  } catch {
    console.error('[Whoop] Failed to save access token to secure store');
  }
};

const saveWhoopRefreshToken = async (token: string, userId: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(getSecureKey(REFRESH_TOKEN_KEY, userId), token);
  } catch {
    console.error('[Whoop] Failed to save refresh token to secure store');
  }
};

export const deleteWhoopTokens = async (userId: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(getSecureKey(ACCESS_TOKEN_KEY, userId));
    await SecureStore.deleteItemAsync(getSecureKey(REFRESH_TOKEN_KEY, userId));
  } catch {
    console.error('[Whoop] Failed to delete tokens from secure store');
  }
};

export const isWhoopConnected = async (userId: string): Promise<boolean> => {
  const token = await getWhoopAccessToken(userId);
  return token !== null;
};

// MARK: - OAuth Flow

let currentAuthState: string | null = null;

const generateRandomState = (): string => {
  const array = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const buildAuthorizationURL = (): string => {
  currentAuthState = generateRandomState();

  const params = new URLSearchParams({
    client_id: WHOOP_CLIENT_ID.trim(),
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: WHOOP_SCOPES,
    state: currentAuthState,
  });
  return `https://api.prod.whoop.com/oauth/oauth2/auth?${params.toString()}`;
};

const exchangeCodeForToken = async (
  code: string,
  clerkToken: string
): Promise<WhoopTokenResponse> => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/whoop-token-exchange`, {
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

export const authenticateWhoop = async (
  userId: string,
  getClerkToken: () => Promise<string | null>
): Promise<boolean> => {
  try {
    console.log('[Whoop] Starting authentication flow');

    const clerkToken = await getClerkToken();
    if (!clerkToken) {
      throw new Error('No Clerk token available');
    }

    const authUrl = buildAuthorizationURL();
    console.log('[Whoop] Opening auth URL');

    const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);

    if (result.type !== 'success') {
      console.log('[Whoop] Auth session cancelled or failed');
      return false;
    }

    const url = Linking.parse(result.url);

    // Check for OAuth errors
    const error = url.queryParams?.error as string | undefined;
    if (error) {
      const errorDescription = url.queryParams?.error_description as string | undefined;
      throw new Error(`OAuth error: ${error} - ${errorDescription}`);
    }

    // Verify state parameter (CSRF protection)
    const receivedState = url.queryParams?.state as string | undefined;
    if (currentAuthState && receivedState !== currentAuthState) {
      throw new Error('State mismatch - potential CSRF attack');
    }

    const code = url.queryParams?.code as string | undefined;
    if (!code) {
      throw new Error('No authorization code received');
    }

    console.log('[Whoop] Exchanging code for token');
    const tokenResponse = await exchangeCodeForToken(code, clerkToken);

    await saveWhoopAccessToken(tokenResponse.access_token, userId);
    if (tokenResponse.refresh_token) {
      await saveWhoopRefreshToken(tokenResponse.refresh_token, userId);
    }

    currentAuthState = null;
    console.log('[Whoop] Authentication successful');
    return true;
  } catch (error) {
    console.error('[Whoop] Authentication failed:', error);
    currentAuthState = null;
    throw error;
  }
};

// MARK: - Token Refresh

export const refreshWhoopToken = async (
  userId: string,
  getClerkToken: () => Promise<string | null>
): Promise<boolean> => {
  try {
    const refreshToken = await getWhoopRefreshToken(userId);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const clerkToken = await getClerkToken();
    if (!clerkToken) {
      throw new Error('No Clerk token available');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/whoop-token-exchange`, {
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

    const tokenResponse: WhoopTokenResponse = await response.json();

    await saveWhoopAccessToken(tokenResponse.access_token, userId);
    if (tokenResponse.refresh_token) {
      await saveWhoopRefreshToken(tokenResponse.refresh_token, userId);
    }

    return true;
  } catch (error) {
    console.error('[Whoop] Token refresh failed:', error);
    return false;
  }
};

// MARK: - Token Revocation

export const revokeWhoopToken = async (userId: string): Promise<void> => {
  try {
    const accessToken = await getWhoopAccessToken(userId);
    if (!accessToken) {
      await deleteWhoopTokens(userId);
      return;
    }

    // WHOOP revoke endpoint
    await fetch('https://api.prod.whoop.com/developer/v2/user/access', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    await deleteWhoopTokens(userId);
    console.log('[Whoop] Token revoked successfully');
  } catch (error) {
    console.error('[Whoop] Token revocation failed:', error);
    await deleteWhoopTokens(userId);
  }
};

// MARK: - API Methods

const formatDateForAPI = (date: Date): string => {
  return date.toISOString();
};

export const fetchWhoopRecovery = async (
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<WhoopRecovery[]> => {
  const accessToken = await getWhoopAccessToken(userId);
  if (!accessToken) {
    throw new Error('No access token available');
  }

  const params = new URLSearchParams();
  if (startDate) {
    params.append('start', formatDateForAPI(startDate));
  }
  if (endDate) {
    params.append('end', formatDateForAPI(endDate));
  }

  const url = `https://api.prod.whoop.com/developer/v2/recovery${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Whoop Recovery API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  // WHOOP API may return array directly or wrapped
  if (Array.isArray(data)) {
    return data;
  }
  return data.records || data.data || [];
};

export const fetchWhoopSleep = async (
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<WhoopSleep[]> => {
  const accessToken = await getWhoopAccessToken(userId);
  if (!accessToken) {
    throw new Error('No access token available');
  }

  const params = new URLSearchParams();
  if (startDate) {
    params.append('start', formatDateForAPI(startDate));
  }
  if (endDate) {
    params.append('end', formatDateForAPI(endDate));
  }

  const url = `https://api.prod.whoop.com/developer/v2/activity/sleep${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Whoop Sleep API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (Array.isArray(data)) {
    return data;
  }
  return data.records || data.data || [];
};

export const fetchWhoopCycle = async (
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<WhoopCycle[]> => {
  const accessToken = await getWhoopAccessToken(userId);
  if (!accessToken) {
    throw new Error('No access token available');
  }

  const params = new URLSearchParams();
  if (startDate) {
    params.append('start', formatDateForAPI(startDate));
  }
  if (endDate) {
    params.append('end', formatDateForAPI(endDate));
  }

  const url = `https://api.prod.whoop.com/developer/v2/cycle${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Whoop Cycle API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (Array.isArray(data)) {
    return data;
  }
  return data.records || data.data || [];
};

// MARK: - Combined Daily Data

const getSleepDurationHours = (sleep: WhoopSleep): number | undefined => {
  const start = new Date(sleep.start);
  const end = new Date(sleep.end);
  const durationMs = end.getTime() - start.getTime();
  return durationMs / 1000 / 3600;
};

const formatDateKey = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toISOString().split('T')[0];
};

export const fetchWhoopDailyData = async (
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<WhoopDailyData[]> => {
  const now = new Date();
  const finalEndDate = endDate || now;
  const finalStartDate = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    console.log('[Whoop] Fetching daily data');

    const [recoveries, sleeps, cycles] = await Promise.all([
      fetchWhoopRecovery(userId, finalStartDate, finalEndDate),
      fetchWhoopSleep(userId, finalStartDate, finalEndDate),
      fetchWhoopCycle(userId, finalStartDate, finalEndDate),
    ]);

    console.log(`[Whoop] Fetched ${recoveries.length} recovery, ${sleeps.length} sleep, ${cycles.length} cycle records`);

    // Combine data by date
    const dataByDate: Record<string, Partial<WhoopDailyData>> = {};

    for (const recovery of recoveries) {
      const dateKey = formatDateKey(recovery.start);
      if (!dataByDate[dateKey]) {
        dataByDate[dateKey] = { id: recovery.id, date: dateKey };
      }
      dataByDate[dateKey].recoveryScore = recovery.score?.recovery_score;
      dataByDate[dateKey].hrvMs = recovery.score?.hrv_rmssd_milli;
      dataByDate[dateKey].restingHeartRate = recovery.score?.resting_heart_rate;
    }

    for (const sleep of sleeps) {
      const dateKey = formatDateKey(sleep.start);
      if (!dataByDate[dateKey]) {
        dataByDate[dateKey] = { id: sleep.id, date: dateKey };
      }
      dataByDate[dateKey].sleepDurationHours = getSleepDurationHours(sleep);
      dataByDate[dateKey].sleepPerformance = sleep.score?.sleep_performance_percentage;
      dataByDate[dateKey].sleepConsistency = sleep.score?.sleep_consistency_percentage;
      dataByDate[dateKey].sleepEfficiency = sleep.score?.sleep_efficiency_percentage
        ? Math.round(sleep.score.sleep_efficiency_percentage)
        : undefined;
      dataByDate[dateKey].respiratoryRate = sleep.score?.respiratory_rate;
    }

    for (const cycle of cycles) {
      const dateKey = formatDateKey(cycle.start);
      if (!dataByDate[dateKey]) {
        dataByDate[dateKey] = { id: String(cycle.id), date: dateKey };
      }
      dataByDate[dateKey].strainScore = cycle.score?.strain;
    }

    // Convert to array and sort by date
    const dailyData: WhoopDailyData[] = Object.values(dataByDate)
      .filter((item): item is WhoopDailyData => item.date !== undefined)
      .sort((a, b) => a.date.localeCompare(b.date));

    console.log(`[Whoop] Combined ${dailyData.length} daily data records`);
    return dailyData;
  } catch (error) {
    console.error('[Whoop] Failed to fetch daily data:', error);
    throw error;
  }
};

// MARK: - Token Storage Sync

export const syncWhoopRefreshTokenToDatabase = async (
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
      refreshToken = await getWhoopRefreshToken(userId);
    }

    await fetch(`${SUPABASE_URL}/rest/v1/journal_users?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerkToken}`,
        apikey: SUPABASE_KEY,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ whoop_refresh_token: refreshToken }),
    });

    console.log('[Whoop] Synced refresh token to database');
  } catch (error) {
    console.error('[Whoop] Failed to sync refresh token to database:', error);
  }
};
