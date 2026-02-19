import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { CheckIn } from '@/models/CheckIn';
import { SessionReport } from '@/models/Session';
import { CompReport } from '@/models/Competition';
import { CATEGORIES, type ChartCategory, type TrendPoint } from '@/utils/trends-data';
import { fetchOuraDailyData, isOuraConnected, type OuraDailyData } from '@/services/oura';
import { fetchWhoopDailyData, isWhoopConnected, type WhoopDailyData } from '@/services/whoop';

const parseDate = (value: string) => {
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) return date;

  const parts = value.split('-').map((part) => Number(part));
  if (parts.length >= 3 && parts.every((part) => !Number.isNaN(part))) {
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  }

  return null;
};

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const buildSeries = <T,>(
  items: T[],
  dateExtractor: (item: T) => string,
  valueExtractor: (item: T) => number
): TrendPoint[] => {
  return items
    .map((item) => {
      const date = parseDate(dateExtractor(item));
      if (!date) return null;
      return { date, value: valueExtractor(item) };
    })
    .filter((point): point is TrendPoint => point !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};

const buildMeetTotal = (report: CompReport) => {
  const wlTotal = toNumber(report.snatchBest) + toNumber(report.cjBest);
  const plTotal = toNumber(report.squatBest) + toNumber(report.benchBest) + toNumber(report.deadliftBest);
  if (wlTotal > 0) return wlTotal;
  if (plTotal > 0) return plTotal;
  return 0;
};

export function useTrends() {
  const { userId, isLoaded } = useAuth();
  const isRefreshingRef = useRef(false);

  // Convex reactive queries
  const convexCheckIns = useQuery(api.dailyCheckIns.listByUser, userId ? { userId } : 'skip');
  const convexSessions = useQuery(api.sessionReports.listByUser, userId ? { userId } : 'skip');
  const convexComps = useQuery(api.compReports.listByUser, userId ? { userId } : 'skip');

  const checkIns = (convexCheckIns as CheckIn[] | undefined) ?? [];
  const sessionReports = (convexSessions as SessionReport[] | undefined) ?? [];
  const compReports = (convexComps as CompReport[] | undefined) ?? [];

  const [ouraData, setOuraData] = useState<OuraDailyData[]>([]);
  const [whoopData, setWhoopData] = useState<WhoopDailyData[]>([]);
  const [ouraConnected, setOuraConnected] = useState(false);
  const [whoopConnected, setWhoopConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const convexLoading =
    convexCheckIns === undefined ||
    convexSessions === undefined ||
    convexComps === undefined;

  const refresh = useCallback(async () => {
    if (!isLoaded || !userId || isRefreshingRef.current) {
      if (!isLoaded || !userId) {
        setIsLoading(false);
        setOuraConnected(false);
        setWhoopConnected(false);
      }
      return;
    }
    setIsLoading(true);
    setError(null);
    isRefreshingRef.current = true;

    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const [ouraConnectedResult, whoopConnectedResult] = await Promise.all([
        isOuraConnected(userId),
        isWhoopConnected(userId),
      ]);
      setOuraConnected(ouraConnectedResult);
      setWhoopConnected(whoopConnectedResult);

      if (ouraConnectedResult) {
        try {
          const ouraResult = await fetchOuraDailyData(userId, ninetyDaysAgo);
          setOuraData(ouraResult);
        } catch (ouraError) {
          console.warn('[useTrends] Failed to fetch Oura data:', ouraError);
          setOuraData([]);
        }
      } else {
        setOuraData([]);
      }

      if (whoopConnectedResult) {
        try {
          const whoopResult = await fetchWhoopDailyData(userId, ninetyDaysAgo);
          setWhoopData(whoopResult);
        } catch (whoopError) {
          console.warn('[useTrends] Failed to fetch Whoop data:', whoopError);
          setWhoopData([]);
        }
      } else {
        setWhoopData([]);
      }
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error(typeof err === 'string' ? err : 'Unknown trends error');
      console.error('[useTrends] Error fetching trends data:', err);
      setError(error);
    } finally {
      isRefreshingRef.current = false;
      setIsLoading(false);
    }
  }, [userId, isLoaded]);

  useEffect(() => {
    if (isLoaded && userId) {
      refresh();
    }
  }, [userId, isLoaded, refresh]);

  // Once convex data loads, stop showing loading
  useEffect(() => {
    if (!convexLoading) {
      setIsLoading(false);
    }
  }, [convexLoading]);

  const dataByChartId = useMemo<Record<string, TrendPoint[]>>(() => {
    return {
      // Check-in charts — camelCase field names from Convex
      checkin_overall: buildSeries(checkIns, (i) => i.checkInDate, (i) => i.overallScore),
      checkin_physical: buildSeries(checkIns, (i) => i.checkInDate, (i) => i.physicalScore),
      checkin_mental: buildSeries(checkIns, (i) => i.checkInDate, (i) => i.mentalScore),
      checkin_physical_strength: buildSeries(checkIns, (i) => i.checkInDate, (i) => i.physicalStrength),
      checkin_mental_strength: buildSeries(checkIns, (i) => i.checkInDate, (i) => i.mentalStrength),
      checkin_recovery: buildSeries(checkIns, (i) => i.checkInDate, (i) => i.recovered),
      checkin_confidence: buildSeries(checkIns, (i) => i.checkInDate, (i) => i.confidence),
      checkin_sleep: buildSeries(checkIns, (i) => i.checkInDate, (i) => i.sleep),
      checkin_energy: buildSeries(checkIns, (i) => i.checkInDate, (i) => i.energy),
      checkin_stress: buildSeries(checkIns, (i) => i.checkInDate, (i) => i.stress),
      checkin_soreness: buildSeries(checkIns, (i) => i.checkInDate, (i) => i.soreness),
      checkin_readiness: buildSeries(checkIns, (i) => i.checkInDate, (i) => i.readiness),
      checkin_focus: buildSeries(checkIns, (i) => i.checkInDate, (i) => i.focus),
      checkin_excitement: buildSeries(checkIns, (i) => i.checkInDate, (i) => i.excitement),
      checkin_body_connection: buildSeries(checkIns, (i) => i.checkInDate, (i) => i.bodyConnection),
      // Workout charts
      workout_rpe: buildSeries(sessionReports, (i) => i.sessionDate, (i) => i.sessionRpe),
      workout_quality: buildSeries(sessionReports, (i) => i.sessionDate, (i) => i.movementQuality),
      workout_focus: buildSeries(sessionReports, (i) => i.sessionDate, (i) => i.focus),
      workout_misses: buildSeries(sessionReports, (i) => i.sessionDate, (i) => toNumber(i.misses)),
      workout_feeling: buildSeries(sessionReports, (i) => i.sessionDate, (i) => i.feeling),
      workout_satisfaction: buildSeries(sessionReports, (i) => i.sessionDate, (i) => i.satisfaction),
      workout_confidence: buildSeries(sessionReports, (i) => i.sessionDate, (i) => i.confidence),
      // Meet charts
      meet_performance: buildSeries(compReports, (i) => i.meetDate, (i) => i.performanceRating),
      meet_physical_prep: buildSeries(compReports, (i) => i.meetDate, (i) => i.physicalPreparednessRating),
      meet_mental_prep: buildSeries(compReports, (i) => i.meetDate, (i) => i.mentalPreparednessRating),
      meet_total: buildSeries(compReports, (i) => i.meetDate, (i) => buildMeetTotal(i)),
      meet_satisfaction: buildSeries(compReports, (i) => i.meetDate, (i) => i.satisfaction),
      meet_confidence: buildSeries(compReports, (i) => i.meetDate, (i) => i.confidence),
      meet_pressure: buildSeries(compReports, (i) => i.meetDate, (i) => i.pressureHandling),
      meet_bodyweight: buildSeries(compReports, (i) => i.meetDate, (i) => toNumber(i.bodyweight)),
      meet_snatch_best: buildSeries(compReports, (i) => i.meetDate, (i) => toNumber(i.snatchBest)),
      meet_cj_best: buildSeries(compReports, (i) => i.meetDate, (i) => toNumber(i.cjBest)),
      meet_squat_best: buildSeries(compReports, (i) => i.meetDate, (i) => toNumber(i.squatBest)),
      meet_bench_best: buildSeries(compReports, (i) => i.meetDate, (i) => toNumber(i.benchBest)),
      meet_deadlift_best: buildSeries(compReports, (i) => i.meetDate, (i) => toNumber(i.deadliftBest)),
      // Oura charts
      oura_sleep: buildSeries(
        ouraData.filter((i) => i.sleepDurationHours !== undefined),
        (i) => i.date,
        (i) => i.sleepDurationHours ?? 0
      ),
      oura_hrv: buildSeries(
        ouraData.filter((i) => i.hrv !== undefined),
        (i) => i.date,
        (i) => i.hrv ?? 0
      ),
      oura_heart_rate: buildSeries(
        ouraData.filter((i) => i.averageHeartRate !== undefined),
        (i) => i.date,
        (i) => i.averageHeartRate ?? 0
      ),
      oura_readiness: buildSeries(
        ouraData.filter((i) => i.readinessScore !== undefined),
        (i) => i.date,
        (i) => i.readinessScore ?? 0
      ),
      // Whoop charts
      whoop_recovery: buildSeries(
        whoopData.filter((i) => i.recoveryScore !== undefined),
        (i) => i.date,
        (i) => i.recoveryScore ?? 0
      ),
      whoop_sleep: buildSeries(
        whoopData.filter((i) => i.sleepDurationHours !== undefined),
        (i) => i.date,
        (i) => i.sleepDurationHours ?? 0
      ),
      whoop_sleep_performance: buildSeries(
        whoopData.filter((i) => i.sleepPerformance !== undefined),
        (i) => i.date,
        (i) => i.sleepPerformance ?? 0
      ),
      whoop_strain: buildSeries(
        whoopData.filter((i) => i.strainScore !== undefined),
        (i) => i.date,
        (i) => i.strainScore ?? 0
      ),
      whoop_hrv: buildSeries(
        whoopData.filter((i) => i.hrvMs !== undefined),
        (i) => i.date,
        (i) => i.hrvMs ?? 0
      ),
      whoop_resting_hr: buildSeries(
        whoopData.filter((i) => i.restingHeartRate !== undefined),
        (i) => i.date,
        (i) => i.restingHeartRate ?? 0
      ),
    };
  }, [checkIns, sessionReports, compReports, ouraData, whoopData]);

  const categories = useMemo<ChartCategory[]>(() => {
    return CATEGORIES.map((category) => ({
      ...category,
      charts: category.charts.map((chart) => ({
        ...chart,
        data: dataByChartId[chart.id] ?? [],
      })),
    }));
  }, [dataByChartId]);

  return {
    categories,
    ouraConnected,
    whoopConnected,
    isLoading: isLoading || convexLoading,
    error,
    refresh,
    checkIns,
    sessionReports,
    compReports,
    ouraData,
    whoopData,
  };
}
