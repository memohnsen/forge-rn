import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useColorScheme,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSSO } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const { startSSOFlow: startGoogleSSO } = useSSO();
  const { startSSOFlow: startAppleSSO } = useSSO();

  const handleGoogleSignIn = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startGoogleSSO({
        strategy: 'oauth_google',
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
    }
  }, [startGoogleSSO, router]);

  const handleAppleSignIn = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startAppleSSO({
        strategy: 'oauth_apple',
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err) {
      console.error('Apple sign-in error:', err);
    }
  }, [startAppleSSO, router]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <LinearGradient
            colors={[colors.blueEnergy, `${colors.blueEnergy}80`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoContainer}
          >
            <Ionicons name="barbell" size={48} color="#FFFFFF" />
          </LinearGradient>

          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Welcome to Forge
          </Text>
          <Text style={styles.subtitle}>
            Your mental training journal for peak performance
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          {Platform.OS === 'ios' && (
            <Pressable
              onPress={handleAppleSignIn}
              style={[
                styles.button,
                styles.appleButton,
                { backgroundColor: isDark ? '#FFFFFF' : '#000000' },
              ]}
            >
              <Ionicons
                name="logo-apple"
                size={20}
                color={isDark ? '#000000' : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.buttonText,
                  { color: isDark ? '#000000' : '#FFFFFF' },
                ]}
              >
                Continue with Apple
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={handleGoogleSignIn}
            style={[
              styles.button,
              styles.googleButton,
              {
                backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                borderColor: isDark ? '#333' : '#E5E5E5',
              },
            ]}
          >
            <Image
              source={{ uri: 'https://www.google.com/favicon.ico' }}
              style={styles.googleIcon}
            />
            <Text
              style={[
                styles.buttonText,
                { color: isDark ? '#FFFFFF' : '#000000' },
              ]}
            >
              Continue with Google
            </Text>
          </Pressable>
        </View>

        <Text style={styles.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  appleButton: {},
  googleButton: {
    borderWidth: 1,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  terms: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});
