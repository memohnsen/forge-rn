export interface CheckIn {
  id?: number;
  user_id: string;
  check_in_date: string;
  selected_lift: string;
  selected_intensity: string;
  goal: string;
  physical_strength: number;
  mental_strength: number;
  recovered: number;
  confidence: number;
  sleep: number;
  energy: number;
  stress: number;
  soreness: number;
  readiness: number;
  focus: number;
  excitement: number;
  body_connection: number;
  concerns?: string;
  physical_score: number;
  mental_score: number;
  overall_score: number;
  created_at: string;
}
