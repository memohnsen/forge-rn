import PostHog, { PostHogEventProperties } from 'posthog-react-native';

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST;

const isEnabled = Boolean(apiKey);

export const posthog = isEnabled
  ? new PostHog(apiKey as string, {
      host,
      captureAppLifecycleEvents: true,
    })
  : null;

function capture(event: string, properties?: PostHogEventProperties) {
  if (!posthog) return;
  posthog.capture(event, properties);
}

function screen(name: string, properties?: PostHogEventProperties) {
  if (!posthog) return;
  posthog.screen(name, properties);
}

export function identifyUser(distinctId?: string, properties?: PostHogEventProperties) {
  if (!posthog) return;
  posthog.identify(distinctId, properties);
}

export function resetAnalytics() {
  if (!posthog) return;
  posthog.reset();
}

export function trackScreenView(screenName: string, properties?: PostHogEventProperties) {
  screen(screenName, properties);
}

export function trackUserSignedUp(method: string) {
  capture('user_signed_up', { method });
}

export function trackUserSignedIn(method: string) {
  capture('user_signed_in', { method });
}

export function trackUserSignedOut() {
  capture('user_signed_out');
}

export function trackOnboardingStarted() {
  capture('onboarding_started');
}

export function trackOnboardingCompleted() {
  capture('onboarding_completed');
}

export function trackOnboardingPageViewed(pageNumber: number, totalPages: number) {
  capture('onboarding_page_viewed', {
    page_number: pageNumber,
    total_pages: totalPages,
  });
}

export function trackCheckInStarted() {
  capture('checkin_started');
}

export function trackCheckInSubmitted(lift: string, intensity: string, overallScore: number) {
  capture('checkin_submitted', {
    lift,
    intensity,
    overall_score: overallScore,
  });
}

export function trackCheckInViewed(checkInId: number) {
  capture('checkin_viewed', { checkin_id: checkInId });
}

export function trackCheckInDeleted(checkInId: number) {
  capture('checkin_deleted', { checkin_id: checkInId });
}

export function trackSessionReflectionStarted() {
  capture('session_reflection_started');
}

export function trackSessionReflectionSubmitted(lift: string, intensity: string, rpe: number) {
  capture('session_reflection_submitted', {
    lift,
    intensity,
    session_rpe: rpe,
  });
}

export function trackSessionReflectionViewed(sessionId: number) {
  capture('session_reflection_viewed', { session_id: sessionId });
}

export function trackSessionReflectionDeleted(sessionId: number) {
  capture('session_reflection_deleted', { session_id: sessionId });
}

export function trackCompReflectionStarted() {
  capture('comp_reflection_started');
}

export function trackCompReflectionSubmitted(
  meetName: string,
  meetType: string,
  performanceRating: number
) {
  capture('comp_reflection_submitted', {
    meet_name: meetName,
    meet_type: meetType,
    performance_rating: performanceRating,
  });
}

export function trackCompReflectionViewed(compId: number) {
  capture('comp_reflection_viewed', { comp_id: compId });
}

export function trackCompReflectionDeleted(compId: number) {
  capture('comp_reflection_deleted', { comp_id: compId });
}

export function trackHistoryFilterChanged(filter: string) {
  capture('history_filter_changed', { filter });
}

export function trackHistoryItemViewed(type: string, itemId: number) {
  capture('history_item_viewed', {
    type,
    item_id: itemId,
  });
}

export function trackHistoryDeleted(type: string, count: number) {
  capture('history_deleted', { type, count });
}

export function trackHistoryExported(format: string, itemCount: number) {
  capture('history_exported', { format, item_count: itemCount });
}

export function trackTrendsFilterChanged(filter: string) {
  capture('trends_filter_changed', { filter });
}

export function trackTrendsTimeFrameChanged(timeFrame: string) {
  capture('trends_timeframe_changed', { timeframe: timeFrame });
}

export function trackAIAnalysisRequested(filter: string) {
  capture('ai_analysis_requested', { filter });
}

export function trackAIAnalysisCompleted(filter: string, dataPoints: number) {
  capture('ai_analysis_completed', { filter, data_points: dataPoints });
}

export function trackTabSwitched(fromTab: string, toTab: string) {
  capture('tab_switched', { from_tab: fromTab, to_tab: toTab });
}

export function trackMeetUpdated(meetName: string, meetDate: string) {
  capture('meet_updated', { meet_name: meetName, meet_date: meetDate });
}

