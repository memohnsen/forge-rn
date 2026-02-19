import { Id } from '@/convex/_generated/dataModel';

export interface LiftAttempt {
  weight: string;
  result?: 'good' | 'no_lift' | 'pass';
}

export interface CompReport {
  _id: Id<'compReports'>;
  _creationTime: number;
  userId: string;
  meet: string;
  selectedMeetType: string;
  meetDate: string;
  bodyweight?: string;
  performanceRating: number;
  physicalPreparednessRating: number;
  mentalPreparednessRating: number;
  satisfaction: number;
  confidence: number;
  pressureHandling: number;
  nutrition?: string;
  hydration?: string;
  didWell: string;
  needsWork: string;
  goodFromTraining: string;
  cues: string;
  focus: string;
  whatLearned?: string;
  whatProudOf?: string;
  snatchAttempts?: LiftAttempt[];
  cjAttempts?: LiftAttempt[];
  snatchBest?: number;
  cjBest?: number;
  squatAttempts?: LiftAttempt[];
  benchAttempts?: LiftAttempt[];
  deadliftAttempts?: LiftAttempt[];
  squatBest?: number;
  benchBest?: number;
  deadliftBest?: number;
  legacyId?: number;
}
