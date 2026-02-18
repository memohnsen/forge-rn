import { CoachEmailSheet } from '@/components/CoachEmailSheet';
import { colors } from '@/constants/colors';
import { useHome } from '@/hooks/use-home';
import { createAndShareCSV } from '@/utils/csvExport';
import { useAuth } from '@clerk/clerk-expo';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View
} from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  trackCustomerCenterViewed,
  trackCustomerSupportAccessed,
  trackFeedbackSubmitted,
  trackScreenView,
  trackSettingsViewed,
} from '@/utils/analytics';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId, getToken } = useAuth();
  const { user, fetchUsers, updateCoachEmail } = useHome();

  const [isExporting, setIsExporting] = useState(false);
  const [showCoachEmailSheet, setShowCoachEmailSheet] = useState(false);

  const handleExport = async () => {
    if (!userId) {
      Alert.alert('Error', 'Unable to export data. Please try again.');
      return;
    }

    setIsExporting(true);

    try {
      const success = await createAndShareCSV({
        userId,
        getToken: async () => getToken({ template: 'supabase', skipCache: true })
      });

      if (success) {
        // Share sheet will handle the export, no alert needed
      } else {
        Alert.alert('Export Failed', 'Unable to export your data. Please try again.');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'An error occurred while exporting your data.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete All Data?', 'There is no way to recover this.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {} },
    ]);
  };

  const handleCustomerSupport = async () => {
    try {
      trackCustomerSupportAccessed();
      await RevenueCatUI.presentCustomerCenter();
      trackCustomerCenterViewed();
    } catch (error) {
      console.error('Error presenting Customer Center:', error);
      Alert.alert('Error', 'Unable to open Customer Support. Please try again later.');
    }
  };

  const handleSaveCoachEmail = async (email: string) => {
    if (!userId) return;

    const success = await updateCoachEmail(userId, email || null);

    if (success) {
      await fetchUsers(userId);
      setShowCoachEmailSheet(false);
      Alert.alert(
        'Coach Email Saved',
        'Your coach email has been saved. Weekly reports will be sent automatically every Sunday.'
      );
    } else {
      Alert.alert('Error', 'Failed to save coach email. Please try again.');
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUsers(userId);
    }
  }, [userId]);

  useEffect(() => {
    trackScreenView('settings');
    trackSettingsViewed();
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000000' : '#F2F2F7' },
      ]}
    >
      <View style={{ paddingTop: insets.top + 16 }}>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <SettingsRow
            icon="bell"
            title="Notifications"
            accentColor="#FFA050"
            isDark={isDark}
            onPress={() => router.push('/settings/notifications')}
          />
          <SettingsRow
            icon="link-variant"
            title="Connected Apps"
            accentColor="#5AB48C"
            isDark={isDark}
            onPress={() => router.push('/settings/connected-apps')}
          />
          <SettingsRow
            icon="upload"
            title={isExporting ? 'Exporting Data...' : 'Export My Data'}
            accentColor="#64A0DC"
            isDark={isDark}
            isLoading={isExporting}
            onPress={handleExport}
            disabled={isExporting}
          />
          <SettingsRow
            icon="email"
            title="Auto-Send Results"
            accentColor="#8C64C8"
            isDark={isDark}
            onPress={() => setShowCoachEmailSheet(true)}
          />
          <SettingsRow
            icon="help-circle"
            title="Customer Support"
            accentColor="#64A0DC"
            isDark={isDark}
            onPress={handleCustomerSupport}
          />
          <SettingsRow
            icon="message-text"
            title="Submit Feedback"
            accentColor="#5AB48C"
            isDark={isDark}
            onPress={() => {
              trackFeedbackSubmitted();
              Linking.openURL('mailto:maddisen@meetcal.app');
            }}
          />
        </View>

        <View style={styles.dangerHeader}>
          <View style={styles.dangerDot} />
          <Text style={styles.dangerText}>DANGER ZONE</Text>
        </View>

        <SettingsRow
          icon="trash-can"
          title="Delete All Data"
          accentColor="#DC5A5A"
          isDark={isDark}
          isDanger
          onPress={handleDelete}
        />

        {__DEV__ && (
          <>
            <View style={styles.dangerHeader}>
              <View style={[styles.dangerDot, { backgroundColor: colors.blueEnergy }]} />
              <Text style={styles.dangerText}>DEV TOOLS</Text>
            </View>
            <SettingsRow
              icon="restart"
              title="Replay Onboarding"
              accentColor={colors.blueEnergy}
              isDark={isDark}
              onPress={async () => {
                if (!userId) return;
                await SecureStore.setItemAsync(`forceOnboarding_${userId}`, 'true');
                await SecureStore.deleteItemAsync(`hasSeenOnboarding_${userId}`);
                router.replace('/(onboarding)');
              }}
            />
          </>
        )}

        <View style={styles.footerLinks}>
          <View style={styles.linksRow}>
            <Text style={styles.link} onPress={() => Linking.openURL('https://www.meetcal.app/forge-privacy')}>
              Privacy Policy
            </Text>
            <Text style={styles.linkDivider}>•</Text>
            <Text style={styles.link} onPress={() => Linking.openURL('https://www.meetcal.app/forge-terms')}>
              Terms of Use
            </Text>
            <Text style={styles.linkDivider}>•</Text>
            <Text
              style={styles.link}
              onPress={() =>
                Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')
              }
            >
              EULA
            </Text>
          </View>
          <Text style={styles.versionText}>Forge Version 1.0.0</Text>
        </View>
      </ScrollView>

      <CoachEmailSheet
        visible={showCoachEmailSheet}
        initialEmail={user?.coach_email || ''}
        onSave={handleSaveCoachEmail}
        onCancel={() => setShowCoachEmailSheet(false)}
      />
    </View>
  );
}

