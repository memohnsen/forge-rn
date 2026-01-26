import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { createClerkSupabaseClient } from '@/services/supabase';
import { CheckIn } from '@/models/CheckIn';
import { SessionReport } from '@/models/Session';
import { CompReport } from '@/models/Competition';

export type HistoryFilter = 'Check-Ins' | 'Workouts' | 'Meets';

interface UseHistoryReturn {
  checkIns: CheckIn[];
  sessionReports: SessionReport[];
  compReports: CompReport[];
  isLoading: boolean;
  error: Error | null;
  selectedFilter: HistoryFilter;
  setSelectedFilter: (filter: HistoryFilter) => void;
  refresh: () => Promise<void>;
}

interface UseHistoryDetailsReturn {
  checkIn: CheckIn | null;
  session: SessionReport | null;
  comp: CompReport | null;
  isLoading: boolean;
  error: Error | null;
  deleteItem: () => Promise<boolean>;
}

export function useHistory(): UseHistoryReturn {
  const { getToken, userId } = useAuth();
  const getTokenRef = useRef(getToken);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const supabase = useMemo(() => {
    return createClerkSupabaseClient(async () => {
      return getTokenRef.current({ template: 'supabase', skipCache: true });
    });
  }, []);

  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [sessionReports, setSessionReports] = useState<SessionReport[]>([]);
  const [compReports, setCompReports] = useState<CompReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<HistoryFilter>('Check-Ins');

  const fetchCheckIns = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error: fetchError } = await supabase
        .from('journal_daily_checkins')
        .select('*')
        .eq('user_id', userId)
        .order('check_in_date', { ascending: false });

      if (fetchError) throw fetchError;
      setCheckIns(data || []);
    } catch (err) {
      console.error('Error fetching check-ins:', err);
      setError(err as Error);
    }
  }, [supabase, userId]);

  const fetchSessionReports = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error: fetchError } = await supabase
        .from('journal_session_report')
        .select('*')
        .eq('user_id', userId)
        .order('session_date', { ascending: false });

      if (fetchError) throw fetchError;
      setSessionReports(data || []);
    } catch (err) {
      console.error('Error fetching session reports:', err);
      setError(err as Error);
    }
  }, [supabase, userId]);

  const fetchCompReports = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error: fetchError } = await supabase
        .from('journal_comp_report')
        .select('*')
        .eq('user_id', userId)
        .order('meet_date', { ascending: false });

      if (fetchError) throw fetchError;
      setCompReports(data || []);
    } catch (err) {
      console.error('Error fetching comp reports:', err);
      setError(err as Error);
    }
  }, [supabase, userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    await Promise.all([fetchCheckIns(), fetchSessionReports(), fetchCompReports()]);
    setIsLoading(false);
  }, [fetchCheckIns, fetchSessionReports, fetchCompReports, userId]);

  useEffect(() => {
    if (userId) {
      refresh();
    }
  }, [userId]);

  return {
    checkIns,
    sessionReports,
    compReports,
    isLoading,
    error,
    selectedFilter,
    setSelectedFilter,
    refresh,
  };
}

export function useHistoryDetails(
  type: HistoryFilter,
  id: number
): UseHistoryDetailsReturn {
  const { getToken, userId, isLoaded } = useAuth();
  const getTokenRef = useRef(getToken);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const supabase = useMemo(() => {
    return createClerkSupabaseClient(async () => {
      return getTokenRef.current({ template: 'supabase', skipCache: true });
    });
  }, []);

  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [session, setSession] = useState<SessionReport | null>(null);
  const [comp, setComp] = useState<CompReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!isLoaded) {
        setIsLoading(true);
        return;
      }

      if (!userId || !id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (type === 'Check-Ins') {
          const { data, error: fetchError } = await supabase
            .from('journal_daily_checkins')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .maybeSingle();

          if (fetchError) throw fetchError;
          setCheckIn(data);
        } else if (type === 'Workouts') {
          const { data, error: fetchError } = await supabase
            .from('journal_session_report')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .maybeSingle();

          if (fetchError) throw fetchError;
          setSession(data);
        } else if (type === 'Meets') {
          const { data, error: fetchError } = await supabase
            .from('journal_comp_report')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .maybeSingle();

          if (fetchError) throw fetchError;
          setComp(data);
        }
      } catch (err) {
        console.error('Error fetching details:', err);
        setError(err as Error);
      }

      setIsLoading(false);
    };

    fetchDetails();
  }, [type, id, supabase, userId, isLoaded]);

  const deleteItem = useCallback(async (): Promise<boolean> => {
    try {
      let tableName = '';
      if (type === 'Check-Ins') {
        tableName = 'journal_daily_checkins';
      } else if (type === 'Workouts') {
        tableName = 'journal_session_report';
      } else if (type === 'Meets') {
        tableName = 'journal_comp_report';
      }

      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      return true;
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(err as Error);
      return false;
    }
  }, [type, id, supabase]);

  return {
    checkIn,
    session,
    comp,
    isLoading,
    error,
    deleteItem,
  };
}

// Score color helper
export function getScoreColor(score: number, type: HistoryFilter): string {
  if (type === 'Check-Ins') {
    if (score >= 80) return '#5AB48C'; // Green
    if (score >= 60) return '#FFB450'; // Orange/Yellow
    return '#DC6464'; // Red
  } else if (type === 'Workouts') {
    // RPE: lower is better
    if (score <= 2) return '#5AB48C'; // Green
    if (score <= 3) return '#FFB450'; // Orange/Yellow
    return '#DC6464'; // Red
  }
  return '#5386E4'; // Blue default
}

// Accent color for filter type
export function getAccentColor(type: HistoryFilter): string {
  switch (type) {
    case 'Meets':
      return '#FFD700'; // Gold
    case 'Workouts':
      return '#5386E4'; // Blue
    default:
      return '#5AB48C'; // Green for check-ins
  }
}
