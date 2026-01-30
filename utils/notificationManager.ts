import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { formatToISO } from '@/utils/dateFormatter';
import { clearJournalWidget, updateJournalWidget } from '@/utils/widgetStorage';

const STORAGE_KEYS = {
  enabled: 'notifications_enabled_v1',
  trainingDays: 'notifications_training_days_v1',
  meetDate: 'notifications_meet_date_v1',
  meetName: 'notifications_meet_name_v1',
};

const WEEKDAY_MAP: Record<string, number> = {
  Sunday: 1,
  Monday: 2,
  Tuesday: 3,
  Wednesday: 4,
  Thursday: 5,
  Friday: 6,
  Saturday: 7,
};

const TIME_REGEX = /^\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*$/i;

function parseTimeString(timeString: string): { hour: number; minute: number } | null {
  const match = TIME_REGEX.exec(timeString);
  if (!match) return null;

  const hourRaw = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (Number.isNaN(hourRaw) || Number.isNaN(minute)) return null;

  let hour = hourRaw % 12;
  if (meridiem === 'PM') hour += 12;

  return { hour, minute };
}

function addHours(hour: number, minute: number, add: number) {
  const totalMinutes = hour * 60 + minute + add * 60;
  const wrapped = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const dayShift = totalMinutes >= 24 * 60 ? 1 : 0;

  return {
    hour: Math.floor(wrapped / 60),
    minute: wrapped % 60,
    dayShift,
  };
}

function parseMeetDate(dateString: string): Date | null {
  if (!dateString) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map((part) => Number(part));
    if ([year, month, day].some((value) => Number.isNaN(value))) return null;
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function getDaysUntilMeet(meetDate?: string): number | null {
  const date = parseMeetDate(meetDate ?? '');
  if (!date) return null;

  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getSessionsLeft(daysUntilMeet: number, trainingDays: TrainingDays) {
  const trainingDaysPerWeek = Object.keys(trainingDays).length;
  if (daysUntilMeet <= 0 || trainingDaysPerWeek === 0) return 0;

  const weeksRemaining = Math.max(0, daysUntilMeet / 7);
  return Math.ceil(weeksRemaining * trainingDaysPerWeek);
}

async function syncWidgetData(params: {
  meetDate?: string;
  meetName?: string;
  trainingDays?: TrainingDays;
}) {
  if (Platform.OS !== 'ios') return;

  const meetDate = params.meetDate;
  const meetName = params.meetName;

  if (!meetDate || !meetName) {
    await clearJournalWidget();
    return;
  }

  const parsedMeetDate = parseMeetDate(meetDate);
  if (!parsedMeetDate) {
    await clearJournalWidget();
    return;
  }

  const normalizedMeetDate = formatToISO(parsedMeetDate);
  const daysUntilMeet = getDaysUntilMeet(meetDate) ?? 0;
  const sessionsLeft = getSessionsLeft(daysUntilMeet, params.trainingDays ?? {});

  await updateJournalWidget({
    meetName,
    meetDate: normalizedMeetDate,
    daysUntilMeet,
    sessionsLeft,
  });
}

function getPermissionGranted(settings: Notifications.NotificationPermissionsStatus) {
  if ('granted' in settings && typeof settings.granted === 'boolean') {
    return settings.granted;
  }

  if ('status' in settings && typeof settings.status === 'string') {
    return settings.status === Notifications.PermissionStatus.GRANTED;
  }

  return false;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#5386E4',
  });
}

async function scheduleWeeklyNotification(
  identifier: string,
  title: string,
  body: string,
  weekday: number,
  hour: number,
  minute: number,
  categoryIdentifier?: string
) {
  return Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title,
      body,
      sound: 'default',
      categoryIdentifier,
    },
    // Weekly trigger uses the device's local timezone by default.
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday,
      hour,
      minute,
    },
  });
}

async function scheduleDateNotification(
  identifier: string,
  title: string,
  body: string,
  date: Date,
  categoryIdentifier?: string
) {
  return Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title,
      body,
      sound: 'default',
      categoryIdentifier,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
}

