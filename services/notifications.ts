import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

const trainingDaysKey = 'training-days';
const meetDataKey = 'meet-data';

interface MeetData {
  meetDate: string;
  meetName: string;
}

export const storeTrainingDays = async (trainingDays: Record<string, string>) => {
  await SecureStore.setItemAsync(trainingDaysKey, JSON.stringify(trainingDays));
};

export const storeMeetData = async (meetData: MeetData) => {
  await SecureStore.setItemAsync(meetDataKey, JSON.stringify(meetData));
};

export const requestPermission = async (): Promise<boolean> => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

const parseStored = async <T>(key: string): Promise<T | null> => {
  const value = await SecureStore.getItemAsync(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const scheduleNotifications = async () => {
  const trainingDays = await parseStored<Record<string, string>>(trainingDaysKey);
  if (!trainingDays) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const days = Object.keys(trainingDays);
  for (const day of days) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Forge Training Reminder',
        body: 'Take a moment to log your daily check-in before training.',
      },
      trigger: {
        weekday: dayToNumber(day),
        hour: 9,
        minute: 0,
        repeats: true,
      },
    });
  }
};

const dayToNumber = (day: string): number => {
  const map: Record<string, number> = {
    Sunday: 1,
    Monday: 2,
    Tuesday: 3,
    Wednesday: 4,
    Thursday: 5,
    Friday: 6,
    Saturday: 7,
  };
  return map[day] ?? 1;
};
