export interface User {
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
  coach_email?: string;
  oura_refresh_token?: string;
  whoop_refresh_token?: string;
  store_token?: boolean;
  created_at?: string;
}

export interface Sport {
  id?: number;
  user_id: string;
  sport: string;
}
