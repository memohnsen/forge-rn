import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { MultipleChoice } from '@/components/ui/MultipleChoice';
import { Slider } from '@/components/ui/Slider';
import { Button } from '@/components/ui/Button';

const liftOptions = ['Squat', 'Bench', 'Deadlift', 'Snatch', 'Clean & Jerk'];
const intensityOptions = ['Light', 'Moderate', 'Heavy'];

export default function WorkoutScreen() {
  const [selectedLift, setSelectedLift] = useState('Squat');
  const [selectedIntensity, setSelectedIntensity] = useState('Moderate');
  const [notes, setNotes] = useState('');
  const [misses, setMisses] = useState('');
  const [cues, setCues] = useState('');
  const [sessionRpe, setSessionRpe] = useState(3);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <MultipleChoice title="Main movement" options={liftOptions} selected={selectedLift} onSelect={setSelectedLift} />
        </Card>
        <Card>
          <MultipleChoice title="Session intensity" options={intensityOptions} selected={selectedIntensity} onSelect={setSelectedIntensity} />
        </Card>
        <Card>
          <Slider title="Session RPE" value={sessionRpe} min={1} max={5} minLabel="Easy" maxLabel="Max" onChange={setSessionRpe} />
        </Card>
        <Card>
          <TextField title="Misses or sticking points" value={misses} onChange={setMisses} />
        </Card>
        <Card>
          <TextField title="Key cues" value={cues} onChange={setCues} />
        </Card>
        <Card>
          <TextField title="What did you learn today?" value={notes} onChange={setNotes} />
        </Card>
        <Button label="Submit Reflection" icon={<Ionicons name="checkmark-circle" size={18} color="white" />} onPress={() => null} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingVertical: 12,
  },
});
