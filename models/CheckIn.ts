import { Id } from '@/convex/_generated/dataModel';

export interface CheckIn {
  _id: Id<'dailyCheckIns'>;
  _creationTime: number;
  userId: string;
  checkInDate: string;
  selectedLift: string;
  selectedIntensity: string;
  goal: string;
  physicalStrength: number;
  mentalStrength: number;
  recovered: number;
  confidence: number;
  sleep: number;
  energy: number;
  stress: number;
  soreness: number;
  readiness: number;
  focus: number;
  excitement: number;
  bodyConnection: number;
  concerns?: string;
  physicalScore: number;
  mentalScore: number;
  overallScore: number;
  legacyId?: number;
}
