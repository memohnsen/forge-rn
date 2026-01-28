import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import {
  fetchOuraDailyData,
  isOuraConnected,
  type OuraDailyData,
} from '@/services/oura';
import {
  fetchWhoopDailyData,
  isWhoopConnected,
  type WhoopDailyData,
} from '@/services/whoop';

export interface WearableDataForDate {
  oura?: OuraDailyData;
  whoop?: WhoopDailyData;
}

export function useWearableDataForDate(dateString: string) {
  const { userId } = useAuth();
  const [data, setData] = useState<WearableDataForDate>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId || !dateString) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const targetDate = new Date(dateString);
      if (isNaN(targetDate.getTime())) {
        throw new Error('Invalid date string');
      }

      // Set date range for just this day
      const startDate = new Date(targetDate);
      startDate.setDate(startDate.getDate() - 1); // Day before to capture sleep that spans midnight
      const endDate = new Date(targetDate);
      endDate.setDate(endDate.getDate() + 1); // Day after for safety

      const [ouraConnected, whoopConnected] = await Promise.all([
        isOuraConnected(userId),
        isWhoopConnected(userId),
      ]);

      const result: WearableDataForDate = {};

      // Fetch Oura data
      if (ouraConnected) {
        try {
          const ouraData = await fetchOuraDailyData(userId, startDate, endDate);
          const targetDateStr = dateString.split('T')[0]; // Normalize to YYYY-MM-DD
          result.oura = ouraData.find((item) => item.date === targetDateStr);
        } catch (ouraError) {
          console.warn('[useWearableDataForDate] Failed to fetch Oura data:', ouraError);
        }
      }

      // Fetch Whoop data
      if (whoopConnected) {
        try {
          const whoopData = await fetchWhoopDailyData(userId, startDate, endDate);
          const targetDateStr = dateString.split('T')[0];
          result.whoop = whoopData.find((item) => item.date === targetDateStr);
        } catch (whoopError) {
          console.warn('[useWearableDataForDate] Failed to fetch Whoop data:', whoopError);
        }
      }

      setData(result);
    } catch (err) {
      const fetchError =
        err instanceof Error ? err : new Error('Failed to fetch wearable data');
      setError(fetchError);
      console.error('[useWearableDataForDate] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, dateString]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchData,
  };
}

export function useWearableConnectionStatus() {
  const { userId } = useAuth();
  const [ouraConnected, setOuraConnected] = useState(false);
  const [whoopConnected, setWhoopConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [oura, whoop] = await Promise.all([
        isOuraConnected(userId),
        isWhoopConnected(userId),
      ]);
      setOuraConnected(oura);
      setWhoopConnected(whoop);
    } catch (error) {
      console.error('[useWearableConnectionStatus] Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    ouraConnected,
    whoopConnected,
    isLoading,
    refresh: checkStatus,
  };
}
