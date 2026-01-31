import { colors } from '@/constants/colors';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { LogoSvg } from './LogoSvg';

export const SplashScreen: React.FC = () => {
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0.0)).current;

  useEffect(() => {
    // Animate logo in
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1.0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1.0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          transform: [{ scale: logoScale }],
          opacity: logoOpacity,
          ...styles.logoShadow,
        }}
      >
        <View style={styles.logoWrapper}>
          {Platform.OS === 'android' && (
            <View style={styles.logoHalo}>
              <LogoSvg size={140} tone="mono" tintColor="#FFFFFF" blurRadius={6} />
            </View>
          )}
          <LogoSvg size={140} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.blueEnergy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoShadow: {
    shadowColor: '#ffffff',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  logoWrapper: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoHalo: {
    position: 'absolute',
    opacity: 0.22,
    transform: [{ scale: 1.10 }],
  },
});
