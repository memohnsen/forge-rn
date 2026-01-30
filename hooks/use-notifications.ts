import { useAuth } from '@clerk/clerk-expo';
import { createClerkSupabaseClient } from '@/services/supabase';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { notificationManager, TrainingDays } from '@/utils/notificationManager';
import {
  trackNotificationEnabled,
  trackNotificationPermissionDenied,
  trackNotificationPermissionGranted,
  trackNotificationPermissionRequested,
  trackNotificationTrainingDaysUpdated,
} from '@/utils/analytics';

export function useNotifications() {
  const { userId, getToken } = useAuth();
  const [trainingDays, setTrainingDays] = useState<TrainingDays>({});
  const [isEnabled, setIsEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const trainingDaysRef = useRef(trainingDays);
  const meetDataRef = useRef<{ meetDate?: string; meetName?: string }>({});
  const getTokenRef = useRef(getToken);

  useEffect(() => {
    trainingDaysRef.current = trainingDays;
  }, [trainingDays]);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const supabase = useMemo(() => {
    return createClerkSupabaseClient(async () => {
      return getTokenRef.current({ template: 'supabase', skipCache: true });
    });
  }, []);

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

  const loadTrainingDaysFromDb = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('journal_users')
        .select('training_days')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      if (data?.training_days) {
        setTrainingDays(data.training_days);
        trainingDaysRef.current = data.training_days;
        await notificationManager.storeTrainingDays(data.training_days);
      }
    } catch (err) {
      setError(err as Error);
    }
  }, [supabase, userId]);

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
      trainingDays: trainingDaysRef.current,
      meetDate,
      meetName,
    });
  }, []);

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
        const { error: updateError } = await supabase
          .from('journal_users')
          .update({
            training_days: newTrainingDays,
          })
          .eq('user_id', userId);

        if (updateError) throw updateError;

        await notificationManager.storeTrainingDays(newTrainingDays);
        setTrainingDays(newTrainingDays);
        trainingDaysRef.current = newTrainingDays;
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
    [isEnabled, scheduleAll, supabase, userId]
  );

  useEffect(() => {
    loadStoredSettings();
  }, [loadStoredSettings]);

  useEffect(() => {
    loadTrainingDaysFromDb();
  }, [loadTrainingDaysFromDb]);

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
