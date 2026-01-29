import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }}>
        <Stack.Screen name="index" />
      </Stack>
    </OnboardingProvider>
  );
}
