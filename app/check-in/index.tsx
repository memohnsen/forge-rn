import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { MultipleChoice } from '@/components/ui/MultipleChoice';
import { Slider } from '@/components/ui/Slider';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { useCheckIn } from '@/hooks/use-check-in';
import { createSupabaseClient } from '@/services/supabase';
import { overallScore, mentalScore, physicalScore } from '@/utils/checkInScore';

const liftOptions = ['Squat', 'Bench', 'Deadlift', 'Snatch', 'Clean & Jerk', 'Accessories'];
const intensityOptions = ['Light', 'Moderate', 'Heavy', 'Max'];

export default function CheckInScreen() {
  const { getToken, userId } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => {
    try {
      return createSupabaseClient(async () => (await getToken()) ?? null);
    } catch {
      return null;
    }
  }, [getToken]);
  const { state, setState, selectedLift, setSelectedLift, selectedIntensity, setSelectedIntensity, isComplete } = useCheckIn();
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!userId || !supabase) return;
    setLoading(true);

    const payload = {
      user_id: userId,
      check_in_date: state.checkInDate.toISOString(),
      selected_lift: selectedLift,
      selected_intensity: selectedIntensity,
      goal: state.goal,
      physical_strength: state.physicalStrength,
      mental_strength: state.mentalStrength,
      recovered: state.recovered,
      confidence: state.confidence,
      sleep: state.sleep,
      energy: state.energy,
      stress: state.stress,
      soreness: state.soreness,
      readiness: state.readiness,
      focus: state.focus,
      excitement: state.excitement,
      body_connection: state.bodyConnection,
      concerns: state.concerns,
      physical_score: physicalScore(state),
      mental_score: mentalScore(state),
      overall_score: overallScore(state),
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('journal_daily_checkins').insert(payload);
    setLoading(false);

    if (error) {
      Alert.alert('Check-In Failed', error.message);
      return;
    }

    router.push({ pathname: '/check-in/confirmation', params: { overall: overallScore(state).toString() } });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <DatePicker title="Session date:" value={state.checkInDate} onChange={(date) => setState({ ...state, checkInDate: date })} />
        </Card>
        <Card>
          <MultipleChoice title="What's the main movement for the session?" options={liftOptions} selected={selectedLift} onSelect={setSelectedLift} />
        </Card>
        <Card>
          <MultipleChoice title="What's the intensity for the session?" options={intensityOptions} selected={selectedIntensity} onSelect={setSelectedIntensity} />
        </Card>
        <Card>
          <TextField
            title="What would make today feel like a successful session for you?"
            value={state.goal}
            onChange={(goal) => setState({ ...state, goal })}
          />
        </Card>
        <Card>
          <Slider title="How strong does your body feel?" value={state.physicalStrength} min={1} max={5} minLabel="Weak" maxLabel="Strong" onChange={(value) => setState({ ...state, physicalStrength: value })} />
        </Card>
        <Card>
          <Slider title="How recovered do you feel?" value={state.recovered} min={1} max={5} minLabel="Not At All" maxLabel="Very" onChange={(value) => setState({ ...state, recovered: value })} />
        </Card>
        <Card>
          <Slider title="How energized do you feel?" value={state.energy} min={1} max={5} minLabel="Low" maxLabel="High" onChange={(value) => setState({ ...state, energy: value })} />
        </Card>
        <Card>
          <Slider title="How sore does your body feel?" value={state.soreness} min={1} max={5} minLabel="None" maxLabel="Extreme" inverseColorRating onChange={(value) => setState({ ...state, soreness: value })} />
        </Card>
        <Card>
          <Slider title="How connected do you feel to your body?" value={state.bodyConnection} min={1} max={5} minLabel="Disconnected" maxLabel="Very Connected" onChange={(value) => setState({ ...state, bodyConnection: value })} />
        </Card>
        <Card>
          <Slider title="How strong does your mind feel?" value={state.mentalStrength} min={1} max={5} minLabel="Weak" maxLabel="Strong" onChange={(value) => setState({ ...state, mentalStrength: value })} />
        </Card>
        <Card>
          <Slider title="How confident do you feel?" value={state.confidence} min={1} max={5} minLabel="Not At All" maxLabel="Very" onChange={(value) => setState({ ...state, confidence: value })} />
        </Card>
        <Card>
          <Slider title="How focused do you feel?" value={state.focus} min={1} max={5} minLabel="Distracted" maxLabel="Very Focused" onChange={(value) => setState({ ...state, focus: value })} />
        </Card>
        <Card>
          <Slider title="How stressed do you feel?" value={state.stress} min={1} max={5} minLabel="Extreme" maxLabel="Relaxed" onChange={(value) => setState({ ...state, stress: value })} />
        </Card>
        <Card>
          <Slider title="How ready do you feel to train?" value={state.readiness} min={1} max={5} minLabel="Not Ready" maxLabel="Very Ready" onChange={(value) => setState({ ...state, readiness: value })} />
        </Card>
        <Card>
          <Slider title="How excited do you feel about today's session?" value={state.excitement} min={1} max={5} minLabel="Not Excited" maxLabel="Very Excited" onChange={(value) => setState({ ...state, excitement: value })} />
        </Card>
        <Card>
          <Slider title="Rate last night's sleep quality" value={state.sleep} min={1} max={5} minLabel="Poor" maxLabel="Great" onChange={(value) => setState({ ...state, sleep: value })} />
        </Card>
        <Card>
          <TextField
            title="What concerns or worries do you have going into today's session?"
            value={state.concerns}
            onChange={(concerns) => setState({ ...state, concerns })}
          />
        </Card>
        <Button
          label="Submit Check-In"
          icon={<Ionicons name="checkmark-circle" size={18} color="white" />}
          onPress={submit}
          loading={loading}
          disabled={!isComplete}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingVertical: 12,
  },
});
