import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { MultipleChoice } from '@/components/ui/MultipleChoice';
import { Slider } from '@/components/ui/Slider';
import { Button } from '@/components/ui/Button';

const meetTypes = ['Local', 'National', 'International'];

export default function CompetitionScreen() {
  const [meetName, setMeetName] = useState('');
  const [meetType, setMeetType] = useState('Local');
  const [nutrition, setNutrition] = useState('');
  const [didWell, setDidWell] = useState('');
  const [needsWork, setNeedsWork] = useState('');
  const [confidence, setConfidence] = useState(3);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <TextField title="Meet name" value={meetName} onChange={setMeetName} multiline={false} />
        </Card>
        <Card>
          <MultipleChoice title="Meet type" options={meetTypes} selected={meetType} onSelect={setMeetType} />
        </Card>
        <Card>
          <Slider title="Confidence" value={confidence} min={1} max={5} minLabel="Low" maxLabel="High" onChange={setConfidence} />
        </Card>
        <Card>
          <TextField title="Nutrition and hydration" value={nutrition} onChange={setNutrition} />
        </Card>
        <Card>
          <TextField title="What did you do well?" value={didWell} onChange={setDidWell} />
        </Card>
        <Card>
          <TextField title="What needs work?" value={needsWork} onChange={setNeedsWork} />
        </Card>
        <Button label="Submit Analysis" icon={<Ionicons name="checkmark-circle" size={18} color="white" />} onPress={() => null} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingVertical: 12,
  },
});
