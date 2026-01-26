export interface CompReport {
  id?: number;
  user_id: string;
  meet: string;
  selected_meet_type: string;
  meet_date: string;
  bodyweight: string;
  performance_rating: number;
  physical_preparedness_rating: number;
  mental_preparedness_rating: number;
  nutrition: string;
  hydration: string;
  did_well: string;
  needs_work: string;
  good_from_training: string;
  cues: string;
  focus: string;
  satisfaction: number;
  confidence: number;
  pressure_handling: number;
  what_learned: string;
  what_proud_of: string;
  created_at: string;
  // Olympic Weightlifting fields
  snatch1?: string;
  snatch2?: string;
  snatch3?: string;
  cj1?: string;
  cj2?: string;
  cj3?: string;
  snatch_best?: number;
  cj_best?: number;
  // Powerlifting fields
  squat1?: string;
  squat2?: string;
  squat3?: string;
  bench1?: string;
  bench2?: string;
  bench3?: string;
  deadlift1?: string;
  deadlift2?: string;
  deadlift3?: string;
  squat_best?: number;
  bench_best?: number;
  deadlift_best?: number;
}
