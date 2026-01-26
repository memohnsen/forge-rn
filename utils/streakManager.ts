import { CheckIn } from '@/models/CheckIn';
import { SessionReport } from '@/models/Session';
import { StreakData } from '@/models/Streak';

class StreakManager {
  private static instance: StreakManager;

  private constructor() {}

  static getInstance(): StreakManager {
    if (!StreakManager.instance) {
      StreakManager.instance = new StreakManager();
    }
    return StreakManager.instance;
  }

  calculateStreak(
    checkIns: CheckIn[],
    sessionReports: SessionReport[],
    trainingDays: Record<string, string>
  ): StreakData {
    const activityDates = this.getUniqueActivityDates(checkIns, sessionReports);
    const trainingDayNames = new Set(Object.keys(trainingDays));

    const today = this.getStartOfDay(new Date());
    const todayName = this.getDayName(today);
    const isTodayTrainingDay = trainingDayNames.has(todayName);
    const completedToday = activityDates.has(this.formatDate(today));

    if (activityDates.size === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: undefined,
        isActive: !isTodayTrainingDay,
        completedToday: false,
        isTodayTrainingDay,
      };
    }

    const sortedActivityDates = Array.from(activityDates)
      .map((dateStr) => this.getStartOfDay(new Date(dateStr)))
      .sort((a, b) => b.getTime() - a.getTime());

    const mostRecentActivity = sortedActivityDates[0];
    if (!mostRecentActivity) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: undefined,
        isActive: !isTodayTrainingDay,
        completedToday: false,
        isTodayTrainingDay,
      };
    }

    const isActive = this.checkStreakActive(
      today,
      mostRecentActivity,
      activityDates,
      trainingDayNames
    );

    const currentStreak = this.calculateCurrentStreak(
      sortedActivityDates,
      activityDates,
      trainingDayNames,
      today
    );

    const longestStreak = this.calculateLongestStreak(
      sortedActivityDates,
      activityDates,
      trainingDayNames
    );

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      lastActivityDate: this.formatDate(mostRecentActivity),
      isActive,
      completedToday,
      isTodayTrainingDay,
    };
  }

  private getUniqueActivityDates(
    checkIns: CheckIn[],
    sessionReports: SessionReport[]
  ): Set<string> {
    const dates = new Set<string>();

    checkIns.forEach((checkIn) => {
      const dateOnly = checkIn.check_in_date.substring(0, 10);
      dates.add(dateOnly);
    });

    sessionReports.forEach((report) => {
      const dateOnly = report.session_date.substring(0, 10);
      dates.add(dateOnly);
    });

    return dates;
  }

  private checkStreakActive(
    today: Date,
    mostRecentActivity: Date,
    activityDates: Set<string>,
    trainingDayNames: Set<string>
  ): boolean {
    const todayString = this.formatDate(today);
    if (activityDates.has(todayString)) {
      return true;
    }

    let checkDate = new Date(today);
    while (checkDate >= mostRecentActivity) {
      const checkDateString = this.formatDate(checkDate);
      const dayName = this.getDayName(checkDate);

      if (trainingDayNames.has(dayName)) {
        if (activityDates.has(checkDateString)) {
          return true;
        } else {
          return false;
        }
      }

      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
    }

    return true;
  }

  private calculateCurrentStreak(
    sortedActivityDates: Date[],
    activityDates: Set<string>,
    trainingDayNames: Set<string>,
    today: Date
  ): number {
    if (sortedActivityDates.length === 0) return 0;

    let streak = 0;
    let checkDate = new Date(today);
    let missedTrainingDay = false;

    const oldestActivity = sortedActivityDates[sortedActivityDates.length - 1] || today;
    const searchLimit = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

    while (checkDate >= searchLimit && !missedTrainingDay) {
      const checkDateString = this.formatDate(checkDate);
      const dayName = this.getDayName(checkDate);

      if (trainingDayNames.has(dayName)) {
        if (activityDates.has(checkDateString)) {
          streak += 1;
        } else {
          missedTrainingDay = true;
        }
      }

      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
    }

    return streak;
  }

  private calculateLongestStreak(
    sortedActivityDates: Date[],
    activityDates: Set<string>,
    trainingDayNames: Set<string>
  ): number {
    if (sortedActivityDates.length === 0) return 0;

    const oldestActivity = sortedActivityDates[sortedActivityDates.length - 1];
    const newestActivity = sortedActivityDates[0];

    if (!oldestActivity || !newestActivity) return 0;

    let longestStreak = 0;
    let currentStreak = 0;
    let checkDate = new Date(newestActivity);

    while (checkDate >= oldestActivity) {
      const checkDateString = this.formatDate(checkDate);
      const dayName = this.getDayName(checkDate);

      if (trainingDayNames.has(dayName)) {
        if (activityDates.has(checkDateString)) {
          currentStreak += 1;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }

      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
    }

    return longestStreak;
  }

  private getStartOfDay(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getDayName(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }
}

export default StreakManager.getInstance();
