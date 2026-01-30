import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { createClerkSupabaseClient } from '@/services/supabase';
import { User } from '@/models/User';
import { CheckIn } from '@/models/CheckIn';
import { SessionReport } from '@/models/Session';
import { StreakData } from '@/models/Streak';
import streakManager from '@/utils/streakManager';
import { notificationManager } from '@/utils/notificationManager';

const STREAK_ORANGE = '#FF9500';
const STREAK_RED = '#FF453A';
const STREAK_GRAY = '#8E8E93';

export const useHome = () => {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  // Create Supabase client with Clerk JWT
  const supabase = useMemo(() => {
    return createClerkSupabaseClient(async () => {
      return getTokenRef.current({ template: 'supabase', skipCache: true });
    });
  }, []);

  const [users, setUsers] = useState<User[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [sessionReports, setSessionReports] = useState<SessionReport[]>([]);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const user = users[0];

  // Computed values
  const streakDisplayText = streakData ? `${streakData.currentStreak}` : '0';

  const streakLabelText = 'day streak!';

  const streakStatusText = (() => {
    if (!streakData) return 'Start your streak today!';

    if (streakData.currentStreak === 0 && streakData.isTodayTrainingDay) {
      return 'Start your streak today!';
    } else if (streakData.currentStreak === 0) {
      return 'Rest day - streak safe!';
    } else if (streakData.completedToday) {
      return "You're on fire!";
    } else if (streakData.isTodayTrainingDay && streakData.isActive) {
      return 'Log today to keep your streak!';
    } else if (streakData.isActive) {
      return 'Keep it up!';
    } else {
      return 'Start a new streak!';
    }
  })();

  const streakColor = (() => {
    if (!streakData) return STREAK_GRAY;

    if (streakData.currentStreak === 0) {
      return STREAK_GRAY;
    } else if (streakData.completedToday) {
      return STREAK_ORANGE;
    } else if (streakData.isTodayTrainingDay && streakData.isActive) {
      return STREAK_RED;
    } else if (streakData.isActive) {
      return STREAK_ORANGE;
    } else {
      return STREAK_GRAY;
    }
  })();

  const streakIconName = streakData && streakData.currentStreak > 0 ? 'flame' : 'flame.fill';

  const daysUntilMeet = (() => {
    if (!user?.next_competition_date) return 0;
    const meetDate = new Date(user.next_competition_date);
    const today = new Date();
    const diffTime = meetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  })();

  const meetNameDisplay = (() => {
    if (daysUntilMeet < 0) {
      return 'Tap To Set Your Next Meet';
    } else {
      return user?.next_competition || 'No Meet Coming Up';
    }
  })();

  const trainingDaysPerWeek = Object.keys(user?.training_days || {}).length;

  const sessionsLeft = (() => {
    const weeksRemaining = Math.max(0, daysUntilMeet / 7);
    const sessions = Math.ceil(weeksRemaining * trainingDaysPerWeek);
    return sessions;
  })();

  const daysUntilMeetText = (() => {
    if (daysUntilMeet < 0) {
      return 'Completed';
    } else if (daysUntilMeet === 0) {
      return 'Today!';
    } else {
      return `${daysUntilMeet} day${daysUntilMeet === 1 ? '' : 's'} left`;
    }
  })();

  const sessionsLeftText = (() => {
    if (daysUntilMeet < 0 || daysUntilMeet === 0) {
      return '0';
    } else {
      return `${sessionsLeft} session${sessionsLeft === 1 ? '' : 's'} left`;
    }
  })();

  // API methods
  const fetchUsers = useCallback(
    async (userId: string) => {
      setIsLoading(true);
      console.log('[useHome] Fetching users for:', userId);
      try {
        const { data, error } = await supabase
          .from('journal_users')
          .select('*')
          .eq('user_id', userId);

        console.log('[useHome] Users response:', { data, error });
        if (error) throw error;
        setUsers(data || []);
      } catch (err) {
        console.error('[useHome] Error fetching users:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  const fetchCheckIns = useCallback(
    async (userId: string) => {
      setLoadingHistory(true);
      console.log('[useHome] Fetching check-ins for:', userId);
      try {
        const { data, error } = await supabase
          .from('journal_daily_checkins')
          .select('*')
          .eq('user_id', userId)
          .order('check_in_date', { ascending: false });

        console.log('[useHome] Check-ins response:', { data, error });
        if (error) throw error;
        setCheckIns(data || []);
      } catch (err) {
        console.error('[useHome] Error fetching check-ins:', err);
        setError(err as Error);
      } finally {
        setLoadingHistory(false);
      }
    },
    [supabase]
  );

  const fetchSessionReports = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('journal_session_report')
          .select('*')
          .eq('user_id', userId)
          .order('session_date', { ascending: false });

        if (error) throw error;
        setSessionReports(data || []);
      } catch (err) {
        console.error('Error fetching session reports:', err);
        setError(err as Error);
      }
    },
    [supabase]
  );

  const submitUserProfile = useCallback(
    async (userProfile: User) => {
      setIsLoading(true);
      setError(null);
      try {
        const { error } = await supabase.from('journal_users').insert(userProfile);

        if (error) throw error;
      } catch (err) {
        console.error('Error submitting user profile:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  const updateUserMeet = useCallback(
    async (
      userId: string,
      meetName: string,
      meetDate: string,
      fallbackProfile?: Partial<User>
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        if (fallbackProfile) {
          const payload = {
            user_id: userId,
            next_competition: meetName,
            next_competition_date: meetDate,
            ...fallbackProfile,
          };
          const cleanedPayload = Object.fromEntries(
            Object.entries(payload).filter(([, value]) => value !== undefined)
          );

          const { error } = await supabase
            .from('journal_users')
            .upsert(cleanedPayload, { onConflict: 'user_id' });

          if (error) throw error;
          if (meetDate && meetName) {
            await notificationManager.storeMeetData(meetDate, meetName);
          } else {
            await notificationManager.clearMeetData();
          }
          return true;
        }

        const { error } = await supabase
          .from('journal_users')
          .update({
            next_competition: meetName,
            next_competition_date: meetDate,
          })
          .eq('user_id', userId);

        if (error) throw error;

        if (meetDate && meetName) {
          await notificationManager.storeMeetData(meetDate, meetName);
        } else {
          await notificationManager.clearMeetData();
        }
        return true;
      } catch (err) {
        console.error('Error updating user meet:', err);
        setError(err as Error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  const updateCoachEmail = useCallback(
    async (userId: string, email: string | null) => {
      setIsLoading(true);
      setError(null);
      try {
        const { error } = await supabase
          .from('journal_users')
          .update({
            coach_email: email,
          })
          .eq('user_id', userId);

        if (error) throw error;
        return true;
      } catch (err) {
        console.error('Error updating coach email:', err);
        setError(err as Error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [supabase]
  );

  const calculateStreak = useCallback(() => {
    const trainingDays = user?.training_days || {};
    const data = streakManager.calculateStreak(checkIns, sessionReports, trainingDays);
    setStreakData(data);
  }, [user, checkIns, sessionReports]);

  const refreshData = useCallback(
    async (userId: string) => {
      await Promise.all([fetchUsers(userId), fetchCheckIns(userId), fetchSessionReports(userId)]);
      calculateStreak();
    },
    [fetchUsers, fetchCheckIns, fetchSessionReports, calculateStreak]
  );

  return {
    // State
    users,
    user,
    checkIns,
    sessionReports,
    streakData,
    isLoading,
    loadingHistory,
    error,

    // Computed values
    streakDisplayText,
    streakLabelText,
    streakStatusText,
    streakColor,
    streakIconName,
    daysUntilMeet,
    meetNameDisplay,
    trainingDaysPerWeek,
    sessionsLeft,
    daysUntilMeetText,
    sessionsLeftText,

    // Methods
    fetchUsers,
    fetchCheckIns,
    fetchSessionReports,
    submitUserProfile,
    updateUserMeet,
    updateCoachEmail,
    calculateStreak,
    refreshData,
  };
};
