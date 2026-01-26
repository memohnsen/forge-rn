export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
  isTodayTrainingDay: boolean;
  isActive: boolean;
  lastActivityDate?: string;
}
