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

  const parseLocalDate = (value: string) => {
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (dateOnlyMatch) {
      const [, y, m, d] = dateOnlyMatch;
      return new Date(Number(y), Number(m) - 1, Number(d));
    }
    return new Date(value);
  };

  const toLocalDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const toLocalDate = (dateKey: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
    if (!match) return null;
    const [, y, m, d] = match;
    return new Date(Number(y), Number(m) - 1, Number(d));
  };

  const findClosestByDate = <T extends { date: string }>(
    items: T[],
    target: Date,
    maxDayDiff: number
  ) => {
    const targetKey = toLocalDateKey(target);
    let closest: { item: T; diff: number } | null = null;
    for (const item of items) {
      if (item.date === targetKey) return item;
      const itemDate = toLocalDate(item.date);
      if (!itemDate) continue;
      const diffDays = Math.abs(
        (itemDate.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays <= maxDayDiff && (!closest || diffDays < closest.diff)) {
        closest = { item, diff: diffDays };
      }
    }
    return closest?.item ?? null;
  };

  const fetchData = useCallback(async () => {
    if (!userId || !dateString) {
      setData({});
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const targetDate = parseLocalDate(dateString);
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
          result.oura = findClosestByDate(ouraData, targetDate, 1) ?? undefined;
        } catch (ouraError) {
          console.warn('[useWearableDataForDate] Failed to fetch Oura data:', ouraError);
        }
      }

      // Fetch Whoop data
      if (whoopConnected) {
        try {
          const whoopData = await fetchWhoopDailyData(userId, startDate, endDate);
          result.whoop = findClosestByDate(whoopData, targetDate, 1) ?? undefined;
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
      setOuraConnected(false);
      setWhoopConnected(false);
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
      setOuraConnected(false);
      setWhoopConnected(false);
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
