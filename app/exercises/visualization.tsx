import { useAuth } from '@clerk/clerk-expo';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import { Buffer } from 'buffer';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReAnimated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring, interpolate } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { VoiceOption, VOICES } from '@/services/elevenlabs';
import { createClerkSupabaseClient } from '@/services/supabase';
import { generateVisualizationAudio } from '@/services/visualization-generation';
import {
  trackScreenView,
  trackVisualizationGenerated,
  trackVisualizationLatencyMeasured,
  trackVisualizationPlayed,
  trackVisualizationScriptViewed,
} from '@/utils/analytics';

const ACCENT_COLOR = '#9966CC'; // Purple to match Swift
const PLAYER_COLOR = '#4A90D9'; // Blue energy for player (matches Swift PlayerView)
const CACHE_DIR = `${FileSystem.cacheDirectory}visualizations/`;

const AnimatedPressable = ReAnimated.createAnimatedComponent(Pressable);

type ScreenState = 'setup' | 'generating' | 'player';
type GenerationSource = 'cache' | 'combined' | 'legacy';

type VisualizationGenerationTiming = {
  source: GenerationSource;
  generationStartedAt: number;
  totalGenerationMs?: number;
  tokenMs?: number;
  openRouterMs?: number;
  textToSpeechMs?: number;
  combinedRequestMs?: number;
  base64EncodeMs?: number;
  audioWriteMs?: number;
};

const PREFETCH_TOKEN_TTL_MS = 45_000;

