import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { createClerkSupabaseClient } from '@/services/supabase';
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
  const wlTotal = toNumber(report.snatch_best) + toNumber(report.cj_best);
  const plTotal =
    toNumber(report.squat_best) + toNumber(report.bench_best) + toNumber(report.deadlift_best);

  if (wlTotal > 0) return wlTotal;
  if (plTotal > 0) return plTotal;
  return 0;
};

export function useTrends() {
  const { getToken, userId, isLoaded } = useAuth();
  const getTokenRef = useRef(getToken);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const supabase = useMemo(() => {
    return createClerkSupabaseClient(async () => {
      return getTokenRef.current({ template: 'supabase', skipCache: true });
    });
  }, []);

  const getClerkToken = useCallback(async () => {
    try {
      return await getTokenRef.current({ template: 'supabase' });
    } catch (error) {
      console.warn('[useTrends] Failed to get Clerk token:', error);
      return null;
    }
  }, []);

  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [sessionReports, setSessionReports] = useState<SessionReport[]>([]);
  const [compReports, setCompReports] = useState<CompReport[]>([]);
  const [ouraData, setOuraData] = useState<OuraDailyData[]>([]);
  const [whoopData, setWhoopData] = useState<WhoopDailyData[]>([]);
  const [ouraConnected, setOuraConnected] = useState(false);
  const [whoopConnected, setWhoopConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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
      // Fetch Supabase data
      const [checkInsResponse, sessionsResponse, compsResponse] = await Promise.all([
        supabase
          .from('journal_daily_checkins')
          .select('*')
          .eq('user_id', userId)
          .order('check_in_date', { ascending: false }),
        supabase
          .from('journal_session_report')
          .select('*')
          .eq('user_id', userId)
          .order('session_date', { ascending: false }),
        supabase
          .from('journal_comp_report')
          .select('*')
          .eq('user_id', userId)
          .order('meet_date', { ascending: false }),
      ]);

      if (checkInsResponse.error) throw checkInsResponse.error;
      if (sessionsResponse.error) throw sessionsResponse.error;
      if (compsResponse.error) throw compsResponse.error;

      setCheckIns(checkInsResponse.data || []);
      setSessionReports(sessionsResponse.data || []);
      setCompReports(compsResponse.data || []);

      // Fetch wearable data if connected (last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const [ouraConnectedResult, whoopConnectedResult] = await Promise.all([
        isOuraConnected(userId),
        isWhoopConnected(userId, getClerkToken),
      ]);
      setOuraConnected(ouraConnectedResult);
      setWhoopConnected(whoopConnectedResult);

      // Fetch Oura data if connected
      if (ouraConnectedResult) {
        try {
          const ouraResult = await fetchOuraDailyData(userId, ninetyDaysAgo);
          setOuraData(ouraResult);
          console.log(`[useTrends] Fetched ${ouraResult.length} Oura records`);
        } catch (ouraError) {
          console.warn('[useTrends] Failed to fetch Oura data:', ouraError);
          setOuraData([]);
        }
      } else {
        setOuraData([]);
      }

      // Fetch Whoop data if connected
      if (whoopConnectedResult) {
        try {
          const whoopResult = await fetchWhoopDailyData(userId, ninetyDaysAgo, undefined, getClerkToken);
          setWhoopData(whoopResult);
          console.log(`[useTrends] Fetched ${whoopResult.length} Whoop records`);
        } catch (whoopError) {
          console.warn('[useTrends] Failed to fetch Whoop data:', whoopError);
          setWhoopData([]);
        }
      } else {
        setWhoopData([]);
      }
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error(typeof err === 'string' ? err : 'Unknown trends error');
      console.error('[useTrends] Error fetching trends data:', err);
      setError(error);
    } finally {
      isRefreshingRef.current = false;
      setIsLoading(false);
    }
  }, [supabase, userId, isLoaded]);

  useEffect(() => {
    if (isLoaded && userId) {
      refresh();
    }
  }, [userId, isLoaded, refresh]);

  const dataByChartId = useMemo<Record<string, TrendPoint[]>>(() => {
    return {
      // Check-in charts
      checkin_overall: buildSeries(checkIns, (item) => item.check_in_date, (item) => item.overall_score),
      checkin_physical: buildSeries(checkIns, (item) => item.check_in_date, (item) => item.physical_score),
      checkin_mental: buildSeries(checkIns, (item) => item.check_in_date, (item) => item.mental_score),
      checkin_physical_strength: buildSeries(checkIns, (item) => item.check_in_date, (item) => item.physical_strength),
      checkin_mental_strength: buildSeries(checkIns, (item) => item.check_in_date, (item) => item.mental_strength),
      checkin_recovery: buildSeries(checkIns, (item) => item.check_in_date, (item) => item.recovered),
      checkin_confidence: buildSeries(checkIns, (item) => item.check_in_date, (item) => item.confidence),
      checkin_sleep: buildSeries(checkIns, (item) => item.check_in_date, (item) => item.sleep),
      checkin_energy: buildSeries(checkIns, (item) => item.check_in_date, (item) => item.energy),
      checkin_stress: buildSeries(checkIns, (item) => item.check_in_date, (item) => item.stress),
      checkin_soreness: buildSeries(checkIns, (item) => item.check_in_date, (item) => item.soreness),
      checkin_readiness: buildSeries(checkIns, (item) => item.check_in_date, (item) => item.readiness),
      checkin_focus: buildSeries(checkIns, (item) => item.check_in_date, (item) => item.focus),
      checkin_excitement: buildSeries(checkIns, (item) => item.check_in_date, (item) => item.excitement),
      checkin_body_connection: buildSeries(checkIns, (item) => item.check_in_date, (item) => item.body_connection),
      // Workout charts
      workout_rpe: buildSeries(sessionReports, (item) => item.session_date, (item) => item.session_rpe),
      workout_quality: buildSeries(sessionReports, (item) => item.session_date, (item) => item.movement_quality),
      workout_focus: buildSeries(sessionReports, (item) => item.session_date, (item) => item.focus),
      workout_misses: buildSeries(sessionReports, (item) => item.session_date, (item) => toNumber(item.misses)),
      workout_feeling: buildSeries(sessionReports, (item) => item.session_date, (item) => item.feeling),
      workout_satisfaction: buildSeries(sessionReports, (item) => item.session_date, (item) => item.satisfaction),
      workout_confidence: buildSeries(sessionReports, (item) => item.session_date, (item) => item.confidence),
      // Meet charts
      meet_performance: buildSeries(compReports, (item) => item.meet_date, (item) => item.performance_rating),
      meet_physical_prep: buildSeries(compReports, (item) => item.meet_date, (item) => item.physical_preparedness_rating),
      meet_mental_prep: buildSeries(compReports, (item) => item.meet_date, (item) => item.mental_preparedness_rating),
      meet_total: buildSeries(compReports, (item) => item.meet_date, (item) => buildMeetTotal(item)),
      meet_satisfaction: buildSeries(compReports, (item) => item.meet_date, (item) => item.satisfaction),
      meet_confidence: buildSeries(compReports, (item) => item.meet_date, (item) => item.confidence),
      meet_pressure: buildSeries(compReports, (item) => item.meet_date, (item) => item.pressure_handling),
      meet_bodyweight: buildSeries(compReports, (item) => item.meet_date, (item) => toNumber(item.bodyweight)),
      meet_snatch_best: buildSeries(compReports, (item) => item.meet_date, (item) => toNumber(item.snatch_best)),
      meet_cj_best: buildSeries(compReports, (item) => item.meet_date, (item) => toNumber(item.cj_best)),
      meet_squat_best: buildSeries(compReports, (item) => item.meet_date, (item) => toNumber(item.squat_best)),
      meet_bench_best: buildSeries(compReports, (item) => item.meet_date, (item) => toNumber(item.bench_best)),
      meet_deadlift_best: buildSeries(compReports, (item) => item.meet_date, (item) => toNumber(item.deadlift_best)),
      // Oura charts
      oura_sleep: buildSeries(
        ouraData.filter((item) => item.sleepDurationHours !== undefined),
        (item) => item.date,
        (item) => item.sleepDurationHours ?? 0
      ),
      oura_hrv: buildSeries(
        ouraData.filter((item) => item.hrv !== undefined),
        (item) => item.date,
        (item) => item.hrv ?? 0
      ),
      oura_heart_rate: buildSeries(
        ouraData.filter((item) => item.averageHeartRate !== undefined),
        (item) => item.date,
        (item) => item.averageHeartRate ?? 0
      ),
      oura_readiness: buildSeries(
        ouraData.filter((item) => item.readinessScore !== undefined),
        (item) => item.date,
        (item) => item.readinessScore ?? 0
      ),
      // Whoop charts
      whoop_recovery: buildSeries(
        whoopData.filter((item) => item.recoveryScore !== undefined),
        (item) => item.date,
        (item) => item.recoveryScore ?? 0
      ),
      whoop_sleep: buildSeries(
        whoopData.filter((item) => item.sleepDurationHours !== undefined),
        (item) => item.date,
        (item) => item.sleepDurationHours ?? 0
      ),
      whoop_sleep_performance: buildSeries(
        whoopData.filter((item) => item.sleepPerformance !== undefined),
        (item) => item.date,
        (item) => item.sleepPerformance ?? 0
      ),
      whoop_strain: buildSeries(
        whoopData.filter((item) => item.strainScore !== undefined),
        (item) => item.date,
        (item) => item.strainScore ?? 0
      ),
      whoop_hrv: buildSeries(
        whoopData.filter((item) => item.hrvMs !== undefined),
        (item) => item.date,
        (item) => item.hrvMs ?? 0
      ),
      whoop_resting_hr: buildSeries(
        whoopData.filter((item) => item.restingHeartRate !== undefined),
        (item) => item.date,
        (item) => item.restingHeartRate ?? 0
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
    isLoading,
    error,
    refresh,
    checkIns,
    sessionReports,
    compReports,
    ouraData,
    whoopData,
  };
}
