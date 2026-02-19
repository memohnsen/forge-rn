import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { notificationManager, TrainingDays } from '@/utils/notificationManager';
import {
  trackNotificationEnabled,
  trackNotificationPermissionDenied,
  trackNotificationPermissionGranted,
  trackNotificationPermissionRequested,
  trackNotificationTrainingDaysUpdated,
} from '@/utils/analytics';

export function useNotifications() {
  const { userId } = useAuth();
  const [trainingDays, setTrainingDays] = useState<TrainingDays>({});
  const [isEnabled, setIsEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const meetDataRef = { current: {} as { meetDate?: string; meetName?: string } };

  // Convex reactive query and mutation
  const convexUser = useQuery(api.users.getByUserId, userId ? { userId } : 'skip');
  const convexUpdateTrainingDays = useMutation(api.users.updateTrainingDays);

  // Sync training days from Convex when user data loads
  useEffect(() => {
    if (convexUser && convexUser.trainingDays) {
      setTrainingDays(convexUser.trainingDays as TrainingDays);
      notificationManager.storeTrainingDays(convexUser.trainingDays as TrainingDays).catch(() => {});
    }
  }, [convexUser]);

  const refreshPermission = useCallback(async () => {
    const permission = await notificationManager.checkPermission();
    setHasPermission(permission);
    return permission;
  }, []);

  const loadStoredSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [enabled, storedTrainingDays, storedMeetData] = await Promise.all([
        notificationManager.getEnabled(),
        notificationManager.getTrainingDays(),
        notificationManager.getMeetData(),
      ]);
      setIsEnabled(enabled);
      setTrainingDays(storedTrainingDays);
      meetDataRef.current = storedMeetData;
      await refreshPermission();
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [refreshPermission]);

  const updateMeetData = useCallback(async (meetDate?: string, meetName?: string) => {
    if (!meetDate || !meetName) {
      meetDataRef.current = {};
      await notificationManager.clearMeetData();
      return;
    }
    meetDataRef.current = { meetDate, meetName };
    await notificationManager.storeMeetData(meetDate, meetName);
  }, []);

  const scheduleAll = useCallback(async () => {
    const { meetDate, meetName } = meetDataRef.current;
    await notificationManager.scheduleNotifications({
      enabled: true,
      trainingDays,
      meetDate,
      meetName,
    });
  }, [trainingDays]);

  const rescheduleNotifications = useCallback(async () => {
    if (!isEnabled) return;
    await scheduleAll();
  }, [isEnabled, scheduleAll]);

  const enableNotifications = useCallback(async () => {
    trackNotificationPermissionRequested();
    const granted = await notificationManager.requestPermission();

    if (granted) {
      trackNotificationPermissionGranted();
      await notificationManager.setEnabled(true);
      setIsEnabled(true);
      setHasPermission(true);
      trackNotificationEnabled(true);
      await scheduleAll();
    } else {
      trackNotificationPermissionDenied();
      await notificationManager.setEnabled(false);
      setIsEnabled(false);
      setHasPermission(false);
      trackNotificationEnabled(false);
    }

    return granted;
  }, [scheduleAll]);

  const disableNotifications = useCallback(async () => {
    await notificationManager.setEnabled(false);
    await notificationManager.cancelAll();
    setIsEnabled(false);
    trackNotificationEnabled(false);
  }, []);

  const saveTrainingDays = useCallback(
    async (newTrainingDays: TrainingDays) => {
      if (!userId) return false;

      setIsSaving(true);
      setError(null);

      try {
        await convexUpdateTrainingDays({ userId, trainingDays: newTrainingDays });

        await notificationManager.storeTrainingDays(newTrainingDays);
        setTrainingDays(newTrainingDays);
        trackNotificationTrainingDaysUpdated(Object.keys(newTrainingDays).length);

        if (isEnabled) {
          await scheduleAll();
        }

        return true;
      } catch (err) {
        setError(err as Error);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [isEnabled, scheduleAll, userId, convexUpdateTrainingDays]
  );

  useEffect(() => {
    loadStoredSettings();
  }, [loadStoredSettings]);

  return {
    trainingDays,
    isEnabled,
    hasPermission,
    isLoading,
    isSaving,
    error,
    refreshPermission,
    enableNotifications,
    disableNotifications,
    saveTrainingDays,
    updateMeetData,
    rescheduleNotifications,
  };
}
