import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
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
  const { userId } = useAuth();

  // Convex reactive queries
  const convexUser = useQuery(api.users.getByUserId, userId ? { userId } : 'skip');
  const convexCheckIns = useQuery(api.dailyCheckIns.listByUser, userId ? { userId } : 'skip');
  const convexSessionReports = useQuery(api.sessionReports.listByUser, userId ? { userId } : 'skip');

  // Mutations
  const convexUpsert = useMutation(api.users.upsert);
  const convexUpdateMeet = useMutation(api.users.updateMeet);
  const convexUpdateCoachEmail = useMutation(api.users.updateCoachEmail);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const user = convexUser as User | null | undefined;
  const checkIns = (convexCheckIns as CheckIn[] | undefined) ?? [];
  const sessionReports = (convexSessionReports as SessionReport[] | undefined) ?? [];
  const loadingHistory = convexCheckIns === undefined || convexSessionReports === undefined;

  const streakData = useMemo<StreakData | null>(() => {
    if (convexCheckIns === undefined || convexSessionReports === undefined) return null;
    const trainingDays = user?.trainingDays ?? {};
    return streakManager.calculateStreak(convexCheckIns as CheckIn[], convexSessionReports as SessionReport[], trainingDays);
  }, [user, convexCheckIns, convexSessionReports]);

  // Computed values
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
    if (!streakData) return STREAK_GRAY;
    if (streakData.currentStreak === 0) return STREAK_GRAY;
    if (streakData.completedToday) return STREAK_ORANGE;
    if (streakData.isTodayTrainingDay && streakData.isActive) return STREAK_RED;
    if (streakData.isActive) return STREAK_ORANGE;
    return STREAK_GRAY;
  })();

  const streakIconName = streakData && streakData.currentStreak > 0 ? 'flame' : 'flame.fill';

  const daysUntilMeet = (() => {
    if (!user?.nextCompetitionDate) return 0;
    const meetDate = new Date(user.nextCompetitionDate);
    const today = new Date();
    return Math.ceil((meetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  })();

  const meetNameDisplay = daysUntilMeet < 0
    ? 'Tap To Set Your Next Meet'
    : user?.nextCompetition || 'No Meet Coming Up';

  const trainingDaysPerWeek = Object.keys(user?.trainingDays || {}).length;

  const sessionsLeft = Math.ceil(Math.max(0, daysUntilMeet / 7) * trainingDaysPerWeek);

  const daysUntilMeetText = daysUntilMeet < 0
    ? 'Completed'
    : daysUntilMeet === 0
    ? 'Today!'
    : `${daysUntilMeet} day${daysUntilMeet === 1 ? '' : 's'} left`;

  const sessionsLeftText = daysUntilMeet <= 0
    ? '0'
    : `${sessionsLeft} session${sessionsLeft === 1 ? '' : 's'} left`;

  const calculateStreak = useCallback(() => {}, []);

  // No-op fetch methods — Convex is reactive, no manual fetching needed
  const fetchUsers = useCallback(async (_userId: string) => {}, []);
  const fetchCheckIns = useCallback(async (_userId: string) => {}, []);
  const fetchSessionReports = useCallback(async (_userId: string) => {}, []);
  const refreshData = useCallback(async (_userId: string) => {}, []);

  const submitUserProfile = useCallback(
    async (userProfile: Omit<User, '_id' | '_creationTime'>) => {
      if (!userId) return;
      setIsLoading(true);
      setError(null);
      try {
        await convexUpsert({
          userId: userProfile.userId,
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          sport: userProfile.sport,
          yearsOfExperience: userProfile.yearsOfExperience,
          meetsPerYear: userProfile.meetsPerYear,
          goal: userProfile.goal,
          biggestStruggle: userProfile.biggestStruggle,
          trainingDays: userProfile.trainingDays,
          nextCompetition: userProfile.nextCompetition,
          nextCompetitionDate: userProfile.nextCompetitionDate,
          currentTrackingMethod: userProfile.currentTrackingMethod,
          biggestFrustration: userProfile.biggestFrustration,
          reflectionFrequency: userProfile.reflectionFrequency,
          whatHoldingBack: userProfile.whatHoldingBack,
          coachEmail: userProfile.coachEmail ?? undefined,
          storeToken: userProfile.storeToken,
        });
      } catch (err) {
        console.error('Error submitting user profile:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    },
    [userId, convexUpsert]
  );

  const updateUserMeet = useCallback(
    async (_userId: string, meetName: string, meetDate: string, fallbackProfile?: Partial<User>) => {
      if (!userId) return false;
      setIsLoading(true);
      setError(null);
      try {
        if (fallbackProfile && !user) {
          await convexUpsert({
            userId,
            firstName: fallbackProfile.firstName ?? '',
            lastName: fallbackProfile.lastName ?? '',
            sport: fallbackProfile.sport ?? '',
            yearsOfExperience: fallbackProfile.yearsOfExperience ?? 0,
            meetsPerYear: fallbackProfile.meetsPerYear ?? 0,
            goal: fallbackProfile.goal ?? '',
            biggestStruggle: fallbackProfile.biggestStruggle ?? '',
            trainingDays: fallbackProfile.trainingDays ?? {},
            nextCompetition: meetName || undefined,
            nextCompetitionDate: meetDate || undefined,
          });
        } else {
          await convexUpdateMeet({ userId, nextCompetition: meetName, nextCompetitionDate: meetDate });
        }

        if (meetDate && meetName) {
          try { await notificationManager.storeMeetData(meetDate, meetName); } catch {}
        } else {
          try { await notificationManager.clearMeetData(); } catch {}
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
    [userId, user, convexUpsert, convexUpdateMeet]
  );

  const updateCoachEmail = useCallback(
    async (_userId: string, email: string | null) => {
      if (!userId) return false;
      setIsLoading(true);
      setError(null);
      try {
        await convexUpdateCoachEmail({ userId, coachEmail: email ?? '' });
        return true;
      } catch (err) {
        console.error('Error updating coach email:', err);
        setError(err as Error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, convexUpdateCoachEmail]
  );

  const users = user ? [user] : [];

  return {
    users,
    user,
    checkIns,
    sessionReports,
    streakData,
    isLoading,
    loadingHistory,
    error,
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
