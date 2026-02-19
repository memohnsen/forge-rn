import { Id } from '@/convex/_generated/dataModel';

export interface User {
  _id: Id<'users'>;
  _creationTime: number;
  userId: string;
  firstName: string;
  lastName: string;
  sport: string;
  yearsOfExperience: number;
  meetsPerYear: number;
  goal: string;
  biggestStruggle: string;
  trainingDays: Record<string, string>;
  nextCompetition?: string;
  nextCompetitionDate?: string;
  currentTrackingMethod?: string;
  biggestFrustration?: string;
  reflectionFrequency?: string;
  whatHoldingBack?: string;
  coachEmail?: string | null;
  ouraRefreshToken?: string | null;
  whoopRefreshToken?: string | null;
  storeToken?: boolean;
  legacyId?: number;
}
