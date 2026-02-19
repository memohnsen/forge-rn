import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const liftAttempt = v.object({
  weight: v.string(),
  result: v.optional(
    v.union(v.literal("good"), v.literal("no_lift"), v.literal("pass"))
  ),
});

export default defineSchema({
  // ---------------------------------------------------------------------------
  // users (was: journal_users)
  // ---------------------------------------------------------------------------
  users: defineTable({
    userId: v.string(), // Clerk user_id
    firstName: v.string(),
    lastName: v.string(),
    sport: v.string(),
    yearsOfExperience: v.number(),
    meetsPerYear: v.number(),
    goal: v.string(),
    biggestStruggle: v.string(),
    trainingDays: v.record(v.string(), v.string()), // { Monday: "6:00 AM", ... }
    nextCompetition: v.optional(v.string()),
    nextCompetitionDate: v.optional(v.string()), // YYYY-MM-DD
    currentTrackingMethod: v.optional(v.string()),
    biggestFrustration: v.optional(v.string()),
    reflectionFrequency: v.optional(v.string()),
    whatHoldingBack: v.optional(v.string()),
    coachEmail: v.optional(v.string()),
    ouraRefreshToken: v.optional(v.string()),
    whoopRefreshToken: v.optional(v.string()),
    storeToken: v.optional(v.boolean()),
    legacyId: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  // ---------------------------------------------------------------------------
  // dailyCheckIns (was: journal_daily_checkins)
  // ---------------------------------------------------------------------------
  dailyCheckIns: defineTable({
    userId: v.string(),
    checkInDate: v.string(), // YYYY-MM-DD
    selectedLift: v.string(),
    selectedIntensity: v.string(),
    goal: v.string(),
    // Physical metrics (1-5)
    physicalStrength: v.number(),
    recovered: v.number(),
    energy: v.number(),
    soreness: v.number(),
    bodyConnection: v.number(),
    // Mental metrics (1-5)
    mentalStrength: v.number(),
    confidence: v.number(),
    focus: v.number(),
    stress: v.number(),
    readiness: v.number(),
    excitement: v.number(),
    sleep: v.number(),
    concerns: v.optional(v.string()),
    // Computed scores
    physicalScore: v.number(),
    mentalScore: v.number(),
    overallScore: v.number(),
    // Optional legacy id for migration transition
    legacyId: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_date", ["userId", "checkInDate"])
    .index("by_legacyId", ["legacyId"]),

  // ---------------------------------------------------------------------------
  // sessionReports (was: journal_session_report)
  // ---------------------------------------------------------------------------
  sessionReports: defineTable({
    userId: v.string(),
    sessionDate: v.string(), // YYYY-MM-DD
    timeOfDay: v.string(),
    selectedLift: v.string(),
    selectedIntensity: v.string(),
    sessionRpe: v.number(),
    movementQuality: v.number(),
    focus: v.number(),
    misses: v.string(),
    cues: v.string(),
    feeling: v.number(),
    satisfaction: v.number(),
    confidence: v.number(),
    whatLearned: v.optional(v.string()),
    whatWouldChange: v.optional(v.string()),
    legacyId: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_date", ["userId", "sessionDate"])
    .index("by_legacyId", ["legacyId"]),

  // ---------------------------------------------------------------------------
  // compReports (was: journal_comp_report)
  // Lift attempts merged into arrays
  // ---------------------------------------------------------------------------
  compReports: defineTable({
    userId: v.string(),
    meet: v.string(),
    selectedMeetType: v.string(), // "Weightlifting" | "Powerlifting"
    meetDate: v.string(), // YYYY-MM-DD
    bodyweight: v.optional(v.string()),
    performanceRating: v.number(),
    physicalPreparednessRating: v.number(),
    mentalPreparednessRating: v.number(),
    satisfaction: v.number(),
    confidence: v.number(),
    pressureHandling: v.number(),
    nutrition: v.optional(v.string()),
    hydration: v.optional(v.string()),
    didWell: v.string(),
    needsWork: v.string(),
    goodFromTraining: v.string(),
    cues: v.string(),
    focus: v.string(),
    whatLearned: v.optional(v.string()),
    whatProudOf: v.optional(v.string()),
    // Weightlifting attempts
    snatchAttempts: v.optional(v.array(liftAttempt)),
    cjAttempts: v.optional(v.array(liftAttempt)),
    snatchBest: v.optional(v.number()),
    cjBest: v.optional(v.number()),
    // Powerlifting attempts
    squatAttempts: v.optional(v.array(liftAttempt)),
    benchAttempts: v.optional(v.array(liftAttempt)),
    deadliftAttempts: v.optional(v.array(liftAttempt)),
    squatBest: v.optional(v.number()),
    benchBest: v.optional(v.number()),
    deadliftBest: v.optional(v.number()),
    legacyId: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_date", ["userId", "meetDate"])
    .index("by_legacyId", ["legacyId"]),

  // ---------------------------------------------------------------------------
  // objectiveReviews (was: journal_objective_review)
  // ---------------------------------------------------------------------------
  objectiveReviews: defineTable({
    userId: v.string(),
    athleteVent: v.string(),
    coachReframe: v.string(),
    legacyId: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_legacyId", ["legacyId"]),
});
