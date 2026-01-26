import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

interface ReflectionCardProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  href: string;
}

const ReflectionCard = ({ title, icon, accentColor, href }: ReflectionCardProps) => {
  const theme = useTheme();

  return (
    <Link href={href} asChild>
      <Pressable style={[styles.card, { backgroundColor: theme.card }]}> 
        <View style={styles.cardIcon}>
          <LinearGradient
            colors={[`${accentColor}40`, `${accentColor}1A`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Ionicons name={icon} size={24} color={accentColor} />
        </View>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
      </Pressable>
    </Link>
  );
};

export const ReflectionSection = () => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ReflectionCard
        title={'Session\nReflection'}
        icon="barbell"
        accentColor={theme.blueEnergy}
        href="/workout"
      />
      <ReflectionCard
        title={'Competition\nAnalysis'}
        icon="trophy"
        accentColor={theme.gold}
        href="/competition"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 16,
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
