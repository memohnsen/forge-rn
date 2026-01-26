import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/hooks/use-theme';
import { useHome } from '@/hooks/use-home';
import { formatDateString } from '@/utils/dateFormatter';

export default function HistoryScreen() {
  const theme = useTheme();
  const { checkIns, fetchCheckIns } = useHome();

  useEffect(() => {
    void fetchCheckIns();
  }, [fetchCheckIns]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: theme.text }]}>History</Text>
        {checkIns.map((item) => (
          <Link key={item.id ?? item.check_in_date} href={{ pathname: '/history/[id]', params: { id: item.id ?? item.check_in_date } }} asChild>
            <Pressable>
              <Card>
                <View style={styles.row}>
                  <View>
                    <Text style={[styles.rowTitle, { color: theme.text }]}>{item.selected_lift}</Text>
                    <Text style={[styles.rowSub, { color: theme.textSecondary }]}>{formatDateString(item.check_in_date)}</Text>
                  </View>
                  <Text style={[styles.score, { color: theme.blueEnergy }]}>{item.overall_score}</Text>
                </View>
              </Card>
            </Pressable>
          </Link>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowSub: {
    fontSize: 12,
    marginTop: 4,
  },
  score: {
    fontSize: 18,
    fontWeight: '700',
  },
});
