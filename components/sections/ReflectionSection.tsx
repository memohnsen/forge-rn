import React from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';

interface ReflectionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  accentColor: string;
  onPress: () => void;
}

const ReflectionCard: React.FC<ReflectionCardProps> = ({ icon, title, accentColor, onPress }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Pressable onPress={onPress} style={styles.cardWrapper}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
            shadowColor: accentColor,
            borderColor: `${accentColor}40`,
          },
        ]}
      >
        <LinearGradient
          colors={[`${accentColor}40`, `${accentColor}1A`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}
        >
          <Ionicons name={icon} size={24} color={accentColor} />
        </LinearGradient>

        <Text
          style={[
            styles.cardTitle,
            {
              color: isDark ? '#FFFFFF' : '#000000',
            },
          ]}
          numberOfLines={2}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
};

export const ReflectionSection: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ReflectionCard
        icon="barbell"
        title="Session Reflection"
        accentColor={colors.blueEnergy}
        onPress={() => router.push('/workout' as any)}
      />
      <ReflectionCard
        icon="trophy"
        title="Competition Analysis"
        accentColor={colors.gold}
        onPress={() => router.push('/competition' as any)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 14,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
});
