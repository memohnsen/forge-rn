import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';

export default function ObjectiveReviewScreen() {
  const [athleteVent, setAthleteVent] = useState('');
  const [coachReframe, setCoachReframe] = useState('');
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.container}>
        <Card>
          <TextField title="Athlete vent" value={athleteVent} onChange={setAthleteVent} />
        </Card>
        <Card>
          <TextField title="Coach reframe" value={coachReframe} onChange={setCoachReframe} />
        </Card>
        <Button label="Save Review" onPress={() => null} />
        <Button label="View History" onPress={() => router.push('/exercises/objective-review/history')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    gap: 8,
  },
});
