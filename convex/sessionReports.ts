import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

const sessionFields = {
  userId: v.string(),
  sessionDate: v.string(),
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
};

export const insert = mutation({
  args: sessionFields,
  handler: async (ctx, args) => {
    return ctx.db.insert("sessionReports", args);
  },
});

export const upsertForDate = mutation({
  args: { ...sessionFields, id: v.optional(v.id("sessionReports")) },
  handler: async (ctx, { id, ...args }) => {
    if (id) {
      const existing = await ctx.db.get(id);
      if (existing) {
        await ctx.db.patch(id, args);
        return id;
      }
    }
    return ctx.db.insert("sessionReports", args);
  },
});

export const getById = query({
  args: { id: v.id("sessionReports") },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});

export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("sessionReports")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const deleteById = mutation({
  args: { id: v.id("sessionReports") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

// Internal: used by data migration only — idempotent by legacyId
export const insertFromMigration = internalMutation({
  args: { ...sessionFields, legacyId: v.optional(v.number()) },
  handler: async (ctx, args) => {
    if (args.legacyId != null) {
      const existing = await ctx.db
        .query("sessionReports")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", args.legacyId))
        .unique();
      if (existing) return existing._id;
    }
    return ctx.db.insert("sessionReports", args);
  },
});

// Internal: used by the weekly coach email cron job
export const listWeekly = internalQuery({
  args: { userId: v.string(), since: v.string() },
  handler: async (ctx, { userId, since }) => {
    return ctx.db
      .query("sessionReports")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("sessionDate"), since))
      .collect();
  },
});
