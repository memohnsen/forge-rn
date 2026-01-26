import PostHog from 'posthog-react-native';

const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com';

export const analytics = posthogKey
  ? new PostHog(posthogKey, {
      host: posthogHost,
      captureApplicationLifecycleEvents: true,
    })
  : null;

export const trackScreenView = (screen: string) => {
  analytics?.screen(screen);
};

export const trackEvent = (event: string, properties?: Record<string, unknown>) => {
  analytics?.capture(event, properties);
};

export const identifyUser = (userId: string, properties?: Record<string, unknown>) => {
  analytics?.identify(userId, properties);
};
