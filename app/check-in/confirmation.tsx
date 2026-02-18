import { colors } from '@/constants/colors';
import { trackContentShared } from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

export default function CheckInConfirmationScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { overallScore, physicalScore, mentalScore, selectedLift, selectedIntensity } =
    useLocalSearchParams<{
      overallScore: string;
      physicalScore: string;
      mentalScore: string;
      selectedLift: string;
      selectedIntensity: string;
    }>();

  const overall = parseInt(overallScore || '0');
  const physical = parseInt(physicalScore || '0');
  const mental = parseInt(mentalScore || '0');

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.scoreGreen;
    if (score >= 60) return colors.scoreYellow;
    return colors.scoreRed;
  };

  const getScoreMessage = (score: number) => {
    if (score >= 80) return "You're ready to crush it!";
    if (score >= 60) return 'Solid foundation for training';
    return 'Consider adjusting intensity today';
  };

  const overallColor = getScoreColor(overall);
  const [isSharingImage, setIsSharingImage] = useState(false);
  const shareCardRef = useRef<View>(null);

  const handleDone = () => {
    router.replace('/(tabs)');
  };

  const handleShareImage = async () => {
    if (!shareCardRef.current || isSharingImage) return;
    setIsSharingImage(true);

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing unavailable', 'Sharing is not available on this device.');
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 60));
      const uri = await captureRef(shareCardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Results',
        UTI: 'public.png',
      });

      trackContentShared('Check-Ins', 'share_image');
    } catch (error) {
      console.error('Error sharing image:', error);
    } finally {
      setIsSharingImage(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[`${colors.scoreGreen}40`, `${colors.scoreGreen}1A`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <Ionicons name="checkmark-circle" size={48} color={colors.scoreGreen} />
          </LinearGradient>
        </View>

        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Check-In Complete!
        </Text>

        <Text style={styles.subtitle}>
          {selectedIntensity} {selectedLift} Session
        </Text>

        <View
          style={[
            styles.scoreCard,
            {
              backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
              borderColor: isDark ? `${overallColor}40` : `${overallColor}20`,
              boxShadow: isDark
                ? `0 8px 24px ${overallColor}25`
                : `0 1px 3px rgba(0,0,0,0.08), 0 8px 24px ${overallColor}35`,
            },
          ]}
        >
          <Text style={styles.scoreLabel}>Overall Readiness</Text>
          <View style={[styles.scoreCircle, { borderColor: `${overallColor}4D` }]}>
            <LinearGradient
              colors={[`${overallColor}4D`, `${overallColor}1A`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scoreGradient}
            >
              <Text style={[styles.scoreValue, { color: overallColor }]}>{overall}%</Text>
            </LinearGradient>
          </View>
          <Text style={[styles.scoreMessage, { color: overallColor }]}>
            {getScoreMessage(overall)}
          </Text>
        </View>

        <View style={styles.breakdownContainer}>
          <View
            style={[
              styles.breakdownCard,
              {
                backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                boxShadow: isDark
                  ? '0 4px 12px rgba(0,0,0,0.2)'
                  : '0 1px 2px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.08)',
              },
            ]}
          >
            <Text style={styles.breakdownLabel}>Physical</Text>
            <Text style={[styles.breakdownValue, { color: getScoreColor(physical) }]}>
              {physical}%
            </Text>
          </View>
          <View
            style={[
              styles.breakdownCard,
              {
                backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                boxShadow: isDark
                  ? '0 4px 12px rgba(0,0,0,0.2)'
                  : '0 1px 2px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.08)',
              },
            ]}
          >
            <Text style={styles.breakdownLabel}>Mental</Text>
            <Text style={[styles.breakdownValue, { color: getScoreColor(mental) }]}>
              {mental}%
            </Text>
          </View>
        </View>

        <View style={styles.spacer} />

        <Pressable style={styles.shareButton} onPress={handleShareImage}>
          <Text style={[styles.shareButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Share Results
          </Text>
        </Pressable>

        <Pressable style={styles.doneButton} onPress={handleDone}>
          <LinearGradient
            colors={[colors.blueEnergy, `${colors.blueEnergy}D9`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.doneGradient}
          >
            <Text style={styles.doneText}>Done</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <View style={styles.shareCardCanvas} pointerEvents="none">
        <View collapsable={false} ref={shareCardRef} style={styles.shareCardWrapper}>
          <LinearGradient
            colors={['rgba(20,20,20,0.92)', 'rgba(38,38,38,0.92)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.shareCard}
          >
            <Text style={styles.shareCardTitle}>Check-In Results</Text>
            <Text style={styles.shareCardSubtitle}>
              {selectedIntensity} {selectedLift} Session
            </Text>
            <View style={styles.shareCardStats}>
              {[
                { label: 'Overall', value: `${overall}%` },
                { label: 'Physical', value: `${physical}%` },
                { label: 'Mental', value: `${mental}%` },
              ].map((stat) => (
                <View key={stat.label} style={styles.shareCardStat}>
                  <Text style={styles.shareCardStatValue}>{stat.value}</Text>
                  <Text style={styles.shareCardStatLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.shareCardFooter}>Forge • Performance Journal</Text>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
  },
  scoreCard: {
    padding: 24,
    borderRadius: 24,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 15,
    color: '#999',
    fontWeight: '500',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  scoreGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  scoreMessage: {
    fontSize: 15,
    fontWeight: '600',
  },
  breakdownContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  breakdownCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderCurve: 'continuous',
    alignItems: 'center',
    gap: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  spacer: {
    flex: 1,
  },
  doneButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  doneGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  shareButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  shareCardCanvas: {
    position: 'absolute',
    left: -9999,
    top: 0,
  },
  shareCardWrapper: {
    backgroundColor: 'transparent',
    padding: 0,
  },
  shareCard: {
    width: 280,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  shareCardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  shareCardSubtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '600',
  },
  shareCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 6,
  },
  shareCardStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  shareCardStatValue: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '700',
  },
  shareCardStatLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  shareCardFooter: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
