import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

const liftAttempt = v.object({
  weight: v.string(),
  result: v.optional(
    v.union(v.literal("good"), v.literal("no_lift"), v.literal("pass"))
  ),
});

const compFields = {
  userId: v.string(),
  meet: v.string(),
  selectedMeetType: v.string(),
  meetDate: v.string(),
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
  snatchAttempts: v.optional(v.array(liftAttempt)),
  cjAttempts: v.optional(v.array(liftAttempt)),
  snatchBest: v.optional(v.number()),
  cjBest: v.optional(v.number()),
  squatAttempts: v.optional(v.array(liftAttempt)),
  benchAttempts: v.optional(v.array(liftAttempt)),
  deadliftAttempts: v.optional(v.array(liftAttempt)),
  squatBest: v.optional(v.number()),
  benchBest: v.optional(v.number()),
  deadliftBest: v.optional(v.number()),
};

export const insert = mutation({
  args: compFields,
  handler: async (ctx, args) => {
    return ctx.db.insert("compReports", args);
  },
});

export const upsert = mutation({
  args: { ...compFields, id: v.optional(v.id("compReports")) },
  handler: async (ctx, { id, ...args }) => {
    if (id) {
      const existing = await ctx.db.get(id);
      if (existing) {
        await ctx.db.patch(id, args);
        return id;
      }
    }
    return ctx.db.insert("compReports", args);
  },
});

export const getById = query({
  args: { id: v.id("compReports") },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});

export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("compReports")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const deleteById = mutation({
  args: { id: v.id("compReports") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

// Internal: used by data migration only — idempotent by legacyId
export const insertFromMigration = internalMutation({
  args: { ...compFields, legacyId: v.optional(v.number()) },
  handler: async (ctx, args) => {
    if (args.legacyId != null) {
      const existing = await ctx.db
        .query("compReports")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", args.legacyId))
        .unique();
      if (existing) return existing._id;
    }
    return ctx.db.insert("compReports", args);
  },
});

// Internal: used by the weekly coach email cron job
export const listWeekly = internalQuery({
  args: { userId: v.string(), since: v.string() },
  handler: async (ctx, { userId, since }) => {
    return ctx.db
      .query("compReports")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("meetDate"), since))
      .collect();
  },
});
