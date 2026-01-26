import { useMemo, useState } from 'react';

import {
  createDefaultCheckInScore,
  hasCompletedCheckIn,
  mentalScore,
  overallScore,
  physicalScore,
  type CheckInScoreState,
} from '@/utils/checkInScore';

export const useCheckIn = () => {
  const [state, setState] = useState<CheckInScoreState>(createDefaultCheckInScore());
  const [selectedLift, setSelectedLift] = useState('Squat');
  const [selectedIntensity, setSelectedIntensity] = useState('Heavy');

  const scores = useMemo(
    () => ({
      physical: physicalScore(state),
      mental: mentalScore(state),
      overall: overallScore(state),
    }),
    [state]
  );

  return {
    state,
    setState,
    selectedLift,
    setSelectedLift,
    selectedIntensity,
    setSelectedIntensity,
    scores,
    isComplete: hasCompletedCheckIn(state),
  };
};
