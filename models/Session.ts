export interface SessionReport {
  id?: number;
  user_id: string;
  session_date: string;
  time_of_day: string;
  session_rpe: number;
  movement_quality: number;
  focus: number;
  misses: string;
  cues: string;
  feeling: number;
  satisfaction: number;
  confidence: number;
  what_learned?: string;
  what_would_change?: string;
  selected_lift: string;
  selected_intensity: string;
  created_at: string;
}