export function trackMeetDaysUpdated(trainingDaysCount: number) {
  capture('meet_days_updated', { training_days_count: trainingDaysCount });
}

export function trackNotificationPermissionRequested() {
  capture('notification_permission_requested');
}

export function trackNotificationPermissionGranted() {
  capture('notification_permission_granted');
}

export function trackNotificationPermissionDenied() {
  capture('notification_permission_denied');
}

export function trackNotificationEnabled(enabled: boolean) {
  capture('notification_enabled', { enabled });
}

export function trackNotificationSettingsViewed() {
  capture('notification_settings_viewed');
}

export function trackNotificationTrainingDaysUpdated(trainingDaysCount: number) {
  capture('notification_training_days_updated', { training_days_count: trainingDaysCount });
}

export function trackSettingsViewed() {
  capture('settings_viewed');
}

export function trackDataExported(format: string) {
  capture('data_exported', { format });
}

export function trackCustomerSupportAccessed() {
  capture('customer_support_accessed');
}

export function trackFeedbackSubmitted() {
  capture('feedback_submitted');
}

export function trackGitHubLinkOpened() {
  capture('github_link_opened');
}

export function trackAllDataDeleted() {
  capture('all_data_deleted');
}

export function trackAppOpened(fromNotification = false) {
  capture('app_opened', { from_notification: fromNotification });
}

export function trackSubscriptionStarted(tier: string) {
  capture('subscription_started', { tier });
}

export function trackSubscriptionCancelled() {
  capture('subscription_cancelled');
}

export function trackSubscriptionRestored() {
  capture('subscription_restored');
}

export function trackCustomerCenterViewed() {
  capture('customer_center_viewed');
}

export function trackContentShared(type: string, method: string) {
  capture('content_shared', { type, method });
}

export function setUserProperties(properties: Record<string, unknown>) {
  capture('$set', properties);
}

export function setOnboardingCompleted(completed: boolean) {
  setUserProperties({ onboarding_completed: completed });
}

export function setNotificationEnabled(enabled: boolean) {
  setUserProperties({ notification_enabled: enabled });
}

export function trackOpenRouterAPICall(
  model: string,
  purpose: string,
  promptLength: number,
  success: boolean,
  errorMessage?: string
) {
  const properties: Record<string, unknown> = {
    model,
    purpose,
    prompt_length: promptLength,
    success,
  };

  if (errorMessage) {
    properties.error_message = errorMessage;
  }

  capture('openrouter_api_call', properties);
}

export function trackElevenLabsAPICall(
  voice: string,
  textLength: number,
  audioDuration: number | null,
  success: boolean,
  errorMessage?: string
) {
  const properties: Record<string, unknown> = {
    voice,
    text_length: textLength,
    success,
  };

  if (audioDuration != null) {
    properties.audio_duration = audioDuration;
  }

  if (errorMessage) {
    properties.error_message = errorMessage;
  }

  capture('elevenlabs_api_call', properties);
}

export function trackVisualizationGenerated(
  movement: string,
  cuesLength: number,
  voice: string,
  sport: string,
  cached: boolean,
  success: boolean
) {
  capture('visualization_generated', {
    movement,
    cues_length: cuesLength,
    voice,
    sport,
    from_cache: cached,
    success,
  });
}

export function trackVisualizationPlayed(
  movement: string,
  voice: string,
  playbackDuration: number,
  completed: boolean
) {
  capture('visualization_played', {
    movement,
    voice,
    playback_duration: playbackDuration,
    completed,
  });
}

export function trackVisualizationScriptViewed(movement: string) {
  capture('visualization_script_viewed', { movement });
}

export function trackVisualizationLatencyMeasured(
  movement: string,
  voice: string,
  phasesMs: {
    totalGenerationMs?: number;
    tokenMs?: number;
    openRouterMs?: number;
    textToSpeechMs?: number;
    combinedRequestMs?: number;
    base64EncodeMs?: number;
    audioWriteMs?: number;
    audioCreateMs?: number;
    timeToFirstAudioMs?: number;
  },
  source: 'cache' | 'combined' | 'legacy'
) {
  capture('visualization_latency_measured', {
    movement,
    voice,
    source,
    ...phasesMs,
  });
}

export function trackMentalExerciseStarted(exerciseType: string) {
  capture('mental_exercise_started', { exercise_type: exerciseType });
}

export function trackMentalExerciseCompleted(exerciseType: string, duration: number) {
  capture('mental_exercise_completed', { exercise_type: exerciseType, duration });
}