export default function VisualizationScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { userId, getToken } = useAuth();

  const [screenState, setScreenState] = useState<ScreenState>('setup');
  const [movement, setMovement] = useState('');
  const [cues, setCues] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(VOICES[0]);
  const [userSport, setUserSport] = useState('athlete');

  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState('');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [latestGenerationTiming, setLatestGenerationTiming] = useState<VisualizationGenerationTiming | null>(null);
  const [prefetchedToken, setPrefetchedToken] = useState<string | null>(null);
  const prefetchedTokenAtRef = useRef<number>(0);

  const [hasCachedVersion, setHasCachedVersion] = useState(false);
  const [useCachedVersion, setUseCachedVersion] = useState(false);
  const hasTrackedScreen = useRef(false);

  const canGenerate =
    movement.trim().length > 0 && cues.trim().length > 0;

  // Load user sport from Supabase
  useEffect(() => {
    async function loadUserSport() {
      if (!userId) return;
      try {
        const token = await getToken({ template: 'supabase' });
        if (!token) return;
        const supabase = createClerkSupabaseClient(() => Promise.resolve(token));
        const { data } = await supabase
          .from('journal_users')
          .select('sport')
          .eq('user_id', userId)
          .single();
        if (data?.sport) {
          setUserSport(data.sport);
        }
      } catch (error) {
        console.log('Failed to load user sport:', error);
      }
    }
    loadUserSport();
  }, [userId, getToken]);

  useEffect(() => {
    if (!hasTrackedScreen.current) {
      trackScreenView('visualization');
      hasTrackedScreen.current = true;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function prefetchToken() {
      if (!userId || screenState !== 'setup') return;

      try {
        const token = await getToken({ template: 'supabase' });
        if (cancelled || !token) return;
        setPrefetchedToken(token);
        prefetchedTokenAtRef.current = Date.now();
      } catch (error) {
        console.log('Failed to prefetch supabase token:', error);
      }
    }

    prefetchToken();

    return () => {
      cancelled = true;
    };
  }, [getToken, screenState, userId]);

  // Check for cached version when inputs change
  useEffect(() => {
    let cancelled = false;

    async function checkCache() {
      const key = getCacheKey(movement, cues, selectedVoice.id);
      const audioPath = `${CACHE_DIR}${key}.mp3`;
      const info = await FileSystem.getInfoAsync(audioPath);

      // Only update state if not cancelled
      if (!cancelled) {
        setHasCachedVersion(info.exists);
        if (!info.exists) {
          setUseCachedVersion(false);
        }
      }
    }

    if (movement && cues) {
      checkCache();
    } else {
      setHasCachedVersion(false);
      setUseCachedVersion(false);
    }

    return () => {
      cancelled = true;
    };
  }, [movement, cues, selectedVoice.id]);

  function getCacheKey(mov: string, c: string, voiceId: string): string {
    const combined = `${mov}_${c}_${voiceId}`;
    // UTF-8 safe base64 encoding using buffer package
    const hash = Buffer.from(combined, 'utf8')
      .toString('base64')
      .replace(/\//g, '_')
      .replace(/\+/g, '-')
      .slice(0, 50);
    return hash;
  }

  async function ensureCacheDir() {
    const info = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  }

  async function getSupabaseTokenForGeneration(): Promise<{ token: string; tokenMs: number }> {
    const tokenStart = Date.now();
    const hasFreshPrefetch =
      prefetchedToken && Date.now() - prefetchedTokenAtRef.current < PREFETCH_TOKEN_TTL_MS;

    if (hasFreshPrefetch && prefetchedToken) {
      return {
        token: prefetchedToken,
        tokenMs: Date.now() - tokenStart,
      };
    }

    const token = await getToken({ template: 'supabase' });
    if (!token) {
      throw new Error('Not authenticated');
    }
    setPrefetchedToken(token);
    prefetchedTokenAtRef.current = Date.now();
    return {
      token,
      tokenMs: Date.now() - tokenStart,
    };
  }

  async function handleGenerate() {
    const generationStartedAt = Date.now();
    const key = getCacheKey(movement, cues, selectedVoice.id);
    const audioPath = `${CACHE_DIR}${key}.mp3`;
    const scriptPath = `${CACHE_DIR}${key}.txt`;

    // Check if using cached version - verify both audio AND script exist
    if (useCachedVersion) {
      const [audioInfo, scriptInfo] = await Promise.all([
        FileSystem.getInfoAsync(audioPath),
        FileSystem.getInfoAsync(scriptPath),
      ]);

      // Only use cache if both files exist and script is readable
      if (audioInfo.exists && scriptInfo.exists) {
        try {
          const cachedScript = await FileSystem.readAsStringAsync(scriptPath);
          setGeneratedScript(cachedScript);
          setAudioUri(audioPath);
          setLatestGenerationTiming({
            source: 'cache',
            generationStartedAt,
            totalGenerationMs: Date.now() - generationStartedAt,
          });
          setScreenState('player');
          trackVisualizationGenerated(
            movement,
            cues.length,
            selectedVoice.name,
            userSport,
            true,
            true
          );
          return;
        } catch {
          // Script read failed, fall through to regeneration
        }
      }
      // If we get here, cached files are missing or unreadable - fall through to regeneration
    }

    setScreenState('generating');
    setIsGeneratingScript(true);

    try {
      const { token, tokenMs } = await getSupabaseTokenForGeneration();
      const generationRequestStart = Date.now();
      const result = await generateVisualizationAudio({
        movement,
        cues,
        voiceId: selectedVoice.id,
        userSport,
        token,
        stability: 0.6,
        similarityBoost: 0.8,
      });
      const combinedRequestMs = Date.now() - generationRequestStart;
      const script = result.script;
      setGeneratedScript(script);
      setIsGeneratingScript(false);
      await ensureCacheDir();

      if (result.audioUrl) {
        const timing: VisualizationGenerationTiming = {
          source: result.source,
          generationStartedAt,
          totalGenerationMs: Date.now() - generationStartedAt,
          tokenMs,
          openRouterMs: result.timingsMs?.openRouter,
          textToSpeechMs: result.timingsMs?.textToSpeech,
          combinedRequestMs,
        };
        console.log('Visualization generation timings', timing);

        setLatestGenerationTiming(timing);
        setAudioUri(result.audioUrl);
        setScreenState('player');

        void (async () => {
          try {
            await FileSystem.downloadAsync(result.audioUrl, audioPath);
            await FileSystem.writeAsStringAsync(scriptPath, script);
          } catch (backgroundError) {
            console.log('Background visualization cache write failed:', backgroundError);
          }
        })();
      } else if (result.audioBase64) {
        const audioWriteStart = Date.now();
        await FileSystem.writeAsStringAsync(audioPath, result.audioBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const audioWriteMs = Date.now() - audioWriteStart;

        const timing: VisualizationGenerationTiming = {
          source: result.source,
          generationStartedAt,
          totalGenerationMs: Date.now() - generationStartedAt,
          tokenMs,
          openRouterMs: result.timingsMs?.openRouter,
          textToSpeechMs: result.timingsMs?.textToSpeech,
          combinedRequestMs,
          audioWriteMs,
        };
        console.log('Visualization generation timings', timing);

        setLatestGenerationTiming(timing);
        setAudioUri(audioPath);
        setScreenState('player');

        void FileSystem.writeAsStringAsync(scriptPath, script).catch((backgroundError) => {
          console.log('Background script cache write failed:', backgroundError);
        });
      } else if (result.audioData) {
        const base64Start = Date.now();
        const audioBase64 = arrayBufferToBase64(result.audioData);
        const base64EncodeMs = Date.now() - base64Start;

        const audioWriteStart = Date.now();
        await FileSystem.writeAsStringAsync(audioPath, audioBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const audioWriteMs = Date.now() - audioWriteStart;

        const timing: VisualizationGenerationTiming = {
          source: result.source,
          generationStartedAt,
          totalGenerationMs: Date.now() - generationStartedAt,
          tokenMs,
          openRouterMs: result.timingsMs?.openRouter,
          textToSpeechMs: result.timingsMs?.textToSpeech,
          combinedRequestMs,
          base64EncodeMs,
          audioWriteMs,
        };
        console.log('Visualization generation timings', timing);

        setLatestGenerationTiming(timing);
        setAudioUri(audioPath);
        setScreenState('player');

        void FileSystem.writeAsStringAsync(scriptPath, script).catch((backgroundError) => {
          console.log('Background script cache write failed:', backgroundError);
        });
      } else {
        throw new Error('Generation failed: missing audio payload');
      }

      void Promise.resolve().then(() => {
        trackVisualizationGenerated(
          movement,
          cues.length,
          selectedVoice.name,
          userSport,
          false,
          true
        );
      });
    } catch (error) {
      console.error('Generation error:', error);
      setIsGeneratingScript(false);
      trackVisualizationGenerated(
        movement,
        cues.length,
        selectedVoice.name,
        userSport,
        false,
        false
      );
      Alert.alert(
        'Generation Failed',
        error instanceof Error ? error.message : 'Failed to generate visualization. Please try again.',
        [{ text: 'OK', onPress: () => setScreenState('setup') }]
      );
    }
  }

  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    // UTF-8 safe base64 encoding using buffer package
    return Buffer.from(new Uint8Array(buffer)).toString('base64');
  }

  function handlePlayerComplete() {
    setScreenState('setup');
    setAudioUri(null);
    setLatestGenerationTiming(null);
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
      {screenState === 'setup' && (
        <SetupScreen
          isDark={isDark}
          insets={insets}
          movement={movement}
          setMovement={setMovement}
          cues={cues}
          setCues={setCues}
          selectedVoice={selectedVoice}
          setSelectedVoice={setSelectedVoice}
          hasCachedVersion={hasCachedVersion}
          useCachedVersion={useCachedVersion}
          setUseCachedVersion={setUseCachedVersion}
          canGenerate={canGenerate}
          onGenerate={handleGenerate}
        />
      )}

      {screenState === 'generating' && (
        <GeneratingScreen
          isDark={isDark}
          insets={insets}
          isGeneratingScript={isGeneratingScript}
        />
      )}

      {screenState === 'player' && audioUri && (
        <PlayerScreen
          isDark={isDark}
          insets={insets}
          audioUri={audioUri}
          script={generatedScript}
          movement={movement}
          voiceName={selectedVoice.name}
          generationTiming={latestGenerationTiming}
          onComplete={handlePlayerComplete}
        />
      )}
    </View>
  );
}

// Setup Screen Component
function SetupScreen({
  isDark,
  insets,
  movement,
  setMovement,
  cues,
  setCues,
  selectedVoice,
  setSelectedVoice,
  hasCachedVersion,
  useCachedVersion,
  setUseCachedVersion,
  canGenerate,
  onGenerate,
}: {
  isDark: boolean;
  insets: { top: number; bottom: number };
  movement: string;
  setMovement: (v: string) => void;
  cues: string;
  setCues: (v: string) => void;
  selectedVoice: VoiceOption;
  setSelectedVoice: (v: VoiceOption) => void;
  hasCachedVersion: boolean;
  useCachedVersion: boolean;
  setUseCachedVersion: (v: boolean) => void;
  canGenerate: boolean;
  onGenerate: () => void;
}) {
  const buttonPressed = useSharedValue(0);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(interpolate(buttonPressed.value, [0, 1], [1, 0.95]), { damping: 15, stiffness: 150 }) }],
  }));

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={22}
            color={isDark ? '#FFF' : '#000'}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#000' }]}>
          Visualization
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info Card */}
        <ReAnimated.View entering={FadeInDown.delay(0).duration(500).springify().damping(16)}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                borderColor: `${ACCENT_COLOR}33`,
                boxShadow: isDark
                  ? `0 8px 24px ${ACCENT_COLOR}25`
                  : `0 1px 3px rgba(0,0,0,0.08), 0 8px 24px ${ACCENT_COLOR}30`,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <LinearGradient
                colors={[`${ACCENT_COLOR}40`, `${ACCENT_COLOR}1A`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
              >
                <MaterialCommunityIcons name="head-snowflake-outline" size={20} color={ACCENT_COLOR} />
              </LinearGradient>
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#000' }]}>
                  Visualization
                </Text>
                <Text style={styles.cardSubtitle}>Mental rehearsal</Text>
              </View>
            </View>
            <Text style={styles.cardDescription}>
              Describe your movement and cues. A personalized guided visualization will help you mentally prepare.
            </Text>
          </View>
        </ReAnimated.View>

        {/* Movement Input */}
        <ReAnimated.View entering={FadeInDown.delay(50).duration(500).springify().damping(16)}>
          <View style={[styles.card, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
            <View style={styles.inputHeader}>
              <MaterialCommunityIcons name="dumbbell" size={16} color={ACCENT_COLOR} />
              <Text style={[styles.inputTitle, { color: isDark ? '#FFF' : '#000' }]}>
                Movement & Weight
              </Text>
            </View>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? `${ACCENT_COLOR}14` : `${ACCENT_COLOR}14`,
                  color: isDark ? '#FFF' : '#000',
                  borderColor: `${ACCENT_COLOR}26`,
                  borderWidth: 1,
                },
              ]}
              placeholder="e.g., 200kg Squat, 100kg Snatch"
              placeholderTextColor="#666"
              value={movement}
              onChangeText={setMovement}
            />
          </View>
        </ReAnimated.View>

        {/* Cues Input */}
        <ReAnimated.View entering={FadeInDown.delay(100).duration(500).springify().damping(16)}>
          <View style={[styles.card, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
            <View style={styles.inputHeader}>
              <MaterialCommunityIcons name="target" size={16} color={ACCENT_COLOR} />
              <Text style={[styles.inputTitle, { color: isDark ? '#FFF' : '#000' }]}>
                Focus Cues
              </Text>
            </View>
            <TextInput
              style={[
                styles.textInputMultiline,
                {
                  backgroundColor: `${ACCENT_COLOR}14`,
                  color: isDark ? '#FFF' : '#000',
                  borderColor: `${ACCENT_COLOR}26`,
                  borderWidth: 1,
                },
              ]}
              placeholder="Enter your personal cues and focus points..."
              placeholderTextColor="#666"
              value={cues}
              onChangeText={setCues}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ReAnimated.View>

        {/* Voice Selection */}
        <ReAnimated.View entering={FadeInDown.delay(150).duration(500).springify().damping(16)}>
          <View style={[styles.card, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
            <View style={styles.inputHeader}>
              <MaterialCommunityIcons name="waveform" size={16} color={ACCENT_COLOR} />
              <Text style={[styles.inputTitle, { color: isDark ? '#FFF' : '#000' }]}>
                Voice
              </Text>
            </View>
            <View style={styles.voiceOptions}>
              {VOICES.map((voice) => {
                const isSelected = selectedVoice.id === voice.id;
                return (
                  <Pressable
                    key={voice.id}
                    onPress={() => setSelectedVoice(voice)}
                    style={[
                      styles.voiceOption,
                      {
                        backgroundColor: isSelected ? `${ACCENT_COLOR}14` : 'transparent',
                        borderColor: isSelected ? `${ACCENT_COLOR}4D` : isDark ? '#333' : '#E5E5E5',
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={
                        isSelected
                          ? [`${ACCENT_COLOR}40`, `${ACCENT_COLOR}1A`]
                          : [isDark ? '#333' : '#F0F0F0', isDark ? '#222' : '#E8E8E8']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.voiceIconCircle}
                    >
                      <MaterialCommunityIcons
                        name="account-voice"
                        size={18}
                        color={isSelected ? ACCENT_COLOR : '#888'}
                      />
                    </LinearGradient>
                    <Text
                      style={[
                        styles.voiceName,
                        {
                          color: isSelected ? ACCENT_COLOR : isDark ? '#FFF' : '#000',
                        },
                      ]}
                    >
                      {voice.name}
                    </Text>
                    <Text style={styles.voiceDescription}>{voice.description}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ReAnimated.View>

        {/* Cached Version Toggle */}
        {hasCachedVersion && (
          <ReAnimated.View entering={FadeInDown.delay(200).duration(500).springify().damping(16)}>
            <View
              style={[
                styles.cachedToggle,
                {
                  backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                  borderColor: '#34C75933',
                },
              ]}
            >
              <LinearGradient
                colors={['#34C75940', '#34C7591A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cachedIcon}
              >
                <MaterialCommunityIcons name="download-circle" size={16} color="#34C759" />
              </LinearGradient>
              <View style={styles.cachedToggleText}>
                <Text style={[styles.cachedToggleTitle, { color: isDark ? '#FFF' : '#000' }]}>
                  Saved Version Available
                </Text>
                <Text style={styles.cachedToggleSubtitle}>
                  Play without having to wait
                </Text>
              </View>
              <Switch
                value={useCachedVersion}
                onValueChange={setUseCachedVersion}
                trackColor={{ false: isDark ? '#333' : '#E5E5E5', true: '#34C759' }}
                thumbColor="#FFF"
              />
            </View>
          </ReAnimated.View>
        )}

        {/* Generate Button */}
        <ReAnimated.View entering={FadeInDown.delay(250).duration(500).springify().damping(16)}>
          <AnimatedPressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onGenerate();
            }}
            onPressIn={() => { buttonPressed.value = 1; }}
            onPressOut={() => { buttonPressed.value = 0; }}
            disabled={!canGenerate}
            style={[styles.generateButton, { opacity: canGenerate ? 1 : 0.5 }, buttonAnimatedStyle]}
          >
            <LinearGradient
              colors={canGenerate ? [ACCENT_COLOR, `${ACCENT_COLOR}D9`] : ['#888', '#666']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.generateButtonGradient}
            >
              <MaterialCommunityIcons name="waveform" size={18} color="#FFF" />
              <Text style={styles.generateButtonText}>
                {useCachedVersion ? 'Play Saved Visualization' : 'Generate Visualization'}
              </Text>
            </LinearGradient>
          </AnimatedPressable>
        </ReAnimated.View>
      </ScrollView>
    </>
  );
}

// Generating Screen Component
function GeneratingScreen({
  isDark,
  insets,
  isGeneratingScript,
}: {
  isDark: boolean;
  insets: { top: number; bottom: number };
  isGeneratingScript: boolean;
}) {
  return (
    <View style={[styles.generatingContainer, { paddingTop: insets.top }]}>
      <View style={styles.generatingContent}>
        <LinearGradient
          colors={[`${ACCENT_COLOR}33`, `${ACCENT_COLOR}0D`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.generatingCircle}
        >
          <ActivityIndicator size="large" color={ACCENT_COLOR} />
        </LinearGradient>

        <Text style={[styles.generatingTitle, { color: isDark ? '#FFF' : '#000' }]}>
          Creating Visualization
        </Text>
        <Text style={[styles.generatingSubtitle, { color: ACCENT_COLOR }]}>
          {isGeneratingScript ? 'Generating Script...' : 'Creating Audio...'}
        </Text>

        {/* Warning Card */}
        <View
          style={[
            styles.warningCard,
            { backgroundColor: isDark ? 'rgba(255, 149, 0, 0.15)' : 'rgba(255, 149, 0, 0.1)' },
          ]}
        >
          <View style={styles.warningHeader}>
            <LinearGradient
              colors={['#FF950040', '#FF95001A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.warningIcon}
            >
              <MaterialCommunityIcons name="alert" size={14} color="#FF9500" />
            </LinearGradient>
            <Text style={[styles.warningTitle, { color: isDark ? '#FFF' : '#000' }]}>
              Please do not leave this page
            </Text>
          </View>
          <Text style={styles.warningDescription}>
            The visualization is being generated. Leaving the page may interrupt the process.
          </Text>
        </View>
      </View>
    </View>
  );
}

// Player Screen Component
function PlayerScreen({
  isDark,
  insets,
  audioUri,
  script,
  movement,
  voiceName,
  generationTiming,
  onComplete,
}: {
  isDark: boolean;
  insets: { top: number; bottom: number };
  audioUri: string;
  script: string;
  movement: string;
  voiceName: string;
  generationTiming: VisualizationGenerationTiming | null;
  onComplete: () => void;
}) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [showScript, setShowScript] = useState(false);
  const hasTrackedPlayback = useRef(false);
  const hasTrackedScriptView = useRef(false);
  const hasTrackedLatency = useRef(false);
  const hasSeenFirstAudioFrame = useRef(false);
  const audioCreateMsRef = useRef<number | null>(null);

  // Mutable ref to track the Audio.Sound instance for cleanup
  const soundRef = useRef<Audio.Sound | null>(null);
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setupAudio();
    startGlowAnimation();

    return () => {
      // Use ref to ensure we clean up the actual sound instance
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (showScript && !hasTrackedScriptView.current) {
      trackVisualizationScriptViewed(movement);
      hasTrackedScriptView.current = true;
    }
  }, [movement, showScript]);

  useEffect(() => {
    if (isPlaying) {
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [isPlaying]);

  function startGlowAnimation() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }

  async function setupAudio() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const createAudioStart = Date.now();
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      audioCreateMsRef.current = Date.now() - createAudioStart;

      // Store in both ref (for cleanup) and state (for UI)
      soundRef.current = newSound;
      setSound(newSound);
      setIsPlaying(true);
    } catch (error) {
      console.error('Audio setup error:', error);
      Alert.alert('Audio Error', 'Failed to load audio. Please try again.');
    }
  }

  function onPlaybackStatusUpdate(status: any) {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying);

      if (status.isPlaying && !hasSeenFirstAudioFrame.current) {
        hasSeenFirstAudioFrame.current = true;
        if (generationTiming && !hasTrackedLatency.current) {
          const metrics = {
            totalGenerationMs: generationTiming.totalGenerationMs,
            tokenMs: generationTiming.tokenMs,
            openRouterMs: generationTiming.openRouterMs,
            textToSpeechMs: generationTiming.textToSpeechMs,
            combinedRequestMs: generationTiming.combinedRequestMs,
            base64EncodeMs: generationTiming.base64EncodeMs,
            audioWriteMs: generationTiming.audioWriteMs,
            audioCreateMs: audioCreateMsRef.current ?? undefined,
            timeToFirstAudioMs: Date.now() - generationTiming.generationStartedAt,
          };
          console.log('Visualization end-to-end timings', metrics);
          trackVisualizationLatencyMeasured(movement, voiceName, metrics, generationTiming.source);
          hasTrackedLatency.current = true;
        }
      }

      if (status.didJustFinish) {
        setIsPlaying(false);
        if (!hasTrackedPlayback.current) {
          const playbackDuration = (status.positionMillis ?? duration) / 1000;
          trackVisualizationPlayed(movement, voiceName, playbackDuration, true);
          hasTrackedPlayback.current = true;
        }
      }
    }
  }

  async function togglePlayback() {
    if (!sound) return;

    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  }

  async function seekRelative(seconds: number) {
    if (!sound) return;
    const newPosition = Math.max(0, Math.min(duration, position + seconds * 1000));
    await sound.setPositionAsync(newPosition);
  }

  async function seekTo(value: number) {
    if (!sound) return;
    const newPosition = value * duration;
    await sound.setPositionAsync(newPosition);
  }

  function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  function cleanScript(text: string): string {
    return text.replace(/<break\s+time="[^"]*"\s*\/>/g, '\n\n');
  }

  async function handleDone() {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }
    if (!hasTrackedPlayback.current) {
      trackVisualizationPlayed(movement, voiceName, position / 1000, false);
      hasTrackedPlayback.current = true;
    }
    onComplete();
  }

  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={[styles.playerContainer, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.playerHeader}>
        <Text style={[styles.playerTitle, { color: isDark ? '#FFF' : '#000' }]} numberOfLines={1}>
          {movement}
        </Text>
      </View>

      {/* Visualization Animation */}
      <View style={styles.visualizationContainer}>
        {/* Glow rings */}
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.glowRing,
              {
                width: 200 + index * 50,
                height: 200 + index * 50,
                borderRadius: (200 + index * 50) / 2,
                borderColor: PLAYER_COLOR,
                opacity: glowAnim.interpolate({
                  inputRange: [0.4, 0.8],
                  outputRange: [0.15 - index * 0.04, 0.25 - index * 0.04],
                }),
                transform: [{ scale: scaleAnim }],
              },
            ]}
          />
        ))}

        {/* Center circle */}
        <Pressable onPress={togglePlayback}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <LinearGradient
              colors={['#66A3D9', PLAYER_COLOR, '#3366A3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.centerCircle}
            >
              <MaterialCommunityIcons
                name={isPlaying ? 'waveform' : 'play'}
                size={isPlaying ? 50 : 40}
                color="#FFF"
              />
            </LinearGradient>
          </Animated.View>
        </Pressable>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
        <Slider
          style={styles.progressSlider}
          minimumValue={0}
          maximumValue={1}
          value={progress}
          onSlidingComplete={seekTo}
          minimumTrackTintColor={PLAYER_COLOR}
          maximumTrackTintColor={isDark ? '#333' : '#E5E5E5'}
          thumbTintColor="#FFF"
        />
      </View>

      {/* Controls */}
      <View style={styles.controlsRow}>
        <Pressable onPress={() => seekRelative(-15)} style={styles.seekButton}>
          <MaterialCommunityIcons name="rewind-15" size={28} color={isDark ? '#FFF' : '#000'} />
        </Pressable>

        <Pressable onPress={togglePlayback} style={styles.playPauseButton}>
          <MaterialCommunityIcons
            name={isPlaying ? 'pause-circle' : 'play-circle'}
            size={70}
            color={PLAYER_COLOR}
          />
        </Pressable>

        <Pressable onPress={() => seekRelative(15)} style={styles.seekButton}>
          <MaterialCommunityIcons name="fast-forward-15" size={28} color={isDark ? '#FFF' : '#000'} />
        </Pressable>
      </View>

      {/* View Script Button */}
      <Pressable onPress={() => setShowScript(true)} style={styles.viewScriptButton}>
        <MaterialCommunityIcons name="file-document-outline" size={18} color={PLAYER_COLOR} />
        <Text style={[styles.viewScriptText, { color: PLAYER_COLOR }]}>View Script</Text>
      </Pressable>

      {/* Done Button */}
      <Pressable onPress={handleDone} style={styles.doneButton}>
        <LinearGradient
          colors={[PLAYER_COLOR, `${PLAYER_COLOR}D9`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.doneButtonGradient}
        >
          <MaterialCommunityIcons name="check" size={20} color="#FFF" />
          <Text style={styles.doneButtonText}>Done</Text>
        </LinearGradient>
      </Pressable>

      {/* Script Modal */}
      <Modal
        visible={showScript}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowScript(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: isDark ? '#000' : '#F5F5F5' }]}>
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: isDark ? '#141414' : '#FFFFFF',
                paddingTop: 20,
                borderBottomColor: isDark ? '#222' : '#E9E9E9',
              },
            ]}
          >
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalTitleRow}>
                <View
                  style={[
                    styles.modalIconCircle,
                    { backgroundColor: isDark ? '#1F1F1F' : '#F3F3F3' },
                  ]}
                >
                  <MaterialCommunityIcons name="file-document-outline" size={18} color={PLAYER_COLOR} />
                </View>
                <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#000' }]}>
                  Visualization Script
                </Text>
              </View>
              <Pressable
                onPress={() => setShowScript(false)}
                style={[
                  styles.modalDoneButton,
                  { backgroundColor: isDark ? '#1E1E1E' : '#F1F1F1' },
                ]}
              >
                <Text style={[styles.modalDone, { color: PLAYER_COLOR }]}>Done</Text>
              </Pressable>
            </View>
          </View>
          <ScrollView
            style={styles.scriptScrollView}
            contentContainerStyle={styles.scriptContent}
          >
            <Text style={[styles.scriptText, { color: isDark ? '#FFF' : '#000' }]}>
              {cleanScript(script)}
            </Text>
          </ScrollView>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${ACCENT_COLOR}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
    gap: 16,
  },
  card: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    borderCurve: 'continuous',
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  cardDescription: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  inputIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  textInput: {
    padding: 14,
    borderRadius: 12,
    fontSize: 15,
  },
  textInputMultiline: {
    padding: 14,
    borderRadius: 12,
    fontSize: 15,
    minHeight: 100,
  },
  voiceOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  voiceOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    gap: 2,
  },
  voiceName: {
    fontSize: 14,
    fontWeight: '600',
  },
  voiceDescription: {
    fontSize: 11,
    color: '#888',
  },
  voiceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cachedIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cachedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    borderWidth: 2,
  },
  cachedToggleText: {
    flex: 1,
    gap: 2,
  },
  cachedToggleTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  cachedToggleSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  generateButton: {
    borderRadius: 14,
    borderCurve: 'continuous',
    overflow: 'hidden',
    marginTop: 8,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },

  // Generating Screen
  generatingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generatingContent: {
    alignItems: 'center',
    padding: 32,
  },
  generatingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  generatingTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  generatingSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  warningCard: {
    marginTop: 32,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF950033',
    gap: 10,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  warningIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  warningDescription: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 40,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    borderRadius: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '500',
  },

  // Player Screen
  playerContainer: {
    flex: 1,
    padding: 20,
  },
  playerHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  playerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  visualizationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  centerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PLAYER_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  progressContainer: {
    marginBottom: 20,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 13,
    color: '#666',
    fontVariant: ['tabular-nums'],
  },
  progressSlider: {
    width: '100%',
    height: 40,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
    marginBottom: 24,
  },
  seekButton: {
    padding: 8,
  },
  playPauseButton: {
    padding: 4,
  },
  viewScriptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  viewScriptText: {
    fontSize: 15,
    fontWeight: '500',
  },
  doneButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 30,
  },
  doneButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },

  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalDoneButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  modalDone: {
    fontSize: 15,
    fontWeight: '600',
  },
  scriptScrollView: {
    flex: 1,
  },
  scriptContent: {
    padding: 20,
  },
  scriptText: {
    fontSize: 16,
    lineHeight: 26,
  },
});
