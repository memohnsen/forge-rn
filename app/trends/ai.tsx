import { useTrends } from '@/hooks/use-trends';
import { queryOpenRouter } from '@/services/openrouter';
import { buildTrendsPrompt } from '@/utils/trends-ai';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TrendsAIPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getToken } = useAuth();
  const { checkIns, sessionReports, compReports } = useTrends();

  const [aiResponse, setAiResponse] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const lastPromptRef = useRef<string | null>(null);

  const hasEnoughData =
    checkIns.length >= 10 || sessionReports.length >= 10 || compReports.length >= 3;

  const aiPrompt = useMemo(() => {
    return buildTrendsPrompt({
      checkIns,
      sessionReports,
      compReports,
      ouraSleepData: [],
      whoopData: [],
    });
  }, [checkIns, sessionReports, compReports]);

  const runAiAnalysis = useCallback(async () => {
    if (!hasEnoughData || isAiLoading) return;
    if (lastPromptRef.current === aiPrompt && aiResponse) return;

    setIsAiLoading(true);
    setAiError(null);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Missing authentication token');
      }
      const response = await queryOpenRouter({ prompt: aiPrompt, token });
      lastPromptRef.current = aiPrompt;
      setAiResponse(response);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to generate AI analysis. Please try again.';
      setAiError(message);
    } finally {
      setIsAiLoading(false);
    }
  }, [aiPrompt, aiResponse, getToken, hasEnoughData, isAiLoading]);

  useEffect(() => {
    void runAiAnalysis();
  }, [runAiAnalysis]);

  const formattedLines = useMemo(() => {
    return aiResponse
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }, [aiResponse]);

  const handleRefresh = useCallback(() => {
    lastPromptRef.current = null;
    setAiResponse('');
    void runAiAnalysis();
  }, [runAiAnalysis]);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F5F5F5' }]}>
      <View style={[styles.headerRow, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={22}
            color={isDark ? '#FFFFFF' : '#000000'}
          />
        </Pressable>
        <Text style={[styles.pageTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          AI Trend Analysis
        </Text>
        {aiResponse && !isAiLoading ? (
          <Pressable onPress={handleRefresh} style={styles.refreshButton}>
            <MaterialCommunityIcons name="refresh" size={20} color="#8C64C8" />
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 32 }]}>
        {!hasEnoughData ? (
          <AIInsufficientDataView isDark={isDark} />
        ) : aiError ? (
          <View style={styles.aiError}>
            <Text style={[styles.aiErrorTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Unable to generate insights
            </Text>
            <Text style={styles.aiErrorText}>{aiError}</Text>
            <Pressable onPress={runAiAnalysis} style={styles.aiRetryButton}>
              <Text style={styles.aiRetryText}>Try Again</Text>
            </Pressable>
          </View>
        ) : isAiLoading || !aiResponse ? (
          <View style={styles.aiLoading}>
            <View style={styles.aiLoadingIcon}>
              <MaterialCommunityIcons name="star-four-points" size={28} color="#8C64C8" />
            </View>
            <ActivityIndicator size="small" color="#8C64C8" />
            <Text style={styles.aiLoadingText}>Analyzing your data...</Text>
          </View>
        ) : (
          <View style={styles.aiContent}>
            {formattedLines.map((line, index) => {
              const isBullet = line.startsWith('*');
              const text = isBullet ? line.substring(1).trim() : line;
              return (
                <View key={index} style={isBullet ? styles.bulletPoint : styles.paragraph}>
                  {isBullet && <Text style={styles.bulletDot}>•</Text>}
                  <Text style={[styles.aiText, { color: isDark ? '#CCC' : '#666' }]}>{text}</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function AIInsufficientDataView({ isDark }: { isDark: boolean }) {
  return (
    <View style={styles.aiInsufficient}>
      <View style={styles.aiInsufficientIcon}>
        <MaterialCommunityIcons name="chart-bar" size={34} color="#8C64C8" />
      </View>
      <Text style={[styles.aiInsufficientTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
        More Data Needed
      </Text>
      <Text style={styles.aiInsufficientText}>
        Complete at least 2 weeks of training to unlock personalized insights. The more data you
        provide, the more accurate the analysis.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8C64C822',
  },
  pageTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  aiContent: {
    backgroundColor: '#8C64C812',
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  paragraph: {
    marginBottom: 8,
  },
  bulletPoint: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  bulletDot: {
    fontSize: 14,
    color: '#8C64C8',
    fontWeight: '700',
  },
  aiText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8C64C822',
  },
  aiLoading: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 14,
  },
  aiLoadingIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#8C64C822',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLoadingText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  aiError: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
    gap: 12,
  },
  aiErrorTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  aiErrorText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  aiRetryButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#8C64C8',
  },
  aiRetryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  aiInsufficient: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 12,
  },
  aiInsufficientIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#8C64C822',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiInsufficientTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  aiInsufficientText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
});