export type TrainingDays = Record<string, string>;

export const notificationManager = {
  async getEnabled() {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.enabled);
    return value === 'true';
  },

  async setEnabled(enabled: boolean) {
    await AsyncStorage.setItem(STORAGE_KEYS.enabled, String(enabled));
  },

  async checkPermission() {
    const settings = await Notifications.getPermissionsAsync();
    return getPermissionGranted(settings);
  },

  async requestPermission() {
    const settings = await Notifications.requestPermissionsAsync();
    return getPermissionGranted(settings);
  },

  async cancelAll() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
  },

  async getTrainingDays(): Promise<TrainingDays> {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.trainingDays);
    if (!value) return {};

    try {
      const parsed = JSON.parse(value) as TrainingDays;
      return parsed || {};
    } catch {
      return {};
    }
  },

  async storeTrainingDays(trainingDays: TrainingDays) {
    await AsyncStorage.setItem(STORAGE_KEYS.trainingDays, JSON.stringify(trainingDays));
    const meetData = await this.getMeetData();
    await syncWidgetData({
      meetDate: meetData.meetDate,
      meetName: meetData.meetName,
      trainingDays,
    });
  },

  async storeMeetData(meetDate: string, meetName: string) {
    await AsyncStorage.setItem(STORAGE_KEYS.meetDate, meetDate);
    await AsyncStorage.setItem(STORAGE_KEYS.meetName, meetName);
    const trainingDays = await this.getTrainingDays();
    await syncWidgetData({ meetDate, meetName, trainingDays });
  },

  async clearMeetData() {
    await AsyncStorage.multiRemove([STORAGE_KEYS.meetDate, STORAGE_KEYS.meetName]);
    await clearJournalWidget();
  },

  async getMeetData() {
    const [meetDate, meetName] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.meetDate),
      AsyncStorage.getItem(STORAGE_KEYS.meetName),
    ]);

    return {
      meetDate: meetDate || undefined,
      meetName: meetName || undefined,
    };
  },

  async scheduleNotifications(options?: {
    trainingDays?: TrainingDays;
    meetDate?: string;
    meetName?: string;
    enabled?: boolean;
  }) {
    const enabled = options?.enabled ?? (await this.getEnabled());
    if (!enabled) return;

    await ensureAndroidChannel();
    await this.cancelAll();

    const trainingDays = options?.trainingDays ?? (await this.getTrainingDays());
    const meetData = await this.getMeetData();
    const meetDate = options?.meetDate ?? meetData.meetDate;
    const meetName = options?.meetName ?? meetData.meetName;

    if (trainingDays && Object.keys(trainingDays).length > 0) {
      await Promise.all(
        Object.entries(trainingDays).map(async ([dayName, timeString]) => {
          const time = parseTimeString(timeString);
          const weekday = WEEKDAY_MAP[dayName];
          if (!time || !weekday) return;

          await scheduleWeeklyNotification(
            `checkin_${dayName}`,
            'Time for your daily check-in!',
            "Track your readiness before today's session.",
            weekday,
            time.hour,
            time.minute,
            'CHECK_IN'
          );

          const sessionTime = addHours(time.hour, time.minute, 2);
          const sessionWeekday = weekday + sessionTime.dayShift > 7 ? 1 : weekday + sessionTime.dayShift;

          await scheduleWeeklyNotification(
            `session_${dayName}`,
            'How did your session go?',
            'Reflect on your training to optimize future performance.',
            sessionWeekday,
            sessionTime.hour,
            sessionTime.minute,
            'SESSION_REFLECTION'
          );
        })
      );
    }

    if (meetDate && meetName) {
      const date = parseMeetDate(meetDate);
      if (date) {
        const localDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          17,
          0,
          0
        );

        await scheduleDateNotification(
          `comp_${meetDate}`,
          'Competition Day Analysis',
          'Complete your post-competition reflection.',
          localDate,
          'COMP_REFLECTION'
        );
      }
    }
  },
};
