import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';

import { createSupabaseClient } from '@/services/supabase';
import type { Users } from '@/models/User';
import type { DailyCheckIn } from '@/models/CheckIn';
import type { SessionReport } from '@/models/Session';
import { calculateStreak, type StreakData } from '@/utils/streakManager';

export const useHome = () => {
  const { getToken, userId } = useAuth();
  const supabase = useMemo(() => {
    try {
      return createSupabaseClient(async () => (await getToken()) ?? null);
    } catch {
      return null;
    }
  }, [getToken]);

  const [users, setUsers] = useState<Users[]>([]);
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [sessionReports, setSessionReports] = useState<SessionReport[]>([]);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!userId || !supabase) return;
    setLoading(true);
    const { data } = await supabase.from('journal_users').select('*').eq('user_id', userId);
    setUsers((data ?? []) as Users[]);
    setLoading(false);
  }, [supabase, userId]);

  const fetchCheckIns = useCallback(async () => {
    if (!userId || !supabase) return;
    setLoadingHistory(true);
    const { data } = await supabase
      .from('journal_daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('check_in_date', { ascending: false });
    setCheckIns((data ?? []) as DailyCheckIn[]);
    setLoadingHistory(false);
  }, [supabase, userId]);

  const fetchSessionReports = useCallback(async () => {
    if (!userId || !supabase) return;
    const { data } = await supabase
      .from('journal_session_report')
      .select('*')
      .eq('user_id', userId)
      .order('session_date', { ascending: false });
    setSessionReports((data ?? []) as SessionReport[]);
  }, [supabase, userId]);

  const refreshStreak = useCallback(() => {
    const trainingDays = users[0]?.training_days ?? {};
    const streak = calculateStreak(checkIns, sessionReports, trainingDays);
    setStreakData(streak);
  }, [users, checkIns, sessionReports]);

  useEffect(() => {
    refreshStreak();
  }, [refreshStreak]);

  const daysUntilMeet = useMemo(() => {
    const user = users[0];
    if (!user?.next_competition_date) return 0;
    const meetDate = new Date(user.next_competition_date);
    if (Number.isNaN(meetDate.getTime())) return 0;
    const diff = meetDate.getTime() - Date.now();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [users]);

  const meetNameDisplay = daysUntilMeet < 0 ? 'Tap To Set Your Next Meet' : users[0]?.next_competition ?? 'No Meet Coming Up';
  const trainingDaysPerWeek = users[0]?.training_days ? Object.keys(users[0].training_days).length : 0;
  const weeksRemaining = Math.max(0, daysUntilMeet / 7);
  const sessionsLeft = Math.ceil(weeksRemaining * trainingDaysPerWeek);
  const daysUntilMeetText =
    daysUntilMeet < 0 ? 'Completed' : daysUntilMeet === 0 ? 'Today!' : `${daysUntilMeet} day${daysUntilMeet === 1 ? '' : 's'} left`;
  const sessionsLeftText = daysUntilMeet <= 0 ? '0' : `${sessionsLeft} session${sessionsLeft === 1 ? '' : 's'} left`;

  const streakDisplayText = streakData ? `${streakData.currentStreak}` : '0';
  const streakLabelText = 'day streak!';
  const streakStatusText = (() => {
    if (!streakData) return 'Start your streak today!';
    if (streakData.currentStreak === 0 && streakData.isTodayTrainingDay) return 'Start your streak today!';
    if (streakData.currentStreak === 0) return 'Rest day - streak safe!';
    if (streakData.completedToday) return "You're on fire!";
    if (streakData.isTodayTrainingDay && streakData.isActive) return 'Log today to keep your streak!';
    if (streakData.isActive) return 'Keep it up!';
    return 'Start a new streak!';
  })();

  const streakColor = (() => {
    if (!streakData) return '#9A9AA1';
    if (streakData.currentStreak === 0) return '#9A9AA1';
    if (streakData.completedToday) return '#FF9500';
    if (streakData.isTodayTrainingDay && streakData.isActive) return '#FF453A';
    if (streakData.isActive) return '#FF9500';
    return '#9A9AA1';
  })();

  const streakIconName = streakData && streakData.currentStreak > 0 ? 'flame' : 'flame-outline';

  return {
    users,
    checkIns,
    sessionReports,
    streakData,
    loading,
    loadingHistory,
    fetchUsers,
    fetchCheckIns,
    fetchSessionReports,
    refreshStreak,
    daysUntilMeet,
    meetNameDisplay,
    daysUntilMeetText,
    sessionsLeftText,
    streakDisplayText,
    streakLabelText,
    streakStatusText,
    streakColor,
    streakIconName,
  };
};
