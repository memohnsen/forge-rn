create table public.journal_comp_report (
    id serial not null,
    user_id text not null,
    meet character varying(255) not null,
    selected_meet_type character varying(100) not null,
    performance_rating integer not null,
    physical_preparedness_rating integer not null,
    did_well text not null,
    needs_work text not null,
    good_from_training text not null,
    cues text not null,
    focus text not null,
    snatch1 character varying(50) null,
    snatch2 character varying(50) null,
    snatch3 character varying(50) null,
    cj1 character varying(50) null,
    cj2 character varying(50) null,
    cj3 character varying(50) null,
    created_at timestamp with time zone null,
    snatch_best bigint null default '100'::bigint,
    cj_best bigint null default '140'::bigint,
    meet_date date null,
    squat1 character varying(50) null default ''::character varying,
    squat2 character varying(50) null default ''::character varying,
    squat3 character varying(50) null default ''::character varying,
    bench1 character varying(50) null default ''::character varying,
    bench2 character varying(50) null default ''::character varying,
    bench3 character varying(50) null default ''::character varying,
    deadlift1 character varying(50) null default ''::character varying,
    deadlift2 character varying(50) null default ''::character varying,
    deadlift3 character varying(50) null default ''::character varying,
    squat_best bigint null,
    bench_best bigint null,
    deadlift_best bigint null,
    bodyweight text not null,
    nutrition text not null,
    hydration text not null,
    mental_preparedness_rating integer not null,
    satisfaction integer not null default 3,
    confidence integer not null default 3,
    pressure_handling integer not null default 3,
    what_learned text not null default ''::text,
    what_proud_of text not null default ''::text,
    constraint journal_comp_report_pkey primary key (id),
    constraint fk_comp_report_user foreign KEY (user_id) references journal_users (user_id) on delete CASCADE,
    constraint journal_comp_report_performance_rating_check check (
      (
        (performance_rating >= 1)
        and (performance_rating <= 5)
      )
    ),
    constraint journal_comp_report_preparedness_rating_check check (
      (
        (physical_preparedness_rating >= 1)
        and (physical_preparedness_rating <= 5)
      )
    )
  ) TABLESPACE pg_default;


  create table public.journal_daily_checkins (
    id serial not null,
    user_id text null,
    physical_strength integer not null,
    mental_strength integer not null,
    recovered integer not null,
    confidence integer not null,
    sleep integer not null,
    energy integer not null,
    stress integer not null,
    soreness integer not null,
    goal text not null,
    selected_lift text not null,
    selected_intensity character varying(100) not null,
    physical_score integer null,
    mental_score integer null,
    overall_score integer null,
    created_at timestamp without time zone null default CURRENT_TIMESTAMP,
    check_in_date date null,
    readiness integer not null default 3,
    focus integer not null default 3,
    excitement integer not null default 3,
    body_connection integer not null default 3,
    concerns text not null default ''::text,
    constraint journal_daily_checkins_pkey primary key (id),
    constraint journal_daily_checkins_user_id_fkey foreign KEY (user_id) references journal_users (user_id) on delete CASCADE,
    constraint journal_daily_checkins_mental_strength_check check (
      (
        (mental_strength >= 1)
        and (mental_strength <= 5)
      )
    ),
    constraint journal_daily_checkins_physical_strength_check check (
      (
        (physical_strength >= 1)
        and (physical_strength <= 5)
      )
    ),
    constraint journal_daily_checkins_confidence_check check (
      (
        (confidence >= 1)
        and (confidence <= 5)
      )
    ),
    constraint journal_daily_checkins_sleep_check check (
      (
        (sleep >= 1)
        and (sleep <= 5)
      )
    ),
    constraint journal_daily_checkins_soreness_check check (
      (
        (soreness >= 1)
        and (soreness <= 5)
      )
    ),
    constraint journal_daily_checkins_stress_check check (
      (
        (stress >= 1)
        and (stress <= 5)
      )
    ),
    constraint journal_daily_checkins_recovered_check check (
      (
        (recovered >= 1)
        and (recovered <= 5)
      )
    ),
    constraint journal_daily_checkins_energy_check check (
      (
        (energy >= 1)
        and (energy <= 5)
      )
    )
  ) TABLESPACE pg_default;


  create table public.journal_objective_review (
    id serial not null,
    user_id text not null,
    athlete_vent text not null,
    coach_reframe text not null,
    created_at timestamp with time zone null default now(),
    constraint journal_objective_review_pkey primary key (id),
    constraint fk_objective_review_user foreign KEY (user_id) references journal_users (user_id) on delete CASCADE
  ) TABLESPACE pg_default;
  
  create index IF not exists idx_objective_review_user_id on public.journal_objective_review using btree (user_id) TABLESPACE pg_default;
  
  create index IF not exists idx_objective_review_created_at on public.journal_objective_review using btree (created_at desc) TABLESPACE pg_default;


  create table public.journal_session_report (
    id serial not null,
    user_id text not null,
    session_rpe integer not null,
    movement_quality integer not null,
    focus integer not null,
    misses text not null,
    cues text not null,
    created_at timestamp with time zone null default now(),
    selected_lift text null default 'Squats'::text,
    selected_intensity text null default 'Heavy'::text,
    session_date date null,
    time_of_day text not null default 'Afternoon'::text,
    feeling bigint not null default '3'::bigint,
    satisfaction integer not null default 3,
    confidence integer not null default 3,
    what_learned text not null default ''::text,
    what_would_change text not null default ''::text,
    constraint journal_session_report_pkey primary key (id),
    constraint fk_session_report_user foreign KEY (user_id) references journal_users (user_id) on delete CASCADE,
    constraint journal_session_report_focus_check check (
      (
        (focus >= 1)
        and (focus <= 5)
      )
    ),
    constraint journal_session_report_movement_quality_check check (
      (
        (movement_quality >= 1)
        and (movement_quality <= 5)
      )
    ),
    constraint journal_session_report_session_rpe_check check (
      (
        (session_rpe >= 1)
        and (session_rpe <= 5)
      )
    )
  ) TABLESPACE pg_default;


  create table public.journal_users (
    id serial not null,
    first_name character varying(100) not null,
    last_name character varying(100) not null,
    sport character varying(100) not null,
    years_of_experience integer not null,
    meets_per_year integer not null,
    goal text not null,
    biggest_struggle character varying(255) not null,
    training_days jsonb not null default '{"Monday": "4:00pm"}'::jsonb,
    next_competition text null default 'NULL'::text,
    next_competition_date text null default 'NULL'::text,
    user_id text not null default ''::text,
    coach_email text null,
    current_tracking_method text not null default ''::text,
    biggest_frustration text not null default ''::text,
    reflection_frequency text not null default ''::text,
    what_holding_back text not null default ''::text,
    created_at date null,
    oura_refresh_token text null,
    store_token boolean null default false,
    whoop_refresh_token text null,
    constraint journal_users_pkey primary key (id),
    constraint journal_users_user_id_unique unique (user_id)
  ) TABLESPACE pg_default;