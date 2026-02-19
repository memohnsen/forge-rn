"use node";
import { internalAction } from "../_generated/server";
import { api, internal } from "../_generated/api";

// ---------------------------------------------------------------------------
// Transform functions — exported so they can be unit tested
// ---------------------------------------------------------------------------

type LiftAttempt = {
  weight: string;
  result?: "good" | "no_lift" | "pass";
};

function buildAttempts(
  a: string | null | undefined,
  b: string | null | undefined,
  c: string | null | undefined
): LiftAttempt[] {
  return [a, b, c]
    .filter((w): w is string => typeof w === "string" && w.trim() !== "")
    .map((w) => ({ weight: w.trim() }));
}

function nullToUndefined<T>(v: T | null | undefined): T | undefined {
  return v === null ? undefined : v;
}

// "NULL" string sentinel used in Supabase for optional text fields
function sanitizeText(v: string | null | undefined): string | undefined {
  if (v === null || v === undefined || v === "NULL") return undefined;
  return v;
}

export function transformUserRow(row: Record<string, unknown>) {
  const trainingDays = row.training_days
    ? typeof row.training_days === "string"
      ? JSON.parse(row.training_days)
      : (row.training_days as Record<string, string>)
    : {};

  return {
    userId: row.user_id as string,
    firstName: (row.first_name as string) || "",
    lastName: (row.last_name as string) || "",
    sport: (row.sport as string) || "",
    yearsOfExperience: Number(row.years_of_experience) || 0,
    meetsPerYear: Number(row.meets_per_year) || 0,
    goal: (row.goal as string) || "",
    biggestStruggle: (row.biggest_struggle as string) || "",
    trainingDays: trainingDays as Record<string, string>,
    nextCompetition: sanitizeText(row.next_competition as string),
    nextCompetitionDate: sanitizeText(row.next_competition_date as string),
    currentTrackingMethod: sanitizeText(row.current_tracking_method as string),
    biggestFrustration: sanitizeText(row.biggest_frustration as string),
    reflectionFrequency: sanitizeText(row.reflection_frequency as string),
    whatHoldingBack: sanitizeText(row.what_holding_back as string),
    coachEmail: nullToUndefined(row.coach_email as string | null),
    ouraRefreshToken: nullToUndefined(row.oura_refresh_token as string | null),
    whoopRefreshToken: nullToUndefined(row.whoop_refresh_token as string | null),
    storeToken: nullToUndefined(row.store_token as boolean | null),
    legacyId: Number(row.id),
  };
}

export function transformCheckInRow(row: Record<string, unknown>) {
  // check_in_date is a date — normalize to YYYY-MM-DD string
  const checkInDate = row.check_in_date
    ? String(row.check_in_date).substring(0, 10)
    : String(row.created_at ?? "").substring(0, 10);

  return {
    userId: row.user_id as string,
    checkInDate,
    selectedLift: (row.selected_lift as string) || "Squats",
    selectedIntensity: (row.selected_intensity as string) || "Heavy",
    goal: (row.goal as string) || "",
    physicalStrength: Number(row.physical_strength) || 3,
    recovered: Number(row.recovered) || 3,
    energy: Number(row.energy) || 3,
    soreness: Number(row.soreness) || 3,
    bodyConnection: Number(row.body_connection) || 3,
    mentalStrength: Number(row.mental_strength) || 3,
    confidence: Number(row.confidence) || 3,
    focus: Number(row.focus) || 3,
    stress: Number(row.stress) || 3,
    readiness: Number(row.readiness) || 3,
    excitement: Number(row.excitement) || 3,
    sleep: Number(row.sleep) || 3,
    concerns: (row.concerns as string) || undefined,
    physicalScore: Number(row.physical_score) || 0,
    mentalScore: Number(row.mental_score) || 0,
    overallScore: Number(row.overall_score) || 0,
    legacyId: Number(row.id),
  };
}

export function transformSessionRow(row: Record<string, unknown>) {
  const sessionDate = row.session_date
    ? String(row.session_date).substring(0, 10)
    : String(row.created_at ?? "").substring(0, 10);

  return {
    userId: row.user_id as string,
    sessionDate,
    timeOfDay: (row.time_of_day as string) || "Afternoon",
    selectedLift: (row.selected_lift as string) || "Squats",
    selectedIntensity: (row.selected_intensity as string) || "Heavy",
    sessionRpe: Number(row.session_rpe) || 3,
    movementQuality: Number(row.movement_quality) || 3,
    focus: Number(row.focus) || 3,
    misses: (row.misses as string) || "",
    cues: (row.cues as string) || "",
    feeling: Number(row.feeling) || 3,
    satisfaction: Number(row.satisfaction) || 3,
    confidence: Number(row.confidence) || 3,
    whatLearned: (row.what_learned as string) || undefined,
    whatWouldChange: (row.what_would_change as string) || undefined,
    legacyId: Number(row.id),
  };
}

