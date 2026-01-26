import React, { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';

import { Screen } from '@/components/layout/Screen';
import { useTheme } from '@/hooks/use-theme';

const settingsBlue = '#64A0DC';
const settingsGreen = '#5AB48C';
const settingsOrange = '#FFA050';
const settingsPurple = '#8C64C8';
const settingsRed = '#DC5A5A';
const settingsGray = '#2A2B31';

const SettingsRow = ({
  icon,
  title,
  accentColor,
  isLoading = false,
  isDanger = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  accentColor: string;
  isLoading?: boolean;
  isDanger?: boolean;
  onPress?: () => void;
}) => {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={styles.rowButton}>
      <View style={styles.rowBackground}>
        <View
          style={[
            styles.rowCard,
            {
              backgroundColor: theme.card,
              shadowColor: isDanger ? settingsRed : accentColor,
            },
          ]}
        />
      </View>
      <View style={styles.row}>
        <View style={styles.rowIcon}>
          <LinearGradient
            colors={[`${accentColor}33`, `${accentColor}12`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Ionicons name={icon} size={18} color={accentColor} />
        </View>
        <Text
          style={[
            styles.rowLabel,
            { color: isDanger ? settingsRed : theme.text },
          ]}
        >
          {title}
        </Text>
        <View style={styles.rowSpacer} />
        <Ionicons
          name="chevron-forward"
          size={16}
          color={title === 'Submit Feedback' ? settingsBlue : theme.textTertiary}
        />
      </View>
    </Pressable>
  );
};

export default function SettingsScreen() {
  const theme = useTheme();
  const [isExporting, setIsExporting] = useState(false);
  const appVersion = useMemo(() => Constants.expoConfig?.version ?? '1.0.0', []);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        <View style={styles.section}>
          <SettingsRow
            icon="notifications"
            title="Notifications"
            accentColor={settingsOrange}
            onPress={() => Alert.alert('Notifications', 'Open notification settings')}
          />
          <SettingsRow
            icon="link"
            title="Connected Apps"
            accentColor={settingsGreen}
            onPress={() => Alert.alert('Connected Apps', 'Open connected apps')}
          />
        <SettingsRow
          icon="share-outline"
          title={isExporting ? 'Exporting Data...' : 'Export My Data'}
          accentColor={settingsBlue}
          isLoading={isExporting}
            onPress={() => {
              if (isExporting) return;
              setIsExporting(true);
              setTimeout(() => setIsExporting(false), 1200);
            }}
          />
          <SettingsRow
            icon="mail"
            title="Auto-Send Results"
            accentColor={settingsPurple}
            onPress={() => Alert.alert('Auto-Send Results', 'Configure coach email')}
          />
          <SettingsRow
          icon="help-circle"
          title="Customer Support"
          accentColor={settingsBlue}
            onPress={() => Alert.alert('Customer Support', 'Open customer support')}
          />
          <SettingsRow
          icon="chatbubble-ellipses"
          title="Submit Feedback"
          accentColor={settingsGreen}
            onPress={() => Linking.openURL('mailto:support@meetcal.app')}
          />
        </View>

        <View style={styles.dangerHeader}>
          <View style={styles.dangerDot} />
          <Text style={[styles.dangerText, { color: theme.textSecondary }]}>DANGER ZONE</Text>
        </View>

        <SettingsRow
          icon="trash"
          title="Delete All Data"
          accentColor={settingsRed}
          isDanger
          onPress={() => Alert.alert('Delete All Data', 'There is no way to recover this.')}
        />

        <View style={styles.footer}>
          <View style={styles.footerLinks}>
            <Pressable onPress={() => Linking.openURL('https://www.meetcal.app/forge-privacy')}>
              <Text style={[styles.footerLink, { color: theme.textSecondary }]}>Privacy Policy</Text>
            </Pressable>
            <Text style={[styles.footerDot, { color: theme.textSecondary }]}>•</Text>
            <Pressable onPress={() => Linking.openURL('https://www.meetcal.app/forge-terms')}>
              <Text style={[styles.footerLink, { color: theme.textSecondary }]}>Terms of Use</Text>
            </Pressable>
            <Text style={[styles.footerDot, { color: theme.textSecondary }]}>•</Text>
            <Pressable onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
              <Text style={[styles.footerLink, { color: theme.textSecondary }]}>EULA</Text>
            </Pressable>
          </View>
          <Text style={[styles.footerVersion, { color: theme.textTertiary }]}>Forge Version {appVersion}</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  section: {
    gap: 10,
    marginTop: 8,
  },
  rowButton: {
    marginHorizontal: 20,
    marginBottom: 6,
  },
  rowBackground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  rowCard: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 16,
  },
  rowIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: settingsGray,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowSpacer: {
    flex: 1,
  },
  loading: {
    fontSize: 12,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  dangerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(220,90,90,0.6)',
  },
  dangerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 28,
    gap: 12,
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  footerLink: {
    fontSize: 12,
    color: settingsBlue,
  },
  footerDot: {
    fontSize: 12,
  },
  footerVersion: {
    fontSize: 12,
  },
});