function SettingsRow({
  icon,
  title,
  accentColor,
  isDark,
  isLoading = false,
  isDanger = false,
  onPress,
  disabled = false,
}: {
  icon: string;
  title: string;
  accentColor: string;
  isDark: boolean;
  isLoading?: boolean;
  isDanger?: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.rowCard,
        {
          backgroundColor: isDark ? '#111111' : '#FFFFFF',
          borderColor: isDark ? `${(isDanger ? '#DC5A5A' : accentColor)}33` : `${(isDanger ? '#DC5A5A' : accentColor)}20`,
          boxShadow: isDark
            ? `0 4px 12px ${(isDanger ? '#DC5A5A' : accentColor)}20`
            : `0 1px 2px rgba(0,0,0,0.06), 0 4px 12px ${(isDanger ? '#DC5A5A' : accentColor)}30`,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <View style={styles.rowIcon}>
        <LinearGradient
          colors={[`${accentColor}40`, `${accentColor}1A`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}
        >
          <MaterialCommunityIcons name={icon as never} size={18} color={accentColor} />
        </LinearGradient>
      </View>
      <Text style={[styles.rowText, { color: isDanger ? '#DC5A5A' : isDark ? '#FFFFFF' : '#000000' }]}>
        {title}
      </Text>
      <View style={styles.rowSpacer} />
      {isLoading ? (
        <View style={styles.loadingDot} />
      ) : (
        <MaterialCommunityIcons name="chevron-right" size={16} color="#9A9A9A" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
  },
  section: {
    gap: 10,
    marginBottom: 16,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  rowIcon: {
    marginRight: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowSpacer: {
    flex: 1,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.blueEnergy,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 6,
  },
  dangerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC5A5A',
    opacity: 0.6,
  },
  dangerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 0.6,
  },
  footerLinks: {
    marginTop: 20,
    alignItems: 'center',
    gap: 12,
  },
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  link: {
    fontSize: 12,
    color: '#9A9A9A',
  },
  linkDivider: {
    fontSize: 12,
    color: '#6F6F6F',
  },
  versionText: {
    fontSize: 12,
    color: '#6F6F6F',
  },
});