export function transformCompRow(row: Record<string, unknown>) {
  const meetDate = row.meet_date
    ? String(row.meet_date).substring(0, 10)
    : String(row.created_at ?? "").substring(0, 10);

  const snatchAttempts = buildAttempts(
    row.snatch1 as string,
    row.snatch2 as string,
    row.snatch3 as string
  );
  const cjAttempts = buildAttempts(
    row.cj1 as string,
    row.cj2 as string,
    row.cj3 as string
  );
  const squatAttempts = buildAttempts(
    row.squat1 as string,
    row.squat2 as string,
    row.squat3 as string
  );
  const benchAttempts = buildAttempts(
    row.bench1 as string,
    row.bench2 as string,
    row.bench3 as string
  );
  const deadliftAttempts = buildAttempts(
    row.deadlift1 as string,
    row.deadlift2 as string,
    row.deadlift3 as string
  );

  return {
    userId: row.user_id as string,
    meet: (row.meet as string) || "",
    selectedMeetType: (row.selected_meet_type as string) || "Weightlifting",
    meetDate,
    bodyweight: nullToUndefined(row.bodyweight as string | null),
    performanceRating: Number(row.performance_rating) || 3,
    physicalPreparednessRating: Number(row.physical_preparedness_rating) || 3,
    mentalPreparednessRating: Number(row.mental_preparedness_rating) || 3,
    satisfaction: Number(row.satisfaction) || 3,
    confidence: Number(row.confidence) || 3,
    pressureHandling: Number(row.pressure_handling) || 3,
    nutrition: nullToUndefined(row.nutrition as string | null),
    hydration: nullToUndefined(row.hydration as string | null),
    didWell: (row.did_well as string) || "",
    needsWork: (row.needs_work as string) || "",
    goodFromTraining: (row.good_from_training as string) || "",
    cues: (row.cues as string) || "",
    focus: (row.focus as string) || "",
    whatLearned: (row.what_learned as string) || undefined,
    whatProudOf: (row.what_proud_of as string) || undefined,
    snatchAttempts: snatchAttempts.length > 0 ? snatchAttempts : undefined,
    cjAttempts: cjAttempts.length > 0 ? cjAttempts : undefined,
    snatchBest: row.snatch_best != null ? Number(row.snatch_best) : undefined,
    cjBest: row.cj_best != null ? Number(row.cj_best) : undefined,
    squatAttempts: squatAttempts.length > 0 ? squatAttempts : undefined,
    benchAttempts: benchAttempts.length > 0 ? benchAttempts : undefined,
    deadliftAttempts: deadliftAttempts.length > 0 ? deadliftAttempts : undefined,
    squatBest: row.squat_best != null ? Number(row.squat_best) : undefined,
    benchBest: row.bench_best != null ? Number(row.bench_best) : undefined,
    deadliftBest: row.deadlift_best != null ? Number(row.deadlift_best) : undefined,
    legacyId: Number(row.id),
  };
}

export function transformObjectiveReviewRow(row: Record<string, unknown>) {
  return {
    userId: row.user_id as string,
    athleteVent: (row.athlete_vent as string) || "",
    coachReframe: (row.coach_reframe as string) || "",
    legacyId: Number(row.id),
  };
}

// ---------------------------------------------------------------------------
// Migration action — runs once to import all Supabase data into Convex
// ---------------------------------------------------------------------------

export const importFromSupabase = internalAction({
  args: {},
  handler: async (ctx) => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
      );
    }

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    };

    async function fetchAll(table: string) {
      // Supabase REST API — fetch all rows with pagination
      const rows: Record<string, unknown>[] = [];
      let offset = 0;
      const limit = 1000;
      while (true) {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/${table}?select=*&limit=${limit}&offset=${offset}`,
          { headers }
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to fetch ${table}: ${text}`);
        }
        const batch: Record<string, unknown>[] = await res.json();
        rows.push(...batch);
        if (batch.length < limit) break;
        offset += limit;
      }
      return rows;
    }

    const results = {
      users: { success: 0, failed: 0 },
      dailyCheckIns: { success: 0, failed: 0 },
      sessionReports: { success: 0, failed: 0 },
      compReports: { success: 0, failed: 0 },
      objectiveReviews: { success: 0, failed: 0 },
    };

    // --- Users ---
    console.log("Importing journal_users...");
    const users = await fetchAll("journal_users");
    for (const row of users) {
      try {
        const data = transformUserRow(row);
        await ctx.runMutation(api.users.upsert, data);
        results.users.success++;
      } catch (e) {
        console.error(`Failed to import user id=${row.id}:`, e);
        results.users.failed++;
      }
    }

    // --- Daily Check-ins ---
    console.log("Importing journal_daily_checkins...");
    const checkIns = await fetchAll("journal_daily_checkins");
    for (const row of checkIns) {
      try {
        const data = transformCheckInRow(row);
        await ctx.runMutation(internal.dailyCheckIns.insertFromMigration, data);
        results.dailyCheckIns.success++;
      } catch (e) {
        console.error(`Failed to import check-in id=${row.id}:`, e);
        results.dailyCheckIns.failed++;
      }
    }

    // --- Session Reports ---
    console.log("Importing journal_session_report...");
    const sessions = await fetchAll("journal_session_report");
    for (const row of sessions) {
      try {
        const data = transformSessionRow(row);
        await ctx.runMutation(internal.sessionReports.insertFromMigration, data);
        results.sessionReports.success++;
      } catch (e) {
        console.error(`Failed to import session id=${row.id}:`, e);
        results.sessionReports.failed++;
      }
    }

    // --- Competition Reports ---
    console.log("Importing journal_comp_report...");
    const comps = await fetchAll("journal_comp_report");
    for (const row of comps) {
      try {
        const data = transformCompRow(row);
        await ctx.runMutation(internal.compReports.insertFromMigration, data);
        results.compReports.success++;
      } catch (e) {
        console.error(`Failed to import comp id=${row.id}:`, e);
        results.compReports.failed++;
      }
    }

    // --- Objective Reviews ---
    console.log("Importing journal_objective_review...");
    const reviews = await fetchAll("journal_objective_review");
    for (const row of reviews) {
      try {
        const data = transformObjectiveReviewRow(row);
        await ctx.runMutation(internal.objectiveReviews.insertFromMigration, data);
        results.objectiveReviews.success++;
      } catch (e) {
        console.error(`Failed to import review id=${row.id}:`, e);
        results.objectiveReviews.failed++;
      }
    }

    console.log("Migration complete:", JSON.stringify(results, null, 2));
    return results;
  },
});
