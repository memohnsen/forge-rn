import { colors } from '@/constants/colors';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
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
        <LogoSvg size={140} />
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
});
