import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000000' : '#F5F5F5', paddingTop: insets.top + 16 },
      ]}
    >
      <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>Settings</Text>
      <Text style={styles.subtitle}>Coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
});
