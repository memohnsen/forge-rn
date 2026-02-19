import { expect, test, describe } from "vitest";
import {
  transformUserRow,
  transformCheckInRow,
  transformSessionRow,
  transformCompRow,
  transformObjectiveReviewRow,
} from "../actions/migrationImport";

// ---------------------------------------------------------------------------
// transformUserRow
// ---------------------------------------------------------------------------
describe("transformUserRow", () => {
  const baseRow = {
    id: 42,
    user_id: "user_abc",
    first_name: "Jane",
    last_name: "Smith",
    sport: "Olympic Weightlifting",
    years_of_experience: 5,
    meets_per_year: 4,
    goal: "Make nationals",
    biggest_struggle: "Consistency",
    training_days: { Monday: "6:00 AM", Wednesday: "6:00 AM" },
    next_competition: "Nationals",
    next_competition_date: "2025-06-15",
    current_tracking_method: "Paper",
    biggest_frustration: "Missing lifts",
    reflection_frequency: "Weekly",
    what_holding_back: "Mindset",
    coach_email: "coach@example.com",
    oura_refresh_token: null,
    whoop_refresh_token: null,
    store_token: false,
  };

  test("renames snake_case fields to camelCase", () => {
    const result = transformUserRow(baseRow);
    expect(result.userId).toBe("user_abc");
    expect(result.firstName).toBe("Jane");
    expect(result.lastName).toBe("Smith");
    expect(result.yearsOfExperience).toBe(5);
    expect(result.meetsPerYear).toBe(4);
    expect(result.biggestStruggle).toBe("Consistency");
    expect(result.coachEmail).toBe("coach@example.com");
    expect(result.legacyId).toBe(42);
  });

  test("preserves trainingDays as object", () => {
    const result = transformUserRow(baseRow);
    expect(result.trainingDays).toEqual({ Monday: "6:00 AM", Wednesday: "6:00 AM" });
  });

  test("parses trainingDays from JSON string", () => {
    const result = transformUserRow({
      ...baseRow,
      training_days: '{"Tuesday":"7:00 AM"}',
    });
    expect(result.trainingDays).toEqual({ Tuesday: "7:00 AM" });
  });

  test("converts null tokens to undefined", () => {
    const result = transformUserRow(baseRow);
    expect(result.ouraRefreshToken).toBeUndefined();
    expect(result.whoopRefreshToken).toBeUndefined();
  });

  test("strips 'NULL' sentinel string from optional text fields", () => {
    const result = transformUserRow({
      ...baseRow,
      next_competition: "NULL",
      next_competition_date: "NULL",
    });
    expect(result.nextCompetition).toBeUndefined();
    expect(result.nextCompetitionDate).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// transformCheckInRow
// ---------------------------------------------------------------------------
describe("transformCheckInRow", () => {
  const baseRow = {
    id: 10,
    user_id: "user_abc",
    check_in_date: "2025-01-15",
    selected_lift: "Squats",
    selected_intensity: "Heavy",
    goal: "Hit a PR",
    physical_strength: 4,
    recovered: 5,
    energy: 4,
    soreness: 2,
    body_connection: 4,
    mental_strength: 4,
    confidence: 4,
    focus: 5,
    stress: 2,
    readiness: 4,
    excitement: 5,
    sleep: 4,
    concerns: "",
    physical_score: 80,
    mental_score: 85,
    overall_score: 82,
    created_at: "2025-01-15T10:00:00Z",
  };

  test("renames snake_case fields to camelCase", () => {
    const result = transformCheckInRow(baseRow);
    expect(result.userId).toBe("user_abc");
    expect(result.checkInDate).toBe("2025-01-15");
    expect(result.selectedLift).toBe("Squats");
    expect(result.physicalStrength).toBe(4);
    expect(result.bodyConnection).toBe(4);
    expect(result.mentalStrength).toBe(4);
    expect(result.overallScore).toBe(82);
    expect(result.legacyId).toBe(10);
  });

  test("normalizes date to YYYY-MM-DD (strips time component)", () => {
    const result = transformCheckInRow({
      ...baseRow,
      check_in_date: "2025-01-15T00:00:00+00:00",
    });
    expect(result.checkInDate).toBe("2025-01-15");
  });

  test("falls back to created_at date if check_in_date is null", () => {
    const result = transformCheckInRow({
      ...baseRow,
      check_in_date: null,
      created_at: "2025-02-20T10:00:00Z",
    });
    expect(result.checkInDate).toBe("2025-02-20");
  });
});

// ---------------------------------------------------------------------------
// transformSessionRow
// ---------------------------------------------------------------------------
describe("transformSessionRow", () => {
  const baseRow = {
    id: 5,
    user_id: "user_abc",
    session_date: "2025-01-20",
    time_of_day: "Evening",
    selected_lift: "Snatch",
    selected_intensity: "Medium",
    session_rpe: 7,
    movement_quality: 4,
    focus: 4,
    misses: "Third snatch",
    cues: "Stay over the bar",
    feeling: 4,
    satisfaction: 4,
    confidence: 3,
    what_learned: "Need more patience",
    what_would_change: "Less volume",
    created_at: "2025-01-20T18:00:00Z",
  };

  test("renames snake_case fields to camelCase", () => {
    const result = transformSessionRow(baseRow);
    expect(result.userId).toBe("user_abc");
    expect(result.sessionDate).toBe("2025-01-20");
    expect(result.timeOfDay).toBe("Evening");
    expect(result.selectedLift).toBe("Snatch");
    expect(result.sessionRpe).toBe(7);
    expect(result.movementQuality).toBe(4);
    expect(result.whatLearned).toBe("Need more patience");
    expect(result.whatWouldChange).toBe("Less volume");
    expect(result.legacyId).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// transformCompRow
// ---------------------------------------------------------------------------
describe("transformCompRow", () => {
  const baseRow = {
    id: 3,
    user_id: "user_abc",
    meet: "State Championships",
    selected_meet_type: "Weightlifting",
    meet_date: "2025-03-15",
    performance_rating: 4,
    physical_preparedness_rating: 4,
    mental_preparedness_rating: 3,
    satisfaction: 4,
    confidence: 4,
    pressure_handling: 3,
    bodyweight: "75kg",
    nutrition: "Good",
    hydration: "Good",
    did_well: "Snatches",
    needs_work: "Clean and jerk",
    good_from_training: "Warm-up",
    cues: "Stay over the bar",
    focus: "Present",
    what_learned: "Trust the process",
    what_proud_of: "Hitting all snatches",
    snatch1: "90",
    snatch2: "94",
    snatch3: "",
    snatch_best: 94,
    cj1: "115",
    cj2: "120",
    cj3: "124",
    cj_best: 124,
    squat1: "",
    squat2: "",
    squat3: "",
    squat_best: null,
    bench1: "",
    bench2: "",
    bench3: "",
    bench_best: null,
    deadlift1: "",
    deadlift2: "",
    deadlift3: "",
    deadlift_best: null,
    created_at: "2025-03-15T10:00:00Z",
  };

  test("renames snake_case fields to camelCase", () => {
    const result = transformCompRow(baseRow);
    expect(result.userId).toBe("user_abc");
    expect(result.meet).toBe("State Championships");
    expect(result.meetDate).toBe("2025-03-15");
    expect(result.performanceRating).toBe(4);
    expect(result.physicalPreparednessRating).toBe(4);
    expect(result.mentalPreparednessRating).toBe(3);
    expect(result.pressureHandling).toBe(3);
    expect(result.snatchBest).toBe(94);
    expect(result.cjBest).toBe(124);
    expect(result.legacyId).toBe(3);
  });

  test("merges snatch attempt columns into array, strips empty strings", () => {
    const result = transformCompRow(baseRow);
    expect(result.snatchAttempts).toHaveLength(2);
    expect(result.snatchAttempts![0]).toEqual({ weight: "90" });
    expect(result.snatchAttempts![1]).toEqual({ weight: "94" });
  });

  test("merges cj attempt columns into array", () => {
    const result = transformCompRow(baseRow);
    expect(result.cjAttempts).toHaveLength(3);
    expect(result.cjAttempts![2]).toEqual({ weight: "124" });
  });

  test("all-empty powerlifting attempts produce undefined arrays", () => {
    const result = transformCompRow(baseRow);
    expect(result.squatAttempts).toBeUndefined();
    expect(result.benchAttempts).toBeUndefined();
    expect(result.deadliftAttempts).toBeUndefined();
    expect(result.squatBest).toBeUndefined();
    expect(result.benchBest).toBeUndefined();
    expect(result.deadliftBest).toBeUndefined();
  });

  test("powerlifting attempts produce arrays when present", () => {
    const result = transformCompRow({
      ...baseRow,
      squat1: "200",
      squat2: "210",
      squat3: "",
      squat_best: 210,
    });
    expect(result.squatAttempts).toHaveLength(2);
    expect(result.squatAttempts![0]).toEqual({ weight: "200" });
    expect(result.squatBest).toBe(210);
  });

  test("null best values become undefined", () => {
    const result = transformCompRow({ ...baseRow, snatch_best: null, cj_best: null });
    expect(result.snatchBest).toBeUndefined();
    expect(result.cjBest).toBeUndefined();
  });

  test("falls back to created_at if meet_date is null", () => {
    const result = transformCompRow({
      ...baseRow,
      meet_date: null,
      created_at: "2025-04-01T09:00:00Z",
    });
    expect(result.meetDate).toBe("2025-04-01");
  });
});

// ---------------------------------------------------------------------------
// transformObjectiveReviewRow
// ---------------------------------------------------------------------------
describe("transformObjectiveReviewRow", () => {
  test("renames snake_case fields to camelCase", () => {
    const result = transformObjectiveReviewRow({
      id: 7,
      user_id: "user_abc",
      athlete_vent: "I keep missing my lifts",
      coach_reframe: "Each miss is data",
    });
    expect(result.userId).toBe("user_abc");
    expect(result.athleteVent).toBe("I keep missing my lifts");
    expect(result.coachReframe).toBe("Each miss is data");
    expect(result.legacyId).toBe(7);
  });
});
