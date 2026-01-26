export interface CheckInScoreState {
  checkInDate: Date;
  physicalStrength: number;
  mentalStrength: number;
  recovered: number;
  confidence: number;
  sleep: number;
  energy: number;
  stress: number;
  soreness: number;
  goal: string;
  readiness: number;
  focus: number;
  excitement: number;
  bodyConnection: number;
  concerns: string;
}

export const createDefaultCheckInScore = (): CheckInScoreState => ({
  checkInDate: new Date(),
  physicalStrength: 3,
  mentalStrength: 3,
  recovered: 3,
  confidence: 3,
  sleep: 3,
  energy: 3,
  stress: 3,
  soreness: 3,
  goal: '',
  readiness: 3,
  focus: 3,
  excitement: 3,
  bodyConnection: 3,
  concerns: '',
});

export const physicalScore = (state: CheckInScoreState): number => {
  const overall = state.physicalStrength + state.recovered + state.energy + (5 - state.soreness) + state.readiness;
  return Math.round(Math.max(0, Math.min(100, (overall / 25) * 100)));
};

export const mentalScore = (state: CheckInScoreState): number => {
  const overall =
    state.mentalStrength +
    state.confidence +
    state.sleep +
    state.stress +
    state.bodyConnection +
    state.focus +
    state.excitement;
  return Math.round(Math.max(0, Math.min(100, (overall / 35) * 100)));
};

export const overallScore = (state: CheckInScoreState): number => {
  const overall =
    state.physicalStrength +
    state.recovered +
    state.energy +
    (5 - state.soreness) +
    state.readiness +
    state.mentalStrength +
    state.confidence +
    state.sleep +
    state.stress +
    state.bodyConnection +
    state.focus +
    state.excitement;
  return Math.round(Math.max(0, Math.min(100, (overall / 60) * 100)));
};

export const hasCompletedCheckIn = (state: CheckInScoreState): boolean => {
  return state.goal.trim().length > 0;
};
