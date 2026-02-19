import { Id } from '@/convex/_generated/dataModel';

export interface SessionReport {
  _id: Id<'sessionReports'>;
  _creationTime: number;
  userId: string;
  sessionDate: string;
  timeOfDay: string;
  selectedLift: string;
  selectedIntensity: string;
  sessionRpe: number;
  movementQuality: number;
  focus: number;
  misses: string;
  cues: string;
  feeling: number;
  satisfaction: number;
  confidence: number;
  whatLearned?: string;
  whatWouldChange?: string;
  legacyId?: number;
}
