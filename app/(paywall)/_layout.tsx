import { Stack } from 'expo-router';

export default function PaywallLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
