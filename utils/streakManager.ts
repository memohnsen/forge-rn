import type { DailyCheckIn } from '@/models/CheckIn';
import type { SessionReport } from '@/models/Session';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: string;
  isActive: boolean;
  daysUntilBreak: number;
  completedToday: boolean;
  isTodayTrainingDay: boolean;
}

const dateFormatter = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long' });

const formatDateKey = (date: Date): string => {
  return dateFormatter.format(date);
};

const dayName = (date: Date): string => {
  return dayFormatter.format(date);
};

const getUniqueActivityDates = (checkIns: DailyCheckIn[], sessionReports: SessionReport[]): Set<string> => {
  const dates = new Set<string>();
  checkIns.forEach((checkIn) => dates.add(checkIn.check_in_date.slice(0, 10)));
  sessionReports.forEach((report) => dates.add(report.session_date.slice(0, 10)));
  return dates;
};

const startOfDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const checkStreakActive = (
  today: Date,
  mostRecentActivity: Date,
  activityDates: Set<string>,
  trainingDayNames: Set<string>
): boolean => {
  const todayString = formatDateKey(today);
  if (activityDates.has(todayString)) {
    return true;
  }

  let checkDate = today;
  while (checkDate >= mostRecentActivity) {
    const checkDateString = formatDateKey(checkDate);
    const name = dayName(checkDate);

    if (trainingDayNames.has(name)) {
      if (activityDates.has(checkDateString)) {
        return true;
      }
      return false;
    }

    checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
  }

  return true;
};

const calculateCurrentStreak = (
  activityDates: Set<string>,
  trainingDayNames: Set<string>,
  today: Date
): number => {
  let streak = 0;
  let checkDate = today;
  let missedTrainingDay = false;

  const searchLimit = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

  while (checkDate >= searchLimit && !missedTrainingDay) {
    const checkDateString = formatDateKey(checkDate);
    const name = dayName(checkDate);

    if (trainingDayNames.has(name)) {
      if (activityDates.has(checkDateString)) {
        streak += 1;
      } else {
        missedTrainingDay = true;
      }
    }

    checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
  }

  return streak;
};

const calculateLongestStreak = (
  sortedActivityDates: Date[],
  activityDates: Set<string>,
  trainingDayNames: Set<string>
): number => {
  if (!sortedActivityDates.length) return 0;
  const oldest = sortedActivityDates[sortedActivityDates.length - 1];
  const newest = sortedActivityDates[0];

  let longest = 0;
  let current = 0;
  let checkDate = newest;

  while (checkDate >= oldest) {
    const checkDateString = formatDateKey(checkDate);
    const name = dayName(checkDate);

    if (trainingDayNames.has(name)) {
      if (activityDates.has(checkDateString)) {
        current += 1;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }

    checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
  }

  return longest;
};

export const calculateStreak = (
  checkIns: DailyCheckIn[],
  sessionReports: SessionReport[],
  trainingDays: Record<string, string>
): StreakData => {
  const activityDates = getUniqueActivityDates(checkIns, sessionReports);
  const trainingDayNames = new Set(Object.keys(trainingDays));

  const today = startOfDay(new Date());
  const todayName = dayName(today);
  const isTodayTrainingDay = trainingDayNames.has(todayName);
  const completedToday = activityDates.has(formatDateKey(today));

  if (!activityDates.size) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: undefined,
      isActive: !isTodayTrainingDay,
      daysUntilBreak: 0,
      completedToday: false,
      isTodayTrainingDay,
    };
  }

  const sortedActivityDates = Array.from(activityDates)
    .map((date) => startOfDay(new Date(date)))
    .sort((a, b) => b.getTime() - a.getTime());

  const mostRecentActivity = sortedActivityDates[0];

  const isActive = checkStreakActive(today, mostRecentActivity, activityDates, trainingDayNames);
  const currentStreak = calculateCurrentStreak(activityDates, trainingDayNames, today);
  const longestStreak = calculateLongestStreak(sortedActivityDates, activityDates, trainingDayNames);

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    lastActivityDate: formatDateKey(mostRecentActivity),
    isActive,
    daysUntilBreak: completedToday ? 1 : 0,
    completedToday,
    isTodayTrainingDay,
  };
};
