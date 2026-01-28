import { colors } from '@/constants/colors';
import {
  authenticateOura,
  isOuraConnected,
  revokeOuraToken,
  loadStoreTokenPreference,
  updateStoreTokenPreference,
  syncOuraRefreshTokenToDatabase,
  getOuraRefreshToken,
} from '@/services/oura';
import {
  authenticateWhoop,
  isWhoopConnected,
  revokeWhoopToken,
  syncWhoopRefreshTokenToDatabase,
  getWhoopRefreshToken,
} from '@/services/whoop';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ConnectedAppsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId, getToken } = useAuth();

  const [ouraConnected, setOuraConnected] = useState(false);
  const [whoopConnected, setWhoopConnected] = useState(false);
  const [ouraLoading, setOuraLoading] = useState(false);
  const [whoopLoading, setWhoopLoading] = useState(false);
  const [storeToken, setStoreToken] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  const getClerkToken = useCallback(async () => {
    return getToken({ template: 'supabase', skipCache: true });
  }, [getToken]);

  const checkConnectionStatus = useCallback(async () => {
    if (!userId) return;

    setIsLoadingStatus(true);
    try {
      const [ouraStatus, whoopStatus, storePreference] = await Promise.all([
        isOuraConnected(userId),
        isWhoopConnected(userId),
        loadStoreTokenPreference(userId, getClerkToken),
      ]);
      setOuraConnected(ouraStatus);
      setWhoopConnected(whoopStatus);
      setStoreToken(storePreference);
    } catch (error) {
      console.error('Failed to check connection status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  }, [userId, getClerkToken]);

  useEffect(() => {
    checkConnectionStatus();
  }, [checkConnectionStatus]);

  const handleOuraPress = async () => {
    if (!userId) return;

    setOuraLoading(true);
    try {
      if (ouraConnected) {
        // Disconnect
        await revokeOuraToken(userId);
        await syncOuraRefreshTokenToDatabase(userId, false, getClerkToken);
        setOuraConnected(false);
        Alert.alert('Oura Connection', 'Oura account disconnected successfully.');
      } else {
        // Connect
        const success = await authenticateOura(userId, getClerkToken);
        if (success) {
          setOuraConnected(true);
          if (storeToken) {
            const refreshToken = await getOuraRefreshToken(userId);
            if (refreshToken) {
              await syncOuraRefreshTokenToDatabase(userId, true, getClerkToken);
            }
          }
          Alert.alert('Oura Connection', 'Oura account connected successfully!');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        'Oura Connection',
        ouraConnected
          ? `Failed to disconnect Oura account: ${message}`
          : `Failed to connect Oura account: ${message}`
      );
    } finally {
      setOuraLoading(false);
    }
  };

  const handleWhoopPress = async () => {
    if (!userId) return;

    setWhoopLoading(true);
    try {
      if (whoopConnected) {
        // Disconnect
        await revokeWhoopToken(userId);
        await syncWhoopRefreshTokenToDatabase(userId, false, getClerkToken);
        setWhoopConnected(false);
        Alert.alert('WHOOP Connection', 'WHOOP account disconnected successfully.');
      } else {
        // Connect
        const success = await authenticateWhoop(userId, getClerkToken);
        if (success) {
          setWhoopConnected(true);
          if (storeToken) {
            // Small delay to ensure keychain is updated
            await new Promise((resolve) => setTimeout(resolve, 100));
            const refreshToken = await getWhoopRefreshToken(userId);
            if (refreshToken) {
              await syncWhoopRefreshTokenToDatabase(userId, true, getClerkToken);
            }
          }
          Alert.alert('WHOOP Connection', 'WHOOP account connected successfully!');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        'WHOOP Connection',
        whoopConnected
          ? `Failed to disconnect WHOOP account: ${message}`
          : `Failed to connect WHOOP account: ${message}`
      );
    } finally {
      setWhoopLoading(false);
    }
  };

  const handleStoreTokenToggle = async (newValue: boolean) => {
    if (!userId) return;

    setStoreToken(newValue);
    try {
      await updateStoreTokenPreference(userId, newValue, getClerkToken);

      if (newValue) {
        // Save tokens if connected
        if (ouraConnected) {
          const ouraRefreshToken = await getOuraRefreshToken(userId);
          if (ouraRefreshToken) {
            await syncOuraRefreshTokenToDatabase(userId, true, getClerkToken);
          }
        }
        if (whoopConnected) {
          const whoopRefreshToken = await getWhoopRefreshToken(userId);
          if (whoopRefreshToken) {
            await syncWhoopRefreshTokenToDatabase(userId, true, getClerkToken);
          }
        }
      } else {
        // Clear stored tokens
        await syncOuraRefreshTokenToDatabase(userId, false, getClerkToken);
        await syncWhoopRefreshTokenToDatabase(userId, false, getClerkToken);
      }
    } catch (error) {
      console.error('Failed to update store token preference:', error);
      setStoreToken(!newValue); // Revert on error
    }
  };

  if (isLoadingStatus) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.blueEnergy} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Connected Apps
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.blueEnergy} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.blueEnergy} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Connected Apps
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <ConnectedAppRow
          name="Oura"
          icon="moon-waning-crescent"
          isConnected={ouraConnected}
          isLoading={ouraLoading}
          isDark={isDark}
          onPress={handleOuraPress}
        />

        <ConnectedAppRow
          name="WHOOP"
          icon="heart-pulse"
          isConnected={whoopConnected}
          isLoading={whoopLoading}
          isDark={isDark}
          onPress={handleWhoopPress}
        />

        <View
          style={[
            styles.toggleCard,
            {
              backgroundColor: isDark ? '#111111' : '#FFFFFF',
              borderColor: `${colors.blueEnergy}33`,
            },
          ]}
        >
          <View style={styles.toggleIcon}>
            <LinearGradient
              colors={[`${colors.blueEnergy}40`, `${colors.blueEnergy}1A`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircle}
            >
              <MaterialCommunityIcons name="database" size={18} color={colors.blueEnergy} />
            </LinearGradient>
          </View>
          <Text style={[styles.toggleText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Store Data For Reports
          </Text>
          <Switch
            value={storeToken}
            onValueChange={handleStoreTokenToggle}
            trackColor={{ false: '#767577', true: `${colors.blueEnergy}80` }}
            thumbColor={storeToken ? colors.blueEnergy : '#f4f3f4'}
          />
        </View>

        <View
          style={[
            styles.privacyCard,
            {
              backgroundColor: isDark ? 'rgba(255, 160, 80, 0.1)' : 'rgba(255, 160, 80, 0.06)',
              borderColor: 'rgba(255, 160, 80, 0.25)',
            },
          ]}
        >
          <View style={styles.privacyHeader}>
            <View style={styles.privacyIconCircle}>
              <MaterialCommunityIcons name="alert" size={16} color="#FFA050" />
            </View>
            <Text style={[styles.privacyTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Privacy Notice
            </Text>
          </View>
          <Text style={styles.privacyText}>
            By connecting to these apps you are agreeing to letting the app access your personal
            data.
          </Text>

          <View style={styles.bulletPoints}>
            <BulletPoint text="This data is used to give deeper insights to your check-ins and reflections." />
            <BulletPoint text="All this data is only ever accessed on the app. It is not saved to any external database, meaning no one can see your data besides yourself and whomever you decide to share it with." />
            <BulletPoint text="As such, the Export Data button will include your Oura and WHOOP data from the date of your login to the app. However, the Auto-Send Weekly Results will NOT include this data unless you turn on the toggle allowing us to store your data." />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ConnectedAppRow({
  name,
  icon,
  isConnected,
  isLoading,
  isDark,
  onPress,
}: {
  name: string;
  icon: string;
  isConnected: boolean;
  isLoading: boolean;
  isDark: boolean;
  onPress: () => void;
}) {
  const statusColor = isConnected ? '#5AB48C' : '#9A9A9A';

  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      style={[
        styles.appRow,
        {
          backgroundColor: isDark ? '#111111' : '#FFFFFF',
          borderColor: `${statusColor}33`,
          shadowColor: statusColor,
          opacity: isLoading ? 0.7 : 1,
        },
      ]}
    >
      <View style={styles.rowIcon}>
        <LinearGradient
          colors={[`${statusColor}40`, `${statusColor}1A`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}
        >
          <MaterialCommunityIcons name={icon as never} size={18} color={statusColor} />
        </LinearGradient>
      </View>
      <Text style={[styles.rowText, { color: isDark ? '#FFFFFF' : '#000000' }]}>{name}</Text>
      <View style={styles.rowSpacer} />
      {isLoading ? (
        <ActivityIndicator size="small" color={statusColor} />
      ) : isConnected ? (
        <MaterialCommunityIcons name="check-circle" size={20} color="#5AB48C" />
      ) : null}
      <MaterialCommunityIcons name="chevron-right" size={16} color="#9A9A9A" style={styles.chevron} />
    </Pressable>
  );
}

function BulletPoint({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bullet} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 12,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
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
  chevron: {
    marginLeft: 8,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  toggleIcon: {
    marginRight: 12,
  },
  toggleText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  privacyCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  privacyIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 160, 80, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  privacyText: {
    fontSize: 13,
    color: '#9A9A9A',
    lineHeight: 20,
    marginBottom: 14,
  },
  bulletPoints: {
    gap: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFA050',
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: '#9A9A9A',
    lineHeight: 20,
  },
});
