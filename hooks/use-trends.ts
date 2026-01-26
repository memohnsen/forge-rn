import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { createClerkSupabaseClient } from '@/services/supabase';
import { CheckIn } from '@/models/CheckIn';
import { SessionReport } from '@/models/Session';
import { CompReport } from '@/models/Competition';
import { CATEGORIES, type ChartCategory, type TrendPoint } from '@/utils/trends-data';

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
  const { getToken, userId } = useAuth();

  const supabase = useMemo(() => {
    return createClerkSupabaseClient(async () => {
      return getToken({ template: 'supabase' });
    });
  }, [getToken]);

  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [sessionReports, setSessionReports] = useState<SessionReport[]>([]);
  const [compReports, setCompReports] = useState<CompReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);

    try {
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
    } catch (err) {
      console.error('[useTrends] Error fetching trends data:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    if (userId) {
      refresh();
    }
  }, [userId, refresh]);

  const dataByChartId = useMemo<Record<string, TrendPoint[]>>(() => {
    return {
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
      workout_rpe: buildSeries(sessionReports, (item) => item.session_date, (item) => item.session_rpe),
      workout_quality: buildSeries(sessionReports, (item) => item.session_date, (item) => item.movement_quality),
      workout_focus: buildSeries(sessionReports, (item) => item.session_date, (item) => item.focus),
      workout_misses: buildSeries(sessionReports, (item) => item.session_date, (item) => toNumber(item.misses)),
      workout_feeling: buildSeries(sessionReports, (item) => item.session_date, (item) => item.feeling),
      workout_satisfaction: buildSeries(sessionReports, (item) => item.session_date, (item) => item.satisfaction),
      workout_confidence: buildSeries(sessionReports, (item) => item.session_date, (item) => item.confidence),
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
    };
  }, [checkIns, sessionReports, compReports]);

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
    isLoading,
    error,
    refresh,
  };
}
