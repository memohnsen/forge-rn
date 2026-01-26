export interface Users {
  id?: number;
  user_id: string;
  first_name: string;
  last_name: string;
  sport: string;
  years_of_experience: number;
  meets_per_year: number;
  goal: string;
  biggest_struggle: string;
  training_days: Record<string, string>;
  next_competition: string;
  next_competition_date: string;
  current_tracking_method: string;
  biggest_frustration: string;
  reflection_frequency: string;
  what_holding_back: string;
  coach_email?: string | null;
  oura_refresh_token?: string | null;
  whoop_refresh_token?: string | null;
  store_token?: boolean | null;
  created_at?: string | null;
}

export interface Sport {
  id?: number;
  user_id: string;
  sport: string;
}
